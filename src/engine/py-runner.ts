import type { HarnessReport, RunnerResult } from "./harness-types";
import { LOAD_TIMEOUT_MS, RUN_TIMEOUT_MS } from "./pyodide-config";
import type { LoadStage, MainToWorker, RunPhase, WorkerToMain } from "./worker-protocol";

export type RunnerStatus = "idle" | "loading" | "ready" | "running" | "failed" | "restarting";
export type FailReason = "offline" | "cdn" | "timeout" | "unsupported";

export interface RunnerStatusDetail {
  stage?: LoadStage;
  reason?: FailReason;
  message?: string;
  pythonVersion?: string;
}

/** Minimal surface of a Worker so tests can inject a fake. */
export interface WorkerLike {
  postMessage(msg: MainToWorker): void;
  terminate(): void;
  onmessage: ((ev: MessageEvent<WorkerToMain>) => void) | null;
  onerror: ((ev: ErrorEvent | Event) => void) | null;
}

export interface PyRunnerOptions {
  workerFactory?: () => WorkerLike;
  loadTimeoutMs?: number;
  runTimeoutMs?: number;
  isOnline?: () => boolean;
}

type Listener = (status: RunnerStatus, detail: RunnerStatusDetail) => void;

interface PendingRun {
  runId: number;
  timer: ReturnType<typeof setTimeout>;
  resolve: (r: RunnerResult) => void;
}

const defaultWorkerFactory = (): WorkerLike =>
  new Worker(new URL("./py-worker.ts", import.meta.url), { type: "module" }) as unknown as WorkerLike;

/**
 * Owns the Pyodide worker: loading, running, and killing + rebuilding it when a run
 * hangs. Never lets two runs overlap: a second `run` while one is in flight returns
 * the same promise.
 */
export class PyRunner {
  private worker: WorkerLike | null = null;
  private status: RunnerStatus = "idle";
  private detail: RunnerStatusDetail = {};
  private listeners = new Set<Listener>();
  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: PendingRun | null = null;
  private current: Promise<RunnerResult> | null = null;
  private runSeq = 0;
  private disposed = false;
  private readonly workerFactory: () => WorkerLike;
  private readonly loadTimeoutMs: number;
  private readonly runTimeoutMs: number;
  private readonly isOnline: () => boolean;

  constructor(opts: PyRunnerOptions = {}) {
    this.workerFactory = opts.workerFactory ?? defaultWorkerFactory;
    this.loadTimeoutMs = opts.loadTimeoutMs ?? LOAD_TIMEOUT_MS;
    this.runTimeoutMs = opts.runTimeoutMs ?? RUN_TIMEOUT_MS;
    this.isOnline = opts.isOnline ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  }

  getStatus(): RunnerStatus {
    return this.status;
  }

  getDetail(): RunnerStatusDetail {
    return this.detail;
  }

  onStatus(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: RunnerStatus, detail: RunnerStatusDetail = {}) {
    this.status = status;
    this.detail = detail;
    for (const l of this.listeners) l(status, detail);
  }

  /** Start (or restart) the worker. Resolves when ready or failed. */
  init(restarting = false): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.killWorker();
    this.setStatus(restarting ? "restarting" : "loading", {});
    let worker: WorkerLike;
    try {
      worker = this.workerFactory();
    } catch (err) {
      this.setStatus("failed", { reason: "unsupported", message: String(err) });
      return Promise.resolve();
    }
    this.worker = worker;
    return new Promise<void>((resolve) => {
      const fail = (reason: FailReason, message: string) => {
        if (this.worker !== worker) return resolve();
        this.killWorker();
        this.setStatus("failed", { reason, message });
        resolve();
      };
      this.loadTimer = setTimeout(() => fail(this.isOnline() ? "timeout" : "offline", "Hết thời gian tải"), this.loadTimeoutMs);
      worker.onmessage = (ev) => {
        if (this.worker !== worker) return;
        const msg = ev.data;
        switch (msg.kind) {
          case "progress":
            if (this.status === "loading" || this.status === "restarting") this.setStatus(this.status, { stage: msg.stage });
            break;
          case "ready":
            this.clearLoadTimer();
            this.setStatus("ready", { pythonVersion: msg.pythonVersion });
            resolve();
            break;
          case "init_error":
            fail(this.isOnline() ? "cdn" : "offline", msg.message);
            break;
          case "result":
          case "run_error":
            this.handleRunMessage(msg);
            break;
        }
      };
      worker.onerror = (ev) => {
        if (this.worker !== worker) return;
        const message = (ev as ErrorEvent).message || "Worker lỗi";
        if (this.pending) {
          void this.init(true);
          this.finishRun({ kind: "engine_error", message });
        } else if (this.status !== "ready") {
          fail(this.isOnline() ? "cdn" : "offline", message);
        } else {
          void this.init(true);
        }
      };
      worker.postMessage({ kind: "init" });
    });
  }

  retry(): Promise<void> {
    return this.init(false);
  }

  /**
   * Grade `source`: the base tests and the counter-attack run as two phases, each
   * under its own wall-clock limit, so a hang that only happens on the
   * counter-attack data keeps the base result (reported as `counter_aborted`).
   */
  run(configJson: string, source: string): Promise<RunnerResult> {
    if (this.current) return this.current;
    if (this.status !== "ready" || !this.worker) return Promise.resolve({ kind: "not_ready" });
    const current = this.runPhases(configJson, source).then((r) => {
      if (this.current === current) this.current = null;
      return r;
    });
    this.current = current;
    return current;
  }

  private async runPhases(configJson: string, source: string): Promise<RunnerResult> {
    const base = await this.runPhase(configJson, source, "base");
    if (base.kind !== "ok" || !base.data.counter_pending) return base;
    const counter = await this.runPhase(configJson, source, "counter");
    const data: HarnessReport = { ...base.data, counter_pending: false };
    if (counter.kind === "ok") data.counter_results = counter.data.counter_results;
    else data.counter_aborted = counter.kind === "timeout" ? "timeout" : "engine_error";
    return { kind: "ok", data };
  }

  private runPhase(configJson: string, source: string, phase: RunPhase): Promise<RunnerResult> {
    if (this.status !== "ready" || !this.worker) return Promise.resolve({ kind: "engine_error", message: "Lõi Python không sẵn sàng" });
    const runId = ++this.runSeq;
    this.setStatus("running", this.detail);
    return new Promise<RunnerResult>((resolve) => {
      const timer = setTimeout(() => {
        void this.init(true); // kills the hung worker first
        this.finishRun({ kind: "timeout" });
      }, this.runTimeoutMs);
      this.pending = { runId, timer, resolve };
      this.worker!.postMessage({ kind: "run", runId, configJson, source, phase });
    });
  }

  private handleRunMessage(msg: Extract<WorkerToMain, { kind: "result" | "run_error" }>) {
    if (!this.pending || msg.runId !== this.pending.runId) return; // stale (e.g. after a timeout)
    if (msg.kind === "run_error") {
      void this.init(true);
      this.finishRun({ kind: "engine_error", message: msg.message });
      return;
    }
    let data: HarnessReport;
    try {
      data = JSON.parse(msg.json) as HarnessReport;
    } catch {
      // A corrupted report means the Python state is suspect: rebuild the worker.
      void this.init(true);
      this.finishRun({ kind: "engine_error", message: "Kết quả không đọc được" });
      return;
    }
    this.setStatus("ready", this.detail);
    this.finishRun({ kind: "ok", data });
    const results = [...data.base_results, ...(data.counter_results ?? [])];
    // A MemoryError may leave the wasm heap fragmented: rebuild proactively.
    if (results.some((r) => r.status === "resource_limit")) void this.init(true);
  }

  private finishRun(result: RunnerResult) {
    const pending = this.pending;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending = null;
    if (this.status === "running") this.setStatus("ready", this.detail);
    pending.resolve(result);
  }

  private clearLoadTimer() {
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = null;
  }

  private killWorker() {
    this.clearLoadTimer();
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = null;
    }
  }

  dispose() {
    this.disposed = true;
    if (this.pending) this.finishRun({ kind: "engine_error", message: "disposed" });
    this.killWorker();
    this.listeners.clear();
  }
}

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { HarnessReport } from "./harness-types";
import { PyRunner, type WorkerLike } from "./py-runner";
import type { MainToWorker, WorkerToMain } from "./worker-protocol";

class FakeWorker implements WorkerLike {
  sent: MainToWorker[] = [];
  terminated = false;
  onmessage: ((ev: MessageEvent<WorkerToMain>) => void) | null = null;
  onerror: ((ev: ErrorEvent | Event) => void) | null = null;
  postMessage(msg: MainToWorker) {
    this.sent.push(msg);
  }
  terminate() {
    this.terminated = true;
  }
  emit(msg: WorkerToMain) {
    this.onmessage?.({ data: msg } as MessageEvent<WorkerToMain>);
  }
  runs() {
    return this.sent.filter((m): m is Extract<MainToWorker, { kind: "run" }> => m.kind === "run");
  }
}

const report = (status = "ok"): HarnessReport => ({
  python_version: "3.14.2",
  compile_error: null,
  base_results: [
    {
      kind: "base",
      index: 0,
      inputs: {},
      status: status as "ok",
      error: null,
      line_count: 3,
      stdout: "",
      stdout_truncated: false,
      stderr: "",
      vars: {},
      output: null,
    },
  ],
  counter_results: null,
});

let workers: FakeWorker[];
let runner: PyRunner;

function makeRunner(online = true) {
  workers = [];
  runner = new PyRunner({
    workerFactory: () => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    },
    loadTimeoutMs: 1000,
    runTimeoutMs: 500,
    isOnline: () => online,
  });
  return runner;
}

async function readyRunner() {
  const r = makeRunner();
  const p = r.init();
  workers[0].emit({ kind: "ready", pythonVersion: "3.14.2" });
  await p;
  return r;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  runner?.dispose();
  vi.useRealTimers();
});

describe("PyRunner", () => {
  test("init → loading with stages → ready", async () => {
    const r = makeRunner();
    const seen: string[] = [];
    r.onStatus((s, d) => seen.push(d.stage ? `${s}:${d.stage}` : s));
    const p = r.init();
    expect(workers[0].sent).toEqual([{ kind: "init" }]);
    workers[0].emit({ kind: "progress", stage: "download" });
    workers[0].emit({ kind: "ready", pythonVersion: "3.14.2" });
    await p;
    expect(seen).toEqual(["loading", "loading:download", "ready"]);
    expect(r.getDetail().pythonVersion).toBe("3.14.2");
  });

  test("init timeout → failed (timeout), worker terminated", async () => {
    const r = makeRunner();
    const p = r.init();
    vi.advanceTimersByTime(1001);
    await p;
    expect(r.getStatus()).toBe("failed");
    expect(r.getDetail().reason).toBe("timeout");
    expect(workers[0].terminated).toBe(true);
  });

  test("init_error offline vs cdn", async () => {
    let r = makeRunner(false);
    let p = r.init();
    workers[0].emit({ kind: "init_error", message: "Failed to fetch" });
    await p;
    expect(r.getDetail().reason).toBe("offline");
    r.dispose();
    r = makeRunner(true);
    p = r.init();
    workers[0].emit({ kind: "init_error", message: "Failed to fetch" });
    await p;
    expect(r.getDetail().reason).toBe("cdn");
  });

  test("unsupported module worker → failed (unsupported)", async () => {
    runner = new PyRunner({
      workerFactory: () => {
        throw new TypeError("Module scripts are not supported");
      },
    });
    await runner.init();
    expect(runner.getStatus()).toBe("failed");
    expect(runner.getDetail().reason).toBe("unsupported");
  });

  test("retry after failure creates a new worker and can become ready", async () => {
    const r = makeRunner();
    const p = r.init();
    workers[0].emit({ kind: "init_error", message: "x" });
    await p;
    const p2 = r.retry();
    expect(workers).toHaveLength(2);
    workers[1].emit({ kind: "ready", pythonVersion: "3.14.2" });
    await p2;
    expect(r.getStatus()).toBe("ready");
  });

  test("run while loading → not_ready, nothing sent", async () => {
    const r = makeRunner();
    void r.init();
    await expect(r.run("{}", "x")).resolves.toEqual({ kind: "not_ready" });
    expect(workers[0].runs()).toHaveLength(0);
  });

  test("successful run resolves with parsed data", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "code");
    expect(r.getStatus()).toBe("running");
    const sent = workers[0].runs()[0];
    workers[0].emit({ kind: "result", runId: sent.runId, json: JSON.stringify(report()) });
    await expect(p).resolves.toEqual({ kind: "ok", data: report() });
    expect(r.getStatus()).toBe("ready");
  });

  test("double run returns the same promise and sends one message", async () => {
    const r = await readyRunner();
    const a = r.run("{}", "code");
    const b = r.run("{}", "code");
    expect(a).toBe(b);
    expect(workers[0].runs()).toHaveLength(1);
  });

  test("run timeout → terminate, rebuild, resolve timeout; stale message ignored", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "while True: pass");
    const runId = workers[0].runs()[0].runId;
    vi.advanceTimersByTime(501);
    await expect(p).resolves.toEqual({ kind: "timeout" });
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
    expect(r.getStatus()).toBe("restarting");
    // A late message from the dead worker must not resolve anything or change state.
    workers[0].emit({ kind: "result", runId, json: JSON.stringify(report()) });
    expect(r.getStatus()).toBe("restarting");
    await expect(r.run("{}", "x")).resolves.toEqual({ kind: "not_ready" });
    workers[1].emit({ kind: "ready", pythonVersion: "3.14.2" });
    expect(r.getStatus()).toBe("ready");
  });

  test("message with an old runId on the live worker is ignored", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "a");
    const id = workers[0].runs()[0].runId;
    workers[0].emit({ kind: "result", runId: id - 1, json: "{}" });
    expect(r.getStatus()).toBe("running");
    workers[0].emit({ kind: "result", runId: id, json: JSON.stringify(report()) });
    await expect(p).resolves.toMatchObject({ kind: "ok" });
  });

  test("worker crash mid-run → engine_error and rebuild", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "a");
    workers[0].onerror?.({ message: "boom" } as ErrorEvent);
    await expect(p).resolves.toEqual({ kind: "engine_error", message: "boom" });
    expect(workers).toHaveLength(2);
    expect(r.getStatus()).toBe("restarting");
  });

  test("run_error → engine_error and rebuild", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "a");
    workers[0].emit({ kind: "run_error", runId: workers[0].runs()[0].runId, message: "PythonError" });
    await expect(p).resolves.toMatchObject({ kind: "engine_error" });
    expect(workers).toHaveLength(2);
  });

  test("unparseable result → engine_error", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "a");
    workers[0].emit({ kind: "result", runId: workers[0].runs()[0].runId, json: "{nope" });
    await expect(p).resolves.toMatchObject({ kind: "engine_error" });
    expect(workers).toHaveLength(2);
  });

  test("resource_limit result triggers a proactive rebuild", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "a");
    workers[0].emit({ kind: "result", runId: workers[0].runs()[0].runId, json: JSON.stringify(report("resource_limit")) });
    await expect(p).resolves.toMatchObject({ kind: "ok" });
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
  });

  test("base and counter-attack run as two phases with separate timers", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "code");
    const basePhase = workers[0].runs()[0];
    expect(basePhase.phase).toBe("base");
    workers[0].emit({ kind: "result", runId: basePhase.runId, json: JSON.stringify({ ...report(), counter_pending: true }) });
    await vi.advanceTimersByTimeAsync(0);
    const counterPhase = workers[0].runs()[1];
    expect(counterPhase.phase).toBe("counter");
    const counterResult = { ...report(), base_results: [], counter_results: [{ ...report().base_results[0], kind: "counter" }] };
    workers[0].emit({ kind: "result", runId: counterPhase.runId, json: JSON.stringify(counterResult) });
    const res = await p;
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(res.data.base_results).toHaveLength(1);
      expect(res.data.counter_results).toHaveLength(1);
      expect(res.data.counter_aborted).toBeUndefined();
    }
    expect(r.getStatus()).toBe("ready");
  });

  test("a hang only in the counter-attack phase keeps the base result (counter_aborted)", async () => {
    const r = await readyRunner();
    const p = r.run("{}", "code");
    workers[0].emit({ kind: "result", runId: workers[0].runs()[0].runId, json: JSON.stringify({ ...report(), counter_pending: true }) });
    await vi.advanceTimersByTimeAsync(0);
    expect(workers[0].runs()).toHaveLength(2);
    // Each phase has its own 500 ms budget: the base already used some time, the counter gets a full one.
    await vi.advanceTimersByTimeAsync(499);
    expect(workers[0].terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    const res = await p;
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(res.data.counter_aborted).toBe("timeout");
      expect(res.data.base_results[0].status).toBe("ok");
      expect(res.data.counter_results).toBeNull();
    }
    expect(workers[0].terminated).toBe(true);
    expect(r.getStatus()).toBe("restarting");
  });

  test("dispose terminates the worker", async () => {
    const r = await readyRunner();
    r.dispose();
    expect(workers[0].terminated).toBe(true);
  });
});

/// <reference lib="webworker" />
import harnessSource from "./python/harness.py?raw";
import { PYODIDE_INDEX_URL, PYODIDE_MODULE_URL } from "./pyodide-config";
import type { MainToWorker, WorkerToMain } from "./worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

interface PyodideLike {
  runPython(code: string): unknown;
  globals: { get(name: string): unknown };
}

type RunLevel = ((configJson: string, source: string, phase: string) => string) & { destroy?: () => void };

let runLevel: RunLevel | null = null;
let booting: Promise<void> | null = null;

const send = (msg: WorkerToMain) => self.postMessage(msg);
const describe = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function boot(): Promise<void> {
  send({ kind: "progress", stage: "download" });
  const mod = (await import(/* @vite-ignore */ PYODIDE_MODULE_URL)) as {
    loadPyodide(opts: { indexURL: string }): Promise<PyodideLike>;
  };
  send({ kind: "progress", stage: "boot" });
  const pyodide = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  send({ kind: "progress", stage: "harness" });
  pyodide.runPython(harnessSource);
  runLevel = pyodide.globals.get("run_level") as RunLevel;
  const version = String(pyodide.runPython("import sys; sys.version.split()[0]"));
  send({ kind: "ready", pythonVersion: version });
}

self.onmessage = (event: MessageEvent<MainToWorker>) => {
  const msg = event.data;
  if (msg.kind === "init") {
    booting ??= boot().catch((err) => {
      booting = null;
      send({ kind: "init_error", message: describe(err) });
    });
    return;
  }
  if (msg.kind === "run") {
    if (!runLevel) {
      send({ kind: "run_error", runId: msg.runId, message: "Python chưa sẵn sàng" });
      return;
    }
    try {
      const json = runLevel(msg.configJson, msg.source, msg.phase);
      send({ kind: "result", runId: msg.runId, json: String(json) });
    } catch (err) {
      send({ kind: "run_error", runId: msg.runId, message: describe(err) });
    }
  }
};

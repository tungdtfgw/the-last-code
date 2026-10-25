export type LoadStage = "download" | "boot" | "harness";
export type RunPhase = "base" | "counter";

export type MainToWorker =
  | { kind: "init" }
  | { kind: "run"; runId: number; configJson: string; source: string; phase: RunPhase };

export type WorkerToMain =
  | { kind: "progress"; stage: LoadStage }
  | { kind: "ready"; pythonVersion: string }
  | { kind: "init_error"; message: string }
  | { kind: "result"; runId: number; json: string }
  | { kind: "run_error"; runId: number; message: string };

/** Shape of the JSON produced by src/engine/python/harness.py `run_level`. */
export type HarnessStatus =
  | "ok"
  | "runtime_error"
  | "timeout"
  | "resource_limit"
  | "blocked_import"
  | "input_unsupported"
  | "system_exit";

export interface HarnessVar {
  present: boolean;
  type: string | null;
  preview: string | null;
  length: number | null;
  type_ok: boolean;
  value_ok: boolean;
  value_match_other_type: boolean;
}

export interface HarnessError {
  type: string;
  message: string;
  line: number | null;
  offset: number | null;
  traceback_lines: { line: number; text: string }[];
  /** Frames dropped from the middle of a deep traceback (recursion). */
  traceback_omitted?: number;
}

export interface HarnessTestResult {
  kind: "base" | "counter";
  index: number;
  inputs: Record<string, string>;
  status: HarnessStatus;
  error: HarnessError | null;
  line_count: number;
  stdout: string;
  stdout_truncated: boolean;
  vars: Record<string, HarnessVar>;
}

export interface HarnessCompileError {
  type: string;
  message: string;
  line: number | null;
  offset: number | null;
  text: string;
}

export interface HarnessReport {
  python_version: string;
  compile_error: HarnessCompileError | null;
  base_results: HarnessTestResult[];
  counter_results: HarnessTestResult[] | null;
  /** Phase "base" only: a counter-attack phase should follow. */
  counter_pending?: boolean;
  /** Set by the runner when the counter-attack phase hung or crashed (base result kept). */
  counter_aborted?: "timeout" | "engine_error";
}

export type RunnerResult =
  | { kind: "ok"; data: HarnessReport }
  | { kind: "timeout" }
  | { kind: "engine_error"; message: string }
  | { kind: "not_ready" };

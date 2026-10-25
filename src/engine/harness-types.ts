import type { InputValue } from "../game/level-types";

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

/** One expected stdout line, compared after normalisation (NFC, trailing spaces dropped). */
export interface HarnessOutputLine {
  line: number;
  expected: string;
  /** null: the program printed fewer lines. Clipped to the preview length. */
  actual: string | null;
  status: "ok" | "wrong" | "missing";
  /** 1-based position of the first differing character (wrong lines only). */
  col: number | null;
  /** Wrong only by letter case. */
  case_only: boolean;
}

export interface HarnessOutput {
  ok: boolean;
  truncated: boolean;
  lines: HarnessOutputLine[];
  /** First extra lines (at most 3), clipped. */
  extra_lines: string[];
  extra_count: number;
}

/**
 * One change of an objective variable (`trace_vars` on). `line`: the statement that made it.
 * `type`/`preview` null: the name was deleted. `src`: the input whose loaded object this is.
 */
export interface VarHistoryEntry {
  line: number | null;
  var: string;
  type: string | null;
  preview: string | null;
  src: string | null;
}

export interface HarnessTestResult {
  kind: "base" | "counter";
  index: number;
  inputs: Record<string, InputValue>;
  status: HarnessStatus;
  error: HarnessError | null;
  line_count: number;
  stdout: string;
  stdout_truncated: boolean;
  /** Separate buffer, never graded. */
  stderr: string;
  vars: Record<string, HarnessVar>;
  /** null when the test has no `expected_output`. */
  output: HarnessOutput | null;
  /** Only with `trace_vars`: at most `var_history_max` (40) entries, in run order. */
  var_history?: VarHistoryEntry[];
  /** More changes happened than the history kept. */
  var_history_truncated?: boolean;
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

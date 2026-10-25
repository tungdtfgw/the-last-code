import type { HarnessTestResult, RunnerResult } from "../engine/harness-types";
import { alertPercent, isCaught } from "./alert";
import { computeStars, type Stars } from "./compute-stars";
import type { LevelDefinition, ReactionKey, ValueType } from "./level-types";

export interface VarVerdict {
  name: string;
  expectedType: ValueType;
  present: boolean;
  type: string | null;
  preview: string | null;
  length: number | null;
  typeOk: boolean;
  valueOk: boolean;
  valueMatchOtherType: boolean;
}

export interface OutcomeError {
  phase: "compile" | "base" | "counter";
  type: string;
  message: string;
  line: number | null;
  tracebackLines: { line: number; text: string }[];
  tracebackOmitted?: number;
}

export interface OutcomeDetails {
  line?: number;
  vars?: string;
  error_type?: string;
  count?: number;
}

export interface RunOutcome {
  key: ReactionKey;
  stars: Stars;
  basePassed: boolean;
  baseLineCount: number | null;
  alertPercent: number | null;
  /** Above 100% alert: caught by the Sentinel, no counter-attack. */
  sentinelCaught: boolean;
  /** The failing harness status for non-graded stops (timeout, blocked_import…). */
  stopStatus?: string;
  error?: OutcomeError;
  vars: VarVerdict[];
  counterVars?: VarVerdict[];
  counterInputs?: Record<string, string>;
  counterSurvived: boolean;
  /** The counter-attack phase hung or crashed; the base result is kept. */
  counterAborted?: "timeout" | "engine_error";
  stdout: string;
  stdoutTruncated: boolean;
  details: OutcomeDetails;
}

const NAMED_ERRORS = new Set(["TypeError", "ValueError", "NameError", "ZeroDivisionError", "AttributeError"]);
const STOP_STATUSES = new Set(["timeout", "resource_limit", "blocked_import", "input_unsupported", "system_exit"]);

function verdicts(result: HarnessTestResult | undefined, level: LevelDefinition): VarVerdict[] {
  return level.objectives.map((o) => {
    const v = result?.vars[o.var];
    return {
      name: o.var,
      expectedType: o.type,
      present: v?.present ?? false,
      type: v?.type ?? null,
      preview: v?.preview ?? null,
      length: v?.length ?? null,
      typeOk: v?.type_ok ?? false,
      valueOk: v?.value_ok ?? false,
      valueMatchOtherType: v?.value_match_other_type ?? false,
    };
  });
}

const passed = (r: HarnessTestResult) =>
  r.status === "ok" && Object.values(r.vars).every((v) => v.type_ok && v.value_ok);

const names = (vs: VarVerdict[]) => vs.map((v) => v.name).join(", ");

function toError(r: HarnessTestResult, phase: "base" | "counter"): OutcomeError | undefined {
  if (!r.error) return undefined;
  return {
    phase,
    type: r.error.type,
    message: r.error.message,
    line: r.error.line,
    tracebackLines: r.error.traceback_lines,
    tracebackOmitted: r.error.traceback_omitted ?? 0,
  };
}

function empty(level: LevelDefinition, key: ReactionKey, extra: Partial<RunOutcome> = {}): RunOutcome {
  return {
    key,
    stars: 0,
    basePassed: false,
    baseLineCount: null,
    alertPercent: null,
    sentinelCaught: false,
    vars: verdicts(undefined, level),
    counterSurvived: false,
    stdout: "",
    stdoutTruncated: false,
    details: {},
    ...extra,
  };
}

/** Classify why a test failed. Returns null when the test passed. */
function failureKey(
  r: HarnessTestResult,
  vs: VarVerdict[],
): { key: ReactionKey; details: OutcomeDetails } | null {
  if (r.status !== "ok") {
    if (STOP_STATUSES.has(r.status)) {
      return { key: r.status as ReactionKey, details: { line: r.error?.line ?? undefined, error_type: r.error?.type } };
    }
    const type = r.error?.type ?? "Error";
    return {
      key: NAMED_ERRORS.has(type) ? (type as ReactionKey) : "runtime_error",
      details: { line: r.error?.line ?? undefined, error_type: type },
    };
  }
  const missing = vs.filter((v) => !v.present);
  if (missing.length) return { key: "missing_var", details: { vars: names(missing) } };
  const wrongType = vs.filter((v) => !v.typeOk);
  if (wrongType.length) {
    const allMatch = wrongType.every((v) => v.valueMatchOtherType);
    return { key: allMatch ? "type_mismatch_value_match" : "type_mismatch", details: { vars: names(wrongType) } };
  }
  const wrongValue = vs.filter((v) => !v.valueOk);
  if (wrongValue.length) return { key: "wrong_value", details: { vars: names(wrongValue) } };
  return null;
}

export function classifyRun(result: Exclude<RunnerResult, { kind: "not_ready" }>, level: LevelDefinition): RunOutcome {
  if (result.kind === "timeout") return empty(level, "timeout", { stopStatus: "timeout" });
  if (result.kind === "engine_error") return empty(level, "engine_error");

  const data = result.data;
  if (data.compile_error) {
    const ce = data.compile_error;
    const indent = ce.type === "IndentationError" || ce.type === "TabError";
    return empty(level, indent ? "IndentationError" : "SyntaxError", {
      error: {
        phase: "compile",
        type: ce.type,
        message: ce.message,
        line: ce.line,
        tracebackLines: ce.line ? [{ line: ce.line, text: ce.text }] : [],
      },
      details: { line: ce.line ?? undefined, error_type: ce.type },
    });
  }

  const base = data.base_results;
  const limit = level.alert_limit_statements;
  const first = base[0];
  const failing = base.find((r) => !passed(r));
  const shown = failing ?? first;
  const vars = verdicts(shown, level);
  const common = {
    vars,
    stdout: shown?.stdout ?? "",
    stdoutTruncated: shown?.stdout_truncated ?? false,
  };

  if (failing) {
    const f = failureKey(failing, vars)!;
    const lineCount = failing.status === "timeout" ? null : failing.line_count;
    return {
      ...empty(level, f.key),
      ...common,
      stopStatus: STOP_STATUSES.has(failing.status) ? failing.status : undefined,
      error: toError(failing, "base"),
      baseLineCount: lineCount,
      alertPercent: lineCount === null ? null : alertPercent(lineCount, limit),
      details: f.details,
    };
  }

  const count = Math.max(0, ...base.map((r) => r.line_count));
  const percent = alertPercent(count, limit);
  const caught = isCaught(count, limit);
  const counterTests = level.counter_attack_tests.length > 0;
  const aborted = !caught && data.counter_aborted ? data.counter_aborted : undefined;
  const counter = caught || aborted ? null : data.counter_results;
  const counterFailing = counter?.find((r) => !passed(r));
  const counterShown = counterFailing ?? counter?.[0];
  const counterVars = counterShown ? verdicts(counterShown, level) : aborted ? verdicts(undefined, level) : undefined;
  const counterSurvived = counterTests && !!counter && counter.length > 0 && !counterFailing;
  const stars = computeStars({ basePassed: true, statementCount: count, limit, hasCounter: counterTests, counterSurvived });

  const outcome: RunOutcome = {
    ...empty(level, "generic"),
    ...common,
    basePassed: true,
    stars,
    baseLineCount: count,
    alertPercent: percent,
    sentinelCaught: caught,
    counterVars,
    counterInputs: counterShown?.inputs ?? (aborted ? level.counter_attack_tests[0]?.inputs : undefined),
    counterAborted: aborted,
    counterSurvived,
    details: { count },
  };

  if (caught || count > limit) {
    outcome.key = "alert_exceeded";
    return outcome;
  }
  if (!counterTests) {
    outcome.key = "two_stars";
    return outcome;
  }
  if (aborted) {
    outcome.key = aborted === "timeout" ? "counter_timeout" : "engine_error";
    return outcome;
  }
  if (counterFailing && counterVars) {
    outcome.error = toError(counterFailing, "counter");
    const line = counterFailing.error?.line ?? undefined;
    if (counterFailing.status === "timeout") {
      outcome.key = "timeout";
    } else if (counterFailing.status !== "ok") {
      const type = counterFailing.error?.type ?? counterFailing.status;
      outcome.key = type === "ValueError" ? "counter_ValueError" : "counter_error";
      outcome.details = { ...outcome.details, line, error_type: type };
    } else {
      const wrongShape = counterVars.filter((v) => !v.present || !v.typeOk);
      if (wrongShape.length) {
        outcome.key = "counter_type_mismatch";
        outcome.details = { ...outcome.details, vars: names(wrongShape) };
      } else {
        outcome.key = "wrong_value_counter";
        outcome.details = { ...outcome.details, vars: names(counterVars.filter((v) => !v.valueOk)) };
      }
    }
    return outcome;
  }
  // counter_results missing despite a passing base run would be a harness bug.
  outcome.key = counterSurvived ? "three_stars" : "generic";
  return outcome;
}

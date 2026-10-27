import type { HarnessOutput, HarnessTestResult, RunnerResult, VarHistoryEntry } from "../engine/harness-types";
import { alertPercent, isCaught } from "./alert";
import { computeStars, type Stars } from "./compute-stars";
import { VALUE_TYPES, varObjectives, type InputValue, type LevelDefinition, type ReactionKey, type ValueType } from "./level-types";

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

/** One expected stdout line after grading (levels with `output_line` objectives). */
export interface OutputVerdict {
  line: number;
  expected: string;
  actual: string | null;
  status: "ok" | "wrong" | "missing";
  col: number | null;
  caseOnly: boolean;
}

export interface OutputReport {
  lines: OutputVerdict[];
  extraLines: string[];
  extraCount: number;
  truncated: boolean;
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
  /** Output line the reaction talks about (1-based). */
  out_line?: number;
  /** First wrong character on that line (1-based). */
  col?: number;
  /** First failing scan round (1-based); only on levels with several base tests. */
  round?: number;
}

/** One base test as a scan round (levels with two or more base tests), in order. */
export interface RoundVerdict {
  index: number;
  passed: boolean;
  inputs: Record<string, InputValue>;
  stdin?: string[];
  stdinRead?: number;
  output?: OutputReport;
  vars: VarVerdict[];
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
  counterInputs?: Record<string, InputValue>;
  counterSurvived: boolean;
  /** The counter-attack phase hung or crashed; the base result is kept. */
  counterAborted?: "timeout" | "engine_error";
  stdout: string;
  stdoutTruncated: boolean;
  /** Shown apart from stdout, never graded. */
  stderr: string;
  /** Output verdict of the shown base test; absent when the level grades no output. */
  output?: OutputReport;
  /** Same for the shown counter-attack test. */
  counterOutput?: OutputReport;
  /** Assignment history of the shown base test (kiosk levels only). */
  history?: VarHistoryEntry[];
  historyTruncated?: boolean;
  /** Same for the shown counter-attack test. */
  counterHistory?: VarHistoryEntry[];
  counterHistoryTruncated?: boolean;
  /** Stdin channel of the shown base test (levels with `stdin`): its lines, lines read, prompts written. */
  stdin?: string[];
  stdinRead?: number;
  prompts?: string[];
  /** Same for the shown counter-attack test (`counterStdin` also when the counter phase was aborted). */
  counterStdin?: string[];
  counterStdinRead?: number;
  counterPrompts?: string[];
  /** Every base test as a scan round, when the level has two or more and they ran. */
  rounds?: RoundVerdict[];
  details: OutcomeDetails;
}

const NAMED_ERRORS = new Set(["TypeError", "ValueError", "NameError", "ZeroDivisionError", "AttributeError"]);
/** Shapes an objective can name (`VALUE_TYPES`); a wrong value of any other shape is "unknown". */
const KNOWN_SHAPES: ReadonlySet<string> = new Set(VALUE_TYPES);
const STOP_STATUSES = new Set(["timeout", "resource_limit", "blocked_import", "input_unsupported", "system_exit"]);

function verdicts(result: HarnessTestResult | undefined, level: LevelDefinition): VarVerdict[] {
  return varObjectives(level).map((o) => {
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
  r.status === "ok" && Object.values(r.vars).every((v) => v.type_ok && v.value_ok) && (!r.output || r.output.ok);

function toOutput(o: HarnessOutput | null | undefined): OutputReport | undefined {
  if (!o) return undefined;
  return {
    lines: o.lines.map((l) => ({ line: l.line, expected: l.expected, actual: l.actual, status: l.status, col: l.col, caseOnly: l.case_only })),
    extraLines: o.extra_lines,
    extraCount: o.extra_count,
    truncated: o.truncated,
  };
}

/** The topmost wrong or missing line decides; then extra (or cut-off) output. */
function outputFailure(o: OutputReport): { key: ReactionKey; details: OutcomeDetails } | null {
  const bad = o.lines.find((l) => l.status !== "ok");
  if (bad?.status === "missing") return { key: "output_missing", details: { out_line: bad.line } };
  if (bad) return { key: bad.caseOnly ? "output_case_only" : "output_mismatch", details: { out_line: bad.line, col: bad.col ?? undefined } };
  if (o.extraCount > 0 || o.truncated) return { key: "output_extra", details: { count: Math.max(1, o.extraCount), out_line: o.lines.length + 1 } };
  return null;
}

const names = (vs: VarVerdict[]) => vs.map((v) => v.name).join(", ");

/**
 * Optional reaction keys refine a general one (`value_is_label` refines `wrong_value`,
 * `type_mismatch_unknown_shape` refines `type_mismatch`, `output_is_label` refines
 * `output_mismatch`, `string_repeated` refines `ValueError`, `type_mismatch` and `wrong_value`,
 * `value_overwritten` refines `wrong_value`, `EOFError` refines `runtime_error`,
 * `output_has_prompt` refines every output key whose line was printed).
 * One is returned only when the level writes a line for it; otherwise the general key
 * applies. Every optional key is gated here and nowhere else.
 */
const levelHasLine = (level: LevelDefinition, key: ReactionKey) => typeof level.reactions[key] === "string";

/** A string variable holding the text of a name (`'goi_3'`) instead of the value behind it. */
function labelValues(wrongValue: VarVerdict[], level: LevelDefinition): VarVerdict[] {
  const labels = new Set(labelNames(level).map((n) => `'${n}'`));
  return wrongValue.filter((v) => v.expectedType === "str" && v.preview !== null && labels.has(v.preview));
}

const labelNames = (level: LevelDefinition) => [...level.inputs, ...varObjectives(level).map((o) => o.var)];

/** A wrong output line that carries the bare text of a name (`PHIEN ma_phien`) the expected line does not. */
function outputHasLabel(o: OutputReport, out_line: number | undefined, level: LevelDefinition): boolean {
  const bad = o.lines.find((l) => l.line === out_line);
  if (!bad?.actual) return false;
  const word = (name: string) => new RegExp(`(?<![A-Za-z0-9_])${name}(?![A-Za-z0-9_])`);
  return labelNames(level).some((n) => word(n).test(bad.actual!) && !word(n).test(bad.expected));
}

/**
 * Wrong values that copy another objective's current value after that objective was
 * reassigned (`khu_cu = ma_khu` written after `ma_khu = goi_4`): the copy came too late.
 * Needs the assignment history, so only levels that trace variables can use it.
 */
function overwrittenCopies(wrongValue: VarVerdict[], all: VarVerdict[], h: VarHistoryEntry[] | undefined): VarVerdict[] {
  if (!h) return [];
  const reassigned = all.filter((w) => new Set(h.filter((e) => e.var === w.name).map((e) => e.preview)).size >= 2);
  return wrongValue.filter((v) => v.preview !== null && reassigned.some((w) => w.name !== v.name && w.valueOk && w.preview === v.preview));
}

/** Text holding a string input written twice in a row: `'1.721.72'` from `chieu_cao * 2`. */
function hasRepeatedInput(text: string | null | undefined, inputs: HarnessTestResult["inputs"]): boolean {
  if (!text) return false;
  return Object.values(inputs ?? {}).some((v) => typeof v === "string" && v.length >= 2 && text.includes(v + v));
}

/**
 * A wrong output line that carries a prompt the program wrote with `input("…")` and the
 * expected line does not: the prompt went out to the station with the answer.
 */
function outputHasPrompt(o: OutputReport, out_line: number | undefined, prompts: string[] | undefined): boolean {
  if (out_line === undefined || !prompts?.length) return false;
  const bad = o.lines.find((l) => l.line === out_line);
  const actual = bad ? bad.actual : o.extraLines[out_line - o.lines.length - 1];
  if (!actual) return false;
  const expected = bad?.expected ?? "";
  return prompts.some((p) => {
    // Graded lines are NFC with trailing spaces dropped; compare the prompt the same way.
    const text = p.normalize("NFC").trimEnd();
    return text !== "" && actual.includes(text) && !expected.includes(text);
  });
}

const history = (r: HarnessTestResult | undefined) => r?.var_history;

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
    stderr: "",
    details: {},
    ...extra,
  };
}

/** Classify why a test failed. Returns null when the test passed. */
function failureKey(
  r: HarnessTestResult,
  vs: VarVerdict[],
  output: OutputReport | undefined,
  level: LevelDefinition,
): { key: ReactionKey; details: OutcomeDetails } | null {
  if (r.status !== "ok") {
    if (STOP_STATUSES.has(r.status)) {
      return { key: r.status as ReactionKey, details: { line: r.error?.line ?? undefined, error_type: r.error?.type } };
    }
    const type = r.error?.type ?? "Error";
    if (type === "ValueError" && levelHasLine(level, "string_repeated") && hasRepeatedInput(r.error?.message, r.inputs)) {
      return { key: "string_repeated", details: { line: r.error?.line ?? undefined, error_type: type } };
    }
    // Read more lines than the station sent; a level without a line for it says runtime_error.
    if (type === "EOFError" && levelHasLine(level, "EOFError")) {
      return { key: "EOFError", details: { line: r.error?.line ?? undefined, error_type: type } };
    }
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
    if (allMatch) return { key: "type_mismatch_value_match", details: { vars: names(wrongType) } };
    // Every wrong shape is text that repeats an input (`"27" * 100`): multiplying text copies it.
    const repeated = wrongType.every((v) => v.type === "str" && hasRepeatedInput(v.preview, r.inputs));
    if (repeated && levelHasLine(level, "string_repeated")) return { key: "string_repeated", details: { vars: names(wrongType) } };
    // Every wrong shape is outside the five the level can ask for (a tuple from `1,72`, None…).
    const unknownShape = wrongType.every((v) => !KNOWN_SHAPES.has(v.type ?? ""));
    const key = unknownShape && levelHasLine(level, "type_mismatch_unknown_shape") ? "type_mismatch_unknown_shape" : "type_mismatch";
    return { key, details: { vars: names(wrongType) } };
  }
  const wrongValue = vs.filter((v) => !v.valueOk);
  if (wrongValue.length) {
    const asLabel = levelHasLine(level, "value_is_label") ? labelValues(wrongValue, level) : [];
    if (asLabel.length) return { key: "value_is_label", details: { vars: names(asLabel) } };
    const late = levelHasLine(level, "value_overwritten") ? overwrittenCopies(wrongValue, vs, r.var_history) : [];
    if (late.length && late.length === wrongValue.length) return { key: "value_overwritten", details: { vars: names(late) } };
    // `int(tuoi * 100 + cap_do)`: the shape is right, but the digits are the text repeated.
    if (levelHasLine(level, "string_repeated") && wrongValue.every((v) => hasRepeatedInput(v.preview, r.inputs)))
      return { key: "string_repeated", details: { vars: names(wrongValue) } };
    return { key: "wrong_value", details: { vars: names(wrongValue) } };
  }
  // Only failing results reach this point: a failed output report that names no line still fails.
  if (!output) return null;
  const f = outputFailure(output) ?? { key: "generic", details: {} };
  if (levelHasLine(level, "output_has_prompt") && outputHasPrompt(output, f.details.out_line, r.prompts)) {
    return { key: "output_has_prompt", details: f.details };
  }
  if (f.key === "output_mismatch" && levelHasLine(level, "output_is_label") && outputHasLabel(output, f.details.out_line, level)) {
    return { key: "output_is_label", details: f.details };
  }
  return f;
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
  const stdinOf = (tests: LevelDefinition["tests"], r: HarnessTestResult | undefined) => (r ? tests[r.index]?.stdin : undefined);
  const rounds: RoundVerdict[] | undefined =
    level.tests.length >= 2 && base.length > 0
      ? base.map((r) => ({
          index: r.index,
          passed: passed(r),
          inputs: r.inputs,
          stdin: stdinOf(level.tests, r),
          stdinRead: r.stdin_read,
          output: toOutput(r.output),
          vars: verdicts(r, level),
        }))
      : undefined;
  const common = {
    vars,
    stdout: shown?.stdout ?? "",
    stdoutTruncated: shown?.stdout_truncated ?? false,
    stderr: shown?.stderr ?? "",
    output: toOutput(shown?.output),
    history: history(shown),
    historyTruncated: shown?.var_history_truncated,
    stdin: stdinOf(level.tests, shown),
    stdinRead: shown?.stdin_read,
    prompts: shown?.prompts,
    rounds,
  };

  if (failing) {
    const f = failureKey(failing, vars, common.output, level)!;
    const lineCount = failing.status === "timeout" ? null : failing.line_count;
    return {
      ...empty(level, f.key),
      ...common,
      stopStatus: STOP_STATUSES.has(failing.status) ? failing.status : undefined,
      error: toError(failing, "base"),
      baseLineCount: lineCount,
      alertPercent: lineCount === null ? null : alertPercent(lineCount, limit),
      details: rounds ? { ...f.details, round: failing.index + 1 } : f.details,
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
    counterOutput: toOutput(counterShown?.output),
    counterHistory: history(counterShown),
    counterHistoryTruncated: counterShown?.var_history_truncated,
    counterStdin: stdinOf(level.counter_attack_tests, counterShown) ?? (aborted ? level.counter_attack_tests[0]?.stdin : undefined),
    counterStdinRead: counterShown?.stdin_read,
    counterPrompts: counterShown?.prompts,
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
        // A wrong value or a wrong output line: the code was written for the old data.
        outcome.key = "wrong_value_counter";
        const out = outcome.counterOutput && outputFailure(outcome.counterOutput);
        outcome.details = { ...outcome.details, vars: names(counterVars.filter((v) => !v.valueOk)), out_line: out?.details.out_line };
      }
    }
    return outcome;
  }
  // counter_results missing despite a passing base run would be a harness bug.
  outcome.key = counterSurvived ? "three_stars" : "generic";
  return outcome;
}

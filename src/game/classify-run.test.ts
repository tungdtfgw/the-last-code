import { describe, expect, test } from "vitest";
import type { HarnessReport, HarnessTestResult, HarnessVar } from "../engine/harness-types";
import levelJson from "../levels/level-1-4.json";
import { classifyRun } from "./classify-run";
import type { LevelDefinition } from "./level-types";

const level = levelJson as unknown as LevelDefinition;

const good = (type: string, preview = "x"): HarnessVar => ({
  present: true,
  type,
  preview,
  length: null,
  type_ok: true,
  value_ok: true,
  value_match_other_type: false,
});
const allGood = () => ({ ma_xac_thuc: good("int", "2703"), chi_so: good("float", "3.44"), hop_le: good("bool", "True") });

function test_(kind: "base" | "counter", over: Partial<HarnessTestResult> = {}): HarnessTestResult {
  return {
    kind,
    index: 0,
    inputs: kind === "base" ? { tuoi: "27" } : { tuoi: "31.0", chieu_cao: "1.65", cap_do: "7" },
    status: "ok",
    error: null,
    line_count: 3,
    stdout: "",
    stdout_truncated: false,
    vars: allGood(),
    ...over,
  };
}

const report = (base: HarnessTestResult, counter: HarnessTestResult[] | null = null): HarnessReport => ({
  python_version: "3.14.2",
  compile_error: null,
  base_results: [base],
  counter_results: counter,
});

const ok = (data: HarnessReport) => classifyRun({ kind: "ok", data }, level);
const err = (type: string, line = 7) => ({ type, message: "m", line, offset: null, traceback_lines: [{ line, text: "x" }] });

describe("classifyRun", () => {
  test("runner timeout / engine error", () => {
    expect(classifyRun({ kind: "timeout" }, level).key).toBe("timeout");
    expect(classifyRun({ kind: "engine_error", message: "x" }, level).key).toBe("engine_error");
  });

  test("compile errors", () => {
    const syntax = ok({ ...report(test_("base")), base_results: [], compile_error: { type: "SyntaxError", message: "m", line: 7, offset: 3, text: "x" } });
    expect(syntax.key).toBe("SyntaxError");
    expect(syntax.details.line).toBe(7);
    expect(syntax.error?.phase).toBe("compile");
    for (const t of ["IndentationError", "TabError"]) {
      const r = ok({ ...report(test_("base")), base_results: [], compile_error: { type: t, message: "m", line: 6, offset: 1, text: "" } });
      expect(r.key).toBe("IndentationError");
    }
  });

  test.each(["timeout", "resource_limit", "blocked_import", "input_unsupported", "system_exit"] as const)(
    "base stop status %s",
    (status) => {
      const r = ok(report(test_("base", { status, error: status === "timeout" ? null : err("X", 5) })));
      expect(r.key).toBe(status);
      expect(r.stars).toBe(0);
    },
  );

  test.each(["TypeError", "ValueError", "NameError", "ZeroDivisionError", "AttributeError"])("named runtime error %s", (type) => {
    const r = ok(report(test_("base", { status: "runtime_error", error: err(type) })));
    expect(r.key).toBe(type);
    expect(r.details).toMatchObject({ line: 7, error_type: type });
    expect(r.error?.phase).toBe("base");
  });

  test("other runtime error → runtime_error", () => {
    const r = ok(report(test_("base", { status: "runtime_error", error: err("IndexError", 9) })));
    expect(r.key).toBe("runtime_error");
    expect(r.details.error_type).toBe("IndexError");
  });

  test("missing var", () => {
    const vars = { ...allGood(), hop_le: { ...good("x"), present: false, type: null, type_ok: false, value_ok: false } };
    const r = ok(report(test_("base", { vars })));
    expect(r.key).toBe("missing_var");
    expect(r.details.vars).toBe("hop_le");
  });

  test("type mismatch vs type mismatch with matching value", () => {
    const wrong = { ...good("str"), type_ok: false, value_ok: false };
    let r = ok(report(test_("base", { vars: { ...allGood(), ma_xac_thuc: wrong, chi_so: { ...wrong, value_match_other_type: true } } })));
    expect(r.key).toBe("type_mismatch");
    expect(r.details.vars).toBe("ma_xac_thuc, chi_so");
    r = ok(report(test_("base", { vars: { ...allGood(), ma_xac_thuc: { ...good("float"), type_ok: false, value_ok: false, value_match_other_type: true } } })));
    expect(r.key).toBe("type_mismatch_value_match");
  });

  test("wrong value", () => {
    const r = ok(report(test_("base", { vars: { ...allGood(), chi_so: { ...good("float"), value_ok: false } } })));
    expect(r.key).toBe("wrong_value");
    expect(r.details.vars).toBe("chi_so");
  });

  test("three stars", () => {
    const r = ok(report(test_("base"), [test_("counter")]));
    expect(r).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 3, alertPercent: 15 });
    expect(r.counterInputs?.tuoi).toBe("31.0");
  });

  test("counter ValueError → 2 stars", () => {
    const r = ok(report(test_("base"), [test_("counter", { status: "runtime_error", error: err("ValueError", 7) })]));
    expect(r).toMatchObject({ key: "counter_ValueError", stars: 2, counterSurvived: false });
    expect(r.details.line).toBe(7);
    expect(r.error?.phase).toBe("counter");
  });

  test("counter other error / timeout", () => {
    expect(ok(report(test_("base"), [test_("counter", { status: "runtime_error", error: err("TypeError") })])).key).toBe("counter_error");
    expect(ok(report(test_("base"), [test_("counter", { status: "timeout" })])).key).toBe("timeout");
  });

  test("counter wrong type / wrong value", () => {
    const wrongType = { ...allGood(), chi_so: { ...good("str"), type_ok: false, value_ok: false } };
    expect(ok(report(test_("base"), [test_("counter", { vars: wrongType })])).key).toBe("counter_type_mismatch");
    const wrongValue = { ...allGood(), ma_xac_thuc: { ...good("int"), value_ok: false } };
    const r = ok(report(test_("base"), [test_("counter", { vars: wrongValue })]));
    expect(r).toMatchObject({ key: "wrong_value_counter", stars: 2 });
  });

  test("over the stealth limit → 1 star, counter result still recorded", () => {
    const r = ok(report(test_("base", { line_count: 12 }), [test_("counter")]));
    expect(r).toMatchObject({ key: "alert_exceeded", stars: 1, counterSurvived: true, alertPercent: 60 });
    expect(r.details.count).toBe(12);
  });

  test("over 100% alert → caught by the Sentinel: 0 stars, no counter-attack", () => {
    const r = ok(report(test_("base", { line_count: 21 }), null));
    expect(r).toMatchObject({ key: "alert_exceeded", stars: 0, sentinelCaught: true, counterSurvived: false });
    expect(r.counterVars).toBeUndefined();
    // Even if a counter result exists it is ignored.
    const r2 = ok(report(test_("base", { line_count: 25 }), [test_("counter")]));
    expect(r2).toMatchObject({ stars: 0, sentinelCaught: true, counterSurvived: false });
  });

  test("counter-attack phase hung: base result kept, counter failed by timeout", () => {
    const r = ok({ ...report(test_("base"), null), counter_aborted: "timeout" });
    expect(r).toMatchObject({ key: "counter_timeout", stars: 2, basePassed: true, counterSurvived: false, counterAborted: "timeout" });
    expect(r.counterInputs?.tuoi).toBe("31.0");
    expect(r.counterVars?.every((v) => !v.present)).toBe(true);
    const loud = ok({ ...report(test_("base", { line_count: 12 }), null), counter_aborted: "timeout" });
    expect(loud).toMatchObject({ key: "alert_exceeded", stars: 1, counterAborted: "timeout" });
    const crashed = ok({ ...report(test_("base"), null), counter_aborted: "engine_error" });
    expect(crashed).toMatchObject({ key: "engine_error", stars: 2 });
  });

  test("level without counter tests → two_stars", () => {
    const noCounter = { ...level, counter_attack_tests: [] };
    const r = classifyRun({ kind: "ok", data: report(test_("base"), []) }, noCounter);
    expect(r).toMatchObject({ key: "two_stars", stars: 2 });
  });

  test("stdout is carried through", () => {
    const r = ok(report(test_("base", { stdout: "hi\n", stdout_truncated: true }), [test_("counter")]));
    expect(r.stdout).toBe("hi\n");
    expect(r.stdoutTruncated).toBe(true);
  });
});

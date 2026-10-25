import { describe, expect, test } from "vitest";
import type { HarnessOutput, HarnessOutputLine, HarnessReport, HarnessTestResult, HarnessVar } from "../engine/harness-types";
import levelJson from "../levels/level-1-4.json";
import level12Json from "../levels/level-1-2.json";
import level13Json from "../levels/level-1-3.json";
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
    inputs: kind === "base" ? { tuoi: "27" } : { tuoi: "31.0", chieu_cao: "1.653", cap_do: "7" },
    status: "ok",
    error: null,
    line_count: 3,
    stdout: "",
    stdout_truncated: false,
    stderr: "",
    vars: allGood(),
    output: null,
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

  describe("output lines", () => {
    const line = (n: number, over: Partial<HarnessOutputLine> = {}): HarnessOutputLine => ({
      line: n,
      expected: `L${n}`,
      actual: `L${n}`,
      status: "ok",
      col: null,
      case_only: false,
      ...over,
    });
    const output = (lines: HarnessOutputLine[], extra = 0): HarnessOutput => ({
      ok: false,
      truncated: false,
      lines,
      extra_lines: Array(extra).fill("x"),
      extra_count: extra,
    });

    test("a wrong line beats extra lines", () => {
      const r = ok(report(test_("base", { output: output([line(1), line(2, { status: "wrong", actual: "Lx", col: 2 })], 2) })));
      expect(r).toMatchObject({ key: "output_mismatch", details: { out_line: 2, col: 2 } });
    });

    test("the topmost wrong line decides", () => {
      const r = ok(report(test_("base", { output: output([line(1, { status: "wrong", actual: "l1", col: 1, case_only: true }), line(2, { status: "wrong", actual: "Q", col: 1 })]) })));
      expect(r).toMatchObject({ key: "output_case_only", details: { out_line: 1, col: 1 } });
    });

    test("right variables but wrong output: not passed, no star branch", () => {
      const r = ok(report(test_("base", { output: output([line(1)], 1) }), [test_("counter")]));
      expect(r).toMatchObject({ key: "output_extra", stars: 0, basePassed: false, details: { count: 1 } });
      expect(r.counterVars).toBeUndefined();
    });

    test("a failed report that names no line (grader fallback) fails as generic, never throws", () => {
      expect(ok(report(test_("base", { output: output([]) })))).toMatchObject({ key: "generic", stars: 0, basePassed: false });
    });
  });
});

describe("value_is_label (level 1.2)", () => {
  const level12 = level12Json as unknown as LevelDefinition;
  const VARS_12 = ["ho_ten", "ma_khu", "so_hieu", "khu_cu", "the_quet", "the_cong"];
  /** Base result of 1.2 where `wrong` vars hold a wrong str with the given preview. */
  const run12 = (wrong: Record<string, string>, lvl = level12) => {
    const vars = Object.fromEntries(
      VARS_12.map((n) => [n, n in wrong ? { ...good("str", wrong[n]), value_ok: false } : good("str", "'ok'")]),
    );
    return classifyRun({ kind: "ok", data: report(test_("base", { vars, inputs: {} })) }, lvl);
  };

  test("a value that is the text of an input or objective name; text that only looks close is a plain wrong value", () => {
    expect(run12({ so_hieu: "'goi_3 '" })).toMatchObject({ key: "wrong_value", details: { vars: "so_hieu" } });
    expect(run12({ the_cong: "'so_hieu'" })).toMatchObject({ key: "value_is_label", details: { vars: "the_cong" } });
    // Only the label-valued vars are named; other wrong values wait for the next run.
    expect(run12({ so_hieu: "'goi_3'", khu_cu: "'K-07'" })).toMatchObject({ key: "value_is_label", details: { vars: "so_hieu" } });
  });

  test("a level without a value_is_label line keeps wrong_value", () => {
    const { value_is_label: _drop, ...reactions } = level12.reactions;
    const bare = { ...level12, reactions } as LevelDefinition;
    expect(run12({ so_hieu: "'goi_3'", khu_cu: "'K-07'" }, bare)).toMatchObject({ key: "wrong_value", details: { vars: "so_hieu, khu_cu" } });
  });
});

describe("type_mismatch_unknown_shape (level 1.3)", () => {
  const level13 = level13Json as unknown as LevelDefinition;
  const wrong = (type: string): HarnessVar => ({ ...good(type), type_ok: false, value_ok: false });
  const vars = { ho_ten: good("str"), tuoi: good("int"), chieu_cao: wrong("tuple"), da_tiem: good("bool"), khuon_phien: good("type") };
  const run = (over: Record<string, HarnessVar>, lvl = level13) =>
    classifyRun({ kind: "ok", data: report(test_("base", { vars: { ...vars, ...over }, inputs: { ma_phien: 4096 } })) }, lvl).key;

  test("only when every wrong shape is outside the four lanes and the type objective", () => {
    expect(run({})).toBe("type_mismatch_unknown_shape");
    expect(run({ da_tiem: wrong("NoneType") })).toBe("type_mismatch_unknown_shape");
    expect(run({ tuoi: wrong("str") })).toBe("type_mismatch");
    expect(run({ chieu_cao: good("float"), khuon_phien: wrong("int") })).toBe("type_mismatch");
  });

  test("a level without a line for it (1.4) keeps type_mismatch", () => {
    const tuple = classifyRun({ kind: "ok", data: report(test_("base", { vars: { ...allGood(), chi_so: wrong("tuple") } })) }, level);
    expect(tuple.key).toBe("type_mismatch");
  });
});

import { describe, expect, test } from "vitest";
import type { HarnessOutput, HarnessOutputLine, HarnessReport, HarnessTestResult, HarnessVar } from "../engine/harness-types";
import { classifyRun, pyStrRepr } from "./classify-run";
import type { LevelDefinition } from "./level-types";
import { realLevel } from "../../tests/content-fixture";

const level = realLevel("1.4");

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
  const level12 = realLevel("1.2");
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
  const level13 = realLevel("1.3");
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

describe("stdin channel and scan rounds", () => {
  const level11 = realLevel("1.1");
  const WANT = ["NID/2089", "PHIEN K7Q2", "LO17 CAN LIEN LAC"];
  const lines = (got: (string | null)[]): HarnessOutput => ({
    ok: got.every((g, i) => g === WANT[i]),
    truncated: false,
    lines: WANT.map((e, i) => {
      const a = got[i] ?? null;
      const ok = a === e;
      return { line: i + 1, expected: e, actual: a, status: a === null ? "missing" : ok ? "ok" : "wrong", col: ok || a === null ? null : 1, case_only: false };
    }),
    extra_lines: [],
    extra_count: 0,
  });
  const stdinTest = { inputs: { ma_phien: "K7Q2" }, stdin: ["4172", "DEM"], expected: {}, expected_output: WANT };
  const withLines = (extra: Record<string, string>, tests = 1): LevelDefinition => ({
    ...level11,
    tests: Array.from({ length: tests }, () => stdinTest),
    counter_attack_tests: [{ ...stdinTest, stdin: ["9035"] }],
    reactions: { ...level11.reactions, ...extra },
  });
  const run = (lvl: LevelDefinition, base: HarnessTestResult[]) =>
    classifyRun({ kind: "ok", data: { python_version: "3.14", compile_error: null, base_results: base, counter_results: null } }, lvl);
  const res = (index: number, over: Partial<HarnessTestResult> = {}) => test_("base", { index, inputs: { ma_phien: "K7Q2" }, vars: {}, output: lines(WANT), ...over });

  test("EOFError has its own key only when the level writes a line for it", () => {
    const eof = res(0, { status: "runtime_error", error: err("EOFError", 4), stdin_read: 2 });
    expect(run(withLines({ EOFError: "Trạm không gửi thêm." }), [eof])).toMatchObject({ key: "EOFError", details: { line: 4, error_type: "EOFError" } });
    expect(run(withLines({}), [eof]).key).toBe("runtime_error");
  });

  test("a prompt carried into a wrong line is output_has_prompt, ahead of output_is_label; without a line it is the output key", () => {
    const prompted = res(0, { output: lines(["NID/2089", "Ma hoi: PHIEN ma_phien", WANT[2]]), prompts: ["Ma hoi: "], stdin_read: 1 });
    const both = withLines({ output_has_prompt: "Lời nhắc cũng đi ra trạm." });
    expect(run(both, [prompted])).toMatchObject({ key: "output_has_prompt", details: { out_line: 2 }, stdin: ["4172", "DEM"], stdinRead: 1, prompts: ["Ma hoi: "] });
    const plain = { ...level11, tests: [stdinTest], counter_attack_tests: [] } as LevelDefinition;
    expect(run(plain, [prompted]).key).toBe("output_is_label");
    // The prompt is part of the expected line: nothing to explain.
    const expectedPrompt = res(0, { output: lines(["NID/2089", "PHIEN K7Q1", WANT[2]]), prompts: ["PHIEN"] });
    expect(run(both, [expectedPrompt]).key).toBe("output_mismatch");
  });

  test("rounds exist with several base tests, not with one; details.round names the first failing round", () => {
    const three = withLines({}, 3);
    const r = run(three, [res(0, { stdin_read: 2 }), res(1, { output: lines([WANT[0], "PHIEN K7Q3", WANT[2]]) }), res(2, { output: lines([WANT[0], "x", WANT[2]]) })]);
    expect(r).toMatchObject({ key: "output_mismatch", details: { out_line: 2, round: 2 } });
    expect(r.rounds?.map((x) => [x.index, x.passed])).toEqual([[0, true], [1, false], [2, false]]);
    expect(r.rounds?.[0]).toMatchObject({ stdin: ["4172", "DEM"], stdinRead: 2 });
    expect(r.output?.lines[1].actual).toBe("PHIEN K7Q3");

    const single = run(withLines({}), [res(0, { output: lines([WANT[0], "x", WANT[2]]) })]);
    expect(single.rounds).toBeUndefined();
    expect(single.details.round).toBeUndefined();
  });
});

describe("wrong_branch: a value another situation expects", () => {
  const LINE = "Mã đi vào nhánh của tình huống khác.";
  const branchLevel = (reactions: Partial<LevelDefinition["reactions"]> = { wrong_branch: LINE }): LevelDefinition => ({
    ...level,
    chapter: 2,
    inputs: ["muc"],
    objectives: [
      { var: "lenh", type: "str", label: "Lệnh" },
      { var: "canh_bao", type: "bool", label: "Cảnh báo" },
      { kind: "output_line", line: 1, label: "Dòng báo" },
    ],
    tests: [
      { inputs: { muc: 1 }, expected: { lenh: "NAP", canh_bao: true }, expected_output: ["DI 45"] },
      { inputs: { muc: 5 }, expected: { lenh: "DI", canh_bao: false }, expected_output: ["NAP 0"] },
    ],
    counter_attack_tests: [{ inputs: { muc: 3 }, expected: { lenh: "muc", canh_bao: true }, expected_output: ["CHO muc"] }],
    reactions: { ...level.reactions, ...reactions },
  });
  const outLine = (actual: string, expected: string): HarnessOutput => ({
    ok: actual === expected,
    truncated: false,
    lines: [{ line: 1, expected, actual, status: actual === expected ? "ok" : "wrong", col: actual === expected ? null : 1, case_only: false }],
    extra_lines: [],
    extra_count: 0,
  });
  const vars = (lenh: string | null, canhBao = true, lenhOk = false): Record<string, HarnessVar> => ({
    lenh: { ...good("str", lenh ?? "'NAP'"), value_ok: lenh === null || lenhOk },
    canh_bao: { ...good("bool", canhBao ? "True" : "False"), value_ok: canhBao },
  });
  const base = (index: number, over: Partial<HarnessTestResult> = {}) =>
    test_("base", { index, inputs: { muc: index ? 5 : 1 }, vars: vars(null), output: outLine(index ? "NAP 0" : "DI 45", index ? "NAP 0" : "DI 45"), ...over });
  const counter = (over: Partial<HarnessTestResult> = {}) =>
    test_("counter", { inputs: { muc: 3 }, vars: vars(null), output: outLine("CHO muc", "CHO muc"), ...over });
  const run = (lvl: LevelDefinition, b: HarnessTestResult[], c: HarnessTestResult[] | null = null) =>
    classifyRun({ kind: "ok", data: { python_version: "3.14", compile_error: null, base_results: b, counter_results: c } }, lvl);

  test("a str variable holding another test's value, compared as Python shows it", () => {
    expect(run(branchLevel(), [base(0, { vars: vars("'DI'") }), base(1)])).toMatchObject({ key: "wrong_branch", details: { vars: "lenh", round: 1 } });
    expect(run(branchLevel(), [base(0, { vars: vars("'XX'") }), base(1)]).key).toBe("wrong_value");
    expect(run(branchLevel({}), [base(0, { vars: vars("'DI'") }), base(1)]).key).toBe("wrong_value");
  });

  test("a wrong bool is never wrong_branch: any wrong bool is another test's answer", () => {
    expect(run(branchLevel(), [base(0, { vars: vars(null, false) }), base(1)])).toMatchObject({ key: "wrong_value", details: { vars: "canh_bao" } });
  });

  test("a printed line that another test expects on that line", () => {
    const wrongLine = base(0, { output: outLine("NAP 0", "DI 45") });
    expect(run(branchLevel(), [wrongLine, base(1)])).toMatchObject({ key: "wrong_branch", details: { out_line: 1, round: 1 } });
    expect(run(branchLevel({}), [wrongLine, base(1)]).key).toBe("output_mismatch");
    expect(run(branchLevel(), [base(0, { output: outLine("NAP 1", "DI 45") }), base(1)]).key).toBe("output_mismatch");
  });

  test("on the counter-attack, with no round; without a line it stays wrong_value_counter", () => {
    const passed = [base(0), base(1)];
    const byVar = run(branchLevel(), passed, [counter({ vars: vars("'NAP'") })]);
    expect(byVar).toMatchObject({ key: "wrong_branch", stars: 2, details: { vars: "lenh" } });
    expect(byVar.details.round).toBeUndefined();
    expect(run(branchLevel(), passed, [counter({ output: outLine("DI 45", "CHO muc") })])).toMatchObject({ key: "wrong_branch", details: { out_line: 1 } });
    expect(run(branchLevel({}), passed, [counter({ vars: vars("'NAP'") })]).key).toBe("wrong_value_counter");
    expect(run(branchLevel(), passed, [counter({ vars: vars("'ZZ'") })]).key).toBe("wrong_value_counter");
  });

  test("value_is_label, output_is_label and output_has_prompt come first", () => {
    const all = branchLevel({ wrong_branch: LINE, value_is_label: "Tên.", output_is_label: "Tên in ra.", output_has_prompt: "Lời nhắc." });
    expect(run(all, [base(0, { vars: vars("'muc'") }), base(1)]).key).toBe("value_is_label");
    expect(run(all, [base(0, { output: outLine("CHO muc", "DI 45") }), base(1)]).key).toBe("output_is_label");
    expect(run(all, [base(0, { output: outLine("NAP 0", "DI 45"), prompts: ["NAP"] }), base(1)]).key).toBe("output_has_prompt");
  });
});

test("pyStrRepr writes a str the way the harness previews it (Python repr)", () => {
  expect(pyStrRepr("NAP")).toBe("'NAP'");
  expect(pyStrRepr("it's")).toBe(`"it's"`);
  expect(pyStrRepr(`it's "x"`)).toBe(`'it\\'s "x"'`);
  expect(pyStrRepr("a\\b\n")).toBe("'a\\\\b\\n'");
});

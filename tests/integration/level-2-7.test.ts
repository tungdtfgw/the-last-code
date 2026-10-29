import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { readFixture, runHarness } from "./run-harness";

// Boss 2.7 through the real harness (python3): four patrol phases are the base tests, the
// tower's emergency rules the counter-attack. GDD 2.7 §3.1 (fix chain), §6.3 (mutations), §8 (limit).

const level = realLevel("2.7");
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced (the layout, and so every line number, stays). */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
const grade = (editorText: string) => {
  const report = runHarness(level, editorText);
  return { report, outcome: classifyRun({ kind: "ok", data: report }, level) };
};
const counts = (report: ReturnType<typeof runHarness>) => report.base_results.map((r) => r.line_count);

const FIX_TYPE = { 7: "khoang_cach = int(input())" };
const FIX_SCALE = {
  15: "if khoang_cach < 20:",
  16: '    print("MUC: BAO DONG")',
  17: "elif khoang_cach < 50:",
  18: '    print("MUC: NGUY HIEM")',
  19: "elif khoang_cach < 100:",
  20: '    print("MUC: CANH GIAC")',
};
const FIX_PRINT = { 32: 'print(f"LENH DRONE: {lenh_drone}")' };
const FIX_PAREN = { 35: "if trong_tam and (camera_bat or den_pha):" };
const FIX_LE = { 11: "trong_tam = khoang_cach <= tam_quet" };

describe("level 2.7: the starter code's fixes surface one at a time", () => {
  test("1. starter: phase 1 stops with TypeError on line 11 before any line is printed", () => {
    const { report, outcome } = grade(level.starter_code);
    expect(outcome).toMatchObject({ key: "TypeError", stars: 0, details: { line: 11, round: 1 } });
    expect(counts(report)).toEqual([3, 3, 3, 3]);
    expect(outcome.rounds).toHaveLength(4);
    expect(outcome.rounds![0].output!.lines.map((l) => l.status)).toEqual(["missing", "missing", "missing", "missing"]);
  });

  test("2. distance converted: the reversed scale takes another phase's branch on line 2", () => {
    const { report, outcome } = grade(withLines(FIX_TYPE));
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 1, out_line: 2 } });
    expect(outcome.output!.lines[1].actual).toBe("MUC: CANH GIAC");
    expect(counts(report)).toEqual([11, 11, 11, 14]);
  });

  test("3. scale reordered: the command line never prints, so line 3 gets Kai's line; line 32 is dimmed", () => {
    const { report, outcome } = grade(withLines({ ...FIX_TYPE, ...FIX_SCALE }));
    expect(outcome).toMatchObject({ key: "output_mismatch", stars: 0, details: { round: 1, out_line: 3, col: 1 } });
    expect(outcome.output!.lines[2].actual).toBe("KAI: NAP");
    expect(counts(report)).toEqual([12, 13, 11, 14]);
    expect(outcome.skippedLines).toEqual([16, 19, 20, 22, 29, 31, 32, 37, 38, 40]);
  });

  test("4. print moved out of the block: phase 3 hides Kai although he is out of range", () => {
    const { report, outcome } = grade(withLines({ ...FIX_TYPE, ...FIX_SCALE, ...FIX_PRINT }));
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 3, out_line: 4 } });
    expect(counts(report)).toEqual([13, 13, 12, 15]);
  });

  test("5. brackets added (two stars): the emergency rule at distance equal to range breaks line 1, no round", () => {
    const { report, outcome } = grade(withLines({ ...FIX_TYPE, ...FIX_SCALE, ...FIX_PRINT, ...FIX_PAREN }));
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 2, basePassed: true, baseLineCount: 15, details: { out_line: 1 } });
    expect(outcome.details.round).toBeUndefined();
    expect(outcome.counterOutput!.lines[0].actual).toBe("TRONG TAM: False");
    expect(counts(report)).toEqual([13, 13, 13, 15]);
  });

  test("6. range made inclusive: three stars", () => {
    const { outcome } = grade(withLines({ ...FIX_TYPE, ...FIX_SCALE, ...FIX_PRINT, ...FIX_PAREN, ...FIX_LE }));
    expect(outcome).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 15 });
  });
});

describe("level 2.7: three-star solutions", () => {
  test.each([
    ["three-star-print-in-branches", [12, 12, 12, 14]],
    ["three-star-assign-then-print", [15, 15, 15, 17]],
    ["three-star-ternary", [8, 9, 7, 9]],
    ["three-star-no-in-range-variable", [11, 11, 11, 13]],
    ["three-star-nested-decision", [13, 13, 12, 14]],
    ["three-star-not-command", [12, 12, 12, 14]],
    ["three-star-float-input", [12, 12, 12, 14]],
    // Separate ifs overwriting Kai's decision in reverse order are correct; kept so lowering the limit shows its cost.
    ["three-star-decision-overwrite", [16, 16, 14, 15]],
  ] as const)("%s: %j statements per phase", (name, perPhase) => {
    const { report, outcome } = grade(readFixture(`2.7/${name}`));
    expect(outcome).toMatchObject({ key: "three_stars", stars: 3, baseLineCount: Math.max(...perPhase) });
    expect(counts(report)).toEqual(perPhase);
  });
});

type Row = { file: string; key: string; stars: number; round?: number; out_line?: number; line?: number; max?: number };
// `round` set: a base phase fails; absent with `stars: 2`: the counter-attack fails (details carry no round).
const MUTATIONS: Row[] = [
  { file: "hardcoded", key: "wrong_branch", stars: 0, round: 2, out_line: 2, max: 6 },
  { file: "in-range-strict", key: "wrong_branch", stars: 2, out_line: 1, max: 14 },
  { file: "scale-inclusive", key: "wrong_branch", stars: 2, out_line: 2, max: 14 },
  { file: "scale-reversed", key: "wrong_branch", stars: 0, round: 1, out_line: 2 },
  { file: "scale-separate-ifs-print", key: "output_mismatch", stars: 0, round: 1, out_line: 3 },
  { file: "scale-separate-ifs-overwrite", key: "alert_exceeded", stars: 1, max: 18 },
  { file: "scale-separate-ifs-overwrite-all", key: "alert_exceeded", stars: 1, max: 20 },
  { file: "decision-missing-parens", key: "wrong_branch", stars: 0, round: 3, out_line: 4 },
  { file: "decision-swap-hide-rule", key: "wrong_branch", stars: 2, out_line: 4, max: 14 },
  { file: "decision-swap-wait-rule", key: "wrong_branch", stars: 0, round: 3, out_line: 4 },
  { file: "decision-forgot-camera", key: "wrong_branch", stars: 0, round: 1, out_line: 4 },
  { file: "decision-forgot-light", key: "wrong_branch", stars: 0, round: 2, out_line: 4 },
  { file: "decision-only-in-range", key: "wrong_branch", stars: 2, out_line: 4, max: 14 },
  { file: "decision-dropped-command", key: "wrong_branch", stars: 2, out_line: 4, max: 14 },
  { file: "decision-elif-order", key: "wrong_branch", stars: 0, round: 1, out_line: 4 },
  { file: "decision-separate-ifs-print", key: "output_extra", stars: 0, round: 1 },
  { file: "command-inverted", key: "wrong_branch", stars: 0, round: 1, out_line: 3 },
  { file: "command-listed", key: "wrong_branch", stars: 2, out_line: 3, max: 14 },
  { file: "command-wrong-case", key: "wrong_branch", stars: 0, round: 1, out_line: 3 },
  { file: "command-inner-else-dedented", key: "wrong_branch", stars: 0, round: 2, out_line: 3 },
  { file: "command-print-in-else", key: "output_mismatch", stars: 0, round: 1, out_line: 3 },
  { file: "forgot-int", key: "TypeError", stars: 0, round: 1, line: 11 },
  { file: "input-prompt", key: "output_has_prompt", stars: 0, round: 1, out_line: 1 },
  { file: "extra-input-read", key: "EOFError", stars: 0, round: 1, line: 9 },
  { file: "assign-for-compare", key: "SyntaxError", stars: 0, line: 24 },
  { file: "missing-colon", key: "SyntaxError", stars: 0, line: 14 },
  { file: "body-not-indented", key: "IndentationError", stars: 0, line: 15 },
];

describe("level 2.7: mutation table", () => {
  test.each(MUTATIONS)("$file → $key, $stars stars", ({ file, key, stars, round, out_line, line, max }) => {
    const { outcome } = grade(readFixture(`2.7/${file}`));
    expect(outcome).toMatchObject({ key, stars });
    expect(outcome.details.round).toBe(round);
    if (out_line !== undefined) expect(outcome.details.out_line).toBe(out_line);
    if (line !== undefined) expect(outcome.details.line).toBe(line);
    if (max !== undefined) expect(outcome.baseLineCount).toBe(max);
  });

  test("every fixture that is not a three-star solution is in the table, below three stars", () => {
    const files = readdirSync(new URL("../fixtures/solutions/2.7/", import.meta.url))
      .map((f) => f.replace(/\.py$/, ""))
      .filter((f) => !f.startsWith("three-star"));
    expect(new Set(files)).toEqual(new Set(MUTATIONS.map((m) => m.file)));
    for (const { file, stars } of MUTATIONS) expect(stars, file).toBeLessThan(3);
  });
});

test("level 2.7: the four base phases reach every branch of lines 2, 3 and 4", () => {
  const { outcome } = grade(readFixture("2.7/three-star-print-in-branches"));
  const valuesOf = (line: number) =>
    new Set(outcome.rounds!.map((r) => r.output!.lines[line - 1].actual!.split(": ")[1]));
  expect(outcome.rounds!.every((r) => r.passed)).toBe(true);
  expect(valuesOf(2)).toEqual(new Set(["BAO DONG", "NGUY HIEM", "CANH GIAC", "AN TOAN"]));
  expect(valuesOf(3)).toEqual(new Set(["XUAT KICH", "CHO LENH", "KHONG CO"]));
  expect(valuesOf(4)).toEqual(new Set(["NAP", "CHO", "QUA"]));
});

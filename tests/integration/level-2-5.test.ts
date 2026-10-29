import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { readFixture, runHarness } from "./run-harness";

// Level 2.5 through the real harness (python3): the starter's key chain, the mutation
// table and the statement threshold of GDD 2.5 §3 and §8.

const level = realLevel("2.5");
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced (the layout, and so every line number, stays). */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
const grade = (editorText: string) => {
  const report = runHarness(level, editorText);
  return { report, outcome: classifyRun({ kind: "ok", data: report }, level) };
};
const gradeFile = (file: string) => grade(readFixture(`2.5/${file}`));
const counts = (results: { line_count: number }[] | null | undefined) => results?.map((r) => r.line_count);

describe("level 2.5 starter code", () => {
  test("starter: round 2 takes the wrong branch, the else body never runs there", () => {
    const { report, outcome } = grade(level.starter_code);
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, basePassed: false, details: { round: 2, out_line: 1 } });
    expect(counts(report.base_results)).toEqual([2, 2, 2, 2]);
    expect(outcome.skippedLines).toEqual([10]);
    expect(outcome.skippedRound).toBe(2);
    expect(outcome.rounds!.slice(0, 2).map((r) => r.passed)).toEqual([true, false]);
  });

  test("only the missing not added: still round 2", () => {
    const { outcome } = grade(withLines({ 7: "if khoang_cach > 40 or not camera_bat and not den_pha:" }));
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 2 } });
  });

  test("only the grouping added: round 3 now", () => {
    const { outcome } = grade(withLines({ 7: "if (khoang_cach > 40 or camera_bat) and not den_pha:" }));
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 3 } });
  });

  test("both fixed: three stars in 2 statements", () => {
    const { outcome } = grade(withLines({ 7: "if (khoang_cach > 40 or not camera_bat) and not den_pha:" }));
    expect(outcome).toMatchObject({ key: "three_stars", stars: 3, baseLineCount: 2, counterSurvived: true });
  });
});

interface Row {
  file: string;
  key: string;
  stars: number;
  /** Base round that fails (1-based). */
  round?: number;
  /** Counter-attack test that fails (1-based); `details.round` is then absent. */
  counter?: number;
  line?: number;
  counts?: number[];
  counterCounts?: number[];
  actual?: string;
}

const ROWS: Row[] = [
  { file: "three-star", key: "three_stars", stars: 3, counts: [2, 2, 2, 2], counterCounts: [2, 2, 2] },
  { file: "three-star-assign-then-print", key: "three_stars", stars: 3, counts: [3, 3, 3, 3], counterCounts: [3, 3, 3] },
  { file: "three-star-ternary", key: "three_stars", stars: 3, counts: [2, 2, 2, 2], counterCounts: [2, 2, 2] },
  { file: "three-star-bool-variable", key: "three_stars", stars: 3, counts: [3, 3, 3, 3], counterCounts: [3, 3, 3] },
  { file: "three-star-nested", key: "three_stars", stars: 3, counts: [3, 2, 3, 3], counterCounts: [3, 3, 2] },
  { file: "three-star-equals-false", key: "three_stars", stars: 3, counts: [2, 2, 2, 2], counterCounts: [2, 2, 2] },
  { file: "two-star-boundary", key: "wrong_branch", stars: 2, counter: 1, counts: [2, 2, 2, 2], actual: "LENH: QUA" },
  { file: "two-star-guess-threshold", key: "wrong_branch", stars: 2, counter: 2, counts: [2, 2, 2, 2], actual: "LENH: CHO" },
  { file: "hardcoded", key: "wrong_branch", stars: 0, round: 2, counts: [1, 1, 1, 1] },
  { file: "and-for-or", key: "wrong_branch", stars: 0, round: 1, counts: [2, 2, 2, 2] },
  { file: "or-for-and", key: "wrong_branch", stars: 0, round: 2, counts: [2, 2, 2, 2] },
  { file: "forgot-not-light", key: "wrong_branch", stars: 0, round: 1, counts: [2, 2, 2, 2] },
  { file: "dropped-light", key: "wrong_branch", stars: 0, round: 2, counts: [2, 2, 2, 2] },
  { file: "misplaced-parens", key: "wrong_branch", stars: 0, round: 2, counts: [2, 2, 2, 2] },
  { file: "print-inside-else", key: "output_missing", stars: 0, round: 1, counts: [2, 3, 3, 2] },
  { file: "else-not-indented", key: "IndentationError", stars: 0, line: 10 },
  { file: "swapped-branches", key: "wrong_branch", stars: 0, round: 1, counts: [2, 2, 2, 2] },
  { file: "elif-chain-wrong-order", key: "wrong_branch", stars: 0, round: 2, counts: [2, 2, 4, 3] },
  { file: "elif-chain-no-and-or", key: "alert_exceeded", stars: 1, counts: [3, 2, 4, 4] },
  { file: "default-then-if", key: "alert_exceeded", stars: 1, counts: [4, 3, 3, 4] },
  { file: "two-separate-ifs", key: "three_stars", stars: 3, counts: [3, 3, 3, 3], counterCounts: [3, 3, 3] },
  { file: "bool-vs-text", key: "wrong_branch", stars: 0, round: 4, counts: [2, 2, 2, 2] },
  { file: "wrong-case", key: "output_case_only", stars: 0, round: 1, counts: [2, 2, 2, 2] },
  { file: "c-style-operators", key: "SyntaxError", stars: 0, line: 7 },
  { file: "missing-colon", key: "SyntaxError", stars: 0, line: 7 },
  { file: "assign-for-compare", key: "SyntaxError", stars: 0, line: 7 },
];

describe("level 2.5 mutation table", () => {
  test.each(ROWS)("$file → $key, $stars stars", (row) => {
    const { report, outcome } = gradeFile(row.file);
    expect(outcome.key).toBe(row.key);
    expect(outcome.stars).toBe(row.stars);
    if (row.line !== undefined) expect(outcome.details.line).toBe(row.line);
    if (row.counts) expect(counts(report.base_results)).toEqual(row.counts);
    if (row.counterCounts) expect(counts(report.counter_results)).toEqual(row.counterCounts);
    if (row.round !== undefined) expect(outcome.details.round).toBe(row.round);
    if (row.counter !== undefined) {
      expect(outcome.basePassed).toBe(true);
      expect(outcome.details.round).toBeUndefined();
      expect(report.counter_results!.findIndex((r) => r.status !== "ok" || !r.output?.ok) + 1).toBe(row.counter);
      expect(outcome.counterOutput!.lines[0].actual).toBe(row.actual);
    }
  });

  test("every fixture is in the table", () => {
    const files = readdirSync(new URL("../fixtures/solutions/2.5/", import.meta.url)).map((f) => f.replace(/\.py$/, ""));
    expect(files.sort()).toEqual(ROWS.map((r) => r.file).sort());
  });

  test("no mutation earns three stars, except two separate ifs (accepted risk)", () => {
    for (const row of ROWS.filter((r) => !r.file.startsWith("three-star") && r.file !== "two-separate-ifs")) {
      expect(gradeFile(row.file).outcome.stars, row.file).toBeLessThan(3);
    }
  });
});

describe("level 2.5 statement threshold", () => {
  test("assign in each branch, print once: three stars in 3 statements", () => {
    expect(gradeFile("three-star-assign-then-print").outcome).toMatchObject({ key: "three_stars", stars: 3, baseLineCount: 3 });
  });

  test("an elif chain without and/or: right, but 4 statements is one star", () => {
    expect(gradeFile("elif-chain-no-and-or").outcome).toMatchObject({ key: "alert_exceeded", stars: 1, baseLineCount: 4 });
  });
});

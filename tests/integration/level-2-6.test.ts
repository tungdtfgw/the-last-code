import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { readFixture, runHarness } from "./run-harness";

// Level 2.6 through the real harness (python3): no locked line, every value comes
// from the stdin channel (command code, possibly empty, then battery level). Four base
// situations, three counter-attack ones. GDD 2.6 §3, §7, §8.2, §8.3.

const level = realLevel("2.6");
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced (the layout, and so every line number, stays). */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");

const grade = (editorText: string) => {
  const report = runHarness(level, editorText);
  return { report, outcome: classifyRun({ kind: "ok", data: report }, level), counts: report.base_results.map((r) => r.line_count) };
};
const gradeFile = (name: string) => grade(readFixture(`2.6/${name}`));

const FIXTURES = readdirSync(new URL("../fixtures/solutions/2.6/", import.meta.url))
  .filter((f) => f.endsWith(".py"))
  .map((f) => f.slice(0, -3));

describe("level 2.6 starter chain", () => {
  test("starter code: TypeError on line 5 in situation 1, after both lines were read", () => {
    const { outcome, counts } = grade(level.starter_code);
    expect(outcome).toMatchObject({ key: "TypeError", stars: 0, details: { line: 5, round: 1 } });
    expect(outcome.stdinRead).toBe(2);
    expect(counts).toEqual([3, 3, 3, 3]);
  });

  test("battery read as a number: situation 4 gets another situation's decision, lines 7, 8, 10 never ran", () => {
    const { outcome, counts } = grade(withLines({ 3: "pin = int(input())" }));
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 4, out_line: 1 } });
    expect(outcome.output!.lines[0].actual).toBe("LENH: DI");
    expect(counts).toEqual([5, 4, 5, 4]);
    expect(outcome.skippedLines).toEqual([7, 8, 10]);
    expect(outcome.skippedRound).toBe(4);
  });

  test("flat chain with the launch code first still fails situation 4", () => {
    const { outcome, counts } = gradeFile("flat-command-first");
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 4 } });
    expect(counts).toEqual([4, 5, 5, 5]);
  });
});

describe("level 2.6 three-star solutions", () => {
  test.each([
    ["three-star", 5],
    ["three-star-not-empty", 5],
    ["three-star-elif-outer", 5],
    ["three-star-flat-and", 5],
    ["three-star-assign-then-print", 6],
    ["three-star-read-battery-late", 4],
  ])("%s: 3 stars in %i statements", (name, statements) => {
    const { outcome } = gradeFile(name);
    expect(outcome).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: statements });
  });

  test("reading the battery only when the command slot is empty leaves line 2 of stdin unread where a command exists", () => {
    const { report } = gradeFile("three-star-read-battery-late");
    expect(report.base_results.map((r) => r.stdin_read)).toEqual([1, 2, 2, 1]);
  });
});

describe("level 2.6 mutation table", () => {
  // GDD §8.2: key, stars, base statement counts, and the failing base situation (`round`) or error line.
  const CASES: [string, { key: string; stars: number; counts: number[]; round?: number; line?: number }][] = [
    ["hardcoded", { key: "wrong_branch", stars: 0, counts: [3, 3, 3, 3], round: 2 }],
    ["flat-forgot-not", { key: "wrong_branch", stars: 0, counts: [4, 5, 5, 5], round: 2 }],
    ["flat-or-for-and", { key: "wrong_branch", stars: 0, counts: [4, 5, 5, 5], round: 3 }],
    ["inverted-has-command", { key: "wrong_branch", stars: 0, counts: [5, 5, 5, 5], round: 1 }],
    ["compare-with-space", { key: "wrong_branch", stars: 0, counts: [5, 5, 5, 5], round: 2 }],
    ["compare-with-none", { key: "wrong_branch", stars: 0, counts: [5, 5, 5, 5], round: 2 }],
    ["inner-else-dedented", { key: "wrong_branch", stars: 0, counts: [5, 4, 4, 4], round: 2 }],
    ["battery-block-indented", { key: "wrong_branch", stars: 0, counts: [6, 4, 4, 7], round: 2 }],
    ["missing-inner-else", { key: "output_missing", stars: 0, counts: [5, 5, 5, 4], round: 4 }],
    ["separate-ifs-print", { key: "alert_exceeded", stars: 1, counts: [7, 7, 7, 7] }],
    ["default-then-elif", { key: "alert_exceeded", stars: 1, counts: [6, 7, 6, 6] }],
    ["default-then-two-ifs", { key: "alert_exceeded", stars: 1, counts: [7, 7, 6, 6] }],
    ["read-order-swapped", { key: "ValueError", stars: 0, counts: [1, 1, 1, 1], round: 1, line: 2 }],
    ["input-prompt", { key: "output_has_prompt", stars: 0, counts: [5, 5, 5, 5], round: 1 }],
    ["extra-input-read", { key: "EOFError", stars: 0, counts: [5, 4, 4, 5], round: 2, line: 11 }],
  ];

  test.each(CASES)("%s", (name, want) => {
    const { outcome, counts } = gradeFile(name);
    expect(outcome).toMatchObject({ key: want.key, stars: want.stars });
    expect(counts).toEqual(want.counts);
    if (want.round !== undefined) expect(outcome.details.round).toBe(want.round);
    if (want.line !== undefined) expect(outcome.details.line).toBe(want.line);
  });

  test("swapped reads: int() is asked to read the launch code", () => {
    expect(gradeFile("read-order-swapped").outcome.error?.message).toContain("'XUAT KICH'");
  });

  test.each([
    ["two-star-boundary", [5, 5, 5, 5], 0],
    ["two-star-listed-commands", [4, 6, 6, 5], 2],
    ["two-star-listed-battery-first", [6, 5, 6, 4], 1],
  ])("%s: passes the base run, the counter-attack gets another situation's decision", (name, counts, counterIndex) => {
    const { outcome, counts: got, report } = gradeFile(name as string);
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 2, basePassed: true, counterSurvived: false });
    expect(outcome.details.round).toBeUndefined();
    expect(got).toEqual(counts);
    expect(report.counter_results!.findIndex((r) => r.output?.ok === false)).toBe(counterIndex);
  });

  test("a lone space reaches the code verbatim as the counter-attack's command", () => {
    const { outcome } = gradeFile("two-star-listed-commands");
    expect(outcome.counterStdin).toEqual([" ", "10"]);
    expect(outcome.counterOutput!.lines[0].actual).toBe("LENH: DI");
  });

  test("no mutation earns 3 stars; hard-coding earns none", () => {
    for (const name of FIXTURES.filter((f) => !f.startsWith("three-star"))) {
      expect(gradeFile(name).outcome.stars, name).toBeLessThan(3);
    }
    expect(gradeFile("hardcoded").outcome.stars).toBe(0);
  });
});

describe("level 2.6 threshold", () => {
  test("nested, assign then print once: 3 stars with 6 statements; separate ifs printing directly: 1 star with 7", () => {
    expect(gradeFile("three-star-assign-then-print")).toMatchObject({ outcome: { stars: 3 }, counts: [6, 6, 6, 6] });
    expect(gradeFile("separate-ifs-print").outcome).toMatchObject({ key: "alert_exceeded", stars: 1, baseLineCount: 7 });
  });
});

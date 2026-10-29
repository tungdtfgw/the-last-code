import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import type { HarnessReport } from "../../src/engine/harness-types";
import { classifyRun, type RunOutcome } from "../../src/game/classify-run";
import { buildTerminalLines } from "../../src/game/terminal-lines";
import { readFixture, runHarness } from "./run-harness";

// Level 2.4 through the real harness (python3): GDD 2.4 §5.1, §8.2, §8.3, §9.

const level = realLevel("2.4");

function run(name: string): { o: RunOutcome; report: HarnessReport } {
  const report = runHarness(level, readFixture(`2.4/${name}`));
  return { o: classifyRun({ kind: "ok", data: report }, level), report };
}

const baseCounts = (report: HarnessReport) => (report.base_results ?? []).map((r) => r.line_count);

describe("level 2.4: the turns of GDD §5.1", () => {
  test("starter code: situation 1 prints the level of situation 3; only lines 5 and 6 ran", () => {
    const { o } = run("original");
    expect(o).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 1, out_line: 1, col: 6 }, skippedLines: [7, 8, 9, 10, 12] });
    const terminal = buildTerminalLines(o, level, 1).map((l) => l.text);
    const skipped = terminal.indexOf("> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 7, 8, 9, 10, 12");
    expect(skipped).toBeGreaterThan(-1);
    expect(skipped).toBe(terminal.length - 2);
  });

  test("one branch moved up, not far enough: still wrong_branch at situation 1", () => {
    expect(run("swap-first-two").o).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 1 } });
  });

  test("right order with the `<=` left at 50: 2 stars, the counter-attack at 50 m gets the next level down", () => {
    const { o } = run("two-star");
    expect(o).toMatchObject({ key: "wrong_branch", stars: 2, basePassed: true, baseLineCount: 4, counterInputs: { khoang_cach: 50 } });
    expect(o.details.round).toBeUndefined();
    expect(o.counterOutput?.lines[0]).toMatchObject({ expected: "MUC: CANH GIAC", actual: "MUC: NGUY HIEM" });
  });

  test("`<=` fixed: 3 stars", () => {
    expect(run("three-star").o).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true });
  });
});

type Row = {
  file: string;
  key: string;
  stars: number;
  details?: Record<string, number>;
  counts?: number[];
  /** `null`: no line of the shown situation was skipped (the field is absent). */
  skipped?: number[] | null;
  /** Value of `khoang_cach` in the counter-attack test that failed. */
  counterAt?: number;
};

// GDD §8.2 (rows 1–19) and the 3-star solutions of §8.3.
const ROWS: Row[] = [
  { file: "original", key: "wrong_branch", stars: 0, details: { round: 1, out_line: 1, col: 6 }, counts: [2, 2, 2, 4], skipped: [7, 8, 9, 10, 12] },
  { file: "reversed-all-lt", key: "wrong_branch", stars: 0, details: { round: 1 }, counts: [2, 2, 2, 4], skipped: [7, 8, 9, 10, 12] },
  { file: "swap-first-two", key: "wrong_branch", stars: 0, details: { round: 1 }, counts: [2, 2, 4, 4], skipped: [7, 8, 9, 10, 12] },
  { file: "two-star", key: "wrong_branch", stars: 2, counts: [2, 3, 4, 4], counterAt: 50 },
  { file: "all-le", key: "wrong_branch", stars: 2, counts: [2, 3, 4, 4], counterAt: 20 },
  { file: "far-first-gt", key: "wrong_branch", stars: 2, counts: [4, 4, 3, 2], counterAt: 20 },
  { file: "hardcode-case-1", key: "wrong_branch", stars: 0, details: { round: 2 }, counts: [1, 1, 1, 1], skipped: null },
  { file: "hardcode-by-values", key: "wrong_branch", stars: 2, counts: [2, 3, 4, 4], counterAt: 20 },
  { file: "separate-ifs-print", key: "output_extra", stars: 0, details: { count: 2, round: 1 }, counts: [6, 5, 4, 4], skipped: [12] },
  { file: "half-chain-split", key: "output_extra", stars: 0, details: { count: 1, round: 1 }, counts: [4, 5, 4, 4], skipped: [7, 8, 12] },
  { file: "separate-ifs-overwrite-wide-first", key: "alert_exceeded", stars: 1, details: { count: 8 }, counts: [8, 7, 6, 5], skipped: null },
  { file: "separate-ifs-overwrite-narrow-first", key: "wrong_branch", stars: 0, details: { round: 1 }, counts: [8, 7, 6, 5], skipped: null },
  { file: "default-then-elif-no-else", key: "alert_exceeded", stars: 1, details: { count: 6 }, counts: [4, 5, 6, 5] },
  { file: "three-branches-no-else", key: "NameError", stars: 0, details: { line: 11, round: 4 }, counts: [3, 4, 5, 4] },
  { file: "print-inside-else", key: "output_missing", stars: 0, details: { round: 1 }, counts: [2, 3, 4, 5], skipped: [7, 8, 9, 10, 12, 13] },
  { file: "elif-body-not-indented", key: "IndentationError", stars: 0, details: { line: 8 } },
  // The message differs between 3.13 and 3.14; only the key and the line are checked.
  { file: "elif-after-else", key: "SyntaxError", stars: 0, details: { line: 9 } },
  { file: "missing-colon", key: "SyntaxError", stars: 0, details: { line: 5 } },
  { file: "typo-no-space", key: "output_mismatch", stars: 0, details: { col: 5, round: 1 }, counts: [2, 3, 4, 4], skipped: [7, 8, 9, 10, 12] },
  { file: "three-star", key: "three_stars", stars: 3, counts: [2, 3, 4, 4], skipped: [7, 8, 9, 10, 12] },
  { file: "three-star-assign", key: "three_stars", stars: 3, counts: [3, 4, 5, 5], skipped: [7, 8, 9, 10, 12] },
  { file: "three-star-far-first", key: "three_stars", stars: 3, counts: [4, 4, 3, 2], skipped: [6, 8, 10] },
  { file: "three-star-ternary", key: "three_stars", stars: 3, counts: [1, 1, 1, 1], skipped: null },
  { file: "three-star-range-and", key: "three_stars", stars: 3, counts: [5, 5, 5, 5] },
];

describe("level 2.4: mutation table (GDD §8.2) and 3-star solutions (§8.3)", () => {
  test.each(ROWS)("$file: $key, $stars star(s)", (row) => {
    const { o, report } = run(row.file);
    expect(o.key).toBe(row.key);
    expect(o.stars).toBe(row.stars);
    if (row.details) expect(o.details).toMatchObject(row.details);
    if (row.counts) expect(baseCounts(report)).toEqual(row.counts);
    if (row.skipped === null) expect(o.skippedLines).toBeUndefined();
    else if (row.skipped) expect(o.skippedLines).toEqual(row.skipped);
    if (row.counterAt !== undefined) {
      expect(o.basePassed).toBe(true);
      expect(o.counterInputs).toEqual({ khoang_cach: row.counterAt });
      expect(o.details.round).toBeUndefined();
    }
  });

  test("print(\"MUC: {muc}\") without the f: output_mismatch at position 6, not output_is_label", () => {
    expect(run("missing-f").o).toMatchObject({ key: "output_mismatch", details: { out_line: 1, col: 6, round: 1 } });
  });
});

describe("level 2.4: the alert limit of 5 (GDD §8.3)", () => {
  test("print in every branch (4) and assign then print once (5) both get 3 stars", () => {
    expect(run("three-star").o).toMatchObject({ stars: 3, baseLineCount: 4 });
    expect(run("three-star-assign").o).toMatchObject({ stars: 3, baseLineCount: 5 });
  });

  test("separate ifs that overwrite (8) and a default before an elif chain without else (6) get 1 star", () => {
    expect(run("separate-ifs-overwrite-wide-first").o).toMatchObject({ key: "alert_exceeded", stars: 1, baseLineCount: 8 });
    expect(run("default-then-elif-no-else").o).toMatchObject({ key: "alert_exceeded", stars: 1, baseLineCount: 6 });
  });
});

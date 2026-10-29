import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun, type OutcomeDetails, type RunOutcome } from "../../src/game/classify-run";
import { buildTerminalLines } from "../../src/game/terminal-lines";
import { readFixture, runHarness } from "./run-harness";

// Level 2.3 through the real harness (python3): GDD 2.3 §5.1, §8, §8.2, §8.3, §9.
// Every fixture is the whole editor; lines 1–4 are the starter's, the body starts on line 5.

const level = realLevel("2.3");

function run(name: string) {
  const data = runHarness(level, readFixture(`2.3/${name}`));
  const outcome = classifyRun({ kind: "ok", data }, level);
  return { outcome, counts: data.base_results.map((r) => r.line_count) };
}

const terminal = (o: RunOutcome) => buildTerminalLines(o, level, 1).map((l) => l.text);

interface Row {
  file: string;
  key: string;
  stars: number;
  details?: OutcomeDetails;
  /** Statements in the three base situations (empty when the code never ran). */
  counts: number[];
  /** Dimmed lines of the shown situation; `null` when the run leaves none. */
  skipped?: number[] | null;
}

// GDD §8.2 (rows 1–19) and §8.3 (the five three-star solutions).
const ROWS: Row[] = [
  { file: "original", key: "output_missing", stars: 0, details: { out_line: 1, round: 1 }, counts: [3, 4, 2], skipped: [8, 9] },
  { file: "starter-dedent", key: "missing_var", stars: 0, details: { vars: "huong", round: 3 }, counts: [4, 4, 3], skipped: [6, 8] },
  { file: "two-ifs-complement", key: "alert_exceeded", stars: 1, counts: [4, 4, 4], skipped: [8] },
  { file: "two-ifs-overlap", key: "alert_exceeded", stars: 1, counts: [4, 4, 5], skipped: [8] },
  { file: "two-ifs-overlap-reversed", key: "wrong_branch", stars: 0, details: { vars: "huong", round: 3 }, counts: [4, 4, 5], skipped: null },
  { file: "default-override-ge", key: "alert_exceeded", stars: 1, counts: [3, 4, 4], skipped: [7] },
  { file: "default-override-gt", key: "wrong_branch", stars: 0, details: { vars: "huong", round: 3 }, counts: [3, 4, 3], skipped: [7] },
  { file: "boundary-le", key: "wrong_branch", stars: 0, details: { vars: "huong", round: 3 }, counts: [3, 3, 3], skipped: [8] },
  { file: "inverted-values", key: "wrong_branch", stars: 0, details: { vars: "huong", round: 1 }, counts: [3, 3, 3], skipped: [8] },
  { file: "hardcode-no-if", key: "wrong_branch", stars: 0, details: { vars: "huong", round: 2 }, counts: [2, 2, 2], skipped: null },
  { file: "two-star", key: "wrong_branch", stars: 2, details: { vars: "huong" }, counts: [3, 3, 3] },
  { file: "threshold-lt-50", key: "wrong_branch", stars: 2, details: { vars: "huong" }, counts: [3, 3, 3] },
  { file: "hardcode-line-45", key: "wrong_branch", stars: 0, details: { out_line: 1, round: 2 }, counts: [3, 3, 3], skipped: [6] },
  { file: "print-inside-else", key: "output_missing", stars: 0, details: { out_line: 1, round: 1 }, counts: [2, 3, 3], skipped: [8, 9] },
  { file: "else-body-not-indented", key: "IndentationError", stars: 0, details: { line: 8 }, counts: [] },
  { file: "else-with-condition", key: "SyntaxError", stars: 0, details: { line: 7 }, counts: [] },
  { file: "assign-in-condition", key: "SyntaxError", stars: 0, details: { line: 5 }, counts: [] },
  { file: "missing-f", key: "output_is_label", stars: 0, details: { out_line: 1, round: 1 }, counts: [3, 3, 3], skipped: [8] },
  { file: "print-huong-extra", key: "output_mismatch", stars: 0, details: { out_line: 1, col: 1, round: 1 }, counts: [4, 4, 4], skipped: [8] },
  { file: "three-star", key: "three_stars", stars: 3, counts: [3, 3, 3], skipped: [8] },
  { file: "three-star-ge-first", key: "three_stars", stars: 3, counts: [3, 3, 3], skipped: [6] },
  { file: "three-star-print-both", key: "three_stars", stars: 3, counts: [3, 3, 3], skipped: [9, 10] },
  { file: "three-star-ternary", key: "three_stars", stars: 3, counts: [2, 2, 2], skipped: null },
  { file: "three-star-print-comma", key: "three_stars", stars: 3, counts: [3, 3, 3] },
];

describe("level 2.3 grading pipeline", () => {
  test("starter code: situation 1 has the right direction but no angle line; lines 8, 9 never ran", () => {
    const { outcome: o } = run("original");
    expect(o).toMatchObject({ key: "output_missing", stars: 0, details: { round: 1, out_line: 1 }, skippedLines: [8, 9], skippedRound: 1 });
    // The decision chip is right, the situation still fails on the line.
    expect(o.vars.every((v) => v.valueOk)).toBe(true);
    // At 135 the second block runs, so situation 2 passes; at 90 nothing runs at all.
    expect(o.rounds!.map((r) => r.passed)).toEqual([false, true, false]);
    expect(terminal(o)).toContain("> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8, 9");
  });

  test("angle line moved out of the block: situations 1, 2 pass, at 90 no branch assigns huong", () => {
    const { outcome: o } = run("starter-dedent");
    expect(o).toMatchObject({ key: "missing_var", details: { vars: "huong", round: 3 }, skippedLines: [6, 8], skippedRound: 3 });
    expect(o.rounds!.map((r) => r.passed)).toEqual([true, true, false]);
    expect(terminal(o)).toContain("> KHÔNG CHẠY Ở TÌNH HUỐNG 3: dòng 6, 8");
  });

  test.each(ROWS)("$file: $key, $stars stars, statements $counts", ({ file, key, stars, details, counts, skipped }) => {
    const { outcome: o, counts: measured } = run(file);
    expect(o.key).toBe(key);
    expect(o.stars).toBe(stars);
    if (details) expect(o.details).toMatchObject(details);
    expect(measured).toEqual(counts);
    if (skipped === null) expect(o.skippedLines ?? []).toEqual([]);
    else if (skipped) expect(o.skippedLines).toEqual(skipped);
  });

  test.each([
    ["two-star", 10],
    ["threshold-lt-50", 89],
  ])("%s passes the base situations and falls at counter angle %i with the other direction", (file, angle) => {
    const { outcome: o } = run(file);
    expect(o).toMatchObject({ basePassed: true, counterSurvived: false, counterInputs: { goc_den: angle } });
    expect(o.details.round).toBeUndefined();
    expect(o.counterVars?.[0]).toMatchObject({ name: "huong", preview: "'SANG TRAI'", valueOk: false });
  });

  test("no mutation earns three stars; two separate ifs and default-then-override stop at one", () => {
    const solutions = ROWS.filter((r) => r.file.startsWith("three-star"));
    expect(solutions).toHaveLength(5);
    for (const r of ROWS.filter((r) => !solutions.includes(r))) expect(r.stars, r.file).toBeLessThan(3);
    for (const f of ["two-ifs-complement", "two-ifs-overlap", "default-override-ge"]) expect(ROWS.find((r) => r.file === f)?.stars).toBe(1);
  });
});

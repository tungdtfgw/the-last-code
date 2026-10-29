import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { buildTerminalLines } from "../../src/game/terminal-lines";
import { readFixture, runHarness } from "./run-harness";

// Level 2.1 through the real harness (python3): GDD 2.1 §5.1, §8.2, §8.3, §9, §11.

const level = realLevel("2.1");

function run(name: string) {
  const report = runHarness(level, readFixture(`2.1/${name}`));
  const outcome = classifyRun({ kind: "ok", data: report }, level);
  const counts = report.compile_error ? null : report.base_results.map((r) => r.line_count);
  return { outcome, counts };
}

const ALL = "trong_tam, dang_quet, het_pin";

/** One row per mutation (GDD §8.2): reaction key, stars, details, statements per base test. */
const CASES: { file: string; key: string; stars: number; details?: Record<string, unknown>; counts: number[] | null }[] = [
  { file: "original", key: "TypeError", stars: 0, details: { line: 10, round: 1 }, counts: [3, 3] },
  { file: "turn-2-fix-pin", key: "type_mismatch", stars: 0, details: { vars: "dang_quet", round: 1 }, counts: [3, 3] },
  { file: "turn-2b-fix-eq-only", key: "TypeError", stars: 0, details: { line: 10 }, counts: [3, 3] },
  { file: "boundary-lt", key: "wrong_value", stars: 0, details: { vars: "trong_tam", round: 1 }, counts: [3, 3] },
  { file: "three-star", key: "three_stars", stars: 3, counts: [3, 3] },
  { file: "three-star-mirror", key: "three_stars", stars: 3, counts: [3, 3] },
  { file: "three-star-not", key: "three_stars", stars: 3, counts: [3, 3] },
  { file: "three-star-pin-le-19", key: "three_stars", stars: 3, counts: [3, 3] },
  { file: "three-star-eq-true", key: "three_stars", stars: 3, counts: [3, 3] },
  { file: "two-star", key: "wrong_value_counter", stars: 2, details: { vars: "dang_quet" }, counts: [3, 3] },
  { file: "boundary-pin-le", key: "wrong_value", stars: 0, details: { vars: "het_pin", round: 1 }, counts: [3, 3] },
  { file: "reversed-gt", key: "wrong_value", stars: 0, details: { vars: "trong_tam", round: 1 }, counts: [3, 3] },
  { file: "flipped-ge", key: "wrong_value", stars: 0, details: { vars: "trong_tam", round: 2 }, counts: [3, 3] },
  { file: "reversed-pin-gt", key: "wrong_value", stars: 0, details: { vars: "het_pin", round: 2 }, counts: [3, 3] },
  { file: "syntax-assign-in-parens", key: "SyntaxError", stars: 0, details: { line: 9 }, counts: null },
  { file: "lowercase-quet", key: "wrong_value", stars: 0, details: { vars: "dang_quet", round: 1 }, counts: [3, 3] },
  { file: "name-as-text", key: "wrong_value", stars: 0, details: { vars: "dang_quet", round: 1 }, counts: [3, 3] },
  { file: "string-true", key: "type_mismatch_value_match", stars: 0, details: { vars: "dang_quet" }, counts: [3, 3] },
  { file: "hardcode-case-1", key: "wrong_value", stars: 0, details: { vars: ALL, round: 2 }, counts: [3, 3] },
  { file: "hardcode-case-1-str", key: "type_mismatch_value_match", stars: 0, details: { vars: ALL, round: 1 }, counts: [3, 3] },
  { file: "chained-compare", key: "wrong_value", stars: 0, details: { vars: "trong_tam", round: 1 }, counts: [3, 3] },
  { file: "hardcode-range-30", key: "wrong_value_counter", stars: 2, details: { vars: "trong_tam" }, counts: [3, 3] },
  { file: "hardcode-pin-8", key: "wrong_value_counter", stars: 2, details: { vars: "het_pin" }, counts: [3, 3] },
  { file: "hardcode-pin-eq-7", key: "wrong_value_counter", stars: 2, details: { vars: "het_pin" }, counts: [3, 3] },
  { file: "if-style", key: "alert_exceeded", stars: 1, counts: [5, 4] },
  { file: "extra-print", key: "alert_exceeded", stars: 1, counts: [4, 4] },
  { file: "indent-extra", key: "IndentationError", stars: 0, details: { line: 9 }, counts: null },
];

describe("level 2.1 grading pipeline", () => {
  test.each(["original", "turn-2-fix-pin", "boundary-lt", "three-star"])(
    "turn chain (%s): straight-line code never dims a line",
    (name) => {
      const { outcome } = run(name);
      expect(outcome.skippedLines).toBeUndefined();
      const terminal = buildTerminalLines(outcome, level, 1).map((l) => l.text);
      expect(terminal.some((t) => t.includes("KHÔNG CHẠY"))).toBe(false);
    },
  );

  test.each(CASES)("$file → $key, $stars stars", ({ file, key, stars, details, counts }) => {
    const r = run(file);
    expect(r.outcome).toMatchObject({ key, stars, ...(details ? { details } : {}) });
    expect(r.counts).toEqual(counts);
  });

  test("only the three-star solutions reach 3 stars", () => {
    expect(CASES.filter((c) => c.stars === 3).every((c) => c.file.startsWith("three-star"))).toBe(true);
    expect(CASES.filter((c) => !c.file.startsWith("three-star")).every((c) => c.stars < 3)).toBe(true);
  });

  test("no wrong_branch line: a wrong bool flag keeps the general keys", () => {
    expect(level.reactions.wrong_branch).toBeUndefined();
    expect(run("two-star").outcome.key).toBe("wrong_value_counter");
    expect(run("hardcode-case-1").outcome.key).toBe("wrong_value");
  });

  test("the 2-star solution falls to counter-attack 1 and its details carry no round", () => {
    const { outcome } = run("two-star");
    expect(outcome.counterSurvived).toBe(false);
    expect(outcome.counterInputs).toMatchObject({ che_do: "TUAN TRA" });
    expect(outcome.details.round).toBeUndefined();
  });
});

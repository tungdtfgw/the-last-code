import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { runHarness } from "./run-harness";

// Boss 1.7 through the real harness (python3): three scan rounds are the three base
// tests, the night guard's hand check is the counter-attack. GDD 1.7 §3, §6, §7, §12.

const level = realLevel("1.7");
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced (the layout, and so every line number, stays). */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
const grade = (editorText: string) => classifyRun({ kind: "ok", data: runHarness(level, editorText) }, level);

const TWO_STAR = {
  8: "ma_hoi = int(input())",
  9: "muc = int(input())",
  12: 'print(f"HO SO: {ho_ten} / {ma_khu}")',
  13: 'print("KHUON:", type(ma_phien))',
  14: 'print(f"SINH TRAC: {round(float(chieu_cao) * 2, 2)}")',
  15: 'print(f"NANG LUONG: {muc // 100} PIN + {muc % 100}")',
};
const THREE_STAR = { ...TWO_STAR, 9: "muc = int(float(input()))" };

describe("level 1.7 grading pipeline", () => {
  test("starter code: round 1 breaks with TypeError on line 15, lines 1 and 3 already pass", () => {
    const o = grade(level.starter_code);
    expect(o).toMatchObject({ key: "TypeError", stars: 0, basePassed: false, details: { line: 15, round: 1 } });
    expect(o.rounds).toHaveLength(3);
    expect(o.rounds![0].output!.lines.map((l) => l.status)).toEqual(["ok", "wrong", "ok", "wrong", "missing", "missing"]);
  });

  test("two-star solution: three rounds pass in 8 statements, the hand check breaks on 1500.0", () => {
    const o = grade(withLines(TWO_STAR));
    expect(o).toMatchObject({ key: "counter_ValueError", stars: 2, basePassed: true, baseLineCount: 8, details: { line: 9 } });
    expect(o.rounds!.every((r) => r.passed)).toBe(true);
    expect(o.counterStdin).toEqual([" 4172", "1500.0"]);
  });

  test("three-star solution: the hand check passes", () => {
    const o = grade(withLines(THREE_STAR));
    expect(o).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 8 });
  });

  test("hand-copied shape, the rest right: round 2 rejects line 3", () => {
    const o = grade(withLines({ ...THREE_STAR, 13: "print(\"KHUON:\", \"<class 'int'>\")" }));
    expect(o).toMatchObject({ key: "output_mismatch", stars: 0, details: { round: 2, out_line: 3 } });
    expect(o.rounds!.map((r) => r.passed)).toEqual([true, false, false]);
  });

  test("forgot to round: round 3 rejects line 4", () => {
    const o = grade(withLines({ ...THREE_STAR, 14: 'print(f"SINH TRAC: {float(chieu_cao) * 2}")' }));
    expect(o).toMatchObject({ key: "output_mismatch", details: { round: 3, out_line: 4 } });
    expect(o.output!.lines[3].actual).toBe("SINH TRAC: 3.306");
  });
});

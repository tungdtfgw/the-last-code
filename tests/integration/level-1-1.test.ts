import { describe, expect, test } from "vitest";
import levelJson from "../../src/levels/level-1-1.json";
import { classifyRun } from "../../src/game/classify-run";
import type { LevelDefinition } from "../../src/game/level-types";
import { runHarness } from "./run-harness";

// Level 1.1 through the real harness (python3): GDD 1.1 §6, §7, §13.

const level = levelJson as unknown as LevelDefinition;
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced. */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
/** Keep lines 1–5 (comments and the locked line), then `body`. */
const withBody = (body: string) => [...STARTER.slice(0, 5), body].join("\n");
const grade = (editorText: string) => classifyRun({ kind: "ok", data: runHarness(level, editorText) }, level);
const statuses = (o: ReturnType<typeof grade>) => o.output?.lines.map((l) => l.status);

const FIX_7 = 'print("PHIEN", ma_phien)';
const FIX_8 = 'print("LO17 CAN LIEN LAC")';

describe("level 1.1 grading pipeline", () => {
  test("starter code: NameError on line 7, line 1 already sent, 2–3 missing", () => {
    const o = grade(level.starter_code);
    expect(o).toMatchObject({ key: "NameError", stars: 0 });
    expect(o.error?.line).toBe(7);
    expect(statuses(o)).toEqual(["ok", "missing", "missing"]);
  });

  test("line 7 fixed, line 8 still lower case → output_case_only on line 3, col 1", () => {
    const o = grade(withLines({ 7: FIX_7 }));
    expect(o.key).toBe("output_case_only");
    expect(o.details).toMatchObject({ out_line: 3, col: 1 });
  });

  test.each([
    ["comma", FIX_7],
    ["+", 'print("PHIEN " + ma_phien)'],
  ])("three stars with %s, 3 statements", (_name, line7) => {
    const o = grade(withLines({ 7: line7, 8: FIX_8 }));
    expect(o).toMatchObject({ key: "three_stars", stars: 3, baseLineCount: 3, counterSurvived: true });
  });

  test("hard-coded session code: base passes (2 stars), counter-attack breaks line 2", () => {
    const o = grade(withLines({ 7: 'print("PHIEN K7Q2")', 8: FIX_8 }));
    expect(o).toMatchObject({ key: "wrong_value_counter", stars: 2 });
    expect(o.details.out_line).toBe(2);
    expect(o.counterOutput?.lines[1]).toMatchObject({ status: "wrong", expected: "PHIEN M4X8", actual: "PHIEN K7Q2", col: 7 });
  });

  test("trailing space and a final print() are accepted; a leading space is not", () => {
    expect(grade(withLines({ 6: 'print("NID/2089 ")', 7: FIX_7, 8: `${FIX_8}\nprint()` })).stars).toBe(3);
    const o = grade(withLines({ 6: 'print(" NID/2089")', 7: FIX_7, 8: FIX_8 }));
    expect(o.key).toBe("output_mismatch");
    expect(o.details).toMatchObject({ out_line: 1, col: 1 });
  });

  test("the name of the session code inside the quotes → output_is_label on line 2", () => {
    for (const line7 of ['print("PHIEN ma_phien")', 'print("PHIEN", "ma_phien")']) {
      const o = grade(withLines({ 7: line7, 8: FIX_8 }));
      expect(o).toMatchObject({ key: "output_is_label", stars: 0, details: { out_line: 2, col: 7 } });
    }
    // A wrong line that does not carry the name stays a plain mismatch.
    expect(grade(withLines({ 7: 'print("PHIEN K7Q3")', 8: FIX_8 })).key).toBe("output_mismatch");
  });

  test("one line too many → output_extra with count 1", () => {
    const o = grade(withLines({ 7: FIX_7, 8: `${FIX_8}\nprint("XIN CHAO")` }));
    expect(o.key).toBe("output_extra");
    expect(o.details.count).toBe(1);
  });

  test("line 8 deleted → missing from line 3; everything deleted → missing from line 1", () => {
    expect(grade(withLines({ 7: FIX_7, 8: "" }))).toMatchObject({ key: "output_missing", details: { out_line: 3 } });
    expect(grade(withBody(""))).toMatchObject({ key: "output_missing", details: { out_line: 1 } });
  });

  test("all three lines right, then 1/0 → ZeroDivisionError, 0 stars, output still reported", () => {
    const o = grade(withLines({ 7: FIX_7, 8: `${FIX_8}\n1 / 0` }));
    expect(o).toMatchObject({ key: "ZeroDivisionError", stars: 0 });
    expect(statuses(o)).toEqual(["ok", "ok", "ok"]);
  });
});

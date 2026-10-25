import { describe, expect, test } from "vitest";
import levelJson from "../../src/levels/level-1-3.json";
import { classifyRun } from "../../src/game/classify-run";
import type { LevelDefinition } from "../../src/game/level-types";
import { runHarness } from "./run-harness";

// Level 1.3 through the real harness (python3): GDD 1.3 §6, §7, §8, §13 #1 #2 #3 #5 #6.

const level = levelJson as unknown as LevelDefinition;
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced (the layout, and so every line number, stays). */
const withLines13 = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
const grade = (editorText: string) => classifyRun({ kind: "ok", data: runHarness(level, editorText) }, level);

/** Every field rewritten in its shape; `khuon_phien` still as in the starter code. */
const FIELDS = { 6: "tuoi = 27", 7: "chieu_cao = 1.72", 8: "da_tiem = True" };
const TWO_STAR = { ...FIELDS, 14: "khuon_phien = int" };
const THREE_STAR = { ...FIELDS, 14: "khuon_phien = type(ma_phien)" };

describe("level 1.3 grading pipeline", () => {
  test("starter code: wrong shapes, 0 stars, no error, the type() probe printed, chieu_cao a tuple", () => {
    const o = grade(level.starter_code);
    expect(o).toMatchObject({ key: "type_mismatch", stars: 0, stdout: "<class 'str'>\n", baseLineCount: 6 });
    expect(o.error).toBeUndefined();
    expect(o.details.vars).toBe("tuoi, chieu_cao, da_tiem, khuon_phien");
    const v = Object.fromEntries(o.vars.map((x) => [x.name, x]));
    expect(v.ho_ten).toMatchObject({ typeOk: true, valueOk: true });
    expect(v.chieu_cao).toMatchObject({ type: "tuple", preview: "<tuple>" });
    expect(v.khuon_phien).toMatchObject({ type: "int", preview: "4096" });
  });

  test.each([
    ["only the comma left", { ...THREE_STAR, 7: "chieu_cao = 1,72" }, "type_mismatch_unknown_shape", "chieu_cao"],
    ["only the quoted age left", { ...THREE_STAR, 6: 'tuoi = "27"' }, "type_mismatch_value_match", "tuoi"],
    ["the shape's name as text", { ...FIELDS, 14: "khuon_phien = \"<class 'int'>\"" }, "type_mismatch_value_match", "khuon_phien"],
  ])("%s → %s", (_name, changes, key, vars) => {
    expect(grade(withLines13(changes))).toMatchObject({ key, stars: 0, details: { vars } });
  });

  test("hand-copied shape (GDD §7): 2 stars in 6 statements, caught when the session code turns into a string", () => {
    const o = grade(withLines13(TWO_STAR));
    expect(o).toMatchObject({ key: "wrong_value_counter", stars: 2, basePassed: true, baseLineCount: 6, details: { vars: "khuon_phien" } });
    expect(o.counterInputs).toEqual({ ma_phien: "7351" });
    expect(o.counterVars?.find((v) => v.name === "khuon_phien")).toMatchObject({ typeOk: true, valueOk: false, preview: "<class 'int'>" });
  });

  test("asking the session code its shape: 3 stars", () => {
    const o = grade(withLines13(THREE_STAR));
    expect(o).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 6 });
    expect(o.baseLineCount).toBeLessThanOrEqual(level.alert_limit_statements);
    expect(o.counterVars?.find((v) => v.name === "khuon_phien")?.preview).toBe("<class 'str'>");
  });
});

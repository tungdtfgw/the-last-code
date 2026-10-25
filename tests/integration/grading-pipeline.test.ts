import { describe, expect, test } from "vitest";
import levelJson from "../../src/levels/level-1-4.json";
import type { LevelDefinition } from "../../src/game/level-types";
import { gradeFixture } from "./run-harness";

const level = levelJson as unknown as LevelDefinition;

describe("grading pipeline: editor text → prepareSource → python3 harness → classifyRun", () => {
  test("original starter: runs, wrong types, 201-char packet, no traceback (AC 1)", () => {
    const o = gradeFixture(level, "original");
    expect(o.key).toBe("type_mismatch");
    expect(o.stars).toBe(0);
    expect(o.error).toBeUndefined();
    const ma = o.vars.find((v) => v.name === "ma_xac_thuc")!;
    expect(ma.length).toBe(201);
    expect(ma.type).toBe("str");
    expect(o.vars.every((v) => v.type === "str")).toBe(true);
  });

  test("int(tuoi) * 100 + cap_do → TypeError on editor line 7 (AC 1b)", () => {
    const o = gradeFixture(level, "type-error");
    expect(o.key).toBe("TypeError");
    expect(o.error?.line).toBe(7);
    expect(o.error?.tracebackLines.at(-1)?.text).toContain("int(tuoi)");
  });

  test("float shape → type_mismatch_value_match", () => {
    expect(gradeFixture(level, "float-shape").key).toBe("type_mismatch_value_match");
  });

  test("GDD 6.6 → 2 stars, counter ValueError (AC 2, 12)", () => {
    const o = gradeFixture(level, "two-star");
    expect(o).toMatchObject({ key: "counter_ValueError", stars: 2, baseLineCount: 3, alertPercent: 15 });
    expect(o.error?.line).toBe(7);
  });

  test("GDD 6.7 → 3 stars (AC 3)", () => {
    expect(gradeFixture(level, "three-star")).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true });
  });

  test("hard-coded 2703 → fails the counter-attack (AC 4)", () => {
    expect(gradeFixture(level, "hardcoded")).toMatchObject({ key: "wrong_value_counter", stars: 2 });
  });

  test("re-assigning inputs is hard-coding", () => {
    expect(gradeFixture(level, "reassign-inputs")).toMatchObject({ key: "wrong_value_counter", stars: 2 });
  });

  test("correct but 9+ statements → 1 star", () => {
    const o = gradeFixture(level, "over-alert");
    expect(o.key).toBe("alert_exceeded");
    expect(o.stars).toBe(1);
    expect(o.alertPercent!).toBeGreaterThanOrEqual(45);
    expect(o.counterSurvived).toBe(true);
  });

  test("correct but > 20 statements → caught by the Sentinel, 0 stars, no counter", () => {
    const o = gradeFixture(level, "sentinel-caught");
    expect(o).toMatchObject({ key: "alert_exceeded", stars: 0, sentinelCaught: true, baseLineCount: 21 });
    expect(o.counterVars).toBeUndefined();
  });

  test("missing variable", () => {
    const o = gradeFixture(level, "missing-var");
    expect(o.key).toBe("missing_var");
    expect(o.details.vars).toBe("hop_le");
  });

  test("syntax error on the editor line", () => {
    const o = gradeFixture(level, "syntax-error");
    expect(o.key).toBe("SyntaxError");
    expect(o.error?.line).toBe(7);
  });

  test("name error", () => {
    const o = gradeFixture(level, "name-error");
    expect(o.key).toBe("NameError");
    expect(o.error?.line).toBe(7);
  });
});

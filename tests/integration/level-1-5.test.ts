import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun, type VarVerdict } from "../../src/game/classify-run";
import { runHarness } from "./run-harness";

// Level 1.5 through the real harness (python3): GDD 1.5 §3, §6, §7, §12.

const level = realLevel("1.5");
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced (the layout, and so every line number, stays). */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
const grade = (editorText: string) => classifyRun({ kind: "ok", data: runHarness(level, editorText) }, level);
const varOf = (vars: VarVerdict[] | undefined, name: string) => vars?.find((v) => v.name === name);

const ENERGY = { 8: "nang_luong = so_doan * dien_ap ** 2 - du_tru" };

describe("level 1.5 grading pipeline", () => {
  test("starter code lays out the three planted bugs on lines 8, 11 and 12", () => {
    expect([STARTER[7], STARTER[10], STARTER[11]]).toEqual([
      "nang_luong = so_doan * dien_ap ^ 2 - du_tru",
      "so_pin = nang_luong / dung_luong",
      "phan_le = nang_luong - so_pin",
    ]);
  });

  test("starter code: wrong shapes, 0 stars, no error, negative energy and a fractional cell count", () => {
    const o = grade(level.starter_code);
    expect(o).toMatchObject({ key: "type_mismatch", stars: 0, basePassed: false, baseLineCount: 3, details: { vars: "so_pin, phan_le" } });
    expect(o.error).toBeUndefined();
    expect(varOf(o.vars, "nang_luong")).toMatchObject({ type: "int", preview: "-106", typeOk: true, valueOk: false });
    expect(varOf(o.vars, "so_pin")).toMatchObject({ type: "float", preview: "-1.06" });
  });

  test.each([
    ["quotient and remainder operators", { 11: "so_pin = nang_luong // dung_luong", 12: "phan_le = nang_luong % dung_luong" }],
    ["int() of the true division plus a subtraction", { 11: "so_pin = int(nang_luong / dung_luong)", 12: "phan_le = nang_luong - so_pin * dung_luong" }],
  ])("%s: 3 stars in 3 statements", (_name, changes) => {
    const o = grade(withLines({ ...ENERGY, ...changes }));
    expect(o).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 3 });
    expect(varOf(o.counterVars, "so_pin")?.preview).toBe("13");
  });

  test("rounding instead of the quotient passes the base test, caught by the new load (14 cells)", () => {
    const o = grade(withLines({ ...ENERGY, 11: "so_pin = round(nang_luong / dung_luong)", 12: "phan_le = nang_luong - so_pin * dung_luong" }));
    expect(o).toMatchObject({ key: "wrong_value_counter", stars: 2, basePassed: true, counterSurvived: false });
    expect(o.counterInputs).toEqual({ so_doan: 7, dien_ap: 15, du_tru: 75, dung_luong: 110 });
    expect(varOf(o.counterVars, "so_pin")).toMatchObject({ preview: "14", valueOk: false });
  });

  test("hard-coded results: 2 stars, caught by the new load", () => {
    const o = grade(withLines({ 8: "nang_luong = 828", 11: "so_pin = 8", 12: "phan_le = 28" }));
    expect(o).toMatchObject({ key: "wrong_value_counter", stars: 2, basePassed: true });
  });

  test("energy turned into a float upstream: the quotient is 8.0, right number in the wrong shape", () => {
    const o = grade(
      withLines({ 8: "nang_luong = so_doan * dien_ap ** 2 / 1 - du_tru", 11: "so_pin = nang_luong // dung_luong", 12: "phan_le = nang_luong % dung_luong" }),
    );
    expect(o).toMatchObject({ key: "type_mismatch_value_match", stars: 0, details: { vars: "nang_luong, so_pin, phan_le" } });
    expect(varOf(o.vars, "so_pin")).toMatchObject({ type: "float", preview: "8.0" });
  });
});

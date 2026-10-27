import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { runHarness } from "./run-harness";

// Level 1.2 through the real harness (python3): GDD 1.2 §5, §6, §7, §14, §15 #1–5.

const level = realLevel("1.2");
const STARTER = level.starter_code.split("\n");

/** Starter code with some 1-based editor lines replaced. */
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
/** Keep lines 1–7 (comments and the locked buffer), then `body`. */
const withBody = (body: string) => [...STARTER.slice(0, 7), body].join("\n");
const grade = (editorText: string) => classifyRun({ kind: "ok", data: runHarness(level, editorText) }, level);
const steps = (h: { var: string; line: number | null; preview: string | null }[] | undefined) =>
  (h ?? []).map((e) => `${e.var} ${e.line} ${e.preview}`);

const FIX_NAME = { 13: 'the_quet = ho_ten + " / " + ma_khu' };
const FIX_QUOTE = { ...FIX_NAME, 10: "so_hieu = goi_3" };

const L12_THREE_STAR = [
  "ho_ten = goi_1",
  "ma_khu = goi_2",
  "so_hieu = goi_3",
  "khu_cu = ma_khu",
  "ma_khu = goi_4",
  'the_quet = ho_ten + " / " + ma_khu',
  'the_cong = so_hieu + " / " + ma_khu',
  "print(the_quet)",
  "print(the_cong)",
  "",
].join("\n");

describe("level 1.2 grading pipeline", () => {
  test("starter code: NameError on line 13 after 4 statements, 0 stars, history of lines 8–10", () => {
    const o = grade(level.starter_code);
    expect(o).toMatchObject({ key: "NameError", stars: 0, baseLineCount: 4 });
    expect(o.error?.line).toBe(13);
    expect(o.history?.map((e) => e.line)).toEqual([8, 9, 10]);
  });

  test("Ma_khu fixed: so_hieu holds the text of a name → value_is_label", () => {
    const o = grade(withLines(FIX_NAME));
    expect(o).toMatchObject({ key: "value_is_label", details: { vars: "so_hieu" } });
    expect(o.stdout).toContain("goi_3 / K-12");
  });

  test("quotes fixed, order still wrong: wrong_value on the log and both devices, history in run order", () => {
    const o = grade(withLines(FIX_QUOTE));
    expect(o).toMatchObject({ key: "wrong_value", details: { vars: "khu_cu, the_quet, the_cong" } });
    expect(steps(o.history)).toEqual([
      "ho_ten 8 'ĐỖ MINH AN'",
      "ma_khu 9 'K-12'",
      "so_hieu 10 'AN-5521'",
      "the_quet 13 'ĐỖ MINH AN / K-12'",
      "the_cong 14 'AN-5521 / K-12'",
      "ma_khu 17 'K-07'",
      "khu_cu 18 'K-07'",
    ]);
  });

  test("the zone reassigned before the log copies it: only khu_cu wrong, it holds the new zone → value_overwritten", () => {
    const body = L12_THREE_STAR.replace("khu_cu = ma_khu\nma_khu = goi_4", "ma_khu = goi_4\nkhu_cu = ma_khu");
    const o = grade(withBody(body));
    expect(o).toMatchObject({ key: "value_overwritten", stars: 0, details: { vars: "khu_cu" } });
  });

  test("three-star solution: 9 statements, the counter-attack copies the new buffer", () => {
    const o = grade(withBody(L12_THREE_STAR));
    expect(o).toMatchObject({ key: "three_stars", stars: 3, baseLineCount: 9, counterSurvived: true });
    expect(o.counterHistory?.find((e) => e.var === "so_hieu")).toMatchObject({ preview: "'LT-0093'", src: "goi_3" });
  });

  test.each([
    [
      "typed-in serial and new zone (GDD §6, 2 stars)",
      L12_THREE_STAR.replace("so_hieu = goi_3", 'so_hieu = "AN-5521"').replace("ma_khu = goi_4", 'ma_khu = "K-07"'),
      ["so_hieu", "ma_khu", "the_quet", "the_cong"],
    ],
    ["typed-in old zone in the log", L12_THREE_STAR.replace("khu_cu = ma_khu", 'khu_cu = "K-12"'), ["khu_cu"]],
  ])("%s: base passes, the decoy profile catches it → 2 stars", (_name, body, wrong) => {
    const o = grade(withBody(body));
    expect(o).toMatchObject({ key: "wrong_value_counter", stars: 2, basePassed: true });
    expect(new Set(o.details.vars?.split(", "))).toEqual(new Set(wrong));
  });
});

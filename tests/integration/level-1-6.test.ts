import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { buildTerminalLines } from "../../src/game/terminal-lines";
import { runHarness } from "./run-harness";

// Level 1.6 through the real harness (python3): GDD 1.6 §3, §6, §7, §10, §12.

const level = realLevel("1.6");
/** The locked profile and the comment above the first read (editor lines 1–5) stay as given. */
const HEAD = level.starter_code.split("\n").slice(0, 5).join("\n");
const withBody = (lines: string[]) => `${HEAD}\n${lines.join("\n")}\n`;
const grade = (editorText: string) => classifyRun({ kind: "ok", data: runHarness(level, editorText) }, level);

const TWO_STAR = ["ma_hoi = input()", 'print(f"DANH TINH: {ho_ten}")', 'print(f"MA DAP: {int(ma_hoi) + so_khu}")', 'print("CA DEM DA DUYET")'];
const THREE_STAR_FSTRING = [
  "ma_hoi = int(input())",
  "ca = input()",
  'print(f"DANH TINH: {ho_ten}")',
  'print(f"MA DAP: {ma_hoi + so_khu}")',
  'print(f"CA {ca} DA DUYET")',
];
const THREE_STAR_COMMAS = ["ma_hoi = int(input())", "ca = input()", 'print("DANH TINH:", ho_ten)', 'print("MA DAP:", ma_hoi + so_khu)', 'print("CA", ca, "DA DUYET")'];

describe("level 1.6 grading pipeline", () => {
  test("starter code: TypeError on line 8 after line 1 went out wrong at position 12; one line read", () => {
    const o = grade(level.starter_code);
    expect(o).toMatchObject({ key: "TypeError", stars: 0, stdinRead: 1, stdin: ["4172", "DEM"] });
    expect(o.error).toMatchObject({ type: "TypeError", line: 8 });
    expect(o.output?.lines.map((l) => l.status)).toEqual(["wrong", "missing", "missing"]);
    expect(o.output?.lines[0]).toMatchObject({ actual: "DANH TINH: {ho_ten}", col: 12 });
    const terminal = buildTerminalLines(o, level, 1).map((l) => l.text);
    expect(terminal).toContain('> KÊNH NHẬP: "4172", "DEM" (đã đọc 1/2)');
    expect(terminal).toContain("> TRẠM BÁC: dòng 1 · sai ở vị trí 12");
  });

  test("reference solution (GDD §6): 2 stars, the shift line is caught by the counter-attack", () => {
    const o = grade(withBody(TWO_STAR));
    expect(o).toMatchObject({ key: "wrong_value_counter", stars: 2, basePassed: true, baseLineCount: 4, details: { out_line: 3 } });
    expect(o.counterStdin).toEqual(["9035", "SANG"]);
    expect(o.counterOutput?.lines[2]).toMatchObject({ status: "wrong", actual: "CA DEM DA DUYET", expected: "CA SANG DA DUYET" });
  });

  test.each([
    ["f-strings", THREE_STAR_FSTRING],
    ["print with commas", THREE_STAR_COMMAS],
  ])("reading both lines (%s): 3 stars in 5 statements", (_name, body) => {
    const o = grade(withBody(body));
    expect(o).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 5, stdinRead: 2, counterStdinRead: 2 });
  });

  test("the f left out on line 7, everything else right: output_is_label", () => {
    const o = grade(withBody(THREE_STAR_FSTRING.map((l, i) => (i === 2 ? 'print("DANH TINH: {ho_ten}")' : l))));
    expect(o).toMatchObject({ key: "output_is_label", stars: 0, details: { out_line: 1 } });
  });

  test("a prompt in the first read goes out with line 1: output_has_prompt", () => {
    const o = grade(withBody(THREE_STAR_FSTRING.map((l, i) => (i === 0 ? 'ma_hoi = int(input("Ma hoi: "))' : l))));
    expect(o).toMatchObject({ key: "output_has_prompt", details: { out_line: 1 }, prompts: ["Ma hoi: "] });
    expect(o.output?.lines[0].actual).toBe("Ma hoi: DANH TINH: ĐỖ MINH AN");
  });

  test("reading three lines from a two-line channel: EOFError", () => {
    const o = grade(withBody(["a = input()", "b = input()", "c = input()", ...THREE_STAR_FSTRING.slice(2)]));
    expect(o).toMatchObject({ key: "EOFError", stars: 0, stdinRead: 2 });
    expect(o.error).toMatchObject({ type: "EOFError", line: 8, message: "EOF when reading a line" });
  });
});

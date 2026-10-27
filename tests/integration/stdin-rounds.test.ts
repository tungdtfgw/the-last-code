import { describe, expect, test } from "vitest";
import fixture from "../fixtures/levels/level-test-stdin.json";
import { classifyRun } from "../../src/game/classify-run";
import type { LevelDefinition } from "../../src/game/level-types";
import { buildTerminalLines } from "../../src/game/terminal-lines";
import { validateLevel } from "../../src/game/validate-level";
import { runHarness } from "./run-harness";

// A made-up level with a stdin channel and three base tests (scan rounds), through the real harness.

const level = fixture as unknown as LevelDefinition;
const HEADER = level.starter_code.split("\n").slice(0, 5).join("\n");
const grade = (body: string) => classifyRun({ kind: "ok", data: runHarness(level, `${HEADER}\n${body}`) }, level);
const terminal = (body: string) => buildTerminalLines(grade(body), level, 1).map((l) => l.text);

const SOLUTION = 'ma = input()\nca = input()\nprint(ho_ten, ma)\nprint("KHU", so_khu, ca)\n';

describe("stdin channel and scan rounds (real harness)", () => {
  test("the fixture is a valid level", () => {
    expect(validateLevel(fixture).ok).toBe(true);
  });

  test("reading the channel: every round and the counter-attack pass, 3 stars", () => {
    const o = grade(SOLUTION);
    expect(o).toMatchObject({ key: "three_stars", stars: 3, baseLineCount: 4, stdinRead: 2, counterStdin: ["7777", "DEM"], counterStdinRead: 2 });
    expect(o.rounds?.map((r) => r.passed)).toEqual([true, true, true]);
    const t = terminal(SOLUTION);
    expect(t.slice(1, 4)).toEqual([
      '> VÒNG 1/3 · so_khu = 7 · kênh nhập: "4172", "DEM"',
      '> VÒNG 2/3 · so_khu = 9 · kênh nhập: "9035", "NGAY"',
      '> VÒNG 3/3 · so_khu = 3 · kênh nhập: "1500", "SANG"',
    ]);
    expect(t).toContain('> KÊNH NHẬP: "7777", "DEM" (đã đọc 2/2)');
  });

  test("written for round 1 only: rejected at round 2, the log stops there", () => {
    const o = grade('print("AN 4172")\nprint("KHU 7 DEM")\n');
    expect(o).toMatchObject({ key: "output_mismatch", stars: 0, details: { out_line: 1, round: 2 } });
    expect(o.stdinRead).toBe(0);
    const t = terminal('print("AN 4172")\nprint("KHU 7 DEM")\n');
    expect(t.filter((x) => x.startsWith("> VÒNG"))).toEqual([
      '> VÒNG 1/3 · so_khu = 7 · kênh nhập: "4172", "DEM"',
      '> VÒNG 2/3 · so_khu = 9 · kênh nhập: "9035", "NGAY"',
    ]);
  });

  test("a prompt goes out with the first line: output_has_prompt", () => {
    const o = grade(SOLUTION.replace("ma = input()", 'ma = input("Ma: ")'));
    expect(o).toMatchObject({ key: "output_has_prompt", details: { out_line: 1, round: 1 }, prompts: ["Ma: "] });
    expect(o.output?.lines[0].actual).toBe("Ma: AN 4172");
  });

  test("reading one line too many: EOFError on the player's line", () => {
    const o = grade(SOLUTION + "them = input()\n");
    expect(o).toMatchObject({ key: "EOFError", details: { line: 10, round: 1 }, stdinRead: 2 });
    expect(o.error).toMatchObject({ type: "EOFError", message: "EOF when reading a line", line: 10 });
  });
});

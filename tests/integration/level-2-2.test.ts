import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { realLevel } from "../content-fixture";
import { classifyRun } from "../../src/game/classify-run";
import { buildTerminalLines } from "../../src/game/terminal-lines";
import { readFixture, runHarness } from "./run-harness";

// Level 2.2 through the real harness (python3): GDD 2.2 §5.1, §8, §8.2, §8.3, §11.
// Each fixture is the whole editor: lines 1–5 as in the starter code, the body from line 6.

const level = realLevel("2.2");

function run(name: string) {
  const report = runHarness(level, readFixture(`2.2/${name}`));
  const outcome = classifyRun({ kind: "ok", data: report }, level);
  return { outcome, counts: report.base_results?.map((r) => r.line_count) ?? [] };
}

/** Inputs of counter-attack situation n (1-based). */
const counter = (n: number) => level.counter_attack_tests![n - 1].inputs;

describe("level 2.2: the turns the starter code leads through", () => {
  test("starter code: the body under the if is not indented, IndentationError on line 8", () => {
    const { outcome } = run("original");
    expect(outcome).toMatchObject({ key: "IndentationError", stars: 0 });
    expect(outcome.error).toMatchObject({ type: "IndentationError", line: 8 });
  });

  test("indent fixed, condition still points outward: wrong_branch in situation 1, line 8 dimmed", () => {
    const { outcome, counts } = run("turn-2-indent-gt");
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { vars: "lenh", round: 1 }, skippedLines: [8], skippedRound: 1 });
    expect(counts).toEqual([2, 3, 2]);
    const terminal = buildTerminalLines(outcome, level, 2).map((l) => l.text);
    const skipped = terminal.indexOf("> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8");
    expect(skipped).toBeGreaterThan(-1);
    expect(skipped).toBeLessThan(terminal.length - 1);
  });

  test("direction fixed, the edge left out: wrong_branch again, in situation 3, line 8 dimmed", () => {
    const { outcome, counts } = run("turn-3-lt");
    expect(outcome).toMatchObject({ key: "wrong_branch", stars: 0, details: { round: 3 }, skippedLines: [8], skippedRound: 3 });
    expect(counts).toEqual([3, 2, 2]);
  });

  test("the edge included: three stars in 3 statements", () => {
    const { outcome, counts } = run("three-star");
    expect(outcome).toMatchObject({ key: "three_stars", stars: 3, counterSurvived: true, baseLineCount: 3 });
    expect(outcome.skippedLines).toBeUndefined();
    expect(counts).toEqual([3, 2, 3]);
  });
});

type Row = { name: string; key: string; stars: number; round?: number; counts?: number[]; skipped?: number[] | null };

// GDD §8.2: key, stars, failing base round, statements per base situation, dimmed lines
// (null: none dimmed; left out: not part of the lesson, not checked).
const CASES: Row[] = [
  { name: "three-star-default-nap", key: "three_stars", stars: 3, counts: [2, 3, 2] },
  { name: "three-star-two-ifs", key: "three_stars", stars: 3, counts: [3, 3, 3] },
  { name: "three-star-not", key: "three_stars", stars: 3, counts: [3, 2, 3] },
  { name: "three-star-lt-plus-one", key: "three_stars", stars: 3, counts: [3, 2, 3] },
  { name: "three-star-if-else", key: "three_stars", stars: 3, counts: [2, 2, 2] },
  { name: "three-star-ternary", key: "three_stars", stars: 3, counts: [1, 1, 1] },
  { name: "flipped-ge", key: "wrong_branch", stars: 0, round: 1, counts: [2, 3, 3], skipped: [8] },
  { name: "swapped-sides", key: "wrong_branch", stars: 0, round: 1, counts: [2, 3, 3], skipped: [8] },
  { name: "hardcode-case-1", key: "wrong_branch", stars: 0, round: 2, counts: [1, 1, 1], skipped: null },
  { name: "default-after-if", key: "wrong_branch", stars: 0, round: 1, counts: [3, 2, 3], skipped: null },
  { name: "default-inside-block", key: "missing_var", stars: 0, round: 2, counts: [3, 1, 3], skipped: [7, 8] },
  { name: "extra-default-in-block", key: "wrong_branch", stars: 0, round: 1, counts: [4, 2, 4], skipped: null },
  { name: "no-default", key: "missing_var", stars: 0, round: 2, counts: [2, 1, 2], skipped: [7] },
  { name: "missing-colon", key: "SyntaxError", stars: 0 },
  { name: "assign-in-condition", key: "SyntaxError", stars: 0 },
  { name: "lowercase", key: "wrong_value", stars: 0, round: 1, counts: [3, 2, 3], skipped: null },
  { name: "name-as-text", key: "wrong_value", stars: 0, round: 1, counts: [3, 2, 3], skipped: null },
  { name: "bool-instead-of-str", key: "type_mismatch", stars: 0, round: 1, counts: [1, 1, 1], skipped: null },
  { name: "two-star", key: "wrong_branch", stars: 2, counts: [3, 2, 3] },
  { name: "hardcode-le-40", key: "wrong_branch", stars: 2, counts: [3, 2, 3] },
  { name: "hardcode-lt-45", key: "wrong_branch", stars: 2, counts: [3, 2, 3] },
  { name: "hardcode-lt-50", key: "wrong_branch", stars: 2, counts: [3, 2, 3] },
  { name: "hardcode-nap-unless-50", key: "wrong_branch", stars: 2, counts: [2, 3, 2] },
  { name: "hardcode-band-and", key: "wrong_branch", stars: 2, counts: [3, 2, 3] },
  { name: "extra-print", key: "alert_exceeded", stars: 1, counts: [4, 3, 4] },
];

describe("level 2.2: mutation table", () => {
  test.each(CASES)("$name → $key, $stars stars", ({ name, key, stars, round, counts, skipped }) => {
    const { outcome, counts: measured } = run(name);
    expect(outcome.key).toBe(key);
    expect(outcome.stars).toBe(stars);
    if (round !== undefined) expect(outcome.details.round).toBe(round);
    if (counts) expect(measured).toEqual(counts);
    if (skipped === null) expect(outcome.skippedLines).toBeUndefined();
    else if (skipped) expect(outcome.skippedLines).toEqual(skipped);
  });

  test("a syntax error on the if line stops every situation at line 7", () => {
    for (const name of ["missing-colon", "assign-in-condition"]) expect(run(name).outcome.error).toMatchObject({ type: "SyntaxError", line: 7 });
  });

  test("no mutation reaches three stars: among every fixture only the three-star files do", () => {
    const names = readdirSync(new URL("../fixtures/solutions/2.2/", import.meta.url)).map((f) => f.replace(/\.py$/, ""));
    const threeStars = names.filter((name) => run(name).outcome.stars === 3);
    expect(threeStars.sort()).toEqual(names.filter((name) => name.startsWith("three-star")).sort());
  });
});

describe("level 2.2: the counter-attack", () => {
  test.each([
    ["two-star", 2],
    ["hardcode-le-40", 3],
    ["hardcode-lt-45", 1],
    ["hardcode-lt-50", 1],
    ["hardcode-nap-unless-50", 1],
    ["hardcode-band-and", 2],
  ])("%s takes the branch of another situation in counter situation %i, with no round", (name, n) => {
    const { outcome } = run(name);
    expect(outcome).toMatchObject({ key: "wrong_branch", basePassed: true, counterSurvived: false, counterInputs: counter(n) });
    expect(outcome.details.round).toBeUndefined();
  });

  test("the scan range written in by hand sends DI where the new drone sits on its edge", () => {
    const { outcome } = run("two-star");
    expect(counter(2)).toEqual({ khoang_cach: 40, tam_quet: 40 });
    expect(outcome.counterVars?.[0]).toMatchObject({ name: "lenh", preview: "'DI'", valueOk: false });
  });

  test("a counter situation lost: the dimmed lines are that situation's, not those of a passed one", () => {
    // Base situation 1 runs line 8; counter situation 2 never reaches it.
    const { outcome } = run("two-star");
    expect(outcome).toMatchObject({ skippedLines: [8], skippedCounter: true });
    expect(outcome.skippedRound).toBeUndefined();
    const terminal = buildTerminalLines(outcome, level, 1).map((l) => l.text);
    expect(terminal.at(-2)).toBe("> KHÔNG CHẠY KHI OMNI PHẢN CÔNG: dòng 8");
    expect(terminal.some((t) => t.includes("Ở TÌNH HUỐNG"))).toBe(false);
    // Counter situation 3 takes the NAP branch: nothing to dim, even though a base situation skipped line 8.
    expect(run("hardcode-le-40").outcome.skippedLines).toBeUndefined();
  });
});

describe("level 2.2: ECHO's line for the wrong branch", () => {
  test("wrong_branch and its variant exist and never name a situation", () => {
    for (const line of [level.reactions.wrong_branch, level.reaction_variants?.wrong_branch]) {
      expect(line).toBeTruthy();
      expect(line).not.toContain("{round}");
    }
  });
});

import { describe, expect, test } from "vitest";
import { gradeFixture } from "../../tests/integration/run-harness";
import levelJson from "../levels/level-1-4.json";
import type { RunOutcome } from "./classify-run";
import { renderTemplate, selectEntry, selectReaction } from "./echo-reactions";
import type { LevelDefinition } from "./level-types";

const level = levelJson as unknown as LevelDefinition;
const say = (fixture: string) => selectReaction(gradeFixture(level, fixture), level, []).primary;

describe("ECHO says the line that matches the run (AC 8)", () => {
  test("original code → wrong shape", () => {
    expect(say("original")).toBe("Máy quét từ chối ma_xac_thuc, chi_so, hop_le. Sai hình dạng. Nó không đọc nội dung… chỉ đọc hình dạng.");
  });
  test("int(tuoi) * 100 + cap_do → TypeError line 7", () => {
    expect(say("type-error")).toBe("Dòng 7. TypeError. Hai thứ khác hình dạng vừa bị ép vào cùng một phép toán.");
  });
  test("2703.0 → right number, wrong shape", () => {
    expect(say("float-shape")).toContain("Con số của ma_xac_thuc khớp. Hình dạng thì không.");
  });
  test("6.6 → counter-attack ValueError", () => {
    expect(say("two-star")).toBe("OMNI đổi định dạng chip. Dòng 7 vỡ: ValueError. Dữ liệu mới mang hình dạng bạn chưa lường.");
  });
  test("hard-coded → wrong value under counter-attack", () => {
    expect(say("hardcoded")).toContain("Nó được viết cho một con chip đã chết.");
  });
  test("6.7 → three stars", () => {
    expect(say("three-star")).toContain("Cổng mở hoàn toàn.");
  });
  test("entry line", () => {
    expect(selectEntry(level)).toContain("Tôi là ECHO.");
  });
});

describe("repeated_fail follow-up", () => {
  const outcome = { key: "TypeError", stars: 0, details: { line: 7 } } as unknown as RunOutcome;
  test("not on the first or second identical failure", () => {
    expect(selectReaction(outcome, level, []).followUp).toBeUndefined();
    expect(selectReaction(outcome, level, ["TypeError"]).followUp).toBeUndefined();
    expect(selectReaction(outcome, level, ["TypeError", "SyntaxError"]).followUp).toBeUndefined();
  });
  test("third and later identical failures in a row", () => {
    expect(selectReaction(outcome, level, ["TypeError", "TypeError"]).followUp).toContain("lần thứ 3");
    expect(selectReaction(outcome, level, ["SyntaxError", "TypeError", "TypeError", "TypeError"]).followUp).toContain("lần thứ 4");
  });
  test("never after a successful run", () => {
    const win = { key: "counter_ValueError", stars: 2, details: { line: 7 } } as unknown as RunOutcome;
    expect(selectReaction(win, level, ["counter_ValueError", "counter_ValueError"]).followUp).toBeUndefined();
  });
});

test("missing placeholder data becomes ? and never leaks braces", () => {
  expect(renderTemplate("Dòng {line}. {error_type}. {nope}", {})).toBe("Dòng ?. ?. ?");
  expect(renderTemplate("{count} lệnh", { count: 0 })).toBe("0 lệnh");
});

test("unknown key falls back to generic", () => {
  const custom = { ...level, reactions: { generic: "G" } } as LevelDefinition;
  expect(selectReaction({ key: "TypeError", stars: 0, details: {} } as unknown as RunOutcome, custom, []).primary).toBe("G");
});

import { describe, expect, test } from "vitest";
import level from "../levels/level-1-4.json";
import { validateLevel } from "./validate-level";

const clone = () => JSON.parse(JSON.stringify(level));

describe("validateLevel", () => {
  test("level 1.4 is valid", () => {
    const r = validateLevel(level);
    expect(r).toEqual({ ok: true, level });
  });

  test("starter code matches GDD values", () => {
    expect(level.starter_code.split("\n").slice(1, 4)).toEqual([
      'tuoi = "27"',
      'chieu_cao = "1.72"',
      'cap_do = "3"',
    ]);
  });

  const cases: [string, (l: any) => void, RegExp][] = [
    ["missing expected", (l) => delete l.tests[0].expected, /tests\[0\]\.expected thiếu/],
    ["missing one expected var", (l) => delete l.tests[0].expected.chi_so, /expected thiếu "chi_so"/],
    ["unknown type", (l) => (l.objectives[0].type = "number"), /type "number" không hợp lệ/],
    ["locked line out of range", (l) => (l.locked_lines = [2, 3, 40]), /dòng 40 nằm ngoài/],
    ["locked lines not covering inputs", (l) => (l.locked_lines = [6, 7]), /không chứa dòng gán biến đầu vào "tuoi"/],
    ["bool expected as string", (l) => (l.tests[0].expected.hop_le = "true"), /hop_le không khớp kiểu bool/],
    ["int expected as float", (l) => (l.tests[0].expected.ma_xac_thuc = 2703.5), /ma_xac_thuc không khớp kiểu int/],
    ["missing generic reaction", (l) => delete l.reactions.generic, /thiếu khóa "generic"/],
    ["unknown reaction key", (l) => (l.reactions.lol = "x"), /khóa lạ "lol"/],
    ["two hints", (l) => l.hints.pop(), /hints phải có đúng 3/],
    ["input missing in counter test", (l) => delete l.counter_attack_tests[0].inputs.cap_do, /counter_attack_tests\[0\]\.inputs thiếu biến "cap_do"/],
    ["empty tests", (l) => (l.tests = []), /tests phải là mảng không rỗng/],
  ];
  test.each(cases)("rejects %s", (_name, mutate, message) => {
    const l = clone();
    mutate(l);
    const r = validateLevel(l);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });

  test("rejects non-object", () => {
    expect(validateLevel(null).ok).toBe(false);
    expect(validateLevel("x").ok).toBe(false);
  });
});

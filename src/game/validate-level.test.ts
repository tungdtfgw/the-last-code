import { describe, expect, test } from "vitest";
import sample from "../../tests/fixtures/levels/level-test-sample.json";
import knowledgeSample from "../../tests/fixtures/levels/level-test-knowledge.json";
import { realLevelJson } from "../../tests/content-fixture";
import { validateLevel } from "./validate-level";

const level = realLevelJson("1.4");
const level11 = realLevelJson("1.1");
const level12 = realLevelJson("1.2");
const level13 = realLevelJson("1.3");

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
    ["outro beat of kind lore", (l) => (l.outro_beats[0].kind = "lore"), /outro_beats\[0\]\.kind "lore" không hợp lệ/],
    ["outro beat with unknown cue", (l) => (l.outro_beats[1].cue = "boom"), /outro_beats\[1\]\.cue "boom"/],
    ["ECHO outro beat leaking the answer", (l) => (l.outro_beats[3].text = "Mã là 2703."), /outro_beats\[3\]\.text: lời ECHO chứa "2703"/],
    ["id the router cannot open", (l) => (l.id = "1 4"), /id chỉ gồm chữ, số/],
    ["empty location", (l) => (l.location = " "), /location phải là chuỗi không rỗng/],
  ];
  test.each(cases)("rejects %s", (_name, mutate, message) => {
    const l = clone();
    mutate(l);
    const r = validateLevel(l);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });

  test("story fields are optional", () => {
    expect(validateLevel(sample).ok).toBe(true);
    expect("outro_beats" in sample).toBe(false);
  });

  test("level 1.1 (output objectives, relay simulation, own forbidden terms) is valid", () => {
    expect(validateLevel(level11)).toEqual({ ok: true, level: level11 });
  });

  const cases11: [string, (l: any) => void, RegExp][] = [
    ["counter test without expected_output", (l) => delete l.counter_attack_tests[0].expected_output, /counter_attack_tests\[0\]\.expected_output phải là mảng đúng 3 chuỗi/],
    ["expected_output with the wrong line count", (l) => l.tests[0].expected_output.pop(), /tests\[0\]\.expected_output phải là mảng đúng 3 chuỗi/],
    ["expected line with trailing whitespace", (l) => (l.tests[0].expected_output[1] += " "), /expected_output\[1\] có khoảng trắng cuối dòng/],
    ["output lines 1 and 3 (2 missing)", (l) => (l.objectives[1].line = 3), /output_line phải là 1\.\.3, không trùng \(đang có 1, 3, 3\)/],
    ["unknown objective kind", (l) => (l.objectives[0].kind = "stdout"), /objectives\[0\]\.kind "stdout" không hợp lệ/],
    ["a simulation that is not built", (l) => (l.simulation = { kind: "metro" }), /simulation\.kind phải là một trong scanner\|relay/],
    ["relay without a station", (l) => delete l.simulation.station, /simulation\.station phải là chuỗi/],
    ["empty forbidden term", (l) => (l.forbidden_terms = [""]), /forbidden_terms phải là mảng chuỗi không rỗng/],
    ["ECHO outro beat with a level forbidden term", (l) => (l.outro_beats[2].text = "Mã cũ là K7Q2."), /outro_beats\[2\]\.text: lời ECHO chứa "K7Q2"/],
  ];
  test.each(cases11)("level 1.1: rejects %s", (_name, mutate, message) => {
    const l = JSON.parse(JSON.stringify(level11));
    mutate(l);
    const r = validateLevel(l);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });

  test("level 1.2 (kiosk simulation, value_is_label reaction) is valid", () => {
    expect(validateLevel(level12)).toEqual({ ok: true, level: level12 });
  });

  const cases12: [string, (l: any) => void, RegExp][] = [
    ["no devices", (l) => (l.simulation.devices = []), /simulation\.devices phải là mảng 1–3/],
    ["a device listed twice", (l) => (l.simulation.devices = ["the_quet", "the_quet"]), /simulation\.devices\[1\] "the_quet" bị trùng/],
    ["a device that is not an objective", (l) => (l.simulation.devices = ["khong_co"]), /simulation\.devices\[0\] "khong_co" không phải biến mục tiêu/],
    ["every objective a device (no memory cell)", (l) => (l.objectives = l.objectives.slice(4)), /ki-ốt cần 1–6 ô nhớ/],
    ["an unknown kind", (l) => (l.simulation = { kind: "abc" }), /simulation\.kind phải là một trong/],
  ];
  test.each(cases12)("level 1.2: rejects %s", (_name, mutate, message) => {
    const l = JSON.parse(JSON.stringify(level12));
    mutate(l);
    const r = validateLevel(l);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });

  test("level 1.3 (type objective, number and string inputs, sorter) is valid; a bool input is too", () => {
    expect(validateLevel(level13)).toEqual({ ok: true, level: level13 });
    const l = JSON.parse(JSON.stringify(level13));
    l.counter_attack_tests[0].inputs.ma_phien = true;
    expect(validateLevel(l).ok).toBe(true);
  });

  const cases13: [string, (l: any) => void, RegExp][] = [
    ["a type objective expecting a shape outside the four", (l) => (l.tests[0].expected.khuon_phien = "list"), /tests\[0\]\.expected\.khuon_phien phải là tên một kiểu \(int\|float\|str\|bool\)/],
    ["an object input", (l) => (l.tests[0].inputs.ma_phien = {}), /tests\[0\]\.inputs\.ma_phien phải là chuỗi, số hoặc bool/],
    ["a null input", (l) => (l.counter_attack_tests[0].inputs.ma_phien = null), /counter_attack_tests\[0\]\.inputs\.ma_phien phải là chuỗi, số hoặc bool/],
    ["two objectives for one sorter lane", (l) => (l.objectives[1].type = "str") && (l.tests[0].expected.tuoi = l.counter_attack_tests[0].expected.tuoi = "27"), /máy phân loại chỉ có một khe cho kiểu str \(ho_ten, tuoi\)/],
  ];
  test.each(cases13)("level 1.3: rejects %s", (_name, mutate, message) => {
    const l = JSON.parse(JSON.stringify(level13));
    mutate(l);
    const r = validateLevel(l);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });

  test("rejects non-object", () => {
    expect(validateLevel(null).ok).toBe(false);
    expect(validateLevel("x").ok).toBe(false);
  });

  describe("task_steps and knowledge_summary", () => {
    const withContent = () => JSON.parse(JSON.stringify(knowledgeSample));
    test("fixture with both fields is valid; levels without them stay valid", () => {
      expect(validateLevel(knowledgeSample).ok).toBe(true);
      expect(validateLevel(sample).ok).toBe(true);
    });

    test("task steps may name forbidden terms such as print, but not an expected output line", () => {
      const l = JSON.parse(JSON.stringify(level11));
      l.task_steps = ["Sửa các lệnh `print` để terminal in đúng 3 dòng ở ô Mục tiêu.", "Bấm CHẠY."];
      expect(validateLevel(l).ok).toBe(true);
      l.task_steps[1] = "In ra LO17 CAN LIEN LAC.";
      const r = validateLevel(l);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.join("\n")).toMatch(/task_steps\[1\] lộ đáp án "LO17 CAN LIEN LAC"/);
    });

    const cases: [string, (l: any) => void, RegExp][] = [
      ["one task step", (l) => (l.task_steps = ["Một bước."]), /task_steps phải là mảng 2–4 chuỗi/],
      ["an empty task step", (l) => (l.task_steps[1] = " "), /task_steps\[1\] rỗng/],
      ["a task step with an expected value", (l) => (l.task_steps[0] = "Gán ketqua bằng 5."), /task_steps\[0\] lộ đáp án "5"/],
      ["output without code", (l) => delete l.knowledge_summary.sections[0].code, /sections\[0\]\.output cần code/],
      ["a misspelt section key", (l) => (l.knowledge_summary.sections[1].ouput = "x"), /sections\[1\]: khóa lạ "ouput"/],
      ["no sections", (l) => (l.knowledge_summary.sections = []), /sections phải là mảng không rỗng/],
      ["a mistake without explain", (l) => delete l.knowledge_summary.mistakes[0].explain, /mistakes\[0\]\.explain phải là chuỗi không rỗng/],
      ["missing next", (l) => delete l.knowledge_summary.next, /knowledge_summary\.next phải là chuỗi không rỗng/],
    ];
    test.each(cases)("rejects %s", (_name, mutate, message) => {
      const l = withContent();
      mutate(l);
      const r = validateLevel(l);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
    });
  });
});

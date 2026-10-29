import { describe, expect, test } from "vitest";
import { chapterFile, levelFiles, realChapterJson, realLevelJson } from "../../tests/content-fixture";
import { applyText, CHAPTER_TEXT, checkTextShape, errorPath, extractText, LEVEL_TEXT, stripText, type TextSpec } from "./text-fields";

const levelIds = Object.values(levelFiles()).map((f) => (f as { id: string }).id);
// Full documents: each puzzle file with the text its migration gives it.
const docs: [string, unknown, TextSpec][] = [
  ...levelIds.map((id) => [`level ${id}`, realLevelJson(id), LEVEL_TEXT] as [string, unknown, TextSpec]),
  ["chapter 1", realChapterJson(), CHAPTER_TEXT],
];
const puzzles: [string, unknown, TextSpec][] = [
  ...Object.entries(levelFiles()).map(([path, doc]) => [path, doc, LEVEL_TEXT] as [string, unknown, TextSpec]),
  ["chapter-1.json", chapterFile(), CHAPTER_TEXT],
];
const level14 = realLevelJson("1.4");
const level11 = realLevelJson("1.1");

test.each(puzzles)("%s: the repo file holds no text (the text lives in D1)", (_path, doc, spec) => {
  expect(stripText(doc, spec)).toEqual(doc);
});

test.each(docs)("%s: applying its own text gives the document back", (_path, doc, spec) => {
  expect(applyText(doc, extractText(doc, spec), spec)).toEqual({ doc, drift: [] });
  expect(applyText(stripText(doc, spec), extractText(doc, spec), spec)).toEqual({ doc, drift: [] });
  expect(checkTextShape(extractText(doc, spec), spec)).toEqual([]);
});

/** String leaves that are puzzle data, not text. `*` is one key. */
const PUZZLE_STRINGS = [
  "id",
  "title",
  "difficulty",
  "concepts[]",
  "starter_code",
  "inputs[]",
  "objectives[].kind",
  "objectives[].var",
  "objectives[].type",
  "tests[].inputs.*",
  "tests[].expected.*",
  "tests[].expected_output[]",
  "tests[].stdin[]",
  "counter_attack_tests[].inputs.*",
  "counter_attack_tests[].expected.*",
  "counter_attack_tests[].expected_output[]",
  "counter_attack_tests[].stdin[]",
  "simulation.kind",
  "simulation.station",
  "simulation.devices[]",
  ...["energy", "cells", "remainder", "capacity"].map((k) => `simulation.${k}`),
  "forbidden_terms[]",
  "scene",
  "outro_beats[].kind",
  "outro_beats[].cue",
  "outro_beats[].backdrop",
  "outro_beats[].fx",
  "knowledge_summary.sections[].code",
  "knowledge_summary.sections[].output",
  "knowledge_summary.sections[].stdin",
  "knowledge_summary.mistakes[].code",
  "knowledge_summary.mistakes[].error",
  "levels[]",
  ...["prologue", "teaser"].flatMap((b) => ["kind", "cue", "backdrop", "fx"].map((k) => `${b}[].${k}`)),
].map((p) => new RegExp(`^${p.replace(/[.[\]]/g, "\\$&").replace(/\*/g, "[^.]+")}$`));

function stringLeaves(v: unknown, path = "", out = new Set<string>()) {
  if (typeof v === "string") out.add(path);
  else if (Array.isArray(v)) v.forEach((x) => stringLeaves(x, `${path}[]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) stringLeaves(x, path ? `${path}.${k}` : k, out);
  return out;
}

const isText = (path: string, spec: TextSpec) =>
  spec.fields.some((f) => f.path === path || (f.leaf.type === "list" && path === `${f.path}[]`) || (f.leaf.type === "map" && path.startsWith(`${f.path}.`)));

test.each(docs)("%s: every string is either text or a known puzzle field", (_path, doc, spec) => {
  const unknown = [...stringLeaves(doc)].filter((p) => !isText(p, spec) && !PUZZLE_STRINGS.some((re) => re.test(p)));
  expect(unknown).toEqual([]);
});

describe("checkTextShape", () => {
  const text = () => extractText(level14, LEVEL_TEXT) as Record<string, any>;

  test("puzzle keys are refused", () => {
    expect(checkTextShape({ ...text(), tests: [] }, LEVEL_TEXT)).toEqual([
      { path: "tests", message: "tests: trường này không sửa được ở trang quản lý" },
    ]);
    const withType = text();
    withType.objectives[0].type = "int";
    expect(checkTextShape(withType, LEVEL_TEXT).map((e) => e.path)).toEqual(["objectives[0].type"]);
  });

  test("map keys, list sizes and types", () => {
    const t = text();
    t.reactions.made_up = "x";
    t.hints = t.hints.slice(0, 2);
    t.briefing = 3;
    expect(checkTextShape(t, LEVEL_TEXT).map((e) => e.path).sort()).toEqual(["briefing", "hints", "reactions.made_up"]);
  });

  test("a missing required leaf is reported", () => {
    const t = text();
    delete t.reactions.generic;
    delete t.outro;
    expect(checkTextShape(t, LEVEL_TEXT).map((e) => e.path).sort()).toEqual(["outro", "reactions"]);
  });
});

describe("applyText", () => {
  test("a beat whose kind changed in the puzzle gets no text and is reported", () => {
    const text = extractText(level11, LEVEL_TEXT) as Record<string, any>;
    text.outro_beats[0].text = "Câu mới";
    text.outro_beats[1].text = "Câu mới hai";
    const puzzle = stripText(level11, LEVEL_TEXT);
    puzzle.outro_beats[0].kind = puzzle.outro_beats[0].kind === "log" ? "kai" : "log";
    const { doc, drift } = applyText(puzzle, text, LEVEL_TEXT) as { doc: Record<string, any>; drift: string[] };
    expect(drift).toEqual(["outro_beats[0]"]);
    expect("text" in doc.outro_beats[0]).toBe(false);
    expect(doc.outro_beats[1].text).toBe("Câu mới hai");
  });

  test("an objective added to the puzzle has no label until its text is written", () => {
    const text = extractText(level14, LEVEL_TEXT) as Record<string, any>;
    const puzzle = stripText(level14, LEVEL_TEXT);
    puzzle.objectives.push({ var: "moi", type: "int" });
    const { doc, drift } = applyText(puzzle, text, LEVEL_TEXT) as { doc: Record<string, any>; drift: string[] };
    expect(drift).toEqual([`objectives[${level14.objectives.length}]`]);
    expect(doc.objectives.at(-1)).toEqual({ var: "moi", type: "int" });
  });

  test("anchors are never written and puzzle fields are never touched", () => {
    const text = extractText(level14, LEVEL_TEXT) as Record<string, any>;
    text.objectives[0].label = "Nhãn mới";
    const { doc } = applyText(level14, text, LEVEL_TEXT) as { doc: Record<string, any> };
    expect(doc.objectives[0]).toEqual({ ...level14.objectives[0], label: "Nhãn mới" });
    expect(doc.tests).toEqual(level14.tests);
  });

  test("an optional leaf left out of the text is removed", () => {
    const text = extractText(level11, LEVEL_TEXT) as Record<string, any>;
    expect(text.task_steps).toBeDefined();
    delete text.task_steps;
    const { doc, drift } = applyText(level11, text, LEVEL_TEXT) as { doc: Record<string, any>; drift: string[] };
    expect("task_steps" in doc).toBe(false);
    expect(drift).toEqual([]);
  });

  test("a text that is not an object leaves the puzzle as it is", () => {
    expect(applyText(level14, "x", LEVEL_TEXT)).toEqual({ doc: level14, drift: ["*"] });
  });
});

test("errorPath reads the field at the start of a validator message", () => {
  expect(errorPath('task_steps[1] lộ đáp án "7351"')).toBe("task_steps[1]");
  expect(errorPath("reactions.wrong_value phải là chuỗi")).toBe("reactions.wrong_value");
  expect(errorPath('outro_beats[2].text: lời ECHO chứa "int"')).toBe("outro_beats[2].text");
  expect(errorPath('reactions thiếu khóa "generic"')).toBe("reactions");
  expect(errorPath('trùng id level "1.4"')).toBeNull();
});

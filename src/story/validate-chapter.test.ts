import { describe, expect, test } from "vitest";
import { chapterFile, chapterNumbers, levelFiles, realChapterJson } from "../../tests/content-fixture";
import { validateChapter } from "./validate-chapter";

const chapter = realChapterJson();

const clone = () => JSON.parse(JSON.stringify(chapter));

describe("chapter 1 data", () => {
  test("the real file is valid and matches the script", () => {
    expect(validateChapter(chapter).ok).toBe(true);
    expect(chapter.prologue).toHaveLength(23);
    expect(chapter.teaser).toHaveLength(9);
    expect(chapter.prologue[14]).toMatchObject({ kind: "echo", cue: "glitch" });
    expect(new Set(chapter.levels).size).toBe(chapter.levels.length);
  });

  const cases: [string, (c: any) => void, RegExp][] = [
    ["unknown kind", (c) => (c.prologue[1].kind = "narrator"), /prologue\[1\]\.kind "narrator"/],
    ["unknown cue", (c) => (c.teaser[0].cue = "boom"), /teaser\[0\]\.cue "boom"/],
    ["negative hold", (c) => (c.prologue[0].hold_ms = -1), /prologue\[0\]\.hold_ms/],
    ["ECHO naming a function", (c) => (c.prologue[15].text = "Dùng int đi."), /prologue\[15\]\.text: lời ECHO chứa "int"/],
    ["duplicate level ids", (c) => c.levels.push("1.4"), /levels có id trùng/],
    ["no component bar", (c) => delete c.component_bar, /component_bar phải là object/],
    ["an empty slot name", (c) => (c.component_bar.unit = " "), /component_bar\.unit phải là chuỗi không rỗng/],
    ["a trail end over 40 characters", (c) => (c.map.to = "x".repeat(41)), /map\.to phải là chuỗi không rỗng, tối đa 40/],
    ["an unknown key in map", (c) => (c.map.via = "Ga"), /map: khóa lạ "via"/],
  ];
  test.each(cases)("rejects %s", (_name, mutate, message) => {
    const c = clone();
    mutate(c);
    const r = validateChapter(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });
});

test("every level file belongs to exactly one chapter file, the one its `chapter` names", () => {
  const numbers = chapterNumbers();
  expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  const owner = new Map<string, number>();
  for (const n of numbers) {
    const file = chapterFile(n);
    expect(file.chapter, `chapter-${n}.json`).toBe(n);
    for (const id of file.levels as string[]) {
      expect(owner.get(id), `${id} nằm trong hai chương`).toBeUndefined();
      owner.set(id, n);
    }
  }
  for (const level of Object.values(levelFiles()) as { id: string; chapter: number }[]) {
    expect(owner.get(level.id), `${level.id} không nằm trong chương nào`).toBe(level.chapter);
  }
});

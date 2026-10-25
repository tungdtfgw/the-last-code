import { describe, expect, test } from "vitest";
import chapter from "./chapter-1.json";
import { getDefaultRegistry } from "../game/level-registry";
import { validateChapter } from "./validate-chapter";

const clone = () => JSON.parse(JSON.stringify(chapter));

describe("chapter 1 data", () => {
  test("the real file is valid and matches the script", () => {
    expect(validateChapter(chapter).ok).toBe(true);
    expect(chapter.prologue).toHaveLength(23);
    expect(chapter.teaser).toHaveLength(9);
    expect(chapter.prologue[14]).toMatchObject({ kind: "echo", cue: "glitch" });
    expect(new Set(chapter.levels).size).toBe(chapter.levels.length);
  });

  test("every chapter-1 level file is listed in chapter.levels", () => {
    const chapterLevels = getDefaultRegistry().listLevels().filter((l) => l.chapter === 1);
    expect(chapterLevels.length).toBeGreaterThan(0);
    for (const level of chapterLevels) expect(chapter.levels, level.id).toContain(level.id);
  });

  const cases: [string, (c: any) => void, RegExp][] = [
    ["unknown kind", (c) => (c.prologue[1].kind = "narrator"), /prologue\[1\]\.kind "narrator"/],
    ["unknown cue", (c) => (c.teaser[0].cue = "boom"), /teaser\[0\]\.cue "boom"/],
    ["negative hold", (c) => (c.prologue[0].hold_ms = -1), /prologue\[0\]\.hold_ms/],
    ["ECHO naming a function", (c) => (c.prologue[15].text = "Dùng int đi."), /prologue\[15\]\.text: lời ECHO chứa "int"/],
    ["duplicate level ids", (c) => c.levels.push("1.4"), /levels có id trùng/],
  ];
  test.each(cases)("rejects %s", (_name, mutate, message) => {
    const c = clone();
    mutate(c);
    const r = validateChapter(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("\n")).toMatch(message);
  });
});

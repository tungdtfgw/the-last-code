import { expect, test } from "vitest";
import { chapterFile, levelFiles, migratedTexts, realChapterJson, realLevelJson } from "../../tests/content-fixture";
import { CHAPTER_TEXT, extractText, LEVEL_TEXT } from "./text-fields";
import { validateChapterText, validateLevelText } from "./validate-text";

const level14 = realLevelJson("1.4");
const level11 = realLevelJson("1.1");
const chapter1 = realChapterJson();

const textOf = (doc: unknown, spec = LEVEL_TEXT) => JSON.parse(JSON.stringify(extractText(doc, spec))) as Record<string, any>;
const paths = (r: ReturnType<typeof validateLevelText>) => (r.ok ? [] : r.errors.map((e) => e.path));

test("the migrated text passes on the puzzle files", () => {
  expect(validateLevelText(levelFiles()["../levels/level-1-4.json"], migratedTexts()["level:1.4"].text).ok).toBe(true);
  expect(validateChapterText(chapterFile(), migratedTexts()["chapter:1"].text).ok).toBe(true);
});

test("an element that does not line up with the puzzle is refused at that element", () => {
  const t = textOf(level14);
  t.objectives[0].var = "khac";
  expect(paths(validateLevelText(levelFiles()["../levels/level-1-4.json"], t))).toEqual(["objectives[0]"]);
});

test("a reaction that says an expected value is refused at that reaction", () => {
  const t = textOf(level14);
  const answer = String(level14.tests[0].expected.ma_xac_thuc);
  t.reactions.wrong_value = `Thử ${answer} xem.`;
  expect(paths(validateLevelText(level14, t))).toEqual(["reactions.wrong_value"]);
});

test("an ECHO beat with a forbidden term is refused at that beat", () => {
  const t = textOf(level11);
  const i = level11.outro_beats.findIndex((b: { kind: string }) => b.kind === "echo");
  expect(i).toBeGreaterThanOrEqual(0);
  t.outro_beats[i].text = "Dùng int là xong.";
  expect(paths(validateLevelText(level11, t))).toEqual([`outro_beats[${i}].text`]);
});

test("a location over 60 characters is refused at location", () => {
  const t = textOf(level14);
  t.location = "x".repeat(61);
  expect(paths(validateLevelText(level14, t))).toEqual(["location"]);
});

test("a prologue ECHO beat naming int is refused at that beat", () => {
  const t = textOf(chapter1, CHAPTER_TEXT);
  const i = chapter1.prologue.findIndex((b: { kind: string }) => b.kind === "echo");
  t.prologue[i].text = "Gọi int đi.";
  expect(paths(validateChapterText(chapter1, t))).toEqual([`prologue[${i}].text`]);
});

test("stored text is NFC and the puzzle fields come from the puzzle", () => {
  const t = textOf(level14);
  t.briefing = "Tiếng";
  const r = validateLevelText(level14, t);
  expect(r.ok && r.text.briefing).toBe("Tiếng");
  expect(r.ok && (r.doc as typeof level14).tests).toEqual(level14.tests);
});

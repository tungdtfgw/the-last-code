import { afterEach, beforeEach, expect, test, vi } from "vitest";
import fake1 from "../../tests/fixtures/chapters/chapter-test-1.json";
import fake2 from "../../tests/fixtures/chapters/chapter-test-2.json";
import { chapterFile, chaptersOf, migratedTexts, realChapter } from "../../tests/content-fixture";
import { validateChapterText } from "../content/validate-text";
import { getChapters } from "./chapter";
import type { ChapterValidation } from "./validate-chapter";

const file = chapterFile();
const textOf = () => JSON.parse(JSON.stringify(migratedTexts()["chapter:1"].text));
const getChapter = (texts: Parameters<typeof getChapters>[0]): ChapterValidation =>
  getChapters(texts).find((c) => c.chapter === 1)!.result;
const withText = (text: unknown) => getChapter({ ...migratedTexts(), "chapter:1": { revision: 2, text } });

beforeEach(() => void vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

test("D1 text goes onto the bundled beats", () => {
  const text = textOf();
  text.prologue[0].text = "Mở đầu mới.";
  const result = withText(text);
  expect(result.ok && result.chapter.prologue[0].text).toBe("Mở đầu mới.");
  expect(result.ok && result.chapter.prologue[0].kind).toBe(file.prologue[0].kind);
});

test("without D1 text the chapter is broken: the file holds no text", () => {
  const result = getChapter({});
  expect(result.ok).toBe(false);
  expect(!result.ok && result.errors[0]).toMatch(/chưa có câu chữ/);
});

test("an ECHO prologue beat with a forbidden term breaks the chapter", () => {
  const text = textOf();
  const i = file.prologue.findIndex((b: { kind: string }) => b.kind === "echo");
  text.prologue[i].text = "Gọi int là xong.";
  expect(withText(text).ok).toBe(false);
});

test("text with a beat the puzzle does not have breaks the chapter instead of playing half empty", () => {
  const text = textOf();
  text.teaser.push({ kind: "log", text: "Thừa." });
  const result = withText(text);
  expect(!result.ok && result.errors.join("\n")).toMatch(new RegExp(`teaser\\[${file.teaser.length}\\]`));
});

test("the teaser keeps its nine beat kinds, so a text patch fits the chapter file before and after it", () => {
  expect(file.teaser.map((b: { kind: string }) => b.kind)).toEqual(["log", "echo", "log", "log", "card", "echo", "log", "kai", "card"]);
});

test("the migrated teaser is the end of chapter 1 and fits the chapter file", () => {
  const chapter = realChapter();
  expect(chapter.teaser).toHaveLength(9);
  expect(chapter.teaser.at(-1)!.text).toMatch(/^HẾT CHƯƠNG 1/);
  expect(migratedTexts()["chapter:1"].revision).toBe(3);
});

test("the last card of chapter 1 leads into chapter 2 instead of a signal still being decoded", () => {
  const last = realChapter().teaser.at(-1)!;
  expect(last.kind).toBe("card");
  expect(last.text.split("\n").slice(0, 2)).toEqual(["HẾT CHƯƠNG 1 · VÙNG TỐI", "Chương 2: Trạm Sentinel"]);
  expect(last.text).not.toMatch(/đang giải mã/);
  expect(validateChapterText(chapterFile(), migratedTexts()["chapter:1"].text).ok).toBe(true);
});

test("the patched teaser text also fits the chapter file as it was before the chapter ending", () => {
  const before = chapterFile();
  before.teaser[0].backdrop = "vung-toi";
  delete before.teaser[2].fx;
  expect(validateChapterText(before, migratedTexts()["chapter:1"].text).ok).toBe(true);
});

test("every real chapter builds with its migrated text, in order", () => {
  expect(getChapters(migratedTexts()).map((c) => [c.chapter, c.result.ok])).toEqual([
    [1, true],
    [2, true],
  ]);
});

test("a later chapter without D1 text is broken on its own; the first one still builds", () => {
  const { modules, texts } = chaptersOf([fake2, fake1]);
  delete texts["chapter:2"];
  const results = getChapters(texts, modules);
  expect(results.map((c) => c.chapter)).toEqual([1, 2]);
  expect(results[0].result.ok).toBe(true);
  expect(!results[1].result.ok && results[1].result.errors[0]).toMatch(/chưa có câu chữ/);
});

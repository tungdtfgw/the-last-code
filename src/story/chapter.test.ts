import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { chapterFile, migratedTexts } from "../../tests/content-fixture";
import { getChapter } from "./chapter";

const file = chapterFile();
const textOf = () => JSON.parse(JSON.stringify(migratedTexts()["chapter:1"].text));
const withText = (text: unknown) => getChapter({ "chapter:1": { revision: 2, text } });

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

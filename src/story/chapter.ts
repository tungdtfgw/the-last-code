import type { ContentTexts } from "../account/account-api";
import { validateChapterText } from "../content/validate-text";
import chapter1 from "./chapter-1.json";
import { validateChapter, type ChapterValidation } from "./validate-chapter";

/** The bundled chapter file as is: the puzzle only (level order, beat kinds, cues). */
export const bundledChapter = (): unknown => chapter1;

/**
 * Chapter 1 with its D1 text applied (`texts["chapter:1"]`), validated. No text,
 * or text that does not fit the puzzle, makes the chapter broken; it is
 * reported, never thrown. Callers memoise on `texts`.
 */
export function getChapter(texts: ContentTexts): ChapterValidation {
  const saved = texts[`chapter:${chapter1.chapter}`];
  const checked = saved ? validateChapterText(chapter1, saved.text) : null;
  const result: ChapterValidation = !checked
    ? { ok: false, errors: ["chưa có câu chữ trong D1 (thiếu migration câu chữ)"] }
    : checked.ok
      ? validateChapter(checked.doc)
      : { ok: false, errors: checked.errors.map((e) => e.message) };
  if (!result.ok) console.error(`[chapter] chương 1 không hợp lệ:\n- ${result.errors.join("\n- ")}`);
  return result;
}

import type { ContentTexts } from "../account/account-api";
import { validateChapterText } from "../content/validate-text";
import { validateChapter, type ChapterValidation } from "./validate-chapter";

/** One chapter file with its D1 text applied, valid or not. */
export interface ChapterResult {
  chapter: number;
  result: ChapterValidation;
}

/** Every `src/story/chapter-*.json` as bundled (the puzzle only); adding a chapter is adding a file and its text migration. */
export function bundledChapterModules(): Record<string, unknown> {
  return import.meta.glob("./chapter-*.json", { eager: true, import: "default" });
}

const unwrap = (mod: unknown): unknown =>
  mod && typeof mod === "object" && "default" in (mod as Record<string, unknown>) ? (mod as { default: unknown }).default : mod;

const numberOf = (file: unknown): number | undefined => {
  const n = file && typeof file === "object" ? (file as { chapter?: unknown }).chapter : undefined;
  return Number.isInteger(n) ? (n as number) : undefined;
};

/** The bundled file of chapter `n` as is: the puzzle only (level order, beat kinds, cues). */
export function bundledChapter(n: number, modules = bundledChapterModules()): unknown {
  return Object.values(modules).map(unwrap).find((f) => numberOf(f) === n);
}

/**
 * Every chapter file with its D1 text applied (`texts["chapter:<n>"]`), validated,
 * sorted by number. No text, or text that does not fit the puzzle, makes that
 * chapter broken; it is reported, never thrown. Callers memoise on `texts`.
 */
export function getChapters(texts: ContentTexts, modules = bundledChapterModules()): ChapterResult[] {
  const results: ChapterResult[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const file = unwrap(mod);
    const n = numberOf(file) ?? Number(/chapter-(\d+)\.json$/.exec(path)?.[1] ?? NaN);
    if (!Number.isInteger(n)) {
      console.error(`[chapter] ${path}: không đọc được số chương`);
      continue;
    }
    const saved = texts[`chapter:${n}`];
    const checked = saved ? validateChapterText(file, saved.text) : null;
    const result: ChapterValidation = !checked
      ? { ok: false, errors: ["chưa có câu chữ trong D1 (thiếu migration câu chữ)"] }
      : checked.ok
        ? validateChapter(checked.doc)
        : { ok: false, errors: checked.errors.map((e) => e.message) };
    if (!result.ok) console.error(`[chapter] chương ${n} không hợp lệ:\n- ${result.errors.join("\n- ")}`);
    results.push({ chapter: n, result });
  }
  return results.sort((a, b) => a.chapter - b.chapter);
}

import chapter1 from "./chapter-1.json";
import { validateChapter, type ChapterValidation } from "./validate-chapter";

let cached: ChapterValidation | null = null;

/** Chapter 1, validated once. A broken chapter file is reported, never thrown. */
export function getChapter(): ChapterValidation {
  if (!cached) {
    cached = validateChapter(chapter1);
    if (!cached.ok) console.error(`[chapter] chapter-1.json không hợp lệ:\n- ${cached.errors.join("\n- ")}`);
  }
  return cached;
}

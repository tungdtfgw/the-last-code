import { findEchoLeak } from "../game/echo-leaks.js";
import type { ChapterDefinition } from "./story-types.js";
import { validateBeats } from "./validate-beats.js";

export type ChapterValidation = { ok: true; chapter: ChapterDefinition } | { ok: false; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Hand-written like `validateLevel`: every error names the field. Chapter ECHO lines get the forbidden-term check. */
export function validateChapter(raw: unknown): ChapterValidation {
  const errors: string[] = [];
  if (!isObject(raw)) return { ok: false, errors: ["chương phải là một object JSON"] };
  const r = raw;
  if (r.schema_version !== 1) errors.push("schema_version phải là 1");
  if (!Number.isInteger(r.chapter) || (r.chapter as number) < 1) errors.push("chapter phải là số nguyên ≥ 1");
  if (typeof r.title !== "string" || r.title.trim() === "") errors.push("title phải là chuỗi không rỗng");

  const levels = r.levels;
  if (!Array.isArray(levels) || levels.length === 0 || !levels.every((id) => typeof id === "string" && id.trim() !== "")) {
    errors.push("levels phải là mảng id level không rỗng");
  } else if (new Set(levels).size !== levels.length) {
    errors.push("levels có id trùng");
  }
  const count = Array.isArray(levels) ? levels.length : 0;
  if (!Number.isInteger(r.neural_id_slots) || (r.neural_id_slots as number) < 1 || (r.neural_id_slots as number) > count)
    errors.push(`neural_id_slots phải là số nguyên 1–${count}`);

  const shortName = (v: unknown, at: string) => {
    if (typeof v !== "string" || v.trim() === "" || v.length > 40) errors.push(`${at} phải là chuỗi không rỗng, tối đa 40 ký tự`);
  };
  const pair = (v: unknown, field: string, keys: [string, string]) => {
    if (!isObject(v)) {
      errors.push(`${field} phải là object {${keys.join(", ")}}`);
      return;
    }
    for (const k of Object.keys(v)) if (!keys.includes(k)) errors.push(`${field}: khóa lạ "${k}"`);
    for (const k of keys) shortName(v[k], `${field}.${k}`);
  };
  pair(r.component_bar, "component_bar", ["label", "unit"]);
  pair(r.map, "map", ["from", "to"]);

  const leak = (text: string) => findEchoLeak(text);
  validateBeats(r.prologue, "prologue", errors, leak);
  validateBeats(r.teaser, "teaser", errors, leak);

  return errors.length ? { ok: false, errors } : { ok: true, chapter: raw as unknown as ChapterDefinition };
}

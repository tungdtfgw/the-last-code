import type { ContentTexts } from "../account/account-api";
import type { LevelDefinition } from "./level-types";
import { validateLevel } from "./validate-level";
import { validateLevelText } from "../content/validate-text";

export interface LevelRegistry {
  getLevel(id: string): LevelDefinition | undefined;
  listLevels(): LevelDefinition[];
  /** Files that failed validation, keyed by module path. */
  invalid: Record<string, string[]>;
  /** Level ids read from broken files (when the file still names one), so the map can show them as broken. */
  invalidIds: Set<string>;
}

/** Why a bundled level without a D1 row is broken. */
export const NO_TEXT = "chưa có câu chữ trong D1 (thiếu migration câu chữ)";

/**
 * Pure: builds a registry from a map of JSON modules (path → parsed JSON or `{default}`)
 * and the text from D1. The files hold the puzzle only, so a level plays only with its
 * D1 text applied; no text, or text that does not fit the puzzle, makes the level broken.
 */
export function buildRegistry(modules: Record<string, unknown>, texts: ContentTexts): LevelRegistry {
  const levels = new Map<string, LevelDefinition>();
  const invalid: Record<string, string[]> = {};
  const invalidIds = new Set<string>();
  for (const [path, mod] of Object.entries(modules)) {
    const file = unwrap(mod);
    const fileId = file && typeof file === "object" ? (file as { id?: unknown }).id : undefined;
    const saved = typeof fileId === "string" ? texts[`level:${fileId}`] : undefined;
    // The same check as a save on the admin page, then the validator for the typed level.
    const checked = saved ? validateLevelText(file, saved.text) : null;
    const result = checked?.ok ? validateLevel(checked.doc) : null;
    if (result?.ok) {
      if (levels.has(result.level.id)) invalid[path] = [`trùng id level "${result.level.id}"`];
      else levels.set(result.level.id, result.level);
    } else {
      invalid[path] = !checked ? [typeof fileId === "string" ? NO_TEXT : "file không có id level"] : !checked.ok ? checked.errors.map((e) => e.message) : result && !result.ok ? result.errors : [];
      if (typeof fileId === "string" && fileId.trim() !== "") invalidIds.add(fileId);
      console.error(`[level] ${path} không hợp lệ:\n- ${invalid[path].join("\n- ")}`);
    }
  }
  const sorted = [...levels.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  return { getLevel: (id) => levels.get(id), listLevels: () => sorted, invalid, invalidIds };
}

const unwrap = (mod: unknown): unknown =>
  mod && typeof mod === "object" && "default" in (mod as Record<string, unknown>) ? (mod as { default: unknown }).default : mod;

/** Every `src/levels/*.json` file as bundled (the puzzle only); adding a level is adding a file and its text migration. */
export function bundledLevelModules(): Record<string, unknown> {
  return import.meta.glob("../levels/*.json", { eager: true, import: "default" });
}

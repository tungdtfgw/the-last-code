import type { LevelDefinition } from "./level-types";
import { validateLevel } from "./validate-level";

export interface LevelRegistry {
  getLevel(id: string): LevelDefinition | undefined;
  listLevels(): LevelDefinition[];
  /** Files that failed validation, keyed by module path. */
  invalid: Record<string, string[]>;
  /** Level ids read from broken files (when the file still names one), so the map can show them as broken. */
  invalidIds: Set<string>;
}

/** Pure: builds a registry from a map of JSON modules (path → parsed JSON or `{default}`). */
export function buildRegistry(modules: Record<string, unknown>): LevelRegistry {
  const levels = new Map<string, LevelDefinition>();
  const invalid: Record<string, string[]> = {};
  const invalidIds = new Set<string>();
  for (const [path, mod] of Object.entries(modules)) {
    const raw =
      mod && typeof mod === "object" && "default" in (mod as Record<string, unknown>)
        ? (mod as { default: unknown }).default
        : mod;
    const result = validateLevel(raw);
    if (result.ok) {
      if (levels.has(result.level.id)) invalid[path] = [`trùng id level "${result.level.id}"`];
      else levels.set(result.level.id, result.level);
    } else {
      invalid[path] = result.errors;
      const id = raw && typeof raw === "object" ? (raw as { id?: unknown }).id : undefined;
      if (typeof id === "string" && id.trim() !== "") invalidIds.add(id);
      console.error(`[level] ${path} không hợp lệ:\n- ${result.errors.join("\n- ")}`);
    }
  }
  const sorted = [...levels.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  return { getLevel: (id) => levels.get(id), listLevels: () => sorted, invalid, invalidIds };
}

let defaultRegistry: LevelRegistry | null = null;

/** Registry of every `src/levels/*.json` file; adding a level is adding a file. */
export function getDefaultRegistry(): LevelRegistry {
  defaultRegistry ??= buildRegistry(import.meta.glob("../levels/*.json", { eager: true }));
  return defaultRegistry;
}

import type { LevelDefinition } from "./level-types";
import { validateLevel } from "./validate-level";

export interface LevelRegistry {
  getLevel(id: string): LevelDefinition | undefined;
  listLevels(): LevelDefinition[];
  /** Files that failed validation, keyed by module path. */
  invalid: Record<string, string[]>;
}

/** Pure: builds a registry from a map of JSON modules (path → parsed JSON or `{default}`). */
export function buildRegistry(modules: Record<string, unknown>): LevelRegistry {
  const levels = new Map<string, LevelDefinition>();
  const invalid: Record<string, string[]> = {};
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
      console.error(`[level] ${path} không hợp lệ:\n- ${result.errors.join("\n- ")}`);
    }
  }
  const sorted = [...levels.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  return { getLevel: (id) => levels.get(id), listLevels: () => sorted, invalid };
}

let defaultRegistry: LevelRegistry | null = null;

/** Registry of every `src/levels/*.json` file; adding a level is adding a file. */
export function getDefaultRegistry(): LevelRegistry {
  defaultRegistry ??= buildRegistry(import.meta.glob("../levels/*.json", { eager: true }));
  return defaultRegistry;
}

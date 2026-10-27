import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { ContentTexts } from "../src/account/account-api";
import { applyText, CHAPTER_TEXT, extractText, LEVEL_TEXT } from "../src/content/text-fields";
import { buildRegistry, type LevelRegistry } from "../src/game/level-registry";
import type { LevelDefinition } from "../src/game/level-types";
import { validateChapterText } from "../src/content/validate-text";
import { validateChapter } from "../src/story/validate-chapter";
import type { ChapterDefinition } from "../src/story/story-types";

/**
 * The real player-facing text for tests: a fresh in-memory database with every
 * migration applied (as dev, e2e and D1 get it), laid onto the puzzle files of
 * the repo. The repo has no other copy of the text. Nothing here imports a
 * JSON module, so Playwright specs can use it too.
 */

const MIGRATIONS = new URL("../db/migrations/", import.meta.url);
const LEVELS = new URL("../src/levels/", import.meta.url);
const CHAPTER = new URL("../src/story/chapter-1.json", import.meta.url);

const readJson = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

let texts: ContentTexts | null = null;

/** `content_text` after every migration, as `GET /api/content/text` serves it. */
export function migratedTexts(): ContentTexts {
  if (texts) return texts;
  const db = new DatabaseSync(":memory:");
  for (const name of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) db.exec(readFileSync(new URL(name, MIGRATIONS), "utf8"));
  const rows = db.prepare("SELECT doc_id, revision, text FROM content_text ORDER BY doc_id").all();
  db.close();
  texts = Object.fromEntries(rows.map((r) => [String(r.doc_id), { revision: Number(r.revision), text: JSON.parse(String(r.text)) }]));
  return texts;
}

/** The puzzle files of `src/levels`, keyed like `import.meta.glob` keys them. */
export function levelFiles(): Record<string, unknown> {
  const names = readdirSync(LEVELS).filter((f) => f.endsWith(".json")).sort();
  return Object.fromEntries(names.map((f) => [`../levels/${f}`, readJson(new URL(f, LEVELS))]));
}

let registry: LevelRegistry | null = null;

/** The registry the game builds for a player: bundled files plus D1 text. */
export function realRegistry(): LevelRegistry {
  registry ??= buildRegistry(levelFiles(), migratedTexts());
  return registry;
}

/**
 * A registry of made-up level documents that carry their own text (puzzle and
 * text in one object), as if each had that text in D1.
 */
export function registryOf(modules: Record<string, unknown>): LevelRegistry {
  const texts: ContentTexts = {};
  for (const mod of Object.values(modules)) {
    const doc = mod && typeof mod === "object" && "default" in mod ? (mod as { default: unknown }).default : mod;
    const id = doc && typeof doc === "object" ? (doc as { id?: unknown }).id : undefined;
    if (typeof id === "string") texts[`level:${id}`] = { revision: 1, text: extractText(doc, LEVEL_TEXT) };
  }
  return buildRegistry(modules, texts);
}

/** A validated level with its migrated text. Throws when it does not build. */
export function realLevel(id: string): LevelDefinition {
  const level = realRegistry().getLevel(id);
  if (!level) throw new Error(`level ${id} không dựng được: ${JSON.stringify(realRegistry().invalid)}`);
  return clone(level);
}

/** The level file with its migrated text applied, unvalidated: a fresh copy a test may change. */
export function realLevelJson(id: string): Record<string, any> {
  const file = Object.values(levelFiles()).find((f) => (f as { id?: unknown }).id === id);
  if (!file) throw new Error(`không có file cho level ${id}`);
  const text = migratedTexts()[`level:${id}`];
  if (!text) throw new Error(`level ${id} không có câu chữ trong migration`);
  return applyText(file, text.text, LEVEL_TEXT).doc as Record<string, any>;
}

/** The chapter file (the puzzle only). */
export const chapterFile = (): Record<string, any> => readJson(CHAPTER) as Record<string, any>;

/** The chapter file with its migrated text applied, unvalidated. */
export function realChapterJson(): Record<string, any> {
  const file = chapterFile();
  return applyText(file, migratedTexts()[`chapter:${file.chapter}`]?.text, CHAPTER_TEXT).doc as Record<string, any>;
}

/** The validated chapter with its migrated text, checked like the game checks it (`getChapter`). */
export function realChapter(): ChapterDefinition {
  const file = chapterFile();
  const checked = validateChapterText(file, migratedTexts()[`chapter:${file.chapter}`]?.text);
  const result = checked.ok ? validateChapter(checked.doc) : null;
  if (!result?.ok) throw new Error(`chương 1 không dựng được: ${JSON.stringify(checked.ok ? result : checked.errors)}`);
  return result.chapter;
}

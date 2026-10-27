import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { docIdOf, type DocKind } from "./content-store.js";

/** The puzzle files of this deploy: the same files the client bundles (`vercel.json` `includeFiles`). */
export const LEVELS_DIR = fileURLToPath(new URL("../../src/levels", import.meta.url));
export const CHAPTER_FILE = fileURLToPath(new URL("../../src/story/chapter-1.json", import.meta.url));

export interface BundledDoc {
  docId: string;
  kind: DocKind;
  id: string;
  title: string;
  file: string;
  /** The parsed file: the puzzle only (its text is in D1). */
  puzzle: unknown;
  /** The file could not be read; such a document is listed but cannot be saved. */
  errors: string[];
}

export interface BundledContent {
  docs: BundledDoc[];
  get(kind: DocKind, id: string): BundledDoc | undefined;
}

const titleOf = (v: unknown) =>
  v && typeof v === "object" && typeof (v as { title?: unknown }).title === "string" ? (v as { title: string }).title : "";

function readJson(file: string): { value: unknown; error?: string } {
  try {
    return { value: JSON.parse(readFileSync(file, "utf8")) };
  } catch (err) {
    return { value: null, error: `không đọc được file: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** Reads every level file and the chapter file. Pure apart from the reads; the paths are parameters for tests and the migration script. */
export function loadBundledContent(levelsDir = LEVELS_DIR, chapterFile = CHAPTER_FILE): BundledContent {
  const docs: BundledDoc[] = [];
  const seen = new Set<string>();
  for (const name of readdirSync(levelsDir).filter((f) => f.endsWith(".json")).sort()) {
    const file = join(levelsDir, name);
    const { value, error } = readJson(file);
    const id = value && typeof value === "object" ? (value as { id?: unknown }).id : undefined;
    if (typeof id !== "string" || id.trim() === "") continue; // nothing to address it by
    const docId = docIdOf("level", id);
    if (seen.has(docId)) continue;
    seen.add(docId);
    docs.push({ docId, kind: "level", id, title: titleOf(value), file, puzzle: value, errors: error ? [error] : [] });
  }
  const { value, error } = readJson(chapterFile);
  const n = value && typeof value === "object" ? (value as { chapter?: unknown }).chapter : undefined;
  const id = typeof n === "number" ? String(n) : "1";
  docs.push({ docId: docIdOf("chapter", id), kind: "chapter", id, title: titleOf(value), file: chapterFile, puzzle: value, errors: error ? [error] : [] });
  docs.sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id, "en", { numeric: true }) : a.kind === "chapter" ? -1 : 1));
  return { docs, get: (kind, id) => docs.find((d) => d.kind === kind && d.id === id) };
}

let cached: BundledContent | null = null;

/** Read once per function instance. */
export function bundledContent(): BundledContent {
  cached ??= loadBundledContent();
  return cached;
}

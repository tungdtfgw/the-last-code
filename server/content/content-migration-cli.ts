import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isObject } from "../../src/content/text-fields.js";
import { MIGRATIONS_DIR } from "../db/sqlite-db.js";
import { validateDocText } from "./admin-content.js";
import { CHAPTER_FILE, LEVELS_DIR, loadBundledContent } from "./bundled-content.js";
import { contentMigrationSql, TEXT_INSERT } from "./content-migration.js";

export interface MigrationOptions {
  /** A text document: the shape `extractText` gives, optionally with `docId`. */
  file: string;
  /** `level:1.5` / `chapter:1`; overrides `docId` in the file. */
  doc?: string;
  levelsDir?: string;
  chapterFile?: string;
  migrationsDir?: string;
  now?: Date;
  log?(line: string): void;
}

export type MigrationResult = { ok: true; path: string } | { ok: false };

/** Documents that already get their text from a migration, with the file that gives it. */
export function textMigrations(dir: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort())
    for (const m of readFileSync(join(dir, name), "utf8").matchAll(TEXT_INSERT)) if (!found.has(m[1])) found.set(m[1], name);
  return found;
}

function nextMigrationName(dir: string, docId: string): string {
  const numbers = readdirSync(dir).map((f) => /^(\d+)_.*\.sql$/.exec(f)?.[1]).filter((n): n is string => n !== undefined);
  const next = Math.max(0, ...numbers.map(Number)) + 1;
  return `${String(next).padStart(4, "0")}_content_${docId.replace(/[^a-z0-9]+/gi, "_")}.sql`;
}

/**
 * Checks a new document's text on the puzzle in the repo (the same check as a
 * save on the admin page, answer leaks included) and writes the migration that
 * gives D1 its first revision. Refuses a document that already has one.
 */
export function writeContentMigration(opts: MigrationOptions): MigrationResult {
  const log = opts.log ?? console.log;
  const migrationsDir = opts.migrationsDir ?? MIGRATIONS_DIR;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(opts.file, "utf8"));
  } catch (err) {
    log(`Không đọc được ${opts.file}: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false };
  }
  if (!isObject(raw)) {
    log(`${opts.file} phải là một object JSON (tài liệu câu chữ)`);
    return { ok: false };
  }
  const { docId: fileDocId, ...text } = raw;
  const docId = opts.doc ?? fileDocId;
  if (typeof docId !== "string" || !/^(level|chapter):[^:]+$/.test(docId)) {
    log('Thiếu mã tài liệu: ghi "docId": "level:1.5" trong file hoặc thêm --doc level:1.5');
    return { ok: false };
  }
  const doc = loadBundledContent(opts.levelsDir ?? LEVELS_DIR, opts.chapterFile ?? CHAPTER_FILE).docs.find((d) => d.docId === docId);
  if (!doc) {
    log(`${docId}: repo không có file câu đố cho tài liệu này (src/levels/*.json hoặc src/story/chapter-1.json)`);
    return { ok: false };
  }
  const existing = textMigrations(migrationsDir).get(docId);
  if (existing) {
    log(`${docId}: đã có câu chữ trong db/migrations/${existing}. Sửa câu trên trang quản trị; đổi cấu trúc câu đố thì viết migration vá (docs/huong-dan-deploy.md).`);
    return { ok: false };
  }
  const result = validateDocText(doc.kind, doc.puzzle, text);
  if (!result.ok) {
    log(`${docId}: câu chữ không qua bộ kiểm, chưa ghi gì:\n${result.errors.map((e) => `  - ${e.message}`).join("\n")}`);
    return { ok: false };
  }
  const path = join(migrationsDir, nextMigrationName(migrationsDir, docId));
  writeFileSync(path, contentMigrationSql([{ docId, text: result.text }], (opts.now ?? new Date()).toISOString()));
  log(`${docId}: đã ghi ${path}`);
  log("Áp migration này lên D1 thật trước khi deploy code có level mới (docs/huong-dan-deploy.md).");
  return { ok: true, path };
}

/** `node scripts/content-migration.mjs <file.json> [--doc level:1.5]` */
export function runCli(argv: string[]): number {
  const args = [...argv];
  const at = args.indexOf("--doc");
  const doc = at >= 0 ? args.splice(at, 2)[1] : undefined;
  if (args.length !== 1 || (at >= 0 && !doc)) {
    console.error("Cách dùng: npm run content:migration -- <tài-liệu-câu-chữ.json> [--doc level:1.5]");
    return 2;
  }
  return writeContentMigration({ file: args[0], doc }).ok ? 0 : 1;
}

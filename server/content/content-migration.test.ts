import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import sample from "../../tests/fixtures/levels/level-test-sample.json";
import { extractText, LEVEL_TEXT, stripText } from "../../src/content/text-fields";
import { all } from "../db/db";
import { MIGRATIONS_DIR, SqliteDb } from "../db/sqlite-db";
import { validateDocText } from "./admin-content";
import { CHAPTER_FILE, LEVELS_DIR, loadBundledContent } from "./bundled-content";
import { writeContentMigration } from "./content-migration-cli";
import { contentMigrationSql } from "./content-migration";
import { readAllTexts } from "./content-store";

describe("a fresh database (migrations only)", () => {
  test("every bundled level and the chapter have text that passes the admin page's check", async () => {
    const db = new SqliteDb(":memory:");
    const rows = await readAllTexts(db);
    const history = await all(db, "SELECT doc_id FROM content_text_history WHERE revision = 1");
    db.close();
    const docs = loadBundledContent().docs;
    expect(docs.map((d) => d.docId)).toEqual(expect.arrayContaining(["chapter:1", "level:1.1"]));
    for (const doc of docs) {
      const row = rows[doc.docId];
      expect(row, `${doc.docId}: chưa có migration câu chữ (npm run content:migration)`).toBeDefined();
      const result = validateDocText(doc.kind, doc.puzzle, row.text);
      expect(result.ok ? [] : result.errors, doc.docId).toEqual([]);
      expect(history.map((r) => r.doc_id)).toContain(doc.docId);
    }
  });

  test("applying a text migration again never overwrites text an admin saved", () => {
    const raw = new DatabaseSync(":memory:");
    for (const name of readdirSync(MIGRATIONS_DIR).sort()) raw.exec(readFileSync(join(MIGRATIONS_DIR, name), "utf8"));
    raw.exec("UPDATE content_text SET revision = 2, text = '{\"briefing\":\"sửa\"}', updated_by = 'boss' WHERE doc_id = 'level:1.4'");
    const textMigration = readdirSync(MIGRATIONS_DIR).find((f) => /_content_chapter_1\.sql$/.test(f))!;
    raw.exec(readFileSync(join(MIGRATIONS_DIR, textMigration), "utf8"));
    expect(raw.prepare("SELECT revision, text, updated_by FROM content_text WHERE doc_id = 'level:1.4'").get()).toEqual({
      revision: 2,
      text: '{"briefing":"sửa"}',
      updated_by: "boss",
    });
    expect(raw.prepare("SELECT count(*) AS n FROM content_text_history WHERE doc_id = 'level:1.4'").get()).toEqual({ n: 1 });
    raw.close();
  });
});

test("a statement D1 would refuse is never written", () => {
  expect(() => contentMigrationSql([{ docId: "level:9.9", text: { briefing: "x".repeat(100_000) } }], "2026-10-28T00:00:00.000Z")).toThrow(/100000/);
});

describe("npm run content:migration", () => {
  let dir: string;
  let lines: string[];
  let opts: { levelsDir: string; chapterFile: string; migrationsDir: string; log(l: string): void; now: Date };
  const textFile = (text: unknown) => {
    const file = join(dir, "text.json");
    writeFileSync(file, JSON.stringify(text));
    return file;
  };
  const sampleText = () => JSON.parse(JSON.stringify(extractText(sample, LEVEL_TEXT)));
  const written = () => readdirSync(opts.migrationsDir).filter((f) => !readdirSync(MIGRATIONS_DIR).includes(f));

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "tlc-content-"));
    lines = [];
    opts = {
      levelsDir: join(dir, "levels"),
      chapterFile: CHAPTER_FILE,
      migrationsDir: join(dir, "migrations"),
      log: (l) => lines.push(l),
      now: new Date("2026-11-01T09:00:00.000Z"),
    };
    cpSync(LEVELS_DIR, opts.levelsDir, { recursive: true });
    cpSync(MIGRATIONS_DIR, opts.migrationsDir, { recursive: true });
    // A new level: its puzzle file in the repo, its text in a document the designer wrote.
    writeFileSync(join(opts.levelsDir, "level-9-9.json"), JSON.stringify(stripText(sample, LEVEL_TEXT)));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  test("writes the next migration, which gives the new level its text on a fresh database", async () => {
    const r = writeContentMigration({ ...opts, file: textFile({ docId: "level:9.9", ...sampleText() }) });
    expect(r.ok).toBe(true);
    const next = String(Math.max(...readdirSync(MIGRATIONS_DIR).map((f) => Number(f.slice(0, 4)))) + 1).padStart(4, "0");
    expect(written()).toEqual([`${next}_content_level_9_9.sql`]);

    const db = new SqliteDb(":memory:", opts.migrationsDir);
    const rows = await readAllTexts(db);
    db.close();
    expect(rows["level:9.9"]).toMatchObject({ revision: 1, updatedBy: "migration", updatedAt: "2026-11-01T09:00:00.000Z", text: sampleText() });
    expect(rows["level:1.4"]?.revision).toBe(1);
  });

  test("refuses a second migration for the same document", () => {
    expect(writeContentMigration({ ...opts, file: textFile(sampleText()), doc: "level:9.9" }).ok).toBe(true);
    expect(writeContentMigration({ ...opts, file: textFile(sampleText()), doc: "level:9.9" }).ok).toBe(false);
    expect(writeContentMigration({ ...opts, file: textFile(sampleText()), doc: "level:1.4" }).ok).toBe(false);
    expect(lines.at(-1)).toMatch(/level:1\.4: đã có câu chữ trong db\/migrations\/\d{4}_content_/);
    expect(written()).toHaveLength(1);
  });

  test("refuses text the admin page would refuse, naming the field, and writes nothing", () => {
    const text = sampleText();
    text.reactions.wrong_value = "Dùng int là xong.";
    delete text.outro;
    expect(writeContentMigration({ ...opts, file: textFile(text), doc: "level:9.9" }).ok).toBe(false);
    expect(lines.join("\n")).toMatch(/outro: thiếu/);
    expect(written()).toEqual([]);
  });

  test("refuses a document with no puzzle file or no id", () => {
    expect(writeContentMigration({ ...opts, file: textFile(sampleText()), doc: "level:8.8" }).ok).toBe(false);
    expect(lines.at(-1)).toMatch(/level:8\.8: repo không có file câu đố/);
    expect(writeContentMigration({ ...opts, file: textFile(sampleText()) }).ok).toBe(false);
    expect(lines.at(-1)).toMatch(/Thiếu mã tài liệu/);
    expect(writeContentMigration({ ...opts, file: join(dir, "missing.json"), doc: "level:9.9" }).ok).toBe(false);
    expect(written()).toEqual([]);
  });
});

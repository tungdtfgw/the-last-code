import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { all, sql } from "./db";
import { MIGRATIONS_DIR, SqliteDb } from "./sqlite-db";

let dir: string | null = null;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = null;
});

test("migrations apply exactly once across reopenings", async () => {
  dir = mkdtempSync(join(tmpdir(), "tlc-db-"));
  const path = join(dir, "x.sqlite");
  const a = new SqliteDb(path);
  await all(a, "INSERT INTO rate_limits (key, window_start, count) VALUES ('k', 'now', 1)");
  a.close();
  const b = new SqliteDb(path);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  expect(files.slice(0, 3)).toEqual(["0001_init.sql", "0002_draft_rev.sql", "0003_content_text.sql"]);
  expect(await all(b, "SELECT name FROM d1_migrations ORDER BY id")).toEqual(files.map((name) => ({ name })));
  expect(await all(b, "SELECT count FROM rate_limits")).toEqual([{ count: 1 }]);
  b.close();
});

test("a failing statement rolls back the whole batch", async () => {
  const db = new SqliteDb();
  await expect(
    db.batch([
      sql("INSERT INTO rate_limits (key, window_start, count) VALUES ('k', 'now', 1)"),
      sql("INSERT INTO nope VALUES (1)"),
    ]),
  ).rejects.toThrow();
  expect(await all(db, "SELECT * FROM rate_limits")).toEqual([]);
});

test("CHECK constraints reject out-of-range stars", async () => {
  const db = new SqliteDb();
  await all(db, "INSERT INTO users VALUES ('u', 'a', 'a@b.c', 'h', 's', NULL, 'now')");
  await expect(
    all(db, "INSERT INTO level_progress (user_id, level_id, best_stars, updated_at) VALUES ('u', '1.1', 4, 'now')"),
  ).rejects.toThrow(/CHECK/);
});

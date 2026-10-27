import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { DbError, type Db, type Row, type Statement } from "./db.js";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../../db/migrations", import.meta.url));

/**
 * Local driver for dev, e2e and tests (`node:sqlite`). Applies pending
 * migrations on open, tracking them in `d1_migrations` like wrangler does, so a
 * local file never drifts from D1.
 */
export class SqliteDb implements Db {
  private readonly db: DatabaseSync;

  constructor(path = ":memory:", migrationsDir = MIGRATIONS_DIR) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.migrate(migrationsDir);
  }

  private migrate(dir: string) {
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)",
    );
    const applied = new Set(this.db.prepare("SELECT name FROM d1_migrations").all().map((r) => r.name));
    for (const name of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      if (applied.has(name)) continue;
      this.transaction(() => {
        this.db.exec(readFileSync(join(dir, name), "utf8"));
        this.db.prepare("INSERT INTO d1_migrations (name) VALUES (?)").run(name);
      });
    }
  }

  private transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN");
    try {
      const out = fn();
      this.db.exec("COMMIT");
      return out;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  async batch(statements: Statement[]): Promise<Row[][]> {
    try {
      return this.transaction(() => statements.map((s) => this.db.prepare(s.sql).all(...s.params) as Row[]));
    } catch (err) {
      throw new DbError(err instanceof Error ? err.message : String(err));
    }
  }

  close() {
    this.db.close();
  }
}

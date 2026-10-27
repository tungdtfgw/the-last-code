import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AuthContext } from "./auth/accounts.js";
import { SqliteDb } from "./db/sqlite-db.js";
import { OutboxMailer, type Mail } from "./mail/mailer.js";

/** A fresh in-memory database plus a real outbox in a temp folder, with a controllable clock. */
export function testAuthContext(overrides: Partial<AuthContext> = {}) {
  const outboxDir = mkdtempSync(join(tmpdir(), "tlc-outbox-"));
  const clock = { now: new Date("2026-10-25T08:00:00.000Z") };
  const db = new SqliteDb(":memory:");
  const ctx: AuthContext = {
    db,
    mailer: new OutboxMailer(outboxDir),
    origin: "http://localhost:5173",
    now: () => new Date(clock.now),
    callerLimits: true,
    ...overrides,
  };
  const mails = (): Mail[] =>
    readdirSync(outboxDir)
      .sort()
      .map((f) => JSON.parse(readFileSync(join(outboxDir, f), "utf8")) as Mail);
  const advance = (ms: number) => {
    clock.now = new Date(clock.now.getTime() + ms);
  };
  const cleanup = () => {
    db.close();
    rmSync(outboxDir, { recursive: true, force: true });
  };
  return { ctx, db, mails, advance, cleanup, outboxDir };
}

/** The token at the end of a mail link (`…/#/activate/<token>`). */
export const tokenOf = (mail: Mail) => mail.link.split("/").pop()!;

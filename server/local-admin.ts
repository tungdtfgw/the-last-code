import { randomUUID } from "node:crypto";
import { isEmail, isPassword, isUsername, normalizeEmail, normalizeUsername } from "../src/account/account-rules.js";
import { hashPassword, newSalt } from "./auth/password.js";
import { sql, type Db } from "./db/db.js";

type Env = Record<string, string | undefined>;

/**
 * `LOCAL_ADMIN_USERNAME` / `LOCAL_ADMIN_PASSWORD` (optional `LOCAL_ADMIN_EMAIL`), usually from `.env.local`.
 * Returns the admin to provision, `null` when unset, or the reason it is unusable.
 */
export function readLocalAdmin(env: Env): { username: string; password: string; email: string } | null | string {
  const raw = env.LOCAL_ADMIN_USERNAME?.trim();
  if (!raw) return null;
  const username = normalizeUsername(raw);
  const password = env.LOCAL_ADMIN_PASSWORD ?? "";
  const email = normalizeEmail(env.LOCAL_ADMIN_EMAIL || `${username}@local.test`);
  if (!isUsername(username)) return `LOCAL_ADMIN_USERNAME "${raw}" sai dạng (3–20 ký tự a-z, 0-9, _)`;
  if (!isPassword(password)) return "LOCAL_ADMIN_PASSWORD phải dài 8–72 ký tự";
  if (!isEmail(email)) return `LOCAL_ADMIN_EMAIL "${email}" sai dạng`;
  return { username, password, email };
}

/**
 * Makes the local admin an activated account whose password is the configured one,
 * creating it or resetting its password. Only ever called for the local SQLite database.
 */
export async function ensureLocalAdmin(db: Db, admin: { username: string; password: string; email: string }, now = new Date()) {
  const salt = newSalt();
  const at = now.toISOString();
  await db.batch([
    sql(
      `INSERT INTO users (id, username, email, password_md5, salt, activated_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT(username) DO UPDATE SET password_md5 = excluded.password_md5, salt = excluded.salt,
         activated_at = COALESCE(users.activated_at, excluded.activated_at)`,
      randomUUID(),
      admin.username,
      admin.email,
      hashPassword(admin.password, salt),
      salt,
      at,
    ),
  ]);
}

import { randomUUID } from "node:crypto";
import { first, sql, type Db } from "../db/db.js";
import type { Mailer } from "../mail/mailer.js";
import { activationMail, resetMail } from "../mail/templates.js";
import { hashPassword, newSalt, verifyPassword } from "./password.js";
import { clear, hit } from "./rate-limit.js";
import { createSession } from "./sessions.js";
import { newToken, sha256 } from "./tokens.js";
import { isEmail, isPassword, isUsername, maskEmail, normalizeEmail, normalizeUsername } from "./validate.js";

export interface AuthContext {
  db: Db;
  mailer: Mailer;
  /** `APP_ORIGIN`; links in mails are `${origin}/#/activate/<token>` and `${origin}/#/reset/<token>`. */
  origin: string;
  now: () => Date;
  /** false only in local e2e (`AUTH_RATE_LIMIT=off`): drops the per-address and per-network limits. */
  callerLimits: boolean;
}

export type AuthError =
  | "invalid_username"
  | "invalid_email"
  | "invalid_password"
  | "username_taken"
  | "email_taken"
  | "token_invalid"
  | "bad_credentials"
  | "not_activated"
  | "too_many_attempts"
  | "mail_rate_limited"
  | "network_rate_limited"
  | "mail_quota"
  | "mail_failed";

export type Failure = { ok: false; error: AuthError; retryAfterSec?: number; email?: string };
export type Result<T extends object = object> = ({ ok: true } & T) | Failure;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const ACTIVATE_TTL_MS = DAY;
export const RESET_TTL_MS = HOUR;
/** An account nobody activated for this long frees its username and email. */
export const STALE_UNACTIVATED_MS = 7 * DAY;
export const LOGIN_LIMIT = { max: 10, windowMs: 15 * MINUTE };
export const MAIL_PER_EMAIL = [
  { prefix: "mail", max: 1, windowMs: MINUTE },
  { prefix: "mail-day-to", max: 5, windowMs: DAY },
];
/** Gmail allows about 500 mails a day; stop short of it for the whole system. */
export const MAIL_PER_DAY = 450;
/**
 * First activation mails of new accounts may use only this much of the day, so a
 * flood of sign-ups always leaves room for resends and password resets.
 */
export const SIGNUP_MAILS_PER_DAY = 300;
/**
 * Register, resend and forgot-password requests per network per hour. A whole
 * class behind one school address fits; one machine scripting sign-ups does not.
 */
export const REQUESTS_PER_NETWORK = { max: 60, windowMs: HOUR };

type Purpose = "activate" | "reset";
type UserRow = { id: string; username: string; email: string; activated: boolean };

const toUser = (r: Record<string, unknown>): UserRow => ({
  id: String(r.id),
  username: String(r.username),
  email: String(r.email),
  activated: r.activated_at !== null,
});

async function findUser(db: Db, usernameOrEmail: unknown): Promise<UserRow | null> {
  const key = normalizeEmail(usernameOrEmail);
  if (!key) return null;
  const row = await first(db, "SELECT id, username, email, activated_at FROM users WHERE username = ?1 OR email = ?1", key);
  return row ? toUser(row) : null;
}

/**
 * Counts one mail-sending request from the caller's network (an IPv4 address or an
 * IPv6 /64). Without a known address (local runs) there is nothing to count.
 */
async function limitNetwork(ctx: AuthContext, ip: string | null | undefined): Promise<Failure | null> {
  const key = ctx.callerLimits ? networkKey(ip) : null;
  if (!key) return null;
  const r = await hit(ctx.db, `mail-ip:${key}`, REQUESTS_PER_NETWORK.max, REQUESTS_PER_NETWORK.windowMs, ctx.now());
  return r.allowed ? null : { ok: false, error: "network_rate_limited", retryAfterSec: Math.ceil(r.retryAfterMs / 1000) };
}

/** `1.2.3.4` stays as is; an IPv6 address becomes its /64, the block one subscriber usually gets. */
export function networkKey(ip: string | null | undefined): string | null {
  const raw = ip?.trim().toLowerCase();
  if (!raw) return null;
  if (!raw.includes(":")) return /^[\d.]+$/.test(raw) ? raw : null;
  const halves = raw.split("::");
  if (halves.length > 2) return null;
  const [head, tail = null] = halves;
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  if (tail === null && left.length !== 8) return null;
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  if (groups.length !== 8 || !groups.every((g) => /^[\da-f]{1,4}$/.test(g))) return null;
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/** Checks the mail limits, issues a fresh one-time token (retiring older ones of the same purpose) and sends the mail. */
async function deliver(ctx: AuthContext, user: UserRow, purpose: Purpose, { signup = false } = {}): Promise<Result> {
  const now = ctx.now();
  if (ctx.callerLimits) {
    for (const l of MAIL_PER_EMAIL) {
      const r = await hit(ctx.db, `${l.prefix}:${user.email}`, l.max, l.windowMs, now);
      if (!r.allowed) return { ok: false, error: "mail_rate_limited", retryAfterSec: Math.ceil(r.retryAfterMs / 1000) };
    }
  }
  const date = now.toISOString().slice(0, 10);
  if (signup) {
    const pool = await hit(ctx.db, `mail-day-signup:${date}`, SIGNUP_MAILS_PER_DAY, DAY, now);
    if (!pool.allowed) return { ok: false, error: "mail_quota" };
  }
  const day = await hit(ctx.db, `mail-day:${date}`, MAIL_PER_DAY, DAY, now);
  if (!day.allowed) return { ok: false, error: "mail_quota" };

  const token = newToken();
  const ttl = purpose === "activate" ? ACTIVATE_TTL_MS : RESET_TTL_MS;
  await ctx.db.batch([
    sql(
      "UPDATE email_tokens SET used_at = ?3 WHERE user_id = ?1 AND purpose = ?2 AND used_at IS NULL",
      user.id,
      purpose,
      now.toISOString(),
    ),
    sql(
      "INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?1, ?2, ?3, ?4)",
      sha256(token),
      user.id,
      purpose,
      new Date(now.getTime() + ttl).toISOString(),
    ),
  ]);
  const link = `${ctx.origin}/#/${purpose}/${token}`;
  const mail = purpose === "activate" ? activationMail(user.email, user.username, link) : resetMail(user.email, user.username, link);
  try {
    await ctx.mailer.send(mail);
    return { ok: true };
  } catch (err) {
    console.error(`[mail] gửi thư ${purpose} thất bại:`, err instanceof Error ? err.message : err);
    return { ok: false, error: "mail_failed" };
  }
}

export async function register(
  ctx: AuthContext,
  input: { username?: unknown; email?: unknown; password?: unknown },
  ip?: string | null,
): Promise<Result<{ mailSent: boolean; mailError?: AuthError; retryAfterSec?: number }>> {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  if (!isUsername(username)) return { ok: false, error: "invalid_username" };
  if (!isEmail(email)) return { ok: false, error: "invalid_email" };
  if (!isPassword(input.password)) return { ok: false, error: "invalid_password" };
  const limited = await limitNetwork(ctx, ip);
  if (limited) return limited;

  const now = ctx.now();
  const salt = newSalt();
  const id = randomUUID();
  const staleBefore = new Date(now.getTime() - STALE_UNACTIVATED_MS).toISOString();
  const [, inserted] = await ctx.db.batch([
    sql(
      "DELETE FROM users WHERE activated_at IS NULL AND created_at < ?3 AND (username = ?1 OR email = ?2)",
      username,
      email,
      staleBefore,
    ),
    sql(
      `INSERT INTO users (id, username, email, password_md5, salt, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT DO NOTHING RETURNING id`,
      id,
      username,
      email,
      hashPassword(input.password, salt),
      salt,
      now.toISOString(),
    ),
  ]);
  if (inserted.length === 0) {
    // Lost to an existing account, or to a parallel registration of the same name.
    const taken = await first(ctx.db, "SELECT 1 FROM users WHERE username = ?1", username);
    return { ok: false, error: taken ? "username_taken" : "email_taken" };
  }
  const sent = await deliver(ctx, { id, username, email, activated: false }, "activate", { signup: true });
  return sent.ok
    ? { ok: true, mailSent: true }
    : { ok: true, mailSent: false, mailError: sent.error, retryAfterSec: sent.retryAfterSec };
}

export async function activate(ctx: AuthContext, token: unknown): Promise<Result<{ alreadyActive?: boolean }>> {
  if (typeof token !== "string" || !token) return { ok: false, error: "token_invalid" };
  const hash = sha256(token);
  const now = ctx.now().toISOString();
  const [used] = await ctx.db.batch([
    sql(
      `UPDATE email_tokens SET used_at = ?2
       WHERE token_hash = ?1 AND purpose = 'activate' AND used_at IS NULL AND expires_at > ?2 RETURNING user_id`,
      hash,
      now,
    ),
    // changes() is the row count of the claim above: only the request that claimed the token activates.
    sql(
      `UPDATE users SET activated_at = ?2 WHERE changes() = 1 AND activated_at IS NULL
       AND id = (SELECT user_id FROM email_tokens WHERE token_hash = ?1)`,
      hash,
      now,
    ),
  ]);
  if (used.length > 0) return { ok: true };
  // A reload or a second click on a link that already did its job is not an error.
  const row = await first(
    ctx.db,
    `SELECT u.activated_at FROM email_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ?1 AND t.purpose = 'activate' AND t.used_at IS NOT NULL`,
    hash,
  );
  if (row && row.activated_at !== null) return { ok: true, alreadyActive: true };
  return { ok: false, error: "token_invalid" };
}

/** Always reports success, so the answer never tells whether an account exists. */
export async function resendActivation(ctx: AuthContext, usernameOrEmail: unknown, ip?: string | null): Promise<Result> {
  // Counted before the lookup, so the answer still says nothing about the account.
  const limited = await limitNetwork(ctx, ip);
  if (limited) return limited;
  const user = await findUser(ctx.db, usernameOrEmail);
  if (user && !user.activated) {
    const sent = await deliver(ctx, user, "activate");
    // Limits are about the caller's own address; only the daily system quota is worth telling.
    if (!sent.ok && (sent.error === "mail_quota" || sent.error === "mail_rate_limited")) return sent;
  }
  return { ok: true };
}

export async function login(
  ctx: AuthContext,
  input: { username?: unknown; password?: unknown },
): Promise<Result<{ sessionId: string; user: { id: string; username: string; email: string } }>> {
  const username = normalizeUsername(input.username);
  if (!isUsername(username) || typeof input.password !== "string") return { ok: false, error: "bad_credentials" };
  const key = `login:${username}`;
  // Count first: parallel guesses each take a slot, so at most LOGIN_LIMIT.max passwords get checked.
  const attempt = await hit(ctx.db, key, LOGIN_LIMIT.max, LOGIN_LIMIT.windowMs, ctx.now(), { lockout: true });
  if (!attempt.allowed) return { ok: false, error: "too_many_attempts", retryAfterSec: Math.ceil(attempt.retryAfterMs / 1000) };

  const row = await first(
    ctx.db,
    "SELECT id, username, email, password_md5, salt, activated_at FROM users WHERE username = ?1",
    username,
  );
  if (!row || !verifyPassword(input.password, String(row.salt), String(row.password_md5))) {
    return { ok: false, error: "bad_credentials" };
  }
  await clear(ctx.db, key);
  const user = toUser(row);
  if (!user.activated) return { ok: false, error: "not_activated", email: maskEmail(user.email) };
  const sessionId = await createSession(ctx.db, user.id, ctx.now());
  return { ok: true, sessionId, user: { id: user.id, username: user.username, email: user.email } };
}

/** "Quên mật khẩu" and "Đổi mật khẩu": always reports success; mails only an activated account. */
export async function requestPasswordReset(ctx: AuthContext, usernameOrEmail: unknown, ip?: string | null): Promise<Result> {
  const limited = await limitNetwork(ctx, ip);
  if (limited) return limited;
  const user = await findUser(ctx.db, usernameOrEmail);
  if (user?.activated) {
    const sent = await deliver(ctx, user, "reset");
    if (!sent.ok && (sent.error === "mail_quota" || sent.error === "mail_rate_limited")) return sent;
  }
  return { ok: true };
}

/** Sets a new password from a reset link, then signs the account out everywhere. */
export async function resetPassword(ctx: AuthContext, token: unknown, password: unknown): Promise<Result> {
  if (typeof token !== "string" || !token) return { ok: false, error: "token_invalid" };
  if (!isPassword(password)) return { ok: false, error: "invalid_password" };
  const hash = sha256(token);
  const now = ctx.now().toISOString();
  const salt = newSalt();
  const [used] = await ctx.db.batch([
    sql(
      `UPDATE email_tokens SET used_at = ?2
       WHERE token_hash = ?1 AND purpose = 'reset' AND used_at IS NULL AND expires_at > ?2 RETURNING user_id`,
      hash,
      now,
    ),
    // Only the request that claimed the token (changes() = 1) sets the password; the fresh salt then
    // identifies that user for the clean-up, so a reused token can never reach these statements.
    sql(
      "UPDATE users SET salt = ?2, password_md5 = ?3 WHERE changes() = 1 AND id = (SELECT user_id FROM email_tokens WHERE token_hash = ?1)",
      hash,
      salt,
      hashPassword(password, salt),
    ),
    sql("DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE salt = ?1)", salt),
    sql("DELETE FROM rate_limits WHERE key = 'login:' || (SELECT username FROM users WHERE salt = ?1)", salt),
  ]);
  return used.length > 0 ? { ok: true } : { ok: false, error: "token_invalid" };
}

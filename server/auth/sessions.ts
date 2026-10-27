import { first, sql, type Db } from "../db/db.js";
import { newToken, sha256 } from "./tokens.js";

export const SESSION_COOKIE = "tlc_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  username: string;
  email: string;
}

/** Creates a session and returns the raw id for the cookie; the database keeps only its hash. */
export async function createSession(db: Db, userId: string, now: Date): Promise<string> {
  const id = newToken();
  const expires = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  await db.batch([sql("INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?1, ?2, ?3)", sha256(id), userId, expires)]);
  return id;
}

export async function currentUser(db: Db, sessionId: string | null, now: Date): Promise<SessionUser | null> {
  if (!sessionId) return null;
  const hash = sha256(sessionId);
  const row = await first(
    db,
    "SELECT u.id, u.username, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?1",
    hash,
  );
  if (!row) return null;
  if (String(row.expires_at) <= now.toISOString()) {
    await first(db, "DELETE FROM sessions WHERE id_hash = ?1", hash);
    return null;
  }
  return { id: String(row.id), username: String(row.username), email: String(row.email) };
}

export async function revokeSession(db: Db, sessionId: string | null) {
  if (sessionId) await first(db, "DELETE FROM sessions WHERE id_hash = ?1", sha256(sessionId));
}

export function readSessionCookie(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=") || null;
  }
  return null;
}

/** `Secure` is dropped only for plain-http localhost (dev and e2e). */
export function sessionCookie(id: string, { secure }: { secure: boolean }) {
  return `${SESSION_COOKIE}=${id}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;
}

export function clearSessionCookie({ secure }: { secure: boolean }) {
  return `${SESSION_COOKIE}=; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=0`;
}

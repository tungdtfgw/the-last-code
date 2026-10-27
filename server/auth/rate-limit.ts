import { first, type Db } from "../db/db.js";

export interface LimitResult {
  allowed: boolean;
  count: number;
  /** Time until the current window ends. */
  retryAfterMs: number;
}

/**
 * Fixed-window counter. It counts first and decides after, in one statement,
 * so parallel requests cannot all read "under the limit" and slip through.
 * With `lockout`, the attempt that goes over the limit restarts the window, so
 * the block lasts a full window from that moment.
 */
export async function hit(
  db: Db,
  key: string,
  limit: number,
  windowMs: number,
  now: Date,
  { lockout = false }: { lockout?: boolean } = {},
): Promise<LimitResult> {
  const cutoff = new Date(now.getTime() - windowMs).toISOString();
  const row = await first(
    db,
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE
         WHEN rate_limits.window_start <= ?3 THEN ?2
         WHEN ?4 = 1 AND rate_limits.count + 1 = ?5 THEN ?2
         ELSE rate_limits.window_start END
     RETURNING count, window_start`,
    key,
    now.toISOString(),
    cutoff,
    lockout ? 1 : 0,
    limit + 1,
  );
  const count = Number(row?.count ?? 1);
  const start = Date.parse(String(row?.window_start ?? now.toISOString()));
  return { allowed: count <= limit, count, retryAfterMs: Math.max(0, start + windowMs - now.getTime()) };
}

export async function clear(db: Db, key: string) {
  await first(db, "DELETE FROM rate_limits WHERE key = ?1", key);
}

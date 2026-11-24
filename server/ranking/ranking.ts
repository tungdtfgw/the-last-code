import { all, type Db } from "../db/db.js";
import type { BundledContent } from "../content/bundled-content.js";

/** One starred level of one activated account, as read from `level_progress`. */
export interface RankingRow {
  userId: string;
  username: string;
  hidden: boolean;
  levelId: string;
  stars: number;
  firstStarAt: string | null;
  starsAt: string | null;
}

export interface RankingEntry {
  /** 1-based; null for an account an admin keeps off the board (shown to admins only). */
  rank: number | null;
  username: string;
  levelId: string;
  stars: number;
  me: boolean;
  hidden?: true;
}

export interface Ranking {
  /** Accounts that hold a rank. */
  total: number;
  entries: RankingEntry[];
  /** The viewer's place; null when they have no level yet or are hidden. */
  me: { rank: number; levelId: string; stars: number } | null;
}

export const RANKING_LIMIT = 50;

/**
 * The play order of this deploy: every chapter file in number order, its
 * `levels` joined, keeping only ids that have a readable level file (the
 * "built" rule of `progression.ts`, without the D1 text check).
 */
export function playOrder(content: BundledContent): string[] {
  const levels = new Set(content.docs.filter((d) => d.kind === "level" && d.errors.length === 0).map((d) => d.id));
  const chapters = content.docs
    .filter((d) => d.kind === "chapter" && d.errors.length === 0)
    .sort((a, b) => Number(a.id) - Number(b.id));
  const order: string[] = [];
  for (const c of chapters) {
    const ids = (c.puzzle as { levels?: unknown }).levels;
    if (!Array.isArray(ids)) continue;
    for (const id of ids) if (typeof id === "string" && levels.has(id) && !order.includes(id)) order.push(id);
  }
  return order;
}

interface Standing {
  userId: string;
  username: string;
  hidden: boolean;
  /** Index in the play order of the last level of the unbroken starred run. */
  reached: number;
  levelId: string;
  stars: number;
  /** When the player got there: the latest first star along the run, or the last level's latest rise. */
  at: string | null;
}

const latest = (a: string | null, b: string | null) => (a === null || b === null ? null : a > b ? a : b);

function standingOf(rows: RankingRow[], order: string[]): Standing | null {
  const byLevel = new Map(rows.map((r) => [r.levelId, r]));
  let reached = -1;
  let at: string | null = "";
  for (let i = 0; i < order.length; i++) {
    const row = byLevel.get(order[i]);
    if (!row || row.stars <= 0) break;
    reached = i;
    at = latest(at, row.firstStarAt);
  }
  if (reached < 0) return null;
  const last = byLevel.get(order[reached])!;
  return {
    userId: last.userId,
    username: last.username,
    hidden: last.hidden,
    reached,
    levelId: last.levelId,
    stars: last.stars,
    at: latest(at, last.starsAt),
  };
}

/** Further level first, then more stars on it, then whoever got there first (unknown time last), then the name. */
function compare(a: Standing, b: Standing): number {
  if (a.reached !== b.reached) return b.reached - a.reached;
  if (a.stars !== b.stars) return b.stars - a.stars;
  if (a.at !== b.at) {
    if (a.at === null) return 1;
    if (b.at === null) return -1;
    return a.at < b.at ? -1 : 1;
  }
  return a.username < b.username ? -1 : a.username > b.username ? 1 : 0;
}

/** Pure: ranks the rows. Admins also get the hidden accounts, unranked, after the list. */
export function computeRanking(
  rows: RankingRow[],
  order: string[],
  viewer: { id: string; isAdmin: boolean },
  limit = RANKING_LIMIT,
): Ranking {
  const byUser = new Map<string, RankingRow[]>();
  for (const r of rows) {
    const list = byUser.get(r.userId);
    if (list) list.push(r);
    else byUser.set(r.userId, [r]);
  }
  const standings = [...byUser.values()].map((r) => standingOf(r, order)).filter((s): s is Standing => s !== null);
  standings.sort(compare);

  const ranked = standings.filter((s) => !s.hidden);
  const entry = (s: Standing, rank: number | null): RankingEntry => ({
    rank,
    username: s.username,
    levelId: s.levelId,
    stars: s.stars,
    me: s.userId === viewer.id,
    ...(s.hidden ? { hidden: true as const } : {}),
  });
  const entries = ranked.slice(0, limit).map((s, i) => entry(s, i + 1));
  if (viewer.isAdmin) entries.push(...standings.filter((s) => s.hidden).map((s) => entry(s, null)));

  const mine = ranked.findIndex((s) => s.userId === viewer.id);
  const me = mine < 0 ? null : { rank: mine + 1, levelId: ranked[mine].levelId, stars: ranked[mine].stars };
  return { total: ranked.length, entries, me };
}

const READ_ROWS = `
SELECT u.id, u.username, u.ranking_hidden, lp.level_id, lp.best_stars, lp.first_star_at, lp.stars_at
FROM users u JOIN level_progress lp ON lp.user_id = u.id
WHERE u.activated_at IS NOT NULL AND lp.best_stars > 0`;

export async function readRanking(db: Db, content: BundledContent, viewer: { id: string; isAdmin: boolean }): Promise<Ranking> {
  const rows = (await all(db, READ_ROWS)).map(
    (r): RankingRow => ({
      userId: String(r.id),
      username: String(r.username),
      hidden: Number(r.ranking_hidden) !== 0,
      levelId: String(r.level_id),
      stars: Number(r.best_stars),
      firstStarAt: r.first_star_at === null ? null : String(r.first_star_at),
      starsAt: r.stars_at === null ? null : String(r.stars_at),
    }),
  );
  return computeRanking(rows, playOrder(content), viewer);
}

/** Returns whether an account with that name exists. */
export async function setRankingHidden(db: Db, username: string, hidden: boolean): Promise<boolean> {
  const rows = await all(db, "UPDATE users SET ranking_hidden = ?1 WHERE username = ?2 RETURNING id", hidden ? 1 : 0, username);
  return rows.length > 0;
}

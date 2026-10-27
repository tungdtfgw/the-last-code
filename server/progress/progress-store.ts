import { sql, type Db, type Row } from "../db/db.js";
import { ROUTE_ID } from "../../src/shell/route-id.js";
import {
  MAX_DRAFT_CHARS,
  sanitizeLevelProgress,
  sanitizeStory,
  type LevelProgress,
  type ProgressSnapshotDto,
  type StarCount,
  type StoryProgress,
} from "../../src/storage/progress-repository.js";

export const MAX_IMPORT_LEVELS = 50;
export const MAX_IMPORT_STORIES = 200;
/** Rows one account may hold. The chapter has far fewer levels and stories; the cap keeps made-up ids from filling D1. */
export const MAX_LEVEL_ROWS = 100;
export const MAX_STORY_ROWS = 200;

export class LimitError extends Error {
  override name = "LimitError";
}

const toLevel = (r: Row): LevelProgress => ({
  draft: r.draft === null ? null : String(r.draft),
  bestStars: Number(r.best_stars) as StarCount,
  runs: Number(r.runs),
  hintsOpened: Number(r.hints_opened) as StarCount,
  updatedAt: String(r.updated_at),
});

/** A draft the patch really sets: null clears it, a valid string replaces it, anything else is ignored (same as `mergeLevelProgress`). */
function patchDraft(patch: Record<string, unknown>): { set: boolean; value: string | null } {
  if (!("draft" in patch)) return { set: false, value: null };
  if (patch.draft === null) return { set: true, value: null };
  if (typeof patch.draft === "string" && patch.draft.length <= MAX_DRAFT_CHARS) return { set: true, value: patch.draft };
  return { set: false, value: null };
}

// Merged in SQL so overlapping requests never overwrite each other: stars, runs
// and hints take the max. A draft (?8 = 1) replaces the stored one only when its
// revision ?9 (the client's edit time) is not older, so a slow or retried request
// cannot bring back older text. Import passes ?8 = 2: an old local draft only
// fills an empty slot. A new row is refused once the account holds MAX_LEVEL_ROWS.
const UPSERT_LEVEL = `
INSERT INTO level_progress (user_id, level_id, draft, draft_rev, best_stars, runs, hints_opened, updated_at)
SELECT ?1, ?2, ?3, CASE WHEN ?8 = 1 THEN ?9 ELSE 0 END, ?4, ?5, ?6, ?7
WHERE EXISTS (SELECT 1 FROM level_progress WHERE user_id = ?1 AND level_id = ?2)
   OR (SELECT COUNT(*) FROM level_progress WHERE user_id = ?1) < ${MAX_LEVEL_ROWS}
ON CONFLICT (user_id, level_id) DO UPDATE SET
  draft = CASE
    WHEN ?8 = 1 AND excluded.draft_rev >= level_progress.draft_rev THEN excluded.draft
    WHEN ?8 = 2 THEN COALESCE(level_progress.draft, excluded.draft)
    ELSE level_progress.draft END,
  draft_rev = CASE WHEN ?8 = 1 THEN MAX(level_progress.draft_rev, excluded.draft_rev) ELSE level_progress.draft_rev END,
  best_stars = MAX(level_progress.best_stars, excluded.best_stars),
  runs = MAX(level_progress.runs, excluded.runs),
  hints_opened = MAX(level_progress.hints_opened, excluded.hints_opened),
  updated_at = excluded.updated_at
RETURNING draft, best_stars, runs, hints_opened, updated_at`;

/** `draftRev` from the client orders drafts; a patch without one counts as written now. */
function draftRev(patch: Record<string, unknown>, now: Date) {
  const rev = patch.draftRev;
  return typeof rev === "number" && Number.isSafeInteger(rev) && rev > 0 ? rev : now.getTime();
}

function upsertLevel(userId: string, levelId: string, raw: unknown, now: Date, mode: "patch" | "import") {
  const patch = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const clean = sanitizeLevelProgress(patch);
  const draft = patchDraft(patch);
  const draftMode = mode === "import" ? 2 : draft.set ? 1 : 0;
  return sql(
    UPSERT_LEVEL,
    userId,
    levelId,
    draft.value,
    clean.bestStars,
    clean.runs,
    clean.hintsOpened,
    now.toISOString(),
    draftMode,
    draftRev(patch, now),
  );
}

const readLevels = (userId: string) =>
  sql("SELECT level_id, draft, best_stars, runs, hints_opened, updated_at FROM level_progress WHERE user_id = ?1", userId);
const readStory = (userId: string) => sql("SELECT story_id FROM story_seen WHERE user_id = ?1 ORDER BY rowid", userId);

function toSnapshot(levelRows: Row[], storyRows: Row[]): ProgressSnapshotDto {
  const levels: Record<string, LevelProgress> = {};
  for (const r of levelRows) levels[String(r.level_id)] = toLevel(r);
  return { levels, story: sanitizeStory({ seen: storyRows.map((r) => r.story_id) }) };
}

export async function readProgress(db: Db, userId: string): Promise<ProgressSnapshotDto> {
  const [levels, story] = await db.batch([readLevels(userId), readStory(userId)]);
  return toSnapshot(levels, story);
}

export async function updateLevel(db: Db, userId: string, levelId: string, patch: unknown, now: Date): Promise<LevelProgress> {
  const [rows] = await db.batch([upsertLevel(userId, levelId, patch, now, "patch")]);
  if (!rows[0]) throw new LimitError("too many levels");
  return toLevel(rows[0]);
}

const insertStories = (userId: string, ids: string[], now: Date) =>
  sql(
    `INSERT OR IGNORE INTO story_seen (user_id, story_id, seen_at) SELECT ?1, value, ?2 FROM json_each(?3)
     WHERE (SELECT COUNT(*) FROM story_seen WHERE user_id = ?1) < ${MAX_STORY_ROWS}`,
    userId,
    now.toISOString(),
    JSON.stringify(ids),
  );

export async function markStorySeen(db: Db, userId: string, storyId: string, now: Date): Promise<StoryProgress> {
  const [, rows] = await db.batch([insertStories(userId, [storyId], now), readStory(userId)]);
  return sanitizeStory({ seen: rows.map((r) => r.story_id) });
}

/**
 * Folds progress kept on an old device into the account. Idempotent: stars, runs
 * and hints take the max, the story set is a union, and a local draft never
 * overwrites one the account already has. Ids that are not route ids are skipped.
 */
export async function importProgress(db: Db, userId: string, raw: unknown, now: Date): Promise<ProgressSnapshotDto> {
  const body = raw && typeof raw === "object" ? (raw as { levels?: unknown; story?: unknown }) : {};
  const levels = body.levels && typeof body.levels === "object" ? Object.entries(body.levels) : [];
  const statements = levels
    .filter(([id]) => ROUTE_ID.test(id))
    .slice(0, MAX_IMPORT_LEVELS)
    .map(([id, value]) => upsertLevel(userId, id, value, now, "import"));
  const stories = sanitizeStory(body.story).seen.filter((id) => ROUTE_ID.test(id)).slice(0, MAX_IMPORT_STORIES);
  if (stories.length) statements.push(insertStories(userId, stories, now));
  const results = await db.batch([...statements, readLevels(userId), readStory(userId)]);
  return toSnapshot(results.at(-2)!, results.at(-1)!);
}


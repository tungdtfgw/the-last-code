export type StarCount = 0 | 1 | 2 | 3;

export interface LevelProgress {
  draft: string | null;
  bestStars: StarCount;
  runs: number;
  hintsOpened: StarCount;
  updatedAt: string;
}

export interface Settings {
  muted: boolean;
}

/**
 * The only door to persisted progress. UI code never touches `localStorage`;
 * a future Supabase implementation only has to satisfy this interface.
 */
export interface ProgressRepository {
  /** false = "không lưu" mode (storage blocked, full or broken). */
  readonly persistent: boolean;
  getLevel(levelId: string): Promise<LevelProgress>;
  updateLevel(levelId: string, patch: Partial<LevelProgress>): Promise<LevelProgress>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  /** Called when `persistent` flips to false mid-session. */
  onPersistenceLost(listener: () => void): () => void;
}

export const SCHEMA_VERSION = 1;
export const MAX_DRAFT_CHARS = 50_000;

export const defaultLevelProgress = (): LevelProgress => ({
  draft: null,
  bestStars: 0,
  runs: 0,
  hintsOpened: 0,
  updatedAt: new Date(0).toISOString(),
});

export const defaultSettings = (): Settings => ({ muted: false });

const clampStars = (v: unknown): StarCount =>
  v === 0 || v === 1 || v === 2 || v === 3 ? v : 0;

/** Repair one stored level record field by field. */
export function sanitizeLevelProgress(raw: unknown): LevelProgress {
  const d = defaultLevelProgress();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  return {
    draft: typeof r.draft === "string" && r.draft.length <= MAX_DRAFT_CHARS ? r.draft : null,
    bestStars: clampStars(r.bestStars),
    runs: Number.isSafeInteger(r.runs) && (r.runs as number) >= 0 ? (r.runs as number) : 0,
    hintsOpened: clampStars(r.hintsOpened),
    updatedAt: typeof r.updatedAt === "string" && !Number.isNaN(Date.parse(r.updatedAt)) ? r.updatedAt : d.updatedAt,
  };
}

export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { muted: r.muted === true };
}

/**
 * Merge rule shared by every implementation (and by a future account merge):
 * best stars and hints never go down, runs never go down.
 */
export function mergeLevelProgress(old: LevelProgress, patch: Partial<LevelProgress>, now = new Date()): LevelProgress {
  const next = sanitizeLevelProgress({ ...old, ...patch });
  return {
    // An explicit null clears the draft; an invalid (e.g. oversized) draft never replaces a good one.
    draft: !("draft" in patch) ? old.draft : patch.draft === null ? null : (next.draft ?? old.draft),
    bestStars: Math.max(old.bestStars, next.bestStars) as StarCount,
    hintsOpened: Math.max(old.hintsOpened, next.hintsOpened) as StarCount,
    runs: Math.max(old.runs, next.runs),
    updatedAt: now.toISOString(),
  };
}

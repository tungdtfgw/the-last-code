import {
  SCHEMA_VERSION,
  defaultLevelProgress,
  defaultSettings,
  mergeLevelProgress,
  mergeStory,
  sanitizeLevelProgress,
  sanitizeSettings,
  sanitizeStory,
  type LevelProgress,
  type ProgressRepository,
  type ProgressSnapshotDto,
  type Settings,
  type StoryProgress,
} from "./progress-repository";

export const PROGRESS_KEY = "the-last-code:progress:v1";
export const SETTINGS_KEY = "the-last-code:settings:v1";

/** `story` is optional, so adding it did not need a schema bump; old builds ignore it. */
type V1Progress = { schemaVersion: 1; levels: Record<string, LevelProgress>; story?: StoryProgress };
/** Upgrades from older schema versions. Empty today: unknown versions reset to defaults. */
const migrations: Record<number, (old: unknown) => V1Progress> = {};

/**
 * `localStorage` implementation. Every read/write is guarded: on a quota or
 * security error it keeps working in memory for the rest of the session and
 * reports `persistent = false`.
 */
export class LocalStorageRepository implements ProgressRepository {
  private progress: V1Progress;
  private settings: Settings;
  private _persistent = true;
  private warned = false;
  private listeners = new Set<() => void>();

  constructor(private readonly storage: Storage) {
    this.progress = this.readProgress();
    this.settings = this.readSettings();
  }

  get persistent() {
    return this._persistent;
  }

  onPersistenceLost(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private warnOnce(message: string, err?: unknown) {
    if (this.warned) return;
    this.warned = true;
    console.warn(`[storage] ${message}`, err ?? "");
  }

  private readJson(key: string): unknown {
    let text: string | null;
    try {
      text = this.storage.getItem(key);
    } catch (err) {
      this.losePersistence(err);
      return null;
    }
    if (text === null) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      this.warnOnce(`dữ liệu ${key} hỏng, dùng mặc định`, err);
      return null;
    }
  }

  private readProgress(): V1Progress {
    const raw = this.readJson(PROGRESS_KEY) as { schemaVersion?: unknown; levels?: unknown } | null;
    if (!raw || typeof raw !== "object") return { schemaVersion: 1, levels: {} };
    let data: unknown = raw;
    if (raw.schemaVersion !== SCHEMA_VERSION) {
      const migrate = typeof raw.schemaVersion === "number" ? migrations[raw.schemaVersion] : undefined;
      if (!migrate) {
        this.warnOnce(`schema ${String(raw.schemaVersion)} không hỗ trợ, dùng mặc định`);
        return { schemaVersion: 1, levels: {} };
      }
      data = migrate(raw);
    }
    const levels: Record<string, LevelProgress> = {};
    const rawLevels = (data as { levels?: unknown }).levels;
    if (rawLevels && typeof rawLevels === "object") {
      for (const [id, value] of Object.entries(rawLevels)) levels[id] = sanitizeLevelProgress(value);
    }
    // A broken story field reads as "nothing seen" and never affects the levels.
    const story = sanitizeStory((data as { story?: unknown }).story);
    return { schemaVersion: 1, levels, story };
  }

  private readSettings(): Settings {
    const raw = this.readJson(SETTINGS_KEY) as { schemaVersion?: unknown } | null;
    if (!raw || raw.schemaVersion !== SCHEMA_VERSION) return defaultSettings();
    return sanitizeSettings(raw);
  }

  private losePersistence(err: unknown) {
    this.warnOnce("không ghi/đọc được bộ nhớ trình duyệt, chuyển sang chế độ không lưu", err);
    if (!this._persistent) return;
    this._persistent = false;
    for (const l of this.listeners) l();
  }

  private write(key: string, value: unknown) {
    if (!this._persistent) return;
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (err) {
      this.losePersistence(err);
    }
  }

  async getLevel(levelId: string) {
    return { ...(this.progress.levels[levelId] ?? defaultLevelProgress()) };
  }

  async updateLevel(levelId: string, patch: Partial<LevelProgress>) {
    const next = mergeLevelProgress(await this.getLevel(levelId), patch);
    this.progress.levels[levelId] = next;
    this.write(PROGRESS_KEY, this.progress);
    return { ...next };
  }

  async getStory() {
    return { seen: [...(this.progress.story?.seen ?? [])] };
  }

  async markStorySeen(id: string) {
    // Merge synchronously so overlapping calls never drop each other's id.
    this.progress.story = mergeStory({ seen: this.progress.story?.seen ?? [] }, { seen: [id] });
    this.write(PROGRESS_KEY, this.progress);
    return this.getStory();
  }

  /** Everything this browser holds, for folding into an account. */
  exportProgress(): ProgressSnapshotDto {
    return { levels: { ...this.progress.levels }, story: { seen: [...(this.progress.story?.seen ?? [])] } };
  }

  async getSettings() {
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<Settings>) {
    this.settings = sanitizeSettings({ ...this.settings, ...patch });
    this.write(SETTINGS_KEY, { schemaVersion: SCHEMA_VERSION, ...this.settings });
    return { ...this.settings };
  }
}

/** Progress an older build left in this browser, or null when there is none (settings are not progress). */
export function readLocalProgress(storage: Storage): ProgressSnapshotDto | null {
  try {
    if (storage.getItem(PROGRESS_KEY) === null) return null;
  } catch {
    return null;
  }
  const snap = new LocalStorageRepository(storage).exportProgress();
  return Object.keys(snap.levels).length === 0 && snap.story.seen.length === 0 ? null : snap;
}

/** Removes the progress key only; the mute setting stays on the device. */
export function clearLocalProgress(storage: Storage) {
  try {
    storage.removeItem(PROGRESS_KEY);
  } catch {
    // storage blocked: nothing we can clear
  }
}

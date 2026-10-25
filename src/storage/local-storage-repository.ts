import {
  SCHEMA_VERSION,
  defaultLevelProgress,
  defaultSettings,
  mergeLevelProgress,
  sanitizeLevelProgress,
  sanitizeSettings,
  type LevelProgress,
  type ProgressRepository,
  type Settings,
} from "./progress-repository";

export const PROGRESS_KEY = "the-last-code:progress:v1";
export const SETTINGS_KEY = "the-last-code:settings:v1";

type V1Progress = { schemaVersion: 1; levels: Record<string, LevelProgress> };
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
    return { schemaVersion: 1, levels };
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

  async getSettings() {
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<Settings>) {
    this.settings = sanitizeSettings({ ...this.settings, ...patch });
    this.write(SETTINGS_KEY, { schemaVersion: SCHEMA_VERSION, ...this.settings });
    return { ...this.settings };
  }
}

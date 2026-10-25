import {
  defaultLevelProgress,
  defaultSettings,
  mergeLevelProgress,
  mergeStory,
  type LevelProgress,
  type ProgressRepository,
  type Settings,
  type StoryProgress,
} from "./progress-repository";

/** In-memory fallback: used when storage is blocked, and in tests. */
export class MemoryRepository implements ProgressRepository {
  private levels = new Map<string, LevelProgress>();
  private settings: Settings = defaultSettings();
  private story: StoryProgress = { seen: [] };

  constructor(readonly persistent = false) {}

  async getLevel(levelId: string) {
    return { ...(this.levels.get(levelId) ?? defaultLevelProgress()) };
  }

  async updateLevel(levelId: string, patch: Partial<LevelProgress>) {
    const next = mergeLevelProgress(await this.getLevel(levelId), patch);
    this.levels.set(levelId, next);
    return { ...next };
  }

  async getStory() {
    return { seen: [...this.story.seen] };
  }

  async markStorySeen(id: string) {
    this.story = mergeStory(this.story, { seen: [id] });
    return this.getStory();
  }

  async getSettings() {
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<Settings>) {
    this.settings = { ...this.settings, ...patch };
    return { ...this.settings };
  }

  onPersistenceLost(): () => void {
    return () => {};
  }
}

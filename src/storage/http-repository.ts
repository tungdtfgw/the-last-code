import type { AccountApi } from "../account/account-api";
import {
  defaultLevelProgress,
  mergeLevelProgress,
  mergeStory,
  type LevelProgress,
  type ProgressRepository,
  type ProgressSnapshotDto,
  type Settings,
  type StarCount,
  type StoryProgress,
} from "./progress-repository";

export type SettingsStore = Pick<ProgressRepository, "getSettings" | "updateSettings">;

/** A level's drafts are sent at most this often (D1 free tier: 100k row writes a day). */
export const DRAFT_INTERVAL_MS = 10_000;
/** Waits between attempts after a network error or a 5xx. */
export const RETRY_DELAYS_MS = [1000, 3000, 9000];
/** Browsers allow ~64 KB in flight across all `keepalive` requests of a page. */
const KEEPALIVE_MAX_BYTES = 60 * 1024;

type Patch = Partial<LevelProgress>;

interface LevelSync {
  /** Sends for one level run one after another. */
  chain: Promise<void>;
  /** A send is waiting in `chain`; it reads memory when it starts, so one is enough. */
  queued: boolean;
  /** Memory holds a draft the server has not confirmed. */
  draftDirty: boolean;
  /** Edit time of the draft in memory; the server keeps the draft with the highest revision. */
  draftRev: number;
  timer: ReturnType<typeof setTimeout> | null;
}

export interface HttpRepositoryOptions {
  /** Sent with every write; the server refuses a write meant for another account. */
  userId?: string;
  sleep?: (ms: number) => Promise<void>;
  setTimer?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (id: ReturnType<typeof setTimeout>) => void;
  now?: () => number;
  /** Where `visibilitychange` / `pagehide` are heard; null in tests that drive `flushHeld` by hand. */
  doc?: Document | null;
}

const isDraftOnly = (patch: Patch) => Object.keys(patch).every((k) => k === "draft");

/**
 * Progress kept on the server, read from one snapshot and held in memory, so
 * `getLevel`/`getStory` never touch the network. Memory is the player's truth:
 * every write merges into it first, and every PUT carries the level's whole
 * state from memory at the moment it is sent (stars, runs and hints always; the
 * draft, with its edit-time revision, until the server confirms it). The server
 * merges with MAX and keeps the newest draft revision, so requests may arrive in
 * any order and any later success repairs an earlier failure.
 *
 * Draft-only changes go out at most every 10 s per level; anything else, and any
 * write while the page is hidden, goes out at once.
 */
export class HttpProgressRepository implements ProgressRepository {
  private levels = new Map<string, LevelProgress>();
  private story: StoryProgress;
  /** Seen stories the server has not confirmed yet. */
  private storyUnsent = new Set<string>();
  private sync = new Map<string, LevelSync>();
  private lostListeners = new Set<() => void>();
  private expiredListeners = new Set<() => void>();
  private _persistent = true;
  private expired = false;
  private closed = false;
  private lastRev = 0;
  private keepaliveInFlight = 0;
  private inflight = new Set<Promise<unknown>>();
  private readonly userId: string | undefined;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly setTimer: NonNullable<HttpRepositoryOptions["setTimer"]>;
  private readonly clearTimer: NonNullable<HttpRepositoryOptions["clearTimer"]>;
  private readonly now: () => number;
  private readonly doc: Document | null;

  constructor(
    snapshot: ProgressSnapshotDto,
    private readonly api: AccountApi,
    private readonly settings: SettingsStore,
    opts: HttpRepositoryOptions = {},
  ) {
    for (const [id, level] of Object.entries(snapshot.levels)) this.levels.set(id, { ...level });
    this.story = { seen: [...snapshot.story.seen] };
    this.userId = opts.userId;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((id) => clearTimeout(id));
    this.now = opts.now ?? Date.now;
    this.doc = opts.doc === undefined ? (typeof document === "undefined" ? null : document) : opts.doc;
    this.doc?.addEventListener("visibilitychange", this.onVisibility);
    this.doc?.defaultView?.addEventListener("pagehide", this.flushHeld);
  }

  get persistent() {
    return this._persistent;
  }

  onPersistenceLost(listener: () => void) {
    this.lostListeners.add(listener);
    return () => void this.lostListeners.delete(listener);
  }

  /** Called once when the server answers 401 (session gone or expired). */
  onSessionExpired(listener: () => void) {
    this.expiredListeners.add(listener);
    return () => void this.expiredListeners.delete(listener);
  }

  async getLevel(levelId: string) {
    return { ...(this.levels.get(levelId) ?? defaultLevelProgress()) };
  }

  async getStory() {
    return { seen: [...this.story.seen] };
  }

  getSettings(): Promise<Settings> {
    return this.settings.getSettings();
  }

  updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return this.settings.updateSettings(patch);
  }

  async updateLevel(levelId: string, patch: Patch) {
    const before = await this.getLevel(levelId);
    const next = mergeLevelProgress(before, patch);
    this.levels.set(levelId, next);
    const s = this.syncOf(levelId);
    if ("draft" in patch && next.draft !== before.draft) {
      s.draftDirty = true;
      s.draftRev = this.nextRev();
    }
    if (this.closed) return { ...next };
    if (!isDraftOnly(patch)) {
      // A real event (run, stars, hint) goes now and carries the waiting draft along.
      this.dropTimer(s);
      if (this.hidden()) this.track(this.send(levelId));
      else this.enqueue(levelId);
    } else if (s.draftDirty) {
      if (this.hidden()) this.sendNow(levelId);
      else
        s.timer ??= this.setTimer(() => {
          s.timer = null;
          this.enqueue(levelId);
        }, DRAFT_INTERVAL_MS);
    }
    return { ...next };
  }

  async markStorySeen(id: string) {
    this.story = mergeStory(this.story, { seen: [id] });
    this.storyUnsent.add(id);
    if (!this.closed) this.track(this.sendStories());
    return this.getStory();
  }

  /** Sends every unconfirmed draft right away (page hidden or closing, sign-out). */
  readonly flushHeld = () => {
    for (const [id, s] of this.sync) if (s.draftDirty) this.sendNow(id);
  };

  /** Resolves once every write started so far has finished (sent, or given up). */
  async idle() {
    while (this.inflight.size) await Promise.all([...this.inflight]);
  }

  /** Stops all network activity for good (sign-out): pending retries give up, nothing new is sent. */
  close() {
    this.closed = true;
    for (const s of this.sync.values()) this.dropTimer(s);
    this.doc?.removeEventListener("visibilitychange", this.onVisibility);
    this.doc?.defaultView?.removeEventListener("pagehide", this.flushHeld);
  }

  private readonly onVisibility = () => {
    if (this.hidden()) this.flushHeld();
  };

  private hidden() {
    return this.doc?.visibilityState === "hidden";
  }

  /** Edit-time revision, strictly increasing within this page. */
  private nextRev() {
    this.lastRev = Math.max(this.now(), this.lastRev + 1);
    return this.lastRev;
  }

  private syncOf(levelId: string): LevelSync {
    let s = this.sync.get(levelId);
    if (!s) {
      s = { chain: Promise.resolve(), queued: false, draftDirty: false, draftRev: 0, timer: null };
      this.sync.set(levelId, s);
    }
    return s;
  }

  private dropTimer(s: LevelSync) {
    if (s.timer) this.clearTimer(s.timer);
    s.timer = null;
  }

  /** Page is going away: send now instead of behind the queue. Revisions keep the order right on the server. */
  private sendNow(levelId: string) {
    if (this.closed) return;
    this.dropTimer(this.syncOf(levelId));
    this.track(this.send(levelId));
  }

  private enqueue(levelId: string) {
    const s = this.syncOf(levelId);
    if (s.queued) return;
    s.queued = true;
    s.chain = s.chain.then(async () => {
      s.queued = false;
      await this.send(levelId);
    });
    this.track(s.chain);
  }

  private async send(levelId: string) {
    const s = this.syncOf(levelId);
    let sentRev = 0;
    const row = await this.withRetry(() => {
      const mem = this.levels.get(levelId) ?? defaultLevelProgress();
      const body: Record<string, unknown> = { bestStars: mem.bestStars, runs: mem.runs, hintsOpened: mem.hintsOpened };
      sentRev = 0;
      if (s.draftDirty) {
        body.draft = mem.draft;
        body.draftRev = sentRev = s.draftRev;
      }
      const text = JSON.stringify(body);
      const keepalive = this.keepaliveInFlight === 0 && new TextEncoder().encode(text).length < KEEPALIVE_MAX_BYTES;
      if (keepalive) this.keepaliveInFlight++;
      return this.api.putLevel(levelId, text, { keepalive, userId: this.userId }).finally(() => {
        if (keepalive) this.keepaliveInFlight--;
      });
    });
    if (!row) return;
    if (sentRev && sentRev === s.draftRev) s.draftDirty = false;
    // Take what the server knows beyond this page (another device's stars); never step memory back.
    const mem = this.levels.get(levelId) ?? defaultLevelProgress();
    this.levels.set(levelId, {
      ...mem,
      bestStars: Math.max(mem.bestStars, row.bestStars) as StarCount,
      runs: Math.max(mem.runs, row.runs),
      hintsOpened: Math.max(mem.hintsOpened, row.hintsOpened) as StarCount,
    });
  }

  private async sendStories() {
    for (const id of [...this.storyUnsent]) {
      const seen = await this.withRetry(() => this.api.postStory(id, { userId: this.userId }));
      if (!seen) return; // still unsent; the next markStorySeen tries again
      this.storyUnsent.delete(id);
      this.story = mergeStory(this.story, seen);
    }
  }

  /** Retries network errors and 5xx; a 401 ends the session; any other 4xx is a write the server will never take. */
  private async withRetry<T>(attempt: () => Promise<{ ok: true; data: T } | { ok: false; status: number }>): Promise<T | null> {
    for (let i = 0; ; i++) {
      if (this.expired || this.closed) return null;
      const res = await attempt();
      if (res.ok) return res.data;
      if (this.closed) return null;
      if (res.status === 401) {
        this.sessionExpired();
        return null;
      }
      const retriable = res.status === 0 || res.status >= 500;
      if (!retriable || i >= RETRY_DELAYS_MS.length) {
        this.losePersistence();
        return null;
      }
      await this.sleep(RETRY_DELAYS_MS[i]);
    }
  }

  private track(p: Promise<unknown>) {
    this.inflight.add(p);
    void p.finally(() => this.inflight.delete(p));
  }

  private losePersistence() {
    if (!this._persistent) return;
    this._persistent = false;
    console.warn("[storage] không ghi được tiến độ lên máy chủ");
    for (const l of this.lostListeners) l();
  }

  private sessionExpired() {
    if (this.expired) return;
    this.expired = true;
    for (const l of this.expiredListeners) l();
  }
}

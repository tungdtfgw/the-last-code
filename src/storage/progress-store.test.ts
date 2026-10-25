import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createRepository } from "./create-repository";
import { LocalStorageRepository, PROGRESS_KEY, SETTINGS_KEY } from "./local-storage-repository";
import { MemoryRepository } from "./memory-repository";
import { mergeLevelProgress, defaultLevelProgress } from "./progress-repository";

class FakeStorage implements Storage {
  data = new Map<string, string>();
  failGet: Error | null = null;
  failSet: Error | null = null;
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    if (this.failGet) throw this.failGet;
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.failSet) throw this.failSet;
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const domError = (name: string) => Object.assign(new Error(name), { name });

afterEach(() => vi.restoreAllMocks());

describe("LocalStorageRepository", () => {
  test("round-trips through a fresh repository on the same storage (reload)", async () => {
    const storage = new FakeStorage();
    const a = new LocalStorageRepository(storage);
    expect(await a.getLevel("1.4")).toMatchObject({ draft: null, bestStars: 0, runs: 0, hintsOpened: 0 });
    await a.updateLevel("1.4", { draft: "x = 1", bestStars: 2, runs: 5, hintsOpened: 1 });
    const b = new LocalStorageRepository(storage);
    expect(await b.getLevel("1.4")).toMatchObject({ draft: "x = 1", bestStars: 2, runs: 5, hintsOpened: 1 });
    expect(JSON.parse(storage.data.get(PROGRESS_KEY)!).schemaVersion).toBe(1);
  });

  test("bestStars, hintsOpened and runs never decrease", async () => {
    const repo = new LocalStorageRepository(new FakeStorage());
    await repo.updateLevel("1.4", { bestStars: 3, hintsOpened: 2, runs: 4 });
    const after = await repo.updateLevel("1.4", { bestStars: 1, hintsOpened: 1, runs: 2 });
    expect(after).toMatchObject({ bestStars: 3, hintsOpened: 2, runs: 4 });
  });

  test("an oversized draft never replaces the last good one", async () => {
    const repo = new LocalStorageRepository(new FakeStorage());
    await repo.updateLevel("1.4", { draft: "good" });
    expect((await repo.updateLevel("1.4", { draft: "x".repeat(50_001) })).draft).toBe("good");
  });

  test("draft can be cleared and is kept when not in the patch", async () => {
    const repo = new LocalStorageRepository(new FakeStorage());
    await repo.updateLevel("1.4", { draft: "a" });
    expect((await repo.updateLevel("1.4", { runs: 1 })).draft).toBe("a");
    expect((await repo.updateLevel("1.4", { draft: null })).draft).toBeNull();
  });

  test("corrupt JSON, other schema versions and bad fields fall back to defaults without throwing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const raw of ["{nope", JSON.stringify({ schemaVersion: 0, levels: { "1.4": { runs: 9 } } }), "null", "42"]) {
      const s = new FakeStorage();
      s.data.set(PROGRESS_KEY, raw);
      const repo = new LocalStorageRepository(s);
      expect(await repo.getLevel("1.4")).toMatchObject({ runs: 0, bestStars: 0 });
      await repo.updateLevel("1.4", { runs: 1 });
      expect(JSON.parse(s.data.get(PROGRESS_KEY)!).levels["1.4"].runs).toBe(1);
    }
    const s = new FakeStorage();
    s.data.set(
      PROGRESS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        levels: { "1.4": { draft: 5, bestStars: 7, runs: -3, hintsOpened: "2", updatedAt: "lol" } },
      }),
    );
    expect(await new LocalStorageRepository(s).getLevel("1.4")).toEqual(defaultLevelProgress());
    s.data.set(PROGRESS_KEY, JSON.stringify({ schemaVersion: 1, levels: { "1.4": { draft: "x".repeat(50_001), runs: 2.5 } } }));
    expect(await new LocalStorageRepository(s).getLevel("1.4")).toMatchObject({ draft: null, runs: 0 });
  });

  test("SecurityError on read → not persistent, still usable in session", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = new FakeStorage();
    s.failGet = domError("SecurityError");
    const repo = new LocalStorageRepository(s);
    expect(repo.persistent).toBe(false);
    await repo.updateLevel("1.4", { runs: 2 });
    expect((await repo.getLevel("1.4")).runs).toBe(2);
  });

  test("QuotaExceededError on write → persistence lost event, data kept in memory", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = new FakeStorage();
    const repo = new LocalStorageRepository(s);
    const lost = vi.fn();
    repo.onPersistenceLost(lost);
    s.failSet = domError("QuotaExceededError");
    await expect(repo.updateLevel("1.4", { draft: "big", bestStars: 1 })).resolves.toMatchObject({ draft: "big" });
    expect(repo.persistent).toBe(false);
    expect(lost).toHaveBeenCalledTimes(1);
    expect(await repo.getLevel("1.4")).toMatchObject({ draft: "big", bestStars: 1 });
    await repo.updateLevel("1.4", { runs: 3 });
    expect(lost).toHaveBeenCalledTimes(1);
  });

  test("settings muted round-trip", async () => {
    const s = new FakeStorage();
    await new LocalStorageRepository(s).updateSettings({ muted: true });
    expect(JSON.parse(s.data.get(SETTINGS_KEY)!)).toEqual({ schemaVersion: 1, muted: true });
    expect(await new LocalStorageRepository(s).getSettings()).toEqual({ muted: true });
  });
});

describe("createRepository", () => {
  test("uses localStorage when the probe works", () => {
    expect(createRepository(() => new FakeStorage()).persistent).toBe(true);
  });
  test("falls back to memory when storage throws or is missing", () => {
    const s = new FakeStorage();
    s.failSet = domError("SecurityError");
    const repo = createRepository(() => s);
    expect(repo).toBeInstanceOf(MemoryRepository);
    expect(repo.persistent).toBe(false);
    expect(createRepository(() => { throw domError("SecurityError"); }).persistent).toBe(false);
    expect(createRepository(() => undefined).persistent).toBe(false);
  });
});

test("MemoryRepository follows the same merge rule", async () => {
  const repo = new MemoryRepository();
  await repo.updateLevel("1.4", { bestStars: 3 });
  expect((await repo.updateLevel("1.4", { bestStars: 0 })).bestStars).toBe(3);
  expect(mergeLevelProgress(defaultLevelProgress(), { runs: 1 }, new Date(5)).updatedAt).toBe(new Date(5).toISOString());
});

test("no file outside src/storage touches localStorage directly", () => {
  const srcDir = fileURLToPath(new URL("..", import.meta.url));
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && !relative(srcDir, full).startsWith("storage")) {
        if (readFileSync(full, "utf8").includes("localStorage")) offenders.push(relative(srcDir, full));
      }
    }
  };
  walk(srcDir);
  expect(offenders).toEqual([]);
});

import { describe, expect, test } from "vitest";
import { all } from "../db/db";
import { SqliteDb } from "../db/sqlite-db";
import { defaultLevelProgress, mergeLevelProgress, type LevelProgress } from "../../src/storage/progress-repository";
import { MAX_LEVEL_ROWS, importProgress, markStorySeen, readProgress, updateLevel } from "./progress-store";

const now = new Date("2026-10-25T08:00:00Z");

async function withUser() {
  const db = new SqliteDb();
  await all(db, "INSERT INTO users (id, username, email, password_md5, salt, activated_at, created_at) VALUES ('u1', 'alice', 'a@x.io', 'h', 's', 'now', 'now')");
  return db;
}

const strip = ({ updatedAt: _u, ...rest }: LevelProgress) => rest;

describe("updateLevel", () => {
  test("SQL merge matches mergeLevelProgress on the same patches", async () => {
    const db = await withUser();
    const patches: Partial<LevelProgress>[] = [
      { draft: "a", runs: 1 },
      { bestStars: 2, hintsOpened: 1 },
      { bestStars: 1, runs: 0, draft: "b" },
      { draft: "x".repeat(50_001) },
      { draft: null, hintsOpened: 3 },
      { runs: 7, draft: 5 as unknown as string },
    ];
    let expected = defaultLevelProgress();
    for (const p of patches) {
      expected = mergeLevelProgress(expected, p, now);
      expect(strip(await updateLevel(db, "u1", "1.1", p, now))).toEqual(strip(expected));
    }
  });

  test("overlapping writes never lose stars or runs", async () => {
    const db = await withUser();
    await Promise.all([
      updateLevel(db, "u1", "1.1", { bestStars: 3 }, now),
      updateLevel(db, "u1", "1.1", { runs: 5 }, now),
      updateLevel(db, "u1", "1.1", { bestStars: 1, draft: "d" }, now),
    ]);
    expect((await readProgress(db, "u1")).levels["1.1"]).toMatchObject({ bestStars: 3, runs: 5, draft: "d" });
  });

  test("a draft with an older revision never replaces a newer one, whatever the arrival order", async () => {
    const db = await withUser();
    await updateLevel(db, "u1", "1.1", { draft: "latest", draftRev: 2000 }, now);
    const late = await updateLevel(db, "u1", "1.1", { draft: "old", draftRev: 1000, runs: 4 }, now);
    expect(late).toMatchObject({ draft: "latest", runs: 4 });
  });

  test("an account cannot create more than MAX_LEVEL_ROWS level rows, but can keep updating its own", async () => {
    const db = await withUser();
    for (let i = 0; i < MAX_LEVEL_ROWS; i++) await updateLevel(db, "u1", `l${i}`, { runs: 1 }, now);
    await expect(updateLevel(db, "u1", "one-too-many", { runs: 1 }, now)).rejects.toThrow(/too many levels/);
    expect(await updateLevel(db, "u1", "l0", { runs: 2 }, now)).toMatchObject({ runs: 2 });
  });
});

describe("star times (ranking tie-break)", () => {
  const at = (iso: string) => new Date(iso);
  const times = async (db: SqliteDb, level = "1.1") =>
    (await all(db, "SELECT first_star_at, stars_at FROM level_progress WHERE user_id = 'u1' AND level_id = ?1", level))[0];

  test("a run without stars sets no time; the first star sets both; equal stars keep them; more stars move only stars_at", async () => {
    const db = await withUser();
    await updateLevel(db, "u1", "1.1", { runs: 1, draft: "x" }, at("2026-11-01T00:00:00Z"));
    expect(await times(db)).toEqual({ first_star_at: null, stars_at: null });
    await updateLevel(db, "u1", "1.1", { bestStars: 2 }, at("2026-11-02T00:00:00Z"));
    await updateLevel(db, "u1", "1.1", { bestStars: 2, draft: "y" }, at("2026-11-03T00:00:00Z"));
    await updateLevel(db, "u1", "1.1", { bestStars: 1 }, at("2026-11-04T00:00:00Z"));
    expect(await times(db)).toEqual({ first_star_at: "2026-11-02T00:00:00.000Z", stars_at: "2026-11-02T00:00:00.000Z" });
    await updateLevel(db, "u1", "1.1", { bestStars: 3 }, at("2026-11-05T00:00:00Z"));
    expect(await times(db)).toEqual({ first_star_at: "2026-11-02T00:00:00.000Z", stars_at: "2026-11-05T00:00:00.000Z" });
  });

  test("import sets the times of the stars it brings, once", async () => {
    const db = await withUser();
    const local = { levels: { "1.2": { bestStars: 2 } }, story: { seen: [] } };
    await importProgress(db, "u1", local, at("2026-11-02T00:00:00Z"));
    await importProgress(db, "u1", local, at("2026-11-03T00:00:00Z"));
    expect(await times(db, "1.2")).toEqual({ first_star_at: "2026-11-02T00:00:00.000Z", stars_at: "2026-11-02T00:00:00.000Z" });
  });
});

describe("importProgress", () => {
  const local = {
    levels: { "1.1": { bestStars: 1, runs: 2, draft: "old local" }, "1.2": { bestStars: 2, draft: "local 1.2" }, "bad id!": { bestStars: 3 } },
    story: { seen: ["prologue", "after-1.1"] },
  };

  test("takes the higher stars, unions stories, never overwrites a server draft, and is idempotent", async () => {
    const db = await withUser();
    await updateLevel(db, "u1", "1.1", { bestStars: 3, draft: "newer on server" }, now);
    await markStorySeen(db, "u1", "teaser", now);
    const once = await importProgress(db, "u1", local, now);
    const twice = await importProgress(db, "u1", local, now);
    expect(twice).toEqual(once);
    expect(once.levels["1.1"]).toMatchObject({ bestStars: 3, runs: 2, draft: "newer on server" });
    expect(once.levels["1.2"]).toMatchObject({ bestStars: 2, draft: "local 1.2" });
    expect(once.levels["bad id!"]).toBeUndefined();
    expect(once.story.seen).toEqual(["teaser", "prologue", "after-1.1"]);
  });

  test("caps the number of levels so one import fits a gateway batch", async () => {
    const db = await withUser();
    const levels = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`l${i}`, { runs: 1 }]));
    const snap = await importProgress(db, "u1", { levels, story: { seen: [] } }, now);
    expect(Object.keys(snap.levels)).toHaveLength(50);
  });
});

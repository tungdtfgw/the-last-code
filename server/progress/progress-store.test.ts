import { describe, expect, test } from "vitest";
import { all } from "../db/db";
import { SqliteDb } from "../db/sqlite-db";
import { defaultLevelProgress, mergeLevelProgress, type LevelProgress } from "../../src/storage/progress-repository";
import { MAX_LEVEL_ROWS, importProgress, markStorySeen, readProgress, updateLevel } from "./progress-store";

const now = new Date("2026-10-25T08:00:00Z");

async function withUser() {
  const db = new SqliteDb();
  await all(db, "INSERT INTO users VALUES ('u1', 'alice', 'a@x.io', 'h', 's', 'now', 'now')");
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

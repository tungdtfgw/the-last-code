import { afterEach, expect, test } from "vitest";
import { all } from "../db/db";
import { SqliteDb } from "../db/sqlite-db";
import { listHistory, readText, saveText } from "./content-store";

// A fresh database holds the text migrations: level:1.4 starts at revision 1.
let db = new SqliteDb();
afterEach(() => {
  db.close();
  db = new SqliteDb();
});

const now = new Date("2026-10-27T15:00:00.000Z");
const save = (baseRevision: number, text: unknown, username = "boss", docId = "level:1.4") => saveText(db, { docId, baseRevision, text, username, now });
const historyCount = async () => (await all(db, "SELECT count(*) AS n FROM content_text_history WHERE doc_id = 'level:1.4'"))[0].n;

test("each save over the current revision adds a revision and one history row", async () => {
  expect(await save(1, { briefing: "a" })).toMatchObject({ ok: true, revision: 2, updatedBy: "boss" });
  expect(await save(2, { briefing: "b" }, "tung")).toMatchObject({ ok: true, revision: 3, updatedBy: "tung" });
  expect(await readText(db, "level:1.4")).toMatchObject({ revision: 3, text: { briefing: "b" } });
  expect(await listHistory(db, "level:1.4")).toEqual([
    { revision: 3, savedAt: now.toISOString(), savedBy: "tung" },
    { revision: 2, savedAt: now.toISOString(), savedBy: "boss" },
    { revision: 1, savedAt: "2026-10-28T00:00:00.000Z", savedBy: "migration" },
  ]);
});

test("a save over an old revision is refused, reports the current one and adds no history", async () => {
  await save(1, { briefing: "a" });
  await save(2, { briefing: "b" });
  expect(await save(2, { briefing: "c" }, "other")).toEqual({ ok: false, stale: { revision: 3, updatedAt: now.toISOString(), updatedBy: "boss" } });
  expect(await save(0, { briefing: "c" })).toMatchObject({ ok: false, stale: { revision: 3 } });
  expect(await historyCount()).toBe(3);
  expect((await readText(db, "level:1.4"))?.text).toEqual({ briefing: "b" });
});

test("two saves over the same revision at once: only one wins", async () => {
  const results = await Promise.all([save(1, { briefing: "a" }, "a"), save(1, { briefing: "b" }, "b")]);
  expect(results.filter((r) => r.ok)).toHaveLength(1);
  expect(await historyCount()).toBe(2);
});

test("a document without a row is never created", async () => {
  for (const base of [0, 1]) {
    expect(await save(base, { briefing: "a" }, "boss", "level:9.9")).toEqual({ ok: false, stale: { revision: 0, updatedAt: null, updatedBy: null } });
  }
  expect(await readText(db, "level:9.9")).toBeNull();
  expect(await all(db, "SELECT count(*) AS n FROM content_text_history WHERE doc_id = 'level:9.9'")).toEqual([{ n: 0 }]);
});

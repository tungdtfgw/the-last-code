import { expect, test } from "vitest";
import { SqliteDb } from "../db/sqlite-db";
import { hit } from "./rate-limit";

test("fixed window counts up, blocks over the limit and resets once the window passes", async () => {
  const db = new SqliteDb();
  const t0 = new Date("2026-10-25T00:00:00Z");
  const at = (ms: number) => new Date(t0.getTime() + ms);
  expect(await hit(db, "k", 2, 1000, t0)).toMatchObject({ allowed: true, count: 1 });
  expect(await hit(db, "k", 2, 1000, at(100))).toMatchObject({ allowed: true, count: 2 });
  expect(await hit(db, "k", 2, 1000, at(200))).toMatchObject({ allowed: false, count: 3, retryAfterMs: 800 });
  expect(await hit(db, "k", 2, 1000, at(1000))).toMatchObject({ allowed: true, count: 1 });
  expect(await hit(db, "other", 2, 1000, at(1000))).toMatchObject({ count: 1 });
});

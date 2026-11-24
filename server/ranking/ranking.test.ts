import { describe, expect, test } from "vitest";
import type { BundledContent, BundledDoc } from "../content/bundled-content";
import { computeRanking, playOrder, type RankingRow } from "./ranking";

const ORDER = ["1.1", "1.2", "1.3", "2.1"];
const viewer = { id: "none", isAdmin: false };

/** `stars` per level in play order; `at` per level as a day of November (first star and last rise alike). */
function player(name: string, stars: number[], at: number[] = stars.map(() => 1), extra: Partial<RankingRow> = {}): RankingRow[] {
  return stars.flatMap((s, i) => {
    if (s === 0) return [];
    const day = `2026-11-${String(at[i]).padStart(2, "0")}T00:00:00.000Z`;
    return [{ userId: name, username: name, hidden: false, levelId: ORDER[i], stars: s, firstStarAt: day, starsAt: day, ...extra }];
  });
}

const names = (rows: RankingRow[], v = viewer) => computeRanking(rows, ORDER, v).entries.map((e) => [e.rank, e.username, e.levelId, e.stars]);

describe("computeRanking", () => {
  test("only the unbroken starred run counts: a star after a gap does not", () => {
    const rows = [...player("gap", [3, 0, 3, 3]), ...player("steady", [1, 1])];
    expect(names(rows)).toEqual([
      [1, "steady", "1.2", 1],
      [2, "gap", "1.1", 3],
    ]);
  });

  test("on the same level more stars there go first, then whoever got there first, then the name", () => {
    const rows = [
      ...player("late", [1, 3], [1, 9]),
      ...player("early", [1, 3], [1, 2]),
      ...player("bea", [1, 3], [1, 2]),
      ...player("few", [3, 2], [1, 1]),
    ];
    expect(names(rows).map((e) => e[1])).toEqual(["bea", "early", "late", "few"]);
  });

  test("raising the stars of an earlier level later does not push back the time of reaching the last one", () => {
    const improver = player("improver", [3, 2], [1, 5]);
    improver[0].starsAt = "2026-11-20T00:00:00.000Z"; // 1.1 went to 3 stars after 1.2 was reached
    const rival = player("rival", [1, 2], [1, 6]);
    expect(names([...improver, ...rival]).map((e) => e[1])).toEqual(["improver", "rival"]);
  });

  test("a row without a known time ranks after the timed ones", () => {
    const old = player("aaa", [2], [1], { firstStarAt: null, starsAt: null });
    expect(names([...old, ...player("zzz", [2], [9])]).map((e) => e[1])).toEqual(["zzz", "aaa"]);
  });

  test("hidden accounts take no rank and only admins see them, after the list", () => {
    const rows = [...player("cheat", [3, 3, 3, 3], undefined, { hidden: true }), ...player("ann", [1])];
    expect(names(rows)).toEqual([[1, "ann", "1.1", 1]]);
    expect(names(rows, { id: "x", isAdmin: true })).toEqual([
      [1, "ann", "1.1", 1],
      [null, "cheat", "2.1", 3],
    ]);
    expect(computeRanking(rows, ORDER, { id: "cheat", isAdmin: false }).me).toBeNull();
  });

  test("the list stops at the limit, and a viewer outside it still gets their place", () => {
    const rows = Array.from({ length: 5 }, (_, i) => player(`p${i}`, [1], [i + 1])).flat();
    const r = computeRanking(rows, ORDER, { id: "p4", isAdmin: false }, 3);
    expect(r.entries.map((e) => e.username)).toEqual(["p0", "p1", "p2"]);
    expect(r.total).toBe(5);
    expect(r.me).toEqual({ rank: 5, levelId: "1.1", stars: 1 });
  });
});

test("playOrder joins chapters by number and skips ids without a readable level file", () => {
  const doc = (kind: "level" | "chapter", id: string, puzzle: unknown = {}, errors: string[] = []): BundledDoc => ({
    docId: `${kind}:${id}`,
    kind,
    id,
    title: "",
    file: "",
    puzzle,
    errors,
  });
  const docs = [
    doc("chapter", "10", { levels: ["10.1"] }),
    doc("chapter", "2", { levels: ["2.1", "2.2"] }),
    doc("chapter", "1", { levels: ["1.1", "1.2"] }),
    doc("level", "1.1"),
    doc("level", "1.2", null, ["không đọc được file"]),
    doc("level", "2.1"),
    doc("level", "10.1"),
  ];
  const content: BundledContent = { docs, get: () => undefined };
  expect(playOrder(content)).toEqual(["1.1", "2.1", "10.1"]);
});

import { describe, expect, test, vi } from "vitest";
import { realChapter, realLevelJson, realRegistry, registryOf } from "../../tests/content-fixture";
import type { StarCount } from "../storage/progress-repository";
import {
  buildChapterContext,
  chapterTotals,
  continueAfterLevel,
  guardRoute,
  learnEnd,
  nodeStates,
  storyEnd,
  titleContinue,
  type ProgressSnapshot,
} from "./progression";

const level14 = realLevelJson("1.4");
const chapter = realChapter();

// A summary-less copy of 1.4, so each test opts into the knowledge step explicitly.
const asLevel = (id: string) => {
  const { knowledge_summary: _summary, ...rest } = JSON.parse(JSON.stringify(level14));
  return { ...rest, id };
};
const ctxWith = (ids: string[], extra: Record<string, unknown> = {}) =>
  buildChapterContext(
    chapter,
    registryOf({ ...Object.fromEntries(ids.map((id) => [`./level-${id}.json`, asLevel(id)])), ...extra }),
  );
const snap = (stars: Record<string, StarCount> = {}, seen: string[] = []): ProgressSnapshot => ({ stars, seen: new Set(seen) });
const level = (id: string) => ({ kind: "level", id }) as const;
const story = (id: string) => ({ kind: "story", id }) as const;
const MAP = { kind: "map" } as const;

describe("only 1.4 built (today)", () => {
  const ctx = ctxWith(["1.4"]);
  test("1.4 is open and next; every other node is not built", () => {
    const nodes = nodeStates(ctx, snap());
    expect(nodes.map((n) => n.status)).toEqual(["unbuilt", "unbuilt", "unbuilt", "open", "unbuilt", "unbuilt", "unbuilt"]);
    expect(nodes[3].next).toBe(true);
  });
  test.each([
    ["prologue → first built level", "prologue", snap({}, ["prologue"]), level("1.4")],
    ["after-1.4 → teaser", "after-1.4", snap({ "1.4": 3 }, ["prologue", "after-1.4"]), story("teaser")],
    ["teaser → map", "teaser", snap({ "1.4": 3 }, ["prologue", "after-1.4", "teaser"]), MAP],
  ])("%s", (_n, id, s, expected) => {
    expect(storyEnd(id, ctx, s)).toEqual(expected);
  });
  test("max stars count built levels only", () => {
    expect(chapterTotals(ctx, snap({ "1.4": 2 }))).toMatchObject({
      stars: 2,
      maxStars: 3,
      components: [{ slot: 3, levelId: "1.4", name: "Dữ liệu sinh trắc" }],
    });
  });
});

describe("1.1, 1.2 and 1.4 built (1.3 missing)", () => {
  const ctx = ctxWith(["1.1", "1.2", "1.4"]);
  test("1.2 is locked behind 1.1 until 1.1 has a star", () => {
    expect(nodeStates(ctx, snap())[1]).toMatchObject({ status: "locked", requires: "1.1" });
    expect(nodeStates(ctx, snap({ "1.1": 1 }))[1]).toMatchObject({ status: "open", next: true });
  });
  test("an unbuilt 1.3 is skipped: 1.4 depends on 1.2", () => {
    expect(nodeStates(ctx, snap({ "1.1": 1 }))[3]).toMatchObject({ status: "locked", requires: "1.2" });
    expect(storyEnd("after-1.2", ctx, snap({ "1.1": 1, "1.2": 1 }, ["after-1.2"]))).toEqual(level("1.4"));
  });

  test.each([
    ["closed the tab in the 1.2 results dialog", snap({ "1.1": 2, "1.2": 1 }, ["prologue", "after-1.1"]), story("after-1.2")],
    ["already saw after-1.2", snap({ "1.1": 2, "1.2": 1 }, ["prologue", "after-1.1", "after-1.2"]), level("1.4")],
    ["everything cleared, after-1.4 unseen", snap({ "1.1": 1, "1.2": 1, "1.4": 1 }, ["prologue", "after-1.1", "after-1.2"]), story("after-1.4")],
    ["everything cleared and seen", snap({ "1.1": 1, "1.2": 1, "1.4": 1 }, ["prologue", "after-1.1", "after-1.2", "after-1.4", "teaser"]), MAP],
    ["new player", snap(), story("prologue")],
  ])("title TIẾP TỤC: %s", (_n, s, expected) => {
    expect(titleContinue(ctx, s)).toEqual(expected);
  });

  test("results TIẾP TỤC on a replay skips the seen transition", () => {
    expect(continueAfterLevel("1.1", ctx, snap({ "1.1": 3 }, ["after-1.1"]))).toEqual(level("1.2"));
    expect(continueAfterLevel("1.1", ctx, snap({ "1.1": 3 }))).toEqual(story("after-1.1"));
  });
});

describe("the shipped chapter (src/levels)", () => {
  const registry = realRegistry();
  const ctx = buildChapterContext(chapter, registry);
  // Whatever is built today, in chapter order (levels without a file are skipped).
  const built = chapter.levels.filter((id) => registry.getLevel(id));
  const seen = (...ids: string[]) => snap(Object.fromEntries(built.map((id) => [id, 3 as StarCount])), ids);

  test("plays through every built level in chapter order, then the chapter ending, then the map", () => {
    expect(built.slice(0, 4)).toEqual(["1.1", "1.2", "1.3", "1.4"]);
    expect(built.at(-1)).toBe("1.7");
    expect(storyEnd("prologue", ctx, seen("prologue"))).toEqual(level("1.1"));
    expect(built.slice(0, -1).map((id) => storyEnd(`after-${id}`, ctx, seen()))).toEqual(built.slice(1).map(level));
    expect(storyEnd("after-1.7", ctx, seen())).toEqual(story("teaser"));
    expect(storyEnd("teaser", ctx, seen("teaser"))).toEqual(MAP);
    expect(nodeStates(ctx, snap({ "1.1": 1, "1.2": 1 })).slice(2, 4)).toMatchObject([
      { id: "1.3", status: "open", next: true },
      { id: "1.4", status: "locked", requires: "1.3" },
    ]);
  });

  test("the boss builds no component; every other built level fills its own slot", () => {
    const totals = chapterTotals(ctx, seen());
    expect(totals).toMatchObject({ stars: 3 * built.length, maxStars: 3 * built.length, slots: 6 });
    expect(registry.getLevel("1.7")?.component).toBeUndefined();
    expect(totals.components.map((c) => c.levelId)).toEqual(built.filter((id) => id !== "1.7"));
  });
});

describe("the full chapter: seven levels, the boss last", () => {
  const ids = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"];
  const { component: _component, ...boss } = asLevel("1.7");
  const ctx = ctxWith(ids, { "./level-1-7.json": boss });
  const stars = (...levels: string[]) => Object.fromEntries(levels.map((id) => [id, 3 as StarCount]));

  test("after-1.6 leads into the boss, after-1.7 into the chapter ending, which ends on the map", () => {
    const s = snap(stars(...ids, "1.7"));
    expect(storyEnd("after-1.6", ctx, s)).toEqual(level("1.7"));
    expect(storyEnd("after-1.7", ctx, s)).toEqual(story("teaser"));
    expect(storyEnd("teaser", ctx, snap(stars(...ids, "1.7"), ["teaser"]))).toEqual(MAP);
  });

  test("the boss opens once 1.6 has a star", () => {
    expect(nodeStates(ctx, snap(stars("1.1", "1.2", "1.3", "1.4", "1.5")))[6]).toMatchObject({ status: "locked", requires: "1.6" });
    expect(nodeStates(ctx, snap(stars(...ids)))[6]).toMatchObject({ id: "1.7", status: "open", next: true });
  });

  test("21 stars at most; the Neural-ID is full (6/6) after 1.6, the boss takes no slot", () => {
    const totals = chapterTotals(ctx, snap(stars(...ids)));
    expect(totals).toMatchObject({ stars: 18, maxStars: 21, slots: 6 });
    expect(totals.components.map((c) => c.slot)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(chapterTotals(ctx, snap(stars(...ids, "1.7"))).components).toHaveLength(6);
  });
});

describe("knowledge summary step", () => {
  const summary = { title: "t", sections: [{ heading: "h", body: "b" }], mistakes: [], next: "n" };
  // 1.1 has a summary, 1.2 does not.
  const ctx = ctxWith(["1.2", "1.4"], { "./level-1-1.json": { ...asLevel("1.1"), knowledge_summary: summary } });
  const learn = (id: string) => ({ kind: "learn", id }) as const;

  test("results TIẾP TỤC opens the summary every time, even on a replay with the transition seen", () => {
    expect(continueAfterLevel("1.1", ctx, snap({ "1.1": 1 }))).toEqual(learn("1.1"));
    expect(continueAfterLevel("1.1", ctx, snap({ "1.1": 3 }, ["after-1.1"]))).toEqual(learn("1.1"));
  });
  test("the summary then leads into the transition, or past it once seen", () => {
    expect(learnEnd("1.1", ctx, snap({ "1.1": 1 }))).toEqual(story("after-1.1"));
    expect(learnEnd("1.1", ctx, snap({ "1.1": 1 }, ["after-1.1"]))).toEqual(level("1.2"));
  });
  test("a level without a summary skips the step", () => {
    expect(continueAfterLevel("1.2", ctx, snap({ "1.1": 1, "1.2": 1 }))).toEqual(story("after-1.2"));
  });
  test.each([
    ["passed level with a summary", learn("1.1"), snap({ "1.1": 1 }), learn("1.1")],
    ["level without a star", learn("1.1"), snap(), MAP],
    ["level without a summary", learn("1.2"), snap({ "1.2": 3 }), MAP],
    ["unbuilt level", learn("1.5"), snap({ "1.5": 3 }), MAP],
  ])("deep link: %s", (_n, route, s, expected) => {
    expect(guardRoute(route, ctx, s)).toEqual(expected);
  });
});

describe("guardRoute", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const ctx = ctxWith(["1.1", "1.2", "1.4"], { "./level-1-3.json": { id: "1.3" } });
  test.each([
    ["unbuilt level", level("1.5"), snap(), MAP],
    ["locked level stays reachable", level("1.2"), snap(), level("1.2")],
    ["broken level", level("1.3"), snap(), MAP],
    ["transition for a level without stars", story("after-1.4"), snap(), MAP],
    ["transition for a cleared level", story("after-1.4"), snap({ "1.4": 1 }), story("after-1.4")],
    ["unknown story", story("abc"), snap(), MAP],
    ["teaser before the last built level is cleared", story("teaser"), snap(), MAP],
  ])("%s", (_n, route, s, expected) => {
    expect(guardRoute(route, ctx, s)).toEqual(expected);
  });

  test("a broken level shows as broken and does not block the next built level", () => {
    const nodes = nodeStates(ctx, snap({ "1.1": 1, "1.2": 1 }));
    expect(nodes[2].status).toBe("broken");
    expect(nodes[3]).toMatchObject({ status: "open", next: true });
  });
});

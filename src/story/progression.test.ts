import { describe, expect, test, vi } from "vitest";
import fake1 from "../../tests/fixtures/chapters/chapter-test-1.json";
import fake2 from "../../tests/fixtures/chapters/chapter-test-2.json";
import { realChapter, realChapters, realLevelJson, realRegistry, registryOf } from "../../tests/content-fixture";
import type { ChapterDefinition } from "./story-types";
import type { StarCount } from "../storage/progress-repository";
import {
  buildGameContext,
  chapterNodes,
  chapterTotals,
  componentSlot,
  defaultMapChapter,
  nextChapterAfterEnd,
  seenStories,
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
  buildGameContext(
    [chapter],
    [],
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
    expect(chapterTotals(ctx, snap({ "1.4": 2 }), 1)).toMatchObject({
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

describe("the shipped chapters (src/levels)", () => {
  const registry = realRegistry();
  const ctx = buildGameContext(realChapters(), [], registry);
  // Whatever is built today, in chapter order (levels without a file are skipped).
  const built = chapter.levels.filter((id) => registry.getLevel(id));
  const seen = (...ids: string[]) => snap(Object.fromEntries(built.map((id) => [id, 3 as StarCount])), ids);

  test("plays through every built level in chapter order, then the chapter ending, then the map", () => {
    expect(built.slice(0, 4)).toEqual(["1.1", "1.2", "1.3", "1.4"]);
    expect(built.at(-1)).toBe("1.7");
    expect(storyEnd("prologue", ctx, seen("prologue"))).toEqual(level("1.1"));
    expect(built.slice(0, -1).map((id) => storyEnd(`after-${id}`, ctx, seen()))).toEqual(built.slice(1).map(level));
    expect(storyEnd("after-1.7", ctx, seen())).toEqual(story("teaser"));
    // The chapter 1 ending opens chapter 2 once any of its levels is built.
    const chapter2Built = ctx.order.some((id) => ctx.chapterOf.get(id) === 2 && ctx.built.has(id));
    expect(storyEnd("teaser", ctx, seen("teaser"))).toEqual(chapter2Built ? story("prologue-2") : MAP);
    expect(nodeStates(ctx, snap({ "1.1": 1, "1.2": 1 })).slice(2, 4)).toMatchObject([
      { id: "1.3", status: "open", next: true },
      { id: "1.4", status: "locked", requires: "1.3" },
    ]);
  });

  test("the boss builds no component; every other built level fills its own slot", () => {
    const totals = chapterTotals(ctx, seen(), 1);
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
    const totals = chapterTotals(ctx, snap(stars(...ids)), 1);
    expect(totals).toMatchObject({ stars: 18, maxStars: 21, slots: 6 });
    expect(totals.components.map((c) => c.slot)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(chapterTotals(ctx, snap(stars(...ids, "1.7")), 1).components).toHaveLength(6);
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

describe("two chapters (made-up chapter files)", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const [c1, c2] = [fake1, fake2] as unknown as ChapterDefinition[];
  const levels = (ids: string[]) => Object.fromEntries(ids.map((id) => [`./level-${id}.json`, asLevel(id)]));
  const all = ["9.1", "9.2", "9.3", "9.4"];
  const ctx = buildGameContext([c2, c1], [], registryOf(levels(all)));
  const stars = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, 2 as StarCount]));
  const chapter1Seen = ["prologue", "after-9.1", "after-9.2"];

  test("the first level of chapter 2 opens once the last level of chapter 1 has a star", () => {
    expect(chapterNodes(ctx, snap(stars("9.1")), 2)[0]).toMatchObject({ id: "9.3", status: "locked", requires: "9.2" });
    expect(chapterNodes(ctx, snap(stars("9.1", "9.2")), 2)[0]).toMatchObject({ id: "9.3", status: "open", next: true });
    expect(chapterNodes(ctx, snap(stars("9.1", "9.2")), 1).some((n) => n.next)).toBe(false);
  });

  test.each([
    ["after the last level of chapter 1 → its ending", "after-9.2", story("teaser")],
    ["chapter 1's ending → chapter 2's opening", "teaser", story("prologue-2")],
    ["chapter 2's opening → its first level", "prologue-2", level("9.3")],
    ["inside chapter 2", "after-9.3", level("9.4")],
    ["after the last level of chapter 2 → its ending", "after-9.4", story("teaser-2")],
    ["chapter 2's ending → map", "teaser-2", MAP],
  ])("%s", (_n, id, expected) => {
    expect(storyEnd(id, ctx, snap(stars(...all)))).toEqual(expected);
  });

  test("a chapter ending leads on only when a later chapter has a built level", () => {
    expect(nextChapterAfterEnd("teaser", ctx)).toBe(2);
    expect(nextChapterAfterEnd("teaser-2", ctx)).toBeUndefined();
    const only1 = buildGameContext([c1, c2], [], registryOf(levels(["9.1", "9.2"])));
    expect(storyEnd("teaser", only1, snap())).toEqual(MAP);
    expect(nextChapterAfterEnd("teaser", only1)).toBeUndefined();
  });

  test.each([
    ["saw all of chapter 1, ending included (shipped before chapter 2)", [...chapter1Seen, "teaser"], story("prologue-2")],
    ["also saw chapter 2's opening", [...chapter1Seen, "teaser", "prologue-2"], level("9.3")],
    ["left during chapter 1's ending", chapter1Seen, story("teaser")],
  ])("title TIẾP TỤC with chapter 1 cleared: %s", (_n, seen, expected) => {
    expect(titleContinue(ctx, snap(stars("9.1", "9.2"), seen))).toEqual(expected);
  });

  test.each([
    ["chapter 2's opening before chapter 1 is cleared", story("prologue-2"), snap(stars("9.1")), MAP],
    ["chapter 2's opening once chapter 1's last level has a star", story("prologue-2"), snap(stars("9.2")), story("prologue-2")],
    ["chapter 2's opening already seen", story("prologue-2"), snap({}, ["prologue-2"]), story("prologue-2")],
    ["chapter 2's ending before its last level has a star", story("teaser-2"), snap(stars("9.1", "9.2", "9.3")), MAP],
    ["chapter 2's ending once cleared", story("teaser-2"), snap(stars("9.4")), story("teaser-2")],
    ["a transition of chapter 2 without a star", story("after-9.3"), snap(stars("9.1", "9.2")), MAP],
    ["a chapter that does not exist", story("prologue-3"), snap(stars(...all)), MAP],
    ["chapter 1 has no numbered ids", story("teaser-1"), snap(stars(...all)), MAP],
    ["the map of a chapter that does not exist", { kind: "map", chapter: 9 } as const, snap(), MAP],
    ["the map of chapter 2", { kind: "map", chapter: 2 } as const, snap(), { kind: "map", chapter: 2 }],
  ])("guardRoute: %s", (_n, route, s, expected) => {
    expect(guardRoute(route, ctx, s)).toEqual(expected);
  });

  test("slots, totals and seen stories are per chapter", () => {
    expect(componentSlot(ctx, "9.3")).toBe(0);
    expect(componentSlot(ctx, "9.4")).toBeUndefined(); // past chapter 2's single slot
    const s = snap(stars(...all), [...chapter1Seen, "teaser", "prologue-2", "after-9.3", "teaser-2"]);
    expect(chapterTotals(ctx, s, 2)).toMatchObject({ stars: 4, maxStars: 6, slots: 1, bar: { label: "Bộ luật thử", unit: "Luật" } });
    expect(chapterTotals(ctx, s, 2).components.map((c) => c.levelId)).toEqual(["9.3"]);
    expect(seenStories(ctx, s, 1)).toEqual([...chapter1Seen, "teaser"]);
    expect(seenStories(ctx, s, 2)).toEqual(["prologue-2", "after-9.3", "teaser-2"]);
  });

  test("#/map opens the chapter with the next level, else the last chapter with a cleared level", () => {
    expect(defaultMapChapter(ctx, snap())).toBe(1);
    expect(defaultMapChapter(ctx, snap(stars("9.1", "9.2")))).toBe(2);
    expect(defaultMapChapter(ctx, snap(stars(...all)))).toBe(2);
  });

  test("a broken chapter 2: its levels and stories are out of reach, chapter 1 still ends on the map", () => {
    const broken = buildGameContext([c1], [2], registryOf(levels(all)));
    expect(broken.order).toEqual(["9.1", "9.2"]);
    expect(guardRoute(level("9.3"), broken, snap(stars("9.1", "9.2")))).toEqual(MAP);
    expect(guardRoute(story("prologue-2"), broken, snap(stars("9.1", "9.2")))).toEqual(MAP);
    expect(storyEnd("teaser", broken, snap(stars("9.1", "9.2"), ["teaser"]))).toEqual(MAP);
  });
});

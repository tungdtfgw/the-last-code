import type { LevelRegistry } from "../game/level-registry";
import type { LevelDefinition } from "../game/level-types";
import type { StarCount } from "../storage/progress-repository";
import type { ChapterDefinition } from "./story-types";

/**
 * Every progression rule lives here: map node states, unlocking, where each
 * TIẾP TỤC goes, where a story leads when it ends, and which routes are allowed.
 *
 * "Built" rule: the chapter order is followed, but levels without a valid JSON
 * file (not built yet, or broken) are skipped. The first built level is always
 * open; each later built level opens once the previous built one has a star.
 */

export interface ChapterContext {
  chapter: ChapterDefinition;
  order: string[];
  built: Map<string, LevelDefinition>;
  broken: Set<string>;
}

export interface ProgressSnapshot {
  stars: Record<string, StarCount>;
  seen: ReadonlySet<string>;
}

export type Route =
  | { kind: "title" }
  | { kind: "map" }
  | { kind: "story"; id: string }
  | { kind: "level"; id: string }
  /** Knowledge summary of a passed level ("Tổng kết kiến thức"). */
  | { kind: "learn"; id: string };

export type NodeStatus = "cleared" | "open" | "locked" | "unbuilt" | "broken";

export interface NodeState {
  id: string;
  status: NodeStatus;
  stars: StarCount;
  /** Locked nodes: the built level that needs a star first. */
  requires?: string;
  /** The open node the player should play next ("TIẾP THEO"). */
  next: boolean;
}

const MAP: Route = { kind: "map" };
const MAX_FORWARD_STEPS = 20;

export function buildChapterContext(chapter: ChapterDefinition, registry: LevelRegistry): ChapterContext {
  const built = new Map<string, LevelDefinition>();
  const broken = new Set<string>();
  for (const id of chapter.levels) {
    const level = registry.getLevel(id);
    if (level) built.set(id, level);
    else if (registry.invalidIds.has(id)) broken.add(id);
  }
  return { chapter, order: chapter.levels, built, broken };
}

const starsOf = (snap: ProgressSnapshot, id: string): StarCount => snap.stars[id] ?? 0;

/** Built level ids in chapter order. */
export function builtOrder(ctx: ChapterContext): string[] {
  return ctx.order.filter((id) => ctx.built.has(id));
}

export function firstBuilt(ctx: ChapterContext): string | undefined {
  return builtOrder(ctx)[0];
}

export function nextBuiltAfter(ctx: ChapterContext, id: string): string | undefined {
  const at = ctx.order.indexOf(id);
  return ctx.order.slice(at + 1).find((x) => ctx.built.has(x));
}

function previousBuilt(ctx: ChapterContext, id: string): string | undefined {
  const at = ctx.order.indexOf(id);
  return ctx.order.slice(0, at).reverse().find((x) => ctx.built.has(x));
}

export function nodeStates(ctx: ChapterContext, snap: ProgressSnapshot): NodeState[] {
  let nextGiven = false;
  return ctx.order.map((id) => {
    const stars = starsOf(snap, id);
    if (!ctx.built.has(id)) return { id, status: ctx.broken.has(id) ? "broken" : "unbuilt", stars: 0, next: false };
    if (stars > 0) return { id, status: "cleared", stars, next: false };
    const prev = previousBuilt(ctx, id);
    if (prev === undefined || starsOf(snap, prev) > 0) {
      const next = !nextGiven;
      nextGiven = true;
      return { id, status: "open", stars, next };
    }
    return { id, status: "locked", stars, requires: prev, next: false };
  });
}

/** Where a story leads when it ends, before skipping stories already seen. */
function rawStoryEnd(id: string, ctx: ChapterContext): Route {
  if (id === "prologue") {
    const first = firstBuilt(ctx);
    return first ? { kind: "level", id: first } : MAP;
  }
  if (id.startsWith("after-")) {
    const next = nextBuiltAfter(ctx, id.slice("after-".length));
    return next ? { kind: "level", id: next } : { kind: "story", id: "teaser" };
  }
  return MAP;
}

/** Stories already seen never play again on their own: jump through them to what they lead to. */
export function forward(route: Route, ctx: ChapterContext, snap: ProgressSnapshot): Route {
  let r = route;
  for (let i = 0; i < MAX_FORWARD_STEPS && r.kind === "story" && snap.seen.has(r.id); i++) r = rawStoryEnd(r.id, ctx);
  return r.kind === "story" && snap.seen.has(r.id) ? MAP : r;
}

export function storyEnd(id: string, ctx: ChapterContext, snap: ProgressSnapshot): Route {
  return forward(rawStoryEnd(id, ctx), ctx, snap);
}

const hasSummary = (ctx: ChapterContext, id: string) => ctx.built.get(id)?.knowledge_summary !== undefined;

/**
 * TIẾP TỤC in the results dialog: the level's knowledge summary when it has one
 * (always, it is not stored as seen), then the transition story via `learnEnd`.
 */
export function continueAfterLevel(id: string, ctx: ChapterContext, snap: ProgressSnapshot): Route {
  return hasSummary(ctx, id) ? { kind: "learn", id } : learnEnd(id, ctx, snap);
}

/** TIẾP TỤC on a knowledge summary reached from the results dialog. */
export function learnEnd(id: string, ctx: ChapterContext, snap: ProgressSnapshot): Route {
  return forward({ kind: "story", id: `after-${id}` }, ctx, snap);
}

/** The story that leads into a built level. */
function leadInStory(ctx: ChapterContext, id: string): string {
  const prev = previousBuilt(ctx, id);
  return prev === undefined ? "prologue" : `after-${prev}`;
}

/**
 * TIẾP TỤC on the title screen: the first built level without a star, preceded
 * by its lead-in story when that was never seen. Everything cleared → the
 * stories still missing, then the map.
 */
export function titleContinue(ctx: ChapterContext, snap: ProgressSnapshot): Route {
  const built = builtOrder(ctx);
  for (const id of built) {
    if (starsOf(snap, id) > 0) continue;
    const lead = leadInStory(ctx, id);
    return snap.seen.has(lead) ? { kind: "level", id } : { kind: "story", id: lead };
  }
  const last = built.at(-1);
  return last ? forward({ kind: "story", id: `after-${last}` }, ctx, snap) : MAP;
}

/** BẮT ĐẦU vs TIẾP TỤC on the title screen. */
export function isReturning(snap: ProgressSnapshot): boolean {
  return snap.seen.has("prologue");
}

/**
 * Deep-link guard. Built levels are always reachable (locks guide, they do not
 * protect). Unbuilt or broken levels, unknown stories, and transitions or
 * knowledge summaries for levels without a star (or without a summary) go to the map.
 */
export function guardRoute(route: Route, ctx: ChapterContext, snap: ProgressSnapshot): Route {
  if (route.kind === "level") return ctx.built.has(route.id) ? route : MAP;
  if (route.kind === "learn") return hasSummary(ctx, route.id) && starsOf(snap, route.id) > 0 ? route : MAP;
  if (route.kind !== "story") return route;
  const { id } = route;
  if (id === "prologue") return route;
  if (id === "teaser") {
    const last = builtOrder(ctx).at(-1);
    return snap.seen.has("teaser") || (last !== undefined && starsOf(snap, last) > 0) ? route : MAP;
  }
  if (id.startsWith("after-")) {
    const levelId = id.slice("after-".length);
    return ctx.built.has(levelId) && starsOf(snap, levelId) > 0 ? route : MAP;
  }
  return MAP;
}

export interface CollectedComponent {
  /** 0-based Neural-ID slot = position of the level in the chapter. */
  slot: number;
  levelId: string;
  name: string;
}

/** 0-based Neural-ID slot of a level's component, or undefined when it has none. */
export function componentSlot(ctx: ChapterContext, id: string): number | undefined {
  const slot = ctx.order.indexOf(id);
  return ctx.built.get(id)?.component && slot >= 0 && slot < ctx.chapter.neural_id_slots ? slot : undefined;
}

export function chapterTotals(ctx: ChapterContext, snap: ProgressSnapshot) {
  const built = builtOrder(ctx);
  const components: CollectedComponent[] = [];
  for (const id of built) {
    const slot = componentSlot(ctx, id);
    if (slot !== undefined && starsOf(snap, id) > 0) components.push({ slot, levelId: id, name: ctx.built.get(id)!.component! });
  }
  return {
    stars: built.reduce((sum, id) => sum + starsOf(snap, id), 0),
    maxStars: 3 * built.length,
    slots: ctx.chapter.neural_id_slots,
    components,
  };
}

/** Seen stories in chapter order (for the replay list on the map). */
export function seenStories(ctx: ChapterContext, snap: ProgressSnapshot): string[] {
  return ["prologue", ...ctx.order.map((id) => `after-${id}`), "teaser"].filter((id) => snap.seen.has(id));
}

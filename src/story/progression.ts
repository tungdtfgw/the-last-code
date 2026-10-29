import type { LevelRegistry } from "../game/level-registry";
import type { LevelDefinition } from "../game/level-types";
import type { StarCount } from "../storage/progress-repository";
import type { ChapterDefinition } from "./story-types";

/**
 * Every progression rule lives here: map node states, unlocking, where each
 * TIẾP TỤC goes, where a story leads when it ends, and which routes are allowed.
 *
 * "Built" rule: the order of every valid chapter, joined, is followed, but
 * levels without a valid JSON file (not built yet, or broken) are skipped. The
 * first built level is always open; each later built level opens once the
 * previous built one has a star, across chapters too.
 *
 * Story ids: chapter 1 opens with `prologue` and ends with `teaser`; chapter
 * n ≥ 2 with `prologue-<n>` and `teaser-<n>`; `after-<id>` follows a level.
 */

export interface GameContext {
  /** Valid chapters, by number. */
  chapters: ChapterDefinition[];
  /** Chapters whose file or D1 text is broken: their levels and stories are out of reach. */
  brokenChapters: number[];
  /** Every level id of every valid chapter, in play order. */
  order: string[];
  /** Level id → chapter number, for every id in `order`. */
  chapterOf: Map<string, number>;
  built: Map<string, LevelDefinition>;
  broken: Set<string>;
}

export interface ProgressSnapshot {
  stars: Record<string, StarCount>;
  seen: ReadonlySet<string>;
}

export type Route =
  | { kind: "title" }
  /** Without `chapter`: the chapter the player is in (`defaultMapChapter`). */
  | { kind: "map"; chapter?: number }
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

export function buildGameContext(chapters: ChapterDefinition[], brokenChapters: number[], registry: LevelRegistry): GameContext {
  const sorted = [...chapters].sort((a, b) => a.chapter - b.chapter);
  const built = new Map<string, LevelDefinition>();
  const broken = new Set<string>();
  const chapterOf = new Map<string, number>();
  const order: string[] = [];
  for (const chapter of sorted) {
    for (const id of chapter.levels) {
      order.push(id);
      chapterOf.set(id, chapter.chapter);
      const level = registry.getLevel(id);
      if (level) built.set(id, level);
      else if (registry.invalidIds.has(id)) broken.add(id);
    }
  }
  return { chapters: sorted, brokenChapters: [...brokenChapters].sort((a, b) => a - b), order, chapterOf, built, broken };
}

const starsOf = (snap: ProgressSnapshot, id: string): StarCount => snap.stars[id] ?? 0;

/** The story that opens chapter `n`. */
export const prologueId = (n: number): string => (n === 1 ? "prologue" : `prologue-${n}`);
/** The story that ends chapter `n`. */
export const endId = (n: number): string => (n === 1 ? "teaser" : `teaser-${n}`);

export function chapterDef(ctx: GameContext, n: number): ChapterDefinition | undefined {
  return ctx.chapters.find((c) => c.chapter === n);
}

/** The valid chapter a story belongs to; undefined for unknown ids and stories of a broken chapter. */
export function storyChapter(id: string, ctx: GameContext): number | undefined {
  let n: number | undefined;
  if (id === "prologue" || id === "teaser") n = 1;
  else if (id.startsWith("after-")) n = ctx.chapterOf.get(id.slice("after-".length));
  else {
    const m = /^(?:prologue|teaser)-([1-9]\d?)$/.exec(id);
    if (m && Number(m[1]) >= 2) n = Number(m[1]);
  }
  return n !== undefined && chapterDef(ctx, n) ? n : undefined;
}

/** Whether `id` is the ending of a valid chapter (`teaser`, `teaser-<n>`). */
export const isChapterEnd = (id: string, ctx: GameContext): boolean => {
  const n = storyChapter(id, ctx);
  return n !== undefined && id === endId(n);
};

/** Built level ids in play order, optionally of one chapter. */
export function builtOrder(ctx: GameContext, chapter?: number): string[] {
  return ctx.order.filter((id) => ctx.built.has(id) && (chapter === undefined || ctx.chapterOf.get(id) === chapter));
}

export function firstBuilt(ctx: GameContext, chapter?: number): string | undefined {
  return builtOrder(ctx, chapter)[0];
}

export function nextBuiltAfter(ctx: GameContext, id: string): string | undefined {
  const at = ctx.order.indexOf(id);
  return ctx.order.slice(at + 1).find((x) => ctx.built.has(x));
}

function previousBuilt(ctx: GameContext, id: string): string | undefined {
  const at = ctx.order.indexOf(id);
  return ctx.order.slice(0, at).reverse().find((x) => ctx.built.has(x));
}

export function nodeStates(ctx: GameContext, snap: ProgressSnapshot): NodeState[] {
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

/** The map nodes of chapter `n`. "TIẾP THEO" is decided over the whole game, so at most one chapter has it. */
export function chapterNodes(ctx: GameContext, snap: ProgressSnapshot, n: number): NodeState[] {
  return nodeStates(ctx, snap).filter((node) => ctx.chapterOf.get(node.id) === n);
}

/** The first valid chapter after `n` with a built level: where chapter n's ending leads. */
function nextChapterWithLevels(ctx: GameContext, n: number): number | undefined {
  return ctx.chapters.find((c) => c.chapter > n && firstBuilt(ctx, c.chapter) !== undefined)?.chapter;
}

/** Where a story leads when it ends, before skipping stories already seen. */
function rawStoryEnd(id: string, ctx: GameContext): Route {
  const n = storyChapter(id, ctx);
  if (n === undefined) return MAP;
  if (id === prologueId(n)) {
    const first = firstBuilt(ctx, n);
    return first ? { kind: "level", id: first } : MAP;
  }
  if (id.startsWith("after-")) {
    const next = nextBuiltAfter(ctx, id.slice("after-".length));
    return next && ctx.chapterOf.get(next) === n ? { kind: "level", id: next } : { kind: "story", id: endId(n) };
  }
  const m = nextChapterWithLevels(ctx, n);
  return m !== undefined ? { kind: "story", id: prologueId(m) } : MAP;
}

/** The chapter a chapter ending leads into (its TIẾP TỤC), or undefined when it ends on the map. */
export function nextChapterAfterEnd(id: string, ctx: GameContext): number | undefined {
  if (!isChapterEnd(id, ctx)) return undefined;
  const r = rawStoryEnd(id, ctx);
  return r.kind === "story" ? storyChapter(r.id, ctx) : undefined;
}

/** Stories already seen never play again on their own: jump through them to what they lead to. */
export function forward(route: Route, ctx: GameContext, snap: ProgressSnapshot): Route {
  let r = route;
  for (let i = 0; i < MAX_FORWARD_STEPS && r.kind === "story" && snap.seen.has(r.id); i++) r = rawStoryEnd(r.id, ctx);
  return r.kind === "story" && snap.seen.has(r.id) ? MAP : r;
}

export function storyEnd(id: string, ctx: GameContext, snap: ProgressSnapshot): Route {
  return forward(rawStoryEnd(id, ctx), ctx, snap);
}

const hasSummary = (ctx: GameContext, id: string) => ctx.built.get(id)?.knowledge_summary !== undefined;

/**
 * TIẾP TỤC in the results dialog: the level's knowledge summary when it has one
 * (always, it is not stored as seen), then the transition story via `learnEnd`.
 */
export function continueAfterLevel(id: string, ctx: GameContext, snap: ProgressSnapshot): Route {
  return hasSummary(ctx, id) ? { kind: "learn", id } : learnEnd(id, ctx, snap);
}

/** TIẾP TỤC on a knowledge summary reached from the results dialog. */
export function learnEnd(id: string, ctx: GameContext, snap: ProgressSnapshot): Route {
  return forward({ kind: "story", id: `after-${id}` }, ctx, snap);
}

/**
 * The story that leads into a built level: the transition after the previous
 * built level (for the first level of a later chapter that chain runs through
 * the chapter ending and the next opening), or the chapter's opening.
 */
function leadInStory(ctx: GameContext, id: string): string {
  const prev = previousBuilt(ctx, id);
  return prev === undefined ? prologueId(ctx.chapterOf.get(id) ?? 1) : `after-${prev}`;
}

/**
 * TIẾP TỤC on the title screen: the first built level without a star, preceded
 * by the stories leading into it that were never seen. Everything cleared → the
 * stories still missing, then the map.
 */
export function titleContinue(ctx: GameContext, snap: ProgressSnapshot): Route {
  const built = builtOrder(ctx);
  for (const id of built) {
    if (starsOf(snap, id) > 0) continue;
    return forward({ kind: "story", id: leadInStory(ctx, id) }, ctx, snap);
  }
  const last = built.at(-1);
  return last ? forward({ kind: "story", id: `after-${last}` }, ctx, snap) : MAP;
}

/** BẮT ĐẦU vs TIẾP TỤC on the title screen. */
export function isReturning(snap: ProgressSnapshot): boolean {
  return snap.seen.has("prologue");
}

/** Whether the last built level of the chapters `upTo` and before has a star (true when there is none). */
const clearedUpTo = (ctx: GameContext, snap: ProgressSnapshot, upTo: number) => {
  const last = builtOrder(ctx).filter((id) => ctx.chapterOf.get(id)! <= upTo).at(-1);
  return last === undefined || starsOf(snap, last) > 0;
};

/**
 * Deep-link guard. Built levels are always reachable (locks guide, they do not
 * protect). Unbuilt or broken levels, levels and stories of a broken chapter,
 * unknown stories, and transitions or knowledge summaries for levels without a
 * star (or without a summary) go to the map. A chapter opening needs the last
 * built level before the chapter cleared, an ending the chapter's own last built
 * level; seen stories stay open.
 */
export function guardRoute(route: Route, ctx: GameContext, snap: ProgressSnapshot): Route {
  if (route.kind === "level") return ctx.built.has(route.id) ? route : MAP;
  if (route.kind === "learn") return hasSummary(ctx, route.id) && starsOf(snap, route.id) > 0 ? route : MAP;
  if (route.kind === "map") return route.chapter === undefined || chapterDef(ctx, route.chapter) ? route : MAP;
  if (route.kind !== "story") return route;
  const { id } = route;
  if (id === "prologue") return route;
  const n = storyChapter(id, ctx);
  if (n === undefined) return MAP;
  if (id.startsWith("after-")) {
    const levelId = id.slice("after-".length);
    return ctx.built.has(levelId) && starsOf(snap, levelId) > 0 ? route : MAP;
  }
  if (snap.seen.has(id)) return route;
  if (id === prologueId(n)) return clearedUpTo(ctx, snap, n - 1) ? route : MAP;
  return firstBuilt(ctx, n) !== undefined && clearedUpTo(ctx, snap, n) ? route : MAP;
}

/**
 * The chapter `#/map` shows: the one with the "TIẾP THEO" node, else the last
 * chapter with a cleared level, else chapter 1.
 */
export function defaultMapChapter(ctx: GameContext, snap: ProgressSnapshot): number {
  const next = nodeStates(ctx, snap).find((node) => node.next);
  if (next) return ctx.chapterOf.get(next.id)!;
  const cleared = builtOrder(ctx).filter((id) => starsOf(snap, id) > 0).at(-1);
  return cleared !== undefined ? ctx.chapterOf.get(cleared)! : (ctx.chapters[0]?.chapter ?? 1);
}

export interface CollectedComponent {
  /** 0-based slot on the chapter's component bar = position of the level in its chapter. */
  slot: number;
  levelId: string;
  name: string;
}

/** 0-based slot of a level's component on its chapter's bar, or undefined when it has none. */
export function componentSlot(ctx: GameContext, id: string): number | undefined {
  const chapter = chapterDef(ctx, ctx.chapterOf.get(id) ?? -1);
  if (!chapter) return undefined;
  const slot = chapter.levels.indexOf(id);
  return ctx.built.get(id)?.component && slot >= 0 && slot < chapter.neural_id_slots ? slot : undefined;
}

export function chapterTotals(ctx: GameContext, snap: ProgressSnapshot, n: number) {
  const chapter = chapterDef(ctx, n);
  const built = builtOrder(ctx, n);
  const components: CollectedComponent[] = [];
  for (const id of built) {
    const slot = componentSlot(ctx, id);
    if (slot !== undefined && starsOf(snap, id) > 0) components.push({ slot, levelId: id, name: ctx.built.get(id)!.component! });
  }
  return {
    stars: built.reduce((sum, id) => sum + starsOf(snap, id), 0),
    maxStars: 3 * built.length,
    slots: chapter?.neural_id_slots ?? 0,
    bar: chapter?.component_bar ?? { label: "", unit: "" },
    components,
  };
}

/** Seen stories of chapter `n` in play order (for the replay list on its map). */
export function seenStories(ctx: GameContext, snap: ProgressSnapshot, n: number): string[] {
  const levels = chapterDef(ctx, n)?.levels ?? [];
  return [prologueId(n), ...levels.map((id) => `after-${id}`), endId(n)].filter((id) => snap.seen.has(id));
}

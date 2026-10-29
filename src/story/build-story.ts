import type { GameContext } from "./progression";
import { chapterDef, componentSlot, endId, prologueId, storyChapter } from "./progression";
import type { PlayBeat } from "./story-types";

/**
 * Beats for a story id. A chapter's opening (`prologue`, `prologue-<n>`) and
 * ending (`teaser`, `teaser-<n>`) come from its chapter file; `after-<id>` is
 * assembled from the level: outro (on the level's `scene`) → lore fragment →
 * component card → `outro_beats`. Unknown ids, and stories of a broken chapter, return null.
 */
export function buildStory(id: string, ctx: GameContext): PlayBeat[] | null {
  const n = storyChapter(id, ctx);
  const chapter = n === undefined ? undefined : chapterDef(ctx, n);
  if (n === undefined || !chapter) return null;
  if (id === prologueId(n)) return chapter.prologue;
  if (id === endId(n)) return chapter.teaser;
  const level = ctx.built.get(id.slice("after-".length));
  if (!level) return null;
  const beats: PlayBeat[] = [{ kind: "log", text: level.outro, ...(level.scene && { backdrop: level.scene }) }];
  if (level.lore_fragment.trim()) beats.push({ kind: "lore", text: level.lore_fragment, cue: "terminal_line" });
  const slot = componentSlot(ctx, level.id);
  if (slot !== undefined) {
    const { label, unit } = chapter.component_bar;
    beats.push({
      kind: "card",
      text: `${label.toLocaleUpperCase("vi")} · ${unit.toLocaleUpperCase("vi")} ${slot + 1}/${chapter.neural_id_slots}: ${level.component}`,
      cue: "objective_lock",
      fx: "id_bar",
      flashSlot: slot,
    });
  }
  beats.push(...(level.outro_beats ?? []));
  return beats;
}

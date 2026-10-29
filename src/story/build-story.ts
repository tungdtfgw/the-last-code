import type { ChapterContext } from "./progression";
import { componentSlot } from "./progression";
import type { PlayBeat } from "./story-types";

/**
 * Beats for a story id. `prologue` and `teaser` come from the chapter file;
 * `after-<id>` is assembled from the level: outro (on the level's `scene`) → lore
 * fragment → component card → `outro_beats`. Unknown ids return null.
 */
export function buildStory(id: string, ctx: ChapterContext): PlayBeat[] | null {
  if (id === "prologue") return ctx.chapter.prologue;
  if (id === "teaser") return ctx.chapter.teaser;
  if (!id.startsWith("after-")) return null;
  const level = ctx.built.get(id.slice("after-".length));
  if (!level) return null;
  const beats: PlayBeat[] = [{ kind: "log", text: level.outro, ...(level.scene && { backdrop: level.scene }) }];
  if (level.lore_fragment.trim()) beats.push({ kind: "lore", text: level.lore_fragment, cue: "terminal_line" });
  const slot = componentSlot(ctx, level.id);
  if (slot !== undefined) {
    beats.push({
      kind: "card",
      text: `NEURAL-ID GIẢ · THÀNH PHẦN ${slot + 1}/${ctx.chapter.neural_id_slots}: ${level.component}`,
      cue: "objective_lock",
      fx: "id_bar",
      flashSlot: slot,
    });
  }
  beats.push(...(level.outro_beats ?? []));
  return beats;
}

import { describe, expect, test } from "vitest";
import { realChapters, realRegistry } from "../../tests/content-fixture";
import { buildStory } from "./build-story";
import { backdropAt } from "./cutscene-reducer";
import { buildGameContext, endId, prologueId } from "./progression";
import { fxSupported } from "./scene-catalog";

describe("scene effects", () => {
  const ctx = buildGameContext(realChapters(), [], realRegistry());
  const ids = [
    ...ctx.chapters.flatMap((c) => [prologueId(c.chapter), endId(c.chapter)]),
    ...[...ctx.built.keys()].map((id) => `after-${id}`),
  ];

  test.each(ids)("%s: every effect is drawn by the backdrop it plays on", (id) => {
    const beats = buildStory(id, ctx)!;
    const unsupported = beats.flatMap((b, i) =>
      b.fx && !fxSupported(backdropAt(beats, i), b.fx) ? [`${i}: ${b.fx} trên ${backdropAt(beats, i)}`] : [],
    );
    expect(unsupported).toEqual([]);
  });

  test("city effects only on the city, scene effects only where the scene defines them", () => {
    expect(fxSupported("thanh-pho", "eight_fragments")).toBe(true);
    expect(fxSupported("ga-ngam", "eight_fragments")).toBe(false);
    expect(fxSupported("terminal", "focus")).toBe(false);
    expect(fxSupported("ga-ngam", "trace")).toBe(false);
    expect(fxSupported("terminal", "signal_0xa7")).toBe(true);
  });
});

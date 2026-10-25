import { describe, expect, test } from "vitest";
import level14 from "../levels/level-1-4.json";
import { buildRegistry } from "../game/level-registry";
import chapter from "./chapter-1.json";
import { buildStory } from "./build-story";
import { buildChapterContext } from "./progression";
import type { ChapterDefinition } from "./story-types";

const ctxOf = (level: object) => buildChapterContext(chapter as ChapterDefinition, buildRegistry({ "./l.json": level }));

describe("buildStory", () => {
  test("after-1.4: outro → lore → component card → outro beats", () => {
    const beats = buildStory("after-1.4", ctxOf(level14))!;
    expect(beats.map((b) => b.kind)).toEqual(["log", "lore", "card", "kai", "echo", "kai", "echo"]);
    expect(beats[0].text).toBe(level14.outro);
    expect(beats[1]).toMatchObject({ cue: "terminal_line" });
    expect(beats[1].text).toMatch(/^KTS-03/);
    expect(beats[2]).toMatchObject({
      text: "NEURAL-ID GIẢ · THÀNH PHẦN 4/6: Dữ liệu sinh trắc",
      cue: "objective_lock",
      fx: "id_bar",
      flashSlot: 3,
    });
  });

  test("a level without component or outro beats keeps only outro and lore", () => {
    const { component: _c, outro_beats: _b, ...bare } = level14;
    expect(buildStory("after-1.4", ctxOf(bare))!.map((b) => b.kind)).toEqual(["log", "lore"]);
  });

  test("chapter stories and unknown ids", () => {
    const ctx = ctxOf(level14);
    expect(buildStory("prologue", ctx)).toHaveLength(23);
    expect(buildStory("teaser", ctx)).toHaveLength(9);
    expect(buildStory("after-1.5", ctx)).toBeNull();
    expect(buildStory("nope", ctx)).toBeNull();
  });
});

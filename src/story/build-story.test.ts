import { describe, expect, test } from "vitest";
import { realChapter, realLevelJson, registryOf } from "../../tests/content-fixture";
import { buildStory } from "./build-story";
import { buildChapterContext } from "./progression";

const level14 = realLevelJson("1.4");
const chapter = realChapter();
const ctxOf = (level: object) => buildChapterContext(chapter, registryOf({ "./l.json": level }));

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

  test("the outro carries the level's scene, which then holds until a beat changes it", () => {
    const beats = buildStory("after-1.4", ctxOf({ ...level14, scene: "cong-bac" }))!;
    expect(beats[0].backdrop).toBe("cong-bac");
    const { scene: _s, ...noScene } = { ...level14, scene: undefined };
    expect(buildStory("after-1.4", ctxOf(noScene))![0]).not.toHaveProperty("backdrop");
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

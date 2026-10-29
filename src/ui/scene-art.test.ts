import { describe, expect, test } from "vitest";
import { SCENES } from "../story/scene-catalog";
import { BACKDROPS } from "../story/story-types";
import { hasSceneArt } from "./scene-art";

describe("drawn places", () => {
  // `SCENE_ART` is a partial table, so a place left out of it type-checks and shows an empty black frame.
  test("every place backdrop has a drawing, and only places do", () => {
    const mismatched = BACKDROPS.filter((id) => SCENES[id].place !== hasSceneArt(id));
    expect(mismatched).toEqual([]);
  });

  test("focus points and trace paths stay inside the frame", () => {
    const outside = BACKDROPS.flatMap((id) => {
      const { focus, trace = [] } = SCENES[id];
      const points = [...(focus ? [focus] : []), ...trace];
      const bad = points.filter(({ x, y }) => x < 0 || x > 100 || y < 0 || y > 100).map(({ x, y }) => `${id} (${x}, ${y})`);
      if (focus && (focus.scale < 1 || focus.scale > 2)) bad.push(`${id} scale ${focus.scale}`);
      return bad;
    });
    expect(outside).toEqual([]);
  });
});

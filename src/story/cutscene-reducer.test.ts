import { describe, expect, test } from "vitest";
import { backdropAt, cutsceneReducer, initCutscene, visibleBeats } from "./cutscene-reducer";
import type { PlayBeat } from "./story-types";

const beats: PlayBeat[] = [
  { kind: "log", text: "a", backdrop: "vung-toi" },
  { kind: "kai", text: "b" },
  { kind: "card", text: "C" },
  { kind: "echo", text: "d", backdrop: "terminal" },
  { kind: "log", text: "e" },
];
const reduce = cutsceneReducer(beats);

describe("cutscene reducer", () => {
  test("advance finishes the typing beat first, then moves on, then ends at the last beat", () => {
    let s = initCutscene(beats, false);
    s = reduce(s, { type: "advance" });
    expect(s).toMatchObject({ index: 0, phase: "shown" });
    s = reduce(s, { type: "advance" });
    expect(s).toMatchObject({ index: 1, phase: "typing" });
    s = reduce(reduce(s, { type: "advance" }), { type: "advance" });
    expect(s).toMatchObject({ index: 2, phase: "shown" }); // cards appear whole
    s = { ...s, index: 4, phase: "shown" };
    expect(reduce(s, { type: "advance" }).ended).toBe(true);
  });

  test("auto only moves a fully shown beat", () => {
    const s = initCutscene(beats, false);
    expect(reduce(s, { type: "auto" })).toBe(s);
  });

  test("skip ends from anywhere", () => {
    expect(reduce(initCutscene(beats, false), { type: "skip" }).ended).toBe(true);
    expect(reduce({ index: 3, phase: "typing", ended: false, transcript: false }, { type: "skip" }).ended).toBe(true);
  });

  test("a card wipes earlier beats; while current only the card shows", () => {
    expect(visibleBeats(beats, 1).map((b) => b.text)).toEqual(["a", "b"]);
    expect(visibleBeats(beats, 2).map((b) => b.text)).toEqual(["C"]);
    expect(visibleBeats(beats, 4).map((b) => b.text)).toEqual(["d", "e"]);
  });

  test("the backdrop carries over until another beat sets one", () => {
    expect(backdropAt(beats, 2)).toBe("vung-toi");
    expect(backdropAt(beats, 4)).toBe("terminal");
  });

  test("reduced motion: a transcript where advancing does nothing", () => {
    const s = initCutscene(beats, true);
    expect(s).toMatchObject({ transcript: true, index: 4, phase: "shown" });
    expect(reduce(s, { type: "advance" })).toBe(s);
    expect(reduce(s, { type: "finish" }).ended).toBe(true);
  });
});

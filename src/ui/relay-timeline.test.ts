import { describe, expect, test } from "vitest";
import { runHarness } from "../../tests/integration/run-harness";
import { classifyRun } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import levelJson from "../levels/level-1-1.json";
import { buildRelayTimeline, summarizeRelay } from "./relay-timeline";

const level = levelJson as unknown as LevelDefinition;
const starter = level.starter_code.split("\n");
const edit = (changes: Record<number, string>) => starter.map((l, i) => changes[i + 1] ?? l).join("\n");
const timeline = (text: string) => buildRelayTimeline(classifyRun({ kind: "ok", data: runHarness(level, text) }, level), level);
const states = (slots: { state: string }[]) => slots.map((s) => s.state);

const FIX_7 = 'print("PHIEN", ma_phien)';
const FIX_8 = 'print("LO17 CAN LIEN LAC")';

describe("relay timeline (GDD 1.1 §5)", () => {
  test("starter code: line 1 sent, line 2 breaks with the error, line 3 never sent", () => {
    const t = timeline(level.starter_code);
    const end = t.at(-1)!.scene;
    expect(states(end.slots)).toEqual(["sent", "error", "unsent"]);
    expect(end.slots[1].label).toBe("NameError · dòng 7");
    expect(end.slots[2].label).toBe("CHƯA PHÁT");
    expect(t.flatMap((f) => f.cues)).toEqual(["scan_pass", "alarm"]);
    expect(end.channel).toBe("closed");
  });

  test("syntax error: nothing leaves the laptop", () => {
    const t = timeline(edit({ 6: 'print("NID/2089"' }));
    expect(t.every((f) => f.scene.slots.every((s) => s.state === "idle"))).toBe(true);
    expect(t.at(-1)!.scene).toMatchObject({ laptop: "compile_error", status: "TRÌNH DỊCH TỪ CHỐI" });
    expect(t.flatMap((f) => f.cues)).toEqual(["alarm"]);
  });

  test("line 3 in lower case: dropped at position 1; summary sentence", () => {
    const t = timeline(edit({ 7: FIX_7 }));
    const slot = t.at(-1)!.scene.slots[2];
    expect(slot).toMatchObject({ state: "dropped", label: "BỎ GÓI · vị trí 1" });
    expect(slot.diff?.col).toBe(1);
    expect(summarizeRelay(t, level)).toBe("Trạm R-17 phát 2/3 dòng. Dòng 3 sai ở vị trí 1. Kênh đóng.");
  });

  test("missing and extra lines", () => {
    expect(states(timeline(edit({ 7: FIX_7, 8: "" })).at(-1)!.scene.slots)).toEqual(["sent", "sent", "missing"]);
    const extra = timeline(edit({ 7: FIX_7, 8: `${FIX_8}\nprint("XIN CHAO")` })).at(-1)!.scene;
    expect(extra.extra).toEqual([expect.objectContaining({ state: "extra", expected: "XIN CHAO", label: "DÒNG THỪA" })]);
  });

  test("three stars: the station reboots with M4X8, the beam reaches the edge", () => {
    const t = timeline(edit({ 7: FIX_7, 8: FIX_8 }));
    const reboot = t.find((f) => f.scene.wave === "counter")!;
    expect(reboot.scene.chip).toContain('ma_phien = "M4X8"');
    expect(reboot.cues).toEqual(["siren"]);
    expect(reboot.scene.antenna).toBe("off");
    const end = t.at(-1)!;
    expect(end.scene).toMatchObject({ channel: "open", reachedEdge: true, status: "KÊNH MỞ HOÀN TOÀN" });
    expect(end.cues).toEqual(["gate_open", "star"]);
  });

  test("hard-coded session: channel back to half, line 2 of the counter wave dropped", () => {
    const end = timeline(edit({ 7: 'print("PHIEN K7Q2")', 8: FIX_8 })).at(-1)!.scene;
    expect(end).toMatchObject({ wave: "counter", channel: "half" });
    expect(states(end.slots)).toEqual(["sent", "dropped", "sent"]);
    expect(end.slots[1].expected).toBe("PHIEN M4X8");
  });
});

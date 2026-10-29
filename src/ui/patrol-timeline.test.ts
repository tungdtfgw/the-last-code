import { describe, expect, test } from "vitest";
import bareFixture from "../../tests/fixtures/levels/level-test-patrol-bare.json";
import mixedFixture from "../../tests/fixtures/levels/level-test-patrol-mixed.json";
import stdinFixture from "../../tests/fixtures/levels/level-test-patrol-stdin.json";
import { runHarness } from "../../tests/integration/run-harness";
import { classifyRun, type RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { validateLevel } from "../game/validate-level";
import { buildPatrolTimeline, CUT, summarizePatrol } from "./patrol-timeline";

const load = (raw: unknown): LevelDefinition => {
  const r = validateLevel(raw);
  if (!r.ok) throw new Error(r.errors.join("\n"));
  return r.level;
};
const stdinLevel = load(stdinFixture);
const bareLevel = load(bareFixture);
const mixedLevel = load(mixedFixture);

const HEAD = "# Cảm biến (KHÔNG được sửa dòng này):\nmuc = 5\n\n";
const outcomeOf = (level: LevelDefinition, code: string) => classifyRun({ kind: "ok", data: runHarness(level, code) }, level);
const timeline = (level: LevelDefinition, code: string) => buildPatrolTimeline(outcomeOf(level, code), level);
const end = (frames: ReturnType<typeof buildPatrolTimeline>) => frames.at(-1)!.scene;

const SOLVED = `${HEAD}tin = input()\nif tin.strip():\n    print("NAP")\nelse:\n    print("DI")\n`;

describe("patrol timeline", () => {
  test("every situation passes, then the drone still lets Kai through after OMNI changes the rules", () => {
    const t = timeline(stdinLevel, SOLVED);
    const last = end(t);
    expect(last.situations).toEqual(["passed", "passed", "passed"]);
    expect(last).toMatchObject({ wave: "counter", gate: "open", kai: "through", label: "DRONE BỎ QUA" });
    expect(t.find((f) => f.scene.wave === "counter")!.scene).toMatchObject({ banner: "OMNI ĐỔI LUẬT TUẦN TRA", status: "OMNI ĐỔI LUẬT TUẦN TRA" });
    expect(t.at(-1)!.cues).toEqual(["gate_open", "star"]);
    expect(summarizePatrol(t)).toBe(
      "Tình huống 1 qua. Tình huống 2 qua. Tình huống 3 qua. OMNI đổi luật: drone vẫn bỏ qua. Lối qua mở hoàn toàn.",
    );
  });

  test("caught in situation 2: the decision chip shows the wrong move, situation 3 is never reached", () => {
    const t = timeline(stdinLevel, `${HEAD}tin = input()\nprint("NAP")\n`);
    const last = end(t);
    expect(last.situations).toEqual(["passed", "caught", "notReached"]);
    expect(last).toMatchObject({ round: 2, kai: "caught", drone: "locked", label: "BỊ PHÁT HIỆN", status: "DRONE PHÁT HIỆN" });
    expect(last.decision).toEqual({ label: "Lệnh của Kai", value: "NAP", state: "bad" });
    expect(t.some((f) => f.scene.round === 3)).toBe(false);
    expect(summarizePatrol(t)).toBe("Tình huống 1 qua. Tình huống 2: bị phát hiện. Lối qua đóng.");
  });

  test("an error in situation 1 locks the light on Kai with the error, like the relay", () => {
    const last = end(timeline(stdinLevel, `${HEAD}tin = input()\nprint(1 / 0)\n`));
    expect(last.situations).toEqual(["caught", "notReached", "notReached"]);
    expect(last).toMatchObject({ drone: "locked", label: "ZeroDivisionError · dòng 5", status: "TRUY VẾT: dòng 5" });
  });

  test("a syntax error: no situation runs", () => {
    const t = timeline(stdinLevel, `${HEAD}tin = input(\n`);
    expect(t.every((f) => f.scene.situations.every((s) => s === "idle"))).toBe(true);
    expect(end(t)).toMatchObject({ compileError: true });
  });

  test("the counter-attack catches code written for the old rules", () => {
    const last = end(timeline(stdinLevel, `${HEAD}tin = input()\nif tin not in ("", " "):\n    print("NAP")\nelse:\n    print("DI")\n`));
    expect(last).toMatchObject({ wave: "counter", gate: "half", kai: "caught", drone: "locked", label: "BỊ PHÁT HIỆN" });
    expect(last.decision).toMatchObject({ value: "NAP", state: "bad" });
  });

  describe("a counter-attack cut short never shows the drone catching Kai", () => {
    const passed = outcomeOf(stdinLevel, SOLVED);
    const cases: [string, Partial<RunOutcome>][] = [
      ["the counter run timed out", { key: "timeout", counterSurvived: false }],
      ["the counter phase was aborted", { counterAborted: "timeout", counterSurvived: false }],
      ["the counter run raised", { counterSurvived: false, error: { phase: "counter", type: "ValueError", message: "m", line: 5, tracebackLines: [] } }],
      ["no counter variables came back", { counterVars: undefined, counterSurvived: false }],
      ["no counter output came back", { counterOutput: undefined, counterSurvived: false }],
    ];
    test.each(cases)("%s", (_name, over) => {
      const last = end(buildPatrolTimeline({ ...passed, ...over, stars: 2 }, stdinLevel));
      expect(last).toMatchObject({ wave: "counter", label: CUT, gate: "half" });
      expect(last.drone).not.toBe("locked");
      expect(last.kai).not.toBe("caught");
    });
  });

  test("the sensor board tells an empty stdin line from a space; neither is hidden", () => {
    const t = timeline(stdinLevel, SOLVED);
    const sensorsOf = (round: number) => t.find((f) => f.scene.round === round)!.scene.sensors;
    expect(sensorsOf(2)).toEqual([
      { kind: "input", name: "muc", text: "3", empty: false },
      { kind: "stdin", name: "kênh nhập 1", text: "(dòng trống)", empty: true },
    ]);
    expect(sensorsOf(3)[1]).toEqual({ kind: "stdin", name: "kênh nhập 1", text: "·", empty: false });
  });

  test("once Kai moves, each stdin card says whether the program read it; before that it says nothing", () => {
    const stdinState = (frames: ReturnType<typeof buildPatrolTimeline>) => frames.map((f) => f.scene.sensors.find((c) => c.kind === "stdin")?.read);
    const unread = timeline(stdinLevel, `${HEAD}print("DI")\n`);
    expect(end(unread).situations[0]).toBe("caught");
    expect(stdinState(unread).at(-1)).toBe(false);
    expect(stdinState(unread).find((r) => r !== undefined)).toBe(false);
    const read = timeline(stdinLevel, SOLVED);
    // The sensors are shown unmarked first in every situation, then marked; the counter situation too.
    expect(read.find((f) => f.scene.round === 1)!.scene.sensors[1].read).toBeUndefined();
    expect(end(read).sensors[1]).toMatchObject({ kind: "stdin", read: true });
    expect(end(read).sensors[0].read).toBeUndefined();
  });

  test("without a decision every objective is a drone lamp; a level with no inputs and no locked lines plays", () => {
    const last = end(timeline(bareLevel, 'tin = input()\nnap = tin == "DRONE"\nhuong = "TRAI"\n'));
    expect(last.decision).toBeNull();
    expect(last.situations).toEqual(["passed", "caught"]);
    expect(last.lamps).toEqual([
      { name: "nap", label: "Có nấp không", value: "False", state: "ok" },
      { name: "huong", label: "Hướng đi", value: "'TRAI'", state: "bad" },
    ]);
    expect(last.sensors).toEqual([{ kind: "stdin", name: "kênh nhập 1", text: "(dòng trống)", empty: true, read: true }]);
  });

  test("a right decision with another objective wrong is still caught", () => {
    const last = end(timeline(mixedLevel, '# Cảm biến (KHÔNG được sửa dòng này):\ngoc = 30\n\nhuong = "TRAI" if goc < 90 else "PHAI"\nprint("GOC", goc + 1)\n'));
    expect(last.situations).toEqual(["caught", "notReached"]);
    expect(last.decision).toEqual({ label: "Hướng đi", value: "'TRAI'", state: "ok" });
    expect(last.slots).toMatchObject([{ line: 1, state: "dropped" }]);
    expect(last).toMatchObject({ kai: "caught", label: "BỊ PHÁT HIỆN" });
  });

  test("a decision variable that never got a value: empty chip, Kai stands still", () => {
    const last = end(timeline(mixedLevel, '# Cảm biến (KHÔNG được sửa dòng này):\ngoc = 30\n\nif goc < 90:\n    huong = "TRAI"\nprint("GOC", goc)\n'));
    expect(last.situations).toEqual(["passed", "caught"]);
    expect(last.decision).toEqual({ label: "Hướng đi", value: null, state: "bad" });
    expect(last).toMatchObject({ kai: "still", label: "BỊ PHÁT HIỆN" });
  });

  test("the last frame alone tells every situation's result (what reduced motion shows)", () => {
    const last = end(timeline(stdinLevel, `${HEAD}tin = input()\nif tin:\n    print("NAP")\nelse:\n    print("DI")\n`));
    expect(last.situations).toEqual(["passed", "passed", "caught"]);
    expect(last).toMatchObject({ round: 3, label: "BỊ PHÁT HIỆN" });
    expect(last.decision).toMatchObject({ value: "NAP", state: "bad" });
  });
});

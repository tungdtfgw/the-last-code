import { describe, expect, test, vi } from "vitest";
import { AudioEngine } from "./audio-engine";
import { RECIPES, type Cue } from "./sound-recipes";

/** A permissive stand-in for any AudioNode/AudioParam: every method exists and chains. */
function stubNode(log: string[], kind: string): any {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  const node: any = {
    kind,
    gain: param(),
    frequency: param(),
    Q: param(),
    type: "",
    buffer: null,
    curve: null,
    loop: false,
    connect: (target: any) => target ?? node,
    disconnect() {},
    start: () => log.push(`start:${kind}`),
    stop() {},
  };
  return node;
}

class FakeContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  sampleRate = 8000;
  destination = {};
  log: string[] = [];
  refuseResume = false;
  createGain = () => stubNode(this.log, "gain");
  createOscillator = () => stubNode(this.log, "osc");
  createBiquadFilter = () => stubNode(this.log, "filter");
  createBufferSource = () => stubNode(this.log, "noise");
  createWaveShaper = () => stubNode(this.log, "shaper");
  createDynamicsCompressor = () => stubNode(this.log, "comp");
  createBuffer = (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) });
  resume = vi.fn(async () => {
    if (!this.refuseResume) this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {});
}

function setup() {
  const ctx = new FakeContext();
  const create = vi.fn(() => ctx as unknown as AudioContext);
  let now = 1000;
  const engine = new AudioEngine({ createContext: create, now: () => now });
  return { ctx, create, engine, tick: (ms: number) => (now += ms) };
}

describe("AudioEngine", () => {
  test("no AudioContext before the first gesture; nothing plays (E3)", () => {
    const { engine, create } = setup();
    expect(engine.play("run")).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  test("unlock creates and resumes the context and starts the ambient hum", async () => {
    const { engine, ctx, create } = setup();
    await engine.unlock();
    expect(create).toHaveBeenCalledTimes(1);
    expect(ctx.state).toBe("running");
    expect(ctx.log.filter((l) => l === "start:osc").length).toBeGreaterThanOrEqual(3);
    expect(engine.play("run")).toBe(true);
    await engine.unlock();
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("refused resume keeps silent and retries on the next gesture", async () => {
    const { engine, ctx } = setup();
    ctx.refuseResume = true;
    await engine.unlock();
    expect(engine.play("run")).toBe(false);
    ctx.refuseResume = false;
    await engine.unlock();
    expect(engine.play("run")).toBe(true);
  });

  test("mute silences immediately and survives unlock (E4)", async () => {
    const { engine, tick } = setup();
    engine.setMuted(true);
    await engine.unlock();
    expect(engine.play("alarm")).toBe(false);
    engine.setMuted(false);
    tick(100);
    expect(engine.play("alarm")).toBe(true);
    engine.setMuted(true);
    tick(100);
    expect(engine.play("alarm")).toBe(false);
  });

  test("no Web Audio → no-op engine (E5)", async () => {
    const engine = new AudioEngine({ createContext: () => null });
    await engine.unlock();
    expect(engine.play("run")).toBe(false);
    expect(() => engine.setMuted(true)).not.toThrow();
    const throwing = new AudioEngine({ createContext: () => { throw new Error("nope"); } });
    await expect(throwing.unlock()).resolves.toBeUndefined();
    expect(throwing.play("run")).toBe(false);
  });

  test("same cue within the merge window is merged; key_blip throttled at 35 ms", async () => {
    const { engine, tick } = setup();
    await engine.unlock();
    expect(engine.play("scan_pass")).toBe(true);
    tick(10);
    expect(engine.play("scan_pass")).toBe(false);
    tick(25);
    expect(engine.play("scan_pass")).toBe(true);
    expect(engine.play("key_blip")).toBe(true);
    tick(30);
    expect(engine.play("key_blip")).toBe(false);
    tick(10);
    expect(engine.play("key_blip")).toBe(true);
  });

  test("at most 8 overlapping voices", async () => {
    const { engine, tick } = setup();
    await engine.unlock();
    const cues: Cue[] = ["siren", "alarm", "gate_open", "star", "run", "scan_pass", "scan_reject", "terminal_line"];
    for (const c of cues) expect(engine.play(c)).toBe(true);
    tick(100);
    expect(engine.play("locked_blocked")).toBe(false);
  });

  test("hidden tab suspends; visible resumes", async () => {
    const { engine, ctx } = setup();
    await engine.unlock();
    engine.suspend();
    await Promise.resolve();
    expect(ctx.suspend).toHaveBeenCalled();
    expect(engine.play("run")).toBe(false);
    engine.resume();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });

  test("opt-in probe records context, unlock, ambient and played cues only", async () => {
    const g = globalThis as { __TLC_AUDIO_PROBE__?: { event: string }[] };
    g.__TLC_AUDIO_PROBE__ = [];
    try {
      const { engine } = setup();
      expect(engine.play("run")).toBe(false);
      await engine.unlock();
      engine.play("run");
      engine.setMuted(true);
      engine.play("alarm");
      expect(g.__TLC_AUDIO_PROBE__.map((e) => e.event)).toEqual(["context", "unlock", "ambient", "run"]);
    } finally {
      delete g.__TLC_AUDIO_PROBE__;
    }
  });

  test("every recipe schedules without throwing", () => {
    const ctx = new FakeContext() as unknown as BaseAudioContext;
    for (const recipe of Object.values(RECIPES)) {
      const d = recipe(ctx, stubNode([], "out"), 0);
      expect(d).toBeGreaterThan(0);
    }
  });
});

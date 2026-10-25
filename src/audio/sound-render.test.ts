import { OfflineAudioContext } from "node-web-audio-api";
import { describe, expect, test } from "vitest";
import { createOutputChain } from "./audio-engine";
import { RECIPES, startAmbient, type Cue } from "./sound-recipes";

const RATE = 22050;

/** Render one cue through the same master/compressor chain the game uses. */
async function render(build: (ctx: BaseAudioContext, out: AudioNode) => number | void, seconds: number) {
  const ctx = new OfflineAudioContext(1, Math.ceil(RATE * seconds), RATE) as unknown as OfflineAudioContext & BaseAudioContext;
  const { master } = createOutputChain(ctx);
  const duration = build(ctx, master);
  const buffer = await ctx.startRendering();
  const data = buffer.getChannelData(0);
  let peak = 0;
  let lastAudible = -1;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (!Number.isFinite(a)) throw new Error("non-finite sample");
    if (a > peak) peak = a;
    if (a > 1e-4) lastAudible = i;
  }
  return { peak, duration, audibleUntil: lastAudible / RATE };
}

describe("every cue renders real, non-clipping sound (OfflineAudioContext)", () => {
  test.each(Object.keys(RECIPES) as Cue[])("%s", async (cue) => {
    const r = await render((ctx, out) => RECIPES[cue](ctx, out, 0.01), 4);
    expect(r.peak, `${cue} peak`).toBeGreaterThan(0.01);
    expect(r.peak, `${cue} peak`).toBeLessThanOrEqual(1);
    expect(r.duration as number).toBeGreaterThan(0.01);
    expect(r.duration as number).toBeLessThan(3.5);
    // Sound stops within the declared duration (plus release/compressor tail).
    expect(r.audibleUntil).toBeLessThanOrEqual((r.duration as number) + 0.35);
  });

  test("ambient hum is audible, quiet and continuous", async () => {
    const r = await render((ctx, out) => {
      const amb = ctx.createGain();
      amb.gain.value = 0.04;
      amb.connect(out);
      startAmbient(ctx, amb);
    }, 2);
    expect(r.peak).toBeGreaterThan(0.002);
    expect(r.peak).toBeLessThan(0.2);
    expect(r.audibleUntil).toBeGreaterThan(1.9);
  });
});

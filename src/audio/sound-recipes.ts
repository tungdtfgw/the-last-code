/**
 * Procedural sound recipes (Web Audio only, no asset files).
 * Each recipe schedules nodes starting at `when` and returns its duration in seconds.
 */
export const CUES = [
  "key_blip",
  "terminal_line",
  "run",
  "scan_pass",
  "scan_reject",
  "locked_blocked",
  "alarm",
  "siren",
  "gate_open",
  "gate_close_far",
  "star",
  "echo_voice",
  "teletype",
  "objective_lock",
  "pulse",
  "glitch",
] as const;
export type Cue = (typeof CUES)[number];

type Recipe = (ctx: BaseAudioContext, out: AudioNode, when: number) => number;

function envGain(ctx: BaseAudioContext, out: AudioNode, when: number, peak: number, attack: number, release: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + release);
  g.connect(out);
  return g;
}

function tone(
  ctx: BaseAudioContext,
  out: AudioNode,
  when: number,
  type: OscillatorType,
  freq: number,
  dur: number,
  peak: number,
  endFreq?: number,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, when + dur);
  osc.connect(envGain(ctx, out, when, peak, Math.min(0.008, dur / 4), dur));
  osc.start(when);
  osc.stop(when + dur + 0.05);
  return osc;
}

let noiseCache: WeakMap<BaseAudioContext, AudioBuffer> | null = null;
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  noiseCache ??= new WeakMap();
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

function lowpass(ctx: BaseAudioContext, out: AudioNode, freq: number) {
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq;
  f.connect(out);
  return f;
}

const bitcrushCurve = (() => {
  let curve: Float32Array<ArrayBuffer> | null = null;
  return () => {
    if (!curve) {
      curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.round(((i / 255) * 2 - 1) * 4) / 4;
    }
    return curve;
  };
})();

export const RECIPES: Record<Cue, Recipe> = {
  /** Briefing text arriving: a dry relay click with a faint carrier under it. */
  teletype: (ctx, out, t) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2600 + Math.random() * 900, t);
    bp.Q.value = 6;
    src.connect(bp).connect(envGain(ctx, out, t, 0.22, 0.002, 0.025));
    src.start(t);
    src.stop(t + 0.04);
    tone(ctx, out, t, "square", 1200 + Math.random() * 300, 0.01, 0.012);
    return 0.04;
  },
  /** An objective locking into the list: falling sweep into a short confirm blip. */
  objective_lock: (ctx, out, t) => {
    tone(ctx, out, t, "sawtooth", 1400, 0.09, 0.05, 320);
    tone(ctx, out, t + 0.1, "square", 880, 0.05, 0.07);
    tone(ctx, out, t + 0.1, "sine", 1760, 0.08, 0.04);
    return 0.2;
  },
  key_blip: (ctx, out, t) => {
    tone(ctx, out, t, "square", 1800 + Math.random() * 400, 0.012, 0.02);
    return 0.02;
  },
  terminal_line: (ctx, out, t) => {
    tone(ctx, out, t, "sine", 900, 0.03, 0.05);
    return 0.04;
  },
  run: (ctx, out, t) => {
    tone(ctx, out, t, "sine", 200, 0.18, 0.12, 800);
    tone(ctx, out, t + 0.19, "square", 2400, 0.01, 0.04);
    return 0.22;
  },
  scan_pass: (ctx, out, t) => {
    tone(ctx, out, t, "sine", 660, 0.08, 0.1);
    tone(ctx, out, t + 0.09, "sine", 990, 0.08, 0.1);
    return 0.2;
  },
  scan_reject: (ctx, out, t) => {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, t);
    osc.connect(lowpass(ctx, envGain(ctx, out, t, 0.14, 0.005, 0.12), 600));
    osc.start(t);
    osc.stop(t + 0.18);
    return 0.18;
  },
  locked_blocked: (ctx, out, t) => {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, t);
    osc.connect(lowpass(ctx, envGain(ctx, out, t, 0.1, 0.004, 0.1), 500));
    osc.start(t);
    osc.stop(t + 0.15);
    return 0.15;
  },
  alarm: (ctx, out, t) => {
    for (let i = 0; i < 4; i++) {
      tone(ctx, out, t + i * 0.12, "square", i % 2 ? 660 : 440, 0.11, 0.06);
    }
    return 0.5;
  },
  siren: (ctx, out, t) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.1);
    g.gain.setValueAtTime(0.08, t + 3.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    osc.connect(band).connect(g).connect(out);
    for (let i = 0; i < 2; i++) {
      const s = t + i * 1.6;
      osc.frequency.setValueAtTime(300, s);
      osc.frequency.linearRampToValueAtTime(900, s + 0.8);
      osc.frequency.linearRampToValueAtTime(300, s + 1.6);
    }
    osc.start(t);
    osc.stop(t + 3.25);
    return 3.25;
  },
  gate_open: (ctx, out, t) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(2000, t + 0.7);
    src.connect(f).connect(envGain(ctx, out, t, 0.12, 0.05, 0.7));
    src.start(t);
    src.stop(t + 0.8);
    tone(ctx, out, t, "sine", 60, 0.7, 0.18);
    return 0.8;
  },
  /** Story beat: a gate shutting some distance away; `gate_open` reversed, darker and about a third as loud. */
  gate_close_far: (ctx, out, t) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 0.9);
    src.connect(f).connect(envGain(ctx, out, t, 0.04, 0.08, 0.9));
    src.start(t);
    src.stop(t + 1.05);
    tone(ctx, out, t + 0.85, "sine", 48, 0.5, 0.07, 40);
    return 1.4;
  },
  star: (ctx, out, t) => {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(ctx, out, t + i * 0.09, "sine", f, 0.16, 0.1));
    return 0.45;
  },
  echo_voice: (ctx, out, t) => {
    const carrier = ctx.createOscillator();
    carrier.type = Math.random() > 0.5 ? "square" : "sine";
    carrier.frequency.setValueAtTime(300 + Math.random() * 200, t);
    const ring = ctx.createGain();
    ring.gain.value = 0;
    const mod = ctx.createOscillator();
    mod.frequency.value = 30;
    mod.connect(ring.gain);
    const crush = ctx.createWaveShaper();
    crush.curve = bitcrushCurve();
    carrier.connect(ring).connect(crush).connect(envGain(ctx, out, t, 0.05, 0.004, 0.04));
    carrier.start(t);
    mod.start(t);
    carrier.stop(t + 0.06);
    mod.stop(t + 0.06);
    return 0.06;
  },
  /** Story beat: one deep heartbeat (sine fundamental plus a soft overtone), fast attack, ~0.9 s decay. */
  pulse: (ctx, out, t) => {
    tone(ctx, out, t, "sine", 55, 0.9, 0.5, 48);
    tone(ctx, out, t, "sine", 110, 0.5, 0.16, 96);
    tone(ctx, out, t, "triangle", 220, 0.08, 0.05);
    return 0.95;
  },
  /** Signal tearing: band-passed white noise chopped into four uneven slices over ~0.25 s. */
  glitch: (ctx, out, t) => {
    const slices = [
      [0, 0.04, 3200],
      [0.06, 0.03, 1400],
      [0.12, 0.05, 5200],
      [0.2, 0.04, 900],
    ] as const;
    for (const [offset, dur, freq] of slices) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(freq, t + offset);
      bp.Q.value = 4;
      src.connect(bp).connect(envGain(ctx, out, t + offset, 0.3, 0.002, dur));
      src.start(t + offset, Math.random());
      src.stop(t + offset + dur + 0.01);
    }
    tone(ctx, out, t + 0.06, "square", 180, 0.05, 0.03);
    return 0.26;
  },
};

/** Low drone: two detuned saws through a slowly breathing lowpass, plus faint filtered noise. */
export function startAmbient(ctx: BaseAudioContext, out: AudioNode): () => void {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 180;
  filter.connect(out);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 60;
  lfo.connect(lfoDepth).connect(filter.frequency);
  const oscs = [55, 55.4].map((f) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.connect(filter);
    return o;
  });
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1200;
  band.Q.value = 3;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.15;
  noise.connect(band).connect(noiseGain).connect(filter);
  const sources = [lfo, ...oscs, noise];
  sources.forEach((s) => s.start());
  return () => sources.forEach((s) => {
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
  });
}

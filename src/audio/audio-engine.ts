import { RECIPES, startAmbient, type Cue } from "./sound-recipes";

export type { Cue } from "./sound-recipes";

export interface AudioEngineOptions {
  /** Returns a new AudioContext, or null when Web Audio is unavailable. */
  createContext?: () => AudioContext | null;
  now?: () => number;
}

export const MASTER_VOLUME = 0.6;
export const AMBIENT_VOLUME = 0.04;
const MAX_VOICES = 8;
const MERGE_WINDOW_MS = 30;
const THROTTLE_MS: Partial<Record<Cue, number>> = { key_blip: 35, echo_voice: 60, teletype: 30 };

/** master gain → compressor → destination, plus an ambient branch into master. Shared with the render test. */
export function createOutputChain(ctx: BaseAudioContext, muted = false) {
  const compressor = ctx.createDynamicsCompressor();
  compressor.connect(ctx.destination);
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOLUME;
  master.connect(compressor);
  const ambientGain = ctx.createGain();
  ambientGain.gain.value = muted ? 0 : AMBIENT_VOLUME;
  ambientGain.connect(master);
  return { master, ambientGain };
}

export type AudioProbeEvent = { event: "context" | "unlock" | "ambient" | Cue; at: number };

/**
 * Opt-in instrumentation for automated tests: when a page defines
 * `window.__TLC_AUDIO_PROBE__ = []` before the app loads, every scheduled sound is
 * recorded there. Without that array nothing is recorded.
 */
function probe(event: AudioProbeEvent["event"]) {
  const log = (globalThis as { __TLC_AUDIO_PROBE__?: AudioProbeEvent[] }).__TLC_AUDIO_PROBE__;
  if (Array.isArray(log)) log.push({ event, at: Date.now() });
}

const defaultCreateContext = (): AudioContext | null => {
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  return Ctor ? new Ctor() : null;
};

/**
 * Procedural sound. No AudioContext exists before the first user gesture
 * (`unlock`). Without Web Audio, or after an init failure, every call is a no-op.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private stopAmbient: (() => void) | null = null;
  private muted = false;
  private broken = false;
  private unlocked = false;
  private lastPlayed = new Map<Cue, number>();
  private voiceEnds: number[] = [];
  private readonly createContext: () => AudioContext | null;
  private readonly now: () => number;

  constructor(opts: AudioEngineOptions = {}) {
    this.createContext = opts.createContext ?? defaultCreateContext;
    this.now = opts.now ?? (() => performance.now());
  }

  get isUnlocked() {
    return this.unlocked;
  }

  get isMuted() {
    return this.muted;
  }

  /** Call from a user gesture. Safe to call repeatedly; retries if resume() was refused. */
  async unlock(): Promise<void> {
    if (this.broken) return;
    try {
      if (!this.ctx) {
        const ctx = this.createContext();
        if (!ctx) {
          this.broken = true;
          return;
        }
        this.ctx = ctx;
        probe("context");
        const chain = createOutputChain(ctx, this.muted);
        this.master = chain.master;
        this.ambientGain = chain.ambientGain;
      }
      if (this.ctx.state !== "running") await this.ctx.resume();
      if (this.ctx.state !== "running") return; // refused: stay silent, retry next gesture
      this.unlocked = true;
      probe("unlock");
      if (!this.stopAmbient && this.ambientGain) {
        this.stopAmbient = startAmbient(this.ctx, this.ambientGain);
        probe("ambient");
      }
    } catch {
      this.unlocked = false;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master || !this.ambientGain) return;
    const t = this.ctx.currentTime;
    for (const [node, volume] of [
      [this.master, MASTER_VOLUME],
      [this.ambientGain, AMBIENT_VOLUME],
    ] as const) {
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(muted ? 0 : volume, t + 0.05);
    }
  }

  /** Returns true when the cue was scheduled. */
  play(cue: Cue, delayMs = 0): boolean {
    if (this.muted || !this.unlocked || !this.ctx || !this.master || this.ctx.state !== "running") return false;
    const now = this.now();
    const last = this.lastPlayed.get(cue);
    const window = THROTTLE_MS[cue] ?? MERGE_WINDOW_MS;
    if (delayMs === 0 && last !== undefined && now - last < window) return false;
    const t = this.ctx.currentTime + delayMs / 1000;
    this.voiceEnds = this.voiceEnds.filter((end) => end > this.ctx!.currentTime);
    if (this.voiceEnds.length >= MAX_VOICES) return false;
    try {
      const duration = RECIPES[cue](this.ctx, this.master, t);
      this.voiceEnds.push(t + duration);
      this.lastPlayed.set(cue, now);
      probe(cue);
      return true;
    } catch {
      return false;
    }
  }

  /** Tab hidden: stop all sound processing. */
  suspend() {
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend().catch(() => {});
  }

  resume() {
    if (this.ctx && this.unlocked && this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  dispose() {
    this.stopAmbient?.();
    this.stopAmbient = null;
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = null;
    this.unlocked = false;
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgressRepository } from "../storage/progress-repository";
import { AudioEngine, type Cue } from "./audio-engine";

export interface AudioControls {
  play: (cue: Cue, delayMs?: number) => void;
  muted: boolean;
  toggleMute: () => void;
  /** Call from a user gesture; resolves once audio is running (or known to be unavailable). */
  unlock: () => Promise<void>;
}

/**
 * Owns the AudioEngine for the app: unlocks on the first pointer/key gesture,
 * suspends while the tab is hidden, and keeps `muted` in the progress repository.
 */
export function useAudio(repository: ProgressRepository): AudioControls {
  const engineRef = useRef<AudioEngine | null>(null);
  engineRef.current ??= new AudioEngine();
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    void repository.getSettings().then((s) => {
      if (!alive) return;
      mutedRef.current = s.muted;
      setMuted(s.muted);
      engineRef.current?.setMuted(s.muted);
    });
    return () => {
      alive = false;
    };
  }, [repository]);

  useEffect(() => {
    const engine = engineRef.current!;
    const unlock = () => {
      void engine.unlock().then(() => {
        if (engine.isUnlocked) GESTURES.forEach((g) => window.removeEventListener(g, unlock, true));
      });
    };
    const GESTURES = ["pointerdown", "keydown", "click", "touchend"] as const;
    GESTURES.forEach((g) => window.addEventListener(g, unlock, true));
    const onVisibility = () => (document.hidden ? engine.suspend() : engine.resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      GESTURES.forEach((g) => window.removeEventListener(g, unlock, true));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => () => engineRef.current?.dispose(), []);

  const play = useCallback((cue: Cue, delayMs = 0) => {
    engineRef.current?.play(cue, delayMs);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    engineRef.current?.setMuted(next);
    void repository.updateSettings({ muted: next });
  }, [repository]);

  const unlock = useCallback(() => engineRef.current?.unlock() ?? Promise.resolve(), []);

  return { play, muted, toggleMute, unlock };
}

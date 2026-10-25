import { useEffect, useState } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { EchoState } from "../game/game-reducer";
import { useReducedMotion } from "./use-reduced-motion";
import { useTypewriter } from "./use-typewriter";

const TYPE_MS = 22;

/** Wireframe face. Drawn three times (base + two offset colour channels) for the glitch. */
function Face() {
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d="M60 14 L88 26 L96 56 L88 88 L72 104 L48 104 L32 88 L24 56 L32 26 Z" strokeWidth="1.6" />
      <path d="M60 14 L60 104 M32 26 L48 50 L60 44 L72 50 L88 26 M24 56 L48 50 M96 56 L72 50 M32 88 L50 78 L60 82 L70 78 L88 88 M48 104 L50 78 M72 104 L70 78 M48 50 L50 78 M72 50 L70 78" strokeWidth="0.7" opacity="0.45" />
      <path className="echo-eye" d="M40 56 L54 54 M66 54 L80 56" strokeWidth="2.6" />
      <path className="echo-mouth" d="M50 90 L60 92 L70 90" strokeWidth="1.8" />
    </g>
  );
}

/** `asleep`: ECHO stays silent until the level intro has finished. */
export function EchoPanel({ echo, asleep = false, onCue }: { echo: EchoState; asleep?: boolean; onCue(cue: Cue): void }) {
  const reduced = useReducedMotion();
  const full = echo.followUp ? `${echo.primary}\n${echo.followUp}` : echo.primary;
  const typed = useTypewriter(full, { key: echo.id, mode: asleep ? "hidden" : reduced ? "full" : "typing", msPerChar: TYPE_MS, onTick: () => onCue("echo_voice") });
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (asleep) return;
    setSpeaking(true);
    const id = setTimeout(() => setSpeaking(false), Math.min(2600, 500 + full.length * TYPE_MS));
    return () => clearTimeout(id);
  }, [echo.id, full.length, asleep]);

  const [primaryShown, followShown] = typed.split("\n");

  return (
    <section className="panel echo" aria-labelledby="echo-title">
      <header className="panel-head">
        <h2 id="echo-title" className="panel-title">ECHO</h2>
        <span className="panel-meta">trợ lý cũ · chỉ đọc</span>
      </header>
      <div className="echo-body">
        <div className={`echo-portrait${speaking && !reduced ? " is-speaking" : ""}${asleep ? " is-asleep" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 120 120" className="echo-face">
            <g className="echo-ch echo-ch-r" stroke="var(--omni)"><Face /></g>
            <g className="echo-ch echo-ch-b" stroke="var(--type-int)"><Face /></g>
            <g className="echo-ch echo-ch-main" stroke="var(--signal)"><Face /></g>
          </svg>
          <span className="echo-scan" />
        </div>
        <div className="echo-speech">
          <p className="echo-line" aria-hidden="true">
            {primaryShown}
            {!reduced && typed.length < full.length && <span className="caret" />}
          </p>
          {echo.followUp && followShown !== undefined && (
            <p className="echo-line echo-follow" aria-hidden="true">
              {followShown}
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {asleep ? "" : `ECHO: ${full}`}
          </p>
        </div>
      </div>
    </section>
  );
}

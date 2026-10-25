import { useEffect, useRef } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { LevelDefinition } from "../game/level-types";
import { useTypewriter } from "./use-typewriter";

const TYPE_MS = 26;

interface Props {
  level: LevelDefinition;
  /** Intro reveal: hidden behind the gate, typing after it, full once skipped or done. */
  mode: "hidden" | "typing" | "full";
  onCue(cue: Cue): void;
  onTyped(): void;
}

export function BriefingPanel({ level, mode, onCue, onTyped }: Props) {
  const typed = useTypewriter(level.briefing, { mode, msPerChar: TYPE_MS, tickEvery: 2, onTick: () => onCue("teletype"), onDone: onTyped });
  const [head, ...rest] = typed.split("\n");
  const typing = mode === "typing" && typed.length < level.briefing.length;
  const caret = typing && <span className="caret" aria-hidden="true" />;
  const panel = useRef<HTMLElement>(null);
  // Follow the text while it types past the bottom of the box.
  useEffect(() => {
    if (typing && panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  }, [typed, typing]);
  return (
    <section ref={panel} className="panel briefing" aria-labelledby="briefing-title">
      <header className="panel-head">
        <h2 id="briefing-title" className="panel-title">Nhiệm vụ</h2>
        <span className="panel-meta">Chương {level.chapter} · Vùng Tối</span>
      </header>
      <div className="panel-body" aria-hidden="true">
        <p className="briefing-head">
          {head}
          {rest.length === 0 && caret}
        </p>
        {rest.map((line, i) => (
          <p key={i} className="briefing-line">
            {line}
            {i === rest.length - 1 && caret}
          </p>
        ))}
      </div>
      <div className="sr-only">
        {level.briefing.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </section>
  );
}

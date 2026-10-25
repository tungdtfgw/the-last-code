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
  /** Folded to one line: the briefing's title and "Mở lại". */
  collapsed: boolean;
  onToggle(): void;
}

export function BriefingPanel({ level, mode, onCue, onTyped, collapsed, onToggle }: Props) {
  const typed = useTypewriter(level.briefing, { mode, msPerChar: TYPE_MS, tickEvery: 2, onTick: () => onCue("teletype"), onDone: onTyped });
  const [head, ...rest] = typed.split("\n");
  const typing = mode === "typing" && typed.length < level.briefing.length;
  const caret = typing && <span className="caret" aria-hidden="true" />;
  const panel = useRef<HTMLElement>(null);
  // Follow the text while it types past the bottom of the box.
  useEffect(() => {
    if (typing && panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  }, [typed, typing]);
  const title = level.briefing.split("\n")[0];
  return (
    <section ref={panel} className={`panel briefing${collapsed ? " is-collapsed" : ""}`} aria-labelledby="briefing-title">
      <header className="panel-head">
        <h2 id="briefing-title" className="panel-title briefing-title">
          <button type="button" className="briefing-toggle" aria-expanded={!collapsed} aria-controls="briefing-body" onClick={onToggle}>
            <span className="briefing-chevron" aria-hidden="true" />
            {collapsed ? (
              <>
                <span className="sr-only">Nhiệm vụ: </span>
                <span className="briefing-peek">{title}</span>
                <span className="briefing-toggle-hint">Mở lại</span>
              </>
            ) : (
              <>
                <span>Nhiệm vụ</span>
                <span className="briefing-toggle-hint">Thu gọn</span>
              </>
            )}
          </button>
        </h2>
        {!collapsed && <span className="panel-meta">Chương {level.chapter} · Vùng Tối</span>}
      </header>
      <div id="briefing-body" hidden={collapsed}>
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
      </div>
    </section>
  );
}

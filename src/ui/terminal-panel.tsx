import { useEffect, useRef } from "react";
import type { TerminalLine } from "../game/terminal-lines";

interface Props {
  lines: TerminalLine[];
  stdout: string | null;
  stdoutTruncated: boolean;
  onJump(line: number): void;
}

/** In-world log. All player-controlled text is rendered as text nodes, never as HTML. */
export function TerminalPanel({ lines, stdout, stdoutTruncated, onJump }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, stdout]);

  return (
    <section className="panel terminal" aria-labelledby="term-title">
      <header className="panel-head">
        <h2 id="term-title" className="panel-title">Terminal</h2>
        <span className="panel-meta">nhật ký máy quét</span>
      </header>
      <div ref={scroller} className="terminal-scroll" role="log" aria-live="polite" aria-relevant="additions" tabIndex={0}>
        {lines.map((l, i) => {
          const key = l.id ?? `i${i}`;
          return l.jumpLine ? (
            <button key={key} type="button" className={`term-line tone-${l.tone} term-jump`} onClick={() => onJump(l.jumpLine!)} title={`Nhảy tới dòng ${l.jumpLine}`}>
              {l.text}
            </button>
          ) : (
            <p key={key} className={`term-line tone-${l.tone}`}>
              {l.text}
            </p>
          );
        })}
        {stdout !== null && stdout.length > 0 && (
          <div className="term-stdout">
            <p className="term-stdout-title">ĐẦU RA</p>
            <pre className="term-stdout-body">{stdout}</pre>
            {stdoutTruncated && <p className="term-line tone-muted">[đã cắt bớt]</p>}
          </div>
        )}
      </div>
    </section>
  );
}

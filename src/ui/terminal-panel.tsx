import { useEffect, useRef } from "react";
import type { TerminalLine } from "../game/terminal-lines";

interface Props {
  lines: TerminalLine[];
  stdout: string | null;
  stdoutTruncated: boolean;
  /** stderr of the last run: shown apart, never graded. */
  stderr: string | null;
  /** Panel header note (which log this is). */
  note: string;
  onJump(line: number): void;
}

/** In-world log. All player-controlled text is rendered as text nodes, never as HTML. */
export function TerminalPanel({ lines, stdout, stdoutTruncated, stderr, note, onJump }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, stdout, stderr]);

  return (
    <section className="panel terminal" aria-labelledby="term-title">
      <header className="panel-head">
        <h2 id="term-title" className="panel-title">Terminal</h2>
        <span className="panel-meta">{note}</span>
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
        {stderr !== null && stderr.length > 0 && (
          <div className="term-stdout term-stderr">
            <p className="term-stdout-title">LUỒNG LỖI (không chấm)</p>
            <pre className="term-stdout-body">{stderr}</pre>
          </div>
        )}
      </div>
    </section>
  );
}

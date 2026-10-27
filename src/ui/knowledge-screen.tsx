import { useEffect } from "react";
import type { LevelDefinition, KnowledgeSummary } from "../game/level-types";
import { InlineCode } from "./inline-code";

export interface KnowledgeScreenProps {
  level: LevelDefinition & { knowledge_summary: KnowledgeSummary };
  /** TIẾP TỤC: on to the transition story, or back to the map when opened from it. */
  onContinue(): void;
}

const Paragraphs = ({ text }: { text: string }) => (
  <>
    {text.split("\n").map((line, i) => (
      <p key={i} className="learn-text">
        <InlineCode text={line} />
      </p>
    ))}
  </>
);

/**
 * "Tổng kết kiến thức": a plain technical recap of a passed level. No ECHO and no game
 * voice. The panel scrolls inside; the page does not. TIẾP TỤC starts focused.
 */
export function KnowledgeScreen({ level, onContinue }: KnowledgeScreenProps) {
  const ks = level.knowledge_summary;
  // Enter continues even after a click moved focus off the button (buttons handle their own Enter).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.defaultPrevented || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  return (
    <main className="screen learn-screen">
      <article className="learn-panel" aria-labelledby="learn-title">
        <header className="learn-head">
          <p className="learn-eyebrow">
            Tổng kết kiến thức · Level {level.id} {level.title}
          </p>
          <h1 id="learn-title" className="learn-title">
            {ks.title}
          </h1>
        </header>
        <div className="learn-body" tabIndex={0} aria-label="Nội dung tổng kết">
          {ks.sections.map((s, i) => (
            <section key={i} className="learn-section">
              <h2 className="learn-heading">
                <InlineCode text={s.heading} />
              </h2>
              <Paragraphs text={s.body} />
              {s.code && (
                <pre className="learn-code">
                  <code>{s.code}</code>
                </pre>
              )}
              {s.stdin !== undefined && (
                <>
                  <p className="learn-label">Dữ liệu nhập:</p>
                  <pre className="learn-output">
                    <kbd>{s.stdin.replace(/\n$/, "")}</kbd>
                  </pre>
                </>
              )}
              {s.output !== undefined && (
                <>
                  <p className="learn-label">Kết quả:</p>
                  <pre className="learn-output">
                    <samp>{s.output}</samp>
                  </pre>
                </>
              )}
            </section>
          ))}
          {ks.mistakes.length > 0 && (
            <section className="learn-section">
              <h2 className="learn-heading">Lỗi bạn có thể đã gặp</h2>
              <ul className="learn-mistakes">
                {ks.mistakes.map((m, i) => (
                  <li key={i} className="learn-mistake">
                    <pre className="learn-code">
                      <code>{m.code}</code>
                    </pre>
                    <p className="learn-error">
                      <samp>{m.error}</samp>
                    </p>
                    <Paragraphs text={m.explain} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="learn-section learn-next">
            <h2 className="learn-heading">Ở màn sau</h2>
            <Paragraphs text={ks.next} />
          </section>
        </div>
        <footer className="learn-actions">
          <button
            type="button"
            className="btn btn-run"
            onClick={onContinue}
            // A held key from the results dialog must not skip the screen.
            onKeyDown={(e) => {
              if (e.repeat) e.preventDefault();
            }}
            autoFocus
          >
            TIẾP TỤC
          </button>
          <span className="learn-hint">Nhấn Enter</span>
        </footer>
      </article>
    </main>
  );
}

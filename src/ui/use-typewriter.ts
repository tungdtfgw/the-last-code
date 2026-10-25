import { useEffect, useRef, useState } from "react";

export interface TypewriterOptions {
  /** Restart typing when this changes (e.g. a new ECHO line with the same text). */
  key?: unknown;
  /** "hidden" shows nothing, "typing" reveals char by char, "full" shows everything at once. */
  mode?: "hidden" | "typing" | "full";
  msPerChar?: number;
  /** Call `onTick` every N revealed characters (whitespace excluded). */
  tickEvery?: number;
  onTick?: () => void;
  /** Fires once when typing reaches the end (not when shown in full directly). */
  onDone?: () => void;
}

/** Character-by-character text reveal. Returns the visible prefix of `text`. */
export function useTypewriter(text: string, opts: TypewriterOptions = {}): string {
  const { key, mode = "typing", msPerChar = 22, tickEvery = 4 } = opts;
  const onTick = useRef(opts.onTick);
  const onDone = useRef(opts.onDone);
  onTick.current = opts.onTick;
  onDone.current = opts.onDone;
  // `shown` belongs to one (text, key); a new line starts from zero in the same render.
  const [progress, setProgress] = useState({ text, key, n: mode === "full" ? text.length : 0 });
  const shown = progress.text === text && progress.key === key ? progress.n : 0;
  const setShown = (n: number) => setProgress({ text, key, n });

  useEffect(() => {
    if (mode !== "typing") {
      setShown(mode === "full" ? text.length : 0);
      return;
    }
    setShown(0);
    let i = 0;
    let visible = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (!/\s/.test(text[i - 1] ?? "") && visible++ % tickEvery === 0) onTick.current?.();
      if (i >= text.length) {
        clearInterval(id);
        onDone.current?.();
      }
    }, msPerChar);
    return () => clearInterval(id);
  }, [text, key, mode, msPerChar, tickEvery]);

  // "full"/"hidden" are decided during render: waiting for the effect would leave one
  // render with stale text, visible when the main thread is busy.
  if (mode === "full") return text;
  if (mode === "hidden") return "";
  return text.slice(0, shown);
}

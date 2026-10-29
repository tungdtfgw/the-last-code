import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, bracketMatching, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { EditorState, Prec, StateEffect, StateField, type Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  GutterMarker,
  drawSelection,
  gutter,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type DecorationSet,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Cue } from "../audio/sound-recipes";
import { getLockedLineNumbers, lockedEditBlocked, lockedEditKept, lockedLines } from "./locked-lines-extension";

export interface CodeEditorHandle {
  focusLine(line: number): void;
  /** Returns false when the editor is not mounted yet. */
  reset(code: string, lockStart: number): boolean;
  focus(): void;
}

/** Lines the last run never reached in the shown round (`skipped_lines`). */
export interface SkippedLines {
  lines: readonly number[];
  /** "Không chạy ở {roundWord} {round}" in the line's title. */
  round?: number;
  roundWord: string;
  /** The lines come from the counter-attack: "Không chạy khi OMNI phản công". */
  counter?: boolean;
  /** The run these lines belong to: each run dims at most once. */
  run: object;
}

interface Props {
  initialCode: string;
  /** Dims these lines until the next edit; null clears them. */
  skipped?: SkippedLines | null;
  /** A run is in progress: clears the dimmed lines, and edits from here on drop the coming run's lines. */
  running?: boolean;
  lockStart: number;
  lockedTexts: readonly string[];
  onChange(code: string, lockedLineNumbers: number[]): void;
  onRun(): void;
  onCue(cue: Cue): void;
}

const theme = EditorView.theme(
  {
    "&": { height: "100%", backgroundColor: "var(--bg-deep)", color: "var(--text)", fontSize: "var(--text-base)" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
    ".cm-content": { caretColor: "var(--signal)", padding: "var(--s-3) 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeft: "2px solid var(--signal)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "oklch(84% 0.13 178 / 0.22) !important",
    },
    ".cm-gutters": { backgroundColor: "var(--bg-deep)", color: "var(--text-faint)", border: "none" },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 var(--s-2) 0 var(--s-3)", minWidth: "2.5em" },
    ".cm-activeLine": { backgroundColor: "oklch(100% 0 0 / 0.025)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--signal)" },
    ".cm-locked-line": {
      backgroundColor: "oklch(88% 0.16 95 / 0.06)",
      boxShadow: "inset 2px 0 0 oklch(88% 0.16 95 / 0.55)",
    },
    ".cm-lock-gutter .cm-gutterElement": { color: "var(--type-str)", display: "flex", alignItems: "center", paddingLeft: "6px" },
    ".cm-skipped-line": { opacity: "0.4" },
    ".cm-skip-gutter .cm-gutterElement": { color: "var(--text-faint)", paddingLeft: "4px" },
    ".cm-matchingBracket": { backgroundColor: "oklch(84% 0.13 178 / 0.18)", outline: "none" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: t.comment, color: "var(--text-faint)", fontStyle: "italic" },
  { tag: [t.string, t.special(t.string)], color: "var(--type-str)" },
  { tag: [t.number, t.integer], color: "var(--type-int)" },
  { tag: [t.bool, t.null], color: "var(--type-bool)" },
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "oklch(80% 0.09 200)" },
  { tag: [t.function(t.variableName), t.standard(t.variableName)], color: "var(--signal)" },
  { tag: [t.operator, t.punctuation], color: "var(--text-muted)" },
  { tag: t.variableName, color: "var(--text)" },
]);

export const setSkipped = StateEffect.define<SkippedLines | null>();

interface SkippedState {
  deco: DecorationSet;
  /** The code changed since the last clear (a run starting): line numbers of the coming run may be off. */
  edited: boolean;
  /** Runs already shown, so a re-sent run (after an aborted one) never dims again. */
  shown: WeakSet<object>;
}

/**
 * Dimmed lines of the last run. Any edit clears them, and lines arriving after an
 * edit made since the run started are dropped: they no longer match the code.
 */
export const skippedField = StateField.define<SkippedState>({
  create: () => ({ deco: Decoration.none, edited: false, shown: new WeakSet() }),
  update(value, tr) {
    for (const e of tr.effects) {
      if (!e.is(setSkipped)) continue;
      if (!e.value) return { ...value, deco: Decoration.none, edited: false };
      const { lines, round, roundWord, counter, run } = e.value;
      if (value.edited || value.shown.has(run)) return { ...value, deco: Decoration.none };
      value.shown.add(run);
      const title = counter ? "Không chạy khi OMNI phản công" : round ? `Không chạy ở ${roundWord} ${round}` : "Không chạy";
      const doc = tr.state.doc;
      const ranges: Range<Decoration>[] = [...new Set(lines)]
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= doc.lines)
        .sort((a, b) => a - b)
        .map((n) => Decoration.line({ class: "cm-skipped-line", attributes: { title } }).range(doc.line(n).from));
      return { ...value, deco: Decoration.set(ranges) };
    }
    return tr.docChanged ? { ...value, deco: Decoration.none, edited: true } : value;
  },
  provide: (f) => EditorView.decorations.from(f, (v) => v.deco),
});

class SkipMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement("span");
    el.textContent = "–";
    el.setAttribute("aria-hidden", "true");
    return el;
  }
}
const skipMarker = new SkipMarker();

/** "–" next to every dimmed line; empty (no width) when nothing is dimmed. */
const skipGutter = gutter({
  class: "cm-skip-gutter",
  lineMarker(view, line) {
    let found = false;
    view.state.field(skippedField).deco.between(line.from, line.from, () => {
      found = true;
      return false;
    });
    return found ? skipMarker : null;
  },
  lineMarkerChange: (u) => u.startState.field(skippedField).deco !== u.state.field(skippedField).deco,
});

/** CodeMirror 6 editor with the locked chip-data block. */
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  { initialCode, skipped = null, running = false, lockStart, lockedTexts, onChange, onRun, onCue },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRun, onCue });
  callbacks.current = { onChange, onRun, onCue };
  const [blockedMsg, setBlockedMsg] = useState("");
  const [flash, setFlash] = useState(0);

  const lockedTextsRef = useRef(lockedTexts);
  lockedTextsRef.current = lockedTexts;

  /** A fresh state (with its own undo history) for `code` with the locked block starting at `start`. */
  const createState = useRef((code: string, start: number) => {
    const base = EditorState.create({ doc: code });
    return EditorState.create({
      doc: code,
      extensions: [
        Prec.highest(
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                callbacks.current.onRun();
                return true;
              },
            },
          ]),
        ),
        lineNumbers(),
        skippedField,
        skipGutter,
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        history(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        python(),
        syntaxHighlighting(highlight),
        theme,
        lockedLines(base.doc, start, lockedTextsRef.current),
        EditorView.contentAttributes.of({ "aria-label": "Trình soạn mã Python. Esc rồi Tab để rời trình soạn.", spellcheck: "false" }),
        EditorView.updateListener.of((u) => {
          for (const tr of u.transactions) {
            if (tr.effects.some((e) => e.is(lockedEditBlocked))) {
              callbacks.current.onCue("locked_blocked");
              setBlockedMsg("");
              requestAnimationFrame(() => setBlockedMsg("Dòng dữ liệu nạp sẵn bị khóa."));
              setFlash((f) => f + 1);
            } else if (tr.effects.some((e) => e.is(lockedEditKept))) {
              // The edit went through around the block: show which lines it left alone.
              setBlockedMsg("");
              requestAnimationFrame(() => setBlockedMsg("Đã sửa phần còn lại. Dòng dữ liệu nạp sẵn vẫn giữ nguyên."));
              setFlash((f) => f + 1);
            }
          }
          if (u.docChanged) {
            callbacks.current.onChange(u.state.doc.toString(), getLockedLineNumbers(u.state));
            if (u.transactions.some((tr) => tr.isUserEvent("input") || tr.isUserEvent("delete"))) callbacks.current.onCue("key_blip");
          }
        }),
      ],
    });
  }).current;

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({ state: createState(initialCode, lockStart), parent: host.current });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once per document load; later changes flow through the view.
  }, [initialCode, lockStart]);

  // Every run starts from a clean slate, even when the last one dimmed nothing (`skipped` stays
  // null then): only edits made after this point make the coming run's lines stale.
  useEffect(() => {
    if (running) view.current?.dispatch({ effects: setSkipped.of(null) });
  }, [running]);

  // Shown once the run has played back; cleared by the next run or the first edit.
  useEffect(() => {
    view.current?.dispatch({ effects: setSkipped.of(skipped) });
  }, [skipped]);

  useEffect(() => {
    if (!flash) return;
    host.current?.classList.remove("is-blocked");
    void host.current?.offsetWidth;
    host.current?.classList.add("is-blocked");
  }, [flash]);

  useImperativeHandle(ref, () => ({
    focusLine(line: number) {
      const v = view.current;
      if (!v) return;
      const n = Math.min(Math.max(1, line), v.state.doc.lines);
      const l = v.state.doc.line(n);
      v.dispatch({ selection: { anchor: l.from, head: l.to }, scrollIntoView: true });
      v.focus();
    },
    reset(code: string, start: number) {
      const v = view.current;
      if (!v) return false;
      // A new state also clears the undo history, so Ctrl+Z cannot try to undo the reset
      // into the locked block.
      v.setState(createState(code, start));
      setBlockedMsg("");
      callbacks.current.onChange(code, getLockedLineNumbers(v.state));
      return true;
    },
    focus() {
      view.current?.focus();
    },
  }));

  return (
    <div className="editor-shell">
      <div ref={host} className="editor-host" />
      <p className="sr-only" aria-live="assertive">
        {blockedMsg}
      </p>
    </div>
  );
});

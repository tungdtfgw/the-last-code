import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, bracketMatching, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Cue } from "../audio/sound-recipes";
import { getLockedLineNumbers, lockedEditBlocked, lockedLines } from "./locked-lines-extension";

export interface CodeEditorHandle {
  focusLine(line: number): void;
  /** Returns false when the editor is not mounted yet. */
  reset(code: string, lockStart: number): boolean;
  focus(): void;
}

interface Props {
  initialCode: string;
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

/** CodeMirror 6 editor with the locked chip-data block. */
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  { initialCode, lockStart, lockedTexts, onChange, onRun, onCue },
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
              requestAnimationFrame(() => setBlockedMsg("Dòng dữ liệu chip bị khóa."));
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

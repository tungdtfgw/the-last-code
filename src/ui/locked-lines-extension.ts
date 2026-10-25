import {
  Annotation,
  EditorState,
  RangeSetBuilder,
  StateEffect,
  StateField,
  type Extension,
  type Text,
  type Transaction,
  type TransactionSpec,
} from "@codemirror/state";
import { Decoration, EditorView, GutterMarker, gutter, type DecorationSet } from "@codemirror/view";

/** Transactions carrying this annotation may rewrite the locked block (reset / programmatic load). */
export const allowLockedEdit = Annotation.define<boolean>();
/** Moves the locked block to a new first line (1-based); used together with allowLockedEdit. */
export const setLockedStart = StateEffect.define<number>();
/** Emitted in place of a rejected edit so the UI can flash, beep and announce. */
export const lockedEditBlocked = StateEffect.define<null>();

interface LockedBlock {
  /** Document offset of the first locked line's start. */
  from: number;
  /** Expected text of each locked line, in order. */
  texts: readonly string[];
}

function blockRange(doc: Text, block: LockedBlock) {
  const first = doc.lineAt(block.from);
  const last = doc.line(first.number + block.texts.length - 1);
  return { first, last };
}

export const lockedBlockField = StateField.define<LockedBlock | null>({
  create: () => null,
  update(block, tr) {
    for (const e of tr.effects) {
      if (e.is(setLockedStart) && block) return { ...block, from: tr.state.doc.line(e.value).from };
    }
    if (!block || !tr.docChanged) return block;
    return { ...block, from: tr.changes.mapPos(block.from, 1) };
  },
});

/**
 * Does any change in `tr` touch the locked block? The protected span covers the
 * newline before the block, the block itself and the newline after it, so joining
 * lines (Backspace at the start of the next line, Delete at the end of the previous
 * one) is rejected too. Inserting a line above the block (Enter at the end of the
 * previous line) and typing at the start of the next line stay allowed.
 */
export function touchesLockedBlock(tr: Transaction): boolean {
  const block = tr.startState.field(lockedBlockField, false);
  if (!block) return false;
  const doc = tr.startState.doc;
  const { first, last } = blockRange(doc, block);
  const protStart = first.from - 1; // the newline before (or -1 at document start)
  const protEnd = last.number < doc.lines ? last.to + 1 : doc.length + 1; // after the trailing newline
  let touched = false;
  tr.changes.iterChangedRanges((fromA, toA) => {
    if (touched) return;
    if (fromA === toA) touched = fromA > protStart && fromA < protEnd;
    else touched = fromA < protEnd && toA > protStart;
  });
  return touched;
}

const lockFilter = EditorState.transactionFilter.of((tr): TransactionSpec | readonly TransactionSpec[] => {
  if (!tr.docChanged || tr.annotation(allowLockedEdit)) return tr;
  if (!touchesLockedBlock(tr)) return tr;
  return { effects: lockedEditBlocked.of(null) };
});

/** 1-based line numbers of the locked block in this state. */
export function getLockedLineNumbers(state: EditorState): number[] {
  const block = state.field(lockedBlockField, false);
  if (!block) return [];
  const start = state.doc.lineAt(block.from).number;
  return block.texts.map((_t, i) => start + i);
}

/** Find the locked block in `code` (first match of the lines as one consecutive run). Returns its 1-based start line. */
export function findLockedBlock(code: string, texts: readonly string[]): number | null {
  if (!texts.length) return null;
  const lines = code.replace(/\r\n?/g, "\n").split("\n");
  outer: for (let i = 0; i + texts.length <= lines.length; i++) {
    for (let j = 0; j < texts.length; j++) if (lines[i + j] !== texts[j]) continue outer;
    return i + 1;
  }
  return null;
}

class LockMarker extends GutterMarker {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-lock-marker";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML =
      '<svg viewBox="0 0 12 12" width="11" height="11"><rect x="2" y="5.5" width="8" height="5.5" rx="1" fill="currentColor"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
    return span;
  }
}
const lockMarker = new LockMarker();

const lockedLineDeco = Decoration.line({
  class: "cm-locked-line",
  attributes: { title: "Dòng dữ liệu chip bị khóa", "aria-readonly": "true" },
});

const decorations = EditorView.decorations.compute([lockedBlockField, "doc"], (state): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  for (const n of getLockedLineNumbers(state)) {
    const line = state.doc.line(n);
    builder.add(line.from, line.from, lockedLineDeco);
  }
  return builder.finish();
});

const lockGutter = gutter({
  class: "cm-lock-gutter",
  lineMarker(view, line) {
    const nums = getLockedLineNumbers(view.state);
    const n = view.state.doc.lineAt(line.from).number;
    return nums.includes(n) ? lockMarker : null;
  },
  lineMarkerChange: (update) => update.docChanged || update.startState.field(lockedBlockField) !== update.state.field(lockedBlockField),
});

/**
 * Lock a consecutive block of lines. `startLine` is 1-based; `texts` are the exact
 * line contents that must stay untouched.
 */
export function lockedLines(doc: Text, startLine: number, texts: readonly string[], withUi = true): Extension {
  const init = lockedBlockField.init(() => ({ from: doc.line(startLine).from, texts }));
  return withUi ? [init, lockFilter, decorations, lockGutter] : [init, lockFilter];
}

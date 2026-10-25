import {
  Annotation,
  EditorState,
  RangeSetBuilder,
  StateEffect,
  StateField,
  type Extension,
  Transaction,
  type Text,
  type TransactionSpec,
} from "@codemirror/state";
import { Decoration, EditorView, GutterMarker, gutter, type DecorationSet } from "@codemirror/view";

/** Transactions carrying this annotation may rewrite the locked block (reset / programmatic load). */
export const allowLockedEdit = Annotation.define<boolean>();
/** Moves the locked block to a new first line (1-based); used together with allowLockedEdit. */
export const setLockedStart = StateEffect.define<number>();
/** Emitted in place of a rejected edit so the UI can flash, beep and announce. */
export const lockedEditBlocked = StateEffect.define<null>();
/** Emitted when an edit spanning the block was applied around it, the block kept as is. */
export const lockedEditKept = StateEffect.define<null>();

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

/**
 * Rewrite a typed, pasted or deleted change that spans the locked block so it applies
 * around the block: the parts of the replaced range before and after the block are
 * replaced, the block and the newlines next to it stay. Inserted text goes where the
 * range had room; when it contains the block itself (a whole pasted program), the part
 * before the block's copy goes before the block and the rest after it. Returns null when
 * nothing outside the block would change (typing inside a locked line, joining lines).
 */
function editAroundBlock(tr: Transaction): TransactionSpec | null {
  const block = tr.startState.field(lockedBlockField, false);
  if (!block) return null;
  const doc = tr.startState.doc;
  const { first, last } = blockRange(doc, block);
  const before = first.from - 1; // the newline before the block, or -1 at document start
  const after = last.to + 1; // first character after the newline that ends the block
  const blockText = block.texts.join("\n");
  const changes: { from: number; to: number; insert: string }[] = [];
  let ok = true;
  let cursor = 0;
  tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    if (!ok) return;
    const text = inserted.toString();
    const touches = fromA === toA ? fromA > before && fromA < after : fromA < after && toA > before;
    if (!touches) {
      changes.push({ from: fromA, to: toA, insert: text });
      cursor = toA;
      return;
    }
    // Room before the block: [fromA, before) on the lines above; after it: [after, toA) below.
    const pre = before >= 0 && fromA <= before ? { from: fromA, to: before } : null;
    const post = last.to < doc.length && toA >= after ? { from: after, to: toA } : null;
    const at = text.indexOf(blockText);
    let head = at >= 0 ? text.slice(0, at).replace(/\n$/, "") : text;
    let tail = at >= 0 ? text.slice(at + blockText.length).replace(/^\n/, "") : "";
    if (!pre && head) [head, tail] = ["", tail ? `${head}\n${tail}` : head];
    if (!post && tail) [head, tail] = [head ? `${head}\n${tail}` : tail, ""];
    if ((!pre && head) || (!post && tail)) return void (ok = false);
    const parts = [pre && { ...pre, insert: head }, post && { ...post, insert: tail }].filter(
      (c): c is { from: number; to: number; insert: string } => !!c && (c.from < c.to || c.insert !== ""),
    );
    if (!parts.length) return void (ok = false);
    changes.push(...parts);
    cursor = parts[parts.length - 1].to;
  });
  if (!ok || !changes.some((c) => c.from < c.to || c.insert)) return null;
  const set = tr.startState.changes(changes);
  return {
    changes: set,
    selection: { anchor: set.mapPos(cursor, 1) },
    scrollIntoView: true,
    userEvent: tr.annotation(Transaction.userEvent),
    effects: lockedEditKept.of(null),
  };
}

const lockFilter = EditorState.transactionFilter.of((tr): TransactionSpec | readonly TransactionSpec[] => {
  if (!tr.docChanged || tr.annotation(allowLockedEdit)) return tr;
  if (!touchesLockedBlock(tr)) return tr;
  // Typing, pasting and deleting over the block keep their effect elsewhere. Undo, redo
  // and drag-and-drop are rejected whole: rewriting them would duplicate or lose text.
  if (tr.isUserEvent("input") || tr.isUserEvent("delete")) {
    const around = editAroundBlock(tr);
    if (around) return around;
  }
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
  attributes: { title: "Dòng dữ liệu nạp sẵn bị khóa", "aria-readonly": "true" },
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

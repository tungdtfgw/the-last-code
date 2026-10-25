// @vitest-environment jsdom
import { history, redo, undo } from "@codemirror/commands";
import { EditorSelection, EditorState, type TransactionSpec } from "@codemirror/state";
import { describe, expect, test } from "vitest";
import levelJson from "../levels/level-1-4.json";
import {
  allowLockedEdit,
  findLockedBlock,
  getLockedLineNumbers,
  lockedEditBlocked,
  lockedLines,
  setLockedStart,
} from "./locked-lines-extension";

const starter = levelJson.starter_code;
const texts = starter.split("\n").slice(1, 4);

function make(doc = starter, start = 2) {
  const base = EditorState.create({ doc });
  return EditorState.create({ doc, extensions: [history(), lockedLines(base.doc, start, texts, false)] });
}

/** Apply a spec; report whether it was blocked. */
function apply(state: EditorState, spec: TransactionSpec) {
  const tr = state.update(spec);
  const blocked = tr.effects.some((e) => e.is(lockedEditBlocked));
  return { state: tr.state, blocked };
}

const lockedText = (s: EditorState) => getLockedLineNumbers(s).map((n) => s.doc.line(n).text);
const pos = (s: EditorState, line: number, col = 0) => s.doc.line(line).from + col;

describe("locked lines (AC 5)", () => {
  test("typing inside line 3 is blocked", () => {
    const s = make();
    const r = apply(s, { changes: { from: pos(s, 3, 4), insert: "x" } });
    expect(r.blocked).toBe(true);
    expect(r.state.doc.toString()).toBe(starter);
  });

  test("typing at the start of a locked line and at its end is blocked", () => {
    const s = make();
    expect(apply(s, { changes: { from: pos(s, 2), insert: "x" } }).blocked).toBe(true);
    expect(apply(s, { changes: { from: s.doc.line(4).to, insert: "x" } }).blocked).toBe(true);
  });

  test("Backspace at the start of line 5 (join into line 4) is blocked", () => {
    const s = make();
    const p = pos(s, 5);
    expect(apply(s, { changes: { from: p - 1, to: p } }).blocked).toBe(true);
  });

  test("Delete at the end of line 1 (pull line 2 up) is blocked", () => {
    const s = make();
    const end = s.doc.line(1).to;
    expect(apply(s, { changes: { from: end, to: end + 1 } }).blocked).toBe(true);
  });

  test("select all + delete, cut across the block, paste over it are blocked", () => {
    const s = make();
    expect(apply(s, { changes: { from: 0, to: s.doc.length } }).blocked).toBe(true);
    expect(apply(s, { changes: { from: pos(s, 1, 3), to: pos(s, 6, 2), insert: "pasted" } }).blocked).toBe(true);
    expect(apply(s, { changes: { from: pos(s, 3), to: s.doc.line(3).to, insert: 'chieu_cao = "9"' } }).blocked).toBe(true);
  });

  test("editing line 7 and typing at the start of line 5 are allowed", () => {
    const s = make();
    let r = apply(s, { changes: { from: s.doc.line(7).from, to: s.doc.line(7).to, insert: "ma_xac_thuc = 1" } });
    expect(r.blocked).toBe(false);
    expect(r.state.doc.line(7).text).toBe("ma_xac_thuc = 1");
    r = apply(s, { changes: { from: pos(s, 5), insert: "x = 1" } });
    expect(r.blocked).toBe(false);
    expect(lockedText(r.state)).toEqual(texts);
  });

  test("Enter at the end of line 1 inserts a line above; the block shifts to 3–5", () => {
    const s = make();
    const r = apply(s, { changes: { from: s.doc.line(1).to, insert: "\n# ghi chú" }, selection: EditorSelection.cursor(s.doc.line(1).to + 1) });
    expect(r.blocked).toBe(false);
    expect(getLockedLineNumbers(r.state)).toEqual([3, 4, 5]);
    expect(lockedText(r.state)).toEqual(texts);
    // Edits are judged against the new position.
    expect(apply(r.state, { changes: { from: pos(r.state, 4, 2), insert: "z" } }).blocked).toBe(true);
    expect(apply(r.state, { changes: { from: pos(r.state, 2, 0), insert: "z" } }).blocked).toBe(false);
  });

  test("undo/redo never change the locked lines", () => {
    let s = make();
    s = apply(s, { changes: { from: s.doc.line(1).to, insert: "\n# a" } }).state;
    s = apply(s, { changes: { from: s.doc.line(3).from, insert: "BAD" } }).state; // blocked, not in history
    let current = s;
    const dispatch = (tr: { state: EditorState }) => (current = tr.state);
    undo({ state: current, dispatch });
    expect(current.doc.toString()).toBe(starter);
    expect(getLockedLineNumbers(current)).toEqual([2, 3, 4]);
    undo({ state: current, dispatch });
    expect(current.doc.toString()).toBe(starter);
    redo({ state: current, dispatch });
    expect(getLockedLineNumbers(current)).toEqual([3, 4, 5]);
    expect(lockedText(current)).toEqual(texts);
  });

  test("reset with allowLockedEdit replaces everything", () => {
    let s = make();
    s = apply(s, { changes: { from: s.doc.line(1).to, insert: "\n# a" } }).state;
    const r = apply(s, {
      changes: { from: 0, to: s.doc.length, insert: starter },
      annotations: allowLockedEdit.of(true),
      effects: setLockedStart.of(2),
    });
    expect(r.blocked).toBe(false);
    expect(r.state.doc.toString()).toBe(starter);
    expect(getLockedLineNumbers(r.state)).toEqual([2, 3, 4]);
  });

  test("block at the very start of the document is protected too", () => {
    const doc = texts.join("\n") + "\nx = 1";
    const s = make(doc, 1);
    expect(apply(s, { changes: { from: 0, insert: "y" } }).blocked).toBe(true);
    expect(apply(s, { changes: { from: s.doc.line(4).from, insert: "y" } }).blocked).toBe(false);
  });
});

describe("findLockedBlock (draft restore)", () => {
  test("finds the block as a consecutive run", () => {
    expect(findLockedBlock(starter, texts)).toBe(2);
    expect(findLockedBlock("# x\n\n" + starter, texts)).toBe(4);
    expect(findLockedBlock(starter.replace(/\n/g, "\r\n"), texts)).toBe(2);
  });
  test("returns null when the block is broken or missing", () => {
    expect(findLockedBlock(starter.replace('chieu_cao = "1.72"', 'chieu_cao = "2"'), texts)).toBeNull();
    expect(findLockedBlock("", texts)).toBeNull();
    expect(findLockedBlock(texts[0] + "\n\n" + texts.slice(1).join("\n"), texts)).toBeNull();
  });
  test("an otherwise empty draft keeping the block is valid", () => {
    expect(findLockedBlock(texts.join("\n"), texts)).toBe(1);
  });
});

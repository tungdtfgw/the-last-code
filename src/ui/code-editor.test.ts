import { EditorState } from "@codemirror/state";
import { expect, test } from "vitest";
import { setSkipped, skippedField } from "./code-editor";

const DOC = "a = 1\nif a > 5:\n    b = 2\nprint(a)\n";
const dimmed = (s: EditorState) => {
  const lines: number[] = [];
  s.field(skippedField).deco.between(0, s.doc.length, (from) => void lines.push(s.doc.lineAt(from).number));
  return lines;
};
const lines = (run: object) => ({ lines: [3], roundWord: "tình huống", round: 2, run });
const start = () => EditorState.create({ doc: DOC, extensions: [skippedField] });

test("a run's lines dim once, clear on the first edit and never come back for that run", () => {
  const run = {};
  let s = start().update({ effects: setSkipped.of(lines(run)) }).state;
  expect(dimmed(s)).toEqual([3]);
  s = s.update({ changes: { from: 0, insert: "# x\n" } }).state;
  expect(dimmed(s)).toEqual([]);
  // An aborted run: back to ready with the same outcome.
  s = s.update({ effects: setSkipped.of(null) }).state;
  s = s.update({ effects: setSkipped.of(lines(run)) }).state;
  expect(dimmed(s)).toEqual([]);
  expect(dimmed(s.update({ effects: setSkipped.of(lines({})) }).state)).toEqual([3]);
});

test("lines of a run edited while it played back are dropped: they no longer match the code", () => {
  let s = start().update({ effects: setSkipped.of(null) }).state; // the run starts
  s = s.update({ changes: { from: 0, insert: "\n" } }).state; // typed during the playback
  expect(dimmed(s.update({ effects: setSkipped.of(lines({})) }).state)).toEqual([]);
});

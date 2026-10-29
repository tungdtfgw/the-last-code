// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import { afterEach, expect, test } from "vitest";
import { CodeEditor, type SkippedLines } from "./code-editor";

afterEach(cleanup);

const DOC = "# locked\nx = 1\nif x > 5:\n    y = 2\nprint(x)\n";
const editor = (skipped: SkippedLines | null, running: boolean) => (
  <CodeEditor initialCode={DOC} skipped={skipped} running={running} lockStart={1} lockedTexts={["# locked"]} onChange={() => {}} onRun={() => {}} onCue={() => {}} />
);
const result = (): SkippedLines => ({ lines: [4], roundWord: "tình huống", round: 1, run: {} });
const dimmed = (c: HTMLElement) => c.querySelectorAll(".cm-skipped-line").length;

test("an edit before a run whose predecessor dimmed nothing still lets the run's lines dim", () => {
  const r = render(editor(null, false));
  const view = EditorView.findFromDOM(r.container.querySelector(".cm-editor") as HTMLElement)!;
  // e.g. the starter code's IndentationError fixed: no lines were dimmed, the player edits.
  act(() => view.dispatch({ changes: { from: view.state.doc.length, insert: "\n" } }));
  act(() => r.rerender(editor(null, true)));
  act(() => r.rerender(editor(result(), false)));
  expect(dimmed(r.container)).toBe(1);
});

test("an edit during the run still drops that run's lines", () => {
  const r = render(editor(null, true));
  const view = EditorView.findFromDOM(r.container.querySelector(".cm-editor") as HTMLElement)!;
  act(() => view.dispatch({ changes: { from: view.state.doc.length, insert: "\n" } }));
  act(() => r.rerender(editor(result(), false)));
  expect(dimmed(r.container)).toBe(0);
});

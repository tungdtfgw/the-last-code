import { describe, expect, test } from "vitest";
import { extractText, LEVEL_TEXT } from "../../content/text-fields";
import { realLevelJson } from "../../../tests/content-fixture";
import { editorReducer, fieldInstances, initEditor, placeErrors, setAt, type BaseInfo } from "./editor-reducer";

const level14 = realLevelJson("1.4");

const base = (): BaseInfo => ({
  revision: 7,
  text: JSON.parse(JSON.stringify(extractText(level14, LEVEL_TEXT))),
  updatedAt: "2026-10-27T15:41:00.000Z",
  updatedBy: "tungdt",
});

test("editing marks a path dirty; editing it back clears it", () => {
  const s0 = initEditor(base());
  const s1 = editorReducer(s0, { type: "edit", path: "briefing", value: "Mới" });
  expect(s1.dirtyPaths).toEqual(["briefing"]);
  const s2 = editorReducer(s1, { type: "edit", path: "briefing", value: level14.briefing });
  expect(s2.dirtyPaths).toEqual([]);
});

test("removing an optional field and a map key", () => {
  const s = editorReducer(editorReducer(initEditor(base()), { type: "edit", path: "location", value: undefined }), {
    type: "edit",
    path: "reactions.two_stars",
    value: undefined,
  });
  expect("location" in s.draft).toBe(false);
  expect(Object.keys(s.draft.reactions as object)).not.toContain("two_stars");
  expect(s.dirtyPaths.sort()).toEqual(["location", "reactions.two_stars"]);
});

test("an error on an element goes to the first input under it; unknown paths go on top", () => {
  const inputs = fieldInstances(LEVEL_TEXT, level14).map((f) => f.path);
  expect(inputs).toContain("objectives[1].label");
  const { byPath, unplaced } = placeErrors(
    [
      { path: "objectives[1]", message: "objectives[1] thiếu label" },
      { path: "reactions.made_up", message: "khóa lạ" },
      { path: "tests[0]", message: "tests[0] sai" },
    ],
    [...inputs, "reactions"],
  );
  expect(byPath.get("objectives[1].label")?.[0].message).toBe("objectives[1] thiếu label");
  expect(byPath.get("reactions")?.[0].message).toBe("khóa lạ");
  expect(unplaced.map((e) => e.path)).toEqual(["tests[0]"]);
});

test("form inputs follow the puzzle's arrays and carry their anchors as context", () => {
  const objectives = fieldInstances(LEVEL_TEXT, level14).filter((f) => f.field.path === "objectives[].label");
  expect(objectives.map((f) => f.context)).toEqual(level14.objectives.map((o: { var?: string }) => o.var));
  // A level without knowledge_summary or outro_beats has no input for them.
  const bare = { ...level14, knowledge_summary: undefined, outro_beats: undefined };
  expect(fieldInstances(LEVEL_TEXT, bare).some((f) => f.path.startsWith("knowledge_summary"))).toBe(false);
});

describe("saving", () => {
  test("a conflict keeps the draft; loading the latest replaces base and draft", () => {
    const edited = editorReducer(initEditor(base()), { type: "edit", path: "briefing", value: "Của tôi" });
    const stale = editorReducer(editorReducer(edited, { type: "saving" }), {
      type: "stale",
      stale: { revision: 8, updatedAt: "2026-10-27T15:43:00.000Z", updatedBy: "khac" },
    });
    expect(stale.status).toBe("stale");
    expect(stale.draft.briefing).toBe("Của tôi");
    const theirs = { ...base(), revision: 8, text: setAt(base().text, "briefing", "Của họ") };
    const latest = editorReducer(stale, { type: "loadLatest", base: theirs });
    expect(latest).toMatchObject({ status: "idle", stale: null, dirtyPaths: [], base: { revision: 8 } });
    expect(latest.draft.briefing).toBe("Của họ");
  });

  test("a saved draft becomes the base", () => {
    const edited = editorReducer(initEditor(base()), { type: "edit", path: "hints[0]", value: "Gợi ý mới" });
    const saved = editorReducer(edited, { type: "saved", revision: 8, updatedAt: "t", updatedBy: "tungdt", text: edited.draft });
    expect(saved).toMatchObject({ status: "saved", dirtyPaths: [], base: { revision: 8 } });
    expect((saved.base.text.hints as string[])[0]).toBe("Gợi ý mới");
  });

  test("an edit typed while the save was out stays unsaved", () => {
    const sent = editorReducer(initEditor(base()), { type: "edit", path: "outro", value: "Đã gửi" });
    const typedMeanwhile = editorReducer(editorReducer(sent, { type: "saving" }), { type: "edit", path: "briefing", value: "Gõ thêm" });
    const saved = editorReducer(typedMeanwhile, { type: "saved", revision: 8, updatedAt: "t", updatedBy: "tungdt", text: sent.draft });
    expect(saved.base.text.outro).toBe("Đã gửi");
    expect(saved.base.text.briefing).toBe(level14.briefing);
    expect(saved.dirtyPaths).toEqual(["briefing"]);
  });

  test("loading an old revision keeps the current base revision", () => {
    const old = setAt(base().text, "outro", "Đoạn kết cũ");
    const s = editorReducer(initEditor(base()), { type: "loadRevision", revision: 3, text: old });
    expect(s.base.revision).toBe(7);
    expect(s.draft.outro).toBe("Đoạn kết cũ");
    expect(s.dirtyPaths).toEqual(["outro"]);
  });
});

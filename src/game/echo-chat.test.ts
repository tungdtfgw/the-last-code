import { describe, expect, test } from "vitest";
import { bubbleVisible, chatUiReducer, createStepsSeen, initialChatUi, isUnread, type ChatUiAction, type ChatUiState } from "./echo-chat";

const reduce = (...actions: ChatUiAction[]): ChatUiState => actions.reduce(chatUiReducer, initialChatUi);

describe("ECHO chat open/unread/bubble", () => {
  test("nothing before ECHO wakes", () => {
    expect(isUnread(initialChatUi, null)).toBe(false);
    expect(bubbleVisible(initialChatUi, null)).toBe(false);
  });

  test("a new line while closed shows the bubble and the unread dot; opening reads it", () => {
    let s = reduce({ type: "message", id: 1 });
    expect(bubbleVisible(s, 1)).toBe(true);
    expect(isUnread(s, 1)).toBe(true);
    s = chatUiReducer(s, { type: "open", lastId: 1 });
    expect(bubbleVisible(s, 1)).toBe(false);
    expect(isUnread(s, 1)).toBe(false);
    s = chatUiReducer(s, { type: "close" });
    expect(isUnread(s, 1)).toBe(false);
    expect(bubbleVisible(s, 1)).toBe(false);
  });

  test("a line said while the chat is open is read at once and gets no bubble", () => {
    const s = reduce({ type: "message", id: 1 }, { type: "open", lastId: 1 }, { type: "message", id: 2 }, { type: "close" });
    expect(isUnread(s, 2)).toBe(false);
    expect(bubbleVisible(s, 2)).toBe(false);
  });

  test("closing the bubble keeps the dot; the next run's line brings a new bubble", () => {
    let s = reduce({ type: "message", id: 1 }, { type: "dismiss" });
    expect(bubbleVisible(s, 1)).toBe(false);
    expect(isUnread(s, 1)).toBe(true);
    s = chatUiReducer(s, { type: "message", id: 2 });
    expect(bubbleVisible(s, 2)).toBe(true);
    expect(isUnread(s, 2)).toBe(true);
  });

  test("the bubble only previews the newest line", () => {
    const s = reduce({ type: "message", id: 1 });
    expect(bubbleVisible(s, 2)).toBe(false);
  });
});

describe("Việc cần làm pointer", () => {
  test("shows until the chat is opened once for that level; other levels and levels without steps are separate", () => {
    const seen = createStepsSeen();
    expect(seen.pending("1.1", true)).toBe(true);
    expect(seen.pending("1.2", false)).toBe(false);
    seen.markOpened("1.1");
    expect(seen.pending("1.1", true)).toBe(false);
    expect(seen.pending("1.3", true)).toBe(true);
  });
});

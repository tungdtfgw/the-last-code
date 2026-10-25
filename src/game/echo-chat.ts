/**
 * Open/unread/bubble state of the ECHO chat. Pure, so the rules are testable without a DOM.
 * Messages are identified by their id; "unread" means the newest message is not the one the
 * player last saw with the chat open.
 */
export interface ChatUiState {
  open: boolean;
  /** Id of the newest message the player has seen in the open chat (null: none yet). */
  seen: number | null;
  /** Id of the message shown in the preview bubble (null: no bubble). */
  bubble: number | null;
}

export type ChatUiAction =
  /** ECHO said a new line (or woke up with its entry line). */
  | { type: "message"; id: number }
  | { type: "open"; lastId: number }
  | { type: "close" }
  /** The player closed the bubble without opening the chat; the unread dot stays. */
  | { type: "dismiss" };

export const initialChatUi: ChatUiState = { open: false, seen: null, bubble: null };

export function chatUiReducer(state: ChatUiState, action: ChatUiAction): ChatUiState {
  switch (action.type) {
    case "message":
      // With the chat open the line lands in front of the player: seen, no bubble.
      return state.open ? { ...state, seen: action.id, bubble: null } : { ...state, bubble: action.id };
    case "open":
      return { open: true, seen: action.lastId, bubble: null };
    case "close":
      return state.open ? { ...state, open: false } : state;
    case "dismiss":
      return state.bubble === null ? state : { ...state, bubble: null };
  }
}

/** Unread dot: something newer than what was last seen, and the chat is closed. */
export const isUnread = (s: ChatUiState, lastId: number | null) => !s.open && lastId !== null && s.seen !== lastId;

/** The bubble previews only the newest line; a newer line replaces it. */
export const bubbleVisible = (s: ChatUiState, lastId: number | null) => !s.open && lastId !== null && s.bubble === lastId;

/**
 * "Việc cần làm" lives in the chat, so until the player opens the chat once for a level the
 * bubble and the button point to it. Per level, for this page session only (not persisted).
 */
export function createStepsSeen() {
  const opened = new Set<string>();
  return {
    pending: (levelId: string, hasSteps: boolean) => hasSteps && !opened.has(levelId),
    markOpened: (levelId: string) => void opened.add(levelId),
  };
}

export const stepsSeen = createStepsSeen();

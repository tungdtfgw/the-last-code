/** True when a key press is text entry (editor, inputs), so single-letter shortcuts must not fire. */
export const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || el.closest(".cm-editor") !== null || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

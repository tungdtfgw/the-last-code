import { echoLineLeaks } from "../game/echo-line-check.js";
import { validateLevel } from "../game/validate-level.js";
import { validateChapter } from "../story/validate-chapter.js";
import { applyText, CHAPTER_TEXT, checkTextShape, errorPath, LEVEL_TEXT, normalizeText, type TextError, type TextSpec } from "./text-fields.js";

export type TextValidation =
  /** `text`: the normalised text to store; `doc`: the puzzle with that text applied. */
  | { ok: true; text: Record<string, unknown>; doc: unknown }
  | { ok: false; errors: TextError[] };

export const DRIFT = "câu chữ không khớp cấu trúc câu đố (thiếu phần tử, thừa phần tử hoặc lệch neo)";

const fromMessages = (messages: string[]): TextError[] => messages.map((m) => ({ path: errorPath(m) ?? "", message: m }));

function validateText(puzzle: unknown, raw: unknown, spec: TextSpec, check: (doc: unknown) => TextError[]): TextValidation {
  const shape = checkTextShape(raw, spec);
  if (shape.length) return { ok: false, errors: shape };
  const text = normalizeText(raw as Record<string, unknown>);
  const { doc, drift } = applyText(puzzle, text, spec);
  // The puzzle holds no text, so an element that does not line up would play without its text.
  if (drift.length) return { ok: false, errors: drift.map((path) => ({ path, message: `${path}: ${DRIFT}` })) };
  const errors = check(doc);
  return errors.length ? { ok: false, errors } : { ok: true, text, doc };
}

/**
 * The one check for a level's text, shared by the game, the server, the
 * migration script and the admin form: shape, then every element lined up with
 * the puzzle, then the level validator on the puzzle with the text applied,
 * then the ECHO leak check on reactions and ECHO beats.
 */
export function validateLevelText(puzzle: unknown, text: unknown): TextValidation {
  return validateText(puzzle, text, LEVEL_TEXT, (doc) => {
    const result = validateLevel(doc);
    if (!result.ok) return fromMessages(result.errors);
    return echoLineLeaks(result.level);
  });
}

export function validateChapterText(puzzle: unknown, text: unknown): TextValidation {
  return validateText(puzzle, text, CHAPTER_TEXT, (doc) => {
    const result = validateChapter(doc);
    return result.ok ? [] : fromMessages(result.errors);
  });
}

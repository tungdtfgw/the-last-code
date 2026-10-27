import { CUES } from "../audio/cue-names.js";
import { BACKDROPS, BEAT_FX, BEAT_KINDS } from "./story-types.js";

const KEYS = new Set(["kind", "text", "cue", "backdrop", "fx", "hold_ms"]);
const MAX_BEATS = 30;
const MAX_TEXT = 400;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const oneOf = (list: readonly string[], v: unknown) => typeof v === "string" && list.includes(v);

/**
 * Checks an array of authored beats and pushes one error per problem, naming the
 * position (`outro_beats[2].text …`). `leakCheck` runs on every ECHO line.
 */
export function validateBeats(
  raw: unknown,
  field: string,
  errors: string[],
  leakCheck?: (text: string) => string | null,
): void {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_BEATS) {
    errors.push(`${field} phải là mảng 1–${MAX_BEATS} nhịp`);
    return;
  }
  raw.forEach((b, i) => {
    const at = `${field}[${i}]`;
    if (!isObject(b)) {
      errors.push(`${at} phải là object`);
      return;
    }
    for (const k of Object.keys(b)) if (!KEYS.has(k)) errors.push(`${at}: khóa lạ "${k}"`);
    if (!oneOf(BEAT_KINDS, b.kind)) errors.push(`${at}.kind "${String(b.kind)}" không hợp lệ (${BEAT_KINDS.join("|")})`);
    if (typeof b.text !== "string" || b.text.trim() === "" || b.text.length > MAX_TEXT)
      errors.push(`${at}.text phải là chuỗi không rỗng ≤ ${MAX_TEXT} ký tự`);
    if (b.cue !== undefined && !oneOf(CUES, b.cue)) errors.push(`${at}.cue "${String(b.cue)}" không có trong danh sách cue`);
    if (b.backdrop !== undefined && !oneOf(BACKDROPS, b.backdrop))
      errors.push(`${at}.backdrop "${String(b.backdrop)}" không hợp lệ (${BACKDROPS.join("|")})`);
    if (b.fx !== undefined && !oneOf(BEAT_FX, b.fx)) errors.push(`${at}.fx "${String(b.fx)}" không hợp lệ`);
    if (b.hold_ms !== undefined && !(Number.isInteger(b.hold_ms) && (b.hold_ms as number) >= 0 && (b.hold_ms as number) <= 5000))
      errors.push(`${at}.hold_ms phải là số nguyên 0–5000`);
    if (b.kind === "echo" && typeof b.text === "string" && leakCheck) {
      const leak = leakCheck(b.text);
      if (leak) errors.push(`${at}.text: lời ECHO chứa "${leak}"`);
    }
  });
}

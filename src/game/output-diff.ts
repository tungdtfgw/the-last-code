import type { OutputVerdict } from "./classify-run";

/** A line split around its first wrong character, already made visible. */
export interface DiffSegments {
  before: string;
  mark: string;
  after: string;
}

export interface LineDiff {
  need: DiffSegments;
  got: DiffSegments;
  col: number;
  /** `U+0410` when the wrong character the player sent is not printable ASCII. */
  codePoint: string | null;
}

const MISSING = "▯";

/** Spaces and tabs made visible: `·` and `→`. */
export const visible = (s: string) => s.replace(/ /g, "·").replace(/\t/g, "→");

function split(chars: string[], col: number, clipped = false): DiffSegments {
  const i = col - 1;
  return {
    before: visible(chars.slice(0, i).join("")),
    // Past the end: the character is missing, unless the preview was cut before it.
    mark: i < chars.length ? visible(chars[i]) : clipped ? "…" : MISSING,
    after: visible(chars.slice(i + 1).join("")),
  };
}

/** `cần:` / `nhận:` pair for a wrong line (code points, like Python's `col`). */
export function describeLine(v: Pick<OutputVerdict, "expected" | "actual" | "col">): LineDiff {
  const need = Array.from(v.expected);
  const got = Array.from(v.actual ?? "");
  const col = v.col ?? 1;
  // The harness clips previews (`…`); a difference past the clip is not a missing character.
  const clipped = got.at(-1) === "…" && col > got.length;
  const wrong = clipped ? undefined : got[col - 1];
  const code = wrong?.codePointAt(0);
  const printable = code !== undefined && ((code >= 0x20 && code <= 0x7e) || code === 0x09);
  return {
    need: split(need, col),
    got: split(clipped ? got.slice(0, -1) : got, col, clipped),
    col,
    codePoint: code === undefined || printable ? null : `U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
  };
}

export const joinSegments = (s: DiffSegments) => s.before + s.mark + s.after;

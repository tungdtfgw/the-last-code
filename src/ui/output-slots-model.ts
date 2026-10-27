import type { OutputReport, OutputVerdict } from "../game/classify-run";
import { describeLine, type LineDiff } from "../game/output-diff";

/** What became of one expected output line (or an extra one) in a list of `cần:`/`nhận:` rows. */
export type SlotState = "idle" | "sent" | "dropped" | "missing" | "unsent" | "error" | "extra";

/** One row of an output list: an expected line (or an extra one) and what became of it. */
export interface OutputSlot {
  line: number;
  expected: string;
  state: SlotState;
  diff?: LineDiff;
  label?: string;
}

/** Rows before anything was sent. */
export const idleSlots = (expected: string[]): OutputSlot[] => expected.map((e, i) => ({ line: i + 1, expected: e, state: "idle" }));

/** A line that went out: sent when it matched, dropped (with its diff) otherwise. */
export function emittedSlot(slot: OutputSlot, l: OutputVerdict): OutputSlot {
  const ok = l.status === "ok";
  const diff = ok ? undefined : describeLine(l);
  return { ...slot, expected: l.expected, state: ok ? "sent" : "dropped", diff, label: ok ? "ĐÃ PHÁT" : `BỎ GÓI · vị trí ${diff!.col}` };
}

/** Extra line `k` (0-based) beyond the expected ones; the last shown one counts those not shown. */
export function extraSlot(output: OutputReport, k: number): OutputSlot {
  const more = k === output.extraLines.length - 1 ? output.extraCount - output.extraLines.length : 0;
  return { line: output.lines.length + k + 1, expected: output.extraLines[k], state: "extra", label: more > 0 ? `DÒNG THỪA · +${more}` : "DÒNG THỪA" };
}

/**
 * Lines that never went out. `failed`: the program stopped, so the first missing line is
 * where it broke (labelled with the error) and the rest were never sent; otherwise they are missing.
 */
export function fillUnsent(slots: OutputSlot[], output: OutputReport, failed: { label: string } | null): OutputSlot[] {
  const out = slots.map((s) => ({ ...s }));
  let broke = false;
  output.lines.forEach((l, i) => {
    if (l.status !== "missing") return;
    if (failed && !broke) {
      out[i] = { ...out[i], expected: l.expected, state: "error", label: failed.label };
      broke = true;
    } else {
      out[i] = { ...out[i], expected: l.expected, state: failed ? "unsent" : "missing", label: failed ? "CHƯA PHÁT" : "KHÔNG CÓ DÒNG" };
    }
  });
  return out;
}

/** The final rows for an output report, without the frame-by-frame order. */
export function settledSlots(output: OutputReport, failed: { label: string } | null): { slots: OutputSlot[]; extra: OutputSlot[] } {
  const emitted = output.lines.map((l) => (l.status === "missing" ? { line: l.line, expected: l.expected, state: "idle" as const } : emittedSlot({ line: l.line, expected: l.expected, state: "idle" }, l)));
  return { slots: fillUnsent(emitted, output, failed), extra: output.extraLines.map((_, k) => extraSlot(output, k)) };
}

/** First row that did not go out cleanly: a wrong, missing or broken line, else the first extra one. */
export const firstProblem = (slots: OutputSlot[], extra: OutputSlot[]) =>
  slots.find((s) => s.state !== "sent" && s.state !== "idle") ?? extra[0];

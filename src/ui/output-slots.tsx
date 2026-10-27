import { visible, type DiffSegments } from "../game/output-diff";
import type { OutputSlot } from "./output-slots-model";

/** A diff side with its first wrong character marked. */
export function Segments({ s }: { s: DiffSegments }) {
  return (
    <>
      {s.before}
      <mark>{s.mark}</mark>
      {s.after}
    </>
  );
}

/** One row: line number, expected text, state; a dropped line adds its `cần:`/`nhận:` pair. */
export function SlotRow({ slot }: { slot: OutputSlot }) {
  return (
    <li className={`relay-slot is-${slot.state}`}>
      <span className="relay-slot-line">{slot.state === "extra" ? "+" : `dòng ${slot.line}`}</span>
      <span className="relay-slot-text">{visible(slot.expected)}</span>
      <span className="relay-slot-state">{slot.label ?? "CHỜ"}</span>
      {slot.state === "dropped" && slot.diff && (
        <span className="relay-diff">
          <span>
            cần:{"  "}
            <Segments s={slot.diff.need} />
          </span>
          <span>
            nhận: <Segments s={slot.diff.got} />
            {slot.diff.codePoint && ` · ${slot.diff.codePoint}`}
          </span>
        </span>
      )}
    </li>
  );
}

/** The list of output rows (expected lines, then extra ones). `wave` keeps keys apart between base and counter-attack. */
export function OutputSlots({ slots, extra, wave, label }: { slots: OutputSlot[]; extra: OutputSlot[]; wave: string; label: string }) {
  return (
    <ol className="relay-list" aria-label={label}>
      {[...slots, ...extra].map((s) => (
        <SlotRow key={`${wave}-${s.state === "extra" ? "x" : ""}${s.line}`} slot={s} />
      ))}
    </ol>
  );
}

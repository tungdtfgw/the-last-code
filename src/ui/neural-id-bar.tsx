/** The fake Neural-ID being assembled: one cell per component, filled cells by 0-based slot. */
export function NeuralIdBar({
  slots,
  filled,
  flashSlot,
  names,
}: {
  slots: number;
  filled: readonly number[];
  flashSlot?: number;
  /** Optional component names by slot, shown under each cell (the map). */
  names?: Record<number, string>;
}) {
  const count = new Set(filled.filter((s) => s >= 0 && s < slots)).size;
  return (
    <div className={`id-bar${names ? " has-names" : ""}`} role="img" aria-label={`Neural-ID giả: ${count}/${slots} thành phần`}>
      {Array.from({ length: slots }, (_, i) => (
        <span
          key={i}
          className={`id-cell${filled.includes(i) ? " is-filled" : ""}${flashSlot === i ? " is-flash" : ""}`}
          style={{ ["--i" as string]: i }}
        >
          <span className="id-cell-n">{i + 1}</span>
          {names && <span className="id-cell-name">{names[i] ?? "—"}</span>}
        </span>
      ))}
    </div>
  );
}

const CHAPTER_1_BAR = { label: "Neural-ID giả", unit: "Thành phần" };

/** A chapter's component bar being assembled (chapter 1: the fake Neural-ID): one cell per component, filled cells by 0-based slot. */
export function NeuralIdBar({
  slots,
  filled,
  flashSlot,
  names,
  bar = CHAPTER_1_BAR,
}: {
  slots: number;
  /** The bar's name and the name of one cell (`component_bar` of the chapter). */
  bar?: { label: string; unit: string };
  filled: readonly number[];
  flashSlot?: number;
  /** Optional component names by slot, shown under each cell (the map). */
  names?: Record<number, string>;
}) {
  const count = new Set(filled.filter((s) => s >= 0 && s < slots)).size;
  return (
    <div className={`id-bar${names ? " has-names" : ""}`} role="img" aria-label={`${bar.label}: ${count}/${slots} ${bar.unit.toLocaleLowerCase("vi")}`}>
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

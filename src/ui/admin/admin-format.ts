/** `27/10 22:41` in the viewer's time zone. */
export function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "Bản 7 · tungdt · 27/10 22:41", or the line for a document whose text migration is missing. */
export function sourceLine(doc: { revision: number; updatedBy: string | null; updatedAt: string | null }): string {
  return doc.revision > 0 ? `Bản ${doc.revision} · ${doc.updatedBy ?? "?"} · ${formatWhen(doc.updatedAt)}` : "Chưa có câu chữ trong D1";
}

/** Human name of a story id, shared by the map's replay list and the story gate. */
export function storyLabel(id: string): string {
  if (id === "prologue") return "Mở đầu";
  if (id === "teaser") return "Hết chương 1";
  if (id.startsWith("after-")) return `Sau ${id.slice("after-".length)}`;
  return id;
}

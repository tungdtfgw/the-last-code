/** An Architect log line with its `KTS-0x` label highlighted. */
export function LoreText({ text }: { text: string }) {
  const m = text.match(/^(KTS-\d+)([\s\S]*)$/);
  return m ? (
    <>
      <span className="lore-tag">{m[1]}</span>
      {m[2]}
    </>
  ) : (
    <>{text}</>
  );
}

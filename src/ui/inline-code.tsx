/** Plain text where `backtick` spans render as inline code (task steps, knowledge summary). */
export function InlineCode({ text }: { text: string }) {
  const parts = text.split("`");
  // An unmatched backtick stays literal: only odd parts that have a closing tick are code.
  const closed = parts.length % 2 === 1;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 && (closed || i < parts.length - 1) ? (
          <code key={i} className="inline-code">
            {part}
          </code>
        ) : (
          <span key={i}>{i % 2 === 1 ? `\`${part}` : part}</span>
        ),
      )}
    </>
  );
}

export function StarIcon({ filled, size = 28 }: { filled: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`star${filled ? " is-filled" : ""}`}>
      <path
        d="M12 2.5l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.8 3.4 1.5-6.5-5-4.4 6.6-.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRow({ count, size }: { count: number; size?: number }) {
  return (
    <span className="star-row" role="img" aria-label={`${count} trên 3 sao`}>
      {[1, 2, 3].map((n) => (
        <StarIcon key={n} filled={n <= count} size={size} />
      ))}
    </span>
  );
}

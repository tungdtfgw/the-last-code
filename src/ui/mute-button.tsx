/** Sound toggle (shortcut M, handled by the app). Same label in every screen so tests and players find it. */
export function MuteButton({ muted, onToggle, className = "" }: { muted: boolean; onToggle(): void; className?: string }) {
  return (
    <button type="button" className={`btn btn-icon ${className}`.trim()} aria-pressed={muted} onClick={onToggle} title="Phím tắt: M" aria-keyshortcuts="M">
      <svg viewBox="0 0 20 20" aria-hidden="true" width="18" height="18">
        <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
        {muted ? (
          <path d="M13 7.5l4.5 5M17.5 7.5l-4.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        )}
      </svg>
      <span>{muted ? "BẬT TIẾNG" : "TẮT TIẾNG"}</span>
    </button>
  );
}

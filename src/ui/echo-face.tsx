/** Wireframe face. Drawn three times (base + two offset colour channels) for the glitch. */
export function EchoFace() {
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d="M60 14 L88 26 L96 56 L88 88 L72 104 L48 104 L32 88 L24 56 L32 26 Z" strokeWidth="1.6" />
      <path d="M60 14 L60 104 M32 26 L48 50 L60 44 L72 50 L88 26 M24 56 L48 50 M96 56 L72 50 M32 88 L50 78 L60 82 L70 78 L88 88 M48 104 L50 78 M72 104 L70 78 M48 50 L50 78 M72 50 L70 78" strokeWidth="0.7" opacity="0.45" />
      <path className="echo-eye" d="M40 56 L54 54 M66 54 L80 56" strokeWidth="2.6" />
      <path className="echo-mouth" d="M50 90 L60 92 L70 90" strokeWidth="1.8" />
    </g>
  );
}

/** The noisy ECHO portrait: glitches while speaking, greyed out while asleep. Decorative. */
export function EchoPortrait({ speaking = false, asleep = false }: { speaking?: boolean; asleep?: boolean }) {
  return (
    <span className={`echo-portrait${speaking ? " is-speaking" : ""}${asleep ? " is-asleep" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="echo-face">
        <g className="echo-ch echo-ch-r" stroke="var(--omni)"><EchoFace /></g>
        <g className="echo-ch echo-ch-b" stroke="var(--type-int)"><EchoFace /></g>
        <g className="echo-ch echo-ch-main" stroke="var(--signal)"><EchoFace /></g>
      </svg>
      <span className="echo-scan" />
    </span>
  );
}

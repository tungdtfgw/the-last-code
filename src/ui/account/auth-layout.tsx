import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { CityMatrix } from "../city-matrix";

/**
 * Frame shared by every account screen: the city backdrop, a small game title,
 * one panel, and a polite live region for answers from the server. Silent: no
 * audio here, the AudioContext starts with the game.
 */
export function AuthLayout(props: { title: string; lead?: ReactNode; notice?: Notice | null; children: ReactNode }) {
  return (
    <main className="screen auth-screen">
      <CityMatrix />
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="auth-brand">MÃ CUỐI CÙNG</p>
        <h1 id="auth-title" className="auth-title">
          {props.title}
        </h1>
        {props.lead && <div className="auth-lead">{props.lead}</div>}
        <div className="auth-notice-slot" aria-live="polite">
          {props.notice && (
            <p className={`auth-notice is-${props.notice.tone}`} role={props.notice.tone === "error" ? "alert" : undefined}>
              {props.notice.text}
            </p>
          )}
        </div>
        {props.children}
      </section>
    </main>
  );
}

export interface Notice {
  tone: "error" | "ok" | "info";
  text: string;
}

export function Field(props: {
  label: string;
  value: string;
  onChange(v: string): void;
  type?: "text" | "email" | "password";
  autoComplete: string;
  hint?: string;
  error?: string | null;
  autoFocus?: boolean;
}) {
  const id = useId();
  // The hint states the rule; once the rule is broken the error says it instead.
  const hint = props.error ? null : props.hint;
  const describedBy = hint ? `${id}-hint` : props.error ? `${id}-err` : undefined;
  return (
    <div className="auth-field">
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={props.autoFocus}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && (
        <p id={`${id}-hint`} className="auth-hint">
          {hint}
        </p>
      )}
      {props.error && (
        <p id={`${id}-err`} className="auth-error">
          {props.error}
        </p>
      )}
    </div>
  );
}

/** A form whose submit button locks and reads "ĐANG GỬI…" while `busy`. Enter in any field submits. */
export function AuthForm(props: { onSubmit(): void; busy: boolean; submitLabel: string; children: ReactNode }) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!props.busy) props.onSubmit();
  };
  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {props.children}
      <button type="submit" className="btn btn-run auth-submit" disabled={props.busy}>
        {props.busy ? "ĐANG GỬI…" : props.submitLabel}
      </button>
    </form>
  );
}

export function AuthLinks({ children }: { children: ReactNode }) {
  return <nav className="auth-links">{children}</nav>;
}

/** Seconds left before a resend is allowed; `start(n)` begins a new wait. */
export function useCountdown(): [number, (seconds: number) => void] {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return [left, setLeft];
}

/** Takes a one-time token out of the address bar so it does not stay in the browser history. */
export function hideToken(kind: "activate" | "reset") {
  if (window.location.hash !== `#/${kind}`) window.history.replaceState(null, "", `#/${kind}`);
}

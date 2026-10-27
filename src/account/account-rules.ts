/** Account field rules, shared by the forms and the server (the server decides). */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL = 254;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;

export const normalizeUsername = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
export const normalizeEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

export const isUsername = (u: string) => USERNAME_RE.test(u);
export const isEmail = (e: string) => e.length <= MAX_EMAIL && EMAIL_RE.test(e);
export const isPassword = (p: unknown): p is string =>
  typeof p === "string" && p.length >= MIN_PASSWORD && p.length <= MAX_PASSWORD;

/** `t***@gmail.com`: enough for the player to recognise their address, not enough to read it. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

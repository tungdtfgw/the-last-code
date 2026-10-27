const encoder = new TextEncoder();

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

/** Workers ship `crypto.subtle.timingSafeEqual`; Node (tests) does not, so fall back to a constant-time loop. */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual?: (a: ArrayBufferView, b: ArrayBufferView) => boolean };
  if (typeof subtle.timingSafeEqual === "function") return subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * True when `header` is exactly `Bearer <secret>`. Both sides are hashed first,
 * so the comparison always sees two 32-byte buffers and never throws on a
 * length mismatch.
 */
export async function checkAuth(header: string | null, secret: string | undefined): Promise<boolean> {
  if (!header || !secret) return false;
  const m = /^Bearer (.+)$/.exec(header);
  if (!m) return false;
  return equalBytes(await sha256(m[1]), await sha256(secret));
}

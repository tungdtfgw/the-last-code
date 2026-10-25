export const normalizeNewlines = (code: string) => code.replace(/\r\n?/g, "\n");

/**
 * Replace the locked input lines with empty lines. Inputs are injected into the
 * namespace instead, so line numbers still match the editor and locked lines are
 * never counted as statements.
 */
export function prepareSource(code: string, lockedLineNumbers: readonly number[]): string {
  const lines = normalizeNewlines(code).split("\n");
  for (const n of lockedLineNumbers) {
    if (n >= 1 && n <= lines.length) lines[n - 1] = "";
  }
  return lines.join("\n");
}

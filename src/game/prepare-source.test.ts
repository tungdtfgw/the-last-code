import { expect, test } from "vitest";
import { normalizeNewlines, prepareSource } from "./prepare-source";

test("locked lines become empty and line count is preserved", () => {
  const src = "# a\ntuoi = \"27\"\nb = 1\nc = 2\nx = tuoi";
  const out = prepareSource(src, [2, 3]);
  expect(out.split("\n")).toEqual(["# a", "", "", "c = 2", "x = tuoi"]);
});

test("CRLF and lone CR are normalised; unicode kept", () => {
  expect(normalizeNewlines("a\r\nb\rc")).toBe("a\nb\nc");
  expect(prepareSource("# tiếng Việt\r\ny = \"đ\"\r\n", [])).toBe("# tiếng Việt\ny = \"đ\"\n");
});

test("out of range locked lines are ignored", () => {
  expect(prepareSource("a\nb", [0, 5])).toBe("a\nb");
});

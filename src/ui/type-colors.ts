/**
 * Data-type colour language (GDD 5.2): str yellow, int blue, float purple, bool red, anything else grey.
 * `shape`: a shape itself (`type`, the 1.3 objective), pale white so it reads apart from the four.
 */
export type TypeTone = "str" | "int" | "float" | "bool" | "shape" | "other";

export const toneOf = (typeName: string | null | undefined): TypeTone =>
  typeName === "str" || typeName === "int" || typeName === "float" || typeName === "bool"
    ? typeName
    : typeName === "type"
      ? "shape"
      : "other";

/** CSS custom property holding the colour for a type tone (defined in tokens.css). */
export const toneVar = (tone: TypeTone) => `var(--type-${tone})`;

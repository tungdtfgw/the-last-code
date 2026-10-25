/** Data-type colour language (GDD 5.2): str yellow, int blue, float purple, bool red, anything else grey. */
export type TypeTone = "str" | "int" | "float" | "bool" | "other";

export const toneOf = (typeName: string | null | undefined): TypeTone =>
  typeName === "str" || typeName === "int" || typeName === "float" || typeName === "bool" ? typeName : "other";

/** CSS custom property holding the colour for a type tone (defined in tokens.css). */
export const toneVar = (tone: TypeTone) => `var(--type-${tone})`;

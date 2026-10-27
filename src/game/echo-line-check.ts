import type { TextError } from "../content/text-fields.js";
import { findEchoLeak, levelLeaks } from "./echo-leaks.js";
import type { LevelDefinition } from "./level-types.js";

/** Fill `{name}` placeholders from `details`; unknown or missing data becomes "?". */
export function renderTemplate(template: string, details: object): string {
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const value = (details as Record<string, unknown>)[name];
    return value === undefined || value === null || value === "" ? "?" : String(value);
  });
}

/** Typical run details, so a template is checked the way the player would read it. */
const SAMPLE = { line: 7, vars: "ma_xac_thuc, chi_so", error_type: "ValueError", count: 12, out_line: 2, col: 6, round: 2 };

/**
 * Free ECHO lines (reactions, their variants, ECHO beats of `outro_beats`) that
 * use a forbidden term or say an answer. Hints are exempt.
 */
export function echoLineLeaks(level: LevelDefinition): TextError[] {
  const leaks = levelLeaks(level);
  const errors: TextError[] = [];
  const check = (path: string, text: string) => {
    const leak = findEchoLeak(text, leaks);
    if (leak) errors.push({ path, message: `${path}: lời ECHO chứa "${leak}"` });
  };
  for (const [key, template] of Object.entries(level.reactions)) if (template !== undefined) check(`reactions.${key}`, renderTemplate(template, SAMPLE));
  for (const [key, template] of Object.entries(level.reaction_variants ?? {}))
    if (template !== undefined) check(`reaction_variants.${key}`, renderTemplate(template, SAMPLE));
  (level.outro_beats ?? []).forEach((beat, i) => {
    if (beat.kind === "echo") check(`outro_beats[${i}].text`, beat.text);
  });
  return errors;
}

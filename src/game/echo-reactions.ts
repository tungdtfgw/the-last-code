import type { OutcomeDetails, RunOutcome } from "./classify-run";
import type { LevelDefinition, ReactionKey } from "./level-types";

export interface EchoLine {
  primary: string;
  followUp?: string;
}

/** Fill {line} {vars} {error_type} {count}; unknown or missing data becomes "?". */
export function renderTemplate(template: string, details: OutcomeDetails): string {
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const value = (details as Record<string, unknown>)[name];
    return value === undefined || value === null || value === "" ? "?" : String(value);
  });
}

export const reactionText = (level: LevelDefinition, key: ReactionKey) =>
  level.reactions[key] ?? level.reactions.generic;

/** Said in front of a line that would otherwise repeat word for word, when the level has no variant for it. */
export const REPEAT_PREFIX = "Vẫn vậy. ";

/**
 * Text for the `count`-th run in a row with the same key, so ECHO never says the same
 * line twice in a row: even runs use the level's `reaction_variants` line, or the main
 * line with REPEAT_PREFIX. Odd runs from the third on differ from the run before anyway.
 */
function repeatSafeText(level: LevelDefinition, key: ReactionKey, count: number): string {
  const text = reactionText(level, key);
  if (count % 2 === 1) return text;
  const variant = level.reactions[key] !== undefined ? level.reaction_variants?.[key] : undefined;
  return variant ?? REPEAT_PREFIX + text;
}

/** How many runs in a row (ending with the current one) produced the same failing key. */
export function consecutiveFailures(key: ReactionKey, history: readonly ReactionKey[]): number {
  let count = 1;
  for (let i = history.length - 1; i >= 0 && history[i] === key; i--) count++;
  return count;
}

/**
 * Pick ECHO's line for a run. `history` holds the keys of earlier runs in this
 * session (oldest first, current run excluded). From the third identical failure
 * in a row ECHO adds a follow-up pointing at the hint log. The same key on the run
 * right before never gets the same line twice (see repeatSafeText).
 */
export function selectReaction(outcome: RunOutcome, level: LevelDefinition, history: readonly ReactionKey[]): EchoLine {
  const count = consecutiveFailures(outcome.key, history);
  const primary = renderTemplate(repeatSafeText(level, outcome.key, count), outcome.details);
  if (outcome.stars === 0) {
    if (count >= 3) {
      return { primary, followUp: renderTemplate(reactionText(level, "repeated_fail"), { count }) };
    }
  }
  return { primary };
}

export const selectEntry = (level: LevelDefinition) => renderTemplate(reactionText(level, "entry"), {});

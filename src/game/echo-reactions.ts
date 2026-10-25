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

/** How many runs in a row (ending with the current one) produced the same failing key. */
export function consecutiveFailures(key: ReactionKey, history: readonly ReactionKey[]): number {
  let count = 1;
  for (let i = history.length - 1; i >= 0 && history[i] === key; i--) count++;
  return count;
}

/**
 * Pick ECHO's line for a run. `history` holds the keys of earlier runs in this
 * session (oldest first, current run excluded). From the third identical failure
 * in a row ECHO adds a follow-up pointing at the hint log.
 */
export function selectReaction(outcome: RunOutcome, level: LevelDefinition, history: readonly ReactionKey[]): EchoLine {
  const primary = renderTemplate(reactionText(level, outcome.key), outcome.details);
  if (outcome.stars === 0) {
    const count = consecutiveFailures(outcome.key, history);
    if (count >= 3) {
      return { primary, followUp: renderTemplate(reactionText(level, "repeated_fail"), { count }) };
    }
  }
  return { primary };
}

export const selectEntry = (level: LevelDefinition) => renderTemplate(reactionText(level, "entry"), {});

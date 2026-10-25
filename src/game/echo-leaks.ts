import type { LevelDefinition } from "./level-types";

/** Free ECHO lines never name a conversion function, in any level. */
export const COMMON_TERMS = ["int", "float", "round"];

/** What a free ECHO line must not contain: words (common + the level's own) and answers. */
export interface LeakSet {
  terms: string[];
  answers: string[];
}

const COMMON: LeakSet = { terms: COMMON_TERMS, answers: [] };

const WORD = /[\p{L}\p{N}_]/u;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whole-word, case-insensitive match on Unicode letter boundaries (JS `\b` only knows
 * ASCII, so it misreads Vietnamese). A term made only of punctuation (`"`) matches as a
 * substring. `answer`: a digit followed by `.` may not precede it either, so the answer
 * 44 is not found inside 3.44 (a sentence period still is a boundary).
 */
function contains(text: string, term: string, answer = false): boolean {
  const t = term.normalize("NFC");
  if (t === "") return false;
  if (!WORD.test(t)) return text.includes(t);
  const before = WORD.test(t[0]) ? `(?<![\\p{L}\\p{N}_]${answer ? "|\\d\\." : ""})` : "";
  const after = WORD.test(t.at(-1)!) ? "(?![\\p{L}\\p{N}_])" : "";
  return new RegExp(before + escape(t) + after, "iu").test(text);
}

/**
 * Leak set of a level: the common terms plus its `forbidden_terms` (added, never
 * replacing), and every expected value and expected output line of its tests.
 */
export function levelLeaks(
  level: Pick<LevelDefinition, "tests" | "counter_attack_tests" | "forbidden_terms">,
): LeakSet {
  const answers = new Set<string>();
  for (const t of [...level.tests, ...level.counter_attack_tests]) {
    for (const v of Object.values(t.expected)) {
      answers.add(String(v));
      if (typeof v === "boolean") answers.add(v ? "True" : "False");
    }
    for (const line of t.expected_output ?? []) answers.add(line);
  }
  return {
    terms: [...new Set([...COMMON_TERMS, ...(level.forbidden_terms ?? [])])],
    answers: [...answers],
  };
}

/** Returns what leaks (a forbidden term or an answer), or null when the line is clean. */
export function findEchoLeak(text: string, leaks: LeakSet = COMMON): string | null {
  const t = text.normalize("NFC");
  return leaks.terms.find((term) => contains(t, term)) ?? leaks.answers.find((a) => contains(t, a, true)) ?? null;
}

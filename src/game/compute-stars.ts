import { isCaught, isStealth } from "./alert";

export type Stars = 0 | 1 | 2 | 3;

export interface StarInputs {
  basePassed: boolean;
  statementCount: number;
  limit: number;
  hasCounter: boolean;
  counterSurvived: boolean;
}

/**
 * The only place stars are decided. Stars are cumulative:
 * 1 = correct type and value; 2 = 1 + within the stealth limit; 3 = 2 + survived
 * the counter-attack. Above 100% alert the Sentinel catches the run: 0 stars.
 */
export function computeStars(i: StarInputs): Stars {
  if (!i.basePassed) return 0;
  if (isCaught(i.statementCount, i.limit)) return 0;
  if (!isStealth(i.statementCount, i.limit)) return 1;
  if (!i.hasCounter) return 2;
  return i.counterSurvived ? 3 : 2;
}

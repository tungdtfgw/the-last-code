/**
 * Whether the mission briefing is folded. It folds by itself once, after the player's first
 * finished run of a level (the briefing has been read by then). After that, or after the player
 * toggles it, only the player folds or opens it. Remembered per level for the page's lifetime.
 */
export interface BriefingFold {
  collapsed: boolean;
  /** The automatic fold has been used up (it happened, or the player took over). */
  settled: boolean;
}

export type BriefingFoldEvent = "run_done" | "toggle";

export const OPEN_FOLD: BriefingFold = { collapsed: false, settled: false };

export function foldBriefing(fold: BriefingFold, event: BriefingFoldEvent): BriefingFold {
  if (event === "toggle") return { collapsed: !fold.collapsed, settled: true };
  return fold.settled ? fold : { collapsed: true, settled: true };
}

const session = new Map<string, BriefingFold>();

export function sessionFold(levelId: string): BriefingFold {
  return session.get(levelId) ?? OPEN_FOLD;
}

export function rememberFold(levelId: string, fold: BriefingFold): void {
  session.set(levelId, fold);
}

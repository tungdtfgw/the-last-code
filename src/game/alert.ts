/** The level's statement limit is 40% of the alert bar; 100% = limit / 0.4. */
export const STEALTH_RATIO = 0.4;

// Integer arithmetic (ratio 0.4 = 2/5) keeps the bar, the percentage and the catch rule in agreement.

/** Largest statement count that is still ≤ 100% alert. */
export const fullAlertStatements = (limit: number) => Math.floor((limit * 5) / 2);

export const alertPercent = (count: number, limit: number) => Math.round((count * 40) / limit);

export const isStealth = (count: number, limit: number) => count <= limit;

/** Above 100% the Sentinel locks on: the run is caught. */
export const isCaught = (count: number, limit: number) => count * 2 > limit * 5;

export const formatAlertPercent = (percent: number) => (percent > 100 ? "100%+" : `${percent}%`);

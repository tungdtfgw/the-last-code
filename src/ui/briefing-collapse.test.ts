import { describe, expect, it } from "vitest";
import { foldBriefing, OPEN_FOLD } from "./briefing-collapse";

describe("foldBriefing", () => {
  it("folds by itself after the first finished run only", () => {
    const first = foldBriefing(OPEN_FOLD, "run_done");
    expect(first.collapsed).toBe(true);
    const reopened = foldBriefing(first, "toggle");
    expect(reopened.collapsed).toBe(false);
    expect(foldBriefing(reopened, "run_done").collapsed).toBe(false);
  });

  it("never folds by itself once the player has toggled it before any run", () => {
    const folded = foldBriefing(OPEN_FOLD, "toggle");
    const opened = foldBriefing(folded, "toggle");
    expect(foldBriefing(opened, "run_done").collapsed).toBe(false);
    expect(foldBriefing(folded, "run_done").collapsed).toBe(true);
  });
});

import { describe, expect, test } from "vitest";
import { runHarness } from "../../tests/integration/run-harness";
import { realLevel } from "../../tests/content-fixture";
import { classifyRun } from "../game/classify-run";
import { errorStatus } from "./scanner-timeline";
import { settledSlots } from "./output-slots-model";
import { buildRelayTimeline } from "./relay-timeline";

// The settled rows (for scenes that show the list without playing it line by line) must
// match the rows the relay ends its base wave with.
const level = realLevel("1.1");
const starter = level.starter_code.split("\n");
const edit = (changes: Record<number, string>) => starter.map((l, i) => changes[i + 1] ?? l).join("\n");

describe("settledSlots", () => {
  test.each([
    ["an error mid-way", level.starter_code],
    ["a wrong line and an extra one", edit({ 7: 'print("PHIEN", ma_phien)', 8: 'print("lo17")\nprint("x")' })],
  ])("%s: same rows as the relay's last base frame", (_name, text) => {
    const o = classifyRun({ kind: "ok", data: runHarness(level, text) }, level);
    const stopped = !!o.error || !!o.stopStatus;
    const label = o.error ? `${o.error.type} · dòng ${o.error.line ?? "?"}` : errorStatus(o);
    const end = buildRelayTimeline(o, level).at(-1)!.scene;
    expect(settledSlots(o.output!, stopped ? { label } : null)).toEqual({ slots: end.slots, extra: end.extra });
  });
});

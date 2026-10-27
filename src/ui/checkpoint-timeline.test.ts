import { describe, expect, test } from "vitest";
import { realLevel } from "../../tests/content-fixture";
import { runHarness } from "../../tests/integration/run-harness";
import { classifyRun } from "../game/classify-run";
import { buildCheckpointTimeline, summarizeCheckpoint } from "./checkpoint-timeline";

const level = realLevel("1.7");
const starter = level.starter_code.split("\n");
const edit = (changes: Record<number, string>) => starter.map((l, i) => changes[i + 1] ?? l).join("\n");
const timeline = (text: string) => buildCheckpointTimeline(classifyRun({ kind: "ok", data: runHarness(level, text) }, level), level);
const states = (slots: { state: string }[]) => slots.map((s) => s.state);

const TWO_STAR = {
  8: "ma_hoi = int(input())",
  9: "muc = int(input())",
  12: 'print(f"HO SO: {ho_ten} / {ma_khu}")',
  13: 'print("KHUON:", type(ma_phien))',
  14: 'print(f"SINH TRAC: {round(float(chieu_cao) * 2, 2)}")',
  15: 'print(f"NANG LUONG: {muc // 100} PIN + {muc % 100}")',
};
const THREE_STAR = { ...TWO_STAR, 9: "muc = int(float(input()))" };

describe("checkpoint timeline (GDD 1.7 §5)", () => {
  test("starter code: round 1 breaks on the error line, rounds 2 and 3 never reached", () => {
    const t = timeline(level.starter_code);
    const end = t.at(-1)!.scene;
    expect(end.rings).toEqual(["rejected", "notReached", "notReached"]);
    expect(states(end.slots)).toEqual(["sent", "dropped", "sent", "dropped", "error", "unsent"]);
    expect(end.slots[4].label).toBe("TypeError · dòng 15");
    expect(end.idBar).toEqual(["lit", "red", "lit", "red", "red", "idle"]);
    expect(end).toMatchObject({ label: "BÁC Ở VÒNG 1", gate: "closed", status: "TRUY VẾT: dòng 15" });
    expect(t.flatMap((f) => f.cues)).toEqual(["scan_pass", "scan_reject", "scan_pass", "scan_reject", "alarm"]);
    expect(t.some((f) => f.scene.round === 2)).toBe(false);
  });

  test("rejected in round 2: round 1 locks, round 3 shows as not reached", () => {
    const t = timeline(edit({ ...THREE_STAR, 13: "print(\"KHUON:\", \"<class 'int'>\")" }));
    const end = t.at(-1)!.scene;
    expect(end.rings).toEqual(["locked", "rejected", "notReached"]);
    expect(end).toMatchObject({ round: 2, label: "BÁC Ở VÒNG 2", rejectedLine: 3 });
    expect(end.chip).toContain('ma_phien = "7351"');
    expect(end.stdinChip).toBe('kênh nhập: "9035", "1500"');
    expect(t.flatMap((f) => f.cues).filter((c) => c === "objective_lock")).toHaveLength(1);
    expect(summarizeCheckpoint(t)).toBe("Vòng 1 đạt. Vòng 2 bác ở dòng 3. Cổng đóng.");
  });

  test("syntax error: no ring lights up", () => {
    const t = timeline(edit({ 11: 'print("NID/2089"' }));
    expect(t.every((f) => f.scene.rings.every((r) => r === "idle"))).toBe(true);
    expect(t.at(-1)!.scene).toMatchObject({ compileError: true, status: "TRÌNH DỊCH TỪ CHỐI" });
    expect(summarizeCheckpoint(t)).toBe("Trình dịch từ chối. Cổng đóng.");
  });

  test("three rounds and the hand check pass: the booth lights up, every cell turns white, the gate opens", () => {
    const t = timeline(edit(THREE_STAR));
    const half = t.find((f) => f.scene.label === "CỔNG MỞ MỘT NỬA")!;
    expect(half.scene.rings).toEqual(["locked", "locked", "locked"]);
    expect(half.cues).toEqual(["gate_open"]);
    const check = t.find((f) => f.scene.wave === "counter")!;
    expect(check.scene).toMatchObject({ booth: "lit", status: "KIỂM TAY", stdinChip: 'kênh nhập: " 4172", "1500.0"' });
    expect(check.scene.chip).toContain("ma_phien = True");
    expect(check.cues).toEqual(["siren"]);
    const end = t.at(-1)!;
    expect(end.scene).toMatchObject({ gate: "open", label: "CỔNG MỞ HOÀN TOÀN" });
    expect(end.scene.idBar).toEqual(Array(6).fill("white"));
    expect(end.cues).toEqual(["gate_open", "star"]);
    expect(summarizeCheckpoint(t)).toBe("Vòng 1 đạt. Vòng 2 đạt. Vòng 3 đạt. Kiểm tay đạt. Cổng mở hoàn toàn.");
  });

  test("hand check breaks on 1500.0: the gate stays half open", () => {
    const t = timeline(edit(TWO_STAR));
    const end = t.at(-1)!;
    expect(end.scene).toMatchObject({ wave: "counter", gate: "half", label: "KIỂM TAY BÁC", status: "CỔNG GIỮ MỘT NỬA · ValueError: dòng 9" });
    expect(states(end.scene.slots)).toEqual(["error", "unsent", "unsent", "unsent", "unsent", "unsent"]);
    expect(end.cues).toEqual(["alarm"]);
  });

  test("the last frame alone tells every round's result (what reduced motion shows)", () => {
    const end = timeline(edit({ ...THREE_STAR, 14: 'print(f"SINH TRAC: {float(chieu_cao) * 2}")' })).at(-1)!.scene;
    expect(end.rings).toEqual(["locked", "locked", "rejected"]);
    expect(end).toMatchObject({ round: 3, label: "BÁC Ở VÒNG 3", rejectedLine: 4 });
    expect(end.slots[3]).toMatchObject({ state: "dropped", expected: "SINH TRAC: 3.31" });
  });
});

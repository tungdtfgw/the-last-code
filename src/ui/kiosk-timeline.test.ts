import { describe, expect, test } from "vitest";
import { runHarness } from "../../tests/integration/run-harness";
import { classifyRun } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import levelJson from "../levels/level-1-2.json";
import { buildKioskTimeline, summarizeKiosk, type KioskFrame } from "./kiosk-timeline";

const level = levelJson as unknown as LevelDefinition;
const starter = level.starter_code.split("\n");
const edit = (changes: Record<number, string>) => starter.map((l, i) => changes[i + 1] ?? l).join("\n");
const body = (text: string) => [...starter.slice(0, 7), text].join("\n");
/** `graded`: the level whose config the harness runs (a non-kiosk copy records no history). */
const outcomeOf = (text: string, graded = level) => classifyRun({ kind: "ok", data: runHarness(graded, text) }, level);
const timeline = (text: string, graded = level) => buildKioskTimeline(outcomeOf(text, graded), level);
const slot = (f: KioskFrame, name: string) => f.scene.slots.find((s) => s.name === name)!;
const frameAt = (t: KioskFrame[], status: string) => t.find((f) => f.scene.status === status)!;

const FIX_NAME = { 13: 'the_quet = ho_ten + " / " + ma_khu' };
const FIX_QUOTE = { ...FIX_NAME, 10: "so_hieu = goi_3" };
const THREE_STAR =
  'ho_ten = goi_1\nma_khu = goi_2\nso_hieu = goi_3\nkhu_cu = ma_khu\nma_khu = goi_4\nthe_quet = ho_ten + " / " + ma_khu\nthe_cong = so_hieu + " / " + ma_khu\n';

describe("kiosk timeline (GDD 1.2 §8)", () => {
  test("plays assignments in run order: devices keep what they read, overwritten values fade or fly to their copy", () => {
    const wrongOrder = timeline(edit(FIX_QUOTE));
    const reassigned = frameAt(wrongOrder, "dòng 17 · ma_khu");
    expect(slot(reassigned, "ma_khu")).toMatchObject({ value: "'K-07'", lit: true, wire: "goi_4" });
    expect(slot(reassigned, "the_cong")).toMatchObject({ value: "'AN-5521 / K-12'", wire: null });
    expect(reassigned.scene.ghosts).toEqual([expect.objectContaining({ value: "'K-12'", from: "ma_khu", to: null })]);
    expect(slot(frameAt(wrongOrder, "dòng 18 · khu_cu"), "khu_cu").wire).toBe("goi_4");

    const rightOrder = timeline(body(THREE_STAR));
    expect(frameAt(rightOrder, "dòng 12 · ma_khu").scene.ghosts).toEqual([expect.objectContaining({ value: "'K-12'", to: "khu_cu" })]);

    // Equal text typed by hand is not read from the buffer: no wire.
    const typed = timeline(body(THREE_STAR.replace("so_hieu = goi_3", 'so_hieu = "AN-5521"')));
    expect(slot(frameAt(typed, "dòng 10 · so_hieu"), "so_hieu")).toMatchObject({ value: "'AN-5521'", wire: null });
  });

  test("a runtime error stops on the cell being written; a syntax error writes nothing", () => {
    const t = timeline(level.starter_code);
    const end = t.at(-1)!;
    expect(end.scene.status).toBe("TRUY VẾT: dòng 13");
    expect(end.cues).toEqual(["alarm"]);
    expect(end.scene.slots.filter((s) => s.value !== null).map((s) => s.name)).toEqual(["ho_ten", "ma_khu", "so_hieu"]);
    expect(end.scene.slots.filter((s) => s.noise).map((s) => s.name)).toEqual(["the_quet"]);
    expect(t.some((f) => f.scene.slots.some((s) => s.verdict))).toBe(false);

    const syntax = timeline(edit({ 8: "1khu = goi_1" }));
    expect(syntax.every((f) => f.scene.slots.every((s) => s.value === null))).toBe(true);
    expect(syntax.at(-1)!.scene.status).toBe("TRUY VẾT: dòng 8");
  });

  test("without history the cells get their final values; a cut history ends on the final values", () => {
    const noHistory = timeline(edit(FIX_QUOTE), { ...level, simulation: undefined });
    const written = noHistory.filter((f) => f.scene.slots.some((s) => s.lit)).map((f) => f.scene.slots.find((s) => s.lit)!.name);
    expect(written).toEqual(["ho_ten", "ma_khu", "so_hieu", "khu_cu", "the_quet", "the_cong"]);
    expect(slot(noHistory.at(-1)!, "ma_khu")).toMatchObject({ value: "'K-07'", wire: null, verdict: "ok" });

    const cut = timeline(body('ma_khu = goi_2\nwhile True:\n    ma_khu = ma_khu + "x"'));
    const final = outcomeOf(body('ma_khu = goi_2\nwhile True:\n    ma_khu = ma_khu + "x"')).vars.find((v) => v.name === "ma_khu")!;
    expect(slot(frameAt(cut, "LỊCH SỬ BỊ CẮT"), "ma_khu").value).toBe(final.preview);
    expect(cut.at(-1)!.scene.status).toBe("TIẾN TRÌNH BỊ CẮT");
  });

  test("counter-attack: a typed-in value shows LỆCH MẪU and the gate falls back to half; the copied buffer opens it", () => {
    const decoy = timeline(body(THREE_STAR.replace("so_hieu = goi_3", 'so_hieu = "AN-5521"')));
    const end = decoy.at(-1)!;
    expect(end.scene.buffer.find((b) => b.name === "goi_1")?.value).toBe('"LÊ VĂN TỊNH"');
    expect(slot(end, "so_hieu").verdict).toBe("mismatch");
    expect(slot(end, "ho_ten").verdict).toBe("ok");
    expect(end.scene).toMatchObject({ gate: "half", status: "CỔNG SẬP VỀ NỬA · LỆCH MẪU" });
    expect(end.cues).toEqual(["alarm"]);

    const open = timeline(body(THREE_STAR));
    expect(open.at(-1)!.scene).toMatchObject({ gate: "open", ghosts: [] });
    expect(open.at(-1)!.cues).toContain("star");
    expect(slot(open.at(-1)!, "so_hieu").wire).toBe("goi_3");
    expect(summarizeKiosk(open)).toBe("Ki-ốt: 6/6 ô hợp lệ. Cổng khu mở hoàn toàn.");
  });
});

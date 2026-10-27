import { describe, expect, test } from "vitest";
import { runHarness } from "../../tests/integration/run-harness";
import { realLevel } from "../../tests/content-fixture";
import { classifyRun } from "../game/classify-run";
import { MAX_CELLS, buildFenceTimeline, summarizeFence } from "./fence-timeline";

// GDD 1.5 §5 and §12, from real harness runs.

const level = realLevel("1.5");
const STARTER = level.starter_code.split("\n");
const withLines = (changes: Record<number, string>) => STARTER.map((l, i) => changes[i + 1] ?? l).join("\n");
const timeline = (text: string) => buildFenceTimeline(classifyRun({ kind: "ok", data: runHarness(level, text) }, level), level);

const ENERGY = "nang_luong = so_doan * dien_ap ** 2 - du_tru";
const SPLIT = { 11: "so_pin = nang_luong // dung_luong", 12: "phan_le = nang_luong % dung_luong" };

describe("fence timeline", () => {
  test("starter code: the needle runs below zero, the cell is cut, the rack refuses it", () => {
    const t = timeline(level.starter_code);
    const end = t.at(-1)!;
    expect(end.scene.meter).toMatchObject({ value: -106, need: 828, state: "negative", label: "NĂNG LƯỢNG ÂM" });
    expect(end.scene.cells).toEqual([{ tone: "float", state: "cut" }]);
    expect(end.scene.partial).toMatchObject({ tone: "float", state: "cut", fill: 0 });
    expect(end.scene).toMatchObject({ fence: "lit", signal: "reject", status: "PIN KHÔNG CẮT ĐƯỢC", rackLabel: "PIN KHÔNG CẮT ĐƯỢC", posts: 6, capacity: 100 });
    expect(end.cues).toEqual(["scan_reject"]);
  });

  test("short: the fence stays lit and the meter says how much is missing", () => {
    const end = timeline(withLines({ 8: "nang_luong = so_doan * dien_ap * 2 - du_tru", ...SPLIT })).at(-1)!;
    expect(end.scene.meter).toMatchObject({ value: 108, state: "short", label: "THIẾU 720 ĐƠN VỊ" });
    expect(end.scene).toMatchObject({ fence: "lit", status: "THIẾU 720 ĐƠN VỊ" });
    expect(end.cues).toEqual(["scan_reject"]);
  });

  test("over: the fence discharges; a huge cell count is capped on the rack and written as +n", () => {
    const end = timeline(withLines({ 8: "nang_luong = (so_doan * dien_ap) ** 2 - du_tru", ...SPLIT })).at(-1)!;
    expect(end.scene.meter).toMatchObject({ value: 5148, state: "over", label: "THỪA 4320 ĐƠN VỊ" });
    expect(end.scene).toMatchObject({ fence: "discharge", status: "THỪA 4320 ĐƠN VỊ", moreCells: 51 - MAX_CELLS });
    expect(end.scene.cells).toHaveLength(MAX_CELLS);
  });

  test("a run cut short by the statement budget under the new load: the scene says the process was cut", () => {
    const end = timeline(withLines({ 8: ENERGY, ...SPLIT, 13: "while dung_luong == 110: pass" })).at(-1)!;
    expect(end.scene).toMatchObject({ fence: "half", signal: "alarm", status: "RÀO SÁNG LẠI MỘT NỬA · TIẾN TRÌNH BỊ CẮT" });
  });

  test("a Python error: no energy goes out, the status shows the traceback line", () => {
    const t = timeline(withLines({ 8: ENERGY, 11: "so_pin = nang_luong // 0" }));
    expect(t).toHaveLength(2);
    expect(t[1].scene).toMatchObject({ signal: "alarm", status: "TRUY VẾT: dòng 11", fence: "lit", cells: [] });
    expect(t[1].cues).toEqual(["alarm"]);
    expect(summarizeFence(t)).toBe("TRUY VẾT: dòng 11. Rào vẫn sáng.");
  });

  test("quotient and remainder: half the fence goes dark, then the new load turns it off completely", () => {
    const t = timeline(withLines({ 8: ENERGY, ...SPLIT }));
    const base = t.find((f) => f.scene.status === "RÀO TẮT MỘT NỬA")!;
    expect(base.scene).toMatchObject({ fence: "half", meter: { value: 828, state: "exact" }, partial: { fill: 0.28, tone: "int", state: "full" } });
    expect(base.scene.cells).toHaveLength(8);
    expect(base.cues).toEqual(["gate_open"]);
    // Cells slide in one by one, a click each.
    expect(t.filter((f) => f.scene.wave === "base" && f.cues.includes("key_blip"))).toHaveLength(8);
    const siren = t.find((f) => f.cues.includes("siren"))!;
    expect(siren.scene).toMatchObject({ wave: "counter", posts: 7, capacity: 110, shake: true, meter: { need: 1500 } });
    const end = t.at(-1)!;
    expect(end.scene).toMatchObject({ fence: "off", status: "RÀO TẮT HOÀN TOÀN", banner: null, meter: { value: 1500, state: "exact" } });
    expect(end.scene.cells).toHaveLength(13);
    expect(end.cues).toEqual(["gate_open", "star"]);
    expect(summarizeFence(t)).toBe("Rào nhận 1500 trên 1500 đơn vị. Rào tắt hoàn toàn.");
  });

  test("rounding: one cell too many under the new load, the fence discharges then lights up half again", () => {
    const t = timeline(withLines({ 8: ENERGY, 11: "so_pin = round(nang_luong / dung_luong)", 12: "phan_le = nang_luong - so_pin * dung_luong" }));
    const [spark, end] = t.slice(-2);
    expect(spark.scene).toMatchObject({ fence: "discharge", status: "THỪA 1 PIN" });
    expect(end.scene).toMatchObject({ fence: "half", signal: "alarm", status: "RÀO SÁNG LẠI MỘT NỬA · THỪA 1 PIN" });
    expect(end.cues).toEqual(["alarm"]);
  });

  test("hard-coded results: the meter stays short of the new mark", () => {
    const end = timeline(withLines({ 8: "nang_luong = 828", 11: "so_pin = 8", 12: "phan_le = 28" })).at(-1)!;
    expect(end.scene.meter).toMatchObject({ value: 828, need: 1500, state: "short" });
    expect(end.scene).toMatchObject({ fence: "half", status: "RÀO SÁNG LẠI MỘT NỬA · THIẾU 672 ĐƠN VỊ" });
  });
});

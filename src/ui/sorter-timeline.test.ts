import { describe, expect, test } from "vitest";
import { runHarness } from "../../tests/integration/run-harness";
import { classifyRun } from "../game/classify-run";
import { buildSorterTimeline, summarizeSorter, type SorterFrame } from "./sorter-timeline";
import { realLevel } from "../../tests/content-fixture";

// GDD 1.3 §5 and §13 #29, from real harness runs.

const level = realLevel("1.3");
const STARTER = level.starter_code.split("\n");
const edit = (changes: Record<number, string | null>) =>
  STARTER.flatMap((l, i) => (i + 1 in changes ? (changes[i + 1] === null ? [] : [changes[i + 1]!]) : [l])).join("\n");
const timeline = (text: string) => buildSorterTimeline(classifyRun({ kind: "ok", data: runHarness(level, text) }, level), level);
const parcel = (f: SorterFrame, name: string) => f.scene.parcels.find((p) => p.name === name)!;

const FIELDS = { 6: "tuoi = 27", 7: "chieu_cao = 1.72", 8: "da_tiem = True" };

describe("sorter timeline", () => {
  test("starter code: parcels go to the lane of their real shape, the tuple drops grey, the gate stays shut", () => {
    const t = timeline(level.starter_code);
    const end = t.at(-1)!;
    expect(parcel(end, "ho_ten")).toMatchObject({ lane: "str", stage: "slot", verdict: "HỢP LỆ" });
    expect(parcel(end, "tuoi")).toMatchObject({ lane: "str", stage: "bin", verdict: "SAI LÀN: str ≠ int" });
    expect(parcel(end, "chieu_cao")).toMatchObject({ tone: "other", lane: null, stage: "bin", verdict: "KHÔNG RÕ HÌNH DẠNG" });
    expect(parcel(end, "khuon_phien")).toMatchObject({ kind: "parcel", lane: "int", stage: "bin", verdict: "SAI LÀN: int ≠ type" });
    // A wrong-lane parcel runs its lane before it drops; the grey one drops straight away.
    expect(t.some((f) => parcel(f, "tuoi").stage === "lane")).toBe(true);
    expect(t.some((f) => parcel(f, "chieu_cao").stage === "lane")).toBe(false);
    expect(end.scene).toMatchObject({ gate: "closed", scanner: "alarm", session: { label: "ma_phien = 4096", tone: "int" } });
    expect(end.cues).toEqual(["alarm"]);
    expect(t.flatMap((f) => f.cues).filter((c) => c === "scan_pass")).toHaveLength(1);
  });

  test("mould stamp: a hand-copied int fails against the new string session code; type(ma_phien) follows it", () => {
    const copied = timeline(edit({ ...FIELDS, 14: "khuon_phien = int" }));
    const baseEnd = copied.find((f) => f.scene.status === "RÀO MỞ MỘT NỬA")!;
    expect(parcel(baseEnd, "khuon_phien")).toMatchObject({ kind: "stamp", tone: "int", stage: "stamp", verdict: "KHỚP KHUÔN" });
    expect(copied.find((f) => f.cues.includes("siren"))!.scene.session).toEqual({ label: 'ma_phien = "7351"', tone: "str" });
    const end = copied.at(-1)!;
    expect(parcel(end, "khuon_phien")).toMatchObject({ kind: "stamp", tone: "int", verdict: "LỆCH KHUÔN" });
    expect(end.scene).toMatchObject({ gate: "half", status: "RÀO SẬP VỀ NỬA · LỆCH KHUÔN" });
    expect(end.cues).toEqual(["alarm"]);
    // The stamp runs last and is held longer.
    const counterFrames = copied.slice(copied.findIndex((f) => f.cues.includes("siren")) + 1, -1);
    expect(counterFrames.at(-1)).toMatchObject({ hold: 900 });
    expect(counterFrames.slice(0, -1).every((f) => f.hold === 300)).toBe(true);

    const asked = timeline(edit({ ...FIELDS, 14: "khuon_phien = type(ma_phien)" }));
    expect(parcel(asked.at(-1)!, "khuon_phien")).toMatchObject({ kind: "stamp", tone: "str", verdict: "KHỚP KHUÔN" });
    expect(asked.at(-1)!.scene.gate).toBe("open");
    expect(asked.at(-1)!.cues).toEqual(["gate_open", "star"]);
    expect(summarizeSorter(asked)).toBe("Máy phân loại: 5/5 trường vào đúng làn. Rào mở hoàn toàn.");
  });

  test("a missing variable leaves an empty frame on the belt", () => {
    const end = timeline(edit({ ...FIELDS, 13: null, 14: null })).at(-1)!;
    expect(parcel(end, "khuon_phien")).toMatchObject({ stage: "empty", verdict: "KHÔNG CÓ TÍN HIỆU" });
    expect(parcel(end, "tuoi")).toMatchObject({ stage: "slot", verdict: "HỢP LỆ" });
  });

  test("a Python error: nothing leaves the belt, the scanner shows the traceback line", () => {
    const t = timeline(edit({ 6: "tuoi = 27", 8: "da_tiem = true" }));
    const end = t.at(-1)!;
    expect(end.scene.parcels.every((p) => p.stage === "belt")).toBe(true);
    expect(end.scene).toMatchObject({ scanner: "alarm", status: "TRUY VẾT: dòng 8", gate: "closed" });
    expect(end.cues).toEqual(["alarm"]);
    expect(summarizeSorter(t)).toBe("Máy phân loại: TRUY VẾT: dòng 8. Rào đóng.");
  });
});

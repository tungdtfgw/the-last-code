import { describe, expect, test } from "vitest";
import { gradeFixture } from "../../tests/integration/run-harness";
import type { LevelDefinition } from "../game/level-types";
import levelJson from "../levels/level-1-4.json";
import { PACKET_MAX_W, buildTimeline, summarize, timelineDuration } from "./scanner-timeline";

const level = levelJson as unknown as LevelDefinition;
const timeline = (f: string) => buildTimeline(gradeFixture(level, f), level);
const last = (f: string) => timeline(f).at(-1)!;
const cues = (f: string) => timeline(f).flatMap((x) => x.cues);

describe("scanner timeline", () => {
  test("original: three str packets, ma_xac_thuc widest, gate closed, alarm", () => {
    const t = timeline("original");
    const end = t.at(-1)!;
    expect(end.scene.packets.map((p) => p.typeLabel)).toEqual(["str", "str", "str"]);
    const widths = Object.fromEntries(end.scene.packets.map((p) => [p.name, p.width]));
    expect(widths.ma_xac_thuc).toBeGreaterThan(widths.chi_so);
    expect(widths.ma_xac_thuc).toBeGreaterThan(widths.hop_le);
    expect(widths.ma_xac_thuc).toBe(PACKET_MAX_W);
    expect(end.scene.gate).toBe("closed");
    expect(end.cues).toContain("alarm");
    expect(end.scene.status).toBe("SAI KIỂU: str ≠ int");
  });

  test("6.6: half gate, then counter-attack ends at half with an error", () => {
    const t = timeline("two-star");
    expect(t.some((f) => f.scene.wave === "base" && f.scene.gate === "half")).toBe(true);
    const counter = t.filter((f) => f.scene.wave === "counter");
    expect(counter[0].cues).toContain("siren");
    expect(counter[0].scene.banner).toBe("CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP");
    expect(counter[0].scene.chip).toContain('tuoi = "31.0"');
    expect(t.at(-1)!.scene.gate).toBe("half");
    expect(t.at(-1)!.scene.status).toContain("ValueError: dòng 7");
    expect(t.at(-1)!.scene.packets.some((p) => p.stage === "broken")).toBe(true);
  });

  test("6.7: gate fully open with star cue; packets re-coloured to their types", () => {
    const end = last("three-star");
    expect(end.scene.gate).toBe("open");
    expect(end.cues).toContain("star");
    expect(end.scene.packets.map((p) => p.tone)).toEqual(["int", "float", "bool"]);
  });

  test("hard-coded: off-pattern packet under counter-attack", () => {
    const end = last("hardcoded");
    expect(end.scene.packets.find((p) => p.name === "ma_xac_thuc")!.verdict).toBe("LỆCH MẪU");
    expect(end.scene.gate).toBe("half");
  });

  test("errors and timeouts: no packet movement", () => {
    for (const f of ["type-error", "syntax-error"]) {
      const t = timeline(f);
      expect(t.every((fr) => fr.scene.packets.every((p) => p.stage === "source"))).toBe(true);
      expect(t.at(-1)!.scene.status).toBe("TRUY VẾT: dòng 7");
    }
    const timeoutOutcome = { ...gradeFixture(level, "original"), key: "timeout" as const, basePassed: false, stopStatus: "timeout", error: undefined };
    const t = buildTimeline(timeoutOutcome, level);
    expect(t).toHaveLength(2);
    expect(t.every((fr) => fr.scene.packets.every((p) => p.stage === "source"))).toBe(true);
    expect(t.at(-1)!.scene.status).toBe("TIẾN TRÌNH BỊ CẮT");
  });

  test("counter-attack hang: packets stay at the source, gate back to half", () => {
    const base = gradeFixture(level, "three-star");
    const o = { ...base, key: "counter_timeout" as const, stars: 2 as const, counterSurvived: false, counterAborted: "timeout" as const, counterVars: base.vars.map((v) => ({ ...v, present: false })) };
    const t = buildTimeline(o, level);
    const end = t.at(-1)!;
    expect(end.scene.wave).toBe("counter");
    expect(end.scene.gate).toBe("half");
    expect(end.scene.status).toBe("CỔNG SẬP VỀ NỬA · TIẾN TRÌNH BỊ CẮT");
    expect(end.scene.packets.every((p) => p.stage === "source")).toBe(true);
  });

  test("missing var: empty dashed slot", () => {
    const p = last("missing-var").scene.packets.find((x) => x.name === "hop_le")!;
    expect(p.stage).toBe("empty");
    expect(p.verdict).toBe("KHÔNG CÓ TÍN HIỆU");
  });

  test("over limit: Sentinel light; over 100%: caught, no counter wave", () => {
    expect(last("over-alert").scene.sentinel).toBe(true);
    const caught = timeline("sentinel-caught");
    expect(caught.some((f) => f.scene.wave === "counter")).toBe(false);
    expect(caught.at(-1)!.scene.status).toBe("SENTINEL ĐÃ KHÓA MỤC TIÊU");
    expect(caught.at(-1)!.scene.gate).toBe("closed");
  });

  test("each wave stays within 4 s; summary sentence", () => {
    const t = timeline("three-star");
    const base = t.filter((f) => f.scene.wave === "base");
    const counter = t.filter((f) => f.scene.wave === "counter");
    expect(timelineDuration(base)).toBeLessThanOrEqual(4000);
    expect(timelineDuration(counter)).toBeLessThanOrEqual(4000);
    expect(summarize(t)).toBe("Máy quét: CỔNG MỞ HOÀN TOÀN. Cổng mở hoàn toàn.");
    expect(cues("three-star")).toContain("gate_open");
  });
});

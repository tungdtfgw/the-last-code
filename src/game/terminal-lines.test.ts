import { describe, expect, test } from "vitest";
import { gradeFixture } from "../../tests/integration/run-harness";
import levelJson from "../levels/level-1-4.json";
import type { LevelDefinition } from "./level-types";
import { buildTerminalLines, gateFor } from "./terminal-lines";

const level = levelJson as unknown as LevelDefinition;
const lines = (fixture: string) => buildTerminalLines(gradeFixture(level, fixture), level, 1).map((l) => l.text);

describe("terminal lines (GDD 4.2)", () => {
  test("original: scanner rejects every var, no trace", () => {
    const t = lines("original");
    expect(t).toContain("> MÁY QUÉT TỪ CHỐI: ma_xac_thuc: str (201 ký tự), yêu cầu int");
    expect(t.join("\n")).not.toContain("TRUY VẾT");
    expect(t.at(-1)).toBe("> CỔNG: ĐÓNG");
  });

  test("TypeError: in-context trace with a jump target", () => {
    const o = gradeFixture(level, "type-error");
    const t = buildTerminalLines(o, level, 2);
    expect(t[1].text).toBe("> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP");
    const trace = t.find((l) => l.tone === "trace")!;
    expect(trace.text).toMatch(/^> TRUY VẾT: dòng 7 — TypeError: /);
    expect(trace.jumpLine).toBe(7);
    expect(t.some((l) => l.text.startsWith("> MỨC CẢNH BÁO:"))).toBe(true);
  });

  test("6.6: counter-attack banner, new chip values, ValueError, half gate", () => {
    const o = gradeFixture(level, "two-star");
    const t = buildTerminalLines(o, level, 3).map((l) => l.text);
    expect(t).toContain("> CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP");
    expect(t).toContain('> tuoi = "31.0"   chieu_cao = "1.65"   cap_do = "7"');
    expect(t.some((x) => x.startsWith("> TRUY VẾT: dòng 7 — ValueError"))).toBe(true);
    expect(t.at(-1)).toBe("> CỔNG: MỞ MỘT NỬA");
    expect(gateFor(o)).toBe("half");
  });

  test("6.7: gate fully open", () => {
    expect(lines("three-star").at(-1)).toBe("> CỔNG: MỞ HOÀN TOÀN");
  });

  test("hard-coded: off-pattern under counter-attack", () => {
    expect(lines("hardcoded")).toContain("> LỆCH MẪU: ma_xac_thuc = 2703");
  });

  test("over 100% alert: Sentinel locks on, gate closed, no counter-attack", () => {
    const t = lines("sentinel-caught");
    expect(t).toContain("> SENTINEL ĐÃ KHÓA MỤC TIÊU — MỨC CẢNH BÁO: 100%+");
    expect(t.join("\n")).not.toContain("OMNI");
    expect(t.at(-1)).toBe("> CỔNG: ĐÓNG");
  });

  test("counter-attack hang: terminal says the counter phase was cut, base kept", () => {
    const base = gradeFixture(level, "three-star");
    const o = { ...base, key: "counter_timeout" as const, stars: 2 as const, counterSurvived: false, counterAborted: "timeout" as const, counterVars: base.vars.map((v) => ({ ...v, present: false })) };
    const t = buildTerminalLines(o, level, 4).map((l) => l.text);
    expect(t).toContain("> CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP");
    expect(t).toContain("> TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG: quá thời gian. Kết quả dữ liệu gốc vẫn được giữ.");
    expect(t.at(-1)).toBe("> CỔNG: MỞ MỘT NỬA");
  });

  test("timeout and engine error", () => {
    const base = gradeFixture(level, "original");
    const timeout = { ...base, key: "timeout" as const, basePassed: false, stopStatus: "timeout", error: undefined };
    expect(buildTerminalLines(timeout, level, 1).map((l) => l.text)).toContain("> TIẾN TRÌNH BỊ CẮT: quá thời gian");
    const engine = { ...base, key: "engine_error" as const };
    expect(buildTerminalLines(engine, level, 1)[1].text).toContain("LÕI PYTHON KHÔNG PHẢN HỒI");
  });
});

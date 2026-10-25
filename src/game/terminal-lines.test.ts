import { describe, expect, test } from "vitest";
import { gradeFixture, runHarness } from "../../tests/integration/run-harness";
import levelJson from "../levels/level-1-4.json";
import level11Json from "../levels/level-1-1.json";
import level13Json from "../levels/level-1-3.json";
import { classifyRun } from "./classify-run";
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
    expect(t).toContain('> tuoi = "31.0"   chieu_cao = "1.653"   cap_do = "7"');
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
    expect(t).toContain("> TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG: quá thời gian. Vẫn giữ kết quả với dữ liệu gốc.");
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

describe("terminal lines, level 1.1 (relay R-17, GDD 1.1 §5)", () => {
  const l11 = level11Json as unknown as LevelDefinition;
  const starter = l11.starter_code.split("\n");
  const edit = (changes: Record<number, string>) => starter.map((l, i) => changes[i + 1] ?? l).join("\n");
  const run = (text: string, n: number) =>
    buildTerminalLines(classifyRun({ kind: "ok", data: runHarness(l11, text) }, l11), l11, n).map((l) => l.text);

  test("run 2, line 3 still lower case: matches the GDD log line for line", () => {
    expect(run(edit({ 7: 'print("PHIEN", ma_phien)' }), 2)).toEqual([
      "> LƯỢT CHẠY #2: phát qua trạm R-17",
      "> R-17 ĐÃ PHÁT: dòng 1 · NID/2089",
      "> R-17 ĐÃ PHÁT: dòng 2 · PHIEN K7Q2",
      "> R-17 BỎ GÓI: dòng 3 · sai ở vị trí 1 (chỉ khác hoa thường)",
      "    cần:  LO17·CAN·LIEN·LAC",
      "    nhận: lo17·can·lien·lac",
      "> MỨC CẢNH BÁO: 30% (3/4 lệnh)",
      "> KÊNH: ĐÓNG",
    ]);
  });

  test("starter code: the line already sent comes before the Sentinel, no missing lines listed", () => {
    const t = run(l11.starter_code, 1);
    expect(t.slice(0, 3)).toEqual([
      "> LƯỢT CHẠY #1: phát qua trạm R-17",
      "> R-17 ĐÃ PHÁT: dòng 1 · NID/2089",
      "> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP",
    ]);
    expect(t).toContain("> TRUY VẾT: dòng 7 — NameError: name 'PHIEN' is not defined");
    expect(t.join("\n")).not.toContain("KHÔNG CÓ DÒNG");
    expect(t.at(-1)).toBe("> KÊNH: ĐÓNG");
  });

  test("three stars: new session survives, channel fully open", () => {
    const t = run(edit({ 7: 'print("PHIEN", ma_phien)', 8: 'print("LO17 CAN LIEN LAC")' }), 3);
    expect(t).toContain('> ma_phien = "M4X8"');
    expect(t).toContain("> PHIÊN MỚI ĐI QUA TRẠM: mã vẫn đứng vững");
    expect(t.at(-1)).toBe("> KÊNH: MỞ HOÀN TOÀN");
  });

  test("hard-coded session: only the broken counter line is reported, with a non-ASCII code point when there is one", () => {
    const t = run(edit({ 7: 'print("PHIEN K7Q2")', 8: 'print("LO17 CAN LIEN LAC")' }), 4);
    const at = t.indexOf("> R-17 BỎ GÓI: dòng 2 · sai ở vị trí 7");
    expect(at).toBeGreaterThan(t.indexOf('> ma_phien = "M4X8"'));
    expect(t.slice(at + 1, at + 3)).toEqual(["    cần:  PHIEN·M4X8", "    nhận: PHIEN·K7Q2"]);
    expect(t.at(-1)).toBe("> KÊNH: MỞ MỘT NỬA");
    const cyrillic = run(edit({ 6: 'print("NID/2089")', 7: 'print("PHIEN", ma_phien)', 8: 'print("LO17 CAN LIEN L\u0410C")' }), 5);
    expect(cyrillic).toContain("    nhận: LO17·CAN·LIEN·L\u0410C · U+0410");
  });
});


describe("terminal lines, level 1.3 (sorter, inputs that are not strings)", () => {
  const level13 = level13Json as unknown as LevelDefinition;
  const STARTER = level13.starter_code.split("\n");
  const TWO_STAR = [...STARTER.slice(0, 4), 'ho_ten = "ĐỖ MINH AN"', "tuoi = 27", "chieu_cao = 1.72", "da_tiem = True", "khuon_phien = int", ""].join("\n");

  test("starter code: every wrong shape named as GDD 1.3 §6 lists them, no trace", () => {
    const t = buildTerminalLines(classifyRun({ kind: "ok", data: runHarness(level13, level13.starter_code) }, level13), level13, 1).map((l) => l.text);
    expect(t).toEqual(
      expect.arrayContaining([
        "> HỢP LỆ: ho_ten: str = 'ĐỖ MINH AN'",
        "> MÁY QUÉT TỪ CHỐI: tuoi: str (2 ký tự), yêu cầu int",
        "> MÁY QUÉT TỪ CHỐI: chieu_cao: tuple (nhiều giá trị ghép lại bằng dấu phẩy), yêu cầu float",
        "> MÁY QUÉT TỪ CHỐI: khuon_phien: int, yêu cầu type",
      ]),
    );
    expect(t.join("\n")).not.toContain("TRUY VẾT");
    expect(t.at(-1)).toBe("> RÀO SÂN GA: ĐÓNG");
  });

  test("the counter-attack input line uses Python syntax: a string keeps its quotes, numbers and bools do not", () => {
    const o = classifyRun({ kind: "ok", data: runHarness(level13, TWO_STAR) }, level13);
    const counterLine = (ma_phien: string | number | boolean) =>
      buildTerminalLines({ ...o, counterInputs: { ma_phien } }, level13, 1).find((l) => l.text.startsWith("> ma_phien"))?.text;
    expect(o.counterInputs).toEqual({ ma_phien: "7351" });
    expect(counterLine("7351")).toBe('> ma_phien = "7351"');
    expect(counterLine(4096)).toBe("> ma_phien = 4096");
    expect(counterLine(true)).toBe("> ma_phien = True");
  });
});

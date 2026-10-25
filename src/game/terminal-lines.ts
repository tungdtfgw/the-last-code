import { formatAlertPercent } from "./alert";
import type { RunOutcome, VarVerdict } from "./classify-run";
import type { LevelDefinition } from "./level-types";

export type TerminalTone = "info" | "ok" | "reject" | "alarm" | "trace" | "omni" | "muted";

export interface TerminalLine {
  /** Assigned by the reducer when the line enters the log. */
  id?: number;
  tone: TerminalTone;
  text: string;
  /** Editor line the player can jump to. */
  jumpLine?: number;
}

export type GateState = "closed" | "half" | "open";

/** Final gate state for an outcome (also used by the simulation). */
export function gateFor(outcome: RunOutcome): GateState {
  if (!outcome.basePassed || outcome.sentinelCaught) return "closed";
  return outcome.stars === 3 ? "open" : "half";
}

const lengthNote = (v: VarVerdict) => (v.type === "str" && v.length !== null ? ` (${v.length} ký tự)` : "");

function verdictLines(vars: VarVerdict[]): TerminalLine[] {
  return vars.map((v): TerminalLine => {
    if (!v.present) return { tone: "reject", text: `> KHÔNG CÓ TÍN HIỆU: ${v.name} không tồn tại sau khi chạy` };
    if (!v.typeOk)
      return { tone: "reject", text: `> MÁY QUÉT TỪ CHỐI: ${v.name}: ${v.type}${lengthNote(v)}, yêu cầu ${v.expectedType}` };
    if (!v.valueOk) return { tone: "reject", text: `> SAI GIÁ TRỊ: ${v.name} = ${v.preview ?? "?"} không khớp mẫu` };
    return { tone: "ok", text: `> HỢP LỆ: ${v.name}: ${v.type} = ${v.preview ?? ""}` };
  });
}

const STOP_TEXT: Record<string, string> = {
  timeout: "> TIẾN TRÌNH BỊ CẮT: quá thời gian",
  resource_limit: "> TIẾN TRÌNH BỊ CẮT: bộ nhớ quá tải",
  blocked_import: "> MÔ-ĐUN BỊ PHONG TỎA",
  input_unsupported: "> KHÔNG CÓ KÊNH NHẬP LIỆU: dữ liệu đã nằm sẵn trong chip",
  system_exit: "> CHƯƠNG TRÌNH TỰ DỪNG GIỮA CHỪNG",
};

function traceLines(outcome: RunOutcome): TerminalLine[] {
  const e = outcome.error;
  if (!e) return [];
  const head: TerminalLine = {
    tone: "trace",
    text: `> TRUY VẾT: dòng ${e.line ?? "?"} — ${e.type}: ${e.message}`,
    jumpLine: e.line ?? undefined,
  };
  // Show the call chain when the error happened inside a player function.
  const chain: TerminalLine[] =
    e.tracebackLines.length > 1
      ? e.tracebackLines.map((t): TerminalLine => ({ tone: "muted", text: `    dòng ${t.line}: ${t.text}`, jumpLine: t.line }))
      : [];
  if (e.tracebackOmitted && chain.length > 1) {
    const half = Math.ceil(chain.length / 2);
    chain.splice(half, 0, { tone: "muted", text: `    … ${e.tracebackOmitted} khung lặp lại đã lược bỏ` });
  }
  return [head, ...chain];
}

const alertLine = (outcome: RunOutcome, level: LevelDefinition): TerminalLine[] =>
  outcome.alertPercent === null
    ? []
    : [
        {
          tone: outcome.alertPercent > 40 ? "alarm" : "info",
          text: `> MỨC CẢNH BÁO: ${formatAlertPercent(outcome.alertPercent)} (${outcome.baseLineCount}/${level.alert_limit_statements} lệnh)`,
        },
      ];

/** The in-world log for one run (GDD 4.2). Pure, so it can be tested and rendered as text nodes. */
export function buildTerminalLines(outcome: RunOutcome, level: LevelDefinition, runNumber: number): TerminalLine[] {
  const out: TerminalLine[] = [{ tone: "muted", text: `> LƯỢT CHẠY #${runNumber}: gửi tín hiệu tới máy quét` }];

  if (outcome.key === "engine_error") {
    out.push({ tone: "alarm", text: "> LÕI PYTHON KHÔNG PHẢN HỒI. ĐANG KHỞI ĐỘNG LẠI" });
    return out;
  }

  if (!outcome.basePassed) {
    if (outcome.stopStatus && STOP_TEXT[outcome.stopStatus]) {
      out.push({ tone: "alarm", text: STOP_TEXT[outcome.stopStatus] });
      if (outcome.stopStatus !== "timeout") out.push(...traceLines(outcome));
    } else if (outcome.error) {
      out.push({ tone: "alarm", text: "> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP" });
      out.push(...traceLines(outcome));
      out.push(...alertLine(outcome, level));
    } else {
      out.push(...verdictLines(outcome.vars));
      out.push(...alertLine(outcome, level));
    }
    out.push({ tone: "reject", text: "> CỔNG: ĐÓNG" });
    return out;
  }

  out.push(...verdictLines(outcome.vars));
  out.push(...alertLine(outcome, level));

  if (outcome.sentinelCaught) {
    out.push({ tone: "alarm", text: "> SENTINEL ĐÃ KHÓA MỤC TIÊU — MỨC CẢNH BÁO: 100%+" });
    out.push({ tone: "reject", text: "> CỔNG: ĐÓNG" });
    return out;
  }
  if (outcome.stars === 1) out.push({ tone: "alarm", text: "> TÍN HIỆU BỊ GHI NHẬN: vượt ngưỡng tàng hình" });

  if (outcome.counterVars) {
    out.push({ tone: "omni", text: `> ${level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU"}` });
    const inputs = outcome.counterInputs ?? {};
    out.push({
      tone: "omni",
      text: "> " + level.inputs.map((name) => `${name} = ${JSON.stringify(inputs[name] ?? "")}`).join("   "),
    });
    if (outcome.counterAborted) {
      out.push({
        tone: "alarm",
        text:
          outcome.counterAborted === "timeout"
            ? "> TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG: quá thời gian. Kết quả dữ liệu gốc vẫn được giữ."
            : "> LÕI PYTHON SỤP KHI OMNI PHẢN CÔNG. Kết quả dữ liệu gốc vẫn được giữ.",
      });
    } else if (outcome.counterSurvived) {
      out.push({ tone: "ok", text: "> DỮ LIỆU MỚI ĐI QUA MÁY QUÉT: mã vẫn đứng vững" });
    } else if (outcome.error?.phase === "counter") {
      out.push(...traceLines(outcome));
    } else if (outcome.key === "timeout") {
      out.push({ tone: "alarm", text: STOP_TEXT.timeout });
    } else {
      out.push(
        ...outcome.counterVars
          .filter((v) => !v.present || !v.typeOk || !v.valueOk)
          .map((v): TerminalLine =>
            v.present && v.typeOk
              ? { tone: "reject", text: `> LỆCH MẪU: ${v.name} = ${v.preview ?? "?"}` }
              : verdictLines([v])[0],
          ),
      );
    }
  }

  const gate = gateFor(outcome);
  out.push(
    gate === "open"
      ? { tone: "ok", text: "> CỔNG: MỞ HOÀN TOÀN" }
      : { tone: "info", text: "> CỔNG: MỞ MỘT NỬA" },
  );
  return out;
}

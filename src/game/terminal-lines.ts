import { formatAlertPercent } from "./alert";
import type { OutputReport, RunOutcome, VarVerdict } from "./classify-run";
import { BASE_TYPES, type LevelDefinition } from "./level-types";
import { formatPyLiteral } from "./python-literal";
import { describeLine } from "./output-diff";
import { vocabularyFor, type SimVocabulary } from "./sim-vocabulary";
import { typeGloss } from "./type-gloss";

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
/** A shape outside the four lanes gets its meaning in brackets: `tuple (nhiều giá trị…)`. */
const shapeNote = (v: VarVerdict) => {
  const g = BASE_TYPES.includes(v.type as never) ? undefined : typeGloss(v.type);
  return g ? ` (${g})` : "";
};

function verdictLines(vars: VarVerdict[]): TerminalLine[] {
  return vars.map((v): TerminalLine => {
    if (!v.present) return { tone: "reject", text: `> KHÔNG CÓ TÍN HIỆU: ${v.name} không tồn tại sau khi chạy` };
    if (!v.typeOk)
      return { tone: "reject", text: `> MÁY QUÉT TỪ CHỐI: ${v.name}: ${v.type}${shapeNote(v)}${lengthNote(v)}, yêu cầu ${v.expectedType}` };
    if (!v.valueOk) return { tone: "reject", text: `> SAI GIÁ TRỊ: ${v.name} = ${v.preview ?? "?"} không khớp mẫu` };
    return { tone: "ok", text: `> HỢP LỆ: ${v.name}: ${v.type} = ${v.preview ?? ""}` };
  });
}

const STOP_TEXT: Record<string, string> = {
  timeout: "> TIẾN TRÌNH BỊ CẮT: quá thời gian",
  resource_limit: "> TIẾN TRÌNH BỊ CẮT: bộ nhớ quá tải",
  blocked_import: "> MÔ-ĐUN BỊ PHONG TỎA",
  input_unsupported: "> KHÔNG CÓ KÊNH NHẬP LIỆU: dữ liệu đã nạp sẵn",
  system_exit: "> CHƯƠNG TRÌNH TỰ DỪNG GIỮA CHỪNG",
};

/**
 * Output lines as the station reports them. `emittedOnly`: the program stopped, so
 * only lines that actually went out are listed (no "missing" lines after the error).
 * `failedOnly`: counter-attack, where only what broke is worth a line.
 */
function outputLines(
  output: OutputReport | undefined,
  vocab: SimVocabulary,
  opts: { emittedOnly?: boolean; failedOnly?: boolean } = {},
): TerminalLine[] {
  if (!output) return [];
  const out: TerminalLine[] = [];
  for (const l of output.lines) {
    if (l.status === "ok") {
      if (!opts.failedOnly) out.push({ tone: "ok", text: `> ${vocab.sent}: dòng ${l.line} · ${l.expected}` });
    } else if (l.status === "missing") {
      if (!opts.emittedOnly) out.push({ tone: "reject", text: `> KHÔNG CÓ DÒNG: dòng ${l.line}` });
    } else {
      const d = describeLine(l);
      out.push({
        tone: "reject",
        text: `> ${vocab.dropped}: dòng ${l.line} · sai ở vị trí ${d.col}${l.caseOnly ? " (chỉ khác hoa thường)" : ""}`,
      });
      out.push({ tone: "muted", text: `    cần:  ${d.need.before}${d.need.mark}${d.need.after}` });
      out.push({ tone: "muted", text: `    nhận: ${d.got.before}${d.got.mark}${d.got.after}${d.codePoint ? ` · ${d.codePoint}` : ""}` });
    }
  }
  if (output.extraCount > 0) out.push({ tone: "reject", text: `> DÒNG THỪA: ${output.extraCount} dòng ngoài giao thức` });
  if (output.truncated) out.push({ tone: "reject", text: "> ĐẦU RA BỊ CẮT: quá dài, phiên bị bỏ" });
  return out;
}

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

/** Stdin lines as Python literals: `"4172", "DEM"`; an empty channel says so. */
const channelText = (stdin: string[]) => (stdin.length ? stdin.map((x) => formatPyLiteral(x)).join(", ") : "(trống)");

const channelLine = (stdin: string[] | undefined, read: number | undefined, tone: TerminalTone): TerminalLine[] =>
  stdin === undefined
    ? []
    : [{ tone, text: `> KÊNH NHẬP: ${channelText(stdin)}${read === undefined ? "" : ` (đã đọc ${read}/${stdin.length})`}` }];

/**
 * One opening line per scan round reached: rounds run one after another, so the log stops
 * at the first failing round. Each names the inputs that change between rounds and the
 * round's stdin channel.
 */
function roundLines(outcome: RunOutcome, level: LevelDefinition, vocab: SimVocabulary): TerminalLine[] {
  const rounds = outcome.rounds;
  if (!rounds) return [];
  const changing = level.inputs.filter((name) => new Set(level.tests.map((t) => JSON.stringify(t.inputs[name]))).size > 1);
  const failed = rounds.findIndex((r) => !r.passed);
  const reached = failed === -1 ? rounds : rounds.slice(0, failed + 1);
  return reached.map((r, i) => {
    const parts = [`${vocab.round} ${i + 1}/${rounds.length}`];
    if (changing.length) parts.push(changing.map((name) => `${name} = ${formatPyLiteral(r.inputs[name] ?? "")}`).join(", "));
    if (r.stdin) parts.push(`kênh nhập: ${channelText(r.stdin)}`);
    return { tone: "info", text: `> ${parts.join(" · ")}` };
  });
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
  const vocab = vocabularyFor(level);
  const out: TerminalLine[] = [{ tone: "muted", text: `> LƯỢT CHẠY #${runNumber}: ${vocab.runTarget}` }];
  const closed: TerminalLine = { tone: "reject", text: `> ${vocab.gate}: ĐÓNG` };
  // Round lines carry each round's channel; a single test gets its own channel line.
  out.push(...(outcome.rounds ? roundLines(outcome, level, vocab) : channelLine(outcome.stdin, outcome.stdinRead, "info")));

  if (outcome.key === "engine_error") {
    out.push({ tone: "alarm", text: "> LÕI PYTHON KHÔNG PHẢN HỒI. ĐANG KHỞI ĐỘNG LẠI" });
    return out;
  }

  if (!outcome.basePassed) {
    if (outcome.stopStatus && STOP_TEXT[outcome.stopStatus]) {
      out.push(...outputLines(outcome.output, vocab, { emittedOnly: true }));
      out.push({ tone: "alarm", text: STOP_TEXT[outcome.stopStatus] });
      if (outcome.stopStatus !== "timeout") out.push(...traceLines(outcome));
    } else if (outcome.error) {
      // Lines printed before the error still went out.
      out.push(...outputLines(outcome.output, vocab, { emittedOnly: true }));
      out.push({ tone: "alarm", text: "> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP" });
      out.push(...traceLines(outcome));
      out.push(...alertLine(outcome, level));
    } else {
      out.push(...verdictLines(outcome.vars));
      out.push(...outputLines(outcome.output, vocab));
      out.push(...alertLine(outcome, level));
    }
    out.push(closed);
    return out;
  }

  out.push(...verdictLines(outcome.vars));
  out.push(...outputLines(outcome.output, vocab));
  out.push(...alertLine(outcome, level));

  if (outcome.sentinelCaught) {
    out.push({ tone: "alarm", text: "> SENTINEL ĐÃ KHÓA MỤC TIÊU — MỨC CẢNH BÁO: 100%+" });
    out.push(closed);
    return out;
  }
  if (outcome.stars === 1) out.push({ tone: "alarm", text: "> TÍN HIỆU BỊ GHI NHẬN: vượt ngưỡng tàng hình" });

  if (outcome.counterVars) {
    out.push({ tone: "omni", text: `> ${level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU"}` });
    const inputs = outcome.counterInputs ?? {};
    out.push({
      tone: "omni",
      text: "> " + level.inputs.map((name) => `${name} = ${formatPyLiteral(inputs[name] ?? "")}`).join("   "),
    });
    out.push(...channelLine(outcome.counterStdin, outcome.counterStdinRead, "omni"));
    if (outcome.counterAborted) {
      out.push({
        tone: "alarm",
        text:
          outcome.counterAborted === "timeout"
            ? "> TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG: quá thời gian. Vẫn giữ kết quả với dữ liệu gốc."
            : "> LÕI PYTHON SỤP KHI OMNI PHẢN CÔNG. Vẫn giữ kết quả với dữ liệu gốc.",
      });
    } else if (outcome.counterSurvived) {
      out.push({ tone: "ok", text: `> ${vocab.counterSurvived}` });
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
        ...outputLines(outcome.counterOutput, vocab, { failedOnly: true }),
      );
    }
  }

  const gate = gateFor(outcome);
  out.push(
    gate === "open"
      ? { tone: "ok", text: `> ${vocab.gate}: MỞ HOÀN TOÀN` }
      : { tone: "info", text: `> ${vocab.gate}: MỞ MỘT NỬA` },
  );
  return out;
}

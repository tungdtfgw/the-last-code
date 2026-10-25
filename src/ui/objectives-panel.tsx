import { useEffect, useRef } from "react";
import { alertPercent, formatAlertPercent, fullAlertStatements } from "../game/alert";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { toneVar } from "./type-colors";

function AlertMeter({ count, limit, shown }: { count: number | null; limit: number; shown: boolean }) {
  const total = fullAlertStatements(limit);
  const percent = count === null ? 0 : alertPercent(count, limit);
  const filled = count === null ? 0 : Math.min(total, count);
  const over = count !== null && count > limit;
  return (
    <div className={`alert-meter${shown ? " is-in" : " is-pending"}`}>
      <div className="alert-meter-head">
        <span className="label">Thanh cảnh báo</span>
        <span className={`alert-meter-value${over ? " is-over" : ""}`}>
          {count === null ? `–/${limit} lệnh` : `${count}/${limit} lệnh · ${formatAlertPercent(percent)}`}
        </span>
      </div>
      <div
        className="alert-track"
        role="meter"
        aria-label="Mức cảnh báo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, percent)}
        aria-valuetext={count === null ? "chưa chạy" : `${count} câu lệnh, ${formatAlertPercent(percent)}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`alert-seg${i < limit ? " is-stealth" : ""}${i < filled ? " is-on" : ""}${i < filled && i >= limit ? " is-hot" : ""}`}
            style={{ ["--i" as string]: i }}
          />
        ))}
      </div>
      <div className="alert-scale" aria-hidden="true">
        <span>0</span>
        <span style={{ left: `${(limit / total) * 100}%` }}>40% tàng hình</span>
        <span>100%</span>
      </div>
    </div>
  );
}

interface Props {
  level: LevelDefinition;
  outcome: RunOutcome | null;
  /** Intro reveal: how many objectives are visible so far, and whether the alert meter is. */
  revealed: number;
  meterShown: boolean;
}

export function ObjectivesPanel({ level, outcome, revealed, meterShown }: Props) {
  const panel = useRef<HTMLElement>(null);
  // Keep the newest revealed row in view inside this box.
  useEffect(() => {
    const box = panel.current;
    if (!box || revealed === 0) return;
    const target = meterShown ? box.querySelector(".alert-meter") : box.querySelectorAll(".objective")[revealed - 1];
    if (!(target instanceof HTMLElement)) return;
    const bottom = target.offsetTop + target.offsetHeight - box.clientHeight;
    if (bottom > box.scrollTop) box.scrollTop = bottom;
  }, [revealed, meterShown]);
  return (
    <section ref={panel} className="panel objectives" aria-labelledby="obj-title">
      <header className="panel-head">
        <h2 id="obj-title" className="panel-title">Mục tiêu</h2>
        <span className="panel-meta">máy quét chỉ đọc hình dạng</span>
      </header>
      <div className="panel-body">
        <ul className="objective-list">
          {level.objectives.map((o, i) => {
            const v = outcome?.vars.find((x) => x.name === o.var);
            const state = !v || !outcome || outcome.key === "engine_error" ? "idle" : v.typeOk && v.valueOk ? "pass" : "fail";
            return (
              <li key={o.var} className={`objective is-${state}${i < revealed ? " is-in" : " is-pending"}`}>
                <span className="objective-mark" aria-hidden="true" />
                <div className="objective-text">
                  <code className="objective-var">{o.var}</code>
                  <span className="objective-label">{o.label}</span>
                </div>
                <span className="type-chip" style={{ ["--chip" as string]: toneVar(o.type) }}>
                  {o.type}
                </span>
                <span className="sr-only">{state === "pass" ? "đạt" : state === "fail" ? "chưa đạt" : "chưa chạy"}</span>
              </li>
            );
          })}
        </ul>
        <AlertMeter count={outcome?.baseLineCount ?? null} limit={level.alert_limit_statements} shown={meterShown} />
      </div>
    </section>
  );
}

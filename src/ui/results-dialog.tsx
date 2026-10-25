import { useEffect, useRef } from "react";
import { formatAlertPercent } from "../game/alert";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import type { LevelProgress } from "../storage/progress-repository";
import { StarIcon, StarRow } from "./star-icon";

interface Props {
  open: boolean;
  outcome: RunOutcome | null;
  progress: LevelProgress;
  level: LevelDefinition;
  onClose(): void;
}

function headline(o: RunOutcome) {
  if (o.stars === 3) return "Cổng mở hoàn toàn";
  if (o.stars === 2) return "Qua cổng";
  return "Qua cổng, bị ghi nhận";
}

/** Native <dialog>: showModal gives focus trapping and Esc; focus returns to the run button via onClose. */
export function ResultsDialog({ open, outcome, progress, level, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const hasCounter = level.counter_attack_tests.length > 0;
  const criteria = outcome
    ? [
        { label: "Đúng kiểu, đúng giá trị", ok: outcome.stars >= 1 },
        { label: `Mức cảnh báo ≤ 40% (≤ ${level.alert_limit_statements} lệnh)`, ok: outcome.baseLineCount !== null && outcome.baseLineCount <= level.alert_limit_statements },
        ...(hasCounter ? [{ label: "Chống được OMNI phản công", ok: outcome.counterSurvived }] : []),
      ]
    : [];

  return (
    <dialog
      ref={ref}
      className="results"
      aria-labelledby="results-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
    >
      {outcome && (
        <div className="results-inner">
          <p className="results-eyebrow">Kết quả · Level {level.id}</p>
          <h2 id="results-title" className="results-title">
            {headline(outcome)}
          </h2>
          <div className="results-stars">
            <StarRow count={outcome.stars} size={40} />
            <span className="results-best">
              Cao nhất <StarRow count={progress.bestStars} size={14} />
            </span>
          </div>
          <ul className="results-criteria">
            {criteria.map((c, i) => (
              <li key={i} className={c.ok ? "is-ok" : "is-miss"}>
                <StarIcon filled={c.ok} size={16} />
                <span>{c.label}</span>
                <strong>{c.ok ? "ĐẠT" : "CHƯA"}</strong>
              </li>
            ))}
          </ul>
          {outcome.stars === 1 && outcome.counterSurvived && (
            <p className="results-note">Mã đã chống được phản công, nhưng Sentinel ghi nhận quá nhiều câu lệnh.</p>
          )}
          <dl className="results-stats">
            <div>
              <dt>Số lần chạy</dt>
              <dd>{progress.runs}</dd>
            </div>
            <div>
              <dt>Số câu lệnh</dt>
              <dd>{outcome.baseLineCount ?? "–"}</dd>
            </div>
            <div>
              <dt>Mức cảnh báo</dt>
              <dd>{outcome.alertPercent === null ? "–" : formatAlertPercent(outcome.alertPercent)}</dd>
            </div>
            <div>
              <dt>Số gợi ý đã mở</dt>
              <dd>{progress.hintsOpened}/3</dd>
            </div>
          </dl>
          <div className="results-lore">
            <p>{level.outro}</p>
            {level.lore_fragment && <blockquote>{level.lore_fragment}</blockquote>}
          </div>
          <button type="button" className="btn btn-run results-close" onClick={onClose} autoFocus>
            Tối ưu tiếp
          </button>
        </div>
      )}
    </dialog>
  );
}

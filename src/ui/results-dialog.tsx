import { useEffect, useRef } from "react";
import { formatAlertPercent } from "../game/alert";
import type { RunOutcome } from "../game/classify-run";
import type { EchoState } from "../game/game-reducer";
import { varObjectives, type LevelDefinition } from "../game/level-types";
import { vocabularyFor } from "../game/sim-vocabulary";
import type { LevelProgress } from "../storage/progress-repository";
import { StarIcon, StarRow } from "./star-icon";

interface Props {
  open: boolean;
  outcome: RunOutcome | null;
  /** ECHO's line for this run, repeated here because the dialog covers the ECHO chat. */
  echo?: EchoState;
  progress: LevelProgress;
  level: LevelDefinition;
  onClose(): void;
  /** TIẾP TỤC: leave for the next story or level. */
  onContinue(): void;
}

function headline(o: RunOutcome, level: LevelDefinition) {
  const [one, two, three] = vocabularyFor(level).headlines;
  return o.stars === 3 ? three : o.stars === 2 ? two : one;
}

/** Native <dialog>: showModal gives focus trapping and Esc; focus returns to the run button via onClose. */
export function ResultsDialog({ open, outcome, echo, progress, level, onClose, onContinue }: Props) {
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
        {
          label: varObjectives(level).length > 0 ? "Đúng kiểu, đúng giá trị" : "Đầu ra khớp từng ký tự, chạy hết không lỗi",
          ok: outcome.stars >= 1,
        },
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
            {headline(outcome, level)}
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
          {echo?.primary && (
            <figure className="results-echo">
              <figcaption className="label">ECHO</figcaption>
              <blockquote>
                <p>{echo.primary}</p>
                {echo.followUp && <p className="results-echo-follow">{echo.followUp}</p>}
              </blockquote>
            </figure>
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
          {level.component && (
            <p className="results-collected">
              Đã thu: <strong>{level.component}</strong>
            </p>
          )}
          {/* The dialog only opens with at least one star. */}
          <div className="results-actions">
            <button type="button" className="btn btn-run" onClick={onContinue} autoFocus>
              TIẾP TỤC
            </button>
            <button type="button" className="btn btn-ghost results-close" onClick={onClose}>
              Tối ưu tiếp
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

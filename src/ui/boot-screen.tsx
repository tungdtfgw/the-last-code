import type { FailReason, RunnerStatus, RunnerStatusDetail } from "../engine/py-runner";
import type { LoadStage } from "../engine/worker-protocol";

const STAGES: { key: LoadStage; label: string }[] = [
  { key: "download", label: "Tải lõi Python từ kho lưu trữ ngầm (≈10 MB, chỉ lần đầu)" },
  { key: "boot", label: "Đánh thức lõi Python" },
  { key: "harness", label: "Nạp bộ giải mã máy quét" },
];

const REASON: Record<FailReason, string> = {
  offline: "Laptop đang ngoại tuyến. Kết nối mạng một lần để tải lõi Python.",
  cdn: "Kho lưu trữ (cdn.jsdelivr.net) không phản hồi hoặc bị chặn.",
  timeout: "Quá 60 giây mà lõi Python chưa phản hồi.",
  unsupported: "Trình duyệt không chạy được tiến trình nền dạng module.",
};

interface Props {
  status: RunnerStatus;
  detail: RunnerStatusDetail;
  onRetry(): void;
}

/** Overlay on the simulation while Pyodide loads, or when loading failed. The editor stays usable. */
export function BootScreen({ status, detail, onRetry }: Props) {
  if (status === "failed") {
    return (
      <div className="boot is-failed" role="alert">
        <p className="boot-title">KHÔNG KẾT NỐI ĐƯỢC LÕI PYTHON</p>
        <p className="boot-text">{REASON[detail.reason ?? "cdn"]}</p>
        {detail.message && <p className="boot-detail">{detail.message}</p>}
        <button type="button" className="btn btn-run" onClick={onRetry}>
          THỬ LẠI
        </button>
        <p className="boot-text">Bạn vẫn có thể đọc nhiệm vụ và sửa mã trong lúc chờ.</p>
      </div>
    );
  }
  const current = STAGES.findIndex((s) => s.key === detail.stage);
  const restarting = status === "restarting";
  return (
    <div className="boot" role="status" aria-live="polite">
      <p className="boot-title">{restarting ? "ĐANG KHỞI ĐỘNG LẠI LÕI PYTHON" : "ĐANG ĐÁNH THỨC LÕI PYTHON"}</p>
      <ol className="boot-steps">
        {STAGES.map((s, i) => (
          <li key={s.key} className={i < current ? "is-done" : i === current ? "is-active" : ""}>
            <span className="boot-dot" aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ol>
      <div className="boot-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${(Math.max(0, current) + 0.5) / STAGES.length})` }} />
      </div>
    </div>
  );
}

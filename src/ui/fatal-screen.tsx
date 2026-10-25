interface Props {
  title: string;
  message: string;
  detail?: string[];
  action?: { label: string; onClick(): void };
}

export function FatalScreen({ title, message, detail, action }: Props) {
  return (
    <main className="fatal" role="alert">
      <div className="fatal-card">
        <p className="fatal-code">TÍN HIỆU GIÁN ĐOẠN</p>
        <h1 className="fatal-title">{title}</h1>
        <p className="fatal-message">{message}</p>
        {detail && detail.length > 0 && (
          <ul className="fatal-detail">
            {detail.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        {action && (
          <button type="button" className="btn btn-run" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </main>
  );
}

import { useCallback, useEffect, useState } from "react";
import type { AccountApi, AdminDocSummary } from "../../account/account-api";
import { sourceLine } from "./admin-format";

/** Every document the deploy bundles (chapter 1 and every level file); only those with text in D1 open. */
export function AdminList(props: { api: AccountApi; onOpen(doc: AdminDocSummary): void; onGame(): void; onSessionExpired(): void }) {
  const { api, onSessionExpired } = props;
  const [docs, setDocs] = useState<AdminDocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await api.adminListContent();
    if (res.ok) setDocs(res.data.docs);
    else if (res.status === 401) onSessionExpired();
    else setError("Chưa tải được danh sách. Kiểm tra mạng rồi thử lại.");
  }, [api, onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="screen admin-screen">
      <header className="admin-top">
        <button type="button" className="btn btn-ghost" onClick={props.onGame}>
          Về game
        </button>
        <h1 className="admin-title">
          <span className="admin-kicker">QUẢN LÝ KỊCH BẢN</span> Danh sách
        </h1>
      </header>
      <div className="admin-body admin-body-plain">
        {error && (
          <div className="admin-banner is-error">
            <p>{error}</p>
            <button type="button" className="btn" onClick={() => void load()}>
              Thử lại
            </button>
          </div>
        )}
        {docs === null && !error && <p className="admin-help">Đang tải…</p>}
        {docs && (
          <ul className="admin-docs">
            {docs.map((d) => {
              const name = d.kind === "level" ? `${d.id} · ${d.title}` : `Chương ${d.id} · ${d.title}`;
              // No row in D1: the text arrives with a migration, the page never creates it.
              if (d.revision === 0) {
                return (
                  <li key={d.docId}>
                    <div className="admin-doc is-missing" aria-disabled="true">
                      <span className="admin-doc-name">{name}</span>
                      <span className="admin-doc-source">{sourceLine(d)}</span>
                      <span className="admin-tags">
                        <span className="admin-tag is-error">Chưa có câu chữ: thêm migration</span>
                      </span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={d.docId}>
                  <button type="button" className="admin-doc" onClick={() => props.onOpen(d)}>
                    <span className="admin-doc-name">{name}</span>
                    <span className="admin-doc-source">{sourceLine(d)}</span>
                    <span className="admin-tags">
                      {d.drift.length > 0 && (
                        <span className="admin-tag" title="Câu đố đã đổi số phần tử hoặc neo. Mở ra, điền các ô trống rồi lưu lại.">
                          Lệch cấu trúc
                        </span>
                      )}
                      {d.errors.length > 0 && (
                        <span className="admin-tag is-error" title={d.errors[0].message}>
                          Lỗi
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

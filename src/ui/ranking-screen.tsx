import { useCallback, useEffect, useState } from "react";
import type { AccountApi, Ranking, RankingEntry } from "../account/account-api";
import { StarRow } from "./star-icon";

export interface RankingScreenProps {
  api: Pick<AccountApi, "getRanking" | "adminSetRankingHidden">;
  userId: string;
  username: string;
  isAdmin: boolean;
  /** Level id → "1.4 · Tín hiệu lệch pha"; an id no longer in the game shows bare. */
  levelLabel(id: string): string;
  onBack(): void;
  /** Resolves once the player's own pending writes (a fresh star) have landed, or soon enough; awaited before the first load. */
  settle?(): Promise<unknown>;
}

type Load = { kind: "loading" } | { kind: "failed" } | { kind: "ready"; ranking: Ranking };

function Row({ entry, label, admin }: { entry: RankingEntry; label: string; admin?: { busy: boolean; onToggle(): void } }) {
  return (
    <tr className="rank-row" data-me={entry.me || undefined} data-hidden={entry.hidden || undefined}>
      <td className="rank-place">{entry.rank ?? "ẨN"}</td>
      <td className="rank-name">
        {entry.username}
        {entry.me && <span className="rank-you"> (bạn)</span>}
      </td>
      <td className="rank-level">{label}</td>
      <td className="rank-stars">
        <StarRow count={entry.stars} size={16} />
      </td>
      {admin && (
        <td className="rank-admin">
          <button type="button" className="btn btn-ghost btn-small" disabled={admin.busy} onClick={admin.onToggle}>
            {entry.hidden ? "HIỆN" : "ẨN"}
          </button>
        </td>
      )}
    </tr>
  );
}

/**
 * "Bảng xếp hạng": the top players by the furthest unbroken starred level, then
 * its stars, then who got there first (decided on the server). The viewer's own
 * place follows the list when it is not in it. Admins can hide an account.
 */
export function RankingScreen({ api, userId, username, isAdmin, levelLabel, onBack, settle }: RankingScreenProps) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [adminError, setAdminError] = useState(false);

  const fetchRanking = useCallback(async () => {
    const r = await api.getRanking();
    setLoad(r.ok ? { kind: "ready", ranking: r.data } : { kind: "failed" });
  }, [api]);

  useEffect(() => {
    let live = true;
    void (async () => {
      await settle?.();
      if (live) await fetchRanking();
    })();
    return () => {
      live = false;
    };
  }, [fetchRanking]); // eslint-disable-line react-hooks/exhaustive-deps -- settle only matters for the first load

  const toggle = async (entry: RankingEntry) => {
    setBusy(entry.username);
    setAdminError(false);
    const r = await api.adminSetRankingHidden(entry.username, !entry.hidden, { userId });
    if (!r.ok) setAdminError(true);
    await fetchRanking();
    setBusy(null);
  };

  const retry = () => {
    setLoad({ kind: "loading" });
    void fetchRanking();
  };

  let body;
  if (load.kind === "loading") {
    body = (
      <p className="rank-note" role="status">
        Đang tải bảng xếp hạng…
      </p>
    );
  } else if (load.kind === "failed") {
    body = (
      <div className="rank-note" role="alert">
        <p>KHÔNG KẾT NỐI ĐƯỢC MÁY CHỦ</p>
        <button type="button" className="btn btn-ghost btn-small" onClick={retry}>
          THỬ LẠI
        </button>
      </div>
    );
  } else {
    const { entries, me, total } = load.ranking;
    const meListed = entries.some((e) => e.me);
    body = (
      <>
        {entries.length === 0 ? (
          <p className="rank-note">Chưa ai qua level nào.</p>
        ) : (
          <table className="rank-table">
            <thead>
              <tr>
                <th scope="col">Hạng</th>
                <th scope="col">Người chơi</th>
                <th scope="col">Level</th>
                <th scope="col">Sao</th>
                {isAdmin && <th scope="col">Quản lý</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <Row
                  key={e.username}
                  entry={e}
                  label={levelLabel(e.levelId)}
                  admin={isAdmin ? { busy: busy !== null, onToggle: () => void toggle(e) } : undefined}
                />
              ))}
              {me && !meListed && (
                <>
                  <tr className="rank-gap" aria-hidden="true">
                    <td colSpan={isAdmin ? 5 : 4}>…</td>
                  </tr>
                  <Row entry={{ rank: me.rank, username, levelId: me.levelId, stars: me.stars, me: true }} label={levelLabel(me.levelId)} />
                </>
              )}
            </tbody>
          </table>
        )}
        {!me && <p className="rank-note">Bạn chưa có hạng.</p>}
        {adminError && (
          <p className="rank-note" role="alert">
            Không đổi được trạng thái ẩn. Thử lại sau.
          </p>
        )}
        <p className="rank-total">{total} người chơi có hạng</p>
      </>
    );
  }

  return (
    <main className="screen learn-screen rank-screen">
      <article className="learn-panel" aria-labelledby="rank-title">
        <header className="learn-head">
          <p className="learn-eyebrow">Xếp theo level xa nhất đã qua liền mạch, rồi số sao ở level đó, rồi ai đạt trước</p>
          <h1 id="rank-title" className="learn-title">
            Bảng xếp hạng
          </h1>
        </header>
        <div className="learn-body" tabIndex={0} aria-label="Bảng xếp hạng">
          {body}
        </div>
        <footer className="learn-actions">
          <button type="button" className="btn btn-run" onClick={onBack} autoFocus>
            QUAY LẠI
          </button>
        </footer>
      </article>
    </main>
  );
}

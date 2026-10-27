import { useEffect, useRef } from "react";
import type { LevelDefinition } from "../game/level-types";
import type { CollectedComponent, NodeState } from "../story/progression";
import { LoreText } from "./lore-text";
import { MuteButton } from "./mute-button";
import { NeuralIdBar } from "./neural-id-bar";
import { StarRow } from "./star-icon";
import { storyLabel } from "./story-labels";

/** Trail positions in percent of the map box, from Lô 17 (bottom) up to Cổng Kiểm Soát (top). */
function trailPoint(i: number, count: number): { x: number; y: number } {
  const t = count <= 1 ? 0 : i / (count - 1);
  return { x: [28, 66, 36, 72, 30, 62, 46][i % 7], y: 90 - t * 80 };
}

const NOISE = "▓░▒▚▞▒░▓";

export interface ChapterMapProps {
  nodes: NodeState[];
  levels: ReadonlyMap<string, LevelDefinition>;
  totals: { stars: number; maxStars: number; slots: number; components: CollectedComponent[] };
  seenStories: string[];
  lore: { levelId: string; text: string }[];
  /** Passed levels with a knowledge summary, in chapter order. */
  knowledge: { levelId: string; title: string }[];
  persistent: boolean;
  muted: boolean;
  onPlay(levelId: string): void;
  onReplay(storyId: string): void;
  /** Re-open a passed level's knowledge summary ("Kiến thức"); it returns here. */
  onKnowledge(levelId: string): void;
  onTitle(): void;
  onToggleMute(): void;
}

function NodeButton({ node, level, onPlay, autoFocus }: { node: NodeState; level?: LevelDefinition; onPlay(id: string): void; autoFocus: boolean }) {
  const playable = node.status === "cleared" || node.status === "open";
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: false });
  }, [autoFocus]);
  let tag: string | null = null;
  if (node.status === "open" && node.next) tag = "TIẾP THEO";
  else if (node.status === "locked") tag = `Cần 1 sao ở ${node.requires}`;
  else if (node.status === "unbuilt") tag = "TÍN HIỆU ĐANG GIẢI MÃ";
  else if (node.status === "broken") tag = "TÍN HIỆU HỎNG";
  return (
    <button
      ref={ref}
      type="button"
      className={`map-node is-${node.status}${node.next ? " is-next" : ""}`}
      data-level={node.id}
      aria-disabled={playable ? undefined : true}
      onClick={() => playable && onPlay(node.id)}
    >
      <span className="map-node-dot" aria-hidden="true" />
      <span className="map-node-body">
        <span className="map-node-id">{node.id}</span>
        {level ? (
          <>
            <span className="map-node-title">{level.title}</span>
            {level.location && <span className="map-node-place">{level.location}</span>}
            <StarRow count={node.stars} size={12} />
          </>
        ) : (
          <span className="map-node-title map-node-noise" aria-hidden="true">
            {NOISE}
          </span>
        )}
        {node.status === "unbuilt" && <span className="sr-only">chưa dựng</span>}
        {node.status === "cleared" && <span className="sr-only">đã qua</span>}
        {node.status === "locked" && <span className="sr-only">khóa</span>}
        {tag && <span className="map-node-tag">{tag}</span>}
      </span>
    </button>
  );
}

/** Bản đồ Vùng Tối: presentational; every state comes from `progression.ts`. */
export function ChapterMap(props: ChapterMapProps) {
  const { nodes, levels, totals } = props;
  // Focus the "TIẾP THEO" node, else the first playable one.
  const nextAt = nodes.findIndex((n) => n.next);
  const focusAt = nextAt >= 0 ? nextAt : nodes.findIndex((n) => n.status === "open" || n.status === "cleared");
  const points = nodes.map((_, i) => trailPoint(i, nodes.length));
  const names = Object.fromEntries(totals.components.map((c) => [c.slot, c.name]));

  return (
    <main className="screen map-screen">
      <header className="topbar map-top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-name">MÃ CUỐI CÙNG</p>
            <h1 className="level-title">Bản đồ Vùng Tối</h1>
          </div>
        </div>
        {!props.persistent && (
          <p className="storage-flag" role="status" title="Không gửi được tiến độ lên máy chủ: phần chơi mới chỉ giữ trong phiên này.">
            CHẾ ĐỘ KHÔNG LƯU
          </p>
        )}
        <MuteButton muted={props.muted} onToggle={props.onToggleMute} />
        <button type="button" className="btn btn-ghost" onClick={props.onTitle}>
          MÀN TIÊU ĐỀ
        </button>
      </header>

      <section className="panel map-panel" aria-labelledby="map-title">
        <header className="panel-head">
          <h2 id="map-title" className="panel-title">Chương 1 · Vùng Tối</h2>
          <span className="panel-meta">Lô 17 → Cổng Kiểm Soát</span>
        </header>
        <div className="map-trail">
          <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
          </svg>
          <p className="map-end map-end-top" aria-hidden="true">Cổng Kiểm Soát</p>
          <p className="map-end map-end-bottom" aria-hidden="true">Lô 17</p>
          <ol className="map-nodes">
            {nodes.map((node, i) => (
              <li key={node.id} style={{ ["--x" as string]: `${points[i].x}%`, ["--y" as string]: `${points[i].y}%` }}>
                <NodeButton node={node} level={levels.get(node.id)} onPlay={props.onPlay} autoFocus={i === focusAt} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="map-side">
        <section className="panel map-id" aria-labelledby="map-id-title">
          <header className="panel-head">
            <h2 id="map-id-title" className="panel-title">Neural-ID giả</h2>
            <span className="panel-meta">
              Tổng sao <strong className="map-stars" data-testid="chapter-stars">{totals.stars}/{totals.maxStars}</strong>
            </span>
          </header>
          <NeuralIdBar slots={totals.slots} filled={totals.components.map((c) => c.slot)} names={names} />
        </section>

        <section className="panel" aria-labelledby="map-lore-title">
          <header className="panel-head">
            <h2 id="map-lore-title" className="panel-title">Nhật ký Kiến Trúc Sư</h2>
          </header>
          {props.lore.length === 0 ? (
            <p className="panel-note">Chưa thu được mảnh nhật ký nào.</p>
          ) : (
            <ul className="map-lore">
              {props.lore.map((l) => (
                <li key={l.levelId}>
                  <LoreText text={l.text} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="map-knowledge-title">
          <header className="panel-head">
            <h2 id="map-knowledge-title" className="panel-title">Kiến thức</h2>
          </header>
          {props.knowledge.length === 0 ? (
            <p className="panel-note">Qua một level để xem lại tổng kết kiến thức của level đó.</p>
          ) : (
            <ul className="map-knowledge">
              {props.knowledge.map((k) => (
                <li key={k.levelId}>
                  <button type="button" className="btn btn-ghost btn-small" data-level={k.levelId} onClick={() => props.onKnowledge(k.levelId)}>
                    <span className="sr-only">Kiến thức </span>
                    {k.levelId} · {k.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="map-stories-title">
          <header className="panel-head">
            <h2 id="map-stories-title" className="panel-title">Đoạn truyện</h2>
          </header>
          {props.seenStories.length === 0 ? (
            <p className="panel-note">Chưa xem đoạn truyện nào.</p>
          ) : (
            <ul className="map-stories">
              {props.seenStories.map((id) => (
                <li key={id}>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => props.onReplay(id)}>
                    {storyLabel(id)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </main>
  );
}

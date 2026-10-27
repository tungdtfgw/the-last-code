import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AccountApi, AccountUser, AdminDocKind, ContentTexts } from "../../account/account-api";
import { CHAPTER_TEXT, LEVEL_TEXT, type TextError } from "../../content/text-fields";
import { validateChapterText, validateLevelText } from "../../content/validate-text";
import { bundledLevelModules } from "../../game/level-registry";
import { bundledChapter } from "../../story/chapter";
import { formatWhen, sourceLine } from "./admin-format";
import { alignText, editorReducer, fieldInstances, initEditor, placeErrors, type EditorState } from "./editor-reducer";
import { TextFieldInput } from "./text-field-input";

export interface AdminEditorProps {
  api: AccountApi;
  user: AccountUser;
  kind: AdminDocKind;
  id: string;
  onBack(): void;
  onTextSaved(docId: string, entry: ContentTexts[string]): void;
  onSessionExpired(): void;
}

/** The bundled file for this document: the puzzle the form is drawn from (it holds no text). */
function bundledPuzzle(kind: AdminDocKind, id: string): unknown {
  if (kind === "chapter") {
    const chapter = bundledChapter() as { chapter?: unknown };
    return String(chapter.chapter) === id ? chapter : undefined;
  }
  return Object.values(bundledLevelModules()).find((m) => m && typeof m === "object" && (m as { id?: unknown }).id === id);
}

const titleOf = (puzzle: unknown) => (puzzle && typeof puzzle === "object" ? String((puzzle as { title?: unknown }).title ?? "") : "");

type Load =
  | { kind: "loading" }
  | { kind: "failed"; text: string }
  | { kind: "ready"; initial: EditorState; drift: string[] };

export function AdminEditor(props: AdminEditorProps) {
  const { api, kind, id, onSessionExpired } = props;
  const spec = kind === "level" ? LEVEL_TEXT : CHAPTER_TEXT;
  const puzzle = useMemo(() => bundledPuzzle(kind, id), [kind, id]);
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  const fetchDoc = useCallback(async () => {
    const res = await api.adminGetContent(kind, id);
    if (!res.ok) {
      if (res.status === 401) onSessionExpired();
      const missing = (res.body as { error?: string } | undefined)?.error === "no_text";
      return {
        error: missing
          ? "Tài liệu này chưa có câu chữ trong D1. Câu ban đầu đi bằng migration (npm run content:migration), trang này chỉ sửa câu đã có."
          : res.status === 404
            ? "Không có tài liệu này trên máy chủ."
            : "Chưa tải được tài liệu. Kiểm tra mạng rồi thử lại.",
      } as const;
    }
    const text = alignText(puzzle, res.data.text, spec);
    return {
      doc: res.data,
      state: initEditor({ revision: res.data.revision, text, updatedAt: res.data.updatedAt, updatedBy: res.data.updatedBy }, res.data.errors),
    } as const;
  }, [api, kind, id, puzzle, spec, onSessionExpired]);

  const reload = useCallback(async () => {
    setLoad({ kind: "loading" });
    const r = await fetchDoc();
    if ("error" in r) setLoad({ kind: "failed", text: r.error! });
    else setLoad({ kind: "ready", initial: r.state, drift: r.doc.drift });
  }, [fetchDoc]);

  useEffect(() => {
    if (puzzle) void reload();
  }, [puzzle, reload]);

  const heading = `${kind === "level" ? id : `Chương ${id}`} · ${titleOf(puzzle)}`;
  if (!puzzle) {
    return (
      <AdminFrame title={heading} onBack={props.onBack}>
        <p className="admin-banner is-error">Bản game này không có file của tài liệu {id}. Tải lại trang sau khi deploy xong.</p>
      </AdminFrame>
    );
  }
  if (load.kind !== "ready") {
    return (
      <AdminFrame title={heading} onBack={props.onBack}>
        {load.kind === "loading" ? (
          <p className="admin-help">Đang tải…</p>
        ) : (
          <div className="admin-banner is-error">
            <p>{load.text}</p>
            <button type="button" className="btn" onClick={() => void reload()}>
              Thử lại
            </button>
          </div>
        )}
      </AdminFrame>
    );
  }
  return <EditorForm {...props} key={load.initial.base.revision} heading={heading} puzzle={puzzle} load={load} fetchDoc={fetchDoc} />;
}

function AdminFrame(props: { title: string; onBack(): void; children: ReactNode; meta?: ReactNode }) {
  return (
    <main className="screen admin-screen">
      <header className="admin-top">
        <button type="button" className="btn btn-ghost" onClick={props.onBack}>
          Về danh sách
        </button>
        <h1 className="admin-title">
          <span className="admin-kicker">QUẢN LÝ KỊCH BẢN</span> {props.title}
        </h1>
        {props.meta}
      </header>
      <div className="admin-body admin-body-plain">{props.children}</div>
    </main>
  );
}

function EditorForm(
  props: AdminEditorProps & {
    heading: string;
    puzzle: unknown;
    load: Extract<Load, { kind: "ready" }>;
    fetchDoc(): Promise<{ readonly error: string } | { readonly doc: { drift: string[] }; readonly state: EditorState }>;
  },
) {
  const { api, user, kind, id, puzzle, onSessionExpired } = props;
  const spec = kind === "level" ? LEVEL_TEXT : CHAPTER_TEXT;
  const docId = `${kind}:${id}`;
  const [state, dispatch] = useReducer(editorReducer, props.load.initial);
  const [drift, setDrift] = useState(props.load.drift);
  const [historyOpen, setHistoryOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const focusError = useRef(false);

  const instances = useMemo(() => fieldInstances(spec, puzzle), [spec, puzzle]);
  const groups = useMemo(() => [...new Set(instances.map((f) => f.field.group))], [instances]);
  const inputPaths = useMemo(
    () =>
      instances.flatMap((f) => {
        const v = f.field.leaf;
        if (v.type === "list") return [f.path, ...Array.from({ length: v.max }, (_, i) => `${f.path}[${i}]`)];
        if (v.type === "map") return [f.path, ...v.keys.map((k) => `${f.path}.${k}`)];
        return [f.path];
      }),
    [instances],
  );
  const placed = useMemo(() => placeErrors(state.errors, inputPaths), [state.errors, inputPaths]);
  const dirtySet = useMemo(() => new Set(state.dirtyPaths), [state.dirtyPaths]);
  const dirty = state.dirtyPaths.length > 0;

  // After a refused save, bring the first wrong input into view.
  useEffect(() => {
    if (!focusError.current) return;
    focusError.current = false;
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], .admin-errors');
    el?.scrollIntoView({ block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
  }, [state.errors]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // One request at a time, whatever the render state (Ctrl+S held down, double click).
  const inFlight = useRef(false);
  const save = useCallback(async () => {
    if (inFlight.current) return;
    const check = kind === "level" ? validateLevelText(puzzle, state.draft) : validateChapterText(puzzle, state.draft);
    if (!check.ok) {
      focusError.current = true;
      return dispatch({ type: "invalid", errors: check.errors });
    }
    dispatch({ type: "saving" });
    inFlight.current = true;
    const res = await api.adminSaveContent(kind, id, state.base.revision, check.text, { userId: user.id }).finally(() => {
      inFlight.current = false;
    });
    if (res.ok) {
      dispatch({ type: "saved", revision: res.data.revision, updatedAt: res.data.updatedAt, updatedBy: user.username, text: check.text });
      setDrift([]);
      props.onTextSaved(docId, { revision: res.data.revision, text: check.text });
      return;
    }
    const body = (res.body ?? {}) as { errors?: TextError[]; revision?: number; updatedAt?: string | null; updatedBy?: string | null };
    if (res.status === 401) return onSessionExpired();
    if (res.status === 422 && Array.isArray(body.errors)) {
      focusError.current = true;
      return dispatch({ type: "invalid", errors: body.errors });
    }
    if (res.status === 409 && typeof body.revision === "number")
      return dispatch({ type: "stale", stale: { revision: body.revision, updatedAt: body.updatedAt ?? null, updatedBy: body.updatedBy ?? null } });
    dispatch({ type: "failed", text: "Chưa lưu được, thử lại. Câu bạn sửa vẫn còn trong form." });
  }, [state, kind, id, puzzle, api, user, docId, props, onSessionExpired]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (!e.repeat) void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const loadLatest = async () => {
    const r = await props.fetchDoc();
    if ("error" in r) return dispatch({ type: "failed", text: r.error });
    setDrift(r.doc.drift);
    dispatch({ type: "loadLatest", base: r.state.base, errors: r.state.errors });
  };

  const back = () => {
    if (dirty && !window.confirm("Còn thay đổi chưa lưu. Bỏ chúng và về danh sách?")) return;
    props.onBack();
  };

  const goGroup = (i: number) => document.getElementById(`admin-group-${i}`)?.scrollIntoView({ block: "start" });

  return (
    <main className="screen admin-screen">
      <header className="admin-top">
        <button type="button" className="btn btn-ghost" onClick={back}>
          Về danh sách
        </button>
        <h1 className="admin-title">
          <span className="admin-kicker">QUẢN LÝ KỊCH BẢN</span> {props.heading}
        </h1>
        <p className="admin-meta">{sourceLine(state.base)}</p>
      </header>
      <div className="admin-toolbar">
        <button type="button" className="btn btn-run" onClick={() => void save()} disabled={state.status === "saving"} aria-keyshortcuts="Control+S Meta+S">
          {state.status === "saving" ? "Đang lưu…" : "Lưu"}
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: "discard" })} disabled={!dirty || state.status === "saving"}>
          Bỏ thay đổi
        </button>
        <button type="button" className="btn btn-ghost" aria-expanded={historyOpen} onClick={() => setHistoryOpen((o) => !o)}>
          Lịch sử
        </button>
        <p className="admin-dirty" aria-live="polite">
          {dirty ? `● ${state.dirtyPaths.length} ô đã sửa` : ""}
        </p>
        <label className="admin-group-select">
          <span className="sr-only">Nhảy tới nhóm</span>
          <select
            defaultValue=""
            onChange={(e) => {
              goGroup(Number(e.target.value));
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Nhảy tới nhóm…
            </option>
            {groups.map((g, i) => (
              <option key={g} value={i}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-notices" aria-live="polite">
        {state.notice && (
          <p className={`admin-banner is-${state.notice.tone}`} role={state.notice.tone === "error" ? "alert" : undefined}>
            {state.notice.text}
          </p>
        )}
        {state.status === "stale" && state.stale && (
          <div className="admin-banner is-error" role="alert">
            <p>
              Có người vừa lưu bản {state.stale.revision} ({state.stale.updatedBy ?? "?"}, {formatWhen(state.stale.updatedAt)}). Bản của bạn chưa được lưu.
            </p>
            <div className="admin-banner-actions">
              <button type="button" className="btn" onClick={() => void loadLatest()}>
                Tải bản mới nhất
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "stay" })}>
                Ở lại
              </button>
            </div>
          </div>
        )}
        {drift.length > 0 && (
          <p className="admin-banner is-info">
            Lệch cấu trúc: câu đố đã đổi ở {drift.join(", ")}. Các ô ở đó đang trống; điền câu rồi bấm Lưu để ghi lại theo cấu trúc mới.
          </p>
        )}
        {placed.unplaced.length > 0 && (
          <ul className="admin-banner is-error admin-errors">
            {placed.unplaced.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={`admin-body${historyOpen ? " has-history" : ""}`}>
        <nav className="admin-nav" aria-label="Nhóm câu chữ">
          {groups.map((g, i) => (
            <button key={g} type="button" className="admin-nav-item" onClick={() => goGroup(i)}>
              {g}
            </button>
          ))}
        </nav>
        <div className="admin-form" ref={formRef}>
          {groups.map((g, gi) => (
            <section key={g} id={`admin-group-${gi}`} className="admin-section" aria-labelledby={`admin-group-${gi}-h`}>
              <h2 id={`admin-group-${gi}-h`} className="admin-section-title">
                {g}
              </h2>
              {instances
                .filter((f) => f.field.group === g)
                .map((f) => (
                  <TextFieldInput
                    key={f.path}
                    instance={f}
                    draft={state.draft}
                    errorsAt={(p) => placed.byPath.get(p) ?? []}
                    dirty={(p) => dirtySet.has(p) || [...dirtySet].some((d) => d.startsWith(`${p}.`) || d.startsWith(`${p}[`))}
                    onEdit={(path, value) => dispatch({ type: "edit", path, value })}
                  />
                ))}
            </section>
          ))}
        </div>
        {historyOpen && (
          <HistoryPanel
            api={api}
            kind={kind}
            id={id}
            current={state.base.revision}
            onLoad={(revision, text) => dispatch({ type: "loadRevision", revision, text: alignText(puzzle, text, spec) })}
            onSessionExpired={onSessionExpired}
          />
        )}
      </div>
    </main>
  );
}

function HistoryPanel(props: {
  api: AccountApi;
  kind: AdminDocKind;
  id: string;
  current: number;
  onLoad(revision: number, text: unknown): void;
  onSessionExpired(): void;
}) {
  const { api, kind, id, current, onSessionExpired } = props;
  const [rows, setRows] = useState<{ revision: number; savedAt: string; savedBy: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void api.adminHistory(kind, id).then((res) => {
      if (!live) return;
      if (res.ok) setRows(res.data.revisions);
      else if (res.status === 401) onSessionExpired();
      else setError("Chưa tải được lịch sử.");
    });
    return () => {
      live = false;
    };
  }, [api, kind, id, current, onSessionExpired]);

  const load = async (revision: number) => {
    const res = await api.adminRevision(kind, id, revision);
    if (res.ok) props.onLoad(revision, res.data.text);
    else if (res.status === 401) onSessionExpired();
    else setError(`Chưa tải được bản ${revision}.`);
  };

  return (
    <aside className="admin-history" aria-label="Lịch sử các bản">
      <h2 className="admin-section-title">Lịch sử</h2>
      {error && <p className="admin-banner is-error">{error}</p>}
      {rows === null && !error && <p className="admin-help">Đang tải…</p>}
      {rows?.length === 0 && <p className="admin-help">Chưa có bản nào trong D1.</p>}
      <ol className="admin-history-list">
        {rows?.map((r) => (
          <li key={r.revision}>
            <span>
              Bản {r.revision} · {r.savedBy} · {formatWhen(r.savedAt)}
              {r.revision === current ? " (hiện hành)" : ""}
            </span>
            <button type="button" className="btn btn-ghost admin-mini" onClick={() => void load(r.revision)}>
              Nạp vào form
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

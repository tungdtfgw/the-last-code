import { applyText, extractText, isObject, type TextError, type TextField, type TextSpec } from "../../content/text-fields";

/** One input on the form: a described field at a concrete path (`objectives[1].label`). */
export interface FieldInstance {
  field: TextField;
  path: string;
  /** Where it belongs, read from the puzzle's anchors: `ma_xac_thuc`, `dòng 2`, `echo`. */
  context: string | null;
}

const BEAT_KIND: Record<string, string> = { log: "nhật ký", kai: "Kai", echo: "ECHO", card: "thẻ" };

function contextOf(el: unknown, i: number): string {
  if (!isObject(el)) return `#${i + 1}`;
  if (typeof el.var === "string") return el.var;
  if (typeof el.line === "number") return `dòng ${el.line}`;
  if (typeof el.kind === "string") return `${i + 1} · ${BEAT_KIND[el.kind] ?? el.kind}`;
  if (typeof el.code === "string") return el.code.split("\n")[0];
  return `#${i + 1}`;
}

/** Every input of a document, in spec order, expanding `[]` over the puzzle's own arrays. */
export function fieldInstances(spec: TextSpec, puzzle: unknown): FieldInstance[] {
  const out: FieldInstance[] = [];
  for (const field of spec.fields) {
    const walk = (node: unknown, parts: string[], path: string, context: string | null) => {
      const [part, ...rest] = parts;
      const array = part.endsWith("[]");
      const key = array ? part.slice(0, -2) : part;
      const here = path ? `${path}.${key}` : key;
      if (rest.length === 0) return out.push({ field, path: here, context });
      if (!isObject(node)) return;
      const child = node[key];
      if (array) {
        if (Array.isArray(child)) child.forEach((el, i) => walk(el, rest, `${here}[${i}]`, contextOf(el, i)));
      } else if (isObject(child)) walk(child, rest, here, context);
    };
    walk(puzzle, field.path.split("."), "", null);
  }
  return out;
}

type Token = string | number;

export function parsePath(path: string): Token[] {
  const out: Token[] = [];
  for (const m of path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)) out.push(m[2] !== undefined ? Number(m[2]) : m[1]);
  return out;
}

export function getAt(root: unknown, path: string): unknown {
  let node = root;
  for (const t of parsePath(path)) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[t as string];
  }
  return node;
}

/** Returns a copy with `value` at `path`; `undefined` removes the key. Missing parents are created. */
export function setAt<T>(root: T, path: string, value: unknown): T {
  const copy = JSON.parse(JSON.stringify(root ?? {})) as Record<string, unknown>;
  const tokens = parsePath(path);
  let node: Record<string | number, unknown> = copy;
  tokens.slice(0, -1).forEach((t, i) => {
    if (node[t] === null || typeof node[t] !== "object") node[t] = typeof tokens[i + 1] === "number" ? [] : {};
    node = node[t] as Record<string | number, unknown>;
  });
  const last = tokens[tokens.length - 1];
  if (value === undefined) {
    if (Array.isArray(node) && typeof last === "number") node.splice(last, 1);
    else delete node[last];
  } else node[last] = value;
  return copy as T;
}

/** Paths of the values that differ (strings and list items), for the "n ô đã sửa" count. */
export function diffPaths(a: unknown, b: unknown, path = ""): string[] {
  if (a === b) return [];
  const join = (k: string | number) => (typeof k === "number" ? `${path}[${k}]` : path ? `${path}.${k}` : k);
  if (Array.isArray(a) && Array.isArray(b)) {
    const out: string[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) out.push(...diffPaths(a[i], b[i], join(i)));
    return out;
  }
  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) => diffPaths(a[k], b[k], join(k)));
  }
  return [path];
}

const isUnder = (ancestor: string, path: string) => path.startsWith(`${ancestor}.`) || path.startsWith(`${ancestor}[`);

/**
 * Places each error on one input: the input with its exact path, else the first
 * input under it (`objectives[1]` → `objectives[1].label`), else the closest
 * input above it (`reactions.made_up` → `reactions`). The rest go on top of the form.
 */
export function placeErrors(errors: TextError[], inputs: string[]): { byPath: Map<string, TextError[]>; unplaced: TextError[] } {
  const byPath = new Map<string, TextError[]>();
  const unplaced: TextError[] = [];
  for (const e of errors) {
    const target =
      (e.path && inputs.find((p) => p === e.path)) ||
      (e.path && inputs.find((p) => isUnder(e.path, p))) ||
      (e.path && inputs.filter((p) => isUnder(p, e.path)).sort((x, y) => y.length - x.length)[0]);
    if (target) byPath.set(target, [...(byPath.get(target) ?? []), e]);
    else unplaced.push(e);
  }
  return { byPath, unplaced };
}

/** The text realigned on today's puzzle: drifted elements keep the right anchors and lose their text (the form shows them empty). */
export const alignText = (puzzle: unknown, text: unknown, spec: TextSpec) => extractText(applyText(puzzle, text, spec).doc, spec);

export interface BaseInfo {
  revision: number;
  text: Record<string, unknown>;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface StaleInfo {
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface EditorState {
  base: BaseInfo;
  draft: Record<string, unknown>;
  dirtyPaths: string[];
  errors: TextError[];
  status: "idle" | "saving" | "stale" | "saved";
  stale: StaleInfo | null;
  /** One-line message under the toolbar ("Đã lưu bản 8", "Chưa lưu được…"). */
  notice: { tone: "ok" | "error" | "info"; text: string } | null;
}

export type EditorAction =
  | { type: "edit"; path: string; value: unknown }
  | { type: "invalid"; errors: TextError[] }
  | { type: "saving" }
  /** `text`: what was sent; edits typed while the request was out stay dirty against it. */
  | { type: "saved"; revision: number; updatedAt: string; updatedBy: string; text: Record<string, unknown> }
  | { type: "stale"; stale: StaleInfo }
  | { type: "failed"; text: string }
  /** "Tải bản mới nhất" after a conflict: the newest revision replaces base and draft. */
  | { type: "loadLatest"; base: BaseInfo; errors?: TextError[] }
  /** An old revision goes into the form; the base revision stays the current one. */
  | { type: "loadRevision"; revision: number; text: Record<string, unknown> }
  | { type: "discard" }
  | { type: "stay" };

export const initEditor = (base: BaseInfo, errors: TextError[] = []): EditorState => ({
  base,
  draft: base.text,
  dirtyPaths: [],
  errors,
  status: "idle",
  stale: null,
  notice: null,
});

const touches = (e: TextError, path: string) => e.path === path || isUnder(e.path, path) || isUnder(path, e.path);

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "edit": {
      const draft = setAt(state.draft, action.path, action.value);
      return {
        ...state,
        draft,
        dirtyPaths: diffPaths(state.base.text, draft),
        errors: state.errors.filter((e) => !e.path || !touches(e, action.path)),
        status: state.status === "stale" || state.status === "saving" ? state.status : "idle",
        notice: state.status === "saved" ? null : state.notice,
      };
    }
    case "invalid":
      return { ...state, errors: action.errors, status: state.status === "stale" ? "stale" : "idle", notice: null };
    case "saving":
      return { ...state, status: "saving", notice: null };
    case "saved":
      return {
        ...state,
        base: { revision: action.revision, text: action.text, updatedAt: action.updatedAt, updatedBy: action.updatedBy },
        dirtyPaths: diffPaths(action.text, state.draft),
        errors: [],
        status: "saved",
        stale: null,
        notice: { tone: "ok", text: `Đã lưu bản ${action.revision}.` },
      };
    case "stale":
      return { ...state, status: "stale", stale: action.stale, notice: null };
    case "failed":
      return { ...state, status: state.stale ? "stale" : "idle", notice: { tone: "error", text: action.text } };
    case "loadLatest":
      return initEditor(action.base, action.errors);
    case "loadRevision":
      return {
        ...state,
        draft: action.text,
        dirtyPaths: diffPaths(state.base.text, action.text),
        errors: [],
        notice: { tone: "info", text: `Đã nạp bản ${action.revision} vào form. Bấm Lưu để dùng lại bản này.` },
        status: state.status === "stale" ? "stale" : "idle",
      };
    case "discard":
      return { ...state, draft: state.base.text, dirtyPaths: [], errors: [], notice: null, status: state.status === "stale" ? "stale" : "idle" };
    case "stay":
      return { ...state, notice: { tone: "info", text: "Bản của bạn vẫn trong form, chưa được lưu. Chép câu cần giữ rồi tải bản mới nhất." } };
  }
}

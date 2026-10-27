import { REACTION_KEYS } from "../game/level-types.js";

/**
 * Which fields of a level or chapter file are player-facing text: the text the
 * admin page edits and the server stores in D1. Everything else in the file is
 * the puzzle and stays in the bundled JSON. The game, the server, the migration
 * script and the admin form all work from this description, so a new level with
 * the same schema needs no code. A new text field in the schema must be added
 * here (`text-fields.test.ts` fails otherwise). The repo files hold the puzzle
 * only; the text of every document lives in D1 and arrives there by migration.
 */

export type TextLeaf =
  | { type: "string"; max?: number; multiline?: boolean; optional?: boolean }
  | { type: "list"; min: number; max: number; optional?: boolean }
  | { type: "map"; keys: readonly string[]; required: readonly string[]; optional?: boolean };

export interface TextField {
  /** `[]` walks an array of the puzzle file: `objectives[].label`, `knowledge_summary.sections[].body`. */
  path: string;
  /** Form label (Vietnamese). */
  label: string;
  help?: string;
  /** Form section. */
  group: string;
  leaf: TextLeaf;
}

/** Keys that tie an array element of the text to the same element of the puzzle. Shown, never written. */
export interface ArrayAnchor {
  path: string;
  anchor: readonly string[];
}

export interface TextSpec {
  fields: readonly TextField[];
  anchors: readonly ArrayAnchor[];
}

export interface TextError {
  path: string;
  message: string;
}

const PLACEHOLDERS = "Lúc chạy, game thay chỗ giữ chỗ bằng dữ liệu thật: {line} dòng lỗi, {vars} tên biến, {error_type} loại lỗi, {count} số lần, {out_line} dòng in ra, {col} cột.";
const BEAT_TEXT: TextLeaf = { type: "string", max: 400, multiline: true };

export const LEVEL_TEXT: TextSpec = {
  fields: [
    { path: "location", label: "Địa điểm (cổng vào và tên khung mô phỏng)", group: "Vào nhiệm vụ", leaf: { type: "string", max: 60, optional: true } },
    { path: "briefing", label: "Lời dẫn nhiệm vụ", group: "Vào nhiệm vụ", leaf: { type: "string", multiline: true } },
    {
      path: "task_steps",
      label: "Việc cần làm",
      help: "2–4 bước, không nêu đáp án. Chữ trong dấu `…` hiện như code.",
      group: "Vào nhiệm vụ",
      leaf: { type: "list", min: 2, max: 4, optional: true },
    },
    { path: "objectives[].label", label: "Mục tiêu", group: "Mục tiêu", leaf: { type: "string" } },
    { path: "hints", label: "Gợi ý (3 mức)", group: "Gợi ý", leaf: { type: "list", min: 3, max: 3 } },
    { path: "reactions", label: "Lời ECHO theo kết quả chạy", help: PLACEHOLDERS, group: "Lời ECHO", leaf: { type: "map", keys: REACTION_KEYS, required: ["generic"] } },
    {
      path: "reaction_variants",
      label: "Câu thay thế khi cùng kết quả lặp lại",
      help: "Chỉ dùng cho khóa đã có câu chính. " + PLACEHOLDERS,
      group: "Lời ECHO",
      leaf: { type: "map", keys: REACTION_KEYS, required: [], optional: true },
    },
    { path: "counter_attack_banner", label: "Dòng báo phản công", group: "Lời ECHO", leaf: { type: "string", optional: true } },
    { path: "outro", label: "Đoạn kết", group: "Đoạn kết", leaf: { type: "string", multiline: true } },
    { path: "lore_fragment", label: "Mảnh tài liệu", group: "Đoạn kết", leaf: { type: "string", multiline: true } },
    { path: "component", label: "Thành phần Neural-ID", group: "Đoạn kết", leaf: { type: "string", max: 60, optional: true } },
    { path: "outro_beats[].text", label: "Nhịp truyện sau màn", group: "Đoạn kết", leaf: BEAT_TEXT },
    { path: "knowledge_summary.title", label: "Tiêu đề tổng kết", group: "Tổng kết kiến thức", leaf: { type: "string" } },
    { path: "knowledge_summary.sections[].heading", label: "Tiêu đề mục", group: "Tổng kết kiến thức", leaf: { type: "string" } },
    { path: "knowledge_summary.sections[].body", label: "Nội dung mục", group: "Tổng kết kiến thức", leaf: { type: "string", multiline: true } },
    { path: "knowledge_summary.mistakes[].explain", label: "Giải thích lỗi thường gặp", group: "Tổng kết kiến thức", leaf: { type: "string", multiline: true } },
    { path: "knowledge_summary.next", label: "Ở màn sau", group: "Tổng kết kiến thức", leaf: { type: "string", multiline: true } },
  ],
  anchors: [
    { path: "objectives", anchor: ["var", "line"] },
    { path: "outro_beats", anchor: ["kind"] },
    { path: "knowledge_summary.sections", anchor: [] },
    { path: "knowledge_summary.mistakes", anchor: ["code"] },
  ],
};

export const CHAPTER_TEXT: TextSpec = {
  fields: [
    { path: "prologue[].text", label: "Nhịp mở đầu", group: "Mở đầu", leaf: BEAT_TEXT },
    { path: "teaser[].text", label: "Nhịp còn tiếp", group: "Còn tiếp", leaf: BEAT_TEXT },
  ],
  anchors: [
    { path: "prologue", anchor: ["kind"] },
    { path: "teaser", anchor: ["kind"] },
  ],
};

type Obj = Record<string, unknown>;
export const isObject = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

interface Segment {
  key: string;
  array: boolean;
  /** Path of this segment without indices (`knowledge_summary.sections`), for anchor lookup. */
  at: string;
}

function segments(path: string): Segment[] {
  const out: Segment[] = [];
  let at = "";
  for (const part of path.split(".")) {
    const array = part.endsWith("[]");
    const key = array ? part.slice(0, -2) : part;
    at = at ? `${at}.${key}` : key;
    out.push({ key, array, at });
  }
  return out;
}

const join = (base: string, key: string) => (base ? `${base}.${key}` : key);
const anchorKeys = (spec: TextSpec, at: string) => spec.anchors.find((a) => a.path === at)?.anchor ?? [];

/** The text document of a full level or chapter file: text leaves plus anchor keys, same tree. */
export function extractText(doc: unknown, spec: TextSpec): Obj {
  const out: Obj = {};
  if (!isObject(doc)) return out;
  for (const field of spec.fields) {
    const walk = (src: Obj, dst: Obj, segs: Segment[]) => {
      const [seg, ...rest] = segs;
      const value = src[seg.key];
      if (rest.length === 0) {
        if (value !== undefined) dst[seg.key] = clone(value);
        return;
      }
      if (seg.array) {
        if (!Array.isArray(value)) return;
        const keys = anchorKeys(spec, seg.at);
        const arr = (dst[seg.key] ??= value.map((el) => {
          const node: Obj = {};
          if (isObject(el)) for (const k of keys) if (el[k] !== undefined) node[k] = el[k];
          return node;
        })) as Obj[];
        value.forEach((el, i) => isObject(el) && walk(el, arr[i], rest));
        return;
      }
      if (!isObject(value)) return;
      walk(value, (dst[seg.key] ??= {}) as Obj, rest);
    };
    walk(doc, out, segments(field.path));
  }
  return out;
}

/** The file without its text: every described leaf removed, anchors and puzzle fields kept. */
export function stripText<T>(doc: T, spec: TextSpec): T {
  const out = clone(doc);
  for (const field of spec.fields) {
    const walk = (node: unknown, segs: Segment[]) => {
      if (!isObject(node)) return;
      const [seg, ...rest] = segs;
      if (rest.length === 0) return void delete node[seg.key];
      const next = node[seg.key];
      if (seg.array) {
        if (Array.isArray(next)) next.forEach((el) => walk(el, rest));
      } else walk(next, rest);
    };
    walk(out, segments(field.path));
  }
  return out;
}

const sameAnchors =(puzzle: unknown, text: unknown, keys: readonly string[]) =>
  isObject(puzzle) && isObject(text) && keys.every((k) => puzzle[k] === text[k]);

/**
 * Writes the text onto a deep copy of the puzzle file. Only described leaves are
 * written. An array element of the text is used only when its anchors match the
 * puzzle element at the same index; otherwise (and for missing or extra
 * elements, or a required leaf the text lacks) nothing is written there and the
 * element is listed in `drift`. An optional leaf missing from the text is removed.
 */
export function applyText(puzzle: unknown, text: unknown, spec: TextSpec): { doc: unknown; drift: string[] } {
  const doc = clone(puzzle);
  if (!isObject(text) || !isObject(doc)) return { doc, drift: ["*"] };
  const drift = new Set<string>();
  for (const field of spec.fields) {
    const walk = (dst: Obj, src: unknown, segs: Segment[], path: string) => {
      const [seg, ...rest] = segs;
      const here = join(path, seg.key);
      const given = isObject(src) ? src[seg.key] : undefined;
      if (rest.length === 0) {
        if (given !== undefined) dst[seg.key] = clone(given);
        else if (field.leaf.optional) delete dst[seg.key];
        else drift.add(here);
        return;
      }
      const target = dst[seg.key];
      if (seg.array) {
        if (!Array.isArray(target)) {
          if (given !== undefined) drift.add(here);
          return;
        }
        const keys = anchorKeys(spec, seg.at);
        const texts = Array.isArray(given) ? given : [];
        target.forEach((el, i) => {
          if (!isObject(el)) return;
          if (sameAnchors(el, texts[i], keys)) walk(el, texts[i], rest, `${here}[${i}]`);
          else drift.add(`${here}[${i}]`);
        });
        for (let i = target.length; i < texts.length; i++) drift.add(`${here}[${i}]`);
        return;
      }
      if (!isObject(target)) {
        if (given !== undefined) drift.add(here);
        return;
      }
      walk(target, given, rest, here);
    };
    walk(doc, text, segments(field.path), "");
  }
  return { doc, drift: [...drift] };
}

interface ShapeNode {
  leaf?: TextLeaf;
  array: boolean;
  anchors: readonly string[];
  children: Map<string, ShapeNode>;
}

function shapeTree(spec: TextSpec): ShapeNode {
  const root: ShapeNode = { array: false, anchors: [], children: new Map() };
  for (const field of spec.fields) {
    let node = root;
    const segs = segments(field.path);
    segs.forEach((seg, i) => {
      let child = node.children.get(seg.key);
      if (!child) {
        child = { array: seg.array, anchors: seg.array ? anchorKeys(spec, seg.at) : [], children: new Map() };
        node.children.set(seg.key, child);
      }
      if (i === segs.length - 1) child.leaf = field.leaf;
      node = child;
    });
  }
  return root;
}

const NOT_EDITABLE = "trường này không sửa được ở trang quản lý";

function checkLeaf(value: unknown, leaf: TextLeaf, path: string, errors: TextError[]) {
  const push = (message: string, at = path) => errors.push({ path: at, message: `${at}: ${message}` });
  switch (leaf.type) {
    case "string":
      if (typeof value !== "string") push("phải là chuỗi");
      else if (leaf.max !== undefined && value.length > leaf.max) push(`dài quá ${leaf.max} ký tự (đang có ${value.length})`);
      return;
    case "list":
      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) push("phải là danh sách chuỗi");
      else if (value.length < leaf.min || value.length > leaf.max)
        push(leaf.min === leaf.max ? `phải có đúng ${leaf.min} mục` : `phải có ${leaf.min}–${leaf.max} mục (đang có ${value.length})`);
      return;
    case "map":
      if (!isObject(value)) return push("phải là object");
      for (const [k, v] of Object.entries(value)) {
        if (!leaf.keys.includes(k)) push(`khóa lạ "${k}"`, `${path}.${k}`);
        else if (typeof v !== "string") push("phải là chuỗi", `${path}.${k}`);
      }
      for (const k of leaf.required) if (value[k] === undefined) push(`thiếu khóa "${k}"`);
  }
}

function checkObject(value: Obj, node: ShapeNode, path: string, anchors: readonly string[], errors: TextError[]) {
  for (const [k, v] of Object.entries(value)) {
    const at = join(path, k);
    if (anchors.includes(k)) {
      if (typeof v !== "string" && typeof v !== "number") errors.push({ path: at, message: `${at}: neo phải là chuỗi hoặc số` });
      continue;
    }
    const child = node.children.get(k);
    if (!child) {
      errors.push({ path: at, message: `${at}: ${NOT_EDITABLE}` });
      continue;
    }
    if (child.leaf) checkLeaf(v, child.leaf, at, errors);
    else if (child.array) {
      if (!Array.isArray(v)) errors.push({ path: at, message: `${at}: phải là mảng` });
      else
        v.forEach((el, i) => {
          if (isObject(el)) checkObject(el, child, `${at}[${i}]`, child.anchors, errors);
          else errors.push({ path: `${at}[${i}]`, message: `${at}[${i}]: phải là object` });
        });
    } else if (!isObject(v)) errors.push({ path: at, message: `${at}: phải là object` });
    else checkObject(v, child, at, [], errors);
  }
  // A leaf the puzzle requires must be present wherever its parent is.
  for (const [k, child] of node.children) {
    if (child.leaf && !child.leaf.optional && value[k] === undefined) {
      const at = join(path, k);
      errors.push({ path: at, message: `${at}: thiếu` });
    }
  }
}

/** Shape of a text document sent to the server: described keys and anchors only, right types and counts. */
export function checkTextShape(text: unknown, spec: TextSpec): TextError[] {
  if (!isObject(text)) return [{ path: "", message: "câu chữ phải là một object" }];
  const errors: TextError[] = [];
  checkObject(text, shapeTree(spec), "", [], errors);
  return errors;
}

/** Every string NFC-normalised, the way the harness compares strings. */
export function normalizeText<T>(value: T): T {
  if (typeof value === "string") return value.normalize("NFC") as T;
  if (Array.isArray(value)) return value.map(normalizeText) as T;
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeText(v)])) as T;
  return value;
}

/**
 * The field path at the start of a validator message (`task_steps[1] lộ đáp án…`
 * → `task_steps[1]`, `reactions.wrong_value phải là chuỗi` → `reactions.wrong_value`).
 */
export function errorPath(message: string): string | null {
  const m = /^([A-Za-z_]\w*(?:\[\d+\])*(?:\.[A-Za-z_]\w*(?:\[\d+\])*)*)(?=[\s:]|$)/.exec(message);
  return m ? m[1] : null;
}

/** Deep equality for JSON values (key order ignored). */
export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => sameJson(v, b[i]));
  if (isObject(a) && isObject(b)) {
    const ka = Object.keys(a).filter((k) => a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => sameJson(a[k], b[k]));
  }
  return false;
}

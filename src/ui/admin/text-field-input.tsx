import { useId, useLayoutEffect, useRef, type ChangeEvent, type ReactNode } from "react";
import type { TextError } from "../../content/text-fields";
import { getAt, type FieldInstance } from "./editor-reducer";

interface Props {
  instance: FieldInstance;
  draft: Record<string, unknown>;
  errorsAt(path: string): TextError[];
  dirty(path: string): boolean;
  onEdit(path: string, value: unknown): void;
}

/** A textarea that grows with its text, so long lines are read without inner scrolling. */
function AutoTextarea(props: {
  id: string;
  value: string;
  onChange(v: string): void;
  invalid: boolean;
  describedBy?: string;
  rows?: number;
  path: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return (
    <textarea
      ref={ref}
      id={props.id}
      className="admin-input"
      rows={props.rows ?? 2}
      value={props.value}
      spellCheck={false}
      data-path={props.path}
      aria-invalid={props.invalid || undefined}
      aria-describedby={props.describedBy}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => props.onChange(e.target.value)}
    />
  );
}

function Errors({ id, errors }: { id: string; errors: TextError[] }) {
  if (errors.length === 0) return null;
  return (
    <ul id={id} className="admin-errors">
      {errors.map((e, i) => (
        <li key={i}>{e.message}</li>
      ))}
    </ul>
  );
}

/** One text input (single line or growing textarea) with its counter, errors and dirty mark. */
function TextInput(props: {
  path: string;
  label: string;
  value: string;
  max?: number;
  multiline?: boolean;
  errors: TextError[];
  dirty: boolean;
  onChange(v: string): void;
  extra?: ReactNode;
}) {
  const id = useId();
  const errId = `${id}-err`;
  const invalid = props.errors.length > 0;
  return (
    <div className={`admin-item${props.dirty ? " is-dirty" : ""}`}>
      <div className="admin-item-head">
        <label htmlFor={id}>{props.label}</label>
        <code className="admin-path">{props.path}</code>
        {props.extra}
      </div>
      {props.multiline ? (
        <AutoTextarea id={id} path={props.path} value={props.value} onChange={props.onChange} invalid={invalid} describedBy={invalid ? errId : undefined} />
      ) : (
        <input
          id={id}
          className="admin-input"
          value={props.value}
          spellCheck={false}
          data-path={props.path}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errId : undefined}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      {props.max !== undefined && (
        <p className={`admin-count${props.value.length > props.max ? " is-over" : ""}`}>
          {props.value.length}/{props.max}
        </p>
      )}
      <Errors id={errId} errors={props.errors} />
    </div>
  );
}

/** Draws one described field from its leaf type; nothing here knows a level. */
export function TextFieldInput({ instance, draft, errorsAt, dirty, onEdit }: Props) {
  const { field, path, context } = instance;
  const { leaf } = field;
  const value = getAt(draft, path);
  const label = context ? `${field.label} · ${context}` : field.label;
  const present = value !== undefined;
  const headId = useId();

  if (leaf.optional && !present) {
    const empty = leaf.type === "list" ? Array.from({ length: leaf.min }, () => "") : leaf.type === "map" ? {} : "";
    return (
      <div className="admin-item is-absent">
        <div className="admin-item-head">
          <span className="admin-label">{label}</span>
          <code className="admin-path">{path}</code>
          <button type="button" className="btn btn-ghost admin-mini" onClick={() => onEdit(path, empty)}>
            Thêm
          </button>
        </div>
        <p className="admin-help">Chưa có câu. Bấm Thêm để viết.</p>
        <Errors id={`${headId}-err`} errors={errorsAt(path)} />
      </div>
    );
  }

  const remove = leaf.optional ? (
    <button type="button" className="btn btn-ghost admin-mini" onClick={() => onEdit(path, undefined)}>
      Bỏ trường này
    </button>
  ) : null;

  if (leaf.type === "string") {
    return (
      <TextInput
        path={path}
        label={label}
        value={typeof value === "string" ? value : ""}
        max={leaf.max}
        multiline={leaf.multiline}
        errors={errorsAt(path)}
        dirty={dirty(path)}
        onChange={(v) => onEdit(path, v)}
        extra={remove}
      />
    );
  }

  if (leaf.type === "list") {
    const items = Array.isArray(value) ? value.map((v) => (typeof v === "string" ? v : "")) : [];
    return (
      <fieldset className="admin-group-field" aria-describedby={errorsAt(path).length ? `${headId}-err` : undefined}>
        <legend className="admin-item-head">
          <span className="admin-label">{label}</span>
          <code className="admin-path">{path}</code>
          {remove}
        </legend>
        {field.help && <p className="admin-help">{field.help}</p>}
        <Errors id={`${headId}-err`} errors={errorsAt(path)} />
        {items.map((item, i) => (
          <TextInput
            key={i}
            path={`${path}[${i}]`}
            label={`Mục ${i + 1}`}
            value={item}
            multiline
            errors={errorsAt(`${path}[${i}]`)}
            dirty={dirty(`${path}[${i}]`)}
            onChange={(v) => onEdit(`${path}[${i}]`, v)}
            extra={
              items.length > leaf.min ? (
                <button type="button" className="btn btn-ghost admin-mini" onClick={() => onEdit(path, items.filter((_, j) => j !== i))}>
                  Xóa mục
                </button>
              ) : null
            }
          />
        ))}
        {items.length < leaf.max && (
          <button type="button" className="btn btn-ghost admin-mini admin-add" onClick={() => onEdit(path, [...items, ""])}>
            Thêm mục
          </button>
        )}
      </fieldset>
    );
  }

  // Map: one input per allowed key; an empty optional key means "no line for this case".
  const map = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return (
    <fieldset className="admin-group-field" aria-describedby={errorsAt(path).length ? `${headId}-err` : undefined}>
      <legend className="admin-item-head">
        <span className="admin-label">{label}</span>
        <code className="admin-path">{path}</code>
        {remove}
      </legend>
      {field.help && <p className="admin-help">{field.help}</p>}
      <Errors id={`${headId}-err`} errors={errorsAt(path)} />
      {leaf.keys.map((key) => {
        const keyPath = `${path}.${key}`;
        const required = leaf.required.includes(key);
        const v = map[key];
        return (
          <TextInput
            key={key}
            path={keyPath}
            label={required ? `${key} (bắt buộc)` : key}
            value={typeof v === "string" ? v : ""}
            multiline
            errors={errorsAt(keyPath)}
            dirty={dirty(keyPath)}
            onChange={(next) => onEdit(keyPath, next === "" && !required ? undefined : next)}
          />
        );
      })}
    </fieldset>
  );
}

import type { LevelProgress, ProgressSnapshotDto, StoryProgress } from "../storage/progress-repository";

export interface AccountUser {
  id: string;
  username: string;
  email: string;
  /** Username is in the server's `ADMIN_USERNAMES`; only shows the admin entry, the server checks every request. */
  isAdmin?: boolean;
}

/** Text saved on the admin page, keyed by doc id (`level:1.4`, `chapter:1`); only documents with a row in D1. */
export type ContentTexts = Record<string, { revision: number; text: unknown }>;

export type AdminDocKind = "level" | "chapter";

export interface AdminDocSummary {
  docId: string;
  kind: AdminDocKind;
  id: string;
  title: string;
  /** 0: no row in D1; the document waits for its text migration and cannot be opened. */
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
  drift: string[];
  errors: { path: string; message: string }[];
}

export interface AdminDoc extends AdminDocSummary {
  text: unknown;
}

/** `status` 0 means the request never got an answer (offline, DNS, aborted). */
export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; retryAfterSec?: number; email?: string; body?: unknown };

export type Fetch = typeof fetch;

/** `userId` makes the server refuse the write if the session now belongs to someone else. */
export interface WriteOptions {
  keepalive?: boolean;
  userId?: string;
}

/** Typed calls to `/api/*`. Every call resolves; failures come back as `{ ok: false }`. */
export function createAccountApi(fetchImpl: Fetch = (...args) => fetch(...args)) {
  async function call<T>(method: string, path: string, body?: unknown, opts: WriteOptions = {}): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (opts.userId) headers["x-tlc-user"] = opts.userId;
    let res: Response;
    try {
      res = await fetchImpl(path, {
        method,
        credentials: "same-origin",
        headers,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
        keepalive: opts.keepalive,
      });
    } catch {
      return { ok: false, status: 0, error: "network" };
    }
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // empty or non-JSON body (proxy error page)
    }
    if (res.ok) return { ok: true, status: res.status, data: data as T };
    const err = (data ?? {}) as { error?: unknown; retryAfterSec?: unknown; email?: unknown };
    return {
      ok: false,
      status: res.status,
      error: typeof err.error === "string" ? err.error : res.status >= 500 ? "server_error" : "unknown",
      retryAfterSec: typeof err.retryAfterSec === "number" ? err.retryAfterSec : undefined,
      email: typeof err.email === "string" ? err.email : undefined,
      body: data ?? undefined,
    };
  }

  return {
    me: () => call<{ user: AccountUser }>("GET", "/api/auth/me"),
    register: (input: { username: string; email: string; password: string }) =>
      call<{ ok: true; mailSent: boolean; mailError?: string; retryAfterSec?: number }>("POST", "/api/auth/register", input),
    activate: (token: string) => call<{ ok: true; alreadyActive?: boolean }>("POST", "/api/auth/activate", { token }),
    resendActivation: (usernameOrEmail: string) => call<{ ok: true }>("POST", "/api/auth/resend-activation", { usernameOrEmail }),
    login: (input: { username: string; password: string }) => call<{ user: AccountUser }>("POST", "/api/auth/login", input),
    logout: () => call<{ ok: true }>("POST", "/api/auth/logout", {}),
    forgotPassword: (usernameOrEmail: string) => call<{ ok: true }>("POST", "/api/auth/forgot-password", { usernameOrEmail }),
    changePasswordEmail: () => call<{ ok: true }>("POST", "/api/auth/change-password-email", {}),
    resetPassword: (token: string, password: string) => call<{ ok: true }>("POST", "/api/auth/reset-password", { token, password }),
    getProgress: () => call<ProgressSnapshotDto>("GET", "/api/progress"),
    /** `body` is pre-serialised so the caller can measure it for `keepalive`. */
    putLevel: (levelId: string, body: string, opts: WriteOptions = {}) =>
      call<LevelProgress>("PUT", `/api/progress/levels/${encodeURIComponent(levelId)}`, body, opts),
    postStory: (id: string, opts: WriteOptions = {}) => call<StoryProgress>("POST", "/api/progress/story", { id }, opts),
    importProgress: (snapshot: ProgressSnapshotDto) => call<ProgressSnapshotDto>("POST", "/api/progress/import", snapshot),
    getContentText: () => call<{ docs: ContentTexts }>("GET", "/api/content/text"),
    adminListContent: () => call<{ docs: AdminDocSummary[] }>("GET", "/api/admin/content"),
    adminGetContent: (kind: AdminDocKind, id: string) => call<AdminDoc>("GET", adminPath(kind, id)),
    /** 422 `{errors}`, 409 `{revision, updatedAt, updatedBy}` come back in `body`. */
    adminSaveContent: (kind: AdminDocKind, id: string, baseRevision: number, text: unknown, opts: WriteOptions = {}) =>
      call<{ revision: number; updatedAt: string }>("PUT", adminPath(kind, id), { baseRevision, text }, opts),
    adminHistory: (kind: AdminDocKind, id: string) =>
      call<{ revisions: { revision: number; savedAt: string; savedBy: string }[] }>("GET", `${adminPath(kind, id)}/history`),
    adminRevision: (kind: AdminDocKind, id: string, revision: number) =>
      call<{ revision: number; text: unknown; savedAt: string; savedBy: string }>("GET", `${adminPath(kind, id)}/history/${revision}`),
  };
}

const adminPath = (kind: AdminDocKind, id: string) => `/api/admin/content/${kind}/${encodeURIComponent(id)}`;

export type AccountApi = ReturnType<typeof createAccountApi>;

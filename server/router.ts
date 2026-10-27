import {
  activate,
  login,
  register,
  requestPasswordReset,
  resendActivation,
  resetPassword,
  type AuthContext,
  type AuthError,
  type Failure,
} from "./auth/accounts.js";
import {
  clearSessionCookie,
  currentUser,
  readSessionCookie,
  revokeSession,
  sessionCookie,
  type SessionUser,
} from "./auth/sessions.js";
import { readConfig, type ServerConfig } from "./config.js";
import { createDb } from "./db/create-db.js";
import { all, type Db } from "./db/db.js";
import { getDoc, listDocs, putDoc } from "./content/admin-content.js";
import { bundledContent, type BundledContent } from "./content/bundled-content.js";
import { listHistory, readAllTexts, readRevision, type DocKind } from "./content/content-store.js";
import { createMailer } from "./mail/mailer.js";
import { LimitError, importProgress, markStorySeen, readProgress, updateLevel } from "./progress/progress-store.js";
import { ROUTE_ID } from "../src/shell/route-id.js";

export interface RouterDeps {
  ctx: AuthContext;
  secureCookies: boolean;
  /** Usernames allowed on `/api/admin/*`, checked on every request. */
  admins?: ReadonlySet<string>;
  /** The deploy's puzzle files; defaults to the repo's `src/levels` and `src/story`. */
  content?: BundledContent;
}

const KB = 1024;
const LIMIT_AUTH = 16 * KB;
const LIMIT_LEVEL = 256 * KB;
const LIMIT_IMPORT = 512 * KB;
const LIMIT_CONTENT = 256 * KB;

const STATUS: Record<AuthError, number> = {
  invalid_username: 400,
  invalid_email: 400,
  invalid_password: 400,
  token_invalid: 400,
  username_taken: 409,
  email_taken: 409,
  bad_credentials: 401,
  not_activated: 403,
  too_many_attempts: 429,
  mail_rate_limited: 429,
  network_rate_limited: 429,
  mail_quota: 429,
  mail_failed: 502,
};

class HttpError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

const fail = ({ ok: _ok, ...rest }: Failure) => json(STATUS[rest.error], rest);

/** Vercel overwrites `x-forwarded-for` with the client address, so it cannot be spoofed there. */
const clientIp = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

/** Reads a JSON body, measuring the limit in bytes (a 50 000-char draft can be ~150 KB once encoded). */
async function readJson(request: Request, limit: number): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) throw new HttpError(415, "unsupported_media_type");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > limit) throw new HttpError(413, "payload_too_large");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > limit) throw new HttpError(413, "payload_too_large");
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  } catch {
    // fall through
  }
  throw new HttpError(400, "bad_json");
}

type Handler = (args: {
  request: Request;
  deps: RouterDeps;
  params: string[];
  sessionId: string | null;
  user: SessionUser | null;
}) => Promise<Response>;

/** `user`: a session; `admin`: a session whose username is in `ADMIN_USERNAMES`. */
type Access = "public" | "user" | "admin";

interface RouteDef {
  method: string;
  path: RegExp;
  access: Access;
  run: Handler;
}

const route = (method: string, path: RegExp, access: Access, run: Handler): RouteDef => ({ method, path, access, run });

const isAdmin = (deps: RouterDeps, username: string) => deps.admins?.has(username) ?? false;
const withAdmin = <U extends { username: string }>(deps: RouterDeps, user: U) => ({ ...user, isAdmin: isAdmin(deps, user.username) });

const DOC = "(level|chapter)\\/([^/]+)";
const docRoute = (suffix = "") => new RegExp(`^\\/api\\/admin\\/content\\/${DOC}${suffix}$`);

function bundledDoc(deps: RouterDeps, params: string[]) {
  const doc = (deps.content ?? bundledContent()).get(params[0] as DocKind, params[1]);
  if (!doc) throw new HttpError(404, "not_found");
  return doc;
}

const ROUTES: RouteDef[] = [
  route("POST", /^\/api\/auth\/register$/, "public", async ({ request, deps }) => {
    const r = await register(deps.ctx, await readJson(request, LIMIT_AUTH), clientIp(request));
    if (!r.ok) return fail(r);
    const { ok: _ok, ...rest } = r;
    return json(201, { ok: true, ...rest });
  }),
  route("POST", /^\/api\/auth\/activate$/, "public", async ({ request, deps }) => {
    const r = await activate(deps.ctx, (await readJson(request, LIMIT_AUTH)).token);
    return r.ok ? json(200, r) : fail(r);
  }),
  route("POST", /^\/api\/auth\/resend-activation$/, "public", async ({ request, deps }) => {
    const r = await resendActivation(deps.ctx, (await readJson(request, LIMIT_AUTH)).usernameOrEmail, clientIp(request));
    return r.ok ? json(200, r) : fail(r);
  }),
  route("POST", /^\/api\/auth\/login$/, "public", async ({ request, deps }) => {
    const r = await login(deps.ctx, await readJson(request, LIMIT_AUTH));
    if (!r.ok) return fail(r);
    return json(200, { user: withAdmin(deps, r.user) }, { "set-cookie": sessionCookie(r.sessionId, { secure: deps.secureCookies }) });
  }),
  route("POST", /^\/api\/auth\/logout$/, "public", async ({ deps, sessionId }) => {
    await revokeSession(deps.ctx.db, sessionId);
    return json(200, { ok: true }, { "set-cookie": clearSessionCookie({ secure: deps.secureCookies }) });
  }),
  route("GET", /^\/api\/auth\/me$/, "user", async ({ deps, user }) => json(200, { user: withAdmin(deps, user!) })),
  route("POST", /^\/api\/auth\/forgot-password$/, "public", async ({ request, deps }) => {
    const r = await requestPasswordReset(deps.ctx, (await readJson(request, LIMIT_AUTH)).usernameOrEmail, clientIp(request));
    return r.ok ? json(200, r) : fail(r);
  }),
  route("POST", /^\/api\/auth\/change-password-email$/, "user", async ({ deps, user }) => {
    const r = await requestPasswordReset(deps.ctx, user!.email);
    return r.ok ? json(200, r) : fail(r);
  }),
  route("POST", /^\/api\/auth\/reset-password$/, "public", async ({ request, deps }) => {
    const body = await readJson(request, LIMIT_AUTH);
    const r = await resetPassword(deps.ctx, body.token, body.password);
    return r.ok ? json(200, r) : fail(r);
  }),
  route("GET", /^\/api\/progress$/, "user", async ({ deps, user }) => json(200, await readProgress(deps.ctx.db, user!.id))),
  route("PUT", /^\/api\/progress\/levels\/([^/]+)$/, "user", async ({ request, deps, user, params }) => {
    const patch = await readJson(request, LIMIT_LEVEL);
    return json(200, await updateLevel(deps.ctx.db, user!.id, params[0], patch, deps.ctx.now()));
  }),
  route("POST", /^\/api\/progress\/story$/, "user", async ({ request, deps, user }) => {
    const { id } = await readJson(request, LIMIT_AUTH);
    if (typeof id !== "string" || !ROUTE_ID.test(id)) throw new HttpError(400, "bad_id");
    return json(200, await markStorySeen(deps.ctx.db, user!.id, id, deps.ctx.now()));
  }),
  route("POST", /^\/api\/progress\/import$/, "user", async ({ request, deps, user }) => {
    const body = await readJson(request, LIMIT_IMPORT);
    return json(200, await importProgress(deps.ctx.db, user!.id, body, deps.ctx.now()));
  }),
  route("GET", /^\/api\/content\/text$/, "user", async ({ deps }) => {
    const rows = await readAllTexts(deps.ctx.db);
    return json(200, { docs: Object.fromEntries(Object.entries(rows).map(([id, r]) => [id, { revision: r.revision, text: r.text }])) });
  }),
  route("GET", /^\/api\/admin\/content$/, "admin", async ({ deps }) => json(200, await listDocs(deps.ctx.db, deps.content ?? bundledContent()))),
  route("GET", docRoute(), "admin", async ({ deps, params }) => {
    const r = await getDoc(deps.ctx.db, bundledDoc(deps, params));
    return json(r.status, r.body);
  }),
  route("PUT", docRoute(), "admin", async ({ request, deps, params, user }) => {
    const doc = bundledDoc(deps, params);
    const body = await readJson(request, LIMIT_CONTENT);
    const base = body.baseRevision;
    if (typeof base !== "number" || !Number.isInteger(base) || base < 0) throw new HttpError(400, "bad_revision");
    const r = await putDoc(deps.ctx.db, doc, { baseRevision: base, text: body.text, username: user!.username, now: deps.ctx.now() });
    if (r.status === 200) console.info(`[admin] ${user!.username} lưu ${doc.docId} bản ${r.body.revision}`);
    return json(r.status, r.body);
  }),
  route("GET", docRoute("\\/history"), "admin", async ({ deps, params }) => {
    const doc = bundledDoc(deps, params);
    return json(200, { revisions: await listHistory(deps.ctx.db, doc.docId) });
  }),
  route("GET", docRoute("\\/history\\/(\\d+)"), "admin", async ({ deps, params }) => {
    const doc = bundledDoc(deps, params);
    const rev = await readRevision(deps.ctx.db, doc.docId, Number(params[2]));
    return rev ? json(200, rev) : json(404, { error: "not_found" });
  }),
];

/** Builds the API handler around explicit dependencies (tests use SQLite in memory and an outbox). */
export function createHandler(deps: RouterDeps) {
  return async function handle(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const matches = ROUTES.filter((r) => r.path.test(pathname));
    if (matches.length === 0) return json(404, { error: "not_found" });
    const def = matches.find((r) => r.method === request.method);
    if (!def) return json(405, { error: "method_not_allowed" }, { allow: matches.map((r) => r.method).join(", ") });

    const raw = def.path.exec(pathname)!.slice(1);
    let params: string[];
    try {
      params = raw.map(decodeURIComponent);
    } catch {
      return json(404, { error: "not_found" });
    }
    if (params.some((p) => !ROUTE_ID.test(p))) return json(404, { error: "not_found" });

    // Every write must be JSON. With SameSite=Lax cookies this keeps other sites' forms from acting for the player.
    if ((request.method === "POST" || request.method === "PUT") && !/^application\/json\b/i.test(request.headers.get("content-type") ?? "")) {
      return json(415, { error: "unsupported_media_type" });
    }

    try {
      const sessionId = readSessionCookie(request.headers.get("cookie"));
      const user = def.access !== "public" ? await currentUser(deps.ctx.db, sessionId, deps.ctx.now()) : null;
      if (def.access !== "public" && !user) return json(401, { error: "unauthorized" });
      if (def.access === "admin" && !isAdmin(deps, user!.username)) return json(403, { error: "forbidden" });
      // A write queued by a player who has since signed out must not land in the next account on this browser.
      const expected = request.headers.get("x-tlc-user");
      if (user && expected && expected !== user.id) return json(409, { error: "user_mismatch" });
      return await def.run({ request, deps, params, sessionId, user });
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.code });
      if (err instanceof LimitError) return json(413, { error: "too_many_levels" });
      console.error(`[api] ${request.method} ${pathname}:`, err instanceof Error ? err.message : err);
      return json(500, { error: "server_error" });
    }
  };
}

/** The production wiring of a validated config to its database and mailer. */
export function depsFromConfig(config: ServerConfig, db: Db): RouterDeps {
  return {
    secureCookies: config.secureCookies,
    admins: new Set(config.admins),
    ctx: {
      db,
      mailer: createMailer(config.mail),
      origin: config.origin,
      now: () => new Date(),
      callerLimits: config.callerLimits,
    },
  };
}

export function misconfigured(missing: string[]) {
  console.error(`[api] thiếu biến môi trường: ${missing.join(", ")}`);
  return async () => json(500, { error: "server_misconfigured" });
}

let handler: Promise<(request: Request) => Promise<Response>> | null = null;

/** Builds the handler from the environment once per function instance. */
async function fromEnv() {
  const result = readConfig();
  if (!result.ok) return misconfigured(result.missing);
  const db = await createDb(result.config.db);
  void warnUnclaimedAdmins(db, result.config.admins);
  return createHandler(depsFromConfig(result.config, db));
}

/**
 * An admin name nobody has activated is open to whoever registers it first.
 * Logged at start-up so the owner notices; never fails the start.
 */
export async function warnUnclaimedAdmins(db: Db, admins: string[]) {
  if (admins.length === 0) return;
  try {
    const marks = admins.map((_, i) => `?${i + 1}`).join(", ");
    const rows = await all(db, `SELECT username FROM users WHERE activated_at IS NOT NULL AND username IN (${marks})`, ...admins);
    const claimed = new Set(rows.map((r) => String(r.username)));
    const open = admins.filter((a) => !claimed.has(a));
    if (open.length) console.warn(`[config] ADMIN_USERNAMES có tên chưa có tài khoản đã kích hoạt: ${open.join(", ")}`);
  } catch (err) {
    console.warn("[config] không kiểm được ADMIN_USERNAMES:", err instanceof Error ? err.message : err);
  }
}

/** The Vercel entry point. The Vite plugin uses `server/local-handler.ts` instead. */
export async function handle(request: Request): Promise<Response> {
  handler ??= fromEnv().catch((err) => {
    handler = null;
    throw err;
  });
  try {
    return await (await handler)(request);
  } catch (err) {
    console.error("[api] khởi động thất bại:", err instanceof Error ? err.message : err);
    return json(500, { error: "server_error" });
  }
}

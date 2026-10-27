import { checkAuth } from "./auth";

/** The slice of the D1 binding this Worker uses. */
export interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): unknown };
  batch(statements: unknown[]): Promise<{ results?: unknown[] }[]>;
}

export interface Env {
  DB: D1Like;
  GATEWAY_SECRET: string;
}

type Statement = { sql: string; params: (string | number | null)[] };

export const MAX_STATEMENTS = 64;
export const MAX_BODY_BYTES = 512 * 1024;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function parseStatements(body: unknown): Statement[] | null {
  const list = (body as { statements?: unknown } | null)?.statements;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_STATEMENTS) return null;
  for (const s of list) {
    if (!s || typeof s !== "object" || typeof s.sql !== "string" || !Array.isArray(s.params)) return null;
    if (!s.params.every((p: unknown) => p === null || typeof p === "string" || typeof p === "number")) return null;
  }
  return list as Statement[];
}

/**
 * D1 gateway: accepts only `POST /batch` with the shared secret, runs the
 * statements as one D1 batch (a transaction) and returns each statement's rows.
 * All game logic lives on Vercel; this Worker knows nothing about it.
 */
export async function handleGateway(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/batch") return json(404, { error: "not_found" });
  if (!(await checkAuth(request.headers.get("authorization"), env.GATEWAY_SECRET))) {
    return json(401, { error: "unauthorized" });
  }
  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) return json(413, { error: "too_large" });
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return json(400, { error: "bad_json" });
  }
  const statements = parseStatements(body);
  if (!statements) return json(400, { error: "bad_statements" });
  try {
    const out = await env.DB.batch(statements.map((s) => env.DB.prepare(s.sql).bind(...s.params)));
    return json(200, { results: out.map((r) => r.results ?? []) });
  } catch (err) {
    return json(400, { error: err instanceof Error ? err.message : "query_failed" });
  }
}

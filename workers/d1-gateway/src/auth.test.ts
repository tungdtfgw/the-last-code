import { describe, expect, test } from "vitest";
import { checkAuth } from "./auth";
import { type Env } from "./gateway";
import worker from "./index";

describe("checkAuth", () => {
  test("accepts only the exact bearer secret, never throws", async () => {
    expect(await checkAuth("Bearer s3cret", "s3cret")).toBe(true);
    expect(await checkAuth("Bearer wrong!", "s3cret")).toBe(false);
    expect(await checkAuth("Bearer a-much-longer-key-than-the-secret", "s3cret")).toBe(false);
    expect(await checkAuth("s3cret", "s3cret")).toBe(false);
    expect(await checkAuth(null, "s3cret")).toBe(false);
    expect(await checkAuth("Bearer ", undefined)).toBe(false);
  });
});

describe("gateway worker", () => {
  const recordingEnv = () => {
    const calls: unknown[] = [];
    const env: Env = {
      GATEWAY_SECRET: "s3cret",
      DB: {
        prepare: (sql) => ({ bind: (...values) => ({ sql, values }) }),
        batch: async (statements) => {
          calls.push(...statements);
          return statements.map(() => ({ results: [{ ok: 1 }] }));
        },
      },
    };
    return { env, calls };
  };
  const post = (headers: Record<string, string>, body: unknown) =>
    new Request("https://gw.example/batch", { method: "POST", headers, body: JSON.stringify(body) });
  const select1 = { statements: [{ sql: "SELECT 1 AS ok", params: [] }] };

  test("a request without the right key gets 401 and never touches the database", async () => {
    const { env, calls } = recordingEnv();
    for (const headers of [{} as Record<string, string>, { authorization: "Bearer nope" }, { authorization: "Bearer s3cret-but-longer" }]) {
      expect((await worker.fetch(post(headers, select1), env)).status).toBe(401);
    }
    expect(calls).toEqual([]);
  });

  test("runs a valid batch and rejects malformed ones", async () => {
    const { env, calls } = recordingEnv();
    const auth = { authorization: "Bearer s3cret" };
    const ok = await worker.fetch(post(auth, select1), env);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ results: [[{ ok: 1 }]] });
    expect(calls).toEqual([{ sql: "SELECT 1 AS ok", values: [] }]);
    const tooMany = { statements: Array.from({ length: 65 }, () => select1.statements[0]) };
    expect((await worker.fetch(post(auth, tooMany), env)).status).toBe(400);
    expect((await worker.fetch(post(auth, { statements: [{ sql: "x", params: [{}] }] }), env)).status).toBe(400);
    expect((await worker.fetch(new Request("https://gw.example/other", { method: "POST", headers: auth }), env)).status).toBe(404);
  });
});

import { afterEach, describe, expect, test } from "vitest";
import { readConfig } from "./config";
import { createHandler } from "./router";
import { testAuthContext, tokenOf } from "./test-helpers";

let env = testAuthContext();
let handle = createHandler({ ctx: env.ctx, secureCookies: false });
afterEach(() => {
  env.cleanup();
  env = testAuthContext();
  handle = createHandler({ ctx: env.ctx, secureCookies: false });
});

const call = (method: string, path: string, body?: unknown, cookie?: string, headers: Record<string, string> = {}) =>
  handle(
    new Request(`http://localhost:5173${path}`, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );

async function signedIn() {
  expect((await call("POST", "/api/auth/register", { username: "alice", email: "a@x.io", password: "password1" })).status).toBe(201);
  expect((await call("POST", "/api/auth/activate", { token: tokenOf(env.mails()[0]) })).status).toBe(200);
  const res = await call("POST", "/api/auth/login", { username: "alice", password: "password1" });
  expect(res.status).toBe(200);
  const setCookie = res.headers.get("set-cookie")!;
  return { setCookie, cookie: setCookie.split(";")[0] };
}

test("full flow: register → mail → activate → login → write and read progress", async () => {
  const { setCookie, cookie } = await signedIn();
  expect(setCookie).toMatch(/^tlc_session=[\w-]{43}; HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000$/);

  const me = await call("GET", "/api/auth/me", undefined, cookie);
  expect(await me.json()).toEqual({ user: expect.objectContaining({ username: "alice", email: "a@x.io" }) });
  expect(me.headers.get("cache-control")).toBe("no-store");

  const put = await call("PUT", "/api/progress/levels/1.1", { draft: "print(1)", bestStars: 2 }, cookie);
  expect(await put.json()).toMatchObject({ draft: "print(1)", bestStars: 2 });
  expect(await (await call("POST", "/api/progress/story", { id: "prologue" }, cookie)).json()).toEqual({ seen: ["prologue"] });
  expect(await (await call("GET", "/api/progress", undefined, cookie)).json()).toMatchObject({
    levels: { "1.1": { draft: "print(1)", bestStars: 2 } },
    story: { seen: ["prologue"] },
  });

  const out = await call("POST", "/api/auth/logout", {}, cookie);
  expect(out.headers.get("set-cookie")).toContain("Max-Age=0");
  expect((await call("GET", "/api/auth/me", undefined, cookie)).status).toBe(401);
});

describe("guards", () => {
  test("progress needs a session", async () => {
    expect((await call("GET", "/api/progress")).status).toBe(401);
    expect((await call("PUT", "/api/progress/levels/1.1", { runs: 1 })).status).toBe(401);
  });

  test("writes must be JSON", async () => {
    const form = await handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "username=alice&password=x",
      }),
    );
    expect(form.status).toBe(415);
  });

  test("body limits count bytes, not characters", async () => {
    const { cookie } = await signedIn();
    // A maximal draft of 3-byte characters is ~150 KB: still under the 256 KB level limit.
    expect((await call("PUT", "/api/progress/levels/1.1", { draft: "ệ".repeat(50_000) }, cookie)).status).toBe(200);
    // 6 000 such characters are 18 KB, over the 16 KB auth limit.
    expect((await call("POST", "/api/auth/login", { username: "alice", password: "ệ".repeat(6000) })).status).toBe(413);
  });

  test("unknown paths, wrong methods and bad ids", async () => {
    const { cookie } = await signedIn();
    expect((await call("GET", "/api/nope")).status).toBe(404);
    expect((await call("GET", "/api/auth/login")).status).toBe(405);
    expect((await call("PUT", "/api/progress/levels/a%20b", { runs: 1 }, cookie)).status).toBe(404);
    expect((await call("POST", "/api/progress/story", { id: "../x" }, cookie)).status).toBe(400);
  });

  test("a write tagged for another user is refused (a queued write after sign-out)", async () => {
    const { cookie } = await signedIn();
    const res = await handle(
      new Request("http://localhost:5173/api/progress/levels/1.1", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie, "x-tlc-user": "someone-else" },
        body: JSON.stringify({ bestStars: 3 }),
      }),
    );
    expect(res.status).toBe(409);
    expect(await (await call("GET", "/api/progress", undefined, cookie)).json()).toEqual({ levels: {}, story: { seen: [] } });
  });

  test("auth errors come back with a code and no internals", async () => {
    await signedIn();
    const res = await call("POST", "/api/auth/login", { username: "alice", password: "wrong-one" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "bad_credentials" });
    expect(await (await call("POST", "/api/auth/register", { username: "alice", email: "b@x.io", password: "password1" })).json()).toEqual({
      error: "username_taken",
    });
  });
});

test("mail requests are counted per client address from x-forwarded-for", async () => {
  const from = (ip: string) => ({ "x-forwarded-for": `${ip}, 10.0.0.1` });
  for (let i = 0; i < 60; i++) await call("POST", "/api/auth/forgot-password", { usernameOrEmail: `x${i}` }, undefined, from("203.0.113.7"));
  const blocked = await call("POST", "/api/auth/register", { username: "alice", email: "a@x.io", password: "password1" }, undefined, from("203.0.113.7"));
  expect(blocked.status).toBe(429);
  expect(await blocked.json()).toMatchObject({ error: "network_rate_limited" });
  const other = await call("POST", "/api/auth/register", { username: "alice", email: "a@x.io", password: "password1" }, undefined, from("198.51.100.1"));
  expect(other.status).toBe(201);
});

describe("readConfig", () => {
  test("production needs the gateway, Gmail and the origin; missing names are listed", () => {
    expect(readConfig({})).toEqual({
      ok: false,
      missing: ["D1_GATEWAY_URL", "D1_GATEWAY_SECRET", "GMAIL_USER", "GMAIL_APP_PASSWORD", "APP_ORIGIN"],
    });
  });

  test("per-address and per-network limits can be switched off only on local SQLite", () => {
    const prod = { D1_GATEWAY_URL: "https://gw", D1_GATEWAY_SECRET: "s", GMAIL_USER: "g", GMAIL_APP_PASSWORD: "p", APP_ORIGIN: "https://x.vercel.app" };
    const p = readConfig({ ...prod, AUTH_RATE_LIMIT: "off" });
    expect(p.ok && p.config).toMatchObject({ callerLimits: true, secureCookies: true });
    const local = readConfig({ DB_DRIVER: "sqlite", MAIL_TRANSPORT: "outbox", APP_ORIGIN: "http://localhost:4173", AUTH_RATE_LIMIT: "off" });
    expect(local.ok && local.config).toMatchObject({ callerLimits: false, secureCookies: false, mail: { transport: "outbox" } });
    expect(readConfig({ ...prod, MAIL_TRANSPORT: "outbox" }).ok).toBe(false);
  });
});

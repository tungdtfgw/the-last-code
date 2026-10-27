import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import sample from "../tests/fixtures/levels/level-test-sample.json";
import { extractText, LEVEL_TEXT, stripText } from "../src/content/text-fields";
import { LEVELS_DIR, loadBundledContent } from "./content/bundled-content";
import { readConfig } from "./config";
import { createHandler } from "./router";
import { testAuthContext, tokenOf } from "./test-helpers";

const ADMINS = new Set(["boss"]);
let env = testAuthContext();
let handle = createHandler({ ctx: env.ctx, secureCookies: false, admins: ADMINS });
afterEach(() => {
  env.cleanup();
  env = testAuthContext();
  handle = createHandler({ ctx: env.ctx, secureCookies: false, admins: ADMINS });
});

const call = (method: string, path: string, body?: unknown, cookie?: string, headers: Record<string, string> = {}) =>
  handle(
    new Request(`http://localhost:5173${path}`, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );

async function signedIn(username = "alice") {
  const email = username === "alice" ? "a@x.io" : `${username}@x.io`;
  expect((await call("POST", "/api/auth/register", { username, email, password: "password1" })).status).toBe(201);
  expect((await call("POST", "/api/auth/activate", { token: tokenOf(env.mails().at(-1)!) })).status).toBe(200);
  const res = await call("POST", "/api/auth/login", { username, password: "password1" });
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

  test("ADMIN_USERNAMES is read like a login name; malformed names are dropped", () => {
    const local = { DB_DRIVER: "sqlite", MAIL_TRANSPORT: "outbox", APP_ORIGIN: "http://localhost:4173" };
    const r = readConfig({ ...local, ADMIN_USERNAMES: " Boss , tung_dt,,bad name!" });
    expect(r.ok && r.config.admins).toEqual(["boss", "tung_dt"]);
    const none = readConfig(local);
    expect(none.ok && none.config.admins).toEqual([]);
  });
});

describe("content API", () => {
  // A fresh database holds the text migrations: every bundled document starts at revision 1.
  const level14 = JSON.parse(readFileSync(new URL("../src/levels/level-1-4.json", import.meta.url), "utf8"));
  const DOC = "/api/admin/content/level/1.4";
  const textOf = async (cookie: string) => JSON.parse(JSON.stringify((await (await call("GET", DOC, undefined, cookie)).json()).text));

  test("admin routes need a session (401) and an admin name (403)", async () => {
    expect((await call("GET", "/api/admin/content")).status).toBe(401);
    const player = await signedIn("alice");
    expect((await call("GET", "/api/admin/content", undefined, player.cookie)).status).toBe(403);
    expect((await call("PUT", DOC, { baseRevision: 1, text: {} }, player.cookie)).status).toBe(403);
    expect(await (await call("GET", "/api/auth/me", undefined, player.cookie)).json()).toMatchObject({ user: { isAdmin: false } });
    const admin = await signedIn("boss");
    expect(await (await call("GET", "/api/auth/me", undefined, admin.cookie)).json()).toMatchObject({ user: { username: "boss", isAdmin: true } });
    const list = await call("GET", "/api/admin/content", undefined, admin.cookie);
    expect(list.status).toBe(200);
    const { docs } = await list.json();
    expect(docs.map((d: { docId: string }) => d.docId)).toEqual(expect.arrayContaining(["chapter:1", "level:1.1", "level:1.4"]));
    expect(docs.find((d: { docId: string }) => d.docId === "level:1.4")).toMatchObject({ revision: 1, updatedBy: "migration", drift: [], errors: [] });
  });

  test("save, conflict, history and the players' text", async () => {
    const { cookie } = await signedIn("boss");
    const start = await (await call("GET", DOC, undefined, cookie)).json();
    expect(start).toMatchObject({ revision: 1, updatedBy: "migration" });
    const original = JSON.parse(JSON.stringify(start.text));

    const text = await textOf(cookie);
    text.briefing = "Lời dẫn mới.";
    const first = await call("PUT", DOC, { baseRevision: 1, text }, cookie);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ revision: 2 });

    // A second editor still on revision 1 is refused with who saved last.
    const stale = await call("PUT", DOC, { baseRevision: 1, text: original }, cookie);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ error: "stale_revision", revision: 2, updatedBy: "boss" });

    text.briefing = "Lời dẫn thứ hai.";
    expect((await call("PUT", DOC, { baseRevision: 2, text }, cookie)).status).toBe(200);

    const history = await (await call("GET", `${DOC}/history`, undefined, cookie)).json();
    expect(history.revisions.map((r: { revision: number; savedBy: string }) => [r.revision, r.savedBy])).toEqual([
      [3, "boss"],
      [2, "boss"],
      [1, "migration"],
    ]);
    // Restoring the migrated text goes through the same save.
    const old = await (await call("GET", `${DOC}/history/1`, undefined, cookie)).json();
    expect(old.text).toEqual(original);
    expect((await call("PUT", DOC, { baseRevision: 3, text: old.text }, cookie)).status).toBe(200);
    expect((await call("GET", `${DOC}/history/9`, undefined, cookie)).status).toBe(404);

    const player = await signedIn("alice");
    const texts = await (await call("GET", "/api/content/text", undefined, player.cookie)).json();
    expect(texts.docs["level:1.4"]).toMatchObject({ revision: 4, text: original });
    expect(Object.keys(texts.docs)).toEqual(expect.arrayContaining(["chapter:1", "level:1.1", "level:1.4"]));
  });

  test("puzzle keys and leaking lines are refused with 422 and nothing is stored", async () => {
    const { cookie } = await signedIn("boss");
    const withTests = await call("PUT", DOC, { baseRevision: 1, text: { ...(await textOf(cookie)), tests: [] } }, cookie);
    expect(withTests.status).toBe(422);
    expect(await withTests.json()).toMatchObject({ error: "invalid_text", errors: [{ path: "tests" }] });

    const leaking = await textOf(cookie);
    leaking.reactions.wrong_value = `Đáp án là ${level14.tests[0].expected.ma_xac_thuc}.`;
    const res = await call("PUT", DOC, { baseRevision: 1, text: leaking }, cookie);
    expect(res.status).toBe(422);
    expect((await res.json()).errors.map((e: { path: string }) => e.path)).toEqual(["reactions.wrong_value"]);
    expect((await (await call("GET", DOC, undefined, cookie)).json()).revision).toBe(1);
  });

  test("a bundled level without a text migration is listed with an error and can be neither opened nor created", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tlc-levels-"));
    try {
      cpSync(LEVELS_DIR, dir, { recursive: true });
      writeFileSync(join(dir, "level-9-9.json"), JSON.stringify(stripText(sample, LEVEL_TEXT)));
      handle = createHandler({ ctx: env.ctx, secureCookies: false, admins: ADMINS, content: loadBundledContent(dir) });
      const { cookie } = await signedIn("boss");
      const { docs } = await (await call("GET", "/api/admin/content", undefined, cookie)).json();
      expect(docs.find((d: { docId: string }) => d.docId === "level:9.9")).toMatchObject({ revision: 0, errors: [{ message: expect.stringMatching(/thêm migration/) }] });
      const NEW = "/api/admin/content/level/9.9";
      expect(await call("GET", NEW, undefined, cookie)).toMatchObject({ status: 404 });
      const put = await call("PUT", NEW, { baseRevision: 0, text: extractText(sample, LEVEL_TEXT) }, cookie);
      expect(put.status).toBe(404);
      expect(await put.json()).toEqual({ error: "no_text" });
      expect((await (await call("GET", "/api/content/text", undefined, cookie)).json()).docs["level:9.9"]).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("writes are JSON with a size limit, a valid revision and a known document", async () => {
    const { cookie } = await signedIn("boss");
    const form = await handle(new Request(`http://localhost${DOC}`, { method: "PUT", headers: { cookie, "content-type": "text/plain" }, body: "{}" }));
    expect(form.status).toBe(415);
    expect((await call("PUT", DOC, { baseRevision: 1, text: { briefing: "x".repeat(300 * 1024) } }, cookie)).status).toBe(413);
    expect((await call("PUT", DOC, { baseRevision: -1, text: await textOf(cookie) }, cookie)).status).toBe(400);
    expect((await call("PUT", DOC, { baseRevision: 0, text: await textOf(cookie) }, cookie)).status).toBe(409);
    expect((await call("PUT", "/api/admin/content/level/9.9", { baseRevision: 1, text: {} }, cookie)).status).toBe(404);
    expect((await call("GET", "/api/admin/content/story/1", undefined, cookie)).status).toBe(404);
  });
});

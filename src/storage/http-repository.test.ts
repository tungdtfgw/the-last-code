import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createHandler } from "../../server/router";
import { testAuthContext, tokenOf } from "../../server/test-helpers";
import { createAccountApi, type Fetch } from "../account/account-api";
import { DRAFT_INTERVAL_MS, HttpProgressRepository, type HttpRepositoryOptions } from "./http-repository";
import { importLocalProgress } from "./import-local-progress";
import { PROGRESS_KEY, SETTINGS_KEY } from "./local-storage-repository";
import { MemoryRepository } from "./memory-repository";

class MapStorage implements Storage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

let env = testAuthContext({ callerLimits: false });
let handle = createHandler({ ctx: env.ctx, secureCookies: false });
beforeEach(() => {
  env = testAuthContext({ callerLimits: false });
  handle = createHandler({ ctx: env.ctx, secureCookies: false });
});
afterEach(() => env.cleanup());

interface Browser {
  fetch: Fetch;
  calls: { method: string; path: string; body: string | null }[];
  /** Answers with this status instead of reaching the server, while the list lasts. */
  failWith: number[];
}

/** A browser talking to the in-process server: real router, real SQLite, a cookie jar. */
function browser(): Browser {
  let cookie = "";
  const b: Browser = {
    calls: [],
    failWith: [],
    fetch: async (input, init = {}) => {
      const url = new URL(String(input), "http://localhost:5173");
      b.calls.push({ method: init.method ?? "GET", path: url.pathname, body: (init.body as string | undefined) ?? null });
      const status = b.failWith.shift();
      if (status !== undefined) return new Response("{}", { status });
      const headers = new Headers(init.headers);
      if (cookie) headers.set("cookie", cookie);
      const res = await handle(new Request(url, { method: init.method, headers, body: init.body }));
      const set = res.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0];
      return res;
    },
  };
  return b;
}

async function signedInBrowser(username = "alice") {
  const b = browser();
  const api = createAccountApi(b.fetch);
  const email = `${username}@x.io`;
  if (!(await api.register({ username, email, password: "password1" })).ok) throw new Error("register");
  const mail = env.mails().filter((m) => m.to === email).at(-1)!;
  await api.activate(tokenOf(mail));
  if (!(await api.login({ username, password: "password1" })).ok) throw new Error("login");
  b.calls.length = 0;
  return { b, api };
}

function manualTimers() {
  const timers: { fn: () => void; at: number }[] = [];
  const opts: HttpRepositoryOptions = {
    doc: null,
    sleep: async () => {},
    setTimer: (fn, ms) => {
      timers.push({ fn, at: ms });
      return timers.length as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimer: (id) => {
      const t = timers[(id as unknown as number) - 1];
      if (t) t.fn = () => {};
    },
  };
  const fireAll = () => timers.splice(0).forEach((t) => t.fn());
  return { opts, fireAll, timers };
}

async function repoFor(api: ReturnType<typeof createAccountApi>, opts: HttpRepositoryOptions) {
  const snap = await api.getProgress();
  const me = await api.me();
  if (!snap.ok || !me.ok) throw new Error("progress");
  return new HttpProgressRepository(snap.data, api, new MemoryRepository(), { userId: me.data.user.id, ...opts });
}

/** Holds back requests whose body matches until `release()`, like a slow network. */
function slowFor(b: Browser, match: (body: Record<string, unknown>) => boolean) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const fetch: Fetch = async (input, init) => {
    if (init?.method === "PUT" && match(JSON.parse(String(init.body)))) await gate;
    return b.fetch(input, init);
  };
  return { api: createAccountApi(fetch), release };
}

function fakeDoc() {
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible", defaultView: null }) as unknown as Document;
  const hide = () => {
    (doc as unknown as { visibilityState: string }).visibilityState = "hidden";
    doc.dispatchEvent(new Event("visibilitychange"));
  };
  return { doc, hide };
}

const puts = (b: Browser) => b.calls.filter((c) => c.method === "PUT");

describe("HttpProgressRepository", () => {
  test("three drafts in a row: one request per 10 s window, the server keeps the last", async () => {
    const { b, api } = await signedInBrowser();
    const t = manualTimers();
    const repo = await repoFor(api, t.opts);
    await repo.updateLevel("1.1", { draft: "a" });
    await repo.updateLevel("1.1", { draft: "ab" });
    await repo.updateLevel("1.1", { draft: "abc" });
    expect(puts(b)).toHaveLength(0);
    expect(t.timers.map((x) => x.at)).toEqual([DRAFT_INTERVAL_MS]);
    t.fireAll();
    await repo.idle();
    expect(puts(b)).toHaveLength(1);
    expect((await repo.getLevel("1.1")).draft).toBe("abc");
    const server = await api.getProgress();
    expect(server.ok && server.data.levels["1.1"].draft).toBe("abc");
  });

  test("an unchanged draft is not sent again", async () => {
    const { b, api } = await signedInBrowser();
    const t = manualTimers();
    const repo = await repoFor(api, t.opts);
    await repo.updateLevel("1.1", { draft: "same" });
    t.fireAll();
    await repo.idle();
    await repo.updateLevel("1.1", { draft: "same" });
    t.fireAll();
    await repo.idle();
    expect(puts(b)).toHaveLength(1);
  });

  test("a run goes out at once and carries the held draft", async () => {
    const { b, api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    await repo.updateLevel("1.1", { draft: "code" });
    await repo.updateLevel("1.1", { runs: 1 });
    await repo.idle();
    expect(puts(b).map((c) => JSON.parse(c.body!))).toEqual([
      { bestStars: 0, runs: 1, hintsOpened: 0, draft: "code", draftRev: expect.any(Number) },
    ]);
  });

  test("hiding the page sends the newest draft at once; a slower request with an older draft cannot win", async () => {
    const { b, api } = await signedInBrowser();
    const slow = slowFor(b, (body) => body.draft === "old");
    const { doc, hide } = fakeDoc();
    const repo = await repoFor(slow.api, { ...manualTimers().opts, doc });
    await repo.updateLevel("1.1", { runs: 1, draft: "old" }); // queued, held back by the slow network
    await repo.updateLevel("1.1", { draft: "latest" });
    hide();
    await vi.waitFor(() => expect(puts(b).some((c) => c.body!.includes("latest"))).toBe(true));
    slow.release();
    await repo.idle();
    const server = await api.getProgress();
    expect(server.ok && server.data.levels["1.1"]).toMatchObject({ draft: "latest", runs: 1 });
    expect(await repo.getLevel("1.1")).toMatchObject({ draft: "latest", runs: 1 });
  });

  test("an old response arriving after a newer patch does not roll the draft back", async () => {
    const { api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    await repo.updateLevel("1.1", { runs: 1, draft: "v1" });
    await repo.updateLevel("1.1", { runs: 2, draft: "v2" });
    await repo.updateLevel("1.1", { draft: "v3" }); // held, not sent yet
    await repo.idle();
    expect((await repo.getLevel("1.1")).draft).toBe("v3");
  });

  test("stars never go down, and a second device sees the same progress", async () => {
    const { api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    await repo.updateLevel("1.1", { bestStars: 3 });
    await repo.updateLevel("1.1", { bestStars: 1 });
    await repo.markStorySeen("prologue");
    await repo.idle();
    expect((await repo.getLevel("1.1")).bestStars).toBe(3);

    const other = await repoFor(api, manualTimers().opts);
    expect(await other.getLevel("1.1")).toMatchObject({ bestStars: 3 });
    expect(await other.getStory()).toEqual({ seen: ["prologue"] });
  });

  test("503 twice then 200: the data lands and persistence is not lost", async () => {
    const { b, api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    const lost = vi.fn();
    repo.onPersistenceLost(lost);
    b.failWith.push(503, 503);
    await repo.updateLevel("1.1", { bestStars: 2 });
    await repo.idle();
    expect(lost).not.toHaveBeenCalled();
    expect(puts(b)).toHaveLength(3);
    const server = await api.getProgress();
    expect(server.ok && server.data.levels["1.1"].bestStars).toBe(2);
  });

  test("a write that failed for good is repaired by the next success, and memory never loses the star", async () => {
    const { b, api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    b.failWith.push(503, 503, 503, 503);
    await repo.updateLevel("1.1", { bestStars: 3 });
    await repo.idle();
    expect(repo.persistent).toBe(false);
    await repo.updateLevel("1.1", { runs: 1 });
    await repo.idle();
    expect(await repo.getLevel("1.1")).toMatchObject({ bestStars: 3, runs: 1 });
    const server = await api.getProgress();
    expect(server.ok && server.data.levels["1.1"]).toMatchObject({ bestStars: 3, runs: 1 });
  });

  test("after close() a pending retry gives up, so nothing lands in the next account", async () => {
    const { b, api } = await signedInBrowser();
    let wake!: () => void;
    const repo = await repoFor(api, { ...manualTimers().opts, sleep: () => new Promise<void>((r) => (wake = r)) });
    b.failWith.push(503);
    await repo.updateLevel("1.1", { bestStars: 3, draft: "alice code" });
    await vi.waitFor(() => expect(wake).toBeTypeOf("function"));
    repo.close();
    const sent = puts(b).length;
    wake();
    await repo.idle();
    expect(puts(b)).toHaveLength(sent);
  });

  test("a write tagged with another account's id is refused by the server", async () => {
    const { api } = await signedInBrowser();
    const snap = await api.getProgress();
    if (!snap.ok) throw new Error("progress");
    const repo = new HttpProgressRepository(snap.data, api, new MemoryRepository(), { ...manualTimers().opts, userId: "previous-player" });
    await repo.updateLevel("1.1", { bestStars: 3 });
    await repo.idle();
    expect(repo.persistent).toBe(false);
    const server = await api.getProgress();
    expect(server.ok && server.data.levels["1.1"]).toBeUndefined();
  });

  test("a 413 is reported as lost persistence, not dropped silently", async () => {
    const { b, api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    const lost = vi.fn();
    repo.onPersistenceLost(lost);
    b.failWith.push(413);
    await repo.updateLevel("1.1", { runs: 1 });
    await repo.idle();
    expect(lost).toHaveBeenCalledTimes(1);
    expect(repo.persistent).toBe(false);
  });

  test("a revoked session reports expiry on the next write", async () => {
    const { api } = await signedInBrowser();
    const repo = await repoFor(api, manualTimers().opts);
    const expired = vi.fn();
    repo.onSessionExpired(expired);
    await api.logout();
    await repo.updateLevel("1.1", { runs: 1 });
    await repo.idle();
    expect(expired).toHaveBeenCalledTimes(1);
  });
});

describe("importLocalProgress", () => {
  const seedOld = (storage: MapStorage) => {
    storage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        levels: { "1.1": { bestStars: 1, runs: 3 }, "1.2": { bestStars: 2, draft: "x = 1" } },
        story: { seen: ["prologue"] },
      }),
    );
    storage.setItem(SETTINGS_KEY, JSON.stringify({ schemaVersion: 1, muted: true }));
  };

  test("merges into the account (higher stars win, stories unite) and clears only the progress key", async () => {
    const { api } = await signedInBrowser();
    await api.putLevel("1.1", JSON.stringify({ bestStars: 3 }));
    await api.postStory("teaser");
    const storage = new MapStorage();
    seedOld(storage);
    expect(await importLocalProgress(api, () => storage)).toBe("imported");
    const server = await api.getProgress();
    if (!server.ok) throw new Error("progress");
    expect(server.data.levels["1.1"]).toMatchObject({ bestStars: 3, runs: 3 });
    expect(server.data.levels["1.2"]).toMatchObject({ bestStars: 2, draft: "x = 1" });
    expect(new Set(server.data.story.seen)).toEqual(new Set(["teaser", "prologue"]));
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem(SETTINGS_KEY)).not.toBeNull();
  });

  test("a network failure keeps the local copy for the next visit", async () => {
    const { b, api } = await signedInBrowser();
    const storage = new MapStorage();
    seedOld(storage);
    b.failWith.push(503);
    expect(await importLocalProgress(api, () => storage)).toBe("kept");
    expect(storage.getItem(PROGRESS_KEY)).not.toBeNull();
  });

  test("nothing to import when the browser has no progress", async () => {
    const { b, api } = await signedInBrowser();
    expect(await importLocalProgress(api, () => new MapStorage())).toBe("none");
    expect(b.calls).toEqual([]);
  });
});

import { afterEach, describe, expect, test } from "vitest";
import { all } from "../db/db";
import { testAuthContext, tokenOf } from "../test-helpers";
import {
  ACTIVATE_TTL_MS,
  MAIL_PER_DAY,
  REQUESTS_PER_NETWORK,
  SIGNUP_MAILS_PER_DAY,
  STALE_UNACTIVATED_MS,
  activate,
  login,
  networkKey,
  register,
  requestPasswordReset,
  resendActivation,
  resetPassword,
} from "./accounts";
import * as passwordModule from "./password";
import { currentUser } from "./sessions";

let env = testAuthContext();
afterEach(() => {
  env.cleanup();
  env = testAuthContext();
});

const alice = { username: "Alice_01", email: " Alice@Example.com ", password: "correct horse" };

async function activeAccount() {
  expect(await register(env.ctx, alice)).toEqual({ ok: true, mailSent: true });
  expect(await activate(env.ctx, tokenOf(env.mails().at(-1)!))).toEqual({ ok: true });
}

describe("register and activate", () => {
  test("register → mail with link → activate → login; the same link again reports alreadyActive", async () => {
    expect(await register(env.ctx, alice)).toEqual({ ok: true, mailSent: true });
    const mail = env.mails()[0];
    expect(mail.to).toBe("alice@example.com");
    expect(mail.link).toMatch(/^http:\/\/localhost:5173\/#\/activate\/[\w-]{43}$/);
    expect(mail.text).toContain(mail.link);

    expect(await login(env.ctx, alice)).toMatchObject({ ok: false, error: "not_activated", email: "a***@example.com" });
    expect(await activate(env.ctx, tokenOf(mail))).toEqual({ ok: true });
    expect(await activate(env.ctx, tokenOf(mail))).toEqual({ ok: true, alreadyActive: true });
    expect(await activate(env.ctx, "nope")).toEqual({ ok: false, error: "token_invalid" });

    const ok = await login(env.ctx, { username: "alice_01", password: alice.password });
    if (!ok.ok) throw new Error(ok.error);
    expect(await currentUser(env.db, ok.sessionId, env.ctx.now())).toMatchObject({ username: "alice_01" });
  });

  test("rejects malformed input", async () => {
    expect(await register(env.ctx, { ...alice, username: "a b" })).toMatchObject({ error: "invalid_username" });
    expect(await register(env.ctx, { ...alice, email: "no-at" })).toMatchObject({ error: "invalid_email" });
    expect(await register(env.ctx, { ...alice, password: "short" })).toMatchObject({ error: "invalid_password" });
    expect(await register(env.ctx, { ...alice, password: "x".repeat(73) })).toMatchObject({ error: "invalid_password" });
  });

  test("duplicate username or email, even in parallel, is a clean error", async () => {
    const [a, b] = await Promise.all([register(env.ctx, alice), register(env.ctx, { ...alice, email: "other@x.io" })]);
    expect([a, b].filter((r) => r.ok)).toHaveLength(1);
    expect([a, b].find((r) => !r.ok)).toMatchObject({ error: "username_taken" });
    expect(await register(env.ctx, { ...alice, username: "bob" })).toMatchObject({ error: "email_taken" });
  });

  test("an activation link older than 24 hours is rejected", async () => {
    await register(env.ctx, alice);
    env.advance(ACTIVATE_TTL_MS + 1);
    expect(await activate(env.ctx, tokenOf(env.mails()[0]))).toEqual({ ok: false, error: "token_invalid" });
  });

  test("an account left unactivated for 7 days gives its username to a new registration", async () => {
    await register(env.ctx, alice);
    expect(await register(env.ctx, { ...alice, email: "new@x.io" })).toMatchObject({ error: "username_taken" });
    env.advance(STALE_UNACTIVATED_MS + 1);
    expect(await register(env.ctx, { ...alice, email: "new@x.io" })).toMatchObject({ ok: true });
    expect(await all(env.db, "SELECT email FROM users")).toEqual([{ email: "new@x.io" }]);
  });

  test("resend mails only unactivated accounts, retires the old link and respects 1 mail per minute", async () => {
    await register(env.ctx, alice);
    expect(await resendActivation(env.ctx, "alice@example.com")).toMatchObject({ ok: false, error: "mail_rate_limited" });
    env.advance(61_000);
    expect(await resendActivation(env.ctx, "ALICE_01")).toEqual({ ok: true });
    const [first, second] = env.mails();
    expect(await activate(env.ctx, tokenOf(first))).toEqual({ ok: false, error: "token_invalid" });
    expect(await activate(env.ctx, tokenOf(second))).toEqual({ ok: true });
    env.advance(61_000);
    expect(await resendActivation(env.ctx, "alice_01")).toEqual({ ok: true });
    expect(await resendActivation(env.ctx, "ghost")).toEqual({ ok: true });
    expect(env.mails()).toHaveLength(2);
  });

  test("register keeps the account when the mail limit blocks the mail", async () => {
    await register(env.ctx, alice);
    await all(env.db, "UPDATE rate_limits SET count = ?1 WHERE key LIKE 'mail-day:%'", MAIL_PER_DAY);
    expect(await register(env.ctx, { username: "bob", email: "bob@x.io", password: "password1" })).toMatchObject({
      ok: true,
      mailSent: false,
      mailError: "mail_quota",
    });
    expect(await all(env.db, "SELECT username FROM users ORDER BY username")).toHaveLength(2);
  });
});

describe("mail budget", () => {
  const bob = { username: "bob", email: "bob@x.io", password: "password1" };

  test("sign-ups alone cannot spend the mails kept for resends and resets", async () => {
    await activeAccount();
    await all(env.db, "UPDATE rate_limits SET count = ?1 WHERE key LIKE 'mail-day-signup:%'", SIGNUP_MAILS_PER_DAY);
    expect(await register(env.ctx, bob)).toMatchObject({ ok: true, mailSent: false, mailError: "mail_quota" });
    env.advance(60_000);
    expect(await resendActivation(env.ctx, "bob")).toEqual({ ok: true });
    expect(await requestPasswordReset(env.ctx, "alice_01")).toEqual({ ok: true });
    expect(env.mails().map((m) => m.to)).toEqual(["alice@example.com", "bob@x.io", "alice@example.com"]);
  });

  test("one network gets a fixed number of mail requests an hour, counted whether or not the account exists", async () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < REQUESTS_PER_NETWORK.max; i++) expect(await requestPasswordReset(env.ctx, `nobody${i}`, ip)).toEqual({ ok: true });
    expect(await register(env.ctx, bob, ip)).toMatchObject({ ok: false, error: "network_rate_limited", retryAfterSec: 3600 });
    expect(await resendActivation(env.ctx, "bob", ip)).toMatchObject({ error: "network_rate_limited" });
    expect(await all(env.db, "SELECT 1 FROM users")).toHaveLength(0);
    expect(await register(env.ctx, bob, "198.51.100.1")).toMatchObject({ ok: true, mailSent: true });
    env.advance(REQUESTS_PER_NETWORK.windowMs);
    expect(await register(env.ctx, { ...bob, username: "bob2", email: "bob2@x.io" }, ip)).toMatchObject({ ok: true });
  });

  test("local e2e (callerLimits off) never counts networks", async () => {
    env.cleanup();
    env = testAuthContext({ callerLimits: false });
    for (let i = 0; i <= REQUESTS_PER_NETWORK.max; i++) await requestPasswordReset(env.ctx, `nobody${i}`, "203.0.113.7");
    expect(await register(env.ctx, bob, "203.0.113.7")).toMatchObject({ ok: true });
  });

  test("networkKey groups an IPv6 /64 and refuses garbage", () => {
    expect(networkKey(" 203.0.113.7 ")).toBe("203.0.113.7");
    expect(networkKey("2001:db8:0:1::5")).toBe(networkKey("2001:0DB8:0000:0001:ffff:1:2:3"));
    expect(networkKey("2001:db8:0:1::5")).toBe("2001:db8:0:1::/64");
    expect(networkKey("::1")).toBe("0:0:0:0::/64");
    for (const bad of [null, "", "unknown", "1:2:3", "2001:db8::1::2", "zz::1"]) expect(networkKey(bad)).toBeNull();
  });
});

describe("login limits", () => {
  test("30 parallel wrong guesses check the password at most 10 times", async () => {
    await activeAccount();
    const { verifyPassword } = passwordModule;
    let checks = 0;
    const spy = (await import("vitest")).vi.spyOn(passwordModule, "verifyPassword").mockImplementation((...a) => {
      checks++;
      return verifyPassword(...a);
    });
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) => login(env.ctx, { username: "alice_01", password: `guess-${i}` })),
    );
    spy.mockRestore();
    expect(checks).toBeLessThanOrEqual(10);
    expect(results.filter((r) => !r.ok && r.error === "too_many_attempts")).toHaveLength(20);
  });

  test("after 10 failures the lock lasts 15 minutes from the attempt that tripped it", async () => {
    await activeAccount();
    for (let i = 0; i < 10; i++) {
      expect(await login(env.ctx, { ...alice, password: "wrong-pass" })).toMatchObject({ error: "bad_credentials" });
      env.advance(80_000); // ten guesses spread over ~13 minutes
    }
    expect(await login(env.ctx, alice)).toMatchObject({ ok: false, error: "too_many_attempts", retryAfterSec: 900 });
    env.advance(14 * 60_000);
    expect(await login(env.ctx, alice)).toMatchObject({ error: "too_many_attempts" });
    env.advance(60_000);
    expect(await login(env.ctx, alice)).toMatchObject({ ok: true });
  });

  test("unknown user and wrong password look the same", async () => {
    await activeAccount();
    expect(await login(env.ctx, { username: "ghost", password: "whatever1" })).toEqual({ ok: false, error: "bad_credentials" });
    expect(await login(env.ctx, { ...alice, password: "whatever1" })).toEqual({ ok: false, error: "bad_credentials" });
  });
});

describe("password reset", () => {
  test("new password works, old one and old sessions do not, the link is single-use", async () => {
    await activeAccount();
    const before = await login(env.ctx, alice);
    if (!before.ok) throw new Error(before.error);
    env.advance(61_000);
    expect(await requestPasswordReset(env.ctx, "alice@example.com")).toEqual({ ok: true });
    const link = env.mails().at(-1)!;
    expect(link.link).toContain("/#/reset/");
    expect(await resetPassword(env.ctx, tokenOf(link), "brand new pw")).toEqual({ ok: true });
    expect(await resetPassword(env.ctx, tokenOf(link), "another pw!")).toEqual({ ok: false, error: "token_invalid" });
    expect(await currentUser(env.db, before.sessionId, env.ctx.now())).toBeNull();
    expect(await login(env.ctx, alice)).toMatchObject({ error: "bad_credentials" });
    expect(await login(env.ctx, { ...alice, password: "brand new pw" })).toMatchObject({ ok: true });
  });

  test("unknown or unactivated accounts get no mail but the same answer", async () => {
    expect(await requestPasswordReset(env.ctx, "ghost@x.io")).toEqual({ ok: true });
    await register(env.ctx, alice);
    env.advance(61_000);
    expect(await requestPasswordReset(env.ctx, "alice_01")).toEqual({ ok: true });
    expect(env.mails().map((m) => m.subject)).toEqual([expect.stringContaining("Kích hoạt")]);
  });

  test("a reset link expires after one hour", async () => {
    await activeAccount();
    env.advance(61_000);
    await requestPasswordReset(env.ctx, "alice_01");
    env.advance(60 * 60_000 + 1);
    expect(await resetPassword(env.ctx, tokenOf(env.mails().at(-1)!), "brand new pw")).toEqual({ ok: false, error: "token_invalid" });
  });
});

test("the database never holds a raw password, token or session id", async () => {
  await activeAccount();
  const session = await login(env.ctx, alice);
  if (!session.ok) throw new Error(session.error);
  const secrets = [alice.password, session.sessionId, ...env.mails().map(tokenOf)];
  for (const table of ["users", "sessions", "email_tokens", "rate_limits"]) {
    const dump = JSON.stringify(await all(env.db, `SELECT * FROM ${table}`));
    for (const s of secrets) expect(dump, table).not.toContain(s);
  }
});

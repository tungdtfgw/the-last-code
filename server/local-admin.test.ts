import { afterEach, expect, test } from "vitest";
import { login, register } from "./auth/accounts";
import { all } from "./db/db";
import { ensureLocalAdmin, readLocalAdmin } from "./local-admin";
import { createLocalHandle } from "./local-handler";
import { testAuthContext } from "./test-helpers";

let env: ReturnType<typeof testAuthContext> | undefined;
afterEach(() => {
  env?.cleanup();
  env = undefined;
});

test("provisions an activated account that can sign in, and resets its password on the next start", async () => {
  const t = (env = testAuthContext());
  const admin = readLocalAdmin({ LOCAL_ADMIN_USERNAME: " TungDT ", LOCAL_ADMIN_PASSWORD: "mat-khau-1" });
  if (!admin || typeof admin === "string") throw new Error(String(admin));
  expect(admin).toEqual({ username: "tungdt", password: "mat-khau-1", email: "tungdt@local.test" });

  await ensureLocalAdmin(t.db, admin);
  expect(await login(t.ctx, { username: "tungdt", password: "mat-khau-1" })).toMatchObject({ ok: true });

  await ensureLocalAdmin(t.db, { ...admin, password: "mat-khau-2" });
  expect(await login(t.ctx, { username: "tungdt", password: "mat-khau-1" })).toMatchObject({ ok: false });
  expect(await login(t.ctx, { username: "tungdt", password: "mat-khau-2" })).toMatchObject({ ok: true });
  expect(await all(t.db, "SELECT username FROM users")).toHaveLength(1);
});

test("an account registered by hand but never activated is activated and keeps its email", async () => {
  const t = (env = testAuthContext());
  await register(t.ctx, { username: "tungdt", email: "t@example.com", password: "dang-ky-tay" }, "203.0.113.1");
  await ensureLocalAdmin(t.db, { username: "tungdt", password: "mat-khau-1", email: "tungdt@local.test" });
  expect(await all(t.db, "SELECT email, activated_at IS NOT NULL AS active FROM users")).toEqual([{ email: "t@example.com", active: 1 }]);
});

test("unusable settings are reported, not applied", () => {
  expect(readLocalAdmin({})).toBeNull();
  expect(readLocalAdmin({ LOCAL_ADMIN_USERNAME: "ab", LOCAL_ADMIN_PASSWORD: "mat-khau-1" })).toMatch(/LOCAL_ADMIN_USERNAME/);
  expect(readLocalAdmin({ LOCAL_ADMIN_USERNAME: "tungdt", LOCAL_ADMIN_PASSWORD: "ngan" })).toMatch(/LOCAL_ADMIN_PASSWORD/);
});

test("the local admin gets the admin API without being listed in ADMIN_USERNAMES", async () => {
  const t = (env = testAuthContext());
  const handle = await createLocalHandle({
    DB_DRIVER: "sqlite",
    SQLITE_PATH: ":memory:",
    MAIL_TRANSPORT: "outbox",
    OUTBOX_DIR: t.outboxDir,
    APP_ORIGIN: "http://localhost:5173",
    LOCAL_ADMIN_USERNAME: "tungdt",
    LOCAL_ADMIN_PASSWORD: "mat-khau-1",
  });
  const res = await handle(
    new Request("http://localhost:5173/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "tungdt", password: "mat-khau-1" }),
    }),
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ user: { username: "tungdt", isAdmin: true } });
});

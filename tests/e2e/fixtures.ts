/**
 * Every game route needs a signed-in player (QĐ-09). This `test` gives each test
 * a fresh, activated account and puts its session cookie in the context, so
 * `page` starts signed in. Accounts are made through the real API of the preview
 * server (SQLite in `.data/e2e.sqlite`, mails in `.data/e2e-outbox/`).
 *
 * Tests that seed progress through `localStorage` in `addInitScript` keep working:
 * on entry the game folds local progress into the account and clears it (QĐ-10).
 * The fold is idempotent and never overwrites a draft the account already has,
 * so the script running again after each reload does not undo what a test typed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { request, test as base, type Browser, type BrowserContext, type BrowserContextOptions } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

export const BASE_URL = "http://localhost:4173";
export const OUTBOX_DIR = ".data/e2e-outbox";
export const PASSWORD = "mat-khau-e2e";

export interface Account {
  username: string;
  email: string;
  password: string;
  session: string;
}

let seq = 0;
export const uniqueName = (prefix = "e2e") => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`.slice(0, 20);

/** Newest mail sent to `email`, waiting up to 5 s for the outbox file. */
export async function latestMail(email: string): Promise<{ to: string; subject: string; link: string }> {
  for (let i = 0; i < 50; i++) {
    const files = (() => {
      try {
        return readdirSync(OUTBOX_DIR).filter((f) => f.endsWith(`-${email}.json`)).sort();
      } catch {
        return [];
      }
    })();
    if (files.length) return JSON.parse(readFileSync(join(OUTBOX_DIR, files.at(-1)!), "utf8"));
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`no mail for ${email} in ${OUTBOX_DIR}`);
}

export const mailCount = (email: string) => {
  try {
    return readdirSync(OUTBOX_DIR).filter((f) => f.endsWith(`-${email}.json`)).length;
  } catch {
    return 0;
  }
};

/** The token at the end of a mail link (`…/#/activate/<token>`). */
export const tokenOf = (link: string) => link.split("/").pop()!;

/**
 * Registers and, unless told otherwise, activates and signs in an account through the API.
 * `username` names it (the admin in `ADMIN_USERNAMES`); a name an earlier test already
 * registered is only signed in.
 */
export async function createAccount(opts: { activate?: boolean; username?: string } = {}): Promise<Account> {
  const api = await request.newContext({ baseURL: BASE_URL });
  const username = opts.username ?? uniqueName();
  const email = `${username}@e2e.test`;
  const reg = await api.post("/api/auth/register", { data: { username, email, password: PASSWORD } });
  const taken = reg.status() === 409 && opts.username !== undefined && (await reg.json()).error === "username_taken";
  if (reg.status() !== 201 && !taken) throw new Error(`register ${reg.status()}: ${await reg.text()}`);
  let session = "";
  if (opts.activate !== false) {
    if (!taken) await api.post("/api/auth/activate", { data: { token: tokenOf((await latestMail(email)).link) } });
    const login = await api.post("/api/auth/login", { data: { username, password: PASSWORD } });
    if (!login.ok()) throw new Error(`login ${login.status()}`);
    session = /tlc_session=([^;]+)/.exec(login.headers()["set-cookie"] ?? "")?.[1] ?? "";
  }
  await api.dispose();
  return { username, email, password: PASSWORD, session };
}

export async function signIn(context: BrowserContext, account: Account) {
  await context.addCookies([{ name: "tlc_session", value: account.session, url: BASE_URL, httpOnly: true, sameSite: "Lax" }]);
}

/** The admin of the e2e server (`ADMIN_USERNAMES` in `playwright.config.ts`). */
export const ADMIN_USERNAME = "e2e_admin";

/** For tests that build their own context (reduced motion, viewport, blocked storage): a new account, signed in. */
export async function newSignedInContext(browser: Browser, options: BrowserContextOptions = {}, account?: Account) {
  const context = await browser.newContext(options);
  await signIn(context, account ?? (await createAccount()));
  return context;
}

export const test = base.extend<{ account: Account }>({
  account: async ({}, use) => {
    await use(await createAccount());
  },
  context: async ({ context, account }, use) => {
    await signIn(context, account);
    await use(context);
  },
});

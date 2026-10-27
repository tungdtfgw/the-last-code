import { isUsername, normalizeUsername } from "../src/account/account-rules.js";
import type { DbConfig } from "./db/create-db.js";

export interface ServerConfig {
  db: DbConfig;
  mail: { transport: "smtp"; user: string; appPassword: string } | { transport: "outbox"; dir: string };
  origin: string;
  /** `Secure` on the session cookie; off only for a plain-http origin (localhost). */
  secureCookies: boolean;
  callerLimits: boolean;
  /** Usernames allowed on the admin page (`ADMIN_USERNAMES`, comma-separated). Empty: no admin. */
  admins: string[];
}

export type ConfigResult = { ok: true; config: ServerConfig } | { ok: false; missing: string[] };

type Env = Record<string, string | undefined>;
type Need = (name: string) => string;

function needer(env: Env, missing: string[]): Need {
  return (name) => {
    const v = env[name]?.trim();
    if (!v) missing.push(name);
    return v ?? "";
  };
}

function dbFrom(env: Env, need: Need, missing: string[]): DbConfig {
  const driver = env.DB_DRIVER?.trim() || "gateway";
  if (driver === "sqlite") return { driver: "sqlite", path: env.SQLITE_PATH?.trim() || ".data/dev.sqlite" };
  if (driver === "gateway") return { driver: "gateway", url: need("D1_GATEWAY_URL"), secret: need("D1_GATEWAY_SECRET") };
  missing.push("DB_DRIVER (gateway|sqlite)");
  return { driver: "sqlite", path: "" };
}

/** `ADMIN_USERNAMES`: normalised like a login; a malformed name is dropped and logged. */
export function readAdmins(raw: string | undefined): string[] {
  const out = new Set<string>();
  for (const part of (raw ?? "").split(",")) {
    if (part.trim() === "") continue;
    const name = normalizeUsername(part);
    if (isUsername(name)) out.add(name);
    else console.warn(`[config] ADMIN_USERNAMES: bỏ tên sai dạng "${part.trim()}"`);
  }
  return [...out];
}

/**
 * Reads the environment once. Production defaults to the D1 gateway and Gmail
 * SMTP; the Vite plugin sets the local defaults (SQLite, outbox). The per-email
 * mail limit can be switched off only on SQLite, so a deploy can never do it.
 */
export function readConfig(env: Env = process.env): ConfigResult {
  const missing: string[] = [];
  const need = needer(env, missing);
  const db = dbFrom(env, need, missing);

  const transport = env.MAIL_TRANSPORT?.trim() || "smtp";
  let mail: ServerConfig["mail"];
  if (transport === "outbox" && db.driver === "sqlite") mail = { transport: "outbox", dir: env.OUTBOX_DIR?.trim() || ".data/outbox" };
  else if (transport === "smtp") mail = { transport: "smtp", user: need("GMAIL_USER"), appPassword: need("GMAIL_APP_PASSWORD") };
  else {
    missing.push("MAIL_TRANSPORT (smtp, or outbox with DB_DRIVER=sqlite)");
    mail = { transport: "outbox", dir: "" };
  }

  const origin = need("APP_ORIGIN").replace(/\/+$/, "");
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    config: {
      db,
      mail,
      origin,
      secureCookies: origin.startsWith("https://"),
      callerLimits: !(db.driver === "sqlite" && env.AUTH_RATE_LIMIT === "off"),
      admins: readAdmins(env.ADMIN_USERNAMES),
    },
  };
}

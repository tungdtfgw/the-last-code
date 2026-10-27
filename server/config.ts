import type { DbConfig } from "./db/create-db.js";

export interface ServerConfig {
  db: DbConfig;
  mail: { transport: "smtp"; user: string; appPassword: string } | { transport: "outbox"; dir: string };
  origin: string;
  /** `Secure` on the session cookie; off only for a plain-http origin (localhost). */
  secureCookies: boolean;
  callerLimits: boolean;
}

export type ConfigResult = { ok: true; config: ServerConfig } | { ok: false; missing: string[] };

/**
 * Reads the environment once. Production defaults to the D1 gateway and Gmail
 * SMTP; the Vite plugin sets the local defaults (SQLite, outbox). The per-email
 * mail limit can be switched off only on SQLite, so a deploy can never do it.
 */
export function readConfig(env: Record<string, string | undefined> = process.env): ConfigResult {
  const missing: string[] = [];
  const need = (name: string) => {
    const v = env[name]?.trim();
    if (!v) missing.push(name);
    return v ?? "";
  };

  const driver = env.DB_DRIVER?.trim() || "gateway";
  let db: DbConfig;
  if (driver === "sqlite") db = { driver: "sqlite", path: env.SQLITE_PATH?.trim() || ".data/dev.sqlite" };
  else if (driver === "gateway") db = { driver: "gateway", url: need("D1_GATEWAY_URL"), secret: need("D1_GATEWAY_SECRET") };
  else {
    missing.push("DB_DRIVER (gateway|sqlite)");
    db = { driver: "sqlite", path: "" };
  }

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
    },
  };
}

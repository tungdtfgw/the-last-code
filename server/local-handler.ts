import { readConfig } from "./config.js";
import { GatewayDb } from "./db/gateway-db.js";
import { SqliteDb } from "./db/sqlite-db.js";
import { createHandler, depsFromConfig, misconfigured } from "./router.js";

/**
 * The API for `vite dev` / `vite preview`. Loaded once through Vite's module
 * runner, which closes after loading, so every driver is imported statically here.
 */
export function createLocalHandle(env: Record<string, string | undefined> = process.env) {
  const result = readConfig(env);
  if (!result.ok) return misconfigured(result.missing);
  const { db } = result.config;
  return createHandler(depsFromConfig(result.config, db.driver === "sqlite" ? new SqliteDb(db.path) : new GatewayDb(db.url, db.secret)));
}

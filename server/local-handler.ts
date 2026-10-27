import { readConfig } from "./config.js";
import { GatewayDb } from "./db/gateway-db.js";
import { SqliteDb } from "./db/sqlite-db.js";
import { ensureLocalAdmin, readLocalAdmin } from "./local-admin.js";
import { createHandler, depsFromConfig, misconfigured, warnUnclaimedAdmins } from "./router.js";

/**
 * The API for `vite dev` / `vite preview`. Loaded once through Vite's module
 * runner, which closes after loading, so every driver is imported statically here.
 * With SQLite, `LOCAL_ADMIN_*` provisions an activated admin account on start.
 */
export async function createLocalHandle(env: Record<string, string | undefined> = process.env) {
  const result = readConfig(env);
  if (!result.ok) return misconfigured(result.missing);
  const { db: dbConfig, admins } = result.config;
  const db = dbConfig.driver === "sqlite" ? new SqliteDb(dbConfig.path) : new GatewayDb(dbConfig.url, dbConfig.secret);
  const deps = depsFromConfig(result.config, db);
  const localAdmin = readLocalAdmin(env);
  if (typeof localAdmin === "string") console.warn(`[local-admin] bỏ qua: ${localAdmin}`);
  else if (localAdmin && dbConfig.driver !== "sqlite") console.warn("[local-admin] bỏ qua: chỉ dùng với DB_DRIVER=sqlite");
  else if (localAdmin) {
    try {
      await ensureLocalAdmin(db, localAdmin);
      deps.admins = new Set([...admins, localAdmin.username]);
      console.info(`[local-admin] tài khoản admin "${localAdmin.username}" sẵn sàng`);
    } catch (err) {
      console.warn("[local-admin] không tạo được tài khoản:", err instanceof Error ? err.message : err);
    }
  }
  void warnUnclaimedAdmins(db, [...(deps.admins ?? [])]);
  return createHandler(deps);
}

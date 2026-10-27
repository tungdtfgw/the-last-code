import type { Db } from "./db.js";

export type DbConfig =
  | { driver: "gateway"; url: string; secret: string }
  | { driver: "sqlite"; path: string };

/** Builds the driver named by the config. SQLite is loaded lazily so a deploy never imports `node:sqlite`. */
export async function createDb(config: DbConfig): Promise<Db> {
  if (config.driver === "gateway") {
    const { GatewayDb } = await import("./gateway-db.js");
    return new GatewayDb(config.url, config.secret);
  }
  const { SqliteDb } = await import("./sqlite-db.js");
  return new SqliteDb(config.path);
}

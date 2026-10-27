export type Param = string | number | null;
export type Row = Record<string, unknown>;

export interface Statement {
  sql: string;
  params: Param[];
}

/**
 * The only door to the database. D1 (through the gateway Worker) and local
 * SQLite both speak the same SQLite dialect, so callers write one SQL.
 */
export interface Db {
  /** Runs the statements in order inside one transaction; returns each statement's rows. */
  batch(statements: Statement[]): Promise<Row[][]>;
}

/** Thrown for any database failure; the message never reaches an API response. */
export class DbError extends Error {
  override name = "DbError";
}

export const sql = (text: string, ...params: Param[]): Statement => ({ sql: text, params });

export async function all(db: Db, text: string, ...params: Param[]): Promise<Row[]> {
  const [rows] = await db.batch([sql(text, ...params)]);
  return rows;
}

export async function first(db: Db, text: string, ...params: Param[]): Promise<Row | null> {
  return (await all(db, text, ...params))[0] ?? null;
}

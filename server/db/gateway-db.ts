import { DbError, type Db, type Row, type Statement } from "./db.js";

const TIMEOUT_MS = 8000;

/** Production driver: posts each batch to the `d1-gateway` Worker, which runs it on D1. */
export class GatewayDb implements Db {
  constructor(
    private readonly url: string,
    private readonly secret: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async batch(statements: Statement[]): Promise<Row[][]> {
    let res: Response;
    try {
      res = await this.fetchImpl(new URL("/batch", this.url), {
        method: "POST",
        headers: { authorization: `Bearer ${this.secret}`, "content-type": "application/json" },
        body: JSON.stringify({ statements }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new DbError(`gateway unreachable: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new DbError(`gateway ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { results?: Row[][] };
    if (!Array.isArray(data.results)) throw new DbError("gateway returned no results");
    return data.results;
  }
}

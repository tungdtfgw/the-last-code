import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { loadEnv, runnerImport, type Connect, type Plugin } from "vite";

type Handle = (request: Request) => Promise<Response>;

const LOCAL_HANDLER = fileURLToPath(new URL("./local-handler.ts", import.meta.url));

async function toRequest(req: IncomingMessage): Promise<Request> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(name, v);
    else if (value !== undefined) headers.set(name, value);
  }
  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const all = Buffer.concat(chunks);
    body = all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength) as ArrayBuffer;
  }
  return new Request(url, { method: req.method, headers, body });
}

async function send(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => {
    if (name !== "set-cookie") res.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader("set-cookie", cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}

/**
 * Serves `/api/*` from `server/router.ts` (through `local-handler.ts`) inside `vite dev` and `vite preview`,
 * so local play and e2e get the same API as Vercel. The router is loaded with
 * Vite's module runner when the server starts, never bundled into the client.
 * Local defaults (SQLite, mail outbox, origin from the port) apply only to unset variables.
 * `vite dev` also fills unset variables from `.env`/`.env.local` (e.g. `LOCAL_ADMIN_*`);
 * `vite preview` does not, so e2e runs only see what Playwright sets.
 */
export function apiPlugin(): Plugin {
  let handle: Promise<Handle> | null = null;

  const middleware = (port: number): Connect.NextHandleFunction => {
    process.env.DB_DRIVER ??= "sqlite";
    process.env.MAIL_TRANSPORT ??= "outbox";
    process.env.APP_ORIGIN ??= `http://localhost:${port}`;
    return (req, res, next) => {
      if (!req.url?.startsWith("/api/")) return next();
      handle ??= runnerImport<{ createLocalHandle: () => Promise<Handle> }>(LOCAL_HANDLER).then((m) => m.module.createLocalHandle());
      handle
        .then(async (h) => send(res, await h(await toRequest(req))))
        .catch((err) => {
          console.error("[api]", err);
          if (!res.headersSent) res.statusCode = 500;
          res.end();
        });
    };
  };

  return {
    name: "the-last-code-api",
    configureServer(server) {
      const fileEnv = loadEnv(server.config.mode, server.config.envDir || server.config.root, "");
      for (const [name, value] of Object.entries(fileEnv)) process.env[name] ??= value;
      server.middlewares.use(middleware(server.config.server.port ?? 5173));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(server.config.preview.port ?? 4173));
    },
  };
}

import { ROUTE_ID } from "../shell/route-id";

export type AuthRoute =
  | { kind: "login" | "register" | "forgot" | "account" }
  /** `token` is null once the screen has taken it out of the address bar (or the link was cut). */
  | { kind: "activate" | "reset"; token: string | null }
  /** Admin page: the document list, or one level or chapter's text. */
  | { kind: "admin" }
  | { kind: "admin-doc"; doc: "level" | "chapter"; id: string };

/** Account screens: `#/admin`, `#/admin/(level|chapter)/<id>`, `#/login`, `#/register`, `#/forgot`, `#/account`, `#/activate[/<token>]`, `#/reset[/<token>]`. Null for game routes. */
export function parseAuthRoute(hash: string): AuthRoute | null {
  const path = hash.replace(/^#/, "").replace(/\/+$/, "");
  const simple = /^\/(login|register|forgot|account)$/.exec(path);
  if (simple) return { kind: simple[1] as "login" | "register" | "forgot" | "account" };
  if (path === "/admin") return { kind: "admin" };
  const admin = /^\/admin\/(level|chapter)\/([^/]+)$/.exec(path);
  if (admin) return ROUTE_ID.test(admin[2]) ? { kind: "admin-doc", doc: admin[1] as "level" | "chapter", id: admin[2] } : null;
  const linked = /^\/(activate|reset)(?:\/([^/]*))?$/.exec(path);
  if (!linked) return null;
  const token = linked[2] && ROUTE_ID.test(linked[2]) ? linked[2] : null;
  return { kind: linked[1] as "activate" | "reset", token };
}

/** Screens a signed-out player may see; everything else sends them to `#/login`. */
export const isPublicAuthRoute = (r: AuthRoute | null) => r !== null && r.kind !== "account" && !isAdminRoute(r);
/** `#/admin*`: signed-in admins only (the server checks every request; this only picks the screen). */
export const isAdminRoute = (r: AuthRoute | null) => r !== null && (r.kind === "admin" || r.kind === "admin-doc");
/** Screens that make no sense once signed in; they lead to the title instead. */
export const isSignedOutOnly = (r: AuthRoute | null) => r !== null && (r.kind === "login" || r.kind === "register" || r.kind === "forgot");

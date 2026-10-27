import { ROUTE_ID } from "../shell/route-id";

export type AuthRoute =
  | { kind: "login" | "register" | "forgot" | "account" }
  /** `token` is null once the screen has taken it out of the address bar (or the link was cut). */
  | { kind: "activate" | "reset"; token: string | null };

/** Account screens: `#/login`, `#/register`, `#/forgot`, `#/account`, `#/activate[/<token>]`, `#/reset[/<token>]`. Null for game routes. */
export function parseAuthRoute(hash: string): AuthRoute | null {
  const path = hash.replace(/^#/, "").replace(/\/+$/, "");
  const simple = /^\/(login|register|forgot|account)$/.exec(path);
  if (simple) return { kind: simple[1] as "login" | "register" | "forgot" | "account" };
  const linked = /^\/(activate|reset)(?:\/([^/]*))?$/.exec(path);
  if (!linked) return null;
  const token = linked[2] && ROUTE_ID.test(linked[2]) ? linked[2] : null;
  return { kind: linked[1] as "activate" | "reset", token };
}

/** Screens a signed-out player may see; everything else sends them to `#/login`. */
export const isPublicAuthRoute = (r: AuthRoute | null) => r !== null && r.kind !== "account";
/** Screens that make no sense once signed in; they lead to the title instead. */
export const isSignedOutOnly = (r: AuthRoute | null) => r !== null && (r.kind === "login" || r.kind === "register" || r.kind === "forgot");

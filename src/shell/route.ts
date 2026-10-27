import type { Route } from "../story/progression";
import { ROUTE_ID } from "./route-id";

export { ROUTE_ID };

/** `#/`, empty or unknown → title; `#/map`; `#/story/<id>`; `#/level/<id>`; `#/learn/<id>`. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/\/+$/, "");
  if (path === "/map") return { kind: "map" };
  const m = path.match(/^\/(story|level|learn)\/([^/]+)$/);
  if (m) {
    let id: string;
    try {
      id = decodeURIComponent(m[2]);
    } catch {
      return { kind: "title" }; // malformed escape: treat as an unknown hash
    }
    if (ROUTE_ID.test(id)) return { kind: m[1] as "story" | "level" | "learn", id };
  }
  return { kind: "title" };
}

export function routeHash(route: Route): string {
  switch (route.kind) {
    case "title":
      return "#/";
    case "map":
      return "#/map";
    default:
      return `#/${route.kind}/${route.id}`;
  }
}

export const sameRoute = (a: Route, b: Route) => routeHash(a) === routeHash(b);

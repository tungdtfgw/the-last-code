import { expect, test } from "vitest";
import { parseRoute, routeHash } from "./route";

test.each([
  ["#/map", { kind: "map" }],
  ["#/map/2", { kind: "map", chapter: 2 }],
  ["#/map/2/", { kind: "map", chapter: 2 }],
  ["#/map/0", { kind: "title" }],
  ["#/map/abc", { kind: "title" }],
  ["#/map/100", { kind: "title" }],
  ["#/story/prologue-2", { kind: "story", id: "prologue-2" }],
])("%s", (hash, route) => {
  expect(parseRoute(hash)).toEqual(route);
});

test("map routes keep their address both ways", () => {
  for (const hash of ["#/map", "#/map/2"]) expect(routeHash(parseRoute(hash))).toBe(hash);
});

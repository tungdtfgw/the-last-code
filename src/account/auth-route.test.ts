import { expect, test } from "vitest";
import { parseRoute } from "../shell/route";
import { isAdminRoute, isPublicAuthRoute, parseAuthRoute } from "./auth-route";

test("account hashes parse; game hashes are left to the game router", () => {
  const token = "A".repeat(40) + "_-9";
  expect(parseAuthRoute("#/login")).toEqual({ kind: "login" });
  expect(parseAuthRoute("#/register/")).toEqual({ kind: "register" });
  expect(parseAuthRoute(`#/activate/${token}`)).toEqual({ kind: "activate", token });
  expect(parseAuthRoute("#/reset")).toEqual({ kind: "reset", token: null });
  expect(parseAuthRoute("#/reset/bad token!")).toEqual({ kind: "reset", token: null });
  for (const game of ["", "#/", "#/map", "#/level/1.1", "#/story/prologue", "#/loginx"]) expect(parseAuthRoute(game)).toBeNull();
  // The game router reads account hashes as unknown, so the two never fight over one hash.
  expect(parseRoute("#/login")).toEqual({ kind: "title" });
});

test("admin hashes are signed-in only routes", () => {
  expect(parseAuthRoute("#/admin")).toEqual({ kind: "admin" });
  expect(parseAuthRoute("#/admin/level/1.4")).toEqual({ kind: "admin-doc", doc: "level", id: "1.4" });
  expect(parseAuthRoute("#/admin/chapter/1/")).toEqual({ kind: "admin-doc", doc: "chapter", id: "1" });
  for (const bad of ["#/admin/level/a b", "#/admin/story/1", "#/admin/level", "#/admin/level/1.4/x"]) expect(parseAuthRoute(bad)).toBeNull();
  for (const hash of ["#/admin", "#/admin/level/1.4"]) {
    const r = parseAuthRoute(hash);
    expect(isPublicAuthRoute(r)).toBe(false);
    expect(isAdminRoute(r)).toBe(true);
  }
});

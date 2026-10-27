import { expect, test } from "vitest";
import { parseRoute } from "../shell/route";
import { parseAuthRoute } from "./auth-route";

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

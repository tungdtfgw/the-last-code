import { describe, expect, test, vi } from "vitest";
import level14 from "../levels/level-1-4.json";
import sample from "../../tests/fixtures/levels/level-test-sample.json";
import { buildRegistry, getDefaultRegistry } from "./level-registry";

describe("level registry", () => {
  test("a new level only needs a JSON module (AC 6)", () => {
    const reg = buildRegistry({ "./level-1-4.json": { default: level14 }, "./level-9-9.json": sample });
    expect(reg.listLevels().map((l) => l.id)).toEqual(["1.4", "9.9"]);
    expect(reg.getLevel("9.9")?.title).toBe("Level thử nghiệm");
  });

  test("broken modules are dropped without throwing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const reg = buildRegistry({ "./a.json": level14, "./broken.json": { id: 3 }, "./null.json": null });
    expect(reg.listLevels()).toHaveLength(1);
    expect(Object.keys(reg.invalid).sort()).toEqual(["./broken.json", "./null.json"]);
    spy.mockRestore();
  });

  test("default registry globs src/levels", () => {
    expect(getDefaultRegistry().getLevel("1.4")?.title).toBe("Tín hiệu lệch pha");
  });
});

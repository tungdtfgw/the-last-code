import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import sample from "../../tests/fixtures/levels/level-test-sample.json";
import { levelFiles, migratedTexts, realLevelJson } from "../../tests/content-fixture";
import { extractText, LEVEL_TEXT } from "../content/text-fields";
import { buildRegistry, NO_TEXT } from "./level-registry";

const puzzle14 = levelFiles()["../levels/level-1-4.json"];
const textOf = () => JSON.parse(JSON.stringify(migratedTexts()["level:1.4"].text));
const withText = (text: unknown) => buildRegistry({ "./level-1-4.json": puzzle14 }, { "level:1.4": { revision: 3, text } });

beforeEach(() => void vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe("level registry", () => {
  test("a new level needs its puzzle module and its text", () => {
    const reg = buildRegistry(
      { "./level-1-4.json": { default: puzzle14 }, "./level-9-9.json": sample },
      { "level:1.4": migratedTexts()["level:1.4"], "level:9.9": { revision: 1, text: extractText(sample, LEVEL_TEXT) } },
    );
    expect(reg.listLevels().map((l) => l.id)).toEqual(["1.4", "9.9"]);
    expect(reg.getLevel("9.9")?.title).toBe("Level thử nghiệm");
  });

  test("a bundled level without text in D1 is broken, so the map shows it as broken", () => {
    const reg = buildRegistry({ "./level-1-4.json": puzzle14 }, {});
    expect(reg.listLevels()).toEqual([]);
    expect(reg.invalidIds.has("1.4")).toBe(true);
    expect(reg.invalid["./level-1-4.json"]).toEqual([NO_TEXT]);
  });

  test("broken modules are dropped without throwing", () => {
    const reg = buildRegistry({ "./a.json": puzzle14, "./broken.json": { id: 3 }, "./null.json": null }, migratedTexts());
    expect(reg.listLevels()).toHaveLength(1);
    expect(Object.keys(reg.invalid).sort()).toEqual(["./broken.json", "./null.json"]);
  });

  test("D1 text goes onto the puzzle and leaves the puzzle alone", () => {
    const text = textOf();
    text.briefing = "Lời dẫn từ D1.";
    const reg = withText(text);
    expect(reg.getLevel("1.4")?.briefing).toBe("Lời dẫn từ D1.");
    expect(reg.getLevel("1.4")?.tests).toEqual(realLevelJson("1.4").tests);
  });

  test("text that breaks the level makes it broken, as a broken file would", () => {
    const text = textOf();
    delete text.reactions.generic;
    const reg = withText(text);
    expect(reg.invalidIds.has("1.4")).toBe(true);
    expect(reg.listLevels()).toEqual([]);
  });

  test("text whose objectives no longer line up with the puzzle makes the level broken", () => {
    const text = textOf();
    text.objectives.reverse();
    const reg = withText(text);
    expect(reg.listLevels()).toEqual([]);
    expect(reg.invalid["./level-1-4.json"].join("\n")).toMatch(/^objectives\[0\]/);
  });

  test("a leaking ECHO line in D1 makes the level broken, the same check as a save", () => {
    const text = textOf();
    text.reactions.wrong_value = "Dùng int là xong.";
    expect(withText(text).invalidIds.has("1.4")).toBe(true);
  });

  test("text for a level that is not bundled is ignored", () => {
    const reg = buildRegistry({ "./level-1-4.json": puzzle14 }, { ...migratedTexts(), "level:7.7": { revision: 1, text: { briefing: "x" } } });
    expect(reg.listLevels().map((l) => l.id)).toEqual(["1.4"]);
  });
});

import { describe, expect, test } from "vitest";
import { runHarness } from "../../tests/integration/run-harness";
import { realLevel } from "../../tests/content-fixture";
import { classifyRun } from "../game/classify-run";
import { buildInterrogationTimeline, EMPTY_CHANNEL, summarizeInterrogation } from "./interrogation-timeline";

const level = realLevel("1.6");
const HEAD = level.starter_code.split("\n").slice(0, 5).join("\n");
const body = (lines: string[]) => `${HEAD}\n${lines.join("\n")}\n`;
const timeline = (text: string) => buildInterrogationTimeline(classifyRun({ kind: "ok", data: runHarness(level, text) }, level), level);
const states = (xs: { state: string }[]) => xs.map((x) => x.state);

const SOLVED = ["ma_hoi = int(input())", "ca = input()", 'print(f"DANH TINH: {ho_ten}")', 'print(f"MA DAP: {ma_hoi + so_khu}")', 'print(f"CA {ca} DA DUYET")'];
const replace = (i: number, line: string) => SOLVED.map((l, k) => (k === i ? line : l));

describe("interrogation timeline (GDD 1.6 §5, §12)", () => {
  test("starter code: one card read, line 1 rejected at position 12, line 2 breaks with the error", () => {
    const t = timeline(level.starter_code);
    expect(t.filter((f) => f.scene.channel === "feeding").map((f) => f.scene.feeding)).toEqual([0]);
    const end = t.at(-1)!.scene;
    expect(states(end.questions)).toEqual(["read", "unread"]);
    expect(states(end.slots)).toEqual(["dropped", "error", "unsent"]);
    expect(end.slots[0].label).toBe("TRẠM BÁC · vị trí 12");
    expect(end.slots[1].label).toBe("TypeError · dòng 8");
    expect(end.slots[2].label).toBe("CHƯA GỬI");
    expect(end.station).toBe("closed");
    expect(t.flatMap((f) => f.cues)).toEqual(["terminal_line", "scan_reject", "alarm"]);
  });

  test("an error before the first read: every card stays unread, none hidden", () => {
    const end = timeline(body(["print(ho_ten + so_khu)", ...SOLVED])).at(-1)!.scene;
    expect(end.questions).toEqual([
      { text: "4172", state: "unread" },
      { text: "DEM", state: "unread" },
    ]);
    expect(states(end.slots)).toEqual(["error", "unsent", "unsent"]);
  });

  test("syntax error: nothing read, nothing sent", () => {
    const t = timeline(body(["ma_hoi = input(", ...SOLVED.slice(1)]));
    expect(t.at(-1)!.scene).toMatchObject({ laptop: "compile_error", status: "TRÌNH DỊCH TỪ CHỐI" });
    expect(t.every((f) => f.scene.questions.every((q) => q.state === "unread"))).toBe(true);
  });

  test("a missing and an extra line", () => {
    expect(states(timeline(body(SOLVED.slice(0, 4))).at(-1)!.scene.slots)).toEqual(["sent", "sent", "missing"]);
    const extra = timeline(body([...SOLVED, 'print("XONG")'])).at(-1)!.scene;
    expect(extra.extra).toEqual([expect.objectContaining({ state: "extra", expected: "XONG" })]);
  });

  test("a prompt printed with the answer is marked in that row", () => {
    const t = timeline(body(replace(0, 'ma_hoi = int(input("Ma hoi: "))')));
    const end = t.at(-1)!.scene;
    expect(end.slots[0]).toMatchObject({ state: "dropped", label: "TRẠM BÁC · vị trí 1" });
    expect(end.promptMarks).toEqual([{ line: 1, start: 0, end: 7 }]);
    expect(summarizeInterrogation(t)).toContain("Lời nhắc của chương trình lẫn vào câu trả lời.");
  });

  test("reading past the last line: both cards read, the slot empty, a red lamp", () => {
    const t = timeline(body(["a = input()", "b = input()", "c = input()", ...SOLVED.slice(2)]));
    const end = t.at(-1)!.scene;
    expect(states(end.questions)).toEqual(["read", "read", "missing"]);
    expect(end).toMatchObject({ channel: "empty", status: EMPTY_CHANNEL });
    expect(states(end.slots)).toEqual(["error", "unsent", "unsent"]);
    expect(summarizeInterrogation(t)).toBe(
      "Trạm gửi 2 dòng, chương trình đọc 2. Chương trình đòi thêm một dòng: kênh nhập hết dòng. Trạm nhận 0/3 dòng trả lời. Lỗi EOFError · dòng 8. Trạm chưa duyệt.",
    );
  });

  test("counter-attack survived: new questions read, the station approves in full", () => {
    const t = timeline(body(SOLVED));
    const half = t.find((f) => f.scene.station === "half")!;
    expect(half.scene.status).toBe("TRẠM DUYỆT MỘT NỬA");
    expect(half.cues).toEqual(["gate_open"]);
    const swap = t.find((f) => f.scene.wave === "counter")!;
    expect(swap.cues).toEqual(["siren"]);
    expect(swap.scene).toMatchObject({ shake: true, banner: level.counter_attack_banner });
    expect(swap.scene.questions).toEqual([
      { text: "9035", state: "unread" },
      { text: "SANG", state: "unread" },
    ]);
    const end = t.at(-1)!;
    expect(end.scene).toMatchObject({ station: "open", status: "TRẠM DUYỆT HOÀN TOÀN" });
    expect(states(end.scene.questions)).toEqual(["read", "read"]);
    expect(end.cues).toEqual(["gate_open", "star"]);
  });

  test("counter-attack failed: the hard-coded shift line is rejected, back to half", () => {
    const end = timeline(body(['ma_hoi = int(input())', ...SOLVED.slice(2, 4), 'print("CA DEM DA DUYET")'])).at(-1)!;
    expect(end.scene).toMatchObject({ wave: "counter", station: "half", status: "TRẠM VỀ MỘT NỬA · TRẠM BÁC · vị trí 4" });
    expect(states(end.scene.questions)).toEqual(["read", "unread"]);
    expect(states(end.scene.slots)).toEqual(["sent", "sent", "dropped"]);
    expect(end.cues).toEqual(["alarm"]);
  });
});

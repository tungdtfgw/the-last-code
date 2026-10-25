import { expect, test } from "vitest";
import { COMMON_TERMS, findEchoLeak, levelLeaks, type LeakSet } from "./echo-leaks";

const own = (terms: string[], answers: string[] = []): LeakSet => ({ terms: [...COMMON_TERMS, ...terms], answers });
const L11 = own(["viết hoa", "đổi", "ma_phien", '"', "K7Q2"], ["NID/2089", "PHIEN K7Q2", "44"]);

test.each<[string, string, LeakSet | undefined, string | null]>([
  ["common term, no level list", "Dùng int ở đây", undefined, "int"],
  ["common terms stay banned next to a level list (added, not replaced)", "Thử float xem.", L11, "float"],
  ["case-insensitive", "Viết hoa cả dòng.", L11, "viết hoa"],
  ["Unicode boundary: a term inside a longer word is not a match", "Một intern đọc log.", L11, null],
  ["Unicode boundary: hoa is not found in hoan", "Hoan hô.", own(["hoa"]), null],
  ["a term starting with an accented letter matches at sentence start", "Đổi mã.", L11, "đổi"],
  ["a term next to punctuation still matches", "Nhìn lại…ma_phien.", L11, "ma_phien"],
  ["punctuation-only terms match as substrings", 'Gõ "abc" đi.', L11, '"'],
  ["an expected output line is an answer", "Trạm cần PHIEN K7Q2 ngay.", own([], ["PHIEN K7Q2"]), "PHIEN K7Q2"],
  ["an answer as a standalone token", "Mã là 2703.", own([], ["2703"]), "2703"],
  ["an answer inside a longer number is not a match", "Mã 12703 khác", own([], ["2703"]), null],
  ["an answer after a decimal point is not a match", "Chỉ số 3.44 lệch.", L11, null],
  ["an answer after a sentence period is a match", "Gửi đi...PHIEN K7Q2", own([], ["PHIEN K7Q2"]), "PHIEN K7Q2"],
  ["NFD text still matches an NFC term", "Viết hoa".normalize("NFD") + " đi.", L11, "viết hoa"],
  ["clean line", "Trạm R-17 không đoán ý. Nó bỏ cả gói.", L11, null],
])("%s", (_name, text, leaks, expected) => {
  expect(findEchoLeak(text, leaks)).toBe(expected);
});

test("level leak set: common + own terms, every expected value and output line", () => {
  const leaks = levelLeaks({
    forbidden_terms: ["K7Q2", "int"],
    tests: [{ inputs: {}, expected: { ok: true }, expected_output: ["NID/2089", "PHIEN K7Q2"] }],
    counter_attack_tests: [{ inputs: {}, expected: {}, expected_output: ["PHIEN M4X8"] }],
  });
  expect(leaks.terms).toEqual(["int", "float", "round", "K7Q2"]);
  expect(leaks.answers).toEqual(["true", "True", "NID/2089", "PHIEN K7Q2", "PHIEN M4X8"]);
});

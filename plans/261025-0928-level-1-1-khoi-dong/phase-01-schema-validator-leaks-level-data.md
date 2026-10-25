---
phase: 1
title: "Schema level, validator, từ cấm, dữ liệu 1.1"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Schema level, validator, từ cấm, dữ liệu 1.1

## Goal
Level JSON diễn đạt được mục tiêu đầu ra, `expected_output`, `simulation`, `forbidden_terms`; validator kiểm chúng; luật từ cấm cộng dồn theo Unicode; `src/levels/level-1-1.json` qua validator và không rò đáp án. Chưa đổi harness hay UI (ngoài chỗ typecheck bắt buộc).

## Context
- Hợp đồng §1 (`simulation`), §2 (`forbidden_terms`), §4 (`output_line`, `expected_output`). GDD 1.1 §9 (danh sách từ cấm), §14 (bản nháp JSON).
- Đọc lại trước khi sửa: `src/game/level-types.ts`, `src/game/validate-level.ts`, `src/game/echo-leaks.ts` (vỏ game tạo; hiện có `FORBIDDEN_TERMS` dùng `\b`, `levelAnswers`, `findEchoLeak(text, answers)`), `src/story/validate-chapter.ts`, `src/game/echo-forbidden-terms.test.ts`. Tìm mọi chỗ gọi: `grep -rn "findEchoLeak\|levelAnswers\|FORBIDDEN_TERMS" src tests`.
- `validate-level.ts` hiện bắt mọi mục tiêu có `var` + `type`, và `expected` có đủ biến của mọi mục tiêu.

## Files
Sửa:
- `src/game/level-types.ts`
  - `VarObjective { kind?: "var"; var; type; label }`, `OutputLineObjective { kind: "output_line"; line: number; label }`, `Objective = VarObjective | OutputLineObjective`; `isOutputObjective(o)`, `varObjectives(level)`, `outputObjectives(level)` (sắp theo `line`).
  - `TestCase.expected_output?: string[]`.
  - `SIMULATION_KINDS = ["scanner", "relay"] as const`; `SimulationConfig = { kind: "scanner" } | { kind: "relay"; station: string }`; `LevelDefinition.simulation?: SimulationConfig`; `simulationOf(level)` trả `{ kind: "scanner" }` khi thiếu.
  - `LevelDefinition.forbidden_terms?: string[]`.
  - `REACTION_KEYS` thêm `output_missing`, `output_mismatch`, `output_case_only`, `output_extra`.
- `src/game/validate-level.ts`
  - Mục tiêu: nhánh `kind === "output_line"` (`line` nguyên dương, `label` chuỗi; tập `line` phải đúng 1..N, không trùng) và nhánh biến như cũ (`kind` thiếu hoặc `"var"`); `kind` lạ → lỗi.
  - `checkTests`: `expected` chỉ đòi biến của mục tiêu `var`. Khi N > 0: `expected_output` bắt buộc, đúng N chuỗi, không chứa `\n`/`\r`, không có khoảng trắng cuối dòng (luật chuẩn hóa sẽ làm nó không bao giờ khớp). Khi N = 0 mà có `expected_output` → lỗi (dữ liệu chết).
  - `simulation`: object, `kind` thuộc `SIMULATION_KINDS`; `relay` cần `station` chuỗi không rỗng ≤ 12 ký tự; khóa lạ theo kind → lỗi.
  - `forbidden_terms`: mảng chuỗi không rỗng (sau `trim`).
  - Kiểm `outro_beats` dùng `levelLeaks` mới (bao cả `forbidden_terms` và `expected_output`).
- `src/game/echo-leaks.ts`
  - `COMMON_TERMS = ["int", "float", "round"]`.
  - `interface LeakSet { terms: string[]; answers: string[] }`; `levelLeaks(level)`: `terms` = chung + `forbidden_terms`; `answers` = mọi giá trị `expected` (bool thêm `True`/`False`) + mọi dòng `expected_output` của test và test phản công; bỏ trùng.
  - `findEchoLeak(text, leaks = { terms: COMMON_TERMS, answers: [] }): string | null`. Từ có chữ/số: regex `(?<![\p{L}\p{N}_])<escaped>(?![\p{L}\p{N}_])` cờ `iu`. Từ chỉ gồm dấu câu/ký hiệu: `text.includes(term)`. Đáp án: cùng hàm nhưng phía trước còn loại thêm `.` (giữ hành vi cũ: `3.44` không bị coi là chứa `44`). So trên `text.normalize("NFC")` và term NFC.
  - Giữ `FORBIDDEN_TERMS`/`levelAnswers` chỉ khi còn nơi dùng; nếu không thì xóa (không để mã chết).
- `src/story/validate-chapter.ts` (và nơi khác gọi `findEchoLeak`): chuyển sang chữ ký mới; chương chỉ dùng từ chung.
- `src/game/build-config.ts`: `objectives` chỉ gửi `varObjectives(level)` (`{var, type}`); `tests`/`counter_attack_tests` đi nguyên, nên `expected_output` tự tới harness.
- Chỗ khác dùng `level.objectives` cho biến (`classify-run.ts`, `scanner-timeline.ts`, `scanner-simulation.tsx`, `objectives-panel.tsx`): đổi sang `varObjectives` hoặc thu hẹp kiểu vừa đủ cho typecheck. Hành vi 1.4 không đổi; phần vẽ mục tiêu đầu ra làm ở phase 4.
- `src/game/echo-forbidden-terms.test.ts`: dùng `levelLeaks` + `findEchoLeak` cho mọi `reactions` (render với `SAMPLE` có thêm `out_line: 2, col: 6`) và mọi nhịp `echo` trong `outro_beats`. Không xét `hints`.
- `src/game/validate-level.test.ts`: thêm ca (xem Tests).

Tạo:
- `src/levels/level-1-1.json`: chép bản nháp GDD §14, chỉ đổi `"simulation": "relay"` thành `"simulation": { "kind": "relay", "station": "R-17" }`. So từng chữ của `briefing`, `starter_code`, `hints`, `reactions`, `outro`, `lore_fragment`, `outro_beats` với GDD §1, §3, §9, §12.
- `src/game/echo-leaks.test.ts`.

## Steps
1. Kiểu trong `level-types.ts`; `npm run typecheck` để thấy mọi chỗ dùng `o.var`; sửa tối thiểu.
2. `echo-leaks.ts` mới + test của nó; cập nhật nơi gọi.
3. Validator: mục tiêu, `expected_output`, `simulation`, `forbidden_terms`.
4. `level-1-1.json`; chạy validator và test từ cấm; nếu một câu ECHO trong bản nháp rò từ cấm thì sửa câu đó (giữ ý, đổi chữ) và ghi lại ở "Ghi chú triển khai".

## Tests (chỉ những gì bảo vệ dữ liệu và luật rò đáp án)
- `echo-leaks.test.ts`, một `test.each` bảng (text, leaks, kỳ vọng):
  - từ chung vẫn cấm khi level có danh sách riêng (cộng dồn, không thay);
  - không phân biệt hoa thường: `"Viết hoa"` khớp `viết hoa`; ranh giới Unicode: term không khớp khi nằm trong một từ dài hơn (term `int` không khớp `"intern"`; term `hoa` không khớp `"hoan"`); term bắt đầu bằng chữ có dấu vẫn khớp ở đầu câu (term `đổi` khớp `"Đổi mã."`, chỗ `\b` của JS trượt), có khớp khi đứng cạnh dấu câu (`"…ma_phien."`);
  - dấu câu khớp chuỗi con: `"` trong `Gõ "abc"`;
  - dòng `expected_output` là đáp án: `PHIEN K7Q2` trong câu bị bắt; `3.44` không chứa đáp án `44`;
  - NFD trong text vẫn khớp term NFC.
- `validate-level.test.ts`: `level-1-1.json` hợp lệ; một bảng từ chối, mỗi ca sửa một chỗ của bản sao 1.1: thiếu `expected_output` ở test phản công, lệch số dòng, dòng có khoảng trắng cuối, `output_line` 1,3 (thiếu 2), `kind` mục tiêu lạ, `simulation.kind` `"sorter"` (chưa cài), `relay` thiếu `station`, `forbidden_terms: [""]`, nhịp ECHO trong `outro_beats` chứa `K7Q2`. 1.4 và fixture `level-test-sample.json` vẫn hợp lệ không cần sửa.
- `echo-forbidden-terms.test.ts` tự phủ 1.1 vì đi qua registry.

## Validation
```bash
npx vitest run src/game/echo-leaks.test.ts src/game/validate-level.test.ts src/game/echo-forbidden-terms.test.ts src/story src/game/level-registry.test.ts
npm run typecheck
```

## Risks
- Lookbehind Unicode (`(?<!…)` + `\p{…}`) cần ES2018: target là `es2022`, Node của Vitest hỗ trợ.
- Từ cấm `"`/`'` có thể trúng câu ECHO dùng dấu nháy để trích; GDD đã soạn câu không có nháy. Nếu test đỏ, sửa câu chứ không nới luật.
- Thêm `level-1-1.json` làm mở đầu dẫn vào 1.1 và khóa 1.4 trên bản đồ ngay từ phase này; `story-flow.spec.ts` sẽ đỏ đến phase 5. Không chạy e2e luồng truyện ở phase này.

## Rollback
Xóa `level-1-1.json`, `echo-leaks.test.ts`; hoàn tác các file đã sửa. Trường mới đều tùy chọn nên 1.4 chạy như cũ.

## Ghi chú triển khai
- `echo-leaks.ts`: `FORBIDDEN_TERMS`/`levelAnswers` gỡ (không còn nơi dùng); `findEchoLeak(text, leaks?)` mặc định là từ chung. Ranh giới chỉ áp ở phía có chữ/số của term, nên term bắt đầu hoặc kết thúc bằng dấu câu vẫn khớp đúng.
- Ba ca của test cũ "the leak check catches…" trong `echo-forbidden-terms.test.ts` chuyển vào bảng của `echo-leaks.test.ts` (giữ nguyên ca).
- `objectives-panel.tsx` được viết lại hẳn ở phase 4 (phase 1 chỉ thu hẹp kiểu).
- Không câu ECHO nào của bản nháp GDD §14 phải sửa chữ: JSON chép nguyên, chỉ đổi `simulation`.

---
phase: 1
title: "Schema và validator: mục tiêu type, đầu vào có kiểu, sorter"
status: completed
priority: P1
effort: "1.5h"
dependencies: ["plan vỏ game", "plan 1.1", "plan 1.2"]
---

# Phase 1: Schema và validator

## Goal
Kiểu dữ liệu và validator nhận mục tiêu loại `"type"`, giá trị đầu vào là chuỗi/số/bool, khóa phản ứng `type_mismatch_unknown_shape`, và `simulation.kind = "sorter"`. 1.4 vẫn hợp lệ, không đổi hành vi.

## Context
- Hợp đồng mục 6; GDD 1.3 mục 4, 13 #24 #25 #26.
- Đọc lại trước khi sửa: `src/game/level-types.ts`, `src/game/validate-level.ts`, `src/engine/harness-types.ts`, `src/game/classify-run.ts` (`counterInputs`), `src/game/validate-level.test.ts`. Sau plan 1.1, `Objective` là hợp `VarObjective | OutputLineObjective` và `simulation` là object `{kind}`; mục tiêu `type` là một `VarObjective`.

## Files
Sửa:
- `src/game/level-types.ts`:
  - `BASE_TYPES = ["int", "float", "str", "bool"] as const` (bốn kiểu có màu, cũng là các giá trị kỳ vọng hợp lệ của mục tiêu `type`); `VALUE_TYPES = [...BASE_TYPES, "type"] as const`.
  - `InputValue = string | number | boolean`; `TestCase.inputs: Record<string, InputValue>`.
  - `REACTION_KEYS` thêm `"type_mismatch_unknown_shape"` (đặt ngay sau `type_mismatch_value_match`).
  - Kiểu `simulation.kind` có `"sorter"` (nếu 1.1 chưa liệt kê đủ bốn loại của hợp đồng).
- `src/engine/harness-types.ts`: `HarnessTestResult.inputs: Record<string, InputValue>`.
- `src/game/classify-run.ts`: `RunOutcome.counterInputs?: Record<string, InputValue>` (chỉ kiểu).
- `src/game/validate-level.ts`:
  - `valueMatchesType(value, "type")`: chuỗi thuộc `BASE_TYPES`. Thông báo lỗi cho kiểu lạ liệt kê `int|float|str|bool|type`.
  - Đầu vào test: mỗi biến trong `inputs` phải có mặt và là chuỗi, số hữu hạn hoặc bool; lỗi nêu `field[i].inputs.<tên>`. Comment một dòng: số thực tròn (`2.0`) thành `int` khi qua JSON, đừng dùng làm đầu vào `float`.
  - `simulation.kind` chấp nhận `"sorter"` (không có tùy chọn riêng).
  - Grep mọi chỗ dùng `VALUE_TYPES`/`ValueType` trong `src/` (ví dụ chú giải màu, `toneOf`): chỗ nào ý là "bốn kiểu có màu" thì đổi sang `BASE_TYPES`.
- `src/game/validate-level.test.ts`: thêm ca vào bảng `cases` có sẵn.

## Steps
1. Đọc mã thật, ghi lại chỗ lệch so với plan (nếu có) ở đầu commit/PR.
2. Sửa kiểu; `npm run typecheck` để thấy mọi chỗ `inputs` đang giả định chuỗi (`terminal-lines.ts`, `scanner-timeline.ts` dùng `JSON.stringify`; vẫn biên dịch được, sửa hiển thị ở phase 3).
3. Sửa validator, thêm test.

## Tests (chỉ các từ chối quan trọng)
Trong `validate-level.test.ts`, trên bản sao của 1.4 (không cần file 1.3, phase 4 mới thêm):
- Mục tiêu `type` kỳ vọng `"list"` → lỗi nêu `expected.<var>` (đổi một mục tiêu của bản sao thành `type`, kỳ vọng `"list"`).
- Đầu vào là object (`{}`) hoặc `null` → lỗi nêu `inputs.<tên>`.
- Đầu vào là `4096` và `true` → hợp lệ (một ca dương, cùng test).
- `simulation: {kind: "sorter"}` → hợp lệ (gộp vào ca dương trên).

Không thêm test cho từng nhánh kiểu khác: test "level 1.4 is valid" có sẵn bảo vệ hành vi cũ.

## Validation
```bash
npx vitest run src/game/validate-level.test.ts
npm run typecheck
npm test
```

## Risks
- Thêm `"type"` vào `VALUE_TYPES` làm một `switch`/`Record<ValueType, …>` nào đó không còn đủ nhánh: typecheck báo, sửa tại chỗ.
- Chú giải màu của máy quét lặp `VALUE_TYPES` sẽ hiện thêm ô "type": đổi sang `BASE_TYPES`.

## Rollback
Hoàn tác bốn file nguồn và test. Chưa có dữ liệu nào dùng trường mới.

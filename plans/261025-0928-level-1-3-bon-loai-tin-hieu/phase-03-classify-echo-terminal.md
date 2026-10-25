---
phase: 3
title: "Phân loại, ECHO, terminal, màu shape"
status: completed
priority: P1
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Phân loại, ECHO, terminal, màu `shape`

## Goal
Lượt chạy có biến mang hình dạng lạ trả khóa `type_mismatch_unknown_shape` (rơi về `type_mismatch` khi level không có câu cho nó); terminal và mô phỏng hiện đầu vào theo cú pháp Python; chip mục tiêu `type` có tông `shape`.

## Context
- Hợp đồng mục 6; GDD 1.3 mục 9 (khóa mới), 13 #27 #28; brainstorm, bảng thay đổi engine dòng 5, 6, 8, 9.
- Đọc lại: `src/game/classify-run.ts` (`failureKey`), `src/game/echo-reactions.ts` (`reactionText`), `src/game/terminal-lines.ts` (dòng phản công dùng `JSON.stringify`), `src/ui/scanner-timeline.ts` (`inputsLabel`), `src/ui/type-colors.ts`, `src/ui/objectives-panel.tsx` (sau 1.1 đã vẽ cả mục tiêu `output_line`), `src/styles/tokens.css`.

## Files
Tạo:
- `src/game/python-literal.ts` (thuần):
  - `formatPyLiteral(v: InputValue): string`: chuỗi → `JSON.stringify(v)` (giữ y hệt 1.4); bool → `True`/`False`; số → `String(v)`.
  - `pyTypeOf(v: InputValue): BaseType`: `string` → `str`, `boolean` → `bool`, số nguyên → `int`, còn lại `float`.

Sửa:
- `src/game/classify-run.ts`: trong `failureKey`, nhánh sai kiểu: nếu mọi biến sai kiểu có `type` không thuộc `{int, float, str, bool, type}` (gồm `NoneType`, `tuple`…) → `type_mismatch_unknown_shape`; ngược lại như cũ (`type_mismatch_value_match` / `type_mismatch`). Thứ tự: kiểm "mọi biến khớp nội dung" trước như hiện tại, rồi "hình dạng lạ". Lượt phản công không đổi.
- `src/game/echo-reactions.ts`: `REACTION_FALLBACK: Partial<Record<ReactionKey, ReactionKey>> = { type_mismatch_unknown_shape: "type_mismatch" }`; `reactionText` đi theo chuỗi rơi tới khi gặp khóa level có, cuối cùng `generic`. Nếu 1.1/1.2 đã có cơ chế này, thêm một mục vào đó.
- `src/game/terminal-lines.ts`: dòng đầu vào phản công dùng `formatPyLiteral`.
- `src/ui/scanner-timeline.ts`: `inputsLabel` dùng `formatPyLiteral` (chuỗi hiển thị của 1.4 không đổi).
- `src/ui/type-colors.ts`: `TypeTone` thêm `"shape"`; `toneOf("type") = "shape"`.
- `src/styles/tokens.css`: `--type-shape` (xám trắng sáng, khác `--type-other`), cả nền sáng lẫn tối nếu file có hai bộ token.
- `src/ui/objectives-panel.tsx`: chip mục tiêu biến dùng `toneVar(toneOf(o.type))`.
- Test: `src/game/classify-run.test.ts`, `src/game/echo-reactions.test.ts`, `src/game/terminal-lines.test.ts`.

## Steps
1. `python-literal.ts`, thay hai chỗ `JSON.stringify(inputs…)`.
2. Khóa mới trong `classify-run.ts` và chuỗi rơi trong `echo-reactions.ts`.
3. Tông `shape`, chip mục tiêu.
4. Test, rồi `npm test` để chắc 1.4 không đổi.

## Tests
- `classify-run.test.ts` (dùng kiểu dựng báo cáo harness giả có sẵn trong file): một biến sai kiểu `tuple` duy nhất → `type_mismatch_unknown_shape`; một `tuple` cùng một `str` sai kiểu → `type_mismatch`. Hai ca, một `test.each`.
- `echo-reactions.test.ts`: `selectReaction` với khóa `type_mismatch_unknown_shape` trên level 1.4 (không có khóa) → câu `type_mismatch` của 1.4; trên một bản sao có khóa → câu của khóa.
- `terminal-lines.test.ts`: dòng phản công với `counterInputs {ma_phien: "7351"}` → `> ma_phien = "7351"`; với `4096` → `> ma_phien = 4096`; với `true` → `True`. Dòng 1.4 hiện có trong test không đổi kỳ vọng.

Không test `formatPyLiteral` riêng (đã phủ qua terminal), không test màu.

## Validation
```bash
npx vitest run src/game/classify-run.test.ts src/game/echo-reactions.test.ts src/game/terminal-lines.test.ts
npm run typecheck
npm test
```

## Risks
- Mục tiêu `output_line` của 1.1 không có `type`: điều kiện "hình dạng lạ" chỉ xét biến sai kiểu của mục tiêu biến (lọc như `failureKey` đang làm).
- Hai mục tiêu cùng sai, một tuple một `value_match`: rơi về `type_mismatch` (GDD: "mọi biến sai kiểu").

## Rollback
Hoàn tác các file trên, xóa `python-literal.ts`. Không có dữ liệu phụ thuộc.

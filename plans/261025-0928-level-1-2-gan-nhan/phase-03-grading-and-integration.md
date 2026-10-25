---
phase: 3
title: "Chấm: value_is_label, chuyển lịch sử, test tích hợp"
status: completed
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: Chấm `value_is_label`, chuyển lịch sử, test tích hợp

## Goal
`classifyRun` trả `value_is_label` đúng chỗ và mang lịch sử gán sang `RunOutcome`. Các lời giải và lỗi cài sẵn trong GDD chạy qua harness thật cho đúng khóa, đúng sao.

## Context
- Hợp đồng mục 5 (`value_is_label`); GDD 1.2 mục 5, 6, 7, 11, 15 #1–7.
- `src/game/classify-run.ts`: `failureKey(r, vs)` chọn khóa theo thứ tự `missing_var → type_mismatch* → wrong_value`; `classifyRun` chọn `shown` (test hỏng đầu tiên hoặc test đầu) và `counterShown`.
- `tests/integration/run-harness.ts`: `gradeFixture(level, name)` đọc `tests/fixtures/solutions/<name>.py` (tên có thể chứa thư mục con), chạy `prepareSource` → `python3` → `classifyRun`.
- Fixture là **toàn văn editor**, gồm cả dòng 1–5 (dòng khóa bị thay bằng dòng trống trước khi chạy).

## Files
Sở hữu:
- Sửa `src/game/classify-run.ts`:
  - `failureKey(r, vs, level)`: sau nhánh kiểu sai, trước `wrong_value`: nếu `level.reactions.value_is_label` có và `labelVars = wrongValue.filter(v => v.expectedType === "str" && v.preview !== null && labels.has(v.preview))` khác rỗng → `{ key: "value_is_label", details: { vars: names(labelVars) } }`. `labels` = `'tên'` của mọi `level.inputs` và tên mục tiêu.
  - `RunOutcome` thêm `history?: VarHistoryEntry[]`, `historyTruncated?: boolean`, `counterHistory?: VarHistoryEntry[]`, `counterHistoryTruncated?: boolean`; gán từ `shown` và `counterShown` (bỏ qua khi không có).
- Sửa `src/game/classify-run.test.ts`: ca #6, #7.
- Tạo `tests/fixtures/solutions/1-2/`: `original.py` (= `starter_code`), `fix-name.py` (chỉ sửa `Ma_khu`), `fix-quote.py` (thêm sửa dấu nháy, giữ sai thứ tự), `three-star.py` (GDD 6 lời giải 3 sao), `two-star.py` (GDD 6 lời giải 2 sao), `hardcoded-log.py` (3 sao nhưng `khu_cu = "K-12"`).
- Tạo `tests/integration/level-1-2.test.ts`.

## Steps
1. Viết fixture và test tích hợp, chạy thấy đỏ ở các ca cần `value_is_label`.
2. Sửa `classify-run.ts`.
3. Kiểm terminal và ECHO bằng mắt ở dev server: `value_is_label` dùng câu của level; dòng terminal vẫn là `SAI GIÁ TRỊ: so_hieu = 'goi_3' …` (không đổi `terminal-lines.ts`).

## Tests
`tests/integration/level-1-2.test.ts` (harness thật, `level-1-2.json` thật):
| Fixture | Khẳng định |
|---|---|
| `original` (#1) | `key: "NameError"`, `error.line: 13`, `baseLineCount: 4`, `stars: 0`, `history` có 3 mục dòng 8, 9, 10 |
| `fix-name` (#2) | `key: "value_is_label"`, `details.vars: "so_hieu"`, `stdout` có `goi_3 / K-12` |
| `fix-quote` (#3) | `key: "wrong_value"`, `details.vars: "khu_cu, the_quet, the_cong"`; `history` theo đúng thứ tự `(var, line, preview)`: `ho_ten 8`, `ma_khu 9 'K-12'`, `so_hieu 10`, `the_quet 13 '…/ K-12'`, `the_cong 14`, `ma_khu 17 'K-07'`, `khu_cu 18 'K-07'` (AC 9) |
| `three-star` (#4) | `key: "three_stars"`, `stars: 3`, `baseLineCount: 9`, `counterHistory` có `so_hieu` với `src: "goi_3"` |
| `two-star` (#5) | `key: "wrong_value_counter"`, `stars: 2`, `details.vars` chứa `so_hieu`, `ma_khu`, `the_quet`, `the_cong` |
| `hardcoded-log` (#5) | `key: "wrong_value_counter"`, `stars: 2`, `details.vars: "khu_cu"` |

`classify-run.test.ts` (dựng `HarnessReport` tay, dùng `level-1-2.json`):
- #6: `so_hieu` preview `"'goi_3 '"` → `wrong_value`; `the_cong` preview `"'so_hieu'"` (tên mục tiêu) → `value_is_label`, `vars: "the_cong"`.
- #7: cùng báo cáo của `fix-name` nhưng level bỏ `reactions.value_is_label` → `wrong_value`.

Không viết test riêng cho luật sao: `compute-stars` không đổi, 2 sao/phản công mồi đã được phủ bằng `two-star` và `hardcoded-log`.

## Validation
```bash
npx vitest run tests/integration src/game/classify-run.test.ts
npm run typecheck
```

## Risks
- Chữ trong `details.vars` theo thứ tự mục tiêu của JSON; nếu khẳng định thứ tự làm test giòn, so bằng tập.
- NFC (của 1.1) không ảnh hưởng `preview` (`repr` của chuỗi gốc), nên so `'tên'` vẫn đúng.

## Rollback
Hoàn tác `classify-run.ts`, xóa fixture `1-2/` và test tích hợp. Level vẫn chơi được, `so_hieu` chỉ nhận câu `wrong_value`.

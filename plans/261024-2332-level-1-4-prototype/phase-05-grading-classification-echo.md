---
phase: 5
title: "Chấm sao, phân loại kết quả, phản ứng ECHO"
status: completed
priority: P1
effort: "4h"
dependencies: [3]
---

# Phase 5: Chấm sao, phân loại kết quả, phản ứng ECHO

## Goal
Hàm thuần TS biến JSON của harness thành `RunOutcome` (khóa phản ứng, sao, mức cảnh báo, chi tiết), chọn đúng câu ECHO, và có bộ test liên ngôn ngữ chạy harness thật bằng `python3` cho các lời giải của AC 2–4, 8.

## Files to Create
- `src/game/prepare-source.ts` – `prepareSource(code, lockedLineNumbers)`: thay nội dung các dòng khóa bằng chuỗi rỗng, giữ nguyên số dòng; chuẩn hóa `\r\n` → `\n`.
- `src/game/alert.ts` – `alertPercent(count, limit) = Math.round(count / (limit / 0.4) * 100)`; `isStealth(count, limit) = count <= limit`. Hiển thị tối đa "100%+" khi > 100.
- `src/game/classify-run.ts` – `classifyRun(runnerResult, level): RunOutcome`.
- `src/game/compute-stars.ts` – `computeStars(...)`.
- `src/game/echo-reactions.ts` – `selectReaction(outcome, level, history)` + `renderTemplate`.
- `src/game/build-config.ts` – tạo `configJson` từ `LevelDefinition` + limits.
- Test: `prepare-source.test.ts`, `alert.test.ts`, `classify-run.test.ts`, `echo-reactions.test.ts`, `echo-forbidden-terms.test.ts`, `tests/integration/grading-pipeline.test.ts`.
- Fixture (toàn văn editor, có dòng khóa): `tests/fixtures/solutions/{original,two-star,three-star,hardcoded,type-error,float-shape,missing-var,over-alert,reassign-inputs,syntax-error,name-error}.py`.

## `RunOutcome`
```ts
type RunOutcome = {
  key: ReactionKey;            // khóa phản ứng chính
  stars: 0 | 1 | 2 | 3;
  baseLineCount: number | null;
  alertPercent: number | null;
  error?: { phase: "compile" | "base" | "counter"; type: string; message: string; line: number | null; tracebackLines: {line:number; text:string}[] };
  vars: VarVerdict[];          // từ test thường đầu tiên (cho mô phỏng)
  counterVars?: VarVerdict[];  // từ test phản công đầu tiên
  counterInputs?: Record<string,string>;
  stdout: string; stdoutTruncated: boolean;
  details: { line?: number; vars?: string; error_type?: string; count?: number };
  counterSurvived: boolean;
};
```

## Thứ tự phân loại (dừng ở luật khớp đầu tiên)
1. runner `not_ready` → không tạo outcome (UI xử lý). runner `timeout` → `timeout`. `engine_error` → `engine_error`.
2. `compile_error`: `IndentationError`/`TabError` → `IndentationError`; còn lại → `SyntaxError`.
3. Test thường (duyệt theo thứ tự, lấy test đầu tiên không đạt):
   - status `timeout` → `timeout`; `resource_limit`; `blocked_import`; `input_unsupported`; `system_exit`.
   - `runtime_error` với type ∈ {TypeError, ValueError, NameError, ZeroDivisionError, AttributeError} → key cùng tên; khác → `runtime_error`.
   - biến nào `present=false` → `missing_var` (`{vars}` = danh sách tên, nối bằng ", ").
   - có biến `type_ok=false`: nếu **mọi** biến sai kiểu đều `value_match_other_type` → `type_mismatch_value_match`, ngược lại → `type_mismatch`.
   - có biến `value_ok=false` → `wrong_value`.
4. Test thường đạt → `stars ≥ 1`. `count = max(line_count)`; `count > limit` → key `alert_exceeded`, `stars = 1` (vẫn ghi `counterSurvived`).
5. Phản công (test đầu tiên không đạt): `runtime_error` `ValueError` → `counter_ValueError`; lỗi/status khác → `counter_error` (timeout → `timeout`); sai kiểu → `counter_type_mismatch`; sai giá trị → `wrong_value_counter`. Khi đó `stars = 2`.
6. Phản công đạt hết → `three_stars`, `stars = 3`. Level không có test phản công → `two_stars`, `stars = 2`.

`computeStars` là nơi duy nhất quyết định sao (tích lũy: 1 = đúng; 2 = 1 + ≤ ngưỡng; 3 = 2 + phản công).

## Chọn câu ECHO
- `selectReaction` → `{primary, followUp?}`. `primary = reactions[key] ?? reactions.generic`, render placeholder (`{line}` → số dòng, thiếu thì "?"). Placeholder không có dữ liệu bị thay bằng "?" — không để lộ `{...}` thô.
- `history`: danh sách key các lần chạy trước trong phiên. Nếu key hiện tại là lỗi (stars = 0) và trùng 2 key liền trước (tức lần thứ 3 liên tiếp) → `followUp = repeated_fail` với `{count}` = số lần liên tiếp. Lần thứ 4+ cũng giữ followUp.
- `entry` được chọn khi vào level (UI gọi `selectEntry(level)`).

## Test bắt buộc
- `classify-run.test.ts`: từng nhánh ở trên với JSON harness viết tay (bao phủ mọi key).
- `echo-reactions.test.ts`: AC 8 – code gốc → `type_mismatch`; `int(tuoi)*100+cap_do` → `TypeError` với line 7; `2703.0` → `type_mismatch_value_match`; 6.6 → `counter_ValueError`; viết cứng → `wrong_value_counter`; `repeated_fail` xuất hiện ở lần thứ 3.
- `echo-forbidden-terms.test.ts` (AC 9): render **mọi** template trong `reactions` của mọi level đã đăng ký với bộ `details` mẫu (`line=7`, `vars="ma_xac_thuc, chi_so"`, `error_type="ValueError"`, `count=12`) rồi kiểm không khớp `/\b(int|float|round)\b/i` và không chứa chuỗi giá trị kỳ vọng của mọi test (`2703`, `3.44`, `3107`, `3.3`, `True`/`true`). Hints **không** thuộc phạm vi kiểm (gợi ý mức 3 được phép nêu tên hàm).
- `grading-pipeline.test.ts` (AC 1–4, 7, 12): với mỗi fixture: `prepareSource` → `child_process.spawnSync("python3", ["tests/python/harness_cli.py"], {input})` → `classifyRun` → kỳ vọng:

| Fixture | key | stars | ghi chú |
|---|---|---|---|
| `original.py` | `type_mismatch` | 0 | `vars[ma_xac_thuc].length == 201`, không có `error` |
| `type-error.py` | `TypeError` | 0 | `error.line == 7` |
| `float-shape.py` | `type_mismatch_value_match` | 0 | |
| `two-star.py` (6.6) | `counter_ValueError` | 2 | `baseLineCount == 3`, `alertPercent == 15` |
| `three-star.py` (6.7) | `three_stars` | 3 | |
| `hardcoded.py` | `wrong_value_counter` | 2 | |
| `over-alert.py` (đúng nhưng 9+ lệnh, vd. tách thành biến tạm) | `alert_exceeded` | 1 | `alertPercent ≥ 45` |
| `missing-var.py` | `missing_var` | 0 | |
| `reassign-inputs.py` | `wrong_value_counter` | 2 | |
| `syntax-error.py` | `SyntaxError` | 0 | dòng khớp |
| `name-error.py` | `NameError` | 0 | |

  `alert.test.ts`: `alertPercent(8, 8) == 40`, `alertPercent(20, 8) == 100`, `isStealth(8,8)`, `!isStealth(9,8)` (AC 12).

## Verification
- `npm test` (gồm pipeline test; cần `python3` trong PATH – nếu thiếu, test fail với thông điệp rõ chứ không skip ngầm).
- `npm run typecheck`.

## Risk
- Python local 3.13 vs Pyodide 3.14 → e2e phase 10 chạy lại AC 2–3 trong Pyodide thật.

---
phase: 3
title: "Phân loại, terminal, bộ chữ theo mô phỏng"
status: completed
priority: P1
effort: "3h"
dependencies: [2]
---

# Phase 3: Phân loại, terminal, bộ chữ theo mô phỏng

## Goal
Báo cáo `output` của harness đi thành khóa phản ứng mới và dòng terminal đúng mẫu GDD 1.1 §5; chữ riêng của từng loại mô phỏng tách khỏi mã chung. Lời giải 2 sao và 3 sao của 1.1 cùng các hàng "Có" của GDD §13 chạy qua harness thật.

## Context
- Hợp đồng §4 (thứ tự phân loại, `wrong_value_counter` cho phản công sai đầu ra, `{out_line}`, `{col}`), §7 (chữ đặc thù 1.4). GDD 1.1 §5 (mẫu terminal), §9 (khóa mới), §11 (lượt chơi), §13.
- `classify-run.ts`: `failureKey()` xét lỗi → biến; `passed()` chỉ xét `status` + `vars`; nhánh phản công phân `counter_type_mismatch` / `wrong_value_counter`. `counterVars` (mảng, có thể rỗng khi level không có biến) đang là dấu hiệu "đã có phản công" trong terminal và timeline: giữ quy ước đó.
- `terminal-lines.ts`: chữ "máy quét", "CỔNG", "dữ liệu chip" viết cứng; `terminal-lines.test.ts` khóa chữ 1.4 (không được đổi).
- Integration: `tests/integration/run-harness.ts` (`runHarness(level, editorText)`).

## Files
Tạo:
- `src/game/output-diff.ts`: `visible(s)` (dấu cách → `·`, tab → `→`); `describeLine(v: OutputVerdict)` → `{ need, got, col, gotChar, codePoint }` với ký tự thiếu ở cuối thành `▯`, `codePoint` dạng `U+0410` khi ký tự sai ở `got` không phải ASCII in được. Dùng chung cho terminal (phase này) và danh sách phát của trạm (phase 4).
- `src/game/sim-vocabulary.ts`: `vocabularyFor(level)` theo `simulationOf(level).kind`:
  - `scanner`: đúng chữ hiện nay (`gửi tín hiệu tới máy quét`, `CỔNG`, `MỞ MỘT NỬA`/`MỞ HOÀN TOÀN`/`ĐÓNG`, `DỮ LIỆU MỚI ĐI QUA MÁY QUÉT: mã vẫn đứng vững`, dòng phụ Mục tiêu `máy quét chỉ đọc hình dạng`, tiêu đề hộp kết quả `Cổng mở hoàn toàn`/`Qua cổng`/`Qua cổng, bị ghi nhận`).
  - `relay` (với `station`): `phát qua trạm {station}`, `KÊNH`, tiền tố dòng `{station} ĐÃ PHÁT` / `{station} BỎ GÓI`, `PHIÊN MỚI ĐI QUA TRẠM: mã vẫn đứng vững`, dòng phụ `trạm chỉ nhận đúng từng ký tự`, tiêu đề `Kênh mở hoàn toàn`/`Kênh mở một nửa`/`Kênh mở, bị ghi nhận`.
- `tests/integration/level-1-1.test.ts`.

Sửa:
- `src/game/classify-run.ts`
  - `OutputVerdict { line; expected; actual; status; col; caseOnly }`; `RunOutcome.output?: { lines: OutputVerdict[]; extraLines: string[]; extraCount: number; truncated: boolean }` (lượt cơ bản được hiện), `counterOutput?` (lượt phản công được hiện), `stderr: string`.
  - `passed(r)` thêm `!r.output || r.output.ok`. `verdicts()` chỉ theo `varObjectives`.
  - `failureKey`: sau nhánh biến, dòng sai đầu tiên tính từ trên: `missing` → `output_missing`; `wrong` + `case_only` → `output_case_only`; `wrong` → `output_mismatch` (details `out_line`, `col`); hết dòng sai mà `extra_count > 0` hoặc `truncated` → `output_extra` (`count` = `extra_count`). Bị cắt mà không có dòng nào sai và không thừa (hiếm: cắt đúng sau dòng cuối) → `output_extra` với `count` tối thiểu 1.
  - Nhánh phản công: lỗi/timeout như cũ; biến sai hình dạng → `counter_type_mismatch`; còn lại (biến sai giá trị hoặc đầu ra sai) → `wrong_value_counter`, details thêm `out_line` của dòng sai đầu tiên khi có.
  - `OutcomeDetails` thêm `out_line?`, `col?`.
- `src/game/terminal-lines.ts`
  - Dòng đầu, danh từ cổng/kênh, dòng "mã vẫn đứng vững" lấy từ `vocabularyFor(level)`. `STOP_TEXT.input_unsupported` thành trung tính: `> KHÔNG CÓ KÊNH NHẬP LIỆU: dữ liệu đã nạp sẵn`.
  - `outputLines(output, vocab, { emittedOnly })`: dòng `ok` → `> {ĐÃ PHÁT}: dòng n · {expected}` (tone `ok`); `wrong` → `> {BỎ GÓI}: dòng n · sai ở vị trí c` + ` (chỉ khác hoa thường)` khi `caseOnly`, rồi hai dòng muted `    cần:  {need}` / `    nhận: {got}` (+ ` · U+XXXX` khi có); `missing` → `> KHÔNG CÓ DÒNG: dòng n` (bỏ qua khi `emittedOnly`); thừa → `> DÒNG THỪA: {count} dòng ngoài giao thức`.
  - Lượt cơ bản lỗi chạy: `outputLines(..., { emittedOnly: true })` đứng trước dòng `SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP` (khớp GDD §11 bước 2). Lượt không lỗi mà sai: sau `verdictLines`. Lượt đạt: các dòng `ĐÃ PHÁT`. Phản công sai đầu ra: `outputLines` của `counterOutput` (chỉ dòng sai) thay cho dòng `LỆCH MẪU`.
  - Level không có mục tiêu đầu ra: không sinh dòng nào mới (1.4 giữ nguyên từng chữ).
- `src/game/terminal-lines.test.ts`: thêm ca 1.1 (giữ nguyên ca 1.4).
- `src/game/classify-run.test.ts`: thêm ca thứ tự ưu tiên (xem Tests).

## Steps
1. `output-diff.ts`, `sim-vocabulary.ts`.
2. `classify-run.ts`; chạy test classify cũ.
3. `terminal-lines.ts`; chạy test terminal cũ (phải xanh không sửa).
4. Viết `level-1-1.test.ts`: dựng editor text từ `level.starter_code` bằng helper nhỏ trong file (`withLines(starter, { 7: 'print("PHIEN", ma_phien)' })`, `withBody(text)` thay mọi dòng sau dòng 5), không thêm fixture `.py`.

## Tests
- `tests/integration/level-1-1.test.ts` (harness thật qua `python3`, mỗi test một hàng GDD §13):
  - code gốc → `NameError`, `error.line` 7, `stars` 0, `output.lines` trạng thái `[ok, missing, missing]`;
  - sửa dòng 7, dòng 8 viết thường → `output_case_only`, `details` `{ out_line: 3, col: 1 }`;
  - `test.each` lời giải 3 sao bằng dấu phẩy và bằng `+` → `three_stars`, `stars` 3, `baseLineCount` 3;
  - `print("PHIEN K7Q2")` → `stars` 2, `wrong_value_counter`, `details.out_line` 2;
  - một ca chuẩn hóa được chấp nhận (dấu cách cuối + `print()` cuối) → 3 sao; một ca dấu cách đầu chuỗi → `output_mismatch`, `col` 1;
  - in thêm một dòng → `output_extra`, `details.count` 1;
  - xóa dòng 8 → `output_missing` `out_line` 3; xóa hết → `output_missing` `out_line` 1 (một test, hai ca);
  - đủ 3 dòng rồi `1/0` → `ZeroDivisionError`, `stars` 0, `output.lines` đều `ok`.
- `classify-run.test.ts` (báo cáo harness dựng tay, chỉ những gì integration khó tạo): dòng 2 sai và có thừa → `output_mismatch` (dòng sai thắng thừa); dòng 1 sai hoa thường, dòng 2 sai ký tự → `output_case_only` với `out_line` 1 (dòng trên cùng thắng); biến đúng nhưng `output.ok` false → không đạt, không chạy nhánh sao.
- `terminal-lines.test.ts`: ca 1.1 lượt 2 (dòng 3 viết thường) ra đúng 8 dòng của GDD §5 (dòng đầu, 2 ĐÃ PHÁT, BỎ GÓI + cần/nhận, MỨC CẢNH BÁO 30% (3/4 lệnh), KÊNH: ĐÓNG); ca code gốc có `R-17 ĐÃ PHÁT: dòng 1` trước `SENTINEL` và không có `KHÔNG CÓ DÒNG`; ca 3 sao kết thúc `> KÊNH: MỞ HOÀN TOÀN`. Dùng `gradeFixture`-kiểu chạy harness thật hoặc outcome dựng tay, theo cách file test hiện làm.
- Không test `sim-vocabulary.ts`/`output-diff.ts` riêng: terminal test phủ chúng.

## Validation
```bash
npx vitest run src/game tests/integration
npm run typecheck
```

## Risks
- **`{count}` hai nghĩa:** ở lượt đạt là số lệnh (`alert_exceeded`), ở `output_extra` là số dòng thừa. Hai nhánh tách nhau trong `classifyRun` (nhánh lỗi trả `f.details`), giữ đúng như vậy.
- **`counterVars` rỗng với level chỉ có đầu ra** vẫn là mảng (truthy) nên terminal/timeline biết đã có phản công; không đổi điều kiện thành `.length`.
- **Chữ 1.4 lệch một ký tự** làm test 1.4 đỏ: bảng `scanner` phải chép nguyên chữ hiện tại.

## Rollback
Hoàn tác `classify-run.ts`, `terminal-lines.ts` và test; xóa `output-diff.ts`, `sim-vocabulary.ts`, `level-1-1.test.ts`.

## Ghi chú triển khai
- `output_extra` mang thêm `out_line` = N+1, để `wrong_value_counter` vẫn có `{out_line}` khi phản công chỉ sai vì thừa dòng.
- Terminal thêm dòng `> ĐẦU RA BỊ CẮT: quá dài, phiên bị bỏ` khi đầu ra bị cắt (không có thì lượt bị cắt mà mọi dòng đúng không có dòng nào giải thích vì sao kênh đóng).
- `sim-vocabulary.ts` có thêm `terminalNote` (dòng phụ ô Terminal "nhật ký máy quét" / "nhật ký trạm R-17"), cũng là chữ đặc thù máy quét.
- Thêm một ca terminal: chép cứng mã phiên (chỉ dòng hỏng của đợt phản công) và ký tự Cyrillic (`U+0410`).

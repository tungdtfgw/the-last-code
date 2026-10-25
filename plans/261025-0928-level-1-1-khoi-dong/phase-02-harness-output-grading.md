---
phase: 2
title: "Harness: chấm đầu ra, NFC, tách stderr"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Harness: chấm đầu ra, NFC, tách stderr

## Goal
`harness.py` so stdout với `expected_output` của từng test theo luật cố định, trả báo cáo `output` theo dòng, chuẩn hóa NFC mọi phép so chuỗi, tách stderr khỏi stdout. Lượt chỉ đạt khi chạy hết không lỗi, biến đúng và đầu ra đúng.

## Context
- Hợp đồng §3 (NFC), §4 (luật khớp). Brainstorm 1.1 mục "Luật so khớp đầu ra" và dạng JSON `output` (dùng nguyên văn).
- Hiện trạng `harness.py`: `_CappedWriter` (8.000 ký tự, 200 dòng) dùng chung cho `sys.stdout` và `sys.stderr`; `_values_equal` so `str` bằng `==`; `_passed()` chỉ xét `status` và `vars`; giữ bản riêng của `math`/`json`/`ast` để code người chơi không vá được.
- Nhật ký lỗi §2: module dùng chung phải có bản riêng; guard vòng lặp và đếm câu lệnh không được đổi.
- Test Python: `tests/python/test_harness.py` (config của 1.4 dựng tay ở đầu file), CLI cho integration: `tests/python/harness_cli.py`.

## Files
Sửa:
- `src/engine/python/harness.py`
  - `import unicodedata`; tham chiếu riêng `_normalize = unicodedata.normalize` lấy lúc nạp module (cùng cách với `_isfinite`, `_json_dumps`).
  - `_values_equal`: nhánh `str` so `_normalize("NFC", value) == _normalize("NFC", expected)`.
  - `_run_one`: bộ đệm `err = _CappedWriter(...)` riêng cho `sys.stderr`; kết quả thêm `"stderr": err.getvalue()`. Nhận thêm `expected_output` (có thể `None`); sau khi chạy (kể cả khi lỗi) thêm `"output": _grade_output(out.getvalue(), out.truncated, expected_output, preview_chars)` hoặc `None` khi test không có `expected_output`.
  - `_grade_output(stdout, truncated, expected, preview_chars)`:
    1. `\r\n`, `\r` → `\n`; NFC cả hai phía.
    2. Tách dòng; `rstrip()` khoảng trắng cuối mỗi dòng; bỏ các dòng rỗng ở cuối (stdout rỗng → không có dòng nào).
    3. Với mỗi dòng mong đợi i: `missing` nếu không có dòng i; `ok` nếu bằng tuyệt đối; còn lại `wrong` với `col` = vị trí khác đầu tiên (đếm từ 1; dòng này là tiền tố của dòng kia → độ dài phần ngắn + 1) và `case_only = a.casefold() == e.casefold()`.
    4. `actual` cắt `preview_chars` (thêm `…`), `extra_lines` tối đa 3 (cũng cắt), `extra_count`.
    5. `ok = not truncated and extra_count == 0 and mọi dòng ok`.
  - `_passed`: thêm điều kiện `result["output"] is None or result["output"]["ok"]`. Cổng chạy phản công tự đi theo vì dùng `_passed`.
  - `run_suite`: truyền `test.get("expected_output")`.
- `src/engine/harness-types.ts`: `HarnessOutputLine { line; expected; actual: string | null; status: "ok" | "wrong" | "missing"; col: number | null; case_only: boolean }`, `HarnessOutput { ok; truncated; lines; extra_lines; extra_count }`; `HarnessTestResult.output: HarnessOutput | null`, `stderr: string`.
- `tests/python/test_harness.py`: lớp mới `OutputGrading` với config dựng tay (một mục tiêu đầu ra 3 dòng, không biến, input `ma_phien`), helper `grade(src)`.

## Steps
1. Tách stderr; chạy toàn bộ `npm run test:py` (bảo đảm không test cũ nào dựa vào stderr nằm trong stdout; nếu có, sửa test đó cho đúng ý mới).
2. `_grade_output` + nối vào `_run_one`, `_passed`.
3. NFC cho biến `str`.
4. Viết lớp `OutputGrading`; chạy cả 3.13 và 3.14.
5. Kiểm nhanh trên Pyodide thật: `npm run dev` (xem `lsof -i :5173` trước, dùng lại server người dùng đang chạy nếu có), vào `#/level/1.4`, chạy lời giải 3 sao một lần: harness phải nạp được `unicodedata`. (Hoặc `npx playwright test tests/e2e/level-1-4.spec.ts --project=chromium -g "GDD 6.7"`.)

## Tests (lớp `OutputGrading`, mỗi test một luật)
- **Chuẩn hóa được chấp nhận:** dấu cách cuối dòng, `print("NID/2089", "")`, `print()` ở cuối, `\r\n` → `ok`.
- **Khác thật bị bắt:** dấu cách đầu chuỗi → `wrong`, `col` 1; `print()` giữa chừng → dòng 2 rỗng `wrong`, `col` 1, các dòng sau lệch.
- **`col` và `case_only`:** `PHIENK7Q2` vs `PHIEN K7Q2` → `col` 6; `PHIEN` (ngắn hơn) → `col` 6; `lo17 can lien lac` → `col` 1, `case_only` true.
- **Thiếu và thừa:** 2 dòng → dòng 3 `missing`; 4 dòng → `extra_count` 1, `ok` false.
- **Vẫn so khi lỗi:** in dòng 1 rồi `NameError` → `status` `runtime_error`, dòng 1 `ok`, 2–3 `missing`; đủ 3 dòng đúng rồi `1/0` → mọi dòng `ok` nhưng `_passed` sai (kiểm qua `counter_results is None` ở phase "all" hoặc gọi `_passed` trực tiếp).
- **Bị cắt:** `print("A" * 10**6)` → `truncated` true, `ok` false, chạy xong dưới 2 s.
- **stderr tách riêng:** 3 dòng đúng + `import warnings; warnings.warn("x")` → `output.ok` true, `"x"` có trong `stderr`, không có trong `stdout`.
- **NFC:** dòng mong đợi NFC, in ra NFD (`unicodedata.normalize("NFD", "LIÊN")` dựng trong test, gửi dạng chuỗi đã tách dấu) → `ok`; mục tiêu biến `str` NFC, gán NFD → `value_ok`.
- Không thêm test cho đếm câu lệnh, guard, import (đã có).

## Validation
```bash
npm run test:py
npm run test:py:3.14
npm test -- tests/integration   # grading-pipeline 1.4 vẫn qua
npm run typecheck
```

## Risks
- **Thứ tự bắt ngoại lệ:** `_grade_output` phải chạy ngoài khối `try` của `exec` và không bao giờ ném (bọc `BaseException` → `output` với `ok` false), để một lỗi chấm không thành lỗi của người chơi.
- **Chi phí:** chuẩn hóa tối đa 8.000 ký tự mỗi test, không đáng kể.
- **`warnings` có bộ lọc "default" (chỉ hiện một lần mỗi vị trí):** test stderr chạy trong một tiến trình mới nên ổn; không dựa vào số lần hiện.
- **Người chơi vá `unicodedata`:** đã giữ tham chiếu riêng lúc nạp; module `unicodedata` của người chơi là cùng object nhưng hàm đã được lấy ra trước.

## Rollback
Hoàn tác `harness.py`, `harness-types.ts`, `test_harness.py`. Level không có `expected_output` cho `output: null` nên 1.4 không phụ thuộc thay đổi này, trừ NFC (vô hại với chuỗi ASCII).

## Ghi chú triển khai
- Kiểm Pyodide không dùng e2e (theo yêu cầu người dùng): tài liệu Pyodide (Context7) không liệt kê `unicodedata` trong module bị gỡ/tách. Ngoài ra đã chơi 1.1 trên server dev của người dùng (:5173, có sẵn): harness chạy trên Pyodide 3.14.2, kết quả đúng.
- Bỏ test "test không có `expected_output` cho `output: null`": hiển nhiên, integration 1.4 đã phủ.

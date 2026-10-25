---
phase: 3
title: "Harness Python & sandbox"
status: completed
priority: P1
effort: "5h"
dependencies: [2]
---

# Phase 3: Harness Python & sandbox

## Goal
Một module Python thuần stdlib `run_level(config_json, source) -> str(JSON)` chạy code người chơi với từng bộ đầu vào, đếm câu lệnh, giới hạn tài nguyên, chặn module nguy hiểm, chấm từng biến theo **kiểu chính xác** và trả kết quả có cấu trúc. Chạy giống nhau trong Pyodide (Python 3.14) và `python3` local (3.13).

## Key Insights
- Đếm lệnh bằng `sys.settrace`: trả local tracer cho frame có `f_code.co_filename == "<player>"`, đếm sự kiện `"line"`. Vòng lặp tính mỗi lần lặp. Hàm built-in (C) không tạo sự kiện.
- `type(v) is int` (không `isinstance`) vì `True` là `int`. Lớp con của `int` do người chơi tự định nghĩa cũng bị coi sai kiểu.
- `str(10**5000)` ném `ValueError` (giới hạn chuyển int→str từ 3.11) → mọi `repr` phải bọc try.
- Ngoại lệ dừng ngân sách phải kế thừa `BaseException` để `except Exception:` của người chơi không nuốt được; harness kiểm cờ sau `exec` dù người chơi có `except:` trần.
- Traceback: chỉ lấy frame có filename `<player>`; `SyntaxError.lineno` cho lỗi biên dịch. Vì dòng khóa được thay bằng dòng trống (phase 7 làm ở TS: `prepareSource`), số dòng khớp editor.

## Files to Create
- `src/engine/python/harness.py`
- `tests/python/test_harness.py` (unittest, tên snake_case vì module Python phải import được)
- `tests/python/harness_cli.py` – đọc JSON `{config, source}` từ stdin, in `run_level(...)` ra stdout (dùng cho test liên ngôn ngữ ở phase 5).

## Thiết kế `run_level`

Đầu vào `config_json`: `{"inputs":[...], "objectives":[{"var","type"}], "tests":[...], "counter_attack_tests":[...], "float_abs_tolerance":1e-9, "limits":{"max_line_events":100000,"max_stdout_chars":8000,"max_stdout_lines":200,"preview_chars":80}}`.

Quy trình:
1. `compile(source, "<player>", "exec")`. `SyntaxError`/`IndentationError`/`TabError` → trả ngay `{"compile_error": {type, message, line, offset}}`, không chạy test nào.
2. Với mỗi test thường: `_run_one(code, inputs)` trong namespace **mới**: `{"__builtins__": safe_builtins, "__name__": "__main__", **inputs}`.
3. Nếu **mọi** test thường đạt (status `ok`, mọi biến `type_ok and value_ok`) → chạy từng test phản công cũng bằng `_run_one`. Ngược lại `counter_results = null` (không chạy phản công).
4. Trả JSON (`json.dumps(..., ensure_ascii=False)`).

`safe_builtins` = bản sao `builtins.__dict__` đã:
- thay `__import__` bằng hàm chặn: tên gốc (`name.split('.')[0]`) thuộc `BLOCKED = {js, pyodide, pyodide_js, _pyodide, micropip, sys, os, subprocess, ctypes, importlib, builtins, gc, inspect, threading, signal, pyodide_http}` → ném `_BlockedImport(name)` (lớp con `ImportError`); còn lại gọi `__import__` gốc (cho phép `math`, `random`, …).
- thay `input` bằng hàm ném `_InputUnsupported` (lớp con `RuntimeError`).
- xóa `exit`, `quit`, `help`, `breakpoint`, `copyright`, `credits`, `license` (gọi → `NameError`, xử lý như lỗi thường).
- `print` giữ nguyên; stdout được chuyển hướng sang `_CappedWriter` (cắt sau `max_stdout_chars`/`max_stdout_lines`, đặt cờ `truncated`, bỏ phần thừa nhưng **không** ném lỗi).

`_run_one`: đặt `sys.stdout/stderr = _CappedWriter`, `sys.settrace(tracer)`, `exec(code, ns)` trong try:
- `_LineBudgetExceeded` (BaseException) hoặc cờ `budget_hit` → `status="timeout"`.
- `_BlockedImport` → `blocked_import`; `_InputUnsupported` → `input_unsupported`; `SystemExit` → `system_exit`; `MemoryError`, `OverflowError`, `RecursionError` → `resource_limit`; `KeyboardInterrupt` → `timeout`; `Exception` khác → `runtime_error` với `{type: e.__class__.__name__, message: str(e) (bọc try, cắt 300 ký tự), line: dòng frame <player> sâu nhất, traceback_lines: [{line, text}] chỉ frame <player>}`.
- `finally`: `sys.settrace(None)`, khôi phục stdout/stderr, `gc.collect()`.
- Sau `exec` (kể cả khi lỗi): với mỗi objective → `_describe(ns, var, expected_type, expected_value)`:
  - `present`: biến có trong `ns`.
  - `type`: `type(v).__name__` (tên lớp người chơi tự đặt vẫn chỉ là chuỗi).
  - `preview`: `repr(v)` bọc try (lỗi → `"<không hiển thị được>"`), cắt `preview_chars`; `length`: `len(v)` nếu là `str`, else null.
  - `type_ok`: `type(v) is TYPE_MAP[expected_type]`.
  - `value_ok`: chỉ khi `type_ok`. `int`/`bool`/`str`: `==`. `float`: `math.isfinite(v) and abs(v - exp) <= tol`.
  - `value_match_other_type`: khi `not type_ok`, thử quy về số: `bool` bị loại trừ khi kỳ vọng số; `int`/`float` → `float(v)`; `str` → `float(v.strip())` trong try; so sánh `abs(x - float(exp)) <= tol`. Kỳ vọng `bool`: `v` là chuỗi `"True"/"False"` khớp → true.
- `line_count`: tổng sự kiện line (không tính dòng khóa vì đã thành dòng trống).

Kết quả mỗi test: `{kind:"base"|"counter", index, inputs, status, error, line_count, stdout, stdout_truncated, vars:{...}}`.

## Tasks & Steps
1. Viết harness theo thiết kế; hằng số `TYPE_MAP = {"int": int, "float": float, "str": str, "bool": bool}` lấy tham chiếu **trước** khi chạy code người chơi.
2. Viết `harness_cli.py` (thêm `src/engine/python` vào `sys.path`).
3. Viết `test_harness.py` với các ca (mã đã được thay dòng khóa bằng dòng trống, dùng helper `blank_locked(src, [2,3,4])` trong file test):
   - code gốc → `status ok`, `ma_xac_thuc.type == "str"`, `length == 201`, cả 3 biến `type_ok False`, `counter_results is None`.
   - 6.6 → base đạt, `line_count == 3`, counter `runtime_error` `ValueError` dòng 7.
   - 6.7 → base + counter đạt.
   - `ma_xac_thuc = 2703` → base đạt, counter `value_ok False` cho `ma_xac_thuc`.
   - `int(tuoi) * 100 + cap_do` → `TypeError`, `line == 7`.
   - `float(tuoi)*100+float(cap_do)` → `type_ok False`, `value_match_other_type True`.
   - `hop_le = 1` → sai kiểu; `ma_xac_thuc = True` → sai kiểu (bool không là int).
   - `chi_so = float(chieu_cao) * 2` (không round) → đạt (sai số ≤ 1e-9); `round(...,1)` → sai giá trị.
   - `while True: pass` → `timeout` trong < 2s local; `try: while True: pass` + `except Exception: pass` → vẫn `timeout`.
   - `import js`, `import os`, `from pyodide import ffi`, `__import__("sys")` → `blocked_import`; `import math` → ok.
   - `input()` → `input_unsupported`; `exit()` → `NameError`; `raise SystemExit` → `system_exit`.
   - `for i in range(10**6): print(i)` → `timeout` hoặc stdout bị cắt, `len(stdout) <= 8000`.
   - `x = 10**5000; ma_xac_thuc = x` → preview không ném lỗi.
   - `"x" * 10**10` → `resource_limit` (OverflowError/MemoryError).
   - `1/0` → `ZeroDivisionError`; `tuoi.foo()` → `AttributeError`; `tuoii` → `NameError`; `if True:\nx=1` → `IndentationError` qua `compile_error`; trộn tab/space → `TabError`/`IndentationError`.
   - thiếu biến (xóa dòng `hop_le`) → `present False`.
   - gán lại đầu vào `tuoi = "27"` ở dòng 6 → base đạt, counter sai giá trị.
   - người chơi định nghĩa `int = float` hoặc `class int(int): ...` → harness vẫn chấm đúng (dùng `TYPE_MAP` đã chụp).
   - mỗi test chạy namespace mới: biến tạo ở test thường không rò sang test phản công.
4. Không gọi API riêng của Pyodide trong harness (để chạy được local).

## Verification
- `npm run test:py` (= `python3 -m unittest discover -s tests/python -v`) xanh.
- `echo '{"config":…,"source":…}' | python3 tests/python/harness_cli.py` in JSON hợp lệ.

## Security Considerations
Mô hình đe dọa: game một người chơi, chạy cục bộ, worker không có DOM/`localStorage`/bí mật. Rủi ro thật: (a) tự làm treo tab, (b) gian lận chấm sao (tắt `settrace`, sửa harness, `postMessage` giả). Chặn import là **rào cản cho lỗi vô ý và gian lận dễ**, không phải sandbox tuyệt đối (vẫn có thể leo qua `__subclasses__`). Chấp nhận: người gian lận chỉ tự lừa chính mình; không có dữ liệu người khác bị ảnh hưởng. Ghi rõ điều này trong comment đầu file harness. Khi lên Supabase/bảng xếp hạng phải chấm lại phía server – ngoài phạm vi.

## Risk
- Khác biệt 3.13 ↔ 3.14: thông điệp lỗi có thể khác. Test chỉ khẳng định `type` và `line`, không khẳng định nguyên văn message.
- `settrace` làm chậm code người chơi ~ vài lần – chấp nhận với code Chương 1.

---
phase: 2
title: "Harness chấm mục tiêu type"
status: completed
priority: P1
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Harness chấm mục tiêu `type`

## Goal
`harness.py` chấm được một biến phải giữ chính một hình dạng (`int`, `str`…), báo preview `<class 'tên'>`, nhận ra chuỗi "khớp nội dung", và không bị code người chơi đánh lừa. Mục tiêu `int/float/str/bool` không đổi kết quả.

## Context
- Hợp đồng mục 6; GDD 1.3 mục 4 (cách chấm), 13 #4 #7 #8.
- `src/engine/python/harness.py`: `TYPE_MAP`, `_PRIMITIVE_TYPES`, `_preview`, `_value_match_other_type`, `_describe` (hiện `TYPE_MAP[expected_type]` sẽ `KeyError` với `"type"`). Sau plan 1.1 có thêm NFC và so khớp đầu ra; giữ nguyên.
- `tests/python/test_harness.py` (dùng `CONFIG` của 1.4; thêm cấu hình riêng nhỏ cho lớp mới).
- Harness chỉ dùng thư viện chuẩn, chạy cả Pyodide (3.13/3.14) lẫn CPython.

## Files
Sửa:
- `src/engine/python/harness.py`:
  - Chụp `_type_type = type` ở đầu module cạnh `_type`.
  - `_describe`: khi `expected_type == "type"`: `type_ok = _type(value) is _type_type`; `value_ok = type_ok and value is TYPE_MAP.get(expected)`; không gọi `_values_equal`. Các loại khác như cũ.
  - `_preview`: trước nhánh "không phải kiểu nguyên thủy", nếu `_type(value) is _type_type` trả `"<class '" + tên + "'>"` với `tên = value.__name__` (lấy trong `try`, lỗi → `UNPRINTABLE`; cắt theo `limit`). Không gọi `repr`.
  - `_value_match_other_type` nhánh `"type"`: `vt is str and value.strip() in (expected, "<class '" + expected + "'>")`.
  - Docstring/comment một câu cho nhánh mới (bất biến: TYPE_MAP chụp trước code người chơi).
- `tests/python/test_harness.py`: lớp mới `TypeObjective`.

## Steps
1. Viết test trước (lớp `TypeObjective`), chạy thấy đỏ.
2. Sửa harness, chạy `npm run test:py` và `npm run test:py:3.14`.

## Tests
Lớp `TypeObjective` dùng một config tối thiểu dựng trong test: `inputs: ["ma_phien"]`, một mục tiêu `{"var": "k", "type": "type"}`, test cơ bản `inputs {"ma_phien": 4096}` kỳ vọng `"int"`, phản công `{"ma_phien": "7351"}` kỳ vọng `"str"`, `counter_line_count_cap` 17. Không có dòng khóa (nguồn chỉ là thân).
- `k = type(ma_phien)` → cơ bản đạt, phản công đạt (đầu vào số và chuỗi được nạp đúng kiểu); preview `<class 'int'>` rồi `<class 'str'>`; `type` báo `"type"`.
- `k = int` → cơ bản đạt, phản công `value_ok = false`, `type_ok = true`.
- `k = "int"` và `k = "<class 'int'>"` → `type_ok = false`, `value_match_other_type = true`.
- `k = type` và `k = type(None)` → `type_ok = true`, `value_ok = false`.
- `int = 5` rồi `k = int` → `type_ok = false` (giá trị là 5).
- Một lớp người chơi có metaclass với `__repr__` treo (`class M(type): __repr__ = …`; `k = M("X", (), {})`) → không treo, `type_ok = false` (gộp với ca trên nếu gọn).

Không thêm test riêng cho NFC (plan 1.1 đã có) hay cho mục tiêu cũ (test 1.4 có sẵn).

## Validation
```bash
python3 -m unittest tests.python.test_harness.TypeObjective
npm run test:py
npm run test:py:3.14
```

## Risks
- `value.__name__` của lớp do người chơi tạo có thể là chuỗi rất dài: cắt theo `limit` như các preview khác.
- Đổi `_describe` làm hỏng mục tiêu cũ: toàn bộ `test_harness.py` có sẵn bắt.

## Rollback
Hoàn tác `harness.py` và lớp test. Chưa level nào dùng `"type"`.

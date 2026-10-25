---
phase: 2
title: "Harness: var_history + đo chi phí trên Pyodide"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Harness `var_history` và đo chi phí

## Goal
Khi config có `trace_vars: true`, mỗi kết quả test của harness có `var_history` (≤ 40 mục) và `var_history_truncated`. Không bật thì báo cáo giống hệt hôm nay. Chi phí đã đo trên Pyodide và nằm trong ngưỡng, hoặc đã áp bậc lùi.

## Context
- Hợp đồng mục 5; GDD 1.2 mục 8 (phát lại theo lịch sử), 13, 15 #16–19.
- `src/engine/python/harness.py` `_run_one`: `local_tracer` đếm sự kiện `line` (ngân sách) và câu lệnh (`stmt_lines`); `_preview` không gọi `__repr__` của người chơi; `ns` là dict thường, khóa là chuỗi.
- `docs/nhat-ky-loi-prototype-1-4.md`: CPython bỏ tracer sau khi tracer ném lỗi → tracer mới không được ném (ngoài `_LineBudgetExceeded` đã có).
- Ước tính đã đo (CPython 3.13, tracer tối giản, `while True: ma_khu = goi_4`, 100.000 sự kiện): 7,7 ms → 26 ms khi so 6 tên mỗi sự kiện (+18 ms).

## Files
Sở hữu:
- Sửa `src/engine/python/harness.py`.
- Sửa `src/engine/harness-types.ts`: `VarHistoryEntry { line: number | null; var: string; type: string | null; preview: string | null; src: string | null }`; `HarnessTestResult.var_history?: VarHistoryEntry[]`, `var_history_truncated?: boolean`.
- Sửa `src/game/build-config.ts`: `trace_vars: level.simulation?.kind === "kiosk"`.
- Sửa `tests/python/test_harness.py`: lớp `VarHistory`.
- Tạo báo cáo `plans/reports/bench-261025-<HHMM>-var-history.md` (số đo, máy, phiên bản Pyodide/CPython, kết luận).

Không commit script đo; để trong thư mục tạm của phiên.

## Thiết kế (harness)
- `DEFAULT_LIMITS["var_history_max"] = 40`. `run_level` đọc `trace_vars = bool(config.get("trace_vars"))`, truyền vào `_run_one`.
- Trong `_run_one`, khi bật:
  - `watch = tuple(o["var"] for o in objectives)`; `seen = {n: ns.get(n, _MISSING) for n in watch}` sau khi nạp `inputs` (biến vừa là đầu vào vừa là mục tiêu không sinh mục giả).
  - `origin = tuple(ns[n] for n in inputs)` kèm tên: đối tượng gốc lúc nạp, để `src` không bị lừa khi người chơi gán đè gói (`goi_4 = "K-99"`).
  - `hist = {"stmt_line": None, "full": False}`; `_record()` duyệt `watch`, `v = ns.get(n, _MISSING)`; `v is not seen[n]` → cập nhật `seen`, thêm `{"line": stmt_line, "var": n, "type": tên kiểu hoặc None nếu `_MISSING`, "preview": _preview(v) hoặc None, "src": tên đầu vào đầu tiên có `origin is v` hoặc None}`. Đủ `var_history_max` → `full = True`, dừng.
  - Trong `local_tracer`, ở sự kiện `line`, **sau** kiểm ngân sách: `if trace and not hist["full"]: _record()`; rồi nếu `lineno in stmt_lines` thì `hist["stmt_line"] = lineno`. Dòng ghi là dòng bắt đầu câu lệnh vừa chạy xong, kể cả khi câu lệnh đó nằm trong hàm (một biến `stmt_line` chung cho mọi khung).
  - Sau `exec` (cả khi lỗi hoặc hết ngân sách): gọi `_record()` một lần nếu chưa đầy.
  - `type` lấy như `_describe` (bọc `try`, lỗi → `"?"`).
  - Kết quả thêm `"var_history": list, "var_history_truncated": bool` chỉ khi bật.
- Mọi đoạn mới không được ném lỗi ra khỏi tracer; dùng hàm, kiểu đã chụp sẵn (`_type`, `_len`), không dùng tên người chơi có thể đổi.

## Steps
1. Viết test `VarHistory` trước (Tests), chạy thấy đỏ.
2. Cài theo Thiết kế; `harness-types.ts`; `build-config.ts`.
3. `npm run test:py` và `npm run test:py:3.14` (Pyodide dùng 3.14).
4. **Đo trên Pyodide** (Chromium qua Playwright, script tạm): trong `page.evaluate` trên `about:blank`, nạp `PYODIDE_MODULE_URL` (`src/engine/pyodide-config.ts`), `runPython(harness.py)`, gọi `run_level` với cùng config 1.2 (dựng bằng `buildConfig`) bật/tắt `trace_vars`. Ba ca × 7 lần, lấy trung vị: (a) lời giải 3 sao, (b) `while True:\n    ma_khu = goi_4` (hết 100.000 sự kiện), (c) `while True:\n    ma_khu = ma_khu + "x"` (đầy 40 mục rồi ngừng so). Đo cả hai phase `base` và `counter`. Không chiếm cổng 4173/5173.
5. So ngưỡng: (b) thêm ≤ 300 ms và tổng < 2 s; (a) thêm ≤ 10 ms.
   - Đạt → ghi báo cáo, xong.
   - Không đạt → **bậc lùi 1**: tính sẵn `bind_lines` từ AST (dòng của câu lệnh có `Name` thuộc `watch` ở ngữ cảnh `Store`/`Del`, có `Global`, hoặc có `Call`); chỉ `_record()` khi `stmt_line` trước đó thuộc `bind_lines`. Đo lại. Vẫn không đạt → **bậc lùi 2**: `build-config.ts` đặt `trace_vars: false`, ghi rõ trong báo cáo và `plan.md` rằng ki-ốt chạy chế độ giá trị cuối; phase 4–5 vẫn làm vì timeline đã có nhánh không lịch sử.

## Tests (lớp `VarHistory` trong `tests/python/test_harness.py`)
Dùng config 1.2 dựng trong test (6 mục tiêu `str`, 4 đầu vào), source đã thay dòng khóa bằng dòng trống như `prepareSource`.
1. **Dòng khớp editor, có mục trước dòng lỗi (#18):** starter 1.2 → `runtime_error` dòng 13; lịch sử đúng `[(8,"ho_ten","goi_1"), (9,"ma_khu","goi_2"), (10,"so_hieu",None)]` với `preview` của `so_hieu` là `"'goi_3'"`.
2. **`src` theo identity:** `so_hieu = goi_3` → `src == "goi_3"`; `so_hieu = "AN-5521"` → `src is None`; `goi_3 = "x"` rồi `so_hieu = goi_3` → `src is None`.
3. **Giới hạn và không chậm (#16):** `while True:\n    ma_khu = ma_khu + "x"` → `status == "timeout"`, `len(var_history) == 40`, `var_history_truncated is True`. (Không khẳng định thời gian trong unittest; thời gian thuộc bước đo.)
4. **Không gọi code người chơi (#17):** một lớp có `__eq__`, `__repr__`, `__hash__` ném lỗi hoặc lặp vô hạn, gán vào `ho_ten` rồi gán lại → lịch sử có hai mục, `preview` dạng `<TênLớp>`, run kết thúc bình thường. Thêm `del ho_ten` → mục `type is None`.
5. **Không bật thì không có (#19):** config 1.4 hiện có → không có khóa `var_history` trong kết quả; `vars`, `line_count` giống trước.

## Validation
```bash
npm run test:py
npm run test:py:3.14
npx vitest run tests/integration
npm run typecheck
```

## Risks
- **Đếm câu lệnh lệch:** đoạn mới không chạm `state["count"]`; test hiện có về đếm câu lệnh phải xanh nguyên.
- **Python 3.12+ phát sự kiện `line` cho dòng nối tiếp** của biểu thức nhiều dòng: đã xử lý bằng `stmt_line` chỉ cập nhật ở dòng thuộc `stmt_lines`.
- **Khóa toàn cục kiểu lớp con `str` có `__eq__` riêng** (`globals()[Evil("ma_khu")] = …`) có thể khiến `ns.get` gọi code người chơi; code đó vẫn bị tracer đếm và chặn bằng ngân sách. Chấp nhận theo mô hình đe dọa ở đầu `harness.py`.

## Rollback
Hoàn tác `harness.py` và `harness-types.ts`; trong `build-config.ts` bỏ `trace_vars`. Ki-ốt rơi về chế độ giá trị cuối.

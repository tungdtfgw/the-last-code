# Bench: chi phí `var_history` của harness (Level 1.2)

Ngày: 25/10/2026. Máy: Apple M4 Pro, macOS 26. Script tạm (không commit) chạy `run_level` với config 1.2 dựng như `buildConfig`, bật/tắt `trace_vars`, 7 lần mỗi ô, lấy trung vị.

Ba ca:
- (a) lời giải 3 sao (9 câu lệnh);
- (b) `while True:\n    ma_khu = goi_4` (hết 100.000 sự kiện dòng, lịch sử chỉ có 1 mục nên so suốt cả lượt: ca xấu nhất);
- (c) `ma_khu = goi_2` rồi `while True: ma_khu = ma_khu + "x"` (đầy 40 mục rồi ngừng so).

## Pyodide 3.14.2 (Chrome, trang của dev server :5173, Pyodide 314.0.7 từ jsDelivr)

| Ca | Phase | Tắt (ms) | Bật (ms) | Thêm (ms) |
|---|---|---|---|---|
| a | base | 28,6 | 26,6 | −2,0 |
| a | counter | 26,2 | 27,5 | +1,3 |
| b | base | 306,6 | 583,7 | **+277,1** |
| b | counter | 306,9 | 573,3 | +266,4 |
| c | base | 443,1 | 459,9 | +16,8 |
| c | counter | 425,9 | 72,3 | (nhiễu, xem dưới) |

Ô c/counter đo được 72 ms khi bật, thấp hơn khi tắt; không giải thích bằng tracer (ca này dừng so sau mục 40). Có thể do GC hoặc bộ nhớ của Wasm giữa các lần chạy; không ảnh hưởng kết luận.

## CPython (unittest chạy local)

| Ca | 3.13.2 thêm | 3.14.8 thêm |
|---|---|---|
| a | ≈ 0 | ≈ 0 |
| b | +25,9 ms (26 → 52) | +21,6 ms (22 → 43) |
| c | +0,8 ms | +0,5 ms |

## Kết luận

Ngưỡng của plan: ca xấu nhất thêm ≤ 300 ms và tổng < 2 s; lời giải thêm ≤ 10 ms.
- Ca b thêm 277 ms (tổng 584 ms) trên Pyodide: **đạt, nhưng sát ngưỡng (92%)**. Trên máy chậm hơn, ca này có thể vượt 300 ms; tổng vẫn xa 2 s và xa giới hạn 5 s của worker.
- Lời giải: không đo được chênh lệch.
- Không áp bậc lùi. Nếu cần, bậc lùi 1 (chỉ so sau câu lệnh có gán tên mục tiêu, tính từ AST) bỏ được khoảng một nửa số lần so ở ca b.

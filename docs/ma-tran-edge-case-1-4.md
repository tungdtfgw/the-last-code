# Ma trận edge case – Level 1.4

Cột "Kiểm" chỉ test chịu trách nhiệm: `py` = `tests/python/test_harness.py` (chạy cả Python 3.13 và 3.14), `pipe` = `tests/integration/grading-pipeline.test.ts`, `unit` = Vitest cạnh module, `e2e` = `tests/e2e/*.spec.ts` (Pyodide thật, dự án Playwright chromium + firefox + mobile-chromium; webkit/mobile-webkit bật bằng `E2E_WEBKIT=1`), `safari` = `npm run test:safari` (Safari thật qua safaridriver), `ghi chú` = quyết định có chủ đích, không phải hành vi cần kiểm.

Cập nhật 2026-10-25: không còn dòng nào chỉ kiểm thủ công. Hai dòng `ghi chú` (A31, D7) giải thích bên dưới; D7 nay cũng có e2e.

## A. Code người chơi

| # | Tình huống | Hành vi kỳ vọng | ECHO key | Kiểm |
|---|---|---|---|---|
| A1 | Code gốc (`"27"*100+"3"`) | Chạy không lỗi; 3 gói vàng, `ma_xac_thuc` 201 ký tự phình to; máy quét đỏ; terminal "MÁY QUÉT TỪ CHỐI" từng biến; không truy vết; 0 sao | `type_mismatch` | py, pipe, e2e |
| A2 | `SyntaxError` (thiếu ngoặc, `=` thành `==` sai chỗ…) | Không chạy test nào; truy vết "dòng N — SyntaxError: …" đúng dòng editor; gói không rời nguồn | `SyntaxError` | py, pipe |
| A3 | `IndentationError` / `TabError` (thụt lề sai, trộn tab-space) | Như A2 | `IndentationError` | py |
| A4 | `TypeError` (`int(tuoi)*100+cap_do`) | Truy vết dòng 7 trong bối cảnh GDD 4.2 | `TypeError` | py, pipe, e2e |
| A5 | `ValueError` ở test thường (vd. `int(chieu_cao)`) | Truy vết đúng dòng | `ValueError` | py |
| A6 | `NameError` (gõ sai tên, gọi `exit()`/`quit()`/`help()` đã bị gỡ) | Truy vết đúng dòng | `NameError` | py, pipe |
| A7 | `ZeroDivisionError` | Truy vết đúng dòng | `ZeroDivisionError` | py |
| A8 | `AttributeError` (`tuoi.to_int()`) | Truy vết đúng dòng | `AttributeError` | py |
| A9 | Lỗi khác (`IndexError`, `KeyError`, `RecursionError`→resource) | Truy vết đúng dòng, nêu tên lỗi | `runtime_error` / `resource_limit` | py |
| A10 | Người chơi tự `try/except` nuốt lỗi | Chấm theo giá trị cuối cùng; nếu biến thiếu → `missing_var` | tùy | py |
| A11 | Vòng lặp vô hạn Python (`while True: pass`), kể cả bọc `try/except Exception`, `except:` trần, `except BaseException`, `finally: continue`, `contextlib.suppress`, generator nuốt lỗi, comprehension vô hạn | Ngân sách 100 000 sự kiện `line` → `timeout` < 1 s; vì CPython bỏ tracer sau khi nó ném lỗi, harness chèn (qua AST, không có tên gọi được) lệnh canh ở đầu mỗi thân vòng lặp/`except`/`finally` và trong bộ lọc comprehension để ném lại; worker không bị hủy | `timeout` | py (3.13 + 3.14), e2e (`edge-cases`: 5 kiểu, mỗi lượt < 4 s, không khởi động lại lõi) |
| A12 | Treo trong C (`10**10**8`, `sum(range(10**12))`) | Đồng hồ 5 s → `worker.terminate()` → dựng lại worker (từ cache) → `timeout`; nút CHẠY mở lại khi sẵn sàng | `timeout` | unit (runner giả), e2e |
| A12b | Chỉ treo khi OMNI phản công (vd. `if tuoi == "31.0": sum(range(10**12))`) | Test thường và phản công chạy hai pha, mỗi pha có đồng hồ 5 s riêng; giữ kết quả pha thường (1–2 sao), phản công tính là trượt do quá thời gian; terminal "TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG"; mô phỏng: gói không rời nguồn, cổng về nửa | `counter_timeout` | py (pha), unit (runner, classify, terminal, timeline), e2e |
| A13 | Thiếu biến mục tiêu (xóa dòng, đổi tên `ma_xac_thuc`→`ma`) | Khe gói trống; liệt kê tên thiếu | `missing_var` | py, pipe |
| A14 | Code rỗng (chỉ còn dòng khóa) | Như A13 với cả 3 biến | `missing_var` | py |
| A15 | Sai kiểu nhưng đúng số (`2703.0`, `"2703"`) | Gói màu kiểu thật; "SAI KIỂU" | `type_mismatch_value_match` | py, pipe |
| A16 | `bool` thay `int` (`ma_xac_thuc = True`) và `int` thay `bool` (`hop_le = 1`) | Sai kiểu (so sánh `type(v) is T`) | `type_mismatch` | py |
| A17 | Lớp con của `int` / shadow `int = float` / `class int` | Harness dùng tham chiếu kiểu đã chụp → chấm đúng | `type_mismatch` khi sai | py |
| A18 | Sai số float (`float(chieu_cao)*2` không round) | Đạt nếu `abs(diff) ≤ 1e-9`; `round(...,1)` → sai giá trị; `nan`/`inf` → sai | `wrong_value` khi sai | py |
| A19 | Viết cứng (`ma_xac_thuc = 2703`) | Base đạt; phản công sai giá trị; 2 sao | `wrong_value_counter` | pipe |
| A20 | Gán lại đầu vào (`tuoi = "27"` ở dòng dưới) | Tương đương viết cứng | `wrong_value_counter` | py, pipe |
| A21 | Lời giải 6.6 | 2 sao; phản công `ValueError` dòng 7 | `counter_ValueError` | py, pipe, e2e |
| A22 | Lời giải 6.7 | 3 sao, cổng mở hoàn toàn | `three_stars` | py, pipe, e2e |
| A23 | Đúng nhưng > 8 lệnh (biến tạm, vòng lặp) | 1 sao; thanh cảnh báo > 40%; "TÍN HIỆU BỊ GHI NHẬN" | `alert_exceeded` | pipe |
| A24 | `input()` | Dừng với thông báo "không có kênh nhập liệu" | `input_unsupported` | py |
| A25 | `print` dày đặc / output khổng lồ | stdout cắt ở 8 000 ký tự / 200 dòng + "[đã cắt bớt]"; vòng lặp dài bị ngân sách line chặn | tùy kết quả | py |
| A26 | Giá trị rất lớn: `"x"*10**8` | Có thể thành công (≈100 MB); preview chỉ 80 ký tự + độ dài; không gửi giá trị lớn qua `postMessage` | tùy | py, e2e |
| A27 | `"x"*10**10`, `MemoryError`, `OverflowError` | `resource_limit`; worker được dựng lại chủ động | `resource_limit` | py |
| A28 | `int` > 4300 chữ số làm giá trị biến | `repr` bọc try → "<không hiển thị được>"; không crash | tùy | py |
| A29 | `import os/sys/js/pyodide/micropip`, `__import__("js")`, `from pyodide.ffi import …` | `blocked_import`, thông điệp "Mô-đun bị phong tỏa"; `import math` vẫn được | `blocked_import` | py |
| A30 | `raise SystemExit` | Dừng, không có kết quả | `system_exit` | py |
| A31 | Leo sandbox nâng cao (`().__class__.__subclasses__()`…) | Chấp nhận rủi ro (game một người, worker không có DOM/bí mật); chỉ tự gian lận. Ghi trong comment harness | – | ghi chú: quyết định mô hình đe dọa, không có hành vi "đúng" để kiểm; py kiểm phần phòng vệ thật (`math`/`json` bị vá không làm hỏng lượt sau, lệnh canh không truy cập được) |
| A32 | Cùng một lỗi 3 lần liền | Thêm câu theo sau gợi ý mở nhật ký | `repeated_fail` | unit |
| A33 | Unicode/tiếng Việt trong code, CRLF khi dán | Chạy bình thường; CRLF chuẩn hóa | – | unit (`prepare-source`) |

## B. Editor & dòng khóa

| # | Tình huống | Hành vi | Kiểm |
|---|---|---|---|
| B1 | Gõ/xóa trong dòng 2–4 | Bị chặn, viền nháy, âm từ chối, `aria-live` | unit, e2e |
| B2 | Backspace ở đầu dòng 5 / Delete ở cuối dòng 1 (nối dòng) | Bị chặn | unit |
| B3 | Chọn tất cả + xóa / cắt | Bị chặn toàn bộ transaction | unit, e2e |
| B4 | Dán đè vùng chứa dòng khóa | Bị chặn | e2e |
| B5 | Kéo-thả văn bản vào/ra dòng khóa | Bị chặn (thả vào dòng 7 vẫn được – đối chứng) | e2e (DataTransfer giả lập trên dòng 2–4, kéo chuột thật trong editor và từ ngoài editor; thiết bị cảm ứng chỉ có phần giả lập vì không có kéo chuột) |
| B6 | Undo/redo đi qua thao tác đã bị chặn | Không làm đổi dòng khóa | unit |
| B7 | Thêm dòng phía trên dòng 2 | Cho phép; dòng khóa dịch xuống; số dòng truy vết vẫn khớp editor | unit |
| B8 | "Khôi phục mã gốc" | Xác nhận → nạp starter (annotation bỏ qua filter) | unit |
| B9 | Draft cũ không còn khối dòng khóa | Bỏ draft, nạp starter, báo người chơi | unit |

## C. Runtime & vòng đời

| # | Tình huống | Hành vi | Kiểm |
|---|---|---|---|
| C1 | Bấm CHẠY khi Pyodide đang tải | Nút khóa, nhãn "LÕI ĐANG KHỞI ĐỘNG"; phím tắt bị bỏ qua; không tăng số lần chạy | unit (reducer), e2e |
| C2 | Double-click / giữ Ctrl+Enter | Một lần chạy; promise đang chạy được tái dùng; nút khóa trong `running`/`animating` | unit, e2e |
| C3 | Pyodide tải lỗi / offline / CDN chặn | Màn lỗi trong bối cảnh ("KHÔNG KẾT NỐI ĐƯỢC LÕI PYTHON"), lý do (`offline`/`cdn`/`timeout` 60 s), nút THỬ LẠI; editor vẫn xem được | unit, e2e |
| C4 | Trình duyệt không hỗ trợ module worker | Màn "TRÌNH DUYỆT KHÔNG HỖ TRỢ" + danh sách trình duyệt tối thiểu | unit (runner), e2e (Worker module bị ép ném lỗi) |
| C5 | Worker crash giữa lúc chạy | `engine_error`, dựng lại worker, ECHO báo khởi động lại | unit |
| C6 | Message trễ từ lần chạy đã timeout | Bỏ qua theo `runId` | unit |
| C7 | JSON level hỏng | Màn "DỮ LIỆU LEVEL HỎNG", không crash trắng | unit |
| C8 | Lỗi React không lường | Error boundary hiện màn fatal có nút tải lại | unit (`error-boundary.test.tsx`) |

## D. Lưu trữ

| # | Tình huống | Hành vi | Kiểm |
|---|---|---|---|
| D1 | `localStorage` bị chặn (SecurityError) | `MemoryRepository`, nhãn "CHẾ ĐỘ KHÔNG LƯU", chơi trọn màn | unit, e2e |
| D2 | JSON hỏng | Dùng mặc định, ghi đè sau | unit |
| D3 | Schema cũ/khác (`schemaVersion` ≠ 1) | Migration nếu có, không thì mặc định | unit |
| D4 | Hết quota khi ghi | Giữ trong bộ nhớ, `persistent=false`, nhãn cảnh báo | unit |
| D5 | Giá trị trường sai kiểu/ngoài khoảng | Kẹp/mặc định từng trường | unit |
| D6 | Reload | Giữ draft, bestStars (không giảm), runs, hintsOpened | unit, e2e |
| D7 | Hai tab cùng mở | Ghi sau thắng (chấp nhận) | e2e (tab B ghi sau, tab mới thấy bản của B, khối khóa nguyên vẹn) |

## E. Giao diện, âm thanh, truy cập

| # | Tình huống | Hành vi | Kiểm |
|---|---|---|---|
| E1 | Resize cửa sổ | Grid tự co; SVG theo `viewBox`; không vỡ ở 1280/768/360 px | e2e (1280/768/360 px và 375 px, không cuộn ngang) |
| E2 | Mobile < 768 px | Tab NHIỆM VỤ/MÃ/MÔ PHỎNG; tự chuyển tab mô phỏng khi chạy, quay lại tab MÃ và trả focus về CHẠY | e2e (cả bộ chạy trên dự án mobile-chromium 412 px, cảm ứng) |
| E3 | Chính sách autoplay | Không tạo `AudioContext` trước cử chỉ; unlock ở `pointerdown`/`keydown`/`click`/`touchend` đầu tiên | unit, e2e (đếm `AudioContext` = 0 trước cử chỉ; sau click/tap: `running`, ambient bật) |
| E4 | Tắt tiếng | Im lặng tức thì; lưu qua repository; nhớ sau reload | unit, e2e (không cue nào sau khi tắt, kể cả sau reload) |
| E5 | Không có Web Audio | Engine no-op | unit |
| E6 | Tab ẩn | `suspend()` audio; hoạt cảnh không tích tụ | unit, e2e (`visibilitychange` → `suspended`, hiện lại → `running`) |
| E7 | Chỉ bàn phím | Tab tới mọi điều khiển; Esc+Tab rời editor; Ctrl/⌘+Enter chạy; Esc đóng dialog / bỏ qua hoạt cảnh; focus trả về hợp lý | e2e (chơi tới 3 sao chỉ bằng bàn phím; focus giữ trên CHẠY sau lượt 0 sao; bỏ qua trên thiết bị cảm ứng vì không có bàn phím cứng) |
| E8 | `prefers-reduced-motion` | Không trượt/rung/gõ chữ dần; trạng thái hiện tức thì | e2e (`reducedMotion: reduce`: 3 sao, không `is-speaking`/`is-shaking`/caret, `animation-duration` ≈ 0, câu ECHO hiện đủ) |
| E9 | Mù màu | Mỗi gói có nhãn kiểu chữ; báo động có biểu tượng + chữ | e2e (nhãn `str` trên gói, biểu tượng + chữ ở trạng thái báo động, chip kiểu ở mục tiêu) |
| E10 | Văn bản người chơi trong terminal | Render bằng text node, không `innerHTML` | unit (snapshot) |

## F. Âm thanh (bằng chứng tự động)

| # | Tình huống | Hành vi | Kiểm |
|---|---|---|---|
| F1 | Mỗi cue phát ra âm thật | Render từng cue qua `OfflineAudioContext` (node-web-audio-api) qua cùng chuỗi master/compressor: đỉnh trong (0.01, 1.0], không NaN, tắt trong thời lượng khai báo | unit (`sound-render.test.ts`) |
| F2 | Cue đúng lúc trong game | Cử chỉ đầu → context/unlock/ambient; CHẠY → `run`; gõ → `key_blip`; từ chối → `scan_reject` + `alarm`; ECHO → `echo_voice`; terminal → `terminal_line`; 6.7 → `scan_pass`, `siren`, `gate_open`, `star` | e2e (`audio.spec.ts`, đầu dò `window.__TLC_AUDIO_PROBE__` chỉ bật khi trang test khai báo) |

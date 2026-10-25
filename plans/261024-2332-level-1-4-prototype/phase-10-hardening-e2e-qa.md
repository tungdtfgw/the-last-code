---
phase: 10
title: "Gia cố edge case, e2e, checklist QA"
status: completed
priority: P1
effort: "2h"
dependencies: [8, 9]
---

# Phase 10: Gia cố edge case, e2e, checklist QA

## Goal
Mọi dòng trong [edge-case-matrix.md](./edge-case-matrix.md) có hành vi đã kiểm (tự động hoặc thủ công), có e2e smoke trên Chromium với Pyodide thật, và PM có checklist để thử trên trình duyệt thật.

## Files to Create
- `playwright.config.ts` – `webServer: { command: "npm run build && npm run preview -- --port 5175 --strictPort", port: 5175, reuseExistingServer: false }`, project `chromium`, timeout test 120 s (lần đầu tải Pyodide).
- `tests/e2e/level-1-4.spec.ts`
- `tests/e2e/helpers.ts` – `replaceEditableCode(page, text)` (focus editor, chọn vùng sau dòng khóa bằng phím, gõ) và `waitForPythonReady(page)`.
- `README.md` ngắn ở gốc: cách chạy (`npm install`, `npm run dev`, các lệnh test), trình duyệt hỗ trợ, ghi chú cần mạng lần đầu. (Được yêu cầu vì PM sẽ tự chạy; giữ ≤ 40 dòng.)

## E2E (cần mạng tới jsDelivr; nếu không có mạng, spec in rõ "SKIP: offline" qua `test.skip` có điều kiện kiểm `fetch` HEAD URL Pyodide)
1. Mở trang → boot screen → chờ trạng thái sẵn sàng; nút CHẠY bị khóa trong lúc tải.
2. Chạy code gốc → terminal có "MÁY QUÉT TỪ CHỐI", không có "TRUY VẾT"; ECHO hiện câu `type_mismatch` (AC 1).
3. Sửa dòng 7 thành `ma_xac_thuc = int(tuoi) * 100 + cap_do` → "TRUY VẾT: dòng 7 — TypeError" (AC 1b).
4. Nhập lời giải 6.6 → 2 sao, terminal có "OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP" và `ValueError` (AC 2 trong Pyodide thật).
5. Nhập lời giải 6.7 → dialog 3 sao, có "Số gợi ý đã mở" (AC 3, 11).
6. Gõ vào dòng 3, `Ctrl/⌘+A` rồi `Backspace`, dán đè → nội dung dòng 2–4 không đổi (AC 5).
7. Double-click CHẠY → bộ đếm số lần chạy chỉ tăng 1.
8. `while True: pass` → "TIẾN TRÌNH BỊ CẮT", sau đó chạy 6.7 vẫn được (worker hồi phục).
9. Mở 1 gợi ý, reload → code nháp, sao cao nhất, số lần chạy, số gợi ý còn nguyên (AC 10).
10. Context thứ hai với `addInitScript` ghi đè `Storage.prototype.getItem/setItem` để ném `SecurityError` → vẫn chơi tới 3 sao, có nhãn "CHẾ ĐỘ KHÔNG LƯU" (AC 10).
11. Viewport 375×812: không có cuộn ngang (`document.documentElement.scrollWidth <= 375`), tab MÃ dùng được.
12. Chặn route `cdn.jsdelivr.net` (`page.route(..., r => r.abort())`) → màn lỗi tải có nút "THỬ LẠI"; bỏ chặn, bấm thử lại → sẵn sàng.

## Gia cố
- Đi lần lượt ma trận edge case; dòng nào chưa có test tự động thì kiểm thủ công và đánh dấu trong checklist bên dưới.
- Chạy `ak-code-review` (skill review) trên toàn bộ mã trước khi bàn giao; sửa lỗi nghiêm trọng.
- Kiểm process: dừng mọi `vite`/`preview` đã khởi chạy (`lsof -i :5174 -i :5175`).

## Checklist QA cho PM (trình duyệt thật: Chrome + một trong Safari/Firefox)

Cập nhật 2026-10-25: mọi mục đều có bằng chứng tự động. Mục đánh dấu [x] đã được kiểm tự động (và PM đã thử tay trong Chrome ở các mục ghi "PM"). Chỉ còn Safari thật cần một thao tác bật quyền (xem mục cuối).

- [x] Lần đầu mở: màn tải có chữ bối cảnh, xong trong ≤ 30 s ở mạng thường. – e2e "boot" (Pyodide CDN thật trong context trình duyệt mới: 1.4–2.5 s trên máy build).
- [x] Code gốc → 3 gói vàng, gói `ma_xac_thuc` phình to, máy quét đỏ, không có truy vết. – e2e (AC 1, E9), unit timeline; PM.
- [x] Lời giải 6.6 → 2 sao, thấy phản công và `ValueError`. – e2e (AC 2).
- [x] Lời giải 6.7 → 3 sao, cổng mở hoàn toàn, outro + log KTS-03. – e2e (AC 3, 11); PM.
- [x] Không sửa được dòng 2–4 bằng mọi cách (gõ, xóa, dán, kéo, chọn tất cả, undo). – e2e (gõ, Backspace nối dòng, chọn tất cả + xóa, chèn, dán qua ClipboardEvent và clipboard thật, kéo-thả giả lập + chuột thật, Ctrl+Z sau khôi phục), unit; PM.
- [x] ECHO nói câu khác nhau theo từng loại lỗi; không bao giờ nhắc tên hàm cần dùng. – unit (`echo-reactions`, `echo-forbidden-terms`), e2e.
- [x] Âm thanh chỉ bắt đầu sau click; nút tắt tiếng hoạt động và được nhớ sau reload. – e2e `audio.spec.ts` (không có `AudioContext` trước cử chỉ, cue đúng, tắt tiếng + reload), unit render offline; PM (audio context running).
- [x] Chơi trọn màn chỉ bằng bàn phím. – e2e E7.
- [x] Thu nhỏ cửa sổ / mở trên điện thoại: bố cục không vỡ. – e2e 1280/768/375/360 px + toàn bộ bộ test trên dự án mobile-chromium (412 px, cảm ứng).
- [x] Tắt mạng rồi mở lần đầu (cửa sổ ẩn danh): màn lỗi rõ ràng, có thử lại. – e2e C3 (chặn cdn.jsdelivr.net ở mức context, gồm cả request của worker), unit lý do offline/cdn/timeout.
- [x] Reload giữ tiến độ; cửa sổ ẩn danh/chặn cookie vẫn chơi được. – e2e (AC 10, D1); PM.
- [x] `while True` bị cắt nhanh, kể cả bọc `except:` trần trong vòng lặp ngoài. – py + e2e A11; PM (`while True`).
- [x] Hơn 20 câu lệnh → Sentinel bắt, 0 sao. – pipe + unit; PM (33 câu lệnh).
- [x] `import js` bị phong tỏa. – py; PM.
- [ ] Safari thật: `npm run test:safari` (cần bật Safari → Settings → Developer → "Allow remote automation" một lần). Playwright WebKit không khởi động được trên macOS 26.0 của máy build (segfault ở cả bản 2370 và 2380), nên mục này chưa chạy được ở đây; Firefox và Chromium (desktop + mobile) đã chạy toàn bộ bộ e2e.

## Verification
- `npm run test:all && npm run build && npx playwright install chromium && npm run test:e2e`
- `ak plan validate` không áp dụng ở đây; phase hoàn tất khi mọi lệnh xanh và checklist được điền.

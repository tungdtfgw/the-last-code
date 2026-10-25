# Cook: gập ô Nhiệm vụ

- Ngày: 2026-10-25, giờ Asia/Saigon. Thay đổi nhỏ, không có tệp kế hoạch riêng.
- Lý do: ở 1280×800 cột Nhiệm vụ của 1.1–1.3 vẫn cuộn trong ô Mục tiêu (1.2 cần ~980 px chữ trong cột ~700 px, xem `cook-261025-1333-echo-chat-popup.md`).

## Hợp đồng

- Tiêu đề ô Nhiệm vụ là một `<button>` thật (trong `<h2>`), có `aria-expanded`, `aria-controls="briefing-body"`, mũi tên, dùng được bằng bàn phím.
- Gập: chỉ còn một dòng, gồm dòng đầu của briefing (vd. "[NHẬT KÝ HỆ THỐNG – …]", cắt bằng dấu "…") và "Mở lại". Mở: "Nhiệm vụ" và "Thu gọn".
- Tự gập **một lần**, khi lượt chạy đầu tiên của level trong phiên kết thúc (về lại `ready`). Người chơi mở lại bất cứ lúc nào; đã mở lại (hoặc đã tự bấm trước lượt chạy đầu) thì không tự gập nữa.
- "Phiên" là vòng đời trang: trạng thái gập nhớ theo level trong một `Map` cấp module, nên vào lại level từ bản đồ vẫn giữ trạng thái, tải lại trang thì về mặc định.
- Trong phần mở đầu (§4.4) ô luôn mở để chữ gõ ra; trạng thái gập chỉ áp dụng khi intro xong.
- Khi gập, Mục tiêu nhận chiều cao trống. Điện thoại dùng cùng nút trong tab Nhiệm vụ. Giảm chuyển động: quy tắc toàn cục tắt chuyển động của mũi tên; không có hoạt cảnh khác.
- Không đụng bố cục nút/bong bóng ECHO.

## Đã làm

- `src/ui/briefing-collapse.ts` (mới): reducer thuần `foldBriefing` (`run_done` | `toggle`) và bộ nhớ phiên theo level.
- `src/ui/briefing-panel.tsx`: tiêu đề thành nút gập; nội dung (cả bản `sr-only`) nằm trong `#briefing-body` có `hidden` khi gập.
- `src/ui/game-screen.tsx`: giữ trạng thái gập, bắt chuyển pha `running/animating → ready` để phát `run_done`, truyền `collapsed={introDone && fold.collapsed}`.
- `src/styles/global.css`: quy tắc `.briefing-toggle`, `.briefing-chevron`, `.briefing-peek`, `.briefing.is-collapsed` (flex `0 0 auto`, không `min-height`).
- `design/gdd.md` §4.7: thêm một gạch đầu dòng.

## Test

- `src/ui/briefing-collapse.test.ts` (2 test): tự gập chỉ sau lượt chạy đầu; đã bấm thì không tự gập nữa.
- `npm run typecheck`, `npm run build` qua; `npm test` 33 tệp, 343 test (trước: 32 tệp, 341 test).
- E2E: không spec nào kiểm chữ briefing sau một lượt chạy, nên không sửa. Không chạy Playwright e2e.

## Đo trên dev server :5173 (Chromium headless)

Vào nhiệm vụ, chờ intro, bấm CHẠY một lần (mã gốc), chờ 4 s; đo `.objectives` scrollHeight/clientHeight.

| Level | 1280×800 trước khi chạy | 1280×800 sau lượt chạy (đã gập) | 360×740 sau lượt chạy |
|---|---|---|---|
| 1.1 | cuộn (334/295) | không cuộn (334/334) | không cuộn |
| 1.2 | cuộn (558/405) | không cuộn (558/558) | không cuộn |
| 1.3 | cuộn (474/379) | không cuộn (474/474) | không cuộn |
| 1.4 | không cuộn (362/362) | không cuộn | không cuộn |

Mọi trường hợp: trang không cuộn dọc lẫn ngang; ô gập cao 58 px; mở lại bằng Enter trên nút thì `aria-expanded="true"` và vẫn mở sau lượt chạy thứ hai.

Script và ảnh: `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/collapse/` (`shoot.mjs`, `results.json`, `{level}-{1280x800|360x740}-after-run.png`, `{level}-1280x800-reopened.png`).

## Ghi chú

- Bong bóng ECHO (có sẵn) vẫn nổi đè lên chân cột Mục tiêu ở màn rộng và lên dòng gập ở điện thoại cho đến khi đóng; đây là hành vi đã có, không đổi.
- Khi mở, "Nhiệm vụ · Thu gọn" chiếm chỗ nên dòng meta "Chương 1 · Vùng Tối" xuống dòng ở cột ~330 px.

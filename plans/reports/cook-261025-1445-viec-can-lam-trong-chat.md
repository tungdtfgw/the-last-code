# Cook: Việc cần làm chuyển vào khung chat ECHO

- Ngày: 2026-10-25, giờ Asia/Saigon.
- Yêu cầu: "Việc cần làm nên để vào chat của echo. Như hiện nay nó lại chiếm vị trí của nhiệm vụ và mục tiêu."
- Kiểm chứng: `npm run typecheck`, `npm test` (34 tệp, 386 test), `npm run build` đều qua. **E2E: đã sửa, chưa chạy.**

## Hợp đồng

- Bỏ ô "Việc cần làm" khỏi cột Nhiệm vụ. Cột chỉ còn Nhiệm vụ và Mục tiêu, giữ cách gập briefing.
- Trong khung chat ECHO, `task_steps` là thẻ ghim ở đầu, trước lịch sử hội thoại, tiêu đề "Việc cần làm", đánh số, chữ trong backtick hiện thành code. Thẻ không trôi theo tin nhắn.
- Dễ tìm: sau intro, bong bóng đầu vẫn là câu `entry`. Cho tới khi mở khung chat lần đầu ở level đó trong phiên, bong bóng có thêm dòng "Mở để xem việc cần làm (E)" và nút ECHO ghi "việc cần làm". Không tự mở khung chat.
- Điện thoại: thẻ nằm đầu tấm trượt.
- Level không có `task_steps` thì không có thẻ.
- Giảm chuyển động và bàn phím (E mở, Esc đóng, focus) giữ nguyên.

## Đã làm

- `src/ui/task-steps-panel.tsx`: `TaskStepsPanel` thành `TaskStepsCard` (section có tiêu đề h3, `aria-labelledby`), vẫn dùng `InlineCode`.
- `src/ui/game-screen.tsx`: bỏ ô ở cột Nhiệm vụ; truyền `levelId` và `taskSteps` cho `EchoChat`.
- `src/ui/echo-chat.tsx`: thẻ nằm giữa đầu khung và `.echo-log`. Khi còn trỏ tới việc cần làm: bong bóng có `.echo-bubble-cta`, nút có class `points-steps`, chữ phụ "việc cần làm", `aria-label` thêm ", có việc cần làm". Mở khung (nút, bong bóng hay `E`) là tắt.
- `src/game/echo-chat.ts`: `createStepsSeen()` và singleton `stepsSeen`, một `Set` id level trong bộ nhớ trang. Không lưu, nên tải lại trang là phiên mới.
- `src/styles/global.css`: bỏ quy tắc ô cũ ở cột Nhiệm vụ; thêm `.echo-chat > .task-steps` (không co, tối đa 45dvh, tự cuộn), `.task-steps-title`, `.echo-bubble-cta`. Khung chat tăng chiều cao tối đa: 60 → 80dvh (màn rộng), 70 → 85dvh (tấm trượt điện thoại), để thẻ và vài dòng lịch sử cùng vừa.
- Tài liệu: `design/gdd.md` §4.1 (khung chat), §4.4 bước 2 và 4, §4.7; `CLAUDE.md` (dòng `task_steps`, mục UI, thứ tự intro).

## Test

- `src/game/echo-chat.test.ts` (+1): dấu trỏ hiện tới khi mở khung lần đầu cho level đó; level khác và level không có bước tách riêng.
- `tests/e2e/knowledge-summary.spec.ts`: test "task steps" viết lại: cột Nhiệm vụ không có `.task-steps`; bong bóng có "Mở để xem việc cần làm (E)", nút có `points-steps`; `E` mở và focus vào khung; region "Việc cần làm" có đủ số bước và đứng trước `.echo-log`; Esc thì nút hết `points-steps`. Chỉ đổi selector và luồng, không đổi chữ trích từ level.
- `echo-chat.spec.ts` không cần sửa: thẻ không phải `.echo-msg`, nên số tin vẫn là 1.

## Ảnh chụp (dev server :5173, Chromium headless, không giảm chuyển động)

Script và ảnh: `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/steps-chat/` (`shoot.mjs`, `{level}-{1280x800|1024x768|360x740}-{closed|open}.png`).

Mọi level, mọi kích thước: không cuộn ngang, trang không cuộn, cột Nhiệm vụ chỉ còn 2 ô, có dòng gợi ý trong bong bóng, `E` mở và focus vào khung, Esc trả focus về nút, sau khi mở thì nút ghi "kênh mở".

| Kích thước | Thẻ cuộn bên trong | Lịch sử (px) |
|---|---|---|
| 1280×800 | chỉ 1.4 (415/359) | 88–110 |
| 1024×768 | không | 88 |
| 360×740 | 1.1 (351/332), 1.4 (373/332) | 88–110 |

## Còn mở

- Khi nội dung bước dài (1.4), thẻ tự cuộn bên trong; lịch sử còn khoảng 88 px, đủ cho câu mới nhất, các câu cũ cuộn trong luồng.
- Ở 1280×800 khung chat mở cao gần hết cột (đỉnh y ≈ 82–113), che briefing trong lúc mở. Khung không chặn editor.
- Dấu trỏ chỉ nhớ trong bộ nhớ trang (theo hợp đồng "mỗi phiên"); tải lại thì hiện lại.
- E2E chưa chạy.

Status: DONE

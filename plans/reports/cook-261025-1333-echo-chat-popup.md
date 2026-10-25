# Cook: ECHO và gợi ý thành khung chat nổi

- Ngày: 2026-10-25, giờ Asia/Saigon.
- Hợp đồng: `plans/reports/brainstorm-261025-1333-echo-chat-popup.md`. Kế hoạch: `plans/261025-1333-echo-chat-popup/`.
- Kiểm chứng: `npm run typecheck`, `npm test` (32 tệp, 341 test; trước thay đổi là 31 tệp, 334 test), `npm run build` đều qua. Ảnh Playwright headless trên dev server :5173. **E2E: đã viết, chưa chạy.**

## Đã làm

**Logic:**
- `GameState.chat` (`src/game/game-reducer.ts`) giữ mọi câu ECHO của phiên, theo thứ tự. Mỗi câu có nhãn `entry`, `run` (kèm số lượt) hoặc `hint` (kèm mức).
- Helper `say()` cập nhật `echo` và `chat` cùng lúc. Lịch sử giữ tối đa 80 câu.
- `progress_loaded` nhận thêm `hints` (từ `use-game.ts`). Gợi ý đã mở ở phiên trước được chèn **trước** câu vào màn, nên câu vào màn vẫn là câu mới nhất mà bong bóng hiện.
- `src/game/echo-chat.ts` là reducer thuần cho trạng thái mở, chưa đọc và bong bóng.

**Giao diện:**
- `src/ui/echo-chat.tsx` gồm:
  - nút ECHO, có chấm chưa đọc, `aria-expanded` và `aria-controls`;
  - bong bóng gõ chữ kèm `echo_voice`, có nút đóng 44 px;
  - khung chat `role="dialog" aria-modal="false"`: luồng tin có nhãn "Vào nhiệm vụ", "Lượt chạy #n" hoặc "Gợi ý mức n", khu Nhật ký gợi ý ở cuối;
  - vùng `.echo-live` có `aria-live`.
- Bàn phím:
  - `E` mở khung khi không ở trong ô gõ chữ.
  - Esc đóng khung, trừ khi focus đang ở editor hoặc Esc vừa hủy bước xác nhận gợi ý.
  - Mở khung thì focus vào khung; đóng thì focus về chỗ cũ, hoặc về nút ECHO.
- `src/ui/echo-face.tsx` chứa `EchoFace` và `EchoPortrait`, dùng chung với cutscene.
- Đã xóa `src/ui/echo-panel.tsx`.
- `hints-panel.tsx` giờ là khu cuối khung chat. Gợi ý đã mở hiện thành tin ECHO trong luồng chat. Bước xác nhận giữ như cũ.
- `isTyping` được tách ra `src/ui/is-typing.ts` để dùng chung với phím `M`.
- Cột Nhiệm vụ chỉ còn Nhiệm vụ và Mục tiêu. Đã bỏ các quy tắc `min-height` cũ của ECHO và gợi ý, cùng media query màn thấp ≤ 900 px.

**CSS** (token mới `--echo-fab-h` và `--echo-shadow` trong `tokens.css`):
- Màn rộng: `.echo-dock` dùng chung grid area `mission`, nằm ở chân cột. Cột chừa `padding-bottom` cho nút. Khung mở ngay trên nút, rộng bằng cột, cao tối đa 60dvh.
- 768–1199 px: dock đi theo cột Nhiệm vụ, nằm ở dưới bên phải.
- Điện thoại: nút nằm ở cuối thanh tab, bong bóng thả xuống dưới nút, khung chat là tấm trượt từ dưới lên, cao tối đa 70dvh.
- Giảm chuyển động: quy tắc toàn cục tắt mọi hoạt cảnh; bong bóng hiện đủ chữ ngay.

**Tài liệu:**
- `design/gdd.md`: §4.1 thêm mục "Cách ECHO hiện trên màn chơi"; §4.4 bước 4; §4.7 viết lại.
- `CLAUDE.md`: mục UI và intro.

## Lệch so với hợp đồng

1. **Điện thoại:** hợp đồng ghi nút ở "góc dưới phải, trên thanh tab". Thanh tab thật nằm ở **trên** màn hình. Ảnh chụp cho thấy nút cố định ở góc dưới phải đè lên nút CHẠY (CHẠY ở y 672–716, nút ở y 678–732). Vì vậy nút được đặt ở cuối thanh tab. Cách này đáp ứng AC 5: không che CHẠY, không che tab.
2. **768–1199 px:** khung neo theo cột Nhiệm vụ, tức góc dưới phải, chứ không phải dưới trái, vì ở bố cục này cột Nhiệm vụ nằm ở dưới bên phải.
3. Tin gợi ý được khôi phục khi tải lại đứng trước câu vào màn, không theo thứ tự thời gian thật. Phiên trước không lưu thời điểm mở.

## Test mới (chỉ cho logic)

- `src/game/echo-chat.test.ts` (5 test):
  - chưa có tin trước khi ECHO thức;
  - tin mới khi khung đóng thì có bong bóng và chấm chưa đọc, mở khung thì thành đã đọc;
  - tin đến khi khung đang mở thì không thành chưa đọc;
  - đóng bong bóng thì chấm vẫn còn;
  - bong bóng chỉ hiện câu mới nhất.
- `src/game/game-reducer.test.ts` (+2 test):
  - thứ tự lịch sử và nhãn lượt/gợi ý;
  - gợi ý khôi phục đứng trước câu vào màn và không bị nhân đôi.
- Test cũ "hints open strictly in order" vẫn kiểm `hintsOpened` tăng.

## E2E (đã viết, chưa chạy)

- `tests/e2e/echo-chat.spec.ts` (mới):
  - bong bóng hiện câu vào màn, có chấm chưa đọc và `aria-live`;
  - `E` mở và focus vào khung; Esc đóng, focus về nút, chấm tắt;
  - mở gợi ý trong khung thì gợi ý thành tin cuối; editor vẫn gõ được khi khung mở; Esc trong editor không đóng khung;
  - tải lại vẫn thấy gợi ý.
- `helpers.ts`: thêm `openEchoChat`.
- `intro.spec.ts`:
  - đổi `.echo-portrait.is-asleep` thành `.echo-fab .echo-portrait.is-asleep`;
  - kiểm bong bóng thay cho `.echo-line`;
  - test cuộn từng ô: đóng bong bóng trước khi lăn chuột.
- `edge-cases.spec.ts`: đổi `.echo .sr-only` thành `.echo-live`; kiểm câu đầy đủ trong bong bóng.
- `level-1-4.spec.ts`:
  - đổi `echoText` thành `.echo-live`;
  - test tải lại mở gợi ý trong khung chat.
  - Assert cũ chờ chữ "Máy quét không đọc được ý nghĩa", nhưng câu này đã cũ: gợi ý 1 đã đổi ở lần sửa 13:10. Đã thay bằng "Nhìn mô phỏng sau khi chạy".

## Ảnh chụp và số đo

Script: `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/chat/shoot.mjs` và `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/chat/run-flow.mjs`. Ảnh nằm trong `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/chat/`, đặt tên `{level}-{1280x800|360x740}[-rm]-{closed|open|code-closed}.png` (`-rm` là chế độ giảm chuyển động), cộng thêm `1.1-1024x768-{closed,after-run,open}.png`.

**Kết quả ở mọi kích thước:**
- Không cuộn ngang, trang không cuộn.
- Có bong bóng và chấm chưa đọc sau intro.
- `E` mở khung và focus vào khung. Esc đóng khung, focus về nút.
- Giảm chuyển động: không có con trỏ gõ chữ.
- 1.4: mở gợi ý trong khung thì thêm 1 tin, ô đếm ghi "1/3 đã giải mã".

**360×740:**
- Nút ECHO ở (308, 131, 44×44), trong hàng tab.
- CHẠY ở y 672: không chồng lên nhau.

**1024×768** (chạy Pyodide thật, level 1.1):
- Sau lượt chạy, bong bóng hiện câu NameError, và vùng `aria-live` đọc đúng câu đó.
- Khung chat ghi "VÀO NHIỆM VỤ" rồi "LƯỢT CHẠY #1".
- Gõ trong editor được khi khung mở; Esc trong editor không đóng khung.

**1280×800, chiều cao ô / chiều cao nội dung (px)** (trước sửa, 1.1 có briefing 161 và mục tiêu 239):

| Level | Briefing | Mục tiêu | Ghi chú |
|---|---|---|---|
| 1.1 | 313 / 381 | 305 / 334 | |
| 1.2 | 206 / 422 | 413 / 558 | |
| 1.3 | 229 / 352 | 389 / 474 | |
| 1.4 | 199 / 199 | 362 / 362 | vừa đủ, không cuộn |

## Còn mở

- **AC 1 chỉ đạt một phần.** Ở 1280×800, cột Nhiệm vụ (rộng khoảng 333 px) không chứa hết nội dung của 1.1, 1.2 và 1.3, nên ô vẫn tự cuộn (sticky heading), dù rộng hơn trước nhiều. 1.2 cần khoảng 980 px cho 6 mục tiêu cộng briefing, trong khi cột chỉ có 700 px. Nếu muốn không cuộn, phải rút gọn chữ trong JSON level hoặc nới cột. Cả hai nằm ngoài phạm vi lần này.
- Khi đang hiện, bong bóng che phần chân cột Nhiệm vụ (desktop) hoặc phần đầu tab đang mở (điện thoại). Đây là thiết kế đã chốt: bong bóng ở lại tới khi người chơi đóng.
- Chưa chạy e2e, nên các selector mới chỉ được kiểm bằng script ảnh chụp, chưa qua Playwright test runner. Riêng `audio.spec.ts` không đổi; nó dựa vào việc bong bóng phát `echo_voice` sau `objective_lock`.

Status: DONE_WITH_CONCERNS

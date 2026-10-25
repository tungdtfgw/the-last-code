# Phase 2: nút ECHO, bong bóng, khung chat

## Files
- Tạo: `src/ui/echo-chat.tsx` (nút + bong bóng + khung + vùng `aria-live`), `src/ui/echo-face.tsx` (`EchoFace`, chân dung nhiễu sóng dùng chung).
- Sửa: `src/ui/hints-panel.tsx` (thành khu "Nhật ký gợi ý" trong khung chat: chỉ còn nút giải mã + bước xác nhận; gợi ý đã mở hiện như tin ECHO), `src/ui/game-screen.tsx` (cột trái chỉ còn Briefing + Objectives; gắn `EchoChat`), `src/ui/cutscene-player.tsx` (import `EchoFace`), `src/styles/global.css`.
- Xóa: `src/ui/echo-panel.tsx`.

## Steps
1. Nút `.echo-fab`: chân dung thu nhỏ (ngủ khi intro chưa xong, nhiễu khi đang nói), chấm chưa đọc, `aria-expanded`, `aria-controls`, nhãn có trạng thái chưa đọc.
2. Bong bóng `.echo-bubble`: gõ chữ câu mới nhất (`useTypewriter`, tick `echo_voice`), bấm để mở khung, nút đóng 44 px; không tự tắt; lượt sau thay câu.
3. Khung `.echo-chat` (role dialog, không modal, không phủ tối): luồng tin (mới nhất ở dưới, tự cuộn xuống tin mới), nhãn "Lượt chạy #n" / "Gợi ý mức n", khu gợi ý ở cuối. Focus vào khung khi mở, trả focus về chỗ cũ (hoặc nút) khi đóng. Esc đóng (trừ khi Esc vừa hủy bước xác nhận gợi ý). `E` ngoài ô gõ chữ, không có dialog mở, ECHO đã thức → mở.
4. Vùng `.echo-live` (sr-only, `aria-live="polite"`) đọc mọi câu ECHO mới.
5. CSS: desktop neo góc dưới trái trên cột Nhiệm vụ (cột chừa chỗ cho nút ở đáy), khung rộng bằng cột, cao tối đa 60vh. 768–1199 px: cột Nhiệm vụ nằm dưới phải nên neo phải. < 768 px: nút góc dưới phải, tấm trượt từ dưới cao tối đa 70dvh, cột chừa đáy để cuộn nội dung ra khỏi nút. Giảm chuyển động: không trượt, không gõ, không nhiễu. Bỏ quy tắc `min-height` ECHO/hints cũ của cột trái.

## Risks
- Esc toàn cục xung đột với editor ("Esc rồi Tab để rời") và skip intro: Esc chỉ đóng khi focus trong khung hoặc khi focus không ở editor.
- Nút cố định có thể che nội dung cuối cột: chừa `padding-bottom`.

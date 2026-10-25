# Brainstorm: ECHO và gợi ý thành khung chat nổi

Ngày: 2026-10-25. Yêu cầu của người dùng: "Phần echo và gợi ý tôi nghĩ nên để ở dạng chat popup? Dành không gian cho nhiệm vụ và mục tiêu."

## Outcome

Cột trái của màn level chỉ còn **Nhiệm vụ** và **Mục tiêu**, đủ cao để đọc hết briefing và mọi mục tiêu ở 1280×800 mà không cuộn trong trường hợp thường. ECHO và Nhật ký gợi ý chuyển vào một **khung chat nổi** (ECHO là người nói), không mất thông tin nào và không làm ECHO "biến mất" khỏi trải nghiệm.

## Thiết kế đã chốt (main agent)

- **Nút ECHO nổi** ở góc dưới trái màn level (trên điện thoại: góc dưới phải, trên thanh tab, không che nút CHẠY). Hình là chân dung nhiễu sóng thu nhỏ có sẵn, kèm chấm báo khi có tin chưa đọc.
- **Bong bóng xem trước:** mỗi khi ECHO nói câu mới (câu `entry` sau intro, phản ứng sau mỗi lượt chạy), câu đó hiện thành bong bóng cạnh nút, gõ chữ như hiện nay, giữ nguyên cho tới khi người chơi đóng, mở khung chat, hoặc lượt chạy sau thay nó. Không tự biến mất theo thời gian (người mới đọc chậm). Âm `echo_voice` như cũ.
- **Khung chat** mở khi bấm nút hoặc bong bóng (phím tắt: `E` ngoài ô gõ chữ; Esc đóng; focus vào khung khi mở, trả focus khi đóng). Nội dung là **lịch sử hội thoại của level**: mọi câu ECHO đã nói trong phiên chơi, mới nhất ở dưới, kèm nhãn "Lượt chạy #n". Cuối khung là khu **Nhật ký gợi ý**: nút giải mã mức tiếp theo (giữ bước xác nhận hiện có), gợi ý đã mở hiện như tin nhắn ECHO trong luồng chat.
- **Khung chat là popover không chặn**: không phủ tối màn hình, không chặn editor, có thể để mở trong lúc sửa code. Trên desktop là một khung neo góc dưới trái (rộng khoảng cột trái, cao tối đa khoảng 60% màn hình, tự cuộn). Trên điện thoại là tấm trượt từ dưới lên, cao tối đa 70%, có nút đóng 44 px.
- **Hộp kết quả** vẫn hiện câu ECHO của lượt chạy như hiện nay.
- Intro level (mục 4.4 GDD) giữ thứ tự: briefing gõ chữ → mục tiêu khóa vào → thanh cảnh báo → ECHO "thức dậy" bằng bong bóng đầu tiên.
- Lịch sử chat chỉ sống trong phiên (không lưu); số gợi ý đã mở vẫn lưu như cũ qua `ProgressRepository`, và gợi ý đã mở hiện lại trong khung chat sau khi tải lại.
- Giảm chuyển động: bong bóng và khung hiện ngay, không gõ chữ, không trượt.

## Constraints

- Không đổi luật ECHO (mục 4.1), lời thoại, luật gợi ý, chấm điểm. Chỉ đổi bố cục và cách hiện.
- Trang không cuộn; mỗi ô tự cuộn; bàn phím và trình đọc màn hình dùng được (`aria-live` cho câu ECHO mới, `aria-expanded` cho nút).
- Không thư viện UI mới. Giữ phong cách cyberpunk hiện có (`tokens.css`).
- E2E: sửa spec có tham chiếu ô ECHO/gợi ý cũ, viết thêm nếu cần, **không chạy**.

## Non-goals

- Cho người chơi gõ câu hỏi với ECHO (ECHO chỉ nói theo kết quả chạy).
- Lưu lịch sử chat qua các lần tải trang.
- Đổi đoạn truyện (cutscene), bản đồ, màn tiêu đề.

## Acceptance criteria

1. Ở 1280×800, cả 4 level: cột trái chỉ có Nhiệm vụ và Mục tiêu; briefing và mọi mục tiêu đọc được (1.2 có 6 mục tiêu, 1.3 có 5).
2. Sau intro, bong bóng ECHO hiện câu `entry`; sau mỗi lượt chạy, bong bóng hiện câu phản ứng mới; chấm chưa đọc đúng.
3. Khung chat chứa đúng thứ tự mọi câu ECHO của phiên và gợi ý đã mở; mở gợi ý trong khung tăng `hintsOpened` như cũ; tải lại vẫn thấy gợi ý đã mở.
4. Khung mở không chặn gõ code và CHẠY; `E` mở, Esc đóng, focus đúng.
5. 360×740: nút ECHO không che CHẠY hay thanh tab; tấm trượt đóng mở được; không cuộn ngang.
6. Giảm chuyển động: không hoạt cảnh.
7. typecheck, `npm test`, build qua; test chỉ cho logic đáng giá (ví dụ reducer lịch sử chat và trạng thái chưa đọc), không test cho có.

# Brainstorm: Prototype Level 1.4 "Tín hiệu lệch pha"

Nguồn: `Ma_Cuoi_Cung_GDD.md` (v0.1). Ngày: 2026-10-24.

## Outcome

Một web app chạy hoàn toàn trên trình duyệt, chơi được trọn Level 1.4: đọc briefing, sửa code trong editor, chạy bằng Pyodide, xem gói dữ liệu đi qua máy quét, nhận sao (1–3) theo đặc tả mục 6 của GDD. Level được nạp từ file JSON để dùng lại engine cho các level sau. NPC ECHO phản ứng sau mỗi lần chạy và nói các gợi ý 3 mức.

## Constraints

- Chỉ có frontend. Python chạy bằng Pyodide, không có server chấm bài.
- Stack theo GDD mục 8: Next.js/React, Monaco hoặc CodeMirror, Canvas cho mô phỏng.
- Giọng điệu cyberpunk, nghiêm túc. Toàn bộ nội dung game viết bằng tiếng Việt.
- Lỗi Python thật phải hiện ra kèm bối cảnh game (GDD mục 4.2).

## Quyết định đã chốt

- **Chạy không giới hạn.** Bỏ cơ chế pin chặn lượt chạy. Số lần chạy chỉ hiển thị trong màn kết quả.
- **Nạp dữ liệu đầu vào bằng namespace.** Engine gán biến đầu vào (`tuoi`, `chieu_cao`, `cap_do`) vào namespace trước khi chạy code người chơi. Các dòng khóa chỉ để hiển thị và không cho sửa. Test thường và test phản công dùng chung cơ chế này. Schema JSON mục 7.1 được giữ, `locked_lines` nay chỉ dùng cho phần hiển thị.
- **NPC ECHO** là phần còn sót lại của một trợ lý lập trình cũ trong laptop offline của Kai. Module sinh code đã hỏng, nó chỉ đọc được code và đặt câu hỏi. ECHO thay "Nhật ký Kiến Trúc Sư" ở vai trò gợi ý. Nhật ký KTS chuyển thành mảnh cốt truyện để sưu tầm (ví dụ dòng log KTS-03 ở cuối màn).
  - Lớp 1, phản ứng: miễn phí, tự động sau mỗi lần chạy. Chỉ mô tả điều vừa xảy ra hoặc chỉ chỗ cần nhìn, không bao giờ nói cách sửa và không nhắc tên hàm cần dùng.
  - Lớp 2, gợi ý 3 mức: người chơi chủ động mở theo thứ tự. Nội dung lấy từ GDD mục 6.8, viết lại bằng giọng ECHO.
  - Giọng: cụt, lạnh, nhiễu ký tự, không đùa. Hiển thị bằng một ô chân dung nhiễu sóng ở cột trái, ngay trên mục gợi ý.
  - Dữ liệu: thêm trường `reactions` vào JSON level, ánh xạ loại kết quả (`entry`, `type_mismatch`, `TypeError`, `SyntaxError`, `ValueError`, `missing_var`, `wrong_value_counter`, `alert_exceeded`, `repeated_fail`, `timeout`, `two_stars`, `three_stars`) sang lời thoại. Engine phân loại kết quả chạy rồi chọn câu tương ứng.
- **Twist ECHO (đã chốt):** ECHO là bản thử nghiệm đầu tiên của OMNI, được giao mục tiêu "giúp con người tự làm được". Chi tiết này lộ ra cuối chương 6 và là hình mẫu cho lựa chọn "viết lại mục tiêu OMNI" ở kết thúc. Prototype 1.4 không lộ twist, nhưng giọng ECHO không được mâu thuẫn với nó.
- **Lưu tiến độ bằng `localStorage`**, đi qua một module lưu trữ duy nhất để sau này chuyển sang Supabase. Phần còn lại của app chỉ gọi module này, không gọi thẳng `localStorage`. Dữ liệu lưu theo từng level: code nháp, số sao cao nhất, số lần chạy, số gợi ý đã mở, thời điểm cập nhật. Key có số phiên bản schema. Mọi thao tác đọc/ghi đều bọc try/catch. Nếu trình duyệt chặn bộ nhớ, game vẫn chơi được nhưng không lưu.
- **Màn kết quả hiện số gợi ý đã mở**, cạnh số lần chạy, số câu lệnh và mức cảnh báo.
- **Đếm câu lệnh** bằng `sys.settrace` theo sự kiện `line` trên code người chơi. Ngưỡng cảnh báo tính theo `alert_limit_statements` của từng level, 100% ứng với `alert_limit_statements / 0.4`. Dòng khóa không bị tính.

## Non-goals

- Supabase, tài khoản, đồng bộ tiến độ giữa các thiết bị, bảng xếp hạng. Tiến độ chỉ lưu trên trình duyệt đang dùng.
- Số liệu cộng đồng thật. Màn kết quả không hiện số liệu giả.
- Các level khác, Boss, cơ chế ghép kill switch.
- Hệ thống điểm giải mã. Ở prototype, gợi ý 3 mức được mở theo thứ tự và chưa tính chi phí.

## Acceptance criteria

1. Chạy starter code gốc: code chạy không lỗi (`"27" * 100 + "3"` là nối chuỗi hợp lệ), gói `ma_xac_thuc` màu vàng phình to (201 ký tự), máy quét chuyển đỏ và báo sai kiểu cho từng biến. Không có traceback ở bước này.
1b. Khi code người chơi gây lỗi Python thật (ví dụ `int(tuoi) * 100 + cap_do` gây `TypeError`), traceback hiện trong bối cảnh game với số dòng khớp editor.
2. Lời giải mục 6.6 đạt 2 sao: đúng kiểu và giá trị (2703, 3.44, True), mức cảnh báo ≤ 40%, và không qua được test phản công vì `int("31.0")` gây `ValueError`.
3. Lời giải mục 6.7 đạt 3 sao.
4. Viết cứng `ma_xac_thuc = 2703` thì trượt test phản công.
5. Không sửa được các dòng khóa.
6. Thêm một level mới chỉ cần thêm file JSON, không phải sửa code engine.
7. Có test tự động cho phần chấm điểm (kiểu, giá trị, đếm lệnh, phản công) với các lời giải ở tiêu chí 2–4.
8. Sau mỗi lần chạy, ECHO nói đúng câu ứng với kết quả: code gốc thì báo sai kiểu, `int(tuoi) * 100 + cap_do` thì báo `TypeError`, ra `2703.0` thì báo đúng giá trị nhưng sai hình dạng, phản công thì báo `ValueError`, viết cứng thì báo sai giá trị. Phần phân loại kết quả có test tự động.
9. Không câu phản ứng miễn phí nào của ECHO chứa `int`, `float`, `round` hoặc đáp án.
10. Tải lại trang vẫn giữ code nháp, số sao cao nhất, số lần chạy và số gợi ý đã mở. Khi `localStorage` bị chặn, game vẫn chơi trọn màn.
11. Màn kết quả hiện số gợi ý đã mở.
12. Thanh Cảnh báo giữ ngưỡng 8 câu lệnh (40%) như GDD.

## Trade-offs

- Prototype một level (đã chọn) dựa trên giả định rằng một level đủ để kiểm chứng vòng chơi. Hướng này hỏng đầu tiên khi mô phỏng quá sơ sài nên không còn cảm giác game. Vì vậy mô phỏng máy quét không được cắt bỏ.
- Làm trọn Chương 1 phải đặc tả thêm 6 level trước khi code. Phần này được hoãn và sẽ dùng lại engine của prototype.

## Better approaches

- Pin chặn lượt chạy được thay bằng hình thức chỉ hiển thị số lần chạy (người dùng đã chấp nhận).

## Rủi ro chưa xử lý

- Pyodide tải khoảng 10 MB lần đầu. Cần màn hình tải mang bối cảnh game.
- Code người chơi chứa vòng lặp vô hạn có thể treo tab. Nên chạy Pyodide trong Web Worker để có thể ngắt.

- Phản ứng của ECHO có thể vô tình thành gợi ý trá hình, làm hệ thống gợi ý mất ý nghĩa. Cần duyệt lại lời thoại theo tiêu chí 9.

## Câu hỏi còn mở (để ở GDD, không chặn prototype)

- Khi chuyển sang Supabase: người chơi đã có tiến độ trong `localStorage` sẽ được gộp vào tài khoản ở lần đăng nhập đầu. Nếu dữ liệu hai bên khác nhau thì giữ số sao cao hơn.
- GDD cần cập nhật theo các quyết định ở đây: ECHO và twist của nó, bỏ cơ chế pin, sửa mục 6.5 (code gốc không gây lỗi).

- Boss cuối ghép "các hàm người chơi đã viết", nhưng hàm đến chương 4 mới được dạy. Chương 1–3 sẽ góp gì vào kill switch?

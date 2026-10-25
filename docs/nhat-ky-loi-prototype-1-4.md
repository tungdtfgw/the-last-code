# Nhật ký lỗi – Prototype Level 1.4

Các lỗi đã gặp khi thiết kế, làm và kiểm thử prototype Level 1.4 "Tín hiệu lệch pha" (24–25/10/2026). Mỗi mục ghi triệu chứng, nguyên nhân và cách đã xử lý, để tham chiếu khi làm các level sau.

Nguồn chi tiết: `plans/reports/cook-261024-2332-level-1-4-prototype.md`, `plans/261024-2332-level-1-4-prototype/edge-case-matrix.md`. Thiết kế: `Ma_Cuoi_Cung_GDD.md` (bản 0.2).

## 1. Lỗi trong tài liệu thiết kế

| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| GDD 6.5 nói code khởi đầu của 1.4 sẽ hiện traceback | `"27" * 100 + "3"` là phép nối chuỗi hợp lệ, Python không báo lỗi | Sửa GDD: máy quét từ chối vì sai kiểu, không có traceback. Traceback chỉ xuất hiện khi code lỗi thật, ví dụ `int(tuoi) * 100 + cap_do` |
| Test phản công mâu thuẫn với "dòng khóa" | Dữ liệu đầu vào gán cứng trong 3 dòng người chơi không được sửa | Engine nạp sẵn biến vào namespace; dòng khóa chỉ để hiển thị và được thay bằng dòng trống trước khi chạy (giữ đúng số dòng lỗi) |
| Bảng sao không nói rõ khi vượt 100% cảnh báo | GDD mục 4 nói "bị Sentinel bắt", bảng sao không nhắc | Chốt: vượt 100% → 0 sao, không chạy phản công. Sao cộng dồn |
| Boss cuối ghép "các hàm đã viết" nhưng hàm đến chương 4 mới dạy | Thiếu nhất quán trong cấu trúc chương | Chưa xử lý, ghi là câu hỏi mở trong GDD mục 3 |
| Bản nháp lời thoại ECHO dễ thành gợi ý trá hình | Câu phản ứng nhắc tên hàm hoặc trích thông báo lỗi chứa `int` | Luật: phản ứng miễn phí không chứa `int`, `float`, `round` hay đáp án; có test tự động kiểm |

## 2. Lỗi engine chạy Python

| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| Lời giải đúng viết trên nhiều dòng bị tính thừa câu lệnh, có thể mất sao | Đếm theo dòng thay vì theo câu lệnh | Đếm theo câu lệnh |
| Code người chơi sửa module dùng chung `math`/`json` làm hỏng việc chấm ở các lần chạy sau | Harness và người chơi dùng chung module | Harness giữ bản riêng của các module này |
| Vòng lặp vô hạn bọc trong `except:` trống chỉ bị cắt sau 5 giây | CPython gỡ trace function sau khi nó ném ngoại lệ, nên ngân sách câu lệnh mất tác dụng | Chèn guard vào AST ở đầu thân vòng lặp, `except`, `finally`, bộ lọc comprehension; người chơi không truy cập được guard. Giờ bị cắt dưới 1 giây |
| Code chỉ treo ở lượt OMNI phản công làm mất cả 2 sao đã có | Lượt cơ bản và phản công dùng chung một đồng hồ 5 giây | Tách thành hai lượt, mỗi lượt một đồng hồ; treo ở phản công thì giữ sao lượt cơ bản, có câu ECHO và dòng terminal riêng |
| Lỗi crash để game kẹt ở trạng thái "đang chạy" | Thiếu xử lý khi worker chết | Phục hồi trạng thái và khởi động lại worker |
| Đệ quy sâu làm traceback quá dài | Không giới hạn độ dài truy vết | Chỉ giữ các khung ngoài cùng và trong cùng |
| Lộ tên lớp lỗi nội bộ cho người chơi | Thông báo lỗi engine đi thẳng ra giao diện | Ẩn và thay bằng thông báo trong bối cảnh |
| Ngưỡng cảnh báo lệch với giới hạn lẻ | Làm tròn số thực | Tính bằng số nguyên |

## 3. Lỗi giao diện và lưu trữ

| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| Bản nháp quá lớn xóa mất bản nháp đã lưu | Bản nháp không hợp lệ vẫn ghi đè bản cũ | Bản nháp quá 50.000 ký tự không bao giờ thay bản hợp lệ; người chơi được cảnh báo một lần. Mọi thao tác đọc/ghi `localStorage` đều được bọc lỗi |
| Không hoàn tác được sau khi khôi phục code gốc | Thao tác khôi phục bị cơ chế khóa dòng chặn | Khôi phục bằng cách dựng lại editor (lịch sử hoàn tác cũng được xóa) |
| Terminal ngừng đọc cho trình đọc màn hình sau 120 dòng | Khóa phần tử thay đổi khi cắt bớt dòng | Dùng id ổn định |
| Mất focus bàn phím khi bấm Chạy | Nút bị `disabled` trong lúc chạy | Dùng `aria-disabled` |
| Trên điện thoại, lỗi tải Python bị ẩn | Lỗi nằm ở tab Mô phỏng trong khi đang mở tab khác | Tự chuyển sang tab Mô phỏng khi tải lỗi |
| Trên điện thoại, mất focus khi đổi tab trong lúc chạy và khi đóng hộp kết quả | Tab Mã bị ẩn nên nút Chạy không nhận focus | Trả focus về nút Chạy sau khi tab Mã hiện lại |
| Khi bỏ qua hiệu ứng mở đầu, có một khung hình thanh cảnh báo đã hiện mà mục tiêu chưa hiện | Số mục tiêu hiện được cập nhật qua effect, chậm một nhịp render | Tính thẳng trong lúc render |
| Trên điện thoại, chạm tab "Nhiệm vụ" làm mất hiệu ứng mở đầu | Mọi cú chạm đều bị coi là bỏ qua | Bỏ qua thanh tab |
| Gõ phím ngay sau khi bấm "VÀO NHIỆM VỤ" không bỏ qua được hiệu ứng | Hiệu ứng chỉ bắt đầu sau khi chờ mở khóa âm thanh xong | Bắt đầu hiệu ứng ngay; âm thanh đã được mở khóa từ lúc nhấn chuột xuống |

## 4. Lỗi âm thanh

| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| Tiếng nhận sao (và tiếng thứ hai trong cùng khung hình) bị cắt khi hiệu ứng kết thúc | Âm thanh hẹn giờ bằng timer JavaScript, bị hủy khi giao diện render lại | Hẹn giờ trên đồng hồ của AudioContext |
| Không phát được âm thanh lúc mới vào màn | Trình duyệt cấm phát âm thanh trước thao tác đầu tiên của người dùng | Thêm màn "VÀO NHIỆM VỤ"; cú bấm này mở khóa âm thanh |

## 5. Vấn đề môi trường kiểm thử

| Vấn đề | Ảnh hưởng | Xử lý |
|---|---|---|
| Playwright WebKit (bản 2370, 2380) bị segfault khi khởi động trên macOS 26.0, kể cả ngoài sandbox | Không chạy được test WebKit/iPhone | Dự án `webkit`, `mobile-webkit` để sau cờ `E2E_WEBKIT=1`. Người dùng chốt chỉ cần Chrome cho prototype |
| Safari thật cần bật "Allow remote automation" | Không tự động chạy được `npm run test:safari` | Đây là thiết lập bảo mật, chỉ chủ máy tự bật |
| Máy không có runtime iOS Simulator | Không kiểm được iOS | Ghi là chưa kiểm |
| Giả lập Android user agent làm CodeMirror dùng chế độ bàn phím Android, phím Enter không xuống dòng trong Playwright | Test giả lập điện thoại thất bại không phải do game | Dự án `mobile-chromium` dùng user agent desktop, vẫn giữ màn hình và cảm ứng điện thoại |
| Editor bị cuộn ngang che đầu dòng dưới cột số dòng | Helper test gõ sai vị trí | Sửa helper: cuộn về đầu trước khi gõ |
| Thao tác chụp màn hình của công cụ điều khiển Chrome gửi sự kiện chuột vào trang | Hiệu ứng mở đầu bị bỏ qua khi chụp màn hình giữa chừng | Kiểm hiệu ứng bằng bộ ghi âm thanh và test tự động, không chụp màn hình giữa chừng |
| Sau khi game mở ở tab "Nhiệm vụ" trên điện thoại, test âm thanh tìm nút tắt tiếng ở tab "Mã" đang ẩn | Test thất bại, game không lỗi | Đổi thứ tự trong test: chuyển tab rồi mới kiểm nút |

## 6. Giới hạn còn lại (chưa phải lỗi)

- Code treo bên trong mã C của Python ở **lượt cơ bản** vẫn chờ đủ 5 giây và nhận 0 sao, vì lúc đó chưa có kết quả nào để giữ.
- Sandbox chỉ chặn ở mức import; người chơi thành thạo có thể lách để tự gian lận. Bảng xếp hạng sau này cần chấm phía server.
- Chưa kiểm Safari/iOS và bàn phím Android thật.
- Mỗi lần vào level đều qua màn "VÀO NHIỆM VỤ" và hiệu ứng mở đầu (bỏ qua được bằng một phím).

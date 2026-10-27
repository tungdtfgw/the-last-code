# Brainstorm: Level 1.6 "Đối thoại với Cổng" (`input()`, f-string)

Ngày: 2026-10-28. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-1/gdd-1.6-doi-thoai-voi-cong.md`. Hợp đồng engine: `docs/hop-dong-engine-level-1-5-den-1-7.md` (mục 1, 3, 4).
Nguồn đã đọc: như brainstorm 1.5, thêm `src/engine/python/harness.py` (`_no_input`, `_run_one`, `run_level`), `tests/python/test_harness.py` (test `input_unsupported`), `src/game/echo-reactions.ts`, `src/content/text-fields.ts`, `tests/integration/knowledge-summary.test.ts`.

## Hiện trạng (đã kiểm)

- Harness thay `input` bằng `_no_input` → trạng thái `input_unsupported` (có test Python). Không có kênh nhập.
- Mục tiêu đầu ra (`output_line`, `expected_output`, luật khớp NFC) đã có từ 1.1, hợp đồng 1.1–1.3 mục 4 ghi rõ "dùng lại cho 1.6".
- `output_is_label` bắt được dòng in chứa nguyên tên biến đầu vào: `print("DANH TINH: {ho_ten}")` rơi đúng vào khóa này.
- Tổng kết kiến thức chạy `code` bằng `python3` không có đầu vào chuẩn; một ví dụ có `input()` sẽ vỡ `EOFError`.
- Thử bằng `python3` 3.13: `"4172" + 7` → `TypeError: can only concatenate str (not "int") to str`; `input()` khi hết dữ liệu → `EOFError: EOF when reading a line`; với stdin không phải bàn phím, lời nhắc của `input("…")` ghi ra stdout, không xuống dòng.

## Outcome

Người chơi trả lời Trạm Thẩm Vấn bằng chương trình đọc hai dòng trạm gửi qua `input()` và in ba dòng trả lời dựng bằng f-string. Họ rời màn biết: `input()` đọc đúng một dòng, theo thứ tự, và luôn trả về chữ; muốn tính thì đổi hình dạng trước; f-string đặt biến và biểu thức vào chữ; thiếu `f` thì ngoặc nhọn được in nguyên; lời nhắc của `input()` cũng là đầu ra. Phản công đổi câu hỏi, nên ai viết cứng câu trả lời hoặc không đọc dòng thứ hai sẽ trượt.

## Constraints

- Trục truyện 6.5 và đoạn Còn tiếp: trạm hỏi, trả lời đúng từng ký tự; thành phần Lời đáp xác thực; móc sang Boss (Nhi trực ca đêm, 0xA7 chờ ở cổng).
- Thay đổi engine nhỏ nhất, chỉ thư viện chuẩn, giữ nguyên hành vi `input_unsupported` cho 1.1–1.5.
- Đếm câu lệnh, dòng khóa, luật sao không đổi.
- Câu chữ chỉ ở D1.

## Non-goals

- Vòng lặp đọc nhiều dòng, `split()`, phương thức chuỗi (chương 3, 6).
- Định dạng trong f-string (`:.2f`, `:03d`).
- Nhập liệu tương tác thật (người chơi gõ khi chương trình đang chạy): mọi lượt chạy vẫn phát lại sau khi có kết quả.

## Acceptance criteria

1. Harness: test có `stdin` thì `input()` đọc lần lượt; lời nhắc ra stdout; hết dòng thì `EOFError` đúng thông báo CPython; trả `stdin_read`, `prompts`. Level không có `stdin` vẫn `input_unsupported`. Có unittest cho từng ý.
2. Validator: `stdin` tất cả hoặc không; dòng không chứa xuống dòng; giới hạn số dòng và độ dài.
3. Code khởi đầu: lượt 1 ra `TypeError` ở dòng 8, báo cáo đầu ra có dòng 1 lệch vị trí 12.
4. Thiếu `f` → `output_is_label`; có lời nhắc → `output_has_prompt`; đọc thừa → `EOFError`.
5. Lời giải 2 sao trượt phản công với `wrong_value_counter` ở dòng 3; lời giải 3 sao (f-string, và `print` với dấu phẩy) đạt 3 sao, 5 câu lệnh.
6. Ví dụ tổng kết có `stdin` chạy đúng bằng `python3`.
7. Từ cấm, `interrogation-timeline.test.ts`, migration `0006`, typecheck, test, test:py, build qua; e2e được viết.

## Các lựa chọn đã so sánh

### A. Lời nhắc của `input("…")` đi đâu

1. **Ra stdout và bị chấm, như Python thật (chọn).** Không có đường riêng nào; khóa tùy chọn `output_has_prompt` cho ECHO nói đúng chuyện. Giả định chịu lực: người chơi đọc được dòng `nhận:` có lời nhắc dính phía trước. Hỏng đầu tiên với người chơi quen viết lời nhắc lịch sự: họ trượt dòng 1 dù "logic đúng". Đó chính là điều cần học: ở Python thật, lời nhắc cũng là chữ in ra.
2. **Ra một kênh riêng, không chấm.** Dễ chịu hơn. Giả định: người chơi không mang mô hình sai ra ngoài game. Hỏng đầu tiên khi họ chạy cùng mã ở terminal thật hoặc ở một bài chấm stdout tự động: lời nhắc xuất hiện và bài bị chấm sai, mà game đã dạy điều ngược lại.
3. **Cấm tham số lời nhắc.** Hỏng ở tính công bằng: một lệnh Python hợp lệ bị chặn bằng luật riêng của game.

### B. `input()` lấy dữ liệu từ đâu

1. **Trường `stdin` trong mỗi test (chọn).** Phản công đổi `stdin` như đổi `inputs`. Giả định: dữ liệu nhập là một danh sách dòng cố định cho mỗi test. Hỏng đầu tiên nếu một level sau cần câu hỏi phụ thuộc câu trả lời trước (hội thoại thật); khi đó cần một tiến trình tương tác, ngoài phạm vi Chương 1.
2. **Dùng lại `inputs` (namespace) và giả lập `input()` đọc theo tên.** Không cần trường mới, nhưng thứ tự đọc mất ý nghĩa và bài "mỗi lần một dòng" không còn.

### C. Mô phỏng

1. **Dùng lại `relay` với `station: "TTV"`.** Rẻ, danh sách dòng có sẵn. Hỏng ở hình ảnh: ăng-ten phát vào Mạng Mù, không có câu hỏi nào; người chơi không thấy chương trình đã đọc mấy dòng.
2. **Loại mới `interrogation` dùng chung danh sách dòng với relay (chọn).** Thẻ câu hỏi đã đọc / chưa đọc theo `stdin_read`. Chi phí: tách danh sách dòng dùng chung (cũng phục vụ 1.7).

## Trade-offs

- A1 đổi sự dễ chịu lấy mô hình đúng của Python; giảm sốc bằng `task_steps` bước 3, gợi ý 3 và câu `output_has_prompt`.
- B1 thêm một trường `TestCase` và hai trường kết quả harness; đổi lại 1.7 dùng lại nguyên vẹn.
- f-string không bắt buộc (`print` với dấu phẩy cũng đạt): chấm theo đầu ra như 1.1. Bài f-string đến từ code khởi đầu, gợi ý và tổng kết.

## Better approaches

Hợp đồng 1.1–1.3 mục 4 đã định 1.6 dùng lại mục tiêu đầu ra; hướng chọn giữ đúng điều đó và chỉ thêm kênh nhập. Cải tiến so với đề bài: tách dữ liệu hồ sơ (namespace, dòng khóa) khỏi dữ liệu câu hỏi (kênh nhập), để người chơi thấy hai nguồn dữ liệu khác nhau và dòng khóa vẫn giữ vai trò như 1.1–1.5. Bằng chứng: `_run_one` đã nạp `inputs` vào namespace trước `exec`; kênh nhập là một hàm thay `_no_input`, khoảng hai mươi dòng.

## Hướng đã chọn

- Dòng khóa: `ho_ten = "ĐỖ MINH AN"`, `so_khu = 7`. Kênh nhập: `["4172", "DEM"]`, phản công `["9035", "SANG"]`.
- Ba mục tiêu đầu ra: `DANH TINH: …`, `MA DAP: …`, `CA … DA DUYET`. Ngưỡng 5 câu lệnh.
- Lỗi cài sẵn: thiếu `f`, cộng chữ với số, dòng ca viết cứng.
- Khóa mới (tùy chọn, chung): `EOFError`, `output_has_prompt`. Dùng lại `output_is_label`.
- Mô phỏng `interrogation`; mảnh nhật ký KTS-01 (mảnh thứ hai).

## Rủi ro

- Người chơi gõ `print(f"MA DAP: {int(input()) + so_khu}")` và đọc `ca` sau: vẫn đúng, ít câu lệnh hơn; chấp nhận.
- `stdin` thêm vào mọi chỗ hiển thị test (terminal, phản công); thiếu một chỗ là người chơi không thấy dữ liệu mới. Hạ tầng H4 phải phủ.
- Thẻ "ĐÃ ĐỌC" dựa trên `stdin_read`; nếu chương trình lỗi trước khi đọc, thẻ phải hiện "CHƯA ĐỌC" chứ không ẩn.

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Lời nhắc của `input()` ra stdout và bị chấm (A1).
2. `so_khu` là số nguyên 7 (khớp mã khu K-07 của 1.2), tách khỏi chuỗi `"K-07"` để không cần cắt chuỗi.
3. Tên ca `DEM` ở lượt cơ bản là manh mối nối sang ca đêm của Nhi; phản công dùng `SANG`.
4. Mảnh nhật ký 1.6 là mảnh thứ hai của KTS-01.
5. f-string không bắt buộc trong luật chấm.

# Brainstorm: Level 2.4 "Thang báo động" (`elif`, thứ tự nhánh)

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.4-thang-bao-dong.md`. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md` (mục 2, 3, 4, 5, 6). Khung chương: `design/gdd-chuong-2.md` mục 6.4.
Nguồn đã đọc: như brainstorm 2.3 (`design/quyet-dinh/level-2-3-hai-nga.md`).

## Hiện trạng (đã kiểm)

- Đếm câu lệnh: dòng `if` 1, mỗi dòng `elif` được tới 1, `else:` 0 (hợp đồng mục 3; đo lại khớp: chuỗi `print` trong nhánh cho 2/3/4/4).
- `output_is_label` chỉ bắt tên đầu vào và tên mục tiêu. Với `print("MUC: {muc}")`, `muc` không thuộc hai loại đó nên khóa là `output_mismatch`.
- Lời báo `SyntaxError` khi `elif` đứng sau `else` khác nhau: 3.13 "invalid syntax", 3.14 (Pyodide) "'elif' block follows an 'else' block". Khóa và dòng giống nhau.
- Đã đo 25 mã bằng `run_level` thật trên python3 3.13.2 và 3.14.8.

## Outcome

Người chơi đoán trước mức báo động của Tháp Đèn Pha bằng một chuỗi `if/elif/elif/else` bốn mức. Họ rời màn biết chỉ nhánh đúng đầu tiên chạy, thứ tự nhánh quyết định kết quả, các `if` rời khác chuỗi `elif`, và điểm bằng nhau ở mốc thuộc mức nào.

## Constraints

- Như 2.3: hợp đồng engine thắng; ngưỡng không phạt lối "gán biến rồi in một lần" nếu vẫn phân biệt được lối sai màn muốn dạy (báo cáo validate gợi ý nâng lên 5); câu chữ chỉ ở D1.
- Nhánh dài nhất phải có ở lượt cơ bản (hợp đồng mục 3).

## Non-goals

- Ghép khoảng bằng `and` (2.5), điều kiện lồng (2.6).
- Thêm mức thứ năm hay số thực.

## Acceptance criteria

1. Code khởi đầu: `wrong_branch` ở tình huống 1.
2. Xếp đúng thứ tự nhưng còn `<= 50`: 2 sao, `wrong_branch` ở phản công 50 m. Sửa nốt: 3 sao.
3. Lời giải `print` trong nhánh (4 câu) và lời giải gán rồi in (5 câu) đều 3 sao.
4. Các `if` rời gán đè (8 câu) và gán mặc định rồi chuỗi `elif` không `else` (6 câu) chỉ 1 sao. Không đột biến nào 3 sao.
5. Câu ECHO sạch từ cấm, tên mức, mốc.

## Các lựa chọn đã so sánh

### A. Ngưỡng

1. **4, theo phác thảo.** Bằng lời giải `print` trong nhánh. Giả định chịu lực: người chơi in trong từng nhánh. Hỏng đầu tiên với lối gán rồi in (5 câu): viết sạch mà chỉ 1 sao, trái điều chỉnh 1.
2. **5 (chọn).** Bằng lối gán rồi in. Các `if` rời gán đè vẫn tới 8, gán mặc định rồi `elif` không `else` tới 6: cả hai 1 sao. Giả định chịu lực: lối sai người chơi hay viết ở màn này là các `if` rời gán đè, không phải các `if` rời có khoảng. Hỏng đầu tiên với người đã biết `and`: bốn `if` rời có khoảng (`>= 20 and < 50`) tốn đúng 5 câu, được 3 sao.
3. **Đổi quyết định thành biến `muc` (không in) như 2.3, ngưỡng 4.** Khi đó chuỗi `elif` gán tốn tối đa 4, bốn `if` rời có khoảng 5: phân biệt được hết. Hỏng ở chỗ khác: lệch phác thảo nhiều hơn (mất dòng in `MUC: …`), và lối `print` trong nhánh không còn; 2.5–2.7 quay lại dòng in nên người chơi đổi kiểu mục tiêu hai lần liền.

### B. Lỗi cài sẵn

1. **Chỉ thang ngược (phác thảo).** Một lượt sửa là xong cả 3 sao; mỏng cho một màn Medium, và không có nấc 2 sao tự nhiên.
2. **Thang ngược cộng `<=` ở mốc 50 (chọn).** Lượt cơ bản dạy thứ tự; lượt phản công dạy điểm bằng nhau, nối lại 2.1. Tiền lệ: dòng ca viết cứng của 1.6 cũng chỉ lộ ở phản công. Giả định chịu lực: người chơi đọc kỹ thấy `<=` lạc giữa ba dấu `<`. Hỏng nếu người chơi chỉ chép lại nhánh mà không đọc; khi đó họ dừng ở 2 sao và câu `wrong_branch` ở phản công cùng gợi ý 2 ("dưới 50 nghĩa là đúng 50 thì chưa thuộc") dẫn họ tới chỗ sửa.

### C. Biên ở đâu

1. **Ba biên ở phản công (chọn, theo phác thảo).** Khái niệm chính là thứ tự nhánh, và thứ tự sai đã lộ ở lượt cơ bản. `<` hay `<=` là khái niệm của 2.1, làm nấc 2 sao/3 sao.
2. **Đưa một biên vào lượt cơ bản.** Lỗi `<=` khi đó lộ ngay, màn không còn nấc 2 sao tự nhiên; viết cứng từng giá trị cũng chỉ còn qua nhờ phản công.

## Trade-offs

- A2 đổi một kẽ hở (bốn `if` rời có khoảng bằng `and` được 3 sao) lấy việc không phạt lối gán rồi in. Lối có khoảng chạy đúng mọi khoảng cách và cần kiến thức của 2.5; tổng kết chỉ ra vì sao chuỗi `elif` gọn hơn.
- B2 làm màn dài thêm một lượt sửa, đúng độ khó Medium.
- C1 để viết cứng từng giá trị (`== 10`, `== 35`, `== 75`) được 2 sao, mức tối đa hợp đồng cho phép.

## Better approaches

Better approaches: none — hướng đã chọn là hướng phác thảo đề xuất với ngưỡng nâng theo báo cáo validate (bằng chứng: GDD mục 8.3, lối gán rồi in đo được 5 câu, các `if` rời gán đè 8 câu). Lựa chọn A3 phân biệt chặt hơn nhưng lệch phác thảo và làm kiểu mục tiêu đổi qua lại giữa các màn.

## Hướng đã chọn

- Đầu vào khóa `khoang_cach` (int). Một dòng in `MUC: …`, `decision: {"line": 1}`.
- Code khởi đầu: thang xếp ngược, `<=` ở mốc 50.
- Cơ bản 10, 35, 75, 150; phản công 20, 50, 100, 0. `alert_limit_statements` 5.
- Khóa cần câu: các khóa chung theo khuôn 1.6, cộng `wrong_branch`, `output_extra`, `NameError`; biến thể cho `wrong_branch`, `output_extra`, `alert_exceeded`.
- Truyện: KTS-02 (mảnh thứ hai), luật Thang báo động, ngưỡng tái định hướng 60% của Nhi.

## Rủi ro

- Người chơi dừng ở 2 sao mà không hiểu vì sao: phản công trượt ở 50 m, mô phỏng hiện cần/nhận, gợi ý 2 nói về "dưới".
- Nhịp truyện về Nhi nặng; ECHO dễ lỡ sang an ủi. Luật ECHO chương 2 cấm, GDD nhắc lại ở mục 14.
- Từ cấm nhiều (tên bốn mức, ba mốc, `0`): câu ECHO khó viết hơn. Câu chung được dựa vào chỗ giữ `{count}`, `{round}`, `{col}`.

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Ngưỡng 5 (A2), chấp nhận bốn `if` rời có khoảng được 3 sao.
2. Lỗi cài sẵn thứ hai `<=` ở mốc 50, chỉ lộ ở phản công.
3. Viết cứng từng giá trị được 2 sao; viết cứng thẳng 0 sao.
4. Nhịp kai trong `outro_beats` có `hold_ms` 1500 để câu về Nhi đứng lâu hơn.

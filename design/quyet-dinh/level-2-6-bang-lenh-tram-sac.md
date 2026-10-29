# Brainstorm: Level 2.6 "Bảng lệnh trạm sạc" (điều kiện lồng nhau, chuỗi rỗng)

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi chỗ cần hỏi đã tự chốt, liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.6-bang-lenh-tram-sac.md`. Khung: `design/gdd-chuong-2.md` mục 6.6. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md`; kênh nhập: `docs/hop-dong-engine-level-1-5-den-1-7.md`.
Nguồn đã đọc: như brainstorm 2.5 (`design/quyet-dinh/level-2-5-nga-tu-tuan-tra.md`), thêm `design/quyet-dinh/level-1-6-doi-thoai-voi-cong.md`, `checkStdin` trong `validate-level.ts`, `_stdin_input` và `_statement_lines` trong harness, `use-game.ts`, `game-screen.tsx` (chỗ đọc `locked_lines[0]`).

## Hiện trạng (đã kiểm)

- Kênh nhập `stdin` có sẵn từ 1.6: `input()` trả nguyên văn dòng, kể cả `""` và `" "`; `checkStdin` không cắt khoảng trắng, nhận dòng rỗng. Lời nhắc đi ra stdout và bị chấm; khóa `output_has_prompt`, `EOFError` dùng lại được.
- `_statement_lines` tính cả dòng `elif` (là một nút `If`), nên `skipped_lines` sẽ liệt kê dòng `elif` không được tới.
- `inputs: []` và `locked_lines: []` qua validator; hai chỗ đọc `locked_lines[0]` có đường lùi `?? 1`. Chưa level nào chạy thật với không dòng khóa.
- Kiểm câu chữ điền `{count}` bằng 12 trước khi so từ cấm.

## Outcome

Người chơi đọc bảng lệnh qua kênh nhập và viết quyết định hai tầng: tầng ngoài hỏi ô lệnh có chữ không, mỗi nhánh có câu hỏi riêng của nó. Họ rời màn biết: một `if` đặt được trong khối của `if` khác; `else` thuộc về `if` cùng mức thụt lề; dòng trống đọc vào là `""`, Python coi `""` là sai, nên `if ma_lenh:` đọc như "nếu có lệnh"; một dấu cách vẫn là có chữ.

## Constraints

- Trục truyện 6.6: Trạm Sạc Drone, luật "Đọc bảng lệnh" (ô 6/6), mảnh KTS-0█ không có chi tiết nhận dạng, nhịp đợt quét lớn dời sớm.
- Chấm theo hành vi: lời giải phẳng dùng `and` cũng được 3 sao (`design/quyet-dinh/cot-truyen-chuong-2.md`, câu tự chốt 8). Chuỗi rỗng chỉ dạy, không chấm riêng `if ma_lenh:` với `if ma_lenh != "":` (câu 9).
- Ngưỡng không phạt "gán biến rồi in một lần" (validate mục 1).
- Không sửa file dùng chung.

## Non-goals

- Cắt khoảng trắng (`strip`), phương thức chuỗi (chương 6).
- Giá trị đúng/sai ngầm của số, `None`.
- Ép người chơi viết lồng nhau bằng ngưỡng.

## Acceptance criteria

Mục 15 của GDD màn.

## Các lựa chọn đã so sánh

### A. Ngưỡng cảnh báo

1. **5 câu (phác).** Bằng lời giải lồng in thẳng. Hỏng với lời giải lồng gán rồi in (6 câu, 1 sao), trái luật validate.
2. **6 câu (chọn).** Bằng kiểu "gán rồi in" lồng nhau. Vẫn phạt các `if` rời in thẳng (7 câu ở mọi tình huống). Giả định chịu lực: lối viết cần tránh ở màn này là các `if` rời, không phải chuỗi phẳng dùng `and` (được phép). Hỏng đầu tiên với kiểu "gán mặc định rồi `if/elif`" (7 câu ở tình huống 2, 1 sao); xem rủi ro.
3. **7 câu.** Không phạt gì; các `if` rời in thẳng cũng 3 sao, thanh cảnh báo mất ý nghĩa ở màn này.

### B. Lời nhắc của `input()`

1. **`input()` không đối số trong code khởi đầu, có câu cho `output_has_prompt` (chọn).** Giữ đúng mô hình Python đã dạy ở 1.6; người chơi tự thêm lời nhắc thì ECHO nói đúng chuyện.
2. **Code khởi đầu có lời nhắc, dòng mong đợi gồm cả lời nhắc.** Dòng in thành `Ma lenh: Pin: LENH: NAP`, khó đọc ở chip của Kai, và lệch khuôn `LENH: …` của cả chương.

### C. Dòng khóa

1. **Không có dòng khóa (chọn).** Mọi dữ liệu đến từ bảng lệnh, khớp truyện. Giả định: giao diện chạy được với `inputs: []`. Hỏng đầu tiên nếu một chỗ UI chưa có đường lùi; e2e của màn phải phủ.
2. **Khóa ngưỡng pin `nguong_pin = 30`, phản công đổi ngưỡng.** Bắt được viết cứng 30, nhưng thêm một khái niệm (so với biến) không phải của màn, thêm số phải cấm.

### D. Phản công 3 `[" ", "10"]`

1. **Giữ (chọn).** Bắt lời giải liệt kê mã lệnh đã thấy (`"XUAT KICH"`, `"VE TRAM"`) thay vì hỏi có lệnh hay không: đúng sai lầm mà màn muốn sửa. Đồng thời là ví dụ "một dấu cách vẫn là có chữ" của tổng kết.
2. **Thay bằng một mã lệnh lạ có chữ (`"DO THAM"`).** Cũng bắt lời giải liệt kê, nhưng mất chỗ nối với bài chuỗi rỗng. Chọn D1 vì `ma_lenh.strip()` (bị D1 làm trượt) nằm ngoài phạm vi màn và hiếm ở người mới.

## Trade-offs

- A2 đổi việc phạt "gán mặc định rồi `if/elif`" lấy việc giữ ý nghĩa thanh cảnh báo. Lối đó cũng bị phạt ở 2.3, 2.5.
- B1 đổi một chỗ dễ vấp (lời nhắc) lấy mô hình Python đúng, như 1.6.
- C1 đổi một lần dùng đường code chưa chạy thật lấy cảnh khớp truyện; rủi ro được giao cho e2e của màn.
- D1 đổi việc trượt của người dùng `strip()` (2 sao) lấy việc bắt lời giải liệt kê và nối với bài chuỗi rỗng.

## Better approaches

Phác giữ ngưỡng 5. Hướng tốt hơn là 6: bảng đo (mục 8.3 GDD) cho lời giải lồng gán rồi in đúng 6 câu, các `if` rời 7 câu; ngưỡng 6 là mức duy nhất vừa không phạt code sạch vừa phạt các `if` rời. Chi phí chuyển: một số trong JSON và một dòng trong bảng khung chương.

## Hướng đã chọn

- Kênh nhập 2 dòng: mã lệnh (có thể `""`), mức pin. Một dòng in `LENH: NAP` / `LENH: CHO` / `LENH: DI`.
- Code khởi đầu: đọc pin chưa đổi kiểu, chuỗi phẳng xét pin trước. Lượt 1 `TypeError`, lượt 2 `wrong_branch` ở tình huống 4.
- Test cơ bản `["XUAT KICH","80"]`, `["","12"]`, `["","75"]`, `["VE TRAM","5"]`; phản công `["","30"]`, `["XUAT KICH","3"]`, `[" ","10"]`.
- Ngưỡng 6 (100% = 15). Lời giải 3 sao 5 câu.
- Khóa tùy chọn có câu: `wrong_branch`, `EOFError`, `output_has_prompt`. Không dùng `output_is_label` (không có tên đầu vào hay mục tiêu biến nào để nhận ra).
- `scene` `tram-sentinel` tới khi có `tram-sac`.

## Rủi ro

- **Gán mặc định rồi `if/elif` chỉ 1 sao** (7 câu ở tình huống 2). Câu `alert_exceeded` nói có câu hỏi không cần hỏi ở mọi tình huống; gợi ý 2 dạy hai tầng.
- **Lời giải phẳng với `and` được 3 sao**, nên người chơi có thể qua màn mà không viết lồng. Đã chốt ở khung chương; tổng kết và gợi ý 3 dạy lồng. Nếu playtest thấy phần lớn người chơi né lồng, thêm một tầng thứ ba vào luật ở bản sau.
- **Level đầu tiên không có dòng khóa.** E2e của màn phải kiểm editor, nút đặt lại code và bảng cảm biến; nếu hỏng, đó là việc của hạ tầng (báo phase I), không sửa trong nhánh màn.
- **Dòng `""` và `" "` trên bảng cảm biến** dễ hiện thành ô trống giống nhau. Bảng biên trong GDD (mục 5) đòi hiện khác nhau; đề xuất cho H6 ở báo cáo.
- **Số mẫu 12 của kiểm câu chữ** trùng dữ liệu tình huống 2; đã bỏ `"12"` khỏi `forbidden_terms` và đề xuất đổi số mẫu.

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Ngưỡng 6 (không phải 5 như phác).
2. `input()` không lời nhắc; `output_has_prompt` có câu.
3. Không có dòng khóa nào.
4. Giữ phản công `[" ", "10"]`; người dùng `strip()` chỉ được 2 sao.
5. Không cấm `"12"`, `"5"`, `"3"`, `pin`, `input`.
6. Lời giải phẳng dùng `and` được 3 sao (theo khung chương).

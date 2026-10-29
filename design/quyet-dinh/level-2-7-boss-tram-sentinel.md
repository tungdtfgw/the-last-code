# Brainstorm: Level 2.7 BOSS "Trạm Sentinel"

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi chỗ cần hỏi đã tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.7-boss-tram-sentinel.md`. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md` (mục 2, 3, 4, 5, 6). Khung chương: `design/gdd-chuong-2.md` mục 6.7, 8.
Nguồn đã đọc: hợp đồng engine Chương 2, `design/gdd-chuong-2.md`, `design/quyet-dinh/cot-truyen-chuong-2.md`, `plans/reports/validate-261030-0152-chuong-2-khung.md`, GDD và brainstorm 1.7, `src/levels/level-1-7.json`, `db/migrations/0007_content_level_1_7.sql`, `src/game/classify-run.ts`, `compute-stars.ts`, `alert.ts`, `build-config.ts`, `prepare-source.ts`, `validate-level.ts`, `src/engine/python/harness.py`, `tests/integration/run-harness.ts`, `level-1-7.test.ts`, `src/story/story-types.ts`, `scene-catalog.ts`, báo cáo review chương 1 (28/10).

## Hiện trạng (đã kiểm)

- Số câu của một lượt là số lớn nhất trên các test cơ bản; phản công không tính. Bị bắt khi `count * 2 > limit * 5`.
- `details.round` chỉ có khi lượt cơ bản trượt; chỗ giữ thiếu hiện "?" (review L2).
- Kênh nhập ghi lời nhắc của `input()` ra stdout không xuống dòng, nên lời nhắc bị chấm như một phần của dòng in (1.6, 1.7).
- `wrong_branch` và `skipped_lines` chưa có trong mã; định nghĩa ở hợp đồng mục 5.1 và 6. Phép đo dùng một bộ phân loại chép đúng thứ tự `classify-run.ts` cộng `wrong_branch` theo mục 5.1, và tự tính dòng không chạy bằng `sys.settrace` trên `_statement_lines` của harness.
- Phông `tram-sentinel` có `focus` (tháp), không có `trace`; `fragment_found` chỉ vẽ trên nền thành phố.
- Phác thảo 6.7 đã đo ba pha `(35, 75, 150)`: 12, 13, 14 câu. Ba pha đó không có mức `BAO DONG`.

## Hợp đồng brainstorm

- **Outcome:** người chơi sửa bản nháp bộ luật né của Kai, mỗi khối mang lại một lỗi đã gặp ở một chặng của Chương 2, cho tới khi bốn dòng quyết định đúng ở mọi pha tuần tra của Trạm Sentinel. Sao thứ ba là luật khẩn cấp với dữ liệu nằm đúng ở các biên. Qua màn, `after-2.7` trao mảnh "Quyết định" và cho thấy 0xA7 phát từ trong tháp.
- **Constraints:** level là dữ liệu; harness, `compute-stars.ts`, luật đếm câu không đổi; câu chữ chỉ ở D1; mô phỏng `patrol` của hạ tầng; mọi nhánh của dòng 2, 3, 4 có một test cơ bản; không đột biến nào 3 sao; ngưỡng không phạt kiểu "gán rồi in"; không lộ twist chương 3 và 6; không sửa file dùng chung.
- **Non-goals:** vòng lặp, hàm, `in`, so sánh nối; khóa phản ứng mới; tùy chọn mới cho `patrol`; câu chữ thật; code, migration.
- **Acceptance criteria:** mục 15 của GDD.

## Các lựa chọn đã so sánh

### A. Số pha cơ bản

1. **Bốn pha (chọn).** Đi qua cả bốn mức thang và mọi nhánh của dòng 3, 4, còn chỗ đặt ba bẫy ghép điều kiện (thứ tự `elif`, thiếu ngoặc, quên một vế). Giả định chịu lực: terminal và mô phỏng chịu được bốn tình huống (2.4, 2.5, 2.6 cũng có bốn test cơ bản). Hỏng đầu tiên nếu playtest thấy lượt chạy quá dài; terminal đã dừng ở tình huống sai đầu tiên nên rủi ro thấp.
2. **Ba pha, thang còn ba mức.** Giữ đúng chữ "ba pha" của phác thảo. Đổi lại Boss ôn một thang khác thang của 2.4, và ba pha vẫn quá chật cho ba bẫy của dòng 4. Hỏng ở bảng phủ: phải dồn bẫy sang phản công.
3. **Ba pha, nhánh thứ tư ở phản công.** Trái hợp đồng mục 4 ("mọi nhánh có ít nhất một test cơ bản"). Loại.

### B. Luật dòng 4

1. **`NAP` khi trong tầm và (camera bật hoặc đèn pha bật) (chọn).** Có một điều kiện trộn `and` với `or`, nên lỗi thiếu ngoặc của 2.5 có chỗ trong bản nháp. Giả định: người chơi đọc được nhãn mục tiêu có nhóm rõ ràng. Hỏng đầu tiên nếu nhãn viết mơ hồ; GDD mục 4 buộc nhãn tách phần "drone thấy được".
2. **Giữ luật phác thảo (`NAP` khi trong tầm và camera bật).** Không có chỗ cho lỗi ngoặc; danh sách lỗi của phác thảo không làm được.
3. **Đặt bẫy ngoặc ở vế `CHO`** (ví dụ "đèn pha bật hoặc có lệnh, và camera bật"). Luật khó kể bằng truyện và nhãn dài hơn.

### C. Ngưỡng

1. **17: kiểu "gán rồi in" (chọn).** Không phạt code sạch (điều chỉnh 1 của báo cáo validate) và không phạt đường sửa bản nháp (15). Thang tách `if` rời gán đè vẫn 1 sao (18–20). Hỏng ở một biến thể: dòng 4 viết bằng hai `if` rời gán đè ngược thứ tự được 3 sao (16). Chấp nhận vì đó là cách viết đúng có chủ ý, không phải lỗi "tách `elif`".
2. **14: lời giải in trong từng nhánh.** Theo hợp đồng mục 3 "ngưỡng = lời giải tham khảo". Hỏng ngay: chính bản nháp sửa xong (15 câu) và kiểu gán rồi in (17) chỉ còn 1 sao.
3. **16.** Bắt thêm biến thể dòng 4, nhưng vẫn phạt "gán rồi in" (17). Trái điều chỉnh 1.

### D. Biên số ở đâu

1. **Ở luật khẩn cấp (chọn, như phác thảo).** Biên là khái niệm của 2.1, 2.4 và đã chấm ở test cơ bản của hai màn đó; ở Boss, chúng là sao thứ ba, giống `"1500.0"` của 1.7. Khái niệm riêng của Boss (ghép luật thành quyết định) có mọi tổ hợp ở pha cơ bản.
2. **Ở pha cơ bản.** Lỗi `<` của bản nháp lộ ngay, sao thứ ba chỉ còn kiểm mã lệnh một dấu cách. Mất áp lực của luật khẩn cấp.

### E. Lỗi đầu tiên của bản nháp

1. **`TypeError` vì khoảng cách chưa đổi kiểu (chọn).** Lỗi dễ nhất, đã gặp ba lần; lượt 1 không in dòng nào nhưng sửa một chữ là thấy pha 1 chạy.
2. **Lỗi thụt lề cú pháp ở khối lồng.** Lỗi cú pháp luôn chắn trước mọi thứ và không có pha nào chạy; mất cảm giác "từng pha sáng dần". Lỗi thụt lề vì thế được làm thành lỗi ý nghĩa (dòng in nằm trong `else`), lộ bằng dòng mờ.

## Trade-offs

- A1 đổi chữ "ba pha" của khung lấy bảng phủ đầy đủ và ba bẫy ở pha cơ bản.
- B1 đổi một chút độ dài nhãn dòng 4 lấy lỗi ngoặc thật trong bản nháp.
- C1 đổi việc chặn một biến thể đúng (dòng 4 gán đè) lấy việc không phạt code sạch.
- D1 đổi khả năng thấy lỗi biên sớm lấy một sao thứ ba có ý nghĩa.

## Better approaches

Phác thảo đề xuất ngưỡng 14 từ lời giải in trong nhánh. Hướng tốt hơn là 17: bằng chứng đo được là đường sửa bản nháp tự nhiên ra 15 câu và kiểu gán rồi in ra 17, cả hai sẽ chỉ được 1 sao ở ngưỡng 14; ở 17, lỗi muốn dạy (thang tách `if` rời) vẫn 1 sao vì dữ liệu pha 3 được chọn để nó tốn 18 câu. Chi phí chuyển: không có, chỉ là một con số trong JSON.

Phác thảo đặt ba pha. Hướng tốt hơn là bốn pha: ba pha không đi qua đủ bốn mức thang, điều hợp đồng mục 4 bắt buộc. Chi phí: terminal dài hơn một tình huống khi mọi pha đạt.

## Hướng đã chọn

- Bốn mục tiêu `output_line`; dòng khóa `tam_quet`, `camera_bat`, `den_pha`; kênh nhập khoảng cách và mã lệnh.
- Bốn pha cơ bản, ba tình huống luật khẩn cấp (GDD mục 6.1). Ngưỡng 17.
- Bản nháp năm lỗi, lộ theo thứ tự `TypeError` → `wrong_branch` dòng 2 → dòng 3 không in → `wrong_branch` dòng 4 ở pha 3 → luật khẩn cấp dòng 1.
- `patrol` với `decision: {"line": 4}`; không có `component`; thẻ mảnh trong `after-2.7`.

## Rủi ro

- **Dòng 4 đúng mà tình huống trượt:** hợp đồng mục 2 chỉ nói "khớp `decision` thì Kai đi qua". Nếu H6 vẽ theo `decision` thay vì theo cả test, Boss sẽ vẽ Kai đi qua ở lượt 2 trong khi terminal báo lệch. Đã đề xuất trong báo cáo cho H6.
- **`{round}` trong câu `wrong_branch`:** khóa này bắn cả ở luật khẩn cấp (đường 2 sao), khi đó không có `round` và câu hiện "?". GDD cấm `{round}` ở khóa này; validator hiện chưa bắt (đề xuất trong báo cáo).
- **`CHO`, `QUA` không vào từ cấm** vì trùng chữ thường; người rà câu phải tự kiểm.
- **Bốn dòng, bốn pha, ba tình huống khẩn cấp** làm terminal dài khi qua hết; dừng ở tình huống sai đầu tiên giữ nó ngắn trong lúc sửa.
- **Lượt 1 không in dòng nào.** Nếu playtest thấy người chơi nản, đổi thứ tự: để dòng đọc kênh nhập đúng sẵn và dời lỗi đổi kiểu ra sau. Bảng 3.1 phải đo lại.
- **Biến thể dòng 4 gán đè được 3 sao:** có test giữ nguyên kết quả này, để ai hạ ngưỡng sau này thấy cái giá.

## Câu hỏi đã tự chốt

1. Bốn pha cơ bản thay vì ba (A1).
2. Luật `NAP` thêm đèn pha: trong tầm và (camera hoặc đèn pha) (B1).
3. Ngưỡng 17 (C1); biến thể dòng 4 gán đè được 3 sao, ghi là biến thể đúng.
4. Biên số và mã lệnh một dấu cách ở luật khẩn cấp (D1).
5. Lời nhắc của `input()` bị chấm; bản nháp dùng `input()` trống; có câu cho `output_has_prompt`.
6. Lỗi đầu tiên là `TypeError` đổi kiểu (E1); lỗi thụt lề là lỗi ý nghĩa, không phải lỗi cú pháp.
7. `wrong_branch` không dùng `{round}`.
8. Từ cấm không gồm `CHO`, `QUA`.
9. Nhịp `after-2.7`: năm nhịp như phác thảo, nhịp 1 nối với dòng "không chạy" (nhánh có số lần chạy bằng 0).
10. Lore KTS-02 mảnh thứ ba giữ đúng ý phác thảo, không nhắc KTS-0█.

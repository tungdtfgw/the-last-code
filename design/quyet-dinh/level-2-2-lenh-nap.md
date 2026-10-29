# Brainstorm: Level 2.2 "Lệnh nấp" (`if`, khối lệnh, thụt lề)

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.2-lenh-nap.md`. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md` (mục 2, 3, 4, 5, 6). Khung chương: `design/gdd-chuong-2.md` mục 6.2.
Nguồn đã đọc: như brainstorm 2.1 (`design/quyet-dinh/level-2-1-doc-luat-tuan-tra.md`).

## Hiện trạng (đã kiểm)

- `IndentationError` và `TabError` cùng ra khóa `IndentationError` (`classify-run.ts`), có `{line}`.
- Khi biến không được gán ở một đường chạy, harness báo `present: false`, khóa `missing_var` (không phải `NameError`, vì lỗi chỉ xảy ra khi đọc biến).
- `wrong_branch` ở lượt phản công thay `wrong_value_counter` và không có `details.round`; `{round}` trong câu sẽ hiện "?".
- `findEchoLeak` so không phân biệt hoa thường trên ranh giới chữ Unicode: đáp án `DI` bắt cả "di" trong "di chuyển"; "đi", "nạp" không bị bắt.

## Outcome

Người chơi viết luật đầu tiên của Kai: `lenh` mặc định là `DI`, khối `if` gán `NAP` khi khoảng cách không vượt quá tầm quét. Họ rời màn biết: khối lệnh là các dòng lùi vào dưới `if`, dòng `if` kết thúc bằng `:`; khối chỉ chạy khi điều kiện đúng; giá trị mặc định gán trước `if`; dòng mờ trong editor cho biết khối có chạy ở tình huống đó không.

## Constraints

- Trục truyện mục 6.2: Hàng Rào Ngoài, luật Lệnh nấp, KTS-01 mảnh thứ ba, 0xA7 giục, ECHO không trả lời.
- Hợp đồng engine: `patrol` với `decision: {"var": "lenh"}`; ít nhất 2 test cơ bản; biên ở test cơ bản; bảng phủ nhánh và đột biến; ngưỡng bằng lời giải tham khảo; không phạt cách viết chưa dạy rẻ hơn.
- Không sửa file dùng chung; không code, migration.
- Câu chữ chỉ ở D1.

## Non-goals

- `else` và luật "dòng sau khối luôn chạy" (2.3), `elif` (2.4), `and`/`or` (2.5).
- Khóa riêng cho thiếu `:` hay `=` trong điều kiện (hợp đồng mục 5.1).

## Acceptance criteria

1. Code khởi đầu: `IndentationError` dòng 8 → `wrong_branch` tình huống 1 (dòng 8 mờ) → `wrong_branch` tình huống 3 → `three_stars`, đo bằng harness thật.
2. Lời giải 3 sao 3 câu; hai `if` rời 3 sao; lời giải 2 sao (tầm quét viết cứng) trượt phản công 2.
3. `khoang_cach <= 40` (ngưỡng viết cứng) chỉ 2 sao.
4. Câu `wrong_branch` và câu thay có trong D1, không dùng `{round}`.
5. Mô phỏng vẽ đủ bảng biên GDD mục 7.1.

## Các lựa chọn đã so sánh

### A. Tình huống phản công thứ ba

1. **`(13, 12)` → `DI` (chọn, đổi so với phác thảo).** Đã đo: bắt mọi ngưỡng khoảng cách viết cứng qua được lượt cơ bản (30–49). Giả định: người chơi viết cứng bằng một ngưỡng hằng số. Hỏng đầu tiên với lối viết cứng theo tập giá trị (`khoang_cach in (25, 30)`), lối này đã trượt C1 hoặc C2.
2. **`(0, 12)` → `NAP` (phác thảo).** Đã đo: `if khoang_cach <= 40:` qua cả ba phản công, được 3 sao. Tình huống này không bắt đột biến nào hai phản công kia chưa bắt.

### B. Ngưỡng

1. **3 câu (chọn).** Bằng lời giải tham khảo; hai `if` rời cũng 3 câu, không bị phạt (chưa dạy `else`, phác thảo đã chốt). `if/else` (2 câu) và biểu thức `a if c else b` (1 câu) rẻ hơn, được nhận. Hỏng đầu tiên với `print(lenh)` dò: 4 câu, 1 sao; terminal đã hiện `lenh`.
2. **2 câu (bằng `if/else`).** Ép cách viết chưa dạy, trái hợp đồng mục 3.

### C. Câu ECHO cho `wrong_branch`

1. **Một câu chung cho mọi nơi khóa xuất hiện, không `{round}`, cộng câu thay (chọn).** Lượt 2 và lượt 3 ra cùng khóa liền nhau, nên câu thay là bắt buộc để ECHO không lặp. Câu nói "mã đi một đường có thật nhưng là đường của tình huống khác" và chỉ chỗ nhìn (dòng mờ, tình huống sát mép). Giả định: mô phỏng và terminal đã hiện tình huống nào trượt. Hỏng đầu tiên nếu người chơi không nhìn sang mô phỏng; khi đó gợi ý mức 2 nói rõ.
2. **Câu có `{round}`.** Hỏng ở phản công: hiện "?".

## Trade-offs

- A1 đổi một số liệu đã ghi trong khung chương; cần agent chính áp đề xuất vào `design/gdd-chuong-2.md` mục 6.2.
- B1 không phân biệt hai `if` rời với lời giải mặc định + `if`; 2.3 mới phân biệt (ngưỡng 3 cho `if/else` 3 câu với dòng in).
- `DI` bị cấm như một từ: câu ECHO không được dùng "di chuyển". Chấp nhận, ghi trong GDD mục 11.

## Better approaches

Một cải tiến so với phác thảo, có bằng chứng đo: phản công `(13, 12)` thay `(0, 12)` (mục A). Phần còn lại giữ nguyên phác thảo (code khởi đầu, ba test cơ bản, ngưỡng 3) vì đo khớp đúng chuỗi khóa mong muốn.

## Hướng đã chọn

- Dòng khóa: `khoang_cach = 25`, `tam_quet = 30`. Code khởi đầu ba dòng: mặc định `DI`, `if khoang_cach > tam_quet:`, thân không lùi vào.
- Test cơ bản `(25, 30)` → `NAP`, `(50, 30)` → `DI`, `(30, 30)` → `NAP`; phản công `(41, 40)` → `DI`, `(40, 40)` → `NAP`, `(13, 12)` → `DI`.
- Mục tiêu `lenh: str`; ngưỡng 3; `patrol` với `decision.var`; có câu `wrong_branch` và câu thay.
- Mảnh nhật ký KTS-01 (mảnh thứ ba). Luật: Lệnh nấp. Phông tạm `tram-sentinel`.

## Rủi ro

- `wrong_branch` chiếm gần hết lỗi giá trị của màn (mọi sai hướng, sai biên, viết cứng, cả ở phản công); `wrong_value_counter` chỉ còn tới được với chữ lạ. Chấp nhận: đó đúng là lỗi "nhầm nhánh"; câu `wrong_value_counter` vẫn viết.
- Dòng mờ là thứ chịu lực của bài học ở lượt 2. Nếu hạ tầng H5 trễ, màn vẫn chơi được (terminal và mô phỏng vẫn chỉ tình huống trượt), nhưng gợi ý mức 2 và `task_steps` bước 3 sẽ nói tới một thứ không có. Phase I phải kiểm điều này trước khi phát hành.
- Gán mặc định đặt sau khối ra `wrong_branch` mà không dòng nào mờ: người chơi có thể bối rối. Gợi ý mức 2 nói về thứ tự gán.

## Câu hỏi đã tự chốt

1. Thay phản công `(0, 12)` → `NAP` bằng `(13, 12)` → `DI` (mục A).
2. Ngưỡng 3, hai `if` rời được 3 sao.
3. `wrong_branch` không dùng `{round}`; có câu thay bắt buộc.
4. Không viết câu `value_is_label` (lối `lenh = "lenh"` hiếm; `wrong_value` đủ).
5. Cấm "thụt lề", "lùi vào", "dấu hai chấm"… trong lời ECHO: đó là cách sửa; Python đã nói "expected an indented block" trong terminal.
6. ECHO ở nhịp sau màn không nhắc 0xA7, chỉ đọc đường phía trước (hiện thực hóa "ECHO không trả lời").

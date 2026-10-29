# Brainstorm: Level 2.3 "Hai ngả" (`else`, dòng sau khối)

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.3-hai-nga.md`. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md` (mục 2, 3, 4, 5, 6). Khung chương: `design/gdd-chuong-2.md` mục 6.3.
Nguồn đã đọc: hợp đồng engine chương 2, `design/gdd-chuong-2.md`, `design/quyet-dinh/cot-truyen-chuong-2.md`, báo cáo validate khung (30/10), `CLAUDE.md`, GDD và brainstorm 1.5, 1.6, `src/levels/level-1-6.json`, `src/game/classify-run.ts`, `compute-stars.ts`, `alert.ts`, `build-config.ts`, `prepare-source.ts`, `validate-level.ts`, `src/engine/python/harness.py`, `tests/integration/run-harness.ts`, báo cáo review chương 1 (28/10), nhật ký lỗi 1.4.

## Hiện trạng (đã kiểm)

- Harness đếm câu lệnh: dòng `if` 1, `else:` 0, thân nhánh mỗi câu chạy 1 (hợp đồng mục 3; đo lại khớp).
- Level được trộn mục tiêu biến và mục tiêu dòng in: `validate-level.ts` không cấm; `classify-run.ts` xét biến trước rồi mới tới dòng in.
- `output_is_label` bắt dòng in chứa tên đầu vào (`goc_den`), nên dòng thiếu `f` ở 2.3 rơi đúng vào khóa này.
- `details.round` chỉ có khi lượt cơ bản trượt; lượt phản công không có `round`.
- Đã đo 23 mã (code khởi đầu, các lượt sửa, lời giải, đột biến) bằng `run_level` thật trên python3 3.13.2 và 3.14.8: cùng kết quả. Script đo nằm ở scratchpad phiên, không vào repo.

## Outcome

Người chơi giúp Kai qua Bãi Container: mỗi lần đèn pha dừng, chương trình chọn đúng một trong hai hướng và ghi góc đèn vào nhật ký. Họ rời màn biết `else` phủ đúng phần còn lại của điều kiện (không hở, không chồng), dòng sau khối luôn chạy, thụt lề quyết định dòng thuộc khối nào, và hai `if` rời tốn hơn `if/else`.

## Constraints

- Hợp đồng engine thắng: `patrol`, ≥ 2 test cơ bản, bảng phủ nhánh, bảng đột biến, `wrong_branch`, luật kiểm câu chữ `chapter >= 2`, không sửa file dùng chung.
- Ngưỡng không phạt lối viết sạch "gán biến rồi in một lần" (báo cáo validate, điều chỉnh 1). Ở 2.3, nếu không phân biệt được thì chọn một và ghi lý do.
- Ngưỡng không thấp hơn lời giải `if/else` thường; được phép phân biệt cấu trúc đã dạy (hợp đồng mục 3).
- Câu chữ chỉ ở D1; GDD chỉ ghi ý đồ. Đầu ra in không dấu.

## Non-goals

- `elif`, `and/or/not`, điều kiện lồng.
- Dạy biểu thức `a if c else b` (chấp nhận khi người chơi tự viết).
- Đổi `patrol` hay thêm khóa phản ứng mới.

## Acceptance criteria

1. Code khởi đầu: `output_missing` ở tình huống 1; bỏ thụt lề dòng in thì `missing_var` ở tình huống 3.
2. Lời giải 3 sao: 3 câu lệnh, 3 sao. Lời giải 2 sao: 2 sao, `wrong_branch` ở phản công.
3. Hai `if` rời đúng và lối "gán mặc định rồi đổi" chỉ 1 sao; không đột biến nào 3 sao.
4. Mọi nhánh và biên 90 có ở test cơ bản.
5. Câu ECHO sạch từ cấm và số; `wrong_branch` không dùng `{round}`.
6. Mô phỏng vẽ được "quyết định đúng nhưng dòng in thiếu" và "không có quyết định".

## Các lựa chọn đã so sánh

### A. Quyết định là dòng in hay biến

1. **Giữ phác thảo: hai dòng in, `decision.line` 1, ngưỡng 3.** Lời giải `if/else` in trong từng nhánh tốn 3 câu; hai `if` rời 4; gán rồi in 4. Giả định chịu lực: người chơi sẽ in hướng trong từng nhánh. Hỏng đầu tiên với người chơi viết sạch theo lối gán rồi in: dùng `else` đúng mà vẫn chỉ 1 sao, trái điều chỉnh 1 của báo cáo validate.
2. **Giữ hai dòng in, nâng ngưỡng lên 4.** Không phạt lối gán rồi in. Giả định: người chơi tự học `else` từ gợi ý và tổng kết. Hỏng ngay ở khái niệm chính: hai `if` rời bù nhau (`< 90`, `>= 90`) được 3 sao, màn không còn lý do nào bắt người chơi dùng `else`.
3. **Quyết định là biến `huong` (`decision.var`), một dòng in góc đèn sau khối, ngưỡng 3 (chọn).** Lối gán là lối duy nhất, nên không còn "hai cách viết sạch tốn khác nhau". Đo được: `if/else` 3, hai `if` rời 4, gán mặc định rồi đổi (lối của 2.2) 4, biểu thức `a if c else b` 2. Giả định chịu lực: `patrol` vẽ được quyết định là biến kèm một dòng in khác. Hỏng đầu tiên nếu timeline chỉ xét mục tiêu `decision` để quyết định tình huống đạt hay trượt (code khởi đầu có `huong` đúng mà dòng in thiếu); cần một case trong `patrol-timeline.test.ts`.

### B. Code khởi đầu

1. **Hai `if` rời hở ở 90, dòng in nằm trong khối thứ hai (chọn, theo phác thảo).** Hai lỗi lộ lần lượt: dòng in (tình huống 1), rồi khe hở (tình huống 3, Kai đứng yên, hai dòng gán cùng mờ). Sau đó đổi `>` thành `>=` cho 1 sao vì 4 câu lệnh, nên người chơi gặp đúng lý do của `else`.
2. **Gán mặc định rồi `if` (lối 2.2), dòng in trong khối.** Cũng ra chuỗi `output_missing` → `wrong_branch` → `alert_exceeded`. Hỏng ở câu chuyện: "đứng yên" và "chạy hai hướng" không xảy ra, mất hình ảnh mạnh nhất của màn. Giữ làm một dòng trong bảng đột biến.

### C. Dữ liệu và nấc 2 sao

1. **Cơ bản 45, 135, 90; phản công 10, 170, 89 (chọn, theo phác thảo).** Biên 90 ở lượt cơ bản. Nấc 2 sao là viết cứng theo tình huống 1 (`== 45`) hay mốc tùy tiện (`< 50`). Hợp đồng mục 4 cho viết cứng tối đa 2 sao.
2. **Thêm tình huống cơ bản thứ tư dưới 90 để viết cứng chỉ còn 0 sao.** Hỏng ở chỗ khác: màn không còn lời giải 2 sao tự nhiên nào, vì lỗi biên (`<=`) đã bị lượt cơ bản bắt. Mọi lời giải qua lượt cơ bản sẽ qua luôn phản công.

## Trade-offs

- A3 đổi một chút khác phác thảo (thêm `decision.var` thay vì `decision.line`, giống 2.2) lấy một ngưỡng vừa đúng hợp đồng mục 3 vừa đúng điều chỉnh 1. Lối "gán mặc định rồi đổi" của 2.2 bị phạt ở màn này: đó là chủ ý, vì `else` thay đúng lối đó.
- C1 chấp nhận viết cứng theo tình huống 1 được 2 sao để màn có nấc 2 sao.
- Màn có hai mục tiêu khác loại (biến và dòng in); người chơi in thêm `huong` sẽ trượt dòng 1 (`output_mismatch`). Bước 3 của `task_steps` nói không in thêm dòng nào.

## Better approaches

Phác thảo gợi ý quyết định là dòng in 1. Hướng tốt hơn là đặt quyết định vào biến: bằng chứng là bảng đo ở GDD mục 8.3 (với dòng in, hai `if` rời và lối gán rồi in cùng 4 câu nên không ngưỡng nào thỏa cả hợp đồng mục 3 lẫn điều chỉnh 1; với biến, chỉ còn lối gán, và ngưỡng 3 tách đúng `if/else` khỏi hai `if` rời). Chi phí chuyển: không có thay đổi engine; validator đã cho trộn mục tiêu; `patrol` đã có `decision.var`. Cần thêm một case timeline ở nhánh hạ tầng và sửa một đoạn `design/gdd-chuong-2.md` mục 6.3 (việc của agent chính, vì đó là file dùng chung).

## Hướng đã chọn

- Đầu vào khóa `goc_den` (int). Mục tiêu: biến `huong: str` (`SANG PHAI` khi góc dưới 90, còn lại `SANG TRAI`) và dòng in `GOC DEN: <góc>`. `simulation`: `patrol`, `decision: {"var": "huong"}`.
- Code khởi đầu: hai `if` rời hở ở 90, dòng in nằm trong khối thứ hai.
- Cơ bản 45, 135, 90; phản công 10, 170, 89. `alert_limit_statements` 3.
- Khóa cần câu: các khóa chung theo khuôn 1.6, cộng `wrong_branch`, `missing_var`, `output_is_label`; biến thể cho `wrong_branch`, `missing_var`, `alert_exceeded`.
- Truyện: KTS-07 (mảnh thứ ba), luật Ngả rẽ, dấu R-17 khắc trên container.

## Rủi ro

- Người chơi đến từ 2.2 quen lối gán mặc định rồi đổi; lần đầu dùng lối này ở 2.3 sẽ được 1 sao. Câu `alert_exceeded`, gợi ý 2 và tổng kết nói thẳng vì sao (kiểm thêm hoặc đổi hướng giữa chừng là thêm một câu lệnh).
- Timeline `patrol` có thể coi tình huống là đạt khi chỉ `decision` khớp. Code khởi đầu của 2.3 rơi đúng vào trường hợp này; nếu nhánh hạ tầng không vẽ trượt, mô phỏng sẽ mâu thuẫn với terminal.
- Câu `wrong_branch` có `{round}` sẽ hiện "?" ở lượt phản công. Validator hiện không bắt được (bài học L2 của review chương 1). GDD ghi luật cho người viết câu; đề xuất cho H4: validator từ chối `{round}` trong câu `wrong_branch`.
- Dòng mờ (`skipped_lines`) là phản hồi chính ở lượt 2. Nếu H5 trễ, lượt 2 chỉ còn câu ECHO và cảnh Kai đứng yên.

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Quyết định là biến `huong`, không phải dòng in (A3).
2. Ngưỡng 3; lối gán mặc định rồi đổi chỉ 1 sao.
3. Viết cứng theo tình huống 1 được 2 sao (hợp đồng cho tối đa 2).
4. Góc đo từ mép trái bãi; dưới 90 là đèn chiếu nửa trái, nên Kai sang phải.
5. `output_is_label` có câu ở màn này (thiếu `f` ở dòng góc đèn là lỗi dễ gặp lại sau 1.6).

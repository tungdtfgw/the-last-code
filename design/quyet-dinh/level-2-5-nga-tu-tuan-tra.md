# Brainstorm: Level 2.5 "Ngã tư tuần tra" (`and`, `or`, `not`)

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi chỗ cần hỏi đã tự chốt, liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.5-nga-tu-tuan-tra.md`. Khung: `design/gdd-chuong-2.md` mục 6.5. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md` (mục 2, 3, 4, 5, 6).
Nguồn đã đọc: hai tài liệu trên, `design/quyet-dinh/cot-truyen-chuong-2.md`, `plans/reports/validate-261030-0152-chuong-2-khung.md`, GDD và quyết định 1.5, 1.6, `src/levels/level-1-6.json`, `src/game/classify-run.ts`, `alert.ts`, `compute-stars.ts`, `echo-leaks.ts`, `echo-line-check.ts`, `echo-reactions.ts`, `validate-level.ts`, `src/engine/python/harness.py`, `tests/integration/run-harness.ts`.

## Hiện trạng (đã kiểm)

- Harness đếm dòng `if`/`elif` mỗi lần tới, `else:` không tính, `and`/`or`/`not` không thêm câu (hợp đồng mục 3; đo lại ra cùng số).
- `classifyRun` lấy tình huống trượt đầu tiên; với mục tiêu dòng in, khóa là `output_*`. `wrong_branch` chưa có; theo hợp đồng mục 5.1 nó thay `output_mismatch` khi dòng in sai trùng dòng mong đợi của một test khác. Màn này chỉ có hai dòng có thể in (`LENH: QUA`, `LENH: CHO`), nên mọi lỗi logic đều ra `wrong_branch`.
- `details.round` chỉ được gắn ở lượt cơ bản; ở lượt phản công `{round}` hiện thành `?` (`renderTemplate`).
- Kiểm câu chữ điền chỗ giữ bằng số mẫu (`line` 7, `count` 12, `out_line` 2, `col` 6, `round` 2) rồi mới so từ cấm.

## Outcome

Người chơi dịch một luật nói bằng lời ("xa hoặc camera tắt, và đèn pha không chiếu") thành một điều kiện Python đúng. Họ rời màn biết: `and` đòi cả hai vế, `or` chỉ cần một, `not` đảo một giá trị; `and` được tính trước `or`, nên câu nói tự nhiên phải thêm ngoặc mới giữ đúng nghĩa; một điều kiện ghép thay được cả chuỗi `if/elif`.

## Constraints

- Trục truyện 6.5: Ngã Tư Tuần Tra, luật tạo ra "Điều kiện qua đường", mảnh KTS-03, nhịp ECHO so lịch 0xA7 với luật gốc. Không lộ twist chương 3 và 6.
- Hợp đồng engine: mô phỏng `patrol` với `decision.line`, ≥ 2 test cơ bản, bảng phủ nhánh và bảng đột biến chạy bằng harness thật, luật kiểm câu chữ cho `chapter >= 2`.
- Ngưỡng không phạt kiểu "gán biến rồi in một lần" (validate mục 1), 2.5 nâng lên 3 trừ khi bảng đo cho lý do khác (validate mục 2).
- Không sửa file dùng chung; mọi đề xuất đi vào báo cáo.

## Non-goals

- Đánh giá ngắn mạch (`and` không xét vế sau khi vế trước sai), toán tử `is`, giá trị đúng/sai ngầm của số.
- Chấm riêng cách viết (`== False` hay `not`): chấm theo đầu ra.

## Acceptance criteria

Mục 15 của GDD màn.

## Các lựa chọn đã so sánh

### A. Ngưỡng cảnh báo

1. **2 câu (phác ban đầu).** Dạy viết gọn nhất. Giả định: người chơi in thẳng trong từng nhánh. Hỏng ngay với lời giải sạch "gán rồi in" (3 câu, 1 sao), trái luật validate.
2. **3 câu (chọn).** Bằng số câu của kiểu "gán rồi in" và kiểu biến `bool` trung gian. Vẫn phạt chuỗi `if/elif` không dùng `and`/`or` (4 câu ở tình huống 3, 4). Giả định chịu lực: người chơi thấy 1 sao ở chuỗi `if/elif` thì đi tìm cách gộp điều kiện. Hỏng đầu tiên với kiểu "gán mặc định rồi một `if`" (4 câu, 1 sao), là lối của 2.2; xem rủi ro.
3. **4 câu.** Không phạt gì của 2.2. Hỏng ở mục tiêu của màn: chuỗi `if/elif` bốn nhánh không có `and`/`or` cũng được 3 sao, màn không còn lý do để học điều kiện ghép.

### B. Bộ test cơ bản

1. **Giữ phác: `(60,T,F)`, `(60,T,T)`, `(20,T,F)`, `(20,F,F)`.** Đã đo: điều kiện `khoang_cach > 40 and not den_pha or not camera_bat` (đặt ngoặc sai chỗ, một lỗi đúng khái niệm của màn) qua cả bốn, chỉ trượt phản công 3. Hỏng ở hợp đồng mục 4: lỗi của khái niệm chính phải bị bắt ở lượt cơ bản.
2. **Đổi tình huống 2 thành `(60,F,T)` (chọn).** Bắt cả lỗi trên, vẫn bắt thiếu ngoặc, bỏ đèn pha, `or` thay `and`. Mỗi vế của `or` là lý do duy nhất để qua ở một tình huống (1 và 4). Giả định: bốn tình huống đủ, không cần năm. Hỏng đầu tiên nếu có đột biến chỉ khác ở tổ hợp `(xa, camera bật, đèn chiếu)`; đã thử mọi đột biến trong bảng, không cái nào như vậy.
3. **Năm test cơ bản.** Phủ thêm, nhưng thêm một tình huống phải xem ở mỗi lượt chạy và không bắt thêm đột biến nào ở bảng.

### C. Code khởi đầu

1. **Chỉ thiếu ngoặc (phác).** Một lượt sửa là xong; người chơi có thể thêm ngoặc theo cảm tính mà không đọc lại luật.
2. **Thiếu ngoặc và thiếu `not` trước `camera_bat` (chọn).** Hai lỗi lộ ở hai tình huống khác nhau (2 rồi 3), mỗi lỗi một phần của khái niệm. Giả định: người chơi đọc tình huống bị phát hiện để biết phần nào sai. Hỏng đầu tiên nếu người chơi sửa `not` trước rồi vẫn thấy trượt tình huống 2: dễ nghĩ mình sửa sai. Giảm bằng `reaction_variants.wrong_branch` (nói "vẫn" sai và chỉ dòng bị làm mờ) và gợi ý 1 nói đủ cả hai chỗ.
3. **Thêm lỗi cú pháp ở lượt 1 (`&&`).** Thêm một lượt mà không dạy gì về logic; `&&` đã nằm trong `mistakes` của tổng kết.

## Trade-offs

- A2 đổi việc phạt kiểu "gán mặc định rồi `if`" (1 sao) lấy việc giữ được lý do để học điều kiện ghép. Theo phác 2.3 (ngưỡng 3, hai dòng in), kiểu đó ở 2.3 tốn 5 câu, cũng bị phạt.
- B2 đổi một tổ hợp dễ hình dung (xa, camera bật, đèn chiếu) lấy việc bắt được lỗi đặt ngoặc sai chỗ ở lượt cơ bản.
- C2 đổi một lượt sửa nhanh lấy việc người chơi thấy mỗi tình huống thử một phần của luật.
- Cấm `(`, `)` trong lời ECHO: ECHO không được viết ngoặc đơn. Đổi một chút tự do câu chữ lấy việc ECHO không thể buột ra "thêm ngoặc".

## Better approaches

Phác gợi ý giữ ngưỡng 2 để dạy viết gọn. Hướng tốt hơn là ngưỡng 3 kèm dữ liệu test đặt nhánh dài nhất của chuỗi `if/elif` ở lượt cơ bản: bằng chứng là bảng đo (mục 8.3 GDD) cho kiểu "gán rồi in" 3 câu và chuỗi `if/elif` 4 câu ở tình huống 3, 4; vậy ngưỡng 3 vừa không phạt code sạch vừa phân biệt được lối viết cần tránh. Chi phí chuyển: không có, chỉ đổi một số trong JSON.

Hướng thứ hai tốt hơn phác: đổi tình huống cơ bản 2 (lựa chọn B2), có đo chứng minh ở bảng đột biến (dòng 11).

## Hướng đã chọn

- Dòng khóa `khoang_cach = 60`, `camera_bat = True`, `den_pha = False`; một dòng in `LENH: QUA` / `LENH: CHO`.
- Test cơ bản `(60,T,F)`, `(60,F,T)`, `(20,T,F)`, `(20,F,F)`; phản công `(40,T,F)`, `(41,T,F)`, `(20,F,T)`.
- Ngưỡng 3 (100% = 7). Lời giải 3 sao 2 câu; 2 sao: `>=` hoặc đoán ngưỡng.
- Khóa tùy chọn có câu: `wrong_branch` (khóa chính của màn). Không dùng `output_is_label`, `EOFError`, `output_has_prompt` (màn không có kênh nhập, không có tên biến nào dễ bị in nguyên).
- `scene` `tram-sentinel` tới khi có `nga-tu-tuan-tra`.

## Rủi ro

- **Hai `if` rời được 3 sao** (3 câu: `if cond:` … `if not (cond):` …). Cùng số câu với "gán rồi in" nên ngưỡng không tách được. Chấp nhận: lối viết này đòi viết đúng `not (…)` quanh cả điều kiện ghép, tức là đúng khái niệm của màn; 2.3 đã dạy và phạt hai `if` rời khi điều kiện đơn.
- **Gán mặc định rồi một `if` chỉ 1 sao** (4 câu). Người chơi mang thói quen 2.2 sẽ thấy lạ. Câu `alert_exceeded` và gợi ý 2 nói rằng một `if/else` là đủ; theo phác 2.3, lối này ở 2.3 cũng vượt ngưỡng.
- **Mọi lỗi logic cùng ra `wrong_branch`.** ECHO lặp; đã có `reaction_variants.wrong_branch`, và phản hồi chính là mô phỏng (tình huống nào) cùng dòng bị làm mờ.
- **`{round}` ở lượt phản công thành `?`.** Câu `wrong_branch` không dùng `{round}`; đề xuất hạ tầng xử lý (báo cáo).
- **Số mẫu của kiểm câu chữ** (`count` 12, `line` 7…) không trùng số nào bị cấm ở màn này (20, 40, 41, 60).

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Ngưỡng 3 (không phải 2 như phác).
2. Tình huống cơ bản 2 đổi thành `(60, False, True)`.
3. Code khởi đầu có hai lỗi logic (ngoặc, `not`), không có lỗi cú pháp.
4. Biên 40 chỉ ở phản công (so sánh là khái niệm 2.1).
5. Cấm `(`, `)` trong lời ECHO; không cấm `QUA`, `CHO` (trùng chữ tiếng Việt).
6. Kiểu "hai `if` rời" được 3 sao; kiểu "gán mặc định rồi `if`" được 1 sao.

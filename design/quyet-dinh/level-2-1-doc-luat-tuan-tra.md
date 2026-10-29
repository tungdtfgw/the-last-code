# Brainstorm: Level 2.1 "Đọc luật tuần tra" (sáu phép so sánh, kết quả `bool`)

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-2/gdd-2.1-doc-luat-tuan-tra.md`. Hợp đồng engine: `docs/hop-dong-engine-chuong-2.md` (mục 2, 3, 4, 5, 6). Khung chương: `design/gdd-chuong-2.md` mục 6.1.
Nguồn đã đọc: hợp đồng engine Chương 2, `design/gdd-chuong-2.md`, `design/quyet-dinh/cot-truyen-chuong-2.md`, GDD và brainstorm 1.5, 1.6, `src/levels/level-1-6.json`, `src/game/classify-run.ts`, `src/game/echo-leaks.ts`, `src/game/echo-line-check.ts`, `src/game/validate-level.ts` (`task_steps`), `src/engine/python/harness.py` (`run_level`, `_value_match_other_type`), `tests/integration/run-harness.ts`, `level-1-6.test.ts`.

## Hiện trạng (đã kiểm)

- Mục tiêu biến kiểu `bool` chấm bằng `type(v) is bool`; chuỗi `"True"` sai kiểu nhưng `value_match_other_type` đúng, nên ra `type_mismatch_value_match`.
- `levelLeaks` tự thêm `True`, `False` vào danh sách đáp án khi giá trị mong đợi là `bool`; validator dùng cùng danh sách cho `task_steps`. Vậy `task_steps` của 2.1 không được viết `True`/`False`.
- `renderTemplate` thay chỗ giữ thiếu bằng "?"; `details.round` chỉ có ở lỗi lượt cơ bản.
- `wrong_branch` chưa có trong mã. Định nghĩa ở hợp đồng mục 5.1: giá trị sai trùng giá trị mong đợi của cùng mục tiêu ở một test khác.

## Outcome

Người chơi tính lại ba cờ đúng/sai của drone D-31 bằng ba phép so sánh, mỗi phép gán thẳng vào một biến `bool`. Họ rời màn biết: phép so sánh tự cho ra `True`/`False`; `=` khác `==`; ở điểm bằng nhau `<` khác `<=`; so số với chuỗi báo `TypeError`; chuỗi so từng ký tự. Phản công đổi chế độ và tầm quét, nên ai so với "không phải chế độ sạc" hay viết cứng tầm quét sẽ trượt.

## Constraints

- Trục truyện mục 6.1: Đường Ống Số 9, D-31, ba cờ, luật Cảm biến tầm quét, KTS-02 mảnh thứ nhất, móc câu "Sentinel bắn cả drone sai luật".
- Hợp đồng engine: mô phỏng `patrol` không `decision`; ít nhất 2 test cơ bản; biên của khái niệm chính ở test cơ bản; bảng phủ và bảng đột biến; ngưỡng bằng số câu lớn nhất của lời giải tham khảo.
- Không đổi file dùng chung; không viết code, migration.
- Câu chữ chỉ ở D1; GDD ghi ý đồ.

## Non-goals

- `if` và mọi cấu trúc nhánh (2.2 trở đi).
- So sánh nối `a < b < c`, so sánh chuỗi theo thứ tự từ điển, `in`.
- Một khóa phản ứng riêng cho `=` thay `==` (hợp đồng mục 5.1 đã chốt không thêm).

## Acceptance criteria

1. Code khởi đầu cho chuỗi khóa `TypeError` → `type_mismatch` → `wrong_value` → `three_stars`, một lỗi mỗi lượt, đo bằng harness thật.
2. Lời giải 3 sao 3 câu; lời giải 2 sao (`!= "SAC"`) trượt phản công 1.
3. Mọi đột biến trong GDD mục 8.2 ra đúng khóa và sao đã ghi; không đột biến nào 3 sao; viết cứng 0 sao.
4. Không có câu `wrong_branch`; test từ cấm và validator qua.
5. Mô phỏng vẽ đủ bảng biên GDD mục 7.1.

## Các lựa chọn đã so sánh

### A. Có viết câu cho `wrong_branch` không

1. **Không viết (chọn).** Giả định chịu lực: với mục tiêu `bool`, mọi giá trị sai đều trùng giá trị mong đợi của tình huống kia, nên khóa không mang thông tin gì. Đã đo: bật `wrong_branch` thì mọi dòng `wrong_value` và `wrong_value_counter` trong bảng đột biến (lượt 3, sai biên, viết cứng, `!= "SAC"`, tầm quét viết cứng…) đều thành `wrong_branch`. Hỏng đầu tiên nếu hạ tầng H4 làm `wrong_branch` thành khóa bắt buộc; hợp đồng mục 5.1 nói nó tùy chọn, đi qua `levelHasLine`.
2. **Viết câu kiểu "cờ lật ngược".** Hỏng ngay ở phản công: `wrong_value_counter` không bao giờ tới được, ECHO mất câu "OMNI đổi số đo, cờ không đổi theo". Và màn chưa có nhánh nào để câu "đi nhầm nhánh" có nghĩa.

### B. Dữ liệu phản công

1. **Hai tình huống: `(50, 50, "TUAN TRA", 19)` và `(51, 50, "QUET", 21)` (chọn).** C1 đặt chế độ thứ ba (bắt `!= "SAC"`), biên mới của tầm quét và pin ngay dưới ngưỡng (bắt ngưỡng pin viết cứng); C2 đặt phía kia của biên tầm quét mới. Đã đo: mọi ngưỡng khoảng cách viết cứng qua được lượt cơ bản (30–44) và mọi ngưỡng pin viết cứng khác 20 qua được lượt cơ bản (8–19 với `<`) đều trượt C1. Giả định: dữ liệu chỉ có số nguyên. Hỏng đầu tiên nếu một màn sau dùng số thực cho các biến này (`pin <= 19` khi đó sai).
2. **Một tình huống.** Đủ bắt mọi đột biến đã đo, nhưng bỏ trống phía "hơn một" của biên mới, trái hợp đồng mục 4 ("mọi điểm biên có mặt").

### C. Ngưỡng

1. **3 câu (chọn), bằng lời giải.** Lời giải chỉ có một cách viết tự nhiên với ba câu gán. Hỏng đầu tiên với người chơi thêm `print` để dò (4 câu, 1 sao). Giảm rủi ro: terminal đã hiện kiểu và giá trị ba cờ; `task_steps` bước 3 nói không cần in.
2. **4 câu, chừa chỗ cho một `print`** (như 1.5). Trái hợp đồng mục 3 ("ngưỡng = số câu lớn nhất của lời giải tham khảo"), và để lối viết bằng `if` (4–5 câu) lọt 2 sao ở một tình huống.

## Trade-offs

- A1 làm 2.1 lệch với câu "mỗi màn có câu cho `wrong_branch`" của `design/gdd-chuong-2.md` mục 6. Đổi lại ECHO nói đúng chuyện ở cả lượt cơ bản lẫn phản công.
- C1 phạt một `print` dò. Chấp nhận vì terminal đã hiện ba cờ; ghi rõ trong `task_steps`.
- Cách viết bằng `if` (chưa dạy) bị 1 sao vì tốn 4–5 câu. Đây là bài học chủ ý: phép so sánh đã là câu trả lời, không cần `if` để "biến nó thành" `True`.

## Better approaches

Không có hướng tốt hơn hướng phác thảo cho câu đố (code khởi đầu, test cơ bản giữ nguyên, đã đo đúng như mục 6.1). Hai điểm cải tiến: không viết câu `wrong_branch` (bằng chứng: bảng đo ở GDD mục 8.2 và mục A ở trên), và cụ thể hóa phản công thành hai tình huống có biên hai phía.

## Hướng đã chọn

- Dòng khóa: `khoang_cach = 30`, `tam_quet = 30`, `che_do = "QUET"`, `pin = 20`. Ba lỗi cài sẵn: `<` thay `<=`, `=` thay `==`, so với chuỗi `"20"`.
- Test cơ bản `(30, 30, "QUET", 20)`, `(45, 40, "SAC", 7)`; phản công `(50, 50, "TUAN TRA", 19)`, `(51, 50, "QUET", 21)`.
- Ba mục tiêu `bool`; ngưỡng 3; `patrol` không `decision`; không câu `wrong_branch`.
- Mảnh nhật ký KTS-02 (mảnh thứ nhất). Luật: Cảm biến tầm quét. Phông tạm `tram-sentinel`.

## Rủi ro

- Hạ tầng H4 có thể làm `wrong_branch` bắn cho cả mục tiêu `bool`. Màn này không viết câu nên không ảnh hưởng; các màn sau có mục tiêu `bool` cần biết điều này (nên ghi vào hợp đồng engine mục 5.1).
- `che_do in "QUET"` được 3 sao. Chấp nhận: màn không dạy chuỗi con, dữ liệu không có lý do tự nhiên để chặn.
- Từ cấm `bằng nhau` và `dấu bằng` làm câu ECHO khó viết hơn ở `type_mismatch`; câu dùng "đặt giá trị" thay "hỏi".

## Câu hỏi đã tự chốt

1. Không viết câu `wrong_branch` cho 2.1 (mục A).
2. Hai tình huống phản công, số liệu ở mục "Hướng đã chọn".
3. Ngưỡng 3, không chừa chỗ cho `print`.
4. Không cấm `pin` trong lời ECHO (từ thường của truyện), cấm ba tên biến đầu vào còn lại.
5. Bản ghi cuối của D-31 nói nó bị bắn vì bỏ qua mục tiêu đứng đúng ở mép tầm quét, để nối bài học điểm bằng nhau vào truyện.

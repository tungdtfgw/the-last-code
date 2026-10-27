# Brainstorm: Level 1.7 BOSS "Cổng Kiểm Soát" và kết Chương 1

Ngày: 2026-10-28. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md`. Hợp đồng engine: `docs/hop-dong-engine-level-1-5-den-1-7.md` (mục 1, 2, 5, 6, 7).
Nguồn đã đọc: như brainstorm 1.5 và 1.6, thêm `src/story/build-story.ts`, `src/story/progression.ts` (`rawStoryEnd`, `componentSlot`, `chapterTotals`), `src/story/chapter-1.json`, `src/ui/story-labels.ts`, `src/ui/results-dialog.tsx`, `server/content/content-migration-cli.ts`, `server/db/sqlite-db.ts`, `docs/huong-dan-deploy.md` mục 9.

## Hiện trạng (đã kiểm)

- Harness chạy mọi test cơ bản (namespace mới mỗi test) và mọi test phản công; `classify-run.ts` đã đòi tất cả đạt, lấy số câu lệnh lớn nhất, hiện test sai đầu tiên. `RunOutcome` chỉ mang một test cơ bản.
- `componentSlot` cho 1.7 (chỉ số 6) là `undefined` vì chương có 6 ô; `build-story.ts` bỏ thẻ thành phần.
- `after-<id>` của level cuối dẫn vào `teaser`; `teaser` hiện là "Còn tiếp" sau 1.4 (9 nhịp: log, echo, log, log, card, echo, log, kai, card), nói "bốn thành phần, còn hai" và tên ba level chưa dựng.
- Khóa neo của nhịp là `kind`; migration vá đổi `text` mà giữ `kind` thì khớp cả JSON cũ lẫn mới.
- Trục truyện ràng buộc Boss: NX-0417 (Nhi) trực ca đêm ở cổng; 0xA7 chờ ở đó; mảnh "Định danh" nằm dưới cổng; KTS-03 đã cảnh báo đừng tin 0xA7.
- Thử bằng `python3` 3.13 (lời giải trong GDD mục 7, bốn bộ dữ liệu mục 6): lời giải 3 sao đúng cả bốn bộ; lời giải 2 sao vỡ `ValueError: invalid literal for int() with base 10: '1500.0'` ở lượt kiểm tay; code khởi đầu vỡ `TypeError` dòng 15 ở cả bốn bộ.

## Outcome

Người chơi ghép đủ sáu thành phần của Neural-ID giả thành sáu dòng tín hiệu, sửa bản nháp mang lại đúng lỗi của từng trạm trước, và vượt ba vòng quét liên tiếp mà mỗi vòng cổng đổi dữ liệu phiên và câu hỏi. Sao thứ ba là lượt kiểm tay của NX-0417 với dữ liệu "định dạng OMNI" (mức năng lượng có phần thập phân, mã phiên mang hình dạng thứ năm). Qua màn, đoạn sau màn cho Kai đối mặt Nhi, nhận mảnh "Định danh", thấy 0xA7 đã ở trong cổng; đoạn hết chương khép Chương 1 và móc sang Chương 2.

## Constraints

- Ràng buộc truyện ở trên; không lộ twist chương 3 (0xA7 là Kiến Trúc Sư) hay chương 6 (ECHO, đặc tả của OMNI).
- Tổng hợp đúng các khái niệm đã dạy ở 1.1–1.6; không dạy gì mới (không `if`, không vòng lặp).
- Thay đổi engine tối thiểu: không đổi harness ngoài kênh nhập của 1.6, không đổi luật sao.
- Câu chữ chỉ ở D1; đổi `teaser` bằng migration vá, không sinh lại migration `0004`.

## Non-goals

- Ghép kill switch từ code người chơi (câu hỏi mở của `design/gdd.md` mục 3, để chương 4).
- Thanh máu, giới hạn lượt chạy, đồng hồ đếm ngược: Boss vẫn là một level dữ liệu, chạy không giới hạn.
- Dựng Chương 2 hay bản đồ chương 2.

## Acceptance criteria

1. Ba vòng là ba test cơ bản; lượt đạt khi cả ba đạt; `RunOutcome.rounds` và `details.round` có khi level có ≥ 2 test cơ bản, vắng mặt với 1.1–1.6.
2. Code khởi đầu: vòng 1, `TypeError` dòng 15, dòng 1 và 3 đạt.
3. Khuôn chép tay bị bác ở vòng 2 dòng 3; quên làm tròn bị bác ở vòng 3 dòng 4.
4. Lời giải 2 sao: 8 câu lệnh, `counter_ValueError`. Lời giải 3 sao: 3 sao.
5. `checkpoint-timeline.test.ts`: vòng sau vòng bác là "CHƯA TỚI"; kiểm tay đạt và vỡ; giảm chuyển động.
6. `after-1.7` → `teaser` (đoạn hết chương) → Bản đồ; bản đồ hiện 7 level, tổng sao tối đa 21, thanh Neural-ID 6/6.
7. Migration vá `0008` giữ 9 nhịp và `kind`; chương qua `validateChapterText` với cả `chapter-1.json` cũ và mới.
8. Từ cấm (kể cả nhịp echo của `teaser`), migration `0007`, typecheck, test, test:py, build qua; e2e được viết.

## Các lựa chọn đã so sánh

### A. "Ba vòng quét liên tiếp"

1. **Ba test cơ bản, harness không đổi (chọn).** Giả định chịu lực: ba vòng độc lập (mỗi vòng một namespace mới) là đủ; "liên tiếp" chỉ là cách kể và cách vẽ. Hỏng đầu tiên nếu thiết kế muốn trạng thái nối giữa các vòng (vòng 2 dùng kết quả vòng 1); không cần ở Chương 1.
2. **Cơ chế vòng mới trong harness (một lần `exec`, cổng gọi lại ba lần).** Cần hàm hoặc vòng lặp, chưa dạy. Hỏng ngay ở chương trình học.
3. **Một test cơ bản và hai lượt phản công.** Đổi nghĩa sao thứ ba (phản công bị chia làm vòng 2–3), phải sửa `compute-stars.ts`. Hỏng ở luật "chỉ một chỗ quyết định sao".

### B. Code khởi đầu

1. **Bản nháp sáu dòng, mỗi dòng một lỗi cũ (chọn).** Boss thành bài ôn có cấu trúc: mỗi lần sửa một ô thành phần sáng. Giả định: người chơi nhớ bài học của từng trạm khi gặp lại lỗi. Hỏng đầu tiên với người bỏ qua giữa chương (vào thẳng bằng liên kết); gợi ý 2 và 3 bù bằng bảng ôn.
2. **Trang trắng chỉ có chú thích.** Thử thách hơn, nhưng người mới không biết bắt đầu từ đâu; lượt chạy đầu không dạy gì.
3. **Bản nháp đúng ở vòng 1, chỉ vỡ ở vòng 2–3.** Lượt 1 thắng ngay rồi thua: đánh lừa cảm giác "chạy được là đúng" mà 1.4 đã dạy là sai. Giữ một phần ý này qua dòng 13 (khuôn chép tay).

### C. Mô phỏng

1. **Dùng lại `relay`.** Không có vòng, không có thanh Neural-ID. Hỏng ở cảm giác Boss.
2. **Loại mới `checkpoint` đọc `rounds` (chọn).** Cần `rounds` trong `RunOutcome` (hạ tầng H3) và danh sách dòng dùng chung (H6).

### D. Kết chương

1. **Biến `teaser` thành đoạn hết chương, giữ khung 9 nhịp (chọn).** Không đổi `progression.ts`; migration vá chỉ đổi chữ nên không có lúc nào chương hỏng. Giả định: chín nhịp đủ cho một đoạn kết chương. Hỏng đầu tiên nếu muốn đoạn kết dài hơn; khi đó đổi khung bằng migration vá `json_set` cả mảng và deploy ngay (cách đã ghi ở `docs/huong-dan-deploy.md` mục 9).
2. **Thêm đoạn `chapter-end` riêng vào file chương.** Thêm trường, sửa `progression.ts`, `validate-chapter.ts`, `text-fields.ts`, bản đồ. Hỏng ở phạm vi: nhiều mã cho một thứ `teaser` đã làm được.
3. **Để `teaser` nguyên, kết chương nằm trong `after-1.7`.** `teaser` cũ ("bốn thành phần, còn hai") vẫn chạy sau 1.7. Hỏng ngay.

### E. Mảnh nhật ký

Chương 1 chỉ lộ KTS-01, 05, 07, 03 (`design/gdd-mo-dau.md` mục 1). Chọn KTS-05 cho 1.7: người thiết kế Neural-ID là người hợp lý nhất để giấu mảnh "Định danh" dưới một cổng chỉ mở cho danh tính dựng bằng tay. 1.5 nhận mảnh thứ hai của KTS-07, 1.6 mảnh thứ hai của KTS-01.

## Trade-offs

- A1 đổi khả năng "trạng thái nối giữa các vòng" lấy không đổi harness và luật sao.
- B1 đổi độ khó thuần lấy một Boss dạy lại cả chương; ngưỡng 9 câu lệnh cho lời giải 8 câu lệnh giữ áp lực tàng hình.
- D1 đổi độ dài đoạn kết lấy một lần chuyển giao không có khoảng hỏng.
- Phát hành ba màn cùng lúc (hợp đồng engine mục 7) đổi tốc độ ra mắt từng màn lấy việc người chơi không bao giờ thấy một `teaser` nói sai số thành phần.

## Better approaches

Đề bài hỏi "dùng lại tests + counter_attack hay cần cơ chế mới?". Hướng chọn dùng lại hoàn toàn: `tests` có ba phần tử là ba vòng, `counter_attack_tests` là lượt kiểm tay; chỉ thêm `rounds` vào kết quả phân loại để mô phỏng vẽ được (bằng chứng: `run_suite` trong `harness.py` và `failing ?? first`, `Math.max(...line_count)` trong `classify-run.ts`). Cải tiến so với dòng định hướng cũ ("ghép đủ 6 thành phần"): biến lượt phản công thành lượt kiểm tay của Nhi, để sao thứ ba và cao trào truyện là một.

## Hướng đã chọn

- Sáu mục tiêu `output_line`, mỗi dòng một thành phần; dòng khóa `ho_ten`, `ma_khu`, `ma_phien`, `chieu_cao`; kênh nhập mã hỏi và mức năng lượng.
- Ba vòng (mục 6 của GDD), kiểm tay `"1500.0"` và `True`. Ngưỡng 9 câu lệnh.
- Mô phỏng `checkpoint`; không có `component`; mảnh "Định danh" là thẻ trong `after-1.7`.
- `teaser` thành "Hết chương 1", migration vá `0008`, nhãn "Hết chương 1".

## Rủi ro

- Sáu mục tiêu và ba vòng làm terminal dài; terminal chỉ in vòng tới vòng bác đầu tiên.
- `KHUON: <class 'int'>` đòi người chơi nhớ `print` in kiểu thế nào; vòng 1 cho dòng này đạt sẵn để họ thấy mẫu.
- Lượt kiểm tay vỡ `ValueError` có thể thấy "chơi xấu"; briefing đã báo người trực kiểm bằng dữ liệu riêng, và gợi ý 2 hỏi "thứ này có thể mang phần thập phân không?".
- Migration vá `teaser` áp lên D1 trước khi deploy code: trong khoảng đó, người chơi vừa qua 1.4 sẽ thấy đoạn hết chương thay vì Còn tiếp. Làm lúc không có lớp nào chơi và deploy ngay.
- 21 sao tối đa: dòng "Chơi lại để lấy đủ 3 sao…" sau đoạn hết chương dựa trên `maxStars`, không cần sửa.

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Ba vòng là ba test độc lập, không có trạng thái nối giữa các vòng.
2. Lượt phản công của Boss là kiểm tay của NX-0417; Nhi không nhận ra Kai, chỉ đóng dấu chậm một nhịp (hy vọng nhỏ, không hứa).
3. 0xA7 nói chuyện từ hệ thống của cổng (gieo kín cho twist chương 3); mảnh thứ hai ở Trạm Sentinel được nói ở đoạn hết chương.
4. `teaser` đổi nghĩa thành đoạn hết chương thay vì thêm đoạn mới.
5. Mảnh nhật ký 1.7 là KTS-05; KTS-05 là người giấu mảnh "Định danh".
6. Boss không có `component`; hộp kết quả không có dòng "Đã thu".

# Brainstorm: Level 1.5 "Năng lượng tối thiểu" (toán tử số học)

Ngày: 2026-10-28. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-1/gdd-1.5-nang-luong-toi-thieu.md`. Hợp đồng engine chung với 1.6, 1.7: `docs/hop-dong-engine-level-1-5-den-1-7.md`.
Nguồn đã đọc: `CLAUDE.md`, `design/gdd.md` (4.1, 4.5, 5, 7), `design/gdd-mo-dau.md` (1, 5.6, 6), `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`, `design/quyet-dinh/viec-can-lam-va-tong-ket.md`, GDD và hợp đồng 1.1–1.4, `src/levels/level-1-*.json`, `src/game/level-types.ts`, `src/game/classify-run.ts`, `src/game/compute-stars.ts`, `src/game/alert.ts`, `src/game/sim-vocabulary.ts`, `src/ui/level-simulation.tsx`, `docs/nhat-ky-loi-prototype-1-4.md`.

## Hiện trạng (đã kiểm)

- Mục tiêu biến, input có kiểu (số nguyên), phản công thay dữ liệu: đều có sẵn từ 1.3–1.4. 1.5 không cần thay đổi harness hay phân loại.
- `failureKey`: sai hình dạng đứng trước sai giá trị; `type_mismatch_value_match` khi mọi biến sai hình dạng đều đúng nội dung.
- Bốn loại mô phỏng có sẵn; máy quét 1.4 vẽ tối đa 3 làn theo hình dạng, không có ý "đủ hay thiếu năng lượng".
- Thử bằng `python3` 3.13: `6 * 12 ^ 2 - 36` = `-106`; `828 / 100` = `8.28`, `round` = 8; `1500 / 110` = `13.63…`, `round` = 14 còn `//` = 13; `round(2.5)` = 2; `3 ^ 2` = 1.

## Outcome

Người chơi tắt Vành Đai Điện bằng cách tính đúng năng lượng còn thiếu và chia nó thành số pin đầy cộng phần lẻ. Họ rời màn biết: `**` là lũy thừa và tính trước `*`; `^` không phải lũy thừa; `/` luôn ra số thực; `//` và `%` là thương và số dư của cùng một phép chia; chia lấy phần nguyên khác làm tròn. Phản công đổi tải để chỉ `//` (hoặc cách tương đương) qua được.

## Constraints

- Giữ trục truyện `design/gdd-mo-dau.md` 6.5 và đoạn Còn tiếp 5.6: thiếu hay thừa một đơn vị đều hỏng; thành phần Năng lượng tín hiệu; Chương 1 chỉ lộ KTS-01, 05, 07, 03.
- Không dạy `if`, so sánh, `math`. Lời giải 3 sao chỉ dùng toán tử.
- Câu chữ chỉ ở D1; GDD ghi ý đồ. Phản ứng ECHO không nói cách sửa, có test từ cấm.
- Không đổi `compute-stars.ts`, harness, phân loại.

## Non-goals

- Số âm và chia cho số âm (`//` làm tròn xuống về âm vô cùng): khó với người mới, để chương sau.
- Định dạng số (`:.2f`), `math.ceil`.
- Nhập liệu (`input()`): việc của 1.6.

## Acceptance criteria

1. Code khởi đầu chạy không lỗi; lượt 1 ra `type_mismatch` với năng lượng âm nhìn thấy trên đồng hồ.
2. Lời giải 2 sao bằng `round` (và bằng viết cứng) qua lượt cơ bản, trượt phản công với `wrong_value_counter`.
3. Lời giải 3 sao bằng `//` `%`, và bằng `int(/)` cộng phép trừ, đều 3 sao với 3 câu lệnh (test tích hợp chạy harness thật).
4. Mọi `reactions`, `reaction_variants` và nhịp echo không chứa từ cấm của 1.5 hay giá trị kỳ vọng nào.
5. `fence-timeline.test.ts` phủ: đúng, thiếu, thừa, âm, sai hình dạng, lỗi chạy, phản công qua và trượt.
6. Mọi `code` trong `knowledge_summary` chạy đúng `output` bằng `python3`.
7. Migration `0005_content_level_1_5.sql` qua `npm run content:migration` và `server/content/content-migration.test.ts`.
8. `npm run typecheck`, `npm test`, `npm run test:py`, `npm run build` qua; e2e `level-1-5.spec.ts` được viết.

## Các lựa chọn đã so sánh

### A. Câu đố

1. **Một công thức năng lượng, rồi chia thành pin đầy và phần lẻ (chọn).** Ba mục tiêu `int` dùng đủ `*`, `**`, `-`, `//`, `%`; `/` và `^` xuất hiện như bẫy trong code khởi đầu. Giả định chịu lực: "pin đầy + phần lẻ" đủ trực quan để người mới thấy cần thương và số dư. Hỏng đầu tiên nếu người chơi nghĩ phần lẻ là "pin thứ chín" (đáp 9 thay vì 8); giảm bằng nhãn mục tiêu và mô phỏng vẽ pin lẻ là một pin đổ dở.
2. **Một mục tiêu cho mỗi toán tử (bảy biến).** Phủ đủ bảy ký hiệu nhưng thành bài tập tính, không có câu chuyện. Hỏng ở độ dài cột Mục tiêu và ở chỗ không còn lý do vì sao cần `//` thay vì `/`.
3. **Số pin tối thiểu làm tròn lên (`(a + b - 1) // b`).** Đúng chữ "tối thiểu" hơn, nhưng mẹo làm tròn lên không tự nhiên với người mới và không có `if`. Hỏng ở gợi ý: muốn không lộ đáp án thì gợi ý 3 phải dạy một mẹo, không dạy một khái niệm.

### B. Mô phỏng

1. **Dùng lại máy quét `scanner`.** Rẻ nhất, vừa 3 làn. Giả định: hình dạng là thứ cần thấy. Hỏng ở bài học chính: máy quét không cho thấy "thiếu 720 đơn vị" hay "thừa", chỉ đúng/sai.
2. **Loại mới `fence` (chọn).** Rào nhiều đoạn, giá pin, đồng hồ có vạch "cần". Giả định: một timeline thuần + một component như bốn loại trước là đủ. Hỏng đầu tiên nếu giá trị quá lớn để vẽ pin (lời giải sai kiểu `5148`); timeline giới hạn số pin vẽ và ghi số.
3. **Tham số hóa máy quét thêm đồng hồ.** Hỏng ở test máy quét của 1.4 (bài học của 1.3, `design/quyet-dinh/level-1-3-bon-loai-tin-hieu.md` B3).

### C. Phản công

1. **Đổi tải để `/` làm tròn ra sai (chọn).** Dữ liệu cơ bản làm `round(8.28)` và `//` trùng nhau; dữ liệu phản công làm chúng khác (13.63). Bắt cả viết cứng lẫn "làm tròn thay chia lấy phần nguyên".
2. **Dữ liệu chia hết.** `/` ra `13.0`, chỉ bắt hình dạng; `round` vẫn qua. Bỏ.

## Trade-offs

- A1 đổi độ phủ bảy toán tử trong luật chấm lấy một câu chuyện có lý do; `+` chỉ xuất hiện trong tổng kết, `/` và `^` là bẫy.
- B2 đổi một component mới lấy hình ảnh "thiếu/thừa" đúng lời đoạn Còn tiếp.
- `int(nang_luong / dung_luong)` cũng 3 sao: chấp nhận, vì với số dương nó đúng và `int()` đã dạy ở 1.4.

## Better approaches

Đề bài gợi ý "tính lượng pin vừa đủ". Hướng chọn tách "vừa đủ" thành số pin đầy và phần lẻ thay vì làm tròn lên, vì làm tròn lên cần một mẹo chứ không cần một khái niệm, và tách đôi lại dùng đúng cặp `//`/`%` (bằng chứng: thử trên `python3`, mục Hiện trạng). Chi phí chuyển: không có, chưa có mã.

## Hướng đã chọn

- Đầu vào khóa (số nguyên): `so_doan`, `dien_ap`, `du_tru`, `dung_luong`.
- Mục tiêu: `nang_luong`, `so_pin`, `phan_le`, đều `int`. Ngưỡng 4 câu lệnh.
- Lỗi cài sẵn: `^`, `/`, phép trừ sai thứ.
- Phản công `{7, 15, 75, 110}` → `1500, 13, 70`.
- Mô phỏng `fence`; mảnh nhật ký KTS-07 (mảnh thứ hai).

## Rủi ro

- `^` cho kết quả âm khó hiểu (`-106`) vì độ ưu tiên; nếu người thử chơi thấy quá rối, đổi dòng 8 thành `dien_ap ^ 2` đặt trong ngoặc (`so_doan * (dien_ap ^ 2) - du_tru` = 48) để lỗi chỉ còn "`^` không phải lũy thừa".
- Pin lẻ có thể bị hiểu là "pin thứ chín". Cần nhãn và mô phỏng rõ.
- Mô phỏng `fence` là phần tốn công nhất; đường lùi là `scanner` (hợp đồng engine mục 9).

## Câu hỏi còn mở

Đã tự chốt; người dùng có thể đổi.

1. Ba mục tiêu `int` (không có mục tiêu `float` cho `/`). `/` chỉ là bẫy.
2. `phan_le` là số dư, không phải "số pin cần thêm".
3. Mảnh nhật ký 1.5 là mảnh thứ hai của KTS-07 (giữ luật "Chương 1 chỉ lộ bốn KTS").
4. Ngưỡng 4 câu lệnh cho lời giải 3 câu lệnh.
5. Mô phỏng mới `fence` thay vì dùng lại máy quét.

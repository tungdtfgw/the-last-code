# Brainstorm: Level 1.3 "Bốn loại tín hiệu"

Ngày: 2026-10-25. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-1/gdd-1.3-bon-loai-tin-hieu.md`. Nguồn đã đọc: `CLAUDE.md`, `design/gdd-mo-dau.md` (mục 1, 5.2, 6.3), `design/quyet-dinh/mo-dau-va-cot-truyen-chuong-1.md`, `design/gdd.md` (4.1, 4.2, 4.5, 5.2, 7, 7.1), `design/chuong-1/gdd-1.4-tin-hieu-lech-pha.md`, `src/levels/level-1-4.json`, `src/game/level-types.ts`, `src/game/validate-level.ts`, `src/game/classify-run.ts`, `src/game/compute-stars.ts`, `src/game/alert.ts`, `src/game/echo-reactions.ts`, `src/game/echo-forbidden-terms.test.ts`, `src/game/terminal-lines.ts`, `src/game/build-config.ts`, `src/engine/python/harness.py`, `src/ui/scanner-simulation.tsx`, `src/ui/scanner-timeline.ts`, `src/ui/type-colors.ts`, `src/ui/objectives-panel.tsx`, `docs/nhat-ky-loi-prototype-1-4.md`.

## Hiện trạng (đã kiểm trong mã nguồn)

- Harness chấm biến bằng `type(v) is T` với `T` thuộc `int`, `float`, `str`, `bool`. Không có cách nào chấm một biến giữ **chính hình dạng** (một đối tượng kiểu như `int`); với giá trị đó `_preview` trả về `<type>`.
- `TestCase.inputs` chỉ nhận chuỗi (`validate-level.ts` báo lỗi nếu input không phải chuỗi; `harness-types.ts` khai `Record<string, string>`). Phía Python thì `ns.update(inputs)` nhận được mọi giá trị JSON, nên chỉ phía TypeScript chặn.
- Mô phỏng hiện có một làn cho mỗi mục tiêu, cách nhau 104 đơn vị trong khung 470: tối đa 3 làn. Năm mục tiêu không vừa, và mô phỏng không có ý "phân loại".
- Luật từ cấm của ECHO là một regex toàn cục `\b(int|float|round)\b` trong test; `gdd-mo-dau.md` mục 5.2 đã nói validator sẽ kiểm "từ cấm của level đó", nên cần một danh sách theo level.
- `objectives-panel.tsx` hiện chip kiểu cho từng mục tiêu bằng `toneVar(o.type)`: người chơi luôn thấy hình dạng máy quét đòi.
- Đầu ra `print` hiện trong ô ĐẦU RA của terminal sau mỗi lần chạy, không được chấm.
- Thử bằng `python3` 3.13: `1,72` là tuple `(1, 72)` không báo lỗi; `027` là `SyntaxError` ("leading zeros in decimal integer literals are not permitted"); `true` là `NameError: name 'true' is not defined` (không có gợi ý "Did you mean", vì harness dùng `str(exc)`); chuỗi `"ĐỖ MINH AN"` dạng NFC khác dạng NFD khi so bằng `==`.

## Outcome

Người chơi qua Ga Ngầm Số 3 bằng cách viết lại năm trường của hồ sơ ĐỖ MINH AN cho đúng hình dạng: một chuỗi, một số nguyên, một số thực, một giá trị đúng/sai, và một "khuôn" là chính hình dạng của mã phiên mà máy quét cấp. Người chơi dùng `type()` theo hai cách: in ra để hỏi hình dạng của một giá trị (có sẵn một dòng mẫu trong code khởi đầu), và lưu kết quả của `type()` vào biến để khai khuôn. OMNI phản công bằng cách cấp mã phiên mang hình dạng khác; ai chép tay khuôn nhìn thấy (`int`) thì trượt, ai hỏi thẳng giá trị (`type(ma_phien)`) thì qua. Mô phỏng là máy phân loại bốn làn màu: mỗi gói đi vào làn của **hình dạng thật** của nó, gói sai làn rơi vào thùng giữ lại.

## Constraints

- Không dạy hay đòi ép kiểu: 1.4 dạy `int()`, `float()`, `round()`. Lời giải ba sao của 1.3 không gọi hàm nào ngoài `type()` (và `print()` tùy chọn). Người chơi tự dùng `int("27")` thì vẫn được chấm đúng; không cấm.
- Giữ nguyên sự thật của `gdd-mo-dau.md` mục 6.3: địa điểm, bốn làn và màu, tình huống, thành phần "Khuôn kiểu", KTS-07, các nhịp kết. Chỉ được chỉnh câu chữ.
- ECHO gọi kiểu là "hình dạng"; câu phản ứng miễn phí không chỉ cách sửa, không trích đáp án.
- Level là dữ liệu: mọi thứ riêng của 1.3 nằm trong `src/levels/level-1-3.json`; phần engine thêm vào phải dùng chung được cho level sau.
- Thay đổi harness phải giữ thuần thư viện chuẩn và giữ mọi hành vi 1.4 (test hiện có không đổi kết quả).
- Mô phỏng SVG/CSS, chạy sau khi có kết quả, tôn trọng giảm chuyển động, vừa bề rộng điện thoại.
- Không đụng file của người soạn 1.1 và 1.2.

## Non-goals

- Ép kiểu, toán tử, so sánh, `if`, `isinstance`.
- Chấm theo stdout (người soạn 1.1 đang đề xuất); 1.3 không dùng.
- Ẩn giá trị đầu vào khỏi người chơi (cân nhắc ở phương án A1, không chọn).
- Dựng hệ thống chuyển cảnh, `location` trong tiêu đề ô mô phỏng, `outro_beats`: thuộc việc của trục truyện chương. 1.3 chỉ điền dữ liệu.
- Viết code. Tài liệu này là thiết kế.

## Acceptance criteria

1. GDD 1.3 có briefing, code khởi đầu, mục tiêu, diễn biến ba lần chạy đầu, lời giải 2 sao và 3 sao, phản công, gợi ý 3 mức, toàn bộ phản ứng ECHO, chấm sao, đoạn kết theo trục truyện.
2. Code khởi đầu chạy không lỗi ở lần đầu; bốn trường bị từ chối, mỗi trường vì một lý do khác nhau (chuỗi trông như số, tuple do dấu phẩy thập phân, chuỗi "có", một giá trị thay cho hình dạng). Một trường (`ho_ten`) qua, để người chơi thấy làn vàng nhận.
3. Có một lời giải 2 sao không gọi `type()` cho khuôn (`khuon_phien = int`) và trượt phản công; lời giải 3 sao dùng `type(ma_phien)`. Cả hai ≤ 7 câu lệnh.
4. Mọi phản ứng miễn phí, câu `entry` và nhịp `echo` trong `outro_beats` không chứa từ trong `echo_forbidden_terms` của level, không chứa giá trị kỳ vọng nào của test (kể cả `"int"`, `"str"`).
5. Có bản nháp JSON đầy đủ, hợp lệ với validator sau thay đổi schema đề xuất dưới đây.
6. Có bảng trường hợp biên, mỗi dòng ghi có cần test tự động hay không; test chỉ cho chấm điểm, luật sao, lộ đáp án, an toàn khi lỗi.
7. Có lối đi từng bước của một người mới, từ màn "VÀO NHIỆM VỤ" tới 3 sao, gồm các ngã rẽ sai thường gặp.
8. Danh sách thay đổi engine nêu rõ file, trường schema, và hành vi mặc định giữ nguyên cho 1.4.

## Các lựa chọn đã so sánh

### A. Cách cho `type()` một việc thật để làm

1. **Đầu vào bị che, chọn đúng khe bằng `type()`.** Máy quét phát mã phiên hai lần, một bản chuỗi `"4096"`, một bản số `4096`, hiển thị là nhiễu `▒▒▒▒`; `print` hai bản ra giống hệt nhau nên phải hỏi `type()`. Cần thêm input có kiểu và cờ che hiển thị ở mô phỏng lẫn terminal. Giả định chịu lực: người chơi không đoán mò. Hỏng đầu tiên ở chính lần chạy 1: dòng terminal "ma_phien: str (4 ký tự), yêu cầu int" đã cho biết khe đang dùng là chuỗi, vậy khe kia là số, không cần `type()`. Phản công cũng không bắt được gì ngoài viết cứng con số.
2. **Mục tiêu kiểu "type" (chọn).** Một biến `khuon_phien` phải giữ chính hình dạng của `ma_phien` (`<class 'int'>`). Phản công đổi `ma_phien` từ `4096` sang `"7351"`: khuôn đúng thành `str`. Cần hai thay đổi nhỏ: mục tiêu loại `"type"` trong harness, và input có kiểu. Giả định chịu lực: người mới hiểu được "lưu kết quả của `type()` vào biến". Hỏng đầu tiên nếu người chơi không biết `type()` tồn tại; giảm bằng dòng `print(type(ho_ten))` có sẵn trong code khởi đầu (ô ĐẦU RA hiện `<class 'str'>` ngay lần chạy 1) và gợi ý 3. Đây là phương án duy nhất mà phản công bắt đúng lỗi "giả định hình dạng".
3. **Chấm stdout của `print(type(x))`.** Dựa vào mục tiêu stdout của 1.1. Giả định chịu lực: thay đổi của 1.1 được làm trước và đúng dạng 1.3 cần. Hỏng đầu tiên khi người chơi in thêm dòng khác hoặc in đúng chuỗi `"<class 'int'>"` bằng tay; và in ra không bắt được giả định hình dạng ở phản công trừ khi chấm stdout cả ở lượt phản công.

### B. Mô phỏng

1. **Dùng lại máy quét hiện có.** Không vừa 5 làn trong khung 470, không thể hiện "phân loại theo hình dạng". Hỏng ngay ở bố cục.
2. **Máy phân loại mới, dùng chung khung timeline và bộ phát (chọn).** Thêm `simulation: "sorter"` trong JSON; một hàm thuần `buildSorterTimeline` trả về cùng kiểu `Frame` (cue, thời lượng), một component SVG mới; tách phần phát lại khỏi `ScannerSimulation` thành một hook dùng chung. Giả định chịu lực: một level chỉ cần một trong hai mô phỏng. Hỏng đầu tiên nếu Boss 1.7 muốn ghép cả hai; khi đó ghép hai timeline nối tiếp, cùng một kiểu `Frame`.
3. **Tham số hóa máy quét cũ thành máy phân loại.** Một component, nhiều nhánh `if`. Hỏng đầu tiên ở test `scanner-timeline.test.ts` của 1.4: mọi thay đổi bố cục làm vỡ khung của level đã chạy tốt.

### C. Từ cấm của ECHO

1. **Giữ regex toàn cục `int|float|round`.** Hỏng ở 1.3: không chặn được "dấu chấm", "dấu nháy", "True", là những thứ lộ cách sửa của level này.
2. **Danh sách theo level, mặc định là danh sách cũ (chọn).** Trường `echo_forbidden_terms`; thiếu thì dùng `["int", "float", "round"]`, nên 1.4 không phải sửa. Áp cho mọi `reactions`, cho `entry` và cho nhịp `echo` trong `outro_beats`. Giả định chịu lực: người soạn liệt kê đủ. Hỏng đầu tiên khi một cách diễn đạt mới lộ đáp án mà không có trong danh sách; người duyệt vẫn phải đọc.
3. **Cho ECHO nói tên kiểu thoải mái ở 1.3.** Ô Mục tiêu đã hiện tên kiểu nên không lộ thêm nhiều. Hỏng ở giọng: ECHO phá từ vựng "hình dạng" mà trục truyện chốt, và mở đường cho câu "tuoi cần là int", tức là chỉ cách sửa.

## Trade-offs

- A2 đổi một thay đổi harness nhỏ (mục tiêu `"type"`) lấy một phản công dạy đúng bài "hỏi hình dạng, đừng đoán", và lấy chính thành phần "Khuôn kiểu" làm cơ chế. A1 rẻ hơn ở harness nhưng `type()` không thật sự cần.
- B2 đổi một component mới lấy việc không động vào mô phỏng 1.4 và có hình ảnh "phân loại" đúng trục truyện.
- C2 đổi một trường JSON lấy luật lộ đáp án đúng theo từng level, đúng như `gdd-mo-dau.md` 5.2 đã định.
- Ngân sách 7 câu lệnh đổi sự rộng rãi lấy một bài học nhỏ: các dòng `print(type(...))` là công cụ dò, dùng xong thì bỏ. Code khởi đầu có 6 câu lệnh, lời giải 3 sao 5–6 câu.

## Better approaches

Đề bài gợi ý vài hướng cho `type()` (in ra để dò, mục tiêu là kết quả kiểm tra kiểu, phản công nạp trường hình dạng lạ). Hướng chọn (A2) gộp cả ba: in ra để dò có sẵn trong code khởi đầu; mục tiêu giữ chính kết quả `type()` thay vì một `bool` "kiểm tra kiểu" (vì `==`/`is` chưa được dạy và `bool` không bắt được giả định hình dạng); phản công đổi hình dạng của trường đầu vào. Bằng chứng: harness đã chấm theo `type(v) is T`, thêm một nhánh cho đối tượng kiểu là khoảng mười dòng; chi phí chuyển: thêm `"type"` vào danh sách loại mục tiêu và cho input nhận số/bool.

## Hướng đã chọn

- **Năm mục tiêu:** `ho_ten` (str, đúng sẵn), `tuoi` (int, viết sẵn `"27"`), `chieu_cao` (float, viết sẵn `1,72`), `da_tiem` (bool, viết sẵn `"có"`), `khuon_phien` (type, viết sẵn `= ma_phien`).
- **Đầu vào:** `ma_phien = 4096` (int) ở lượt thường; phản công `ma_phien = "7351"` (str).
- **Ngân sách:** `alert_limit_statements = 7`; 100% = 17 câu lệnh.
- **Mô phỏng:** máy phân loại bốn làn, khe khuôn cạnh thẻ mã phiên, thùng giữ lại, rào sân ga (đóng, mở nửa, mở hẳn).
- **ECHO:** không nói tên kiểu Python, không nói dấu câu, dùng "hình dạng" và "làn".

## Thay đổi engine cần có

| # | File | Thay đổi | Mặc định cho 1.4 |
|---|---|---|---|
| 1 | `src/game/level-types.ts` | `OBJECTIVE_TYPES = [...VALUE_TYPES, "type"]`; `Objective.type` nhận `"type"`. `TestCase.inputs: Record<string, string \| number \| boolean>`. Trường tùy chọn: `simulation?: "scanner" \| "sorter"`, `echo_forbidden_terms?: string[]`. Khóa phản ứng mới `type_mismatch_unknown_shape` | Không có trường mới thì như cũ |
| 2 | `src/game/validate-level.ts` | Kỳ vọng của mục tiêu `"type"` phải là một trong `"int"`, `"float"`, `"str"`, `"bool"`. Input được là chuỗi, số hữu hạn hoặc bool. Kiểm `simulation`, `echo_forbidden_terms` (mảng chuỗi không rỗng) | Giữ nguyên lỗi cũ |
| 3 | `src/engine/python/harness.py` | `_describe` với `expected_type == "type"`: `type_ok = _type(value) is type`; `value_ok = value is TYPE_MAP[expected]`; `type` báo `"type"`. `_preview` với đối tượng kiểu thuần (`_type(value) is type`): trả về `<class 'tên'>`. `_value_match_other_type`: chuỗi `"int"` hoặc `"<class 'int'>"` tính là khớp nội dung. So chuỗi (mục tiêu `str`) sau khi chuẩn hóa NFC cả hai phía (`unicodedata`, thư viện chuẩn) | Mục tiêu `int/float/str/bool` không đổi, trừ chuẩn hóa NFC (không đổi kết quả với dữ liệu ASCII của 1.4) |
| 4 | `src/engine/harness-types.ts` | `inputs` có kiểu như ở (1) | — |
| 5 | `src/game/classify-run.ts` | Khi mọi biến sai kiểu đều mang hình dạng ngoài năm loại trên (ví dụ `tuple`, `NoneType`) thì khóa là `type_mismatch_unknown_shape`. `counterInputs` đổi kiểu theo (1) | Level không có khóa này rơi về `type_mismatch` (xem 6) |
| 6 | `src/game/echo-reactions.ts` | Chuỗi dự phòng: `type_mismatch_unknown_shape → type_mismatch → generic` | — |
| 7 | `src/game/echo-forbidden-terms.test.ts` | Đọc `level.echo_forbidden_terms ?? ["int","float","round"]`, so theo ranh giới từ, không phân biệt hoa thường; áp cho `reactions` và nhịp `echo` trong `outro_beats` | Kết quả 1.4 không đổi |
| 8 | `src/game/terminal-lines.ts`, `src/ui/scanner-timeline.ts` | Hiển thị input theo cú pháp Python (`"7351"` có nháy, `4096` không nháy, `True`/`False`) thay cho `JSON.stringify` | Chuỗi hiển thị giống hệt cũ |
| 9 | `src/ui/type-colors.ts`, `objectives-panel.tsx` | `toneOf("type")` trả về một tông riêng `"shape"` (viền trắng xám, không phải một trong bốn màu); chip mục tiêu dùng `toneVar(toneOf(o.type))` | — |
| 10 | `src/ui/sorter-timeline.ts`, `src/ui/sorter-simulation.tsx` (mới), hook phát lại tách từ `scanner-simulation.tsx` | Máy phân loại (GDD 1.3 mục 5) | 1.4 vẫn dùng máy quét |
| 11 | `tests/fixtures/solutions/1.3/*.py`, `tests/integration` | Các lời giải mẫu của 1.3 chạy qua harness thật | — |

Giới hạn đã biết của input có kiểu: JSON không giữ được số thực tròn (`2.0` thành `2` khi qua JavaScript, tức là `int` trong Python). Ghi vào chú thích của validator; 1.3 không dùng input số thực.

## Rủi ro

- **Người mới chưa từng thấy `int` đứng một mình như một giá trị.** `khuon_phien = int` có thể lạ. Giảm bằng: dòng `print(type(ho_ten))` có sẵn, nhãn mục tiêu, gợi ý 3 có ví dụ `k = type(x)`. Nếu thử nghiệm cho thấy quá khó, có thể chuyển `khuon_phien` thành mục tiêu chỉ chặn sao 3 (không chặn 1 sao); cần thêm cờ `star_tier` nên không làm lúc này.
- **Một vài người chơi sẽ "sửa" bằng ép kiểu** (`int("27")`). Được chấm đúng; bài học về cách viết giá trị bị bỏ qua. Chấp nhận, vì cấm thì phải chặn tên hàm, phức tạp và không công bằng.
- **Hai level liền nhau đều có phản công bắt "chép tay".** 1.3 bắt chép tay *hình dạng*, 1.4 bắt chép tay *kết quả* và `ValueError`. Câu ECHO và banner khác nhau; vẫn cần người thử chơi xác nhận không thấy lặp.
- **Đổi hiển thị input sang cú pháp Python** có thể làm vỡ test terminal của 1.4 nếu test so chuỗi; về lý thuyết không đổi vì chuỗi `JSON.stringify("27")` và `"27"` theo Python giống nhau.
- **Chuẩn hóa NFC trong harness** là thay đổi hành vi chấm cho mọi mục tiêu chuỗi; cần một test và một dòng trong nhật ký lỗi.
- **Mô phỏng mới** là phần tốn công nhất; nếu trễ, 1.3 vẫn chơi được với máy quét cũ khi tăng `VIEW_H`, nhưng mất ý phân loại.

## Câu hỏi còn mở

Các câu dưới đây đã được tự chốt để không chặn công việc; người dùng có thể đổi.

1. **Mục tiêu loại `"type"` (`khuon_phien`) là cơ chế chính để dạy `type()`.** Phương án che đầu vào (A1) bị loại vì terminal đã lộ hình dạng ngay lần chạy 1.
2. **Phản công đổi `ma_phien` từ `4096` sang `"7351"`.** Không đổi các trường hồ sơ, vì chúng là hằng số chép từ bản tin.
3. **ECHO không nói tên kiểu Python ở 1.3** (`int`, `float`, `str`, `bool`, `type`, `tuple`, `True`, `False`) và không nói dấu câu. Tên kiểu chỉ xuất hiện ở máy quét, terminal, ô Mục tiêu và gợi ý 3.
4. **Có thêm đúng một khóa phản ứng mới**, `type_mismatch_unknown_shape`, chủ yếu cho lỗi `1,72` (dấu phẩy thập phân kiểu Việt Nam).
5. **Ngân sách 7 câu lệnh.** Code khởi đầu có 6; để lại một hai dòng dò vẫn được 2 sao, in dò cho mọi trường thì mất sao tàng hình.
6. **Code khởi đầu có sẵn `print(type(ho_ten))`** (tốn 1 câu lệnh) để giới thiệu `type()` ngay lần chạy 1.
7. **Harness chuẩn hóa NFC khi so chuỗi.** Đề xuất làm cùng lúc; tách riêng được nếu muốn giữ harness y nguyên cho 1.4.
8. **Mô phỏng chọn bằng trường `simulation`** thay vì suy ra từ số mục tiêu.
9. **Không có `05` (số 0 đứng đầu) trong code khởi đầu**: lỗi cú pháp ở lần chạy đầu che hết mọi bài học khác. Nó chỉ nằm trong bảng trường hợp biên.
10. **`int("27")` không bị cấm.**

# Brainstorm: Level 1.2 "Gán nhãn" (biến, phép gán, gán lại)

Ngày: 2026-10-25. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/chuong-1/gdd-1.2-gan-nhan.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 1, 5.2 và 6.2.
Nguồn đã đọc: `CLAUDE.md`, `design/gdd-mo-dau.md`, `design/gdd.md` (4.1, 4.2, 4.5, 7, 7.1), `design/quyet-dinh/mo-dau-va-cot-truyen-chuong-1.md`, `design/chuong-1/gdd-1.4-tin-hieu-lech-pha.md`, `src/levels/level-1-4.json`, `src/game/{level-types,validate-level,classify-run,compute-stars,alert,build-config,prepare-source,terminal-lines,echo-reactions}.ts`, `src/game/echo-forbidden-terms.test.ts`, `src/engine/python/harness.py`, `src/engine/harness-types.ts`, `src/ui/scanner-timeline.ts`, `src/ui/scanner-simulation.tsx`, `src/ui/game-screen.tsx`, `tests/integration/grading-pipeline.test.ts`, `docs/nhat-ky-loi-prototype-1-4.md`.

## Hiện trạng (đã kiểm trong mã nguồn)

- Harness chấm từng biến mục tiêu theo kiểu chính xác và giá trị (`_describe`); biến đầu vào được nạp vào namespace, dòng khóa bị thay bằng dòng trống. Stdout được thu và hiện ở terminal ("ĐẦU RA") nhưng không được chấm.
- `validate-level.ts` không từ chối trường lạ ở cấp trên cùng, nhưng từ chối khóa lạ trong `reactions`. `locked_lines` phải là một khối liên tiếp.
- Test chống lộ (`echo-forbidden-terms.test.ts`) dùng một regex chung `int|float|round` và cấm mọi giá trị `expected` xuất hiện như một token trong phản ứng miễn phí. Với 1.2, mọi giá trị đáp án là chuỗi (`K-07`, `ĐỖ MINH AN`…), nên câu ECHO không được nhắc các mã này.
- Mô phỏng chỉ có máy quét của 1.4: tối đa 3 làn (`LANE_GAP` 104 trong `VIEW_H` 470), ẩn dụ "gói đi qua cổng", chỉ biết giá trị cuối cùng của mỗi biến. Tiêu đề ô mô phỏng viết cứng "Cổng phía Bắc".
- Đã chạy thử bản nháp code khởi đầu và lời giải qua `harness.py` bằng `python3` local: code khởi đầu dừng ở dòng 13 với `NameError` (4 câu lệnh); sửa lỗi chính tả thì chạy được, 9 câu lệnh, 4 biến sai giá trị; lời giải chuẩn qua cả lượt cơ bản và phản công với 9 câu lệnh; lời giải gõ tay `"AN-5521"` qua lượt cơ bản và trượt phản công ở `so_hieu`, `the_cong`. Python không đưa gợi ý "Did you mean" vào `str(exc)`, nên traceback không lộ tên đúng.

## Outcome

Người chơi vừa qua 1.1 (biết `print` và chuỗi) vào Trạm Phát Khẩu Phần số 4 và dựng hồ sơ ĐỖ MINH AN trong một ki-ốt chỉ đọc ô nhớ có nhãn. Họ học bốn điều, mỗi điều có một lần chạy làm lộ ra: (1) tên phân biệt hoa thường và phải tồn tại trước khi được đọc (`NameError`); (2) tên trong dấu nháy là chữ, không phải tên; (3) đặt tên một lần rồi dùng lại ở nhiều chỗ, nên khi dữ liệu đổi thì mọi chỗ đổi theo; (4) gán lại thay giá trị của một tên từ dòng đó trở đi, và Python chạy từ trên xuống. Lượt OMNI phản công thay toàn bộ bộ đệm, nên ai gõ lại giá trị bằng tay sẽ mất sao thứ 3. Mô phỏng ki-ốt cho thấy các ô nhớ được ghi theo đúng thứ tự dòng, ô mã khu bị ghi đè, và thiết bị nào đã đọc giá trị cũ.

## Constraints

- Giữ đúng sự thật ở `design/gdd-mo-dau.md` mục 6.2: địa điểm, ĐỖ MINH AN, K-12 → K-07, AN-5521, thành phần "Hồ sơ danh tính", KTS-05, các nhịp truyện và móc câu. ECHO không tự giới thiệu, chưa gọi kiểu dữ liệu là "hình dạng" (từ 1.3 mới gọi).
- Level là dữ liệu: mọi thứ riêng của 1.2 nằm trong `src/levels/level-1-2.json`. Thay đổi engine phải chung cho mọi level, nhỏ, và không làm đổi hành vi của 1.4.
- Chấm bằng mục tiêu biến hiện có; không phụ thuộc cơ chế chấm stdout mà người soạn 1.1 đang đề xuất.
- Mô phỏng SVG/CSS, chạy lại sau khi chạy xong (không chạy trực tiếp), tôn trọng giảm chuyển động, dùng được ở bề rộng điện thoại.
- Phản ứng miễn phí của ECHO không nói cách sửa, không trích đáp án, không nhắc tên gói trong bộ đệm.
- Không đụng file của 1.1, 1.3, 1.4. Không viết code trong lượt này.

## Non-goals

- Chấm theo stdout, chấm theo cấu trúc AST (ví dụ "chuỗi này chỉ được xuất hiện một lần").
- Bắt buộc người chơi phải viết đúng một câu gán lại. Lời giải không gán lại nhưng cho đúng giá trị vẫn được nhận (xem Trade-offs).
- Dạy nối chuỗi. Hai dòng thiết bị có `+ " / " +` được viết sẵn; người chơi chỉ cần đọc hiểu.
- Kiểm định danh tiếng Việt có dấu, phép gán nhiều tên (`a = b = c`), gán bộ (`a, b = …`).
- Định tuyến, chuyển cảnh, Bản đồ: thuộc thiết kế mở đầu.

## Acceptance criteria

1. `design/chuong-1/gdd-1.2-gan-nhan.md` có briefing nối từ câu cuối của 1.1, code khởi đầu có lỗi cài sẵn, mục tiêu, diễn biến từng lần chạy, lời giải 2 sao và 3 sao, OMNI phản công, mô phỏng, gợi ý 3 mức, toàn bộ phản ứng ECHO, chấm sao, đoạn truyện, lối đi từng bước của người mới, bảng trường hợp biên có đánh dấu test tự động, và bản nháp JSON đầy đủ.
2. Code khởi đầu cho đúng ba khám phá theo thứ tự: lần 1 `NameError` dòng 13; lần 2 chạy được, `so_hieu` giữ chữ `'goi_3'`, `khu_cu` và hai thiết bị sai; lần 3 (sau khi sửa dấu nháy) chỉ còn lỗi thứ tự. Đã kiểm bằng harness thật.
3. Lời giải chuẩn đạt 3 sao với 9 câu lệnh. Mọi lời giải gõ lại giá trị từ bộ đệm bằng tay (`"AN-5521"`, `"K-07"`, `"K-12"`, hoặc chuỗi thiết bị gõ sẵn) trượt phản công.
4. Không phản ứng miễn phí nào chứa giá trị đáp án của lượt cơ bản hay lượt phản công, tên gói (`goi_1`…`goi_4`) hay các cụm chỉ cách sửa (dấu nháy, hoa thường, đổi chỗ).
5. JSON nháp hợp lệ với validator hiện tại, trừ đúng một khóa phản ứng mới `value_is_label` cần thêm vào `REACTION_KEYS`.
6. Các thay đổi engine được liệt kê theo file, có schema, và đều là tùy chọn với level cũ.

## Các lựa chọn đã so sánh

### A. Làm sao chứng minh người chơi dùng lại tên thay vì gõ lại giá trị

1. **Bộ đệm nạp sẵn mang tên vô nghĩa, phản công thay cả bộ đệm (chọn).** Bốn dòng khóa `goi_1`…`goi_4` là gói tin 0xA7 gửi; ki-ốt chỉ đọc các ô có nhãn `ho_ten`, `ma_khu`, `so_hieu`, `khu_cu` và hai thiết bị `the_quet`, `the_cong`. Phản công nạp một hồ sơ kiểm tra khác vào bộ đệm; mọi giá trị gõ tay không đổi theo. Chạy được với harness hiện có. Phụ thuộc nhiều nhất vào giả định: người chơi lấy giá trị từ bộ đệm chứ không viết `ho_ten = "ĐỖ MINH AN"`. Hỏng đầu tiên khi người chơi viết thẳng `the_quet = goi_1 + " / " + goi_4`, bỏ qua các ô nhãn: vẫn đúng giá trị, harness không phân biệt được. Chấp nhận, vì đó vẫn là "dùng tên, không gõ lại giá trị".
2. **Người chơi tự gõ giá trị, chấm bằng AST** (mỗi chuỗi chỉ được xuất hiện một lần trong code). Phụ thuộc vào một loại mục tiêu mới đọc cây cú pháp. Hỏng đầu tiên với những cách viết hợp lệ mà luật đếm không lường (chuỗi trong chú thích, chuỗi ghép từ hai mảnh), và mỗi level sau sẽ muốn một luật AST riêng.
3. **Chấm stdout của thẻ in ra.** Phụ thuộc vào cơ chế của 1.1 chưa có. Hỏng đầu tiên ở chỗ không chứng minh được gì thêm: in ra chuỗi gõ tay vẫn đúng nếu dữ liệu không đổi, nên vẫn cần phản công thay dữ liệu như hướng 1.

### B. Mô phỏng

1. **Biến thể của máy quét.** Rẻ nhất. Hỏng ngay: 6 mục tiêu không vừa 3 làn, và ẩn dụ "gói đi qua cổng" không cho thấy một ô bị ghi đè hay một thiết bị đã đọc giá trị cũ, tức đúng bài học chính của level.
2. **Thành phần mới `kiosk`, chỉ dùng giá trị cuối cùng.** Không đổi harness. Hỏng đầu tiên ở lần chạy 3: thiết bị hiện `… / K-12` trong khi ô `ma_khu` hiện `K-07`, người chơi thấy mâu thuẫn nhưng không thấy vì sao.
3. **Thành phần mới `kiosk` cộng lịch sử gán do harness ghi (chọn).** Harness ghi mỗi lần một biến mục tiêu đổi giá trị (dòng, tên, bản xem trước), có giới hạn. Mô phỏng phát lại đúng thứ tự: ô `ma_khu` nhận K-12, hai thiết bị đọc K-12, rồi ô bị ghi đè thành K-07. Phụ thuộc vào giả định so sánh danh tính đối tượng trong tracer là đủ rẻ và an toàn. Hỏng đầu tiên với code có vòng lặp gán hàng nghìn lần: chặn bằng giới hạn 40 mục và cờ `var_history_truncated`. Nếu thiếu lịch sử (level khác, lỗi biên dịch), thành phần lùi về cách 2.

### C. Bắt lỗi "tên trong dấu nháy"

1. **Dùng chung `wrong_value`.** Không đổi engine. Hỏng đầu tiên ở chất lượng phản hồi: lỗi phổ biến nhất của người mới chỉ nhận câu "không khớp".
2. **Khóa mới `value_is_label` (chọn).** `classify-run.ts` đổi `wrong_value` thành `value_is_label` khi một biến chuỗi sai giá trị đúng bằng tên của một biến đầu vào hoặc mục tiêu (so `preview` với `'<tên>'`), và chỉ khi level có định nghĩa khóa này. Phụ thuộc vào giả định `repr` của chuỗi định danh luôn có dạng `'tên'` (đúng, vì định danh không chứa dấu nháy). Hỏng đầu tiên khi người chơi viết `"goi_3 "` (thừa khoảng trắng): rơi về `wrong_value`, vẫn đúng.

### D. Từ cấm của ECHO

1. **Giữ regex chung.** Không bảo vệ được gì cho 1.2.
2. **Trường tùy chọn `forbidden_terms` mỗi level, cộng với danh sách chung (chọn).** Không phải sửa file 1.4. Phụ thuộc vào cách so khớp chữ có dấu: `\b` của JavaScript không hiểu ký tự tiếng Việt, nên cụm có dấu so bằng `includes` không phân biệt hoa thường, còn định danh ASCII so bằng `\b`.

## Trade-offs

- A1 đổi khả năng bắt buộc dùng đúng ô nhãn lấy việc chấm được bằng harness hiện có. Giả định yếu nhất: người chơi không viết tắt thẳng từ bộ đệm vào thiết bị; khi họ làm vậy, level vẫn cho 3 sao.
- Lời giải không có câu gán lại (`khu_cu = goi_2`, `ma_khu = goi_4`) vẫn đúng giá trị và cũng 9 câu lệnh hoặc ít hơn. Bài học gán lại vẫn đến từ code khởi đầu (câu gán lại có sẵn, đặt sai chỗ) và mô phỏng, không từ luật chấm. Chặn được thì cần chấm theo lịch sử gán, tức biến lịch sử thành tiêu chí chấm; không làm, vì người chơi sẽ bị phạt vì một lời giải đúng.
- B3 đổi một thay đổi harness nhỏ lấy hình ảnh duy nhất giải thích được lỗi thứ tự. Nếu thay đổi này bị hoãn, level vẫn chơi được với B2.
- `alert_limit_statements` 11 (lời giải 9) cho phép thêm hai lệnh `print` để soi; thêm bốn lệnh thì mất sao tàng hình cho tới khi xóa bớt. Đổi độ chặt lấy sự dễ chịu cho level Easy.
- Không chuẩn hóa Unicode khi so chuỗi. Người chơi gõ lại "ĐỖ MINH AN" bằng bộ gõ sinh dấu tổ hợp sẽ sai mà nhìn không thấy khác. Đây chính là bài học "gõ lại bằng tay là rủi ro"; mô phỏng giúp bằng cách không nối ô đó với gói nào trong bộ đệm.

## Better approaches

Không có hướng nào tốt hơn hợp đồng truyện. Hướng đã chọn là hướng mà mục 6.2 ngụ ý ("đặt tên một lần thì sửa một chỗ, mọi chỗ đổi theo"; bằng chứng: phản công thay dữ liệu đầu vào đã chạy được ở 1.4 qua `counter_attack_tests`). Một điểm thêm so với đề bài: ô `khu_cu` (nhật ký ki-ốt giữ mã khu cũ) biến lần sửa K-12 → K-07 thành một mục tiêu kiểm được về thứ tự, và nối thẳng với KTS-05 ("cái tên giữ nguyên, giá trị bị thay… nó không bị xóa ngay"). Chi phí: một mục tiêu thêm và một dòng trong code khởi đầu.

## Hướng đã chọn

- **Bộ đệm khóa** dòng 2–5: `goi_1 = "ĐỖ MINH AN"`, `goi_2 = "K-12"`, `goi_3 = "AN-5521"`, `goi_4 = "K-07"` (gói đến muộn, nêu trong briefing).
- **Sáu mục tiêu, đều `str`:** `ho_ten`, `ma_khu` (sau khi sửa), `so_hieu`, `khu_cu` (mã trước khi sửa), `the_quet` (máy quét drone: họ tên / mã khu), `the_cong` (cổng khu: số hiệu / mã khu).
- **Lỗi cài sẵn:** `Ma_khu` viết hoa (dòng 13), `so_hieu = "goi_3"`, khối gán lại đặt sau hai thiết bị và `khu_cu = ma_khu` đặt sau câu gán lại. Chú thích dòng 16 nói đúng thứ tự cần làm; code làm ngược lại.
- **Ngưỡng:** `alert_limit_statements` 11 (40%); 100% là 27 câu lệnh; từ 28 câu lệnh bị Sentinel bắt.
- **Phản công:** OMNI nạp hồ sơ kiểm tra `LÊ VĂN TỊNH`, `K-31`, `LT-0093`, `K-02`.
- **Mô phỏng `kiosk`** mới, chọn bằng trường `simulation` trong JSON; có lịch sử gán từ harness.
- **Khóa phản ứng mới** `value_is_label`; trường mới `forbidden_terms`.

## Thay đổi engine cần có

| File | Thay đổi |
|---|---|
| `src/game/level-types.ts` | Thêm `"value_is_label"` vào `REACTION_KEYS`. Thêm vào `LevelDefinition` các trường tùy chọn: `simulation?: { kind: "scanner" } \| { kind: "kiosk"; devices: string[] }`, `forbidden_terms?: string[]` (cùng `location`, `component`, `outro_beats` mà thiết kế mở đầu đã định) |
| `src/game/validate-level.ts` | Kiểm `simulation.kind` thuộc danh sách; `devices` khác rỗng, không trùng, là tên mục tiêu; `forbidden_terms` là mảng chuỗi khác rỗng |
| `src/engine/python/harness.py` | Khi config có `trace_vars: true`: trong `local_tracer`, ở mỗi sự kiện `line`, so từng biến mục tiêu trong `ns` với lần thấy trước bằng `is` (không gọi `__eq__` của người chơi); khi đổi, thêm `{line, var, type, preview}` với `line` là dòng câu lệnh vừa chạy xong. So lần cuối sau `exec` (kể cả khi lỗi). Tối đa 40 mục, quá thì đặt `var_history_truncated`. Kết quả mỗi test có thêm `var_history` |
| `src/engine/harness-types.ts` | `HarnessTestResult.var_history?`, `var_history_truncated?` |
| `src/game/build-config.ts` | `trace_vars: level.simulation?.kind === "kiosk"` |
| `src/game/classify-run.ts` | Trong `failureKey`, trước `wrong_value`: nếu level có `reactions.value_is_label` và có biến chuỗi sai giá trị mà `preview` bằng `'<tên>'` của một biến đầu vào hoặc mục tiêu, trả `value_is_label` với `vars` là các biến đó. Chuyển `var_history` sang `RunOutcome` (`history`, `counterHistory`) |
| `src/game/echo-forbidden-terms.test.ts` | Cấm hợp của danh sách chung và `level.forbidden_terms`; định danh ASCII so bằng `\b`, cụm có dấu so bằng `includes` không phân biệt hoa thường |
| `src/ui/kiosk-timeline.ts` + `src/ui/kiosk-simulation.tsx` (mới) | Dựng khung hình thuần từ `RunOutcome` như `scanner-timeline.ts`; phát lại bằng cùng cơ chế khung hình, cue và giảm chuyển động |
| `src/ui/game-screen.tsx` | Chọn thành phần mô phỏng theo `level.simulation?.kind`; tiêu đề ô mô phỏng lấy từ `level.location` (thiết kế mở đầu đã yêu cầu); chú giải 4 màu kiểu chỉ hiện với máy quét |
| `src/game/terminal-lines.ts` (nhỏ, khuyến nghị) | Dòng mở "gửi tín hiệu tới máy quét" thành trung tính ("gửi tín hiệu") hoặc lấy theo loại mô phỏng |

Không cần đổi `prepare-source.ts`, `compute-stars.ts`, `alert.ts`, worker hay giao thức worker.

## Rủi ro

- **Tracer chậm hơn.** Mỗi sự kiện dòng thêm 6 lần tra từ điển và so `is`. Với ngân sách 100.000 sự kiện vẫn nhỏ, nhưng cần đo trên Pyodide. Chỉ bật cho level `kiosk`.
- **Người chơi gán vào tên gói** (`goi_4 = "K-99"`): được phép, vì mỗi test nạp lại bộ đệm; giá trị sai sẽ bị chấm sai. Đã ghi trong bảng biên.
- **Câu chữ terminal của 1.4** ("MÁY QUÉT TỪ CHỐI", "CỔNG: MỞ MỘT NỬA") vẫn dùng ở 1.2. "Cổng" khớp vì có thiết bị cổng khu; "máy quét từ chối" chỉ hiện khi sai kiểu, hiếm ở 1.2.
- **6 mục tiêu** làm cột Nhiệm vụ dài hơn 1.4; cột tự cuộn nên không vỡ bố cục, nhưng cần xem trên điện thoại.
- **Phụ thuộc 1.1:** nếu 1.1 không dạy `print(tên_biến)` hay nối chuỗi, hai dòng thiết bị và hai lệnh `print` là kiến thức mới đọc hiểu. Đã giữ chúng ở dạng viết sẵn.
- **Lộ đáp án qua briefing:** briefing nói rõ K-12, K-07, AN-5521. Đó là dữ kiện truyện bắt buộc, không phải lời giải; lời giải là cách lấy chúng từ bộ đệm.

## Câu hỏi còn mở

Các câu dưới đây đã được tự chốt để không chặn công việc; người dùng có thể đổi.

1. **Bộ đệm mang tên `goi_1`…`goi_4`, người chơi gắn nhãn cho chúng.** Thay vì để người chơi gõ giá trị. Lý do: chỉ cách này cho phép phản công chứng minh việc dùng lại tên.
2. **Gói sửa K-07 nằm sẵn trong bộ đệm (`goi_4`)** và được nêu ở cuối briefing như "gói đến muộn", không xuất hiện giữa lúc chơi. Một sự kiện giữa level cần cơ chế mới.
3. **Lời giải không có câu gán lại vẫn được 3 sao.** Không chấm theo lịch sử gán.
4. **Thêm mục tiêu `khu_cu`** (nhật ký giữ mã khu cũ). Không có trong mục 6.2 nhưng không trái sự thật nào; nối với KTS-05.
5. **Ngưỡng tàng hình 11 câu lệnh** cho lời giải 9 câu lệnh.
6. **Hồ sơ kiểm tra của OMNI dùng tên "LÊ VĂN TỊNH"**, một tên mồi mới, không thuộc bảng tên cố định.
7. **Khóa phản ứng mới `value_is_label`** và **trường `forbidden_terms`** là thay đổi schema chung; level cũ không bị ảnh hưởng.
8. **Thêm lịch sử gán vào harness** (chỉ bật cho mô phỏng ki-ốt). Nếu bị hoãn, mô phỏng lùi về chỉ hiện giá trị cuối.
9. **Không chuẩn hóa Unicode** khi so chuỗi.
10. **`simulation` là object** (`kind`, `devices`), không phải chuỗi, để ki-ốt biết biến nào là thiết bị mà không cần thêm trường vào từng mục tiêu.
11. Cần người soạn 1.1 xác nhận 1.1 có dạy nối chuỗi bằng `+` và `print` một biến hay không; nếu có, gợi ý 3 của 1.2 có thể ngắn hơn.

# Brainstorm: Level 1.1 "Khởi động" (`print`, chuỗi)

Ngày: 2026-10-25. Chạy tự động, không hỏi được người dùng. Mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế level: `design/chuong-1/gdd-1.1-khoi-dong.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 1, 5.2, 6.1.
Nguồn đã đọc: `CLAUDE.md`, `design/gdd.md` (4.1, 4.2, 4.5, 7, 7.1), `design/chuong-1/gdd-1.4-tin-hieu-lech-pha.md`, `src/levels/level-1-4.json`, `src/game/level-types.ts`, `src/game/validate-level.ts`, `src/engine/python/harness.py`, `src/engine/harness-types.ts`, `src/game/build-config.ts`, `src/game/classify-run.ts`, `src/game/compute-stars.ts`, `src/game/alert.ts`, `src/game/echo-reactions.ts`, `src/game/echo-forbidden-terms.test.ts`, `src/game/terminal-lines.ts`, `src/ui/scanner-simulation.tsx`, `src/ui/scanner-timeline.ts`, `src/ui/objectives-panel.tsx`, `src/ui/game-screen.tsx`, `src/ui/intro-gate.tsx`, `docs/nhat-ky-loi-prototype-1-4.md`.

## Hiện trạng (đã kiểm trong mã nguồn)

- Mục tiêu chỉ có một loại: biến (`{var, type, label}`), chấm bằng kiểu chính xác và giá trị. `validate-level.ts` bắt buộc `type` thuộc `int|float|str|bool`.
- Harness gom stdout vào `_CappedWriter` (8.000 ký tự, 200 dòng) và trả về `stdout`, nhưng không chấm nó. `sys.stderr` đang ghi chung vào cùng bộ đệm với stdout.
- `_passed()` trong harness và `passed()` trong `classify-run.ts` chỉ xét `status == "ok"` và các biến. Lượt phản công chỉ chạy khi lượt cơ bản đạt.
- `compute-stars.ts`: không có test phản công thì tối đa 2 sao. `design/gdd-mo-dau.md` mục 5.5 tính tổng sao chương là 12 cho bốn level, tức là mỗi level phải lấy được 3 sao.
- Mô phỏng (`scanner-timeline.ts`, `scanner-simulation.tsx`) dựng làn theo từng biến mục tiêu, tô màu theo kiểu, độ rộng gói theo độ dài chuỗi. Tiêu đề ô mô phỏng ("Cổng phía Bắc"), dòng phụ của ô Mục tiêu ("máy quét chỉ đọc hình dạng") và dòng đầu terminal ("gửi tín hiệu tới máy quét") đều viết cứng cho 1.4.
- Test từ cấm (`echo-forbidden-terms.test.ts`) dùng một regex chung `int|float|round` cho mọi level, cộng các giá trị `expected` của test làm đáp án cấm.
- Python 3.13 cho các thông báo hữu ích với người mới: `print(PHIEN)` → `NameError: name 'PHIEN' is not defined`; `print "x"` → `SyntaxError: Missing parentheses in call to 'print'…`; `print("x"` → `'(' was never closed`; dấu nháy cong `“` → `invalid character '“' (U+201C)` (đã chạy thử bằng `python3`).

## Outcome

Một sinh viên chưa từng viết dòng code nào vào 1.1, chạy thử bản nháp có lỗi, đọc được terminal, sửa đúng ba dòng `print` để trạm R-17 phát gói bắt tay vào Mạng Mù, và hiểu được khác biệt cốt lõi của chuỗi: chữ trong dấu nháy được phát nguyên văn, còn một cái tên không có dấu nháy thì Python đi tra trong bộ nhớ. Sao thứ ba yêu cầu in mã phiên qua tên của nó, nên ai chép cứng mã phiên sẽ trượt khi trạm khởi động lại. Engine có thêm một loại mục tiêu chấm theo từng dòng đầu ra, đủ tổng quát để 1.6 (`input`, f-string) dùng lại.

## Constraints

- Theo đúng hợp đồng `design/gdd-mo-dau.md` mục 6.1: địa điểm, tình huống, thành phần "Tiêu đề tín hiệu", mảnh nhật ký KTS-01, các nhịp truyện và móc câu 0xA7. ECHO không tự giới thiệu và không dùng từ "hình dạng" (từ đó bắt đầu từ 1.3).
- Level là dữ liệu: 1.1 chỉ cần một file JSON cộng các thay đổi engine dùng chung. Không viết cứng gì riêng cho 1.1 trong mã.
- Sao chỉ quyết định ở `compute-stars.ts`, không đổi luật sao. Dòng khóa không tính câu lệnh; đầu vào được nạp vào namespace.
- Phản ứng ECHO miễn phí không nói cách sửa, không trích đáp án; có test tự động kiểm.
- Mô phỏng chạy lại sau khi có kết quả (không chạy trực tiếp), SVG/CSS, tôn trọng giảm chuyển động, dùng được ở bề rộng điện thoại.
- Ba người soạn 1.1–1.3 làm song song: tôi chỉ viết hai file của 1.1.

## Non-goals

- Viết code, sửa engine, sửa file của 1.2 hoặc 1.3.
- Hướng dẫn kiểu tour giao diện nhiều bước, lớp phủ che màn, hay một chế độ "tutorial" riêng.
- Dạy biến và phép gán. Dòng khóa `ma_phien = "K7Q2"` chỉ được đọc, không được giải thích như một khái niệm; 1.2 mới dạy nó.
- Ký tự có dấu trong đầu ra cần khớp; xử lý dấu nháy cong tự động trong editor.
- Điểm giải mã cho gợi ý (vẫn mở miễn phí như prototype).

## Acceptance criteria

1. `design/chuong-1/gdd-1.1-khoi-dong.md` theo cấu trúc GDD 1.4, có thêm mục "Người chơi lần lượt làm gì", bảng trường hợp biên có đánh dấu cần test tự động hay không, và bản nháp JSON đầy đủ của level.
2. Bản nháp JSON qua được validator sau khi áp các thay đổi schema ở mục "Thay đổi engine" dưới đây (kiểu mục tiêu `output_line`, `expected_output`, `simulation`, `forbidden_terms`, các trường truyện của mục 5.2).
3. Có 3 sao đạt được, có lỗi cài sẵn dạy đúng khái niệm, có phản công bắt lỗi chép cứng, có 3 gợi ý và đủ phản ứng ECHO cho mọi khóa có thể xảy ra ở 1.1.
4. Không phản ứng miễn phí nào chứa từ cấm của level hay một dòng đầu ra mong đợi.
5. Có đề xuất thay đổi engine nhỏ nhất, nêu đúng tên file, đủ tổng quát cho 1.6.

## Các lựa chọn đã so sánh

### A. Chấm đầu ra `print`

1. **Mục tiêu kiểu `output_line` cộng `expected_output` trong mỗi test (chọn).** Mỗi dòng đầu ra mong đợi là một mục tiêu có nhãn; harness so từng dòng và trả về vị trí ký tự sai đầu tiên. Phụ thuộc nhiều nhất vào giả định "đúng" nghĩa là đúng từng dòng sau một luật chuẩn hóa cố định. Hỏng đầu tiên nếu một level sau cần so khớp lỏng hơn (ví dụ bỏ qua hoa thường); khi đó thêm một cờ so khớp là việc cục bộ.
2. **Bọc `print` để ghi đầu ra vào một biến ẩn rồi chấm như mục tiêu `str`.** Không phải đổi schema mục tiêu. Hỏng ngay ở trải nghiệm: chỉ biết đúng hay sai cả khối, không có "sai ký tự ở vị trí…", không phân biệt thiếu dòng và thừa dòng; và `print` bị thay thì `print(..., end=...)`, `sep=` phải giả lập lại.
3. **Chấm mã nguồn (so chuỗi trong lệnh `print`).** Hỏng đầu tiên với mọi lời giải tương đương: `print("PHIEN", ma_phien)` và `print("PHIEN " + ma_phien)` cho cùng đầu ra nhưng mã khác. Dạy sai điều cần dạy.

### B. OMNI phản công khi người chơi chỉ biết `print` và chuỗi

1. **Một dòng khóa đầu vào `ma_phien` được nạp sẵn, dòng đầu ra thứ hai phải chứa nó (chọn).** Phản công đổi mã phiên; ai chép cứng giá trị trượt. Phụ thuộc vào giả định người mới đọc được một dòng `tên = "giá trị"` mà không cần học phép gán. Hỏng đầu tiên nếu người chơi coi dòng khóa là thứ phải chép lại; được giảm bằng lỗi cài sẵn: `print(PHIEN, ma_phien)` cho thấy ngay `PHIEN` (không có tên) vỡ còn `ma_phien` (có tên) chạy được.
2. **Không có phản công, tối đa 2 sao.** Phụ thuộc vào giả định người chơi chấp nhận level đầu không có 3 sao. Hỏng đầu tiên ở tổng sao chương (12 cho bốn level, `gdd-mo-dau.md` 5.5) và ở thói quen: level đầu tiên dạy rằng sao thứ ba không tồn tại.
3. **Điều kiện sao thứ ba khác (ví dụ qua trong ít lượt chạy).** Phải sửa `compute-stars.ts` và thêm trạng thái. Hỏng đầu tiên ở tinh thần GDD 4: chạy thử không giới hạn và không bị phạt.

### C. Mô phỏng

1. **Thành phần mới `RelaySimulation` (trạm R-17), dùng chung cơ chế phát lại khung hình với máy quét (chọn).** JSON chọn bằng `"simulation": "relay"`. Phụ thuộc vào giả định các level sau chỉ cần một vài kiểu mô phỏng. Hỏng đầu tiên nếu mỗi level đòi một mô phỏng riêng; khi đó cần một registry nhỏ, vẫn là việc cục bộ.
2. **Dùng lại máy quét, mỗi dòng đầu ra là một làn.** Rẻ nhất. Hỏng ngay ở ý nghĩa: máy quét tô màu theo kiểu và nói "SAI KIỂU", trong khi 1.1 không có kiểu nào ngoài chữ; nó không có chỗ cho dòng "cần/nhận" và ký tự sai được tô.

### D. Từ cấm cho ECHO

1. **Trường `forbidden_terms` theo level, cộng với danh sách chung hiện có, cộng các dòng `expected_output` tự động coi là đáp án (chọn).** `gdd-mo-dau.md` 5.2 đã cần "từ cấm của level đó" cho lời ECHO trong `outro_beats`, nên trường này cần dù sao.
2. **Chỉ giữ regex chung.** Hỏng ở 1.1: thứ làm lộ cách sửa ở đây là `ma_phien`, dấu nháy, "dấu phẩy", không phải `int`.

## Trade-offs

- A1 đổi một thay đổi schema (loại mục tiêu thứ hai) lấy phản hồi theo từng ký tự, đúng điều 1.1 muốn dạy, và dùng lại được ở 1.6.
- B1 đổi việc người chơi thấy trước một dòng có dấu `=` (khái niệm của 1.2) lấy một phản công có nghĩa và bài học chữ khác tên, là hiểu lầm số một về chuỗi.
- C1 đổi một thành phần SVG mới lấy mô phỏng đúng nghĩa truyện; tách hook phát lại khung hình để không lặp mã.
- Ngưỡng cảnh báo 4 câu lệnh (lời giải tối thiểu 3) đổi việc sao thứ hai gần như tự đến lấy việc người mới không bị phạt vì một dòng phụ; thanh cảnh báo ở 1.1 chủ yếu là giới thiệu.

## Better approaches

Đề bài gợi ý một loại mục tiêu stdout cho cả khối đầu ra. Tốt hơn một chút là **một mục tiêu cho mỗi dòng** (`output_line`): ô Mục tiêu đánh dấu đạt hoặc chưa đạt cho từng dòng như với biến ở 1.4, mô phỏng có sẵn đơn vị "gói tin = một dòng", và 1.6 cần đúng dạng này (mỗi câu trả lời một dòng). Chi phí chuyển: không có, vì chưa có mã nào cho loại mục tiêu này.

## Hướng đã chọn

- **Code khởi đầu** có 3 lệnh `print`: dòng 1 đúng sẵn làm mẫu, dòng 2 `print(PHIEN, ma_phien)` vỡ `NameError`, dòng 3 viết thường nên trạm bỏ gói. Lời giải 3 sao: `print("PHIEN", ma_phien)` (hoặc nối chuỗi), 3 câu lệnh.
- **Đầu ra mong đợi:** `NID/2089`, `PHIEN K7Q2`, `LO17 CAN LIEN LAC`. Phản công: trạm khởi động lại vì OMNI quét lưới điện, mã phiên thành `M4X8`.
- **Ngưỡng cảnh báo:** 4 câu lệnh (40%); 100% là 10; từ 11 câu lệnh trở lên bị bắt.
- **Hướng dẫn lần đầu:** briefing nói trong bối cảnh phải gõ ở đâu và bấm gì; câu `entry` của ECHO bảo chạy thử một lần trước khi sửa; nút CHẠY có vòng sáng nhẹ cho tới lượt chạy đầu tiên của level (áp cho mọi level, không thêm trường).
- **Mô phỏng:** `RelaySimulation`: laptop → dây → ăng-ten R-17 → Mạng Mù; danh sách phát bằng HTML có dòng "cần/nhận" và ký tự sai được tô.

## Thay đổi engine cần có

| File | Thay đổi |
|---|---|
| `src/game/level-types.ts` | `Objective` thành hợp của `VarObjective {kind?: "var", var, type, label}` và `OutputLineObjective {kind: "output_line", line, label}`. `TestCase.expected_output?: string[]`. `LevelDefinition` thêm `simulation?: "scanner" \| "relay"`, `forbidden_terms?: string[]` (cùng `location`, `component`, `outro_beats` của mục 5.2 nếu chưa ai thêm). `REACTION_KEYS` thêm `output_missing`, `output_mismatch`, `output_case_only`, `output_extra` |
| `src/game/validate-level.ts` | Kiểm hai loại mục tiêu; các `output_line` phải là 1..N liên tiếp, không trùng; mỗi test và test phản công phải có `expected_output` đúng N chuỗi, không chứa `\n`, không có khoảng trắng cuối; `expected` chỉ cần chứa biến của mục tiêu `var`; `simulation` thuộc danh sách; `forbidden_terms` là mảng chuỗi; lời ECHO trong `outro_beats` không chứa từ cấm |
| `src/engine/python/harness.py` | Hàm so khớp đầu ra (mục dưới). Tách `sys.stderr` sang một bộ đệm riêng, không chấm (vẫn trả về để hiển thị). `_passed()` xét thêm `output.ok`. Giữ bản riêng của `unicodedata.normalize` như đã làm với `math`, `json` |
| `src/engine/harness-types.ts` | `HarnessTestResult.output: HarnessOutput \| null`, `stderr: string` |
| `src/game/build-config.ts` | Gửi `kind` và `line` của mục tiêu; mục tiêu `var` giữ nguyên dạng cũ |
| `src/game/classify-run.ts` | `OutputVerdict[]` cho lượt cơ bản và phản công; `passed()` xét đầu ra; thứ tự phân loại: lỗi chạy → biến → dòng đầu ra sai đầu tiên tính từ trên (`output_case_only`/`output_mismatch`/`output_missing`) → `output_extra`. Phản công sai đầu ra dùng lại `wrong_value_counter`. `OutcomeDetails` thêm `out_line`, `col` |
| `src/game/terminal-lines.ts` | Dòng kết quả cho từng dòng đầu ra (đã phát / bỏ gói ở vị trí…, cặp "cần/nhận"); từ vựng theo `simulation` cho dòng đầu ("phát qua trạm R-17" thay vì "gửi tới máy quét") và dòng kết ("KÊNH" thay vì "CỔNG") |
| `src/game/echo-forbidden-terms.test.ts` | Ghép danh sách chung với `forbidden_terms` của level; thêm mọi dòng `expected_output` vào tập đáp án; khớp nguyên từ theo ranh giới chữ Unicode, từ chỉ gồm dấu câu thì khớp chuỗi con |
| `src/ui/objectives-panel.tsx` | Vẽ mục tiêu `output_line` (nhãn "dòng N" thay cho chip kiểu), dòng phụ của ô theo `simulation` |
| `src/ui/game-screen.tsx` | Chọn `ScannerSimulation` hay `RelaySimulation` theo `simulation`; tiêu đề ô từ `location`; chú giải 4 màu kiểu chỉ hiện với máy quét |
| `src/ui/run-controls.tsx`, `src/styles/global.css` | Vòng sáng nhẹ trên nút CHẠY khi `progress.runs === 0`; viền tĩnh khi giảm chuyển động |
| Mới: `src/ui/relay-timeline.ts` (+ test), `src/ui/relay-simulation.tsx`, `src/ui/use-timeline-playback.ts` | Dòng thời gian thuần cho trạm R-17; hook phát lại khung hình tách từ `scanner-simulation.tsx` để hai mô phỏng dùng chung |
| Mới: `src/levels/level-1-1.json` | Theo bản nháp trong GDD 1.1 |

### Luật so khớp đầu ra (cố định, không cấu hình)

1. Lấy stdout của lượt chạy (không gồm stderr). Đổi `\r\n` và `\r` thành `\n`, chuẩn hóa NFC cả hai phía.
2. Tách dòng. Bỏ khoảng trắng ở cuối mỗi dòng. Bỏ các dòng rỗng ở cuối toàn bộ đầu ra.
3. So từng dòng với `expected_output[i]`: phải bằng nhau tuyệt đối (hoa thường, khoảng trắng đầu dòng và giữa dòng, từng điểm mã Unicode).
4. Đầu ra bị cắt (quá 8.000 ký tự hoặc 200 dòng) thì không đạt.
5. Đầu ra vẫn được so khi lượt chạy dừng vì lỗi, để mô phỏng và terminal cho thấy các dòng đã kịp phát; nhưng lượt đó không đạt.

Báo cáo của harness cho mỗi test:

```json
"output": {
  "ok": false,
  "truncated": false,
  "lines": [
    {"line": 1, "expected": "NID/2089", "actual": "NID/2089", "status": "ok", "col": null, "case_only": false},
    {"line": 2, "expected": "PHIEN K7Q2", "actual": "PHIEN", "status": "wrong", "col": 6, "case_only": false},
    {"line": 3, "expected": "LO17 CAN LIEN LAC", "actual": null, "status": "missing", "col": null, "case_only": false}
  ],
  "extra_lines": ["XIN CHAO"],
  "extra_count": 1
}
```

`col` là vị trí ký tự sai đầu tiên, đếm từ 1; nếu dòng nhận được ngắn hơn và là phần đầu của dòng cần, `col` là độ dài dòng nhận cộng 1. `case_only` đúng khi hai dòng bằng nhau sau `casefold()`. `actual` cắt ở 80 ký tự như `preview`. `extra_lines` giữ tối đa 3 dòng.

## Rủi ro

- **Dòng `ma_phien = "K7Q2"` lộ trước khái niệm của 1.2.** Người chơi có thể nghĩ phải chép lại giá trị. Giảm bằng lỗi cài sẵn (cùng dòng có một tên vỡ và một tên chạy được) và gợi ý 2. Nếu thử nghiệm với lớp học cho thấy rối, phương án lui: bỏ phản công ở 1.1 và chấp nhận tối đa 2 sao.
- **Dấu nháy cong từ bàn phím điện thoại hoặc khi dán từ tài liệu.** Python báo `invalid character '“'`, đủ rõ, nhưng người mới có thể không nhận ra hai dấu nháy khác nhau. Ghi nhận; không tự thay ký tự trong editor.
- **Nhiều thay đổi dùng chung trong một lần.** `output_line`, `forbidden_terms`, `simulation`, `location` chạm cùng `level-types.ts` và `validate-level.ts` mà người soạn 1.2, 1.3 cũng có thể đề xuất sửa. Cần một người làm engine gộp các đề xuất rồi mới làm.
- **Ngưỡng 4 câu lệnh làm sao thứ hai gần như tự đến.** Chấp nhận ở level đầu; 1.2 trở đi có thể chặt hơn.
- **Vị trí ký tự với chữ tổ hợp.** NFC làm hầu hết chữ Việt thành một điểm mã, nhưng ký tự ghép lạ vẫn có thể lệch một vị trí khi hiển thị. Đầu ra mong đợi của 1.1 là ASCII nên không ảnh hưởng 1.1.
- **Từ vựng terminal và ô Mục tiêu đang viết cứng cho máy quét.** Nếu quên đổi, 1.1 sẽ hiện "gửi tín hiệu tới máy quét", sai truyện.

## Câu hỏi còn mở

Các câu dưới đây đã được tự chốt để không chặn công việc; người dùng có thể đổi.

1. **Phản công dùng dòng khóa `ma_phien`** (đầu vào nạp sẵn, được đổi thành `M4X8` khi phản công). Phương án lui nếu lớp học thấy rối: không có phản công, tối đa 2 sao.
2. **Luật so khớp:** bỏ khoảng trắng cuối dòng và dòng rỗng ở cuối; còn lại phải khớp tuyệt đối, kể cả hoa thường; chuẩn hóa NFC. Không có cờ cấu hình theo level.
3. **Một mục tiêu cho mỗi dòng đầu ra** (`output_line`). Dòng thừa không có mục tiêu riêng; nó hiện ở terminal, mô phỏng và lời ECHO.
4. **Đầu ra mong đợi viết không dấu** (giao thức cũ của trạm), để tránh lỗi bộ gõ ở người mới.
5. **Ngưỡng cảnh báo 4 câu lệnh.**
6. **Vòng sáng trên nút CHẠY trước lượt chạy đầu tiên áp cho mọi level**, không thêm trường JSON.
7. **Phản công sai đầu ra dùng lại khóa `wrong_value_counter`**, không thêm khóa `counter_output_*`.
8. **Các khóa phản ứng về biến (`type_mismatch`, `type_mismatch_value_match`, `wrong_value`, `missing_var`, `counter_type_mismatch`) và `two_stars` không có trong JSON 1.1**, vì level không có mục tiêu biến và `two_stars` chỉ dùng khi level không có phản công; nếu xảy ra thì rơi về `generic`.
9. **Nội dung đầu ra** (`NID/2089`, `PHIEN K7Q2`, `LO17 CAN LIEN LAC`) và mã phiên `K7Q2`/`M4X8` do tôi đặt. Cụm `NID/2089` lấy từ ví dụ trong `gdd-mo-dau.md` 6.1.
10. **stderr tách khỏi stdout** và không được chấm; terminal vẫn hiện nó dưới nhãn riêng.
11. **Ai gộp các đề xuất schema của 1.1–1.3** trước khi làm engine: chưa có người được giao.

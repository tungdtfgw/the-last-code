# Level 2.3 – "Hai ngả"

> Chương 2 – Trạm Sentinel · Độ khó: Easy · Khái niệm: `else`; dòng viết sau khối (không thụt lề) luôn chạy
> Câu đố: `src/levels/level-2-3.json` (chưa dựng). Câu chữ người chơi đọc: tài liệu `level:2.3` ở D1 (câu ban đầu sẽ vào `db/migrations/0013_content_level_2_3.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Trục truyện và phác câu đố: `design/gdd-chuong-2.md` mục 6.3. Hợp đồng engine (thắng GDD này khi lệch): `docs/hop-dong-engine-chuong-2.md`. Brainstorm: `design/quyet-dinh/level-2-3-hai-nga.md`.
> Mọi con số trong tài liệu này đo bằng `run_level` thật ngày 30/10/2026 trên python3 3.13.2, chạy lại trên 3.14.8 cho cùng kết quả. `wrong_branch` và `skipped_lines` chưa có trong mã; khóa và dòng mờ ghi ở đây suy ra theo hợp đồng engine mục 5.1 và 6.

## 1. Bối cảnh

Qua Hàng Rào Ngoài, Kai vào Bãi Container: một bãi hàng bỏ hoang, các dãy container xếp thành lối hẹp. Trên tháp ở đầu bãi, một đèn pha quét qua quét lại. Mỗi lần đèn dừng, Kai chỉ có hai ngả: chạy sang phải hoặc sang trái, về phía đèn không chiếu. Không lúc nào được đứng yên, cũng không được chạy cả hai hướng.

## 2. Mục tiêu học

Người chơi rời màn biết:

- `else` phủ đúng phần còn lại của điều kiện: không sót trường hợp nào, không chồng lên nhánh `if`. Nó không có điều kiện riêng.
- Đúng một trong hai nhánh chạy. Chỗ hai `if` rời để hở (`< 90` và `> 90`) là lúc chương trình "đứng yên"; chỗ hai `if` chồng nhau là lúc nó "chạy hai hướng".
- Dòng viết sau khối, không thụt lề, chạy trong mọi trường hợp. Dòng thụt lề nằm trong khối chỉ chạy khi khối đó chạy.
- Gán một biến ở cả hai nhánh thì sau khối biến luôn có giá trị. Gán ở một nhánh thôi thì có lúc biến không tồn tại.

Không dạy: `elif` (2.4), `and`/`or`/`not` (2.5), biểu thức `a if c else b` (được chấp nhận nhưng không dạy, hợp đồng engine mục 3).

## 3. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.3`).

Briefing là nhật ký điều khiển đèn pha của Bãi Container, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- đèn pha báo góc của nó theo độ, đo từ mép trái bãi; mỗi lần đèn dừng là một tình huống;
- góc dưới 90 là đèn đang chiếu nửa trái bãi, Kai phải sang phải; từ 90 trở lên (kể cả đúng 90, khi đèn chiếu thẳng xuống lối giữa) là đèn chiếu nửa phải, Kai sang trái;
- mỗi tình huống, bộ điều khiển ghi lại góc đèn vào nhật ký, bất kể Kai chạy hướng nào.

Briefing không nêu từ khóa nào, không viết ký hiệu so sánh. Con số 90 được phép xuất hiện ở briefing và nhãn mục tiêu vì đó là đặc tả (luật cấm chỉ áp cho câu ECHO).

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: Vành Sentinel, Bãi Container.

### 3.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.3`) (4 bước). Giọng hướng dẫn, chủ ngữ "bạn". Không chứa giá trị mong đợi (`SANG PHAI`, `SANG TRAI`, các dòng `GOC DEN: …`) hay số của tình huống nào. Bốn bước lần lượt nói:

1. bấm CHẠY với mã có sẵn; sau mỗi lượt, dòng mờ trong editor là dòng không chạy ở tình huống đang hiện;
2. sửa để ở mọi tình huống `huong` có đúng một hướng theo luật ở ô Mục tiêu, kể cả khi góc đúng bằng mốc;
3. dòng ghi góc đèn phải in ra ở mọi tình huống; không in thêm dòng nào khác; không sửa dòng khóa;
4. hoàn thành khi cả 2 mục tiêu chuyển thành xanh ở cả ba tình huống; dùng không quá 3 câu lệnh và vẫn đúng khi OMNI đổi góc quét thì được thêm sao.

## 4. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (biến `huong`, dòng in 1); khung chat ECHO | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng `patrol`: dải tuần tra ở Bãi Container (mục 7) |

## 5. Code khởi đầu (có lỗi cài sẵn)

```python
# Góc đèn pha đo được (KHÔNG được sửa dòng này)
goc_den = 45

# Đèn chiếu về phía nào thì Kai chạy về phía kia.
if goc_den < 90:
    huong = "SANG PHAI"
if goc_den > 90:
    huong = "SANG TRAI"
    print(f"GOC DEN: {goc_den}")
```

Dòng 2 khóa, nạp qua `inputs` (`goc_den` là số nguyên). Đây là phác thảo của `design/gdd-chuong-2.md` mục 6.3 với một thay đổi: quyết định là biến `huong`, không phải dòng in (lý do ở mục 6 và trong brainstorm). Hai lỗi cài sẵn, không lỗi nào có traceback:

| Dòng | Lỗi | Python cho ra | Bài học |
|---|---|---|---|
| 9 | Dòng in góc thụt lề, nằm trong khối của `if` thứ hai | Tình huống 1 (góc 45) không in gì | Dòng thuộc khối nào là do thụt lề quyết định; dòng chạy mọi lúc phải nằm sau khối |
| 5, 7 | Hai `if` rời, hở đúng ở 90 | Tình huống 3 (góc 90) không nhánh nào chạy, `huong` không tồn tại | `else` phủ đúng phần còn lại, không cần viết điều kiện thứ hai |

### 5.1. Chuỗi khóa phản ứng qua các lượt (đã đo)

| Lượt | Mã | Kết quả | Khóa | Câu lệnh (3 tình huống) | Dòng mờ ở tình huống hiện |
|---|---|---|---|---|---|
| 1 | Code khởi đầu | Tình huống 1: `huong` đúng, dòng 1 thiếu | `output_missing`, `out_line` 1, `round` 1 | 3, 4, 2 | 8, 9 |
| 2 | Bỏ thụt lề dòng 9 | Tình huống 1, 2 qua; tình huống 3: `huong` không có | `missing_var`, `vars` `huong`, `round` 3 | 4, 4, 3 | 6, 8 |
| 3a | Đổi `>` thành `>=` (hai `if` rời bù nhau) | Đúng cả ba, nhưng 4 câu lệnh | `alert_exceeded`, 1 sao | 4, 4, 4 | 8 (tình huống 1) |
| 3b | Thay `if goc_den > 90:` bằng `else:` | Đúng, phản công qua | `three_stars`, 3 sao | 3, 3, 3 | 8 (tình huống 1) |

Lượt 2 là chỗ mạnh nhất của màn: ở tình huống 3 cả dòng 6 lẫn dòng 8 mờ, người chơi thấy tận mắt không nhánh nào chạy. Mô phỏng vẽ Kai đứng yên giữa lối (mục 7.1).

## 6. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.3`). Nhãn ghi luật bằng lời và được nêu hai chữ `SANG PHAI`, `SANG TRAI` (đó là đặc tả; người chơi cần biết đúng từng ký tự). Nhãn không ghi kết quả của tình huống nào.

| Mục tiêu | Kiểu | Ý của nhãn | Tình huống 1 (góc 45) |
|---|---|---|---|
| `huong` (biến) | `str` | Hướng Kai chạy: `SANG PHAI` khi góc đèn dưới 90, còn lại `SANG TRAI` | `SANG PHAI` |
| dòng 1 (`output_line`) | | `GOC DEN:`, một dấu cách, rồi góc đèn | `GOC DEN: 45` |

- Không dòng thừa. Chương trình chạy hết, không lỗi. Luật so khớp như 1.1 (NFC, bỏ khoảng trắng cuối dòng).
- **Mức cảnh báo ≤ 40%** (≤ 3 câu lệnh; 100% = 7).

**Vì sao quyết định là biến, không phải dòng in.** Phác thảo cũ in hướng ở dòng 1. Khi đó lời giải `if/else` in trong từng nhánh tốn 3 câu, còn hai `if` rời và lối "gán biến rồi in một lần" cùng tốn 4 câu: không ngưỡng nào vừa phạt hai `if` rời vừa tha lối gán rồi in (báo cáo validate khung, điều chỉnh 1). Đặt hướng vào biến `huong` thì lối gán là lối duy nhất, và đo được: `if/else` 3 câu, hai `if` rời 4 câu, gán mặc định rồi đổi (lối của 2.2) 4 câu. Ngưỡng 3 phân biệt đúng cấu trúc màn dạy mà không phạt cách viết sạch nào.

## 7. Diễn biến khi chạy (mô phỏng `patrol`)

`"simulation": { "kind": "patrol", "decision": { "var": "huong" } }`. Ba tình huống cơ bản, mỗi tình huống một lần đèn pha dừng. Bảng cảm biến hiện chip `goc_den`. Chip của Kai hiện giá trị `huong`. Dòng `GOC DEN: …` đi vào danh sách dòng in dùng chung (`output-slots`), như mục tiêu dòng in khác của Boss (hợp đồng engine mục 2). Nếu nhánh hạ tầng muốn, đèn pha có thể xoay theo `goc_den`; GDD này không đòi.

### 7.1. Bảng biên cho timeline (trạng thái timeline phải vẽ)

| Trạng thái | Khi nào (đã đo) | Timeline vẽ |
|---|---|---|
| Tình huống qua | `huong` và dòng 1 đúng | Kai đi qua, "DRONE BỎ QUA" |
| Quyết định đúng, dòng in thiếu | Code khởi đầu, tình huống 1 | Chip của Kai xanh, ô dòng 1 đỏ "thiếu". Tình huống vẫn trượt: đèn khóa vào Kai, "BỊ PHÁT HIỆN" (tình huống đạt khi mọi mục tiêu đúng, theo `RoundVerdict.passed`) |
| Không có quyết định | Lượt 2, tình huống 3 (`missing_var`) | Chip của Kai trống, Kai đứng yên giữa lối, đèn khóa vào Kai |
| Quyết định của tình huống khác | `wrong_branch` (đảo nhánh, `<= 90`, viết cứng) | Chip đỏ, ô cần/nhận cạnh nhau, "BỊ PHÁT HIỆN" |
| In thêm dòng (`print(huong)`) | `output_mismatch` ở dòng 1, cột 1 | Ô dòng 1 đỏ, dòng thừa ở cuối danh sách |
| Lỗi lúc chạy | Ví dụ `NameError` khi dùng `huong` sau hai `if` hở | Đèn khóa ở tình huống lỗi, nhãn lỗi |
| Lỗi cú pháp, thụt lề | `else` có điều kiện, thân `else` không thụt lề | Không tình huống nào chạy |
| Các tình huống sau tình huống trượt | Mọi lượt trượt | Xám "CHƯA TỚI" |
| Đủ cả ba nhưng quá 3 câu lệnh | Hai `if` rời, mặc định rồi đổi | Như khuôn chung cho `alert_exceeded` |
| Phản công | Góc 10, 170, 89 | Băng `counter_attack_banner`, "OMNI ĐỔI LUẬT TUẦN TRA", ba tình huống mới |
| Phản công bị cắt | `timeout`, `counterAborted`, `error.phase === "counter"`, thiếu `counterVars`/`counterOutput` | "TIẾN TRÌNH BỊ CẮT" (bài học M1) |
| Sau khi phát xong, lượt không lỗi | Mọi lượt có `skipped_lines` | Editor làm mờ các dòng trong `skippedLines`; terminal in `> KHÔNG CHẠY Ở TÌNH HUỐNG n: dòng …` |

Trạng thái thứ hai và thứ ba chưa được hợp đồng engine mục 2 nói rõ. Đề xuất cho nhánh hạ tầng (H6): ghi hai trạng thái này vào hợp đồng mục 2 và thêm case cho chúng trong `patrol-timeline.test.ts`.

**Terminal** (lượt 1, ví dụ; chữ thật theo `sim-vocabulary.ts`):

```
> TÌNH HUỐNG 1/3 · goc_den = 45
>   huong: str 'SANG PHAI'
>   dòng 1 · thiếu
>     cần:  GOC·DEN:·45
> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8, 9
> DRONE PHÁT HIỆN
```

## 8. Dữ liệu test (giá trị JSON)

```json
"inputs": ["goc_den"],
"locked_lines": [2],
"tests": [
  { "inputs": { "goc_den": 45 },  "expected": { "huong": "SANG PHAI" }, "expected_output": ["GOC DEN: 45"] },
  { "inputs": { "goc_den": 135 }, "expected": { "huong": "SANG TRAI" }, "expected_output": ["GOC DEN: 135"] },
  { "inputs": { "goc_den": 90 },  "expected": { "huong": "SANG TRAI" }, "expected_output": ["GOC DEN: 90"] }
],
"counter_attack_tests": [
  { "inputs": { "goc_den": 10 },  "expected": { "huong": "SANG PHAI" }, "expected_output": ["GOC DEN: 10"] },
  { "inputs": { "goc_den": 170 }, "expected": { "huong": "SANG TRAI" }, "expected_output": ["GOC DEN: 170"] },
  { "inputs": { "goc_den": 89 },  "expected": { "huong": "SANG PHAI" }, "expected_output": ["GOC DEN: 89"] }
]
```

### 8.1. Bảng phủ nhánh

Một quyết định, hai nhánh: `if goc_den < 90` và `else`.

| Test | `goc_den` | Nhánh | Ghi chú |
|---|---|---|---|
| Cơ bản 1 | 45 | `if` | |
| Cơ bản 2 | 135 | `else` | |
| Cơ bản 3 | 90 | `else` | **Biên** (90 so với 90). Biên của khái niệm chính nằm ở test cơ bản: đây là chỗ hai `if` rời để hở hoặc chồng nhau |
| Phản công 1 | 10 | `if` | Bắt viết cứng theo tình huống 1 (`== 45`) |
| Phản công 2 | 170 | `else` | Bắt viết cứng theo các giá trị của tình huống 2, 3 |
| Phản công 3 | 89 | `if` | Sát dưới biên; bắt mốc tùy tiện thấp hơn 90 (`< 50`, `<= 45`) |

Mọi nhánh có test cơ bản. Mọi biên có mặt ở test cơ bản.

### 8.2. Bảng đột biến (đã đo; câu lệnh là của ba tình huống cơ bản)

Mỗi đột biến là toàn bộ file editor (dòng 1–4 như code khởi đầu). Không đột biến nào được 3 sao.

| # | Đột biến | Khóa | Tình huống | Câu lệnh | Sao |
|---|---|---|---|---|---|
| 1 | Code khởi đầu | `output_missing` (dòng 1) | 1 | 3, 4, 2 | 0 |
| 2 | Chỉ bỏ thụt lề dòng in (hai `if` hở ở 90) | `missing_var` | 3 | 4, 4, 3 | 0 |
| 3 | Hai `if` rời bù nhau (`< 90`, `>= 90`) | `alert_exceeded` | | 4, 4, 4 | 1 |
| 4 | Hai `if` chồng (`<= 90` rồi `>= 90`; nhánh sau gán đè) | `alert_exceeded` | | 4, 4, 5 | 1 |
| 5 | Hai `if` chồng, thứ tự ngược (`>= 90` rồi `<= 90`) | `wrong_branch` | 3 | 4, 4, 5 | 0 |
| 6 | Gán mặc định `SANG PHAI` rồi `if goc_den >= 90` gán đè | `alert_exceeded` | | 3, 4, 4 | 1 |
| 7 | Như 6 nhưng `> 90` | `wrong_branch` | 3 | 3, 4, 3 | 0 |
| 8 | `if/else` sai biên: `if goc_den <= 90` | `wrong_branch` | 3 | 3, 3, 3 | 0 |
| 9 | `if/else` đảo hai giá trị | `wrong_branch` | 1 | 3, 3, 3 | 0 |
| 10 | Viết cứng không có `if`: `huong = "SANG PHAI"` | `wrong_branch` | 2 | 2, 2, 2 | 0 |
| 11 | Viết cứng theo tình huống 1: `if goc_den == 45` … `else` | `wrong_branch` (phản công) | PC 1 | 3, 3, 3 | 2 |
| 12 | Mốc tùy tiện: `if goc_den < 50` … `else` | `wrong_branch` (phản công) | PC 3 | 3, 3, 3 | 2 |
| 13 | Viết cứng dòng in: `print("GOC DEN: 45")` | `wrong_branch` (dòng 1) | 2 | 3, 3, 3 | 0 |
| 14 | Dòng in thụt lề, nằm trong `else` | `output_missing` (dòng 1) | 1 | 2, 3, 3 | 0 |
| 15 | Thân `else` không thụt lề | `IndentationError`, dòng 8 | | | 0 |
| 16 | `else goc_den >= 90:` | `SyntaxError`, dòng 7 ("expected ':'") | | | 0 |
| 17 | `if goc_den = 90:` | `SyntaxError`, dòng 5 (Python gợi ý `==`) | | | 0 |
| 18 | Thiếu `f` ở dòng in | `output_is_label` (dòng 1) | 1 | 3, 3, 3 | 0 |
| 19 | In thêm `print(huong)` trước dòng góc | `output_mismatch` (dòng 1, cột 1) | 1 | 4, 4, 4 | 0 |

Không áp dụng ở màn này: đảo `and`/`or`, bỏ ngoặc, quên `not` (chưa dạy), đảo thứ tự `elif` (chưa dạy; dòng 5 là dạng gần nhất). Viết cứng theo tình huống 1 được 2 sao (dòng 11): hợp đồng mục 4 cho tối đa 2; muốn hạ xuống 1 phải thêm một tình huống cơ bản thứ hai dưới 90, và khi đó màn không còn lời giải 2 sao tự nhiên nào. Viết cứng thẳng (dòng 10) trượt ngay ở lượt cơ bản.

### 8.3. Bảng đo câu lệnh

| Lời giải | Cơ bản 45 / 135 / 90 | Phản công 10 / 170 / 89 | Lớn nhất (cơ bản) | Sao |
|---|---|---|---|---|
| `if/else` gán rồi in (3 sao, mục 9) | 3 / 3 / 3 | 3 / 3 / 3 | 3 | 3 |
| `if goc_den >= 90` trước, `else` sau | 3 / 3 / 3 | | 3 | 3 |
| In dòng góc trong cả hai nhánh | 3 / 3 / 3 | | 3 | 3 |
| `huong = "SANG PHAI" if goc_den < 90 else "SANG TRAI"` | 2 / 2 / 2 | 2 / 2 / 2 | 2 | 3 |
| Viết cứng theo tình huống 1 (2 sao, mục 9) | 3 / 3 / 3 | | 3 | 2 |
| Hai `if` rời bù nhau | 4 / 4 / 4 | 4 / 4 / 4 | 4 | 1 |
| Mặc định rồi đổi | 3 / 4 / 4 | 3 / 4 / 3 | 4 | 1 |

**`alert_limit_statements`: 3.** Bằng số câu lớn nhất của lời giải tham khảo (`if/else` gán rồi in). Ngưỡng không thấp hơn lời giải `if/else` thường (hợp đồng mục 3), không phạt lối viết sạch nào, và đẩy hai `if` rời cùng lối mặc định rồi đổi xuống 1 sao. Trong truyện: kiểm thêm một lần hay đổi hướng giữa chừng đều là một lần drone có thể nghe thấy.

## 9. Lời giải mẫu

Lời giải 3 sao (3 câu lệnh ở mọi tình huống, 40%):

```python
# Góc đèn pha đo được (KHÔNG được sửa dòng này)
goc_den = 45

# Đèn chiếu về phía nào thì Kai chạy về phía kia.
if goc_den < 90:
    huong = "SANG PHAI"
else:
    huong = "SANG TRAI"
print(f"GOC DEN: {goc_den}")
```

Lời giải 2 sao (qua lượt cơ bản, trượt phản công ở góc 10 với `wrong_branch`):

```python
# Góc đèn pha đo được (KHÔNG được sửa dòng này)
goc_den = 45

# Đèn chiếu về phía nào thì Kai chạy về phía kia.
if goc_den == 45:
    huong = "SANG PHAI"
else:
    huong = "SANG TRAI"
print(f"GOC DEN: {goc_den}")
```

`print("GOC DEN:", goc_den)` cũng đạt: chấm theo đầu ra. Biểu thức `a if c else b` đạt 3 sao với 2 câu lệnh (hợp đồng mục 3 chấp nhận).

## 10. OMNI phản công (sao thứ 3)

Dòng cảnh báo là `counter_attack_banner` (D1, `level:2.3`): OMNI đổi nhịp quét của đèn pha, đèn dừng ở những góc mới. Ba tình huống mới: 10, 170, 89 (mục 8). Bắt được: viết cứng theo giá trị của lượt cơ bản, mốc tùy tiện dưới 90. Lời giải 3 sao ở mục 9.

## 11. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants`, `counter_attack_banner` (D1, `level:2.3`).

**Gợi ý** (mở dần, không bị kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Sau mỗi lượt, nhìn các dòng mờ: đó là dòng không chạy ở tình huống đang hiện. Dòng ghi góc đang nằm trong khối nào? Và khi góc đúng bằng 90, có dòng gán hướng nào còn sáng không? |
| 2 (`hints[1]`) | Hướng tiếp cận: chỉ kiểm một lần. Điều kiện đúng thì một hướng; mọi trường hợp còn lại là hướng kia, không cần viết điều kiện thứ hai. Dòng ghi góc đặt sau khối, sát lề trái. Pseudocode bốn dòng, chưa có code |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": `if … :` / `else:` với một ví dụ khác đáp án (ví dụ điểm thi đạt hay chưa); `else` không có điều kiện; dòng thụt lề thuộc khối, dòng sát lề sau khối luôn chạy; gán biến ở cả hai nhánh thì sau khối biến luôn có |

**Phản ứng miễn phí:** giọng cụt nhưng đủ câu (skill `van-viet-tu-nhien`, mục F), nói bằng từ ngữ của bãi container, đèn pha, tình huống; không nêu từ khóa hay ký hiệu so sánh cần dùng, không trích giá trị mong đợi hay góc của tình huống nào. Được dùng "nhánh", "điều kiện", "tình huống", "khối lệnh".

| Khóa | Ý đồ |
|---|---|
| `entry` | Bãi Container; đèn pha quét, mỗi lần dừng là một tình huống, Kai chỉ có hai ngả; bảo chạy một lần rồi nhìn những dòng mờ |
| `output_missing` | Code khởi đầu: ở tình huống `{round}`, nhật ký góc đèn không được ghi. Dòng ghi góc chỉ chạy khi khối chứa nó chạy |
| `missing_var` | Ở tình huống `{round}`, Kai không có hướng nào: không nhánh nào gán `{vars}`. Kai đứng yên giữa lối |
| `wrong_branch` | Hướng Kai chọn là hướng của một tình huống khác. Mã đã chạy một nhánh có thật, chỉ là nhánh sai. Nhìn dòng nào còn sáng. Không dùng `{round}` (xem dưới bảng) |
| `wrong_value` | Hướng không khớp hướng nào trong luật (thường là gõ sai chữ) |
| `output_mismatch`, `output_case_only`, `output_extra` | Theo khuôn 1.1, thêm `{round}`: dòng nào, ký tự thứ mấy; dòng thừa là thứ bộ điều khiển không hỏi |
| `output_is_label` | Nhật ký ghi tên một ô nhớ thay vì góc đèn |
| `alert_exceeded` | Kai qua được cả ba tình huống, nhưng `{count}` câu lệnh. Mỗi lần kiểm thêm hay đổi hướng giữa chừng là một lần drone có thể nghe thấy |
| `wrong_value_counter` | OMNI đổi nhịp quét, hướng của Kai vẫn theo nhịp cũ (khi giá trị sai không trùng tình huống nào) |
| `counter_error`, `counter_timeout`, `counter_type_mismatch` | Theo khuôn 1.6, bằng từ ngữ đèn pha |
| `SyntaxError`, `IndentationError`, `NameError`, `TypeError`, `runtime_error` | Theo khuôn 1.6. `NameError` nói một cái tên được dùng khi chưa nhánh nào gán nó |
| `two_stars`, `three_stars` | Ngắn. `three_stars`: đèn đổi nhịp mà Kai vẫn luôn ở phía tối |
| Các khóa chung còn lại (`timeout`, `resource_limit`, `blocked_import`, `system_exit`, `repeated_fail`, `engine_error`, `generic`) | Theo khuôn 1.6 |

`wrong_branch` là một khóa cho cả lượt cơ bản và lượt phản công. `details.round` chỉ có khi lượt cơ bản trượt, nên câu của `wrong_branch` (và biến thể của nó) không dùng `{round}`; ở lượt phản công nó sẽ hiện "?". Terminal và mô phỏng đã chỉ tình huống nào trượt.

`reaction_variants` có câu thay thế cho `wrong_branch`, `missing_var` và `alert_exceeded`: nói "vẫn" và chỉ thêm một chỗ để nhìn (dòng mờ ở tình huống trượt; đếm số lần mã kiểm góc đèn).

**Từ cấm của 2.3** (`forbidden_terms`, cộng danh sách chung, mọi giá trị `expected`, mọi dòng `expected_output` và các cụm số từ 2 chữ số trong đó theo hợp đồng mục 5.2):

```json
["if", "else", "elif", "<", ">", "<=", ">=", "==", "!=",
 "ngược lại", "trường hợp còn lại", "lớn hơn hoặc bằng", "nhỏ hơn hoặc bằng", "từ 90 trở lên",
 "thụt lề", "dấu hai chấm", "goc_den",
 "45", "135", "90", "10", "170", "89"]
```

Số trong dòng mong đợi đã tự bị cấm (luật `chapter >= 2`), nhưng vẫn liệt kê để JSON tự đủ. `huong` không bị cấm vì câu ECHO cần chỗ giữ `{vars}`.

## 12. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | `huong` đúng và dòng góc đúng ở cả ba tình huống, không dòng thừa, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 3 câu lệnh ở mọi tình huống cơ bản |
| ⭐⭐⭐ | Thêm: vượt phản công (góc 10, 170, 89) |
| 0 sao | Trên 7 câu lệnh |

Không đổi `compute-stars.ts`.

## 13. Người chơi lần lượt làm gì

1. Vào màn, briefing gõ chữ, hai mục tiêu khóa vào, ECHO nói `entry`. Bấm CHẠY.
2. **Lượt 1:** tình huống 1 trượt, Kai có hướng nhưng nhật ký góc trống; dòng 8, 9 mờ. ECHO nói `output_missing`.
3. **Lượt 2** (bỏ thụt lề dòng in): tình huống 1, 2 qua; tình huống 3 Kai đứng yên, dòng 6 và 8 cùng mờ. ECHO nói `missing_var`.
4. **Rẽ hay gặp:**
   - đổi `>` thành `>=`: đủ ba tình huống nhưng 4 câu lệnh, 1 sao, `alert_exceeded`;
   - đổi `<` thành `<=` ở `if` đầu và `>` thành `>=`: vẫn 1 sao, tình huống 3 tốn 5 câu;
   - gán mặc định rồi đổi (lối 2.2): 1 sao;
   - viết `else goc_den >= 90:`: `SyntaxError`.
5. **Thay `if` thứ hai bằng `else`** → 3 sao. Hộp kết quả: "Đã thu: Ngả rẽ".
6. TIẾP TỤC → Tổng kết kiến thức → `after-2.3` → "VÀO NHIỆM VỤ" của 2.4.

## 14. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:2.3`). Cảnh: `scene` là `tram-sentinel` cho tới khi phông `bai-container` có (hợp đồng mục 8, phase I đổi).

- `outro`: Kai ra tới cuối bãi; đèn pha vẫn quét, mỗi lần dừng đều chiếu vào chỗ Kai vừa rời. Hộp điều khiển đèn còn lưu một bản ghi kiểm thử cũ, dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-07**, mảnh thứ ba; người kiểm thử OMNI): KTS-07 từng đi hết mọi nhánh của OMNI, từng nhánh một, và nhánh nào cũng có lý do. Không nói lý do là gì. Gieo twist chương 6, không lộ.
- `component`: Ngả rẽ (ô 3/6 sáng lên trên thanh Bộ luật né).
- `outro_beats`, ba nhịp:
  1. log, `focus`: trên vách một container có ký hiệu trạm R-17 của Mạng Mù, khắc bằng tay. Đã có người qua đây trước Kai.
  2. echo: ECHO chỉ nói điều kiểm được: vết khắc đã gỉ, dấu cũ. Không đoán là ai, không hứa gì.
  3. kai: một câu ngắn: ai đã qua đây, và họ có tới được bên kia không.
- Móc câu: ai đã qua trước Kai.

### 14.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.3`). Giọng kỹ thuật, không ECHO. Mọi `code` chạy bằng `python3` trong test tích hợp và phải in đúng `output`; ví dụ khác đáp án (không dùng góc, hướng hay số của màn).

| Mục | Ý chính |
|---|---|
| `if` / `else` | Hai nhánh, đúng một nhánh chạy. Ví dụ điểm thi: đạt hay chưa đạt |
| `else` không có điều kiện | `else` nhận mọi trường hợp `if` không nhận; không viết điều kiện sau `else` |
| Dòng sau khối luôn chạy | Dòng sát lề trái sau khối chạy ở cả hai nhánh; ví dụ in một dòng chung sau quyết định |
| Thụt lề quyết định khối | Cùng một dòng `print`, thụt lề thì chỉ chạy trong nhánh đó |
| Hai `if` rời so với `if/else` | Hai `if` rời kiểm hai lần, dễ hở hoặc chồng ở điểm bằng nhau; `else` không bao giờ hở |
| Gán ở cả hai nhánh | Sau khối, biến luôn có giá trị |

Lỗi thường gặp (`mistakes`): `else` có điều kiện → `SyntaxError: expected ':'`; thân `else` không thụt lề → `IndentationError: expected an indented block after 'else' statement on line …`; hai `if` hở ở điểm bằng nhau rồi dùng biến → `NameError: name '…' is not defined`; dòng in chung thụt vào trong `else` → không báo lỗi nhưng có lúc không in.

`next` báo trước màn sau: nhiều hơn hai ngả, xét lần lượt từng mức.

## 15. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code khởi đầu | `output_missing`, `round` 1, câu lệnh 3/4/2, dòng mờ 8, 9 | **Có** (tích hợp) |
| Bỏ thụt lề dòng in | `missing_var`, `round` 3, dòng mờ 6, 8 | **Có** |
| Lời giải 3 sao (`if/else`; và `a if c else b`) | 3 sao, 3 và 2 câu lệnh | **Có** (tham số hóa) |
| Lời giải 2 sao (`== 45`) | 2 sao, `wrong_branch` ở phản công tình huống 1 | **Có** |
| Mọi dòng bảng đột biến 8.2 | Đúng khóa, sao, câu lệnh | **Có** (`tests/fixtures/solutions/2.3/`) |
| `else` có điều kiện | `SyntaxError` dòng 7; traceback Python đã nói "expected ':'" | **Có** (dòng 16) |
| `if goc_den = 90:` | `SyntaxError`, Python gợi ý `==` | **Có** (dòng 17) |
| Đọc `huong` sau hai `if` hở (`print(huong)`) | `NameError` ở tình huống 3 | Không |
| Góc âm hay trên 180 | Không có trong test; luật vẫn chạy | Không |
| `skipped_lines` ở lượt lỗi | Không có trường, editor không làm mờ | **Có** (harness, nhánh hạ tầng) |
| Lời ECHO trong `reactions`, `reaction_variants`, `outro_beats` | Không chứa từ cấm, giá trị, dòng hay số mong đợi | **Có** |
| Timeline `patrol` với quyết định là biến và một dòng in khác | Các trạng thái ở mục 7.1 | **Có** (`patrol-timeline.test.ts`, nhánh hạ tầng; đề xuất thêm case) |
| Đi trọn đường: code khởi đầu → 3 sao | e2e `level-2-3.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 16. Dữ liệu level (tóm tắt cho `src/levels/level-2-3.json`)

Câu đố, JSON thắng khi lệch. Câu chữ ở D1 (tài liệu `level:2.3`, migration `0013`).

- `id` `"2.3"`, `chapter` 2, `difficulty` `"easy"`, `concepts` `["else", "khối lệnh"]`.
- `simulation`: `{ "kind": "patrol", "decision": { "var": "huong" } }`.
- `starter_code`: mục 5, đúng từng ký tự. `locked_lines` `[2]`, `inputs` `["goc_den"]`.
- `objectives`: `[{ "var": "huong", "type": "str" }, { "kind": "output_line", "line": 1 }]` (nhãn ở D1).
- `tests`, `counter_attack_tests`: mục 8. `alert_limit_statements` 3. `float_abs_tolerance` `1e-9`.
- `forbidden_terms`: mục 11.
- `scene` `"tram-sentinel"`; `outro_beats` (khung, câu ở D1): `[{ "kind": "log", "fx": "focus" }, { "kind": "echo" }, { "kind": "kai" }]`.
- Khóa `reactions` bắt buộc có câu: mọi khóa ở mục 11, gồm `wrong_branch`, `missing_var`, `output_is_label`; không cần `EOFError`, `output_has_prompt` (màn không có `stdin`).

## 17. Tiêu chí chấp nhận

1. Code khởi đầu cho `output_missing` ở tình huống 1, rồi `missing_var` ở tình huống 3 sau khi bỏ thụt lề (test tích hợp qua `run-harness.ts`).
2. Lời giải 3 sao: 3 câu lệnh, 3 sao; lời giải 2 sao: 2 sao, `wrong_branch` ở phản công.
3. Mọi dòng bảng đột biến 8.2 cho đúng khóa, sao và câu lệnh; không đột biến nào 3 sao.
4. Mọi nhánh có test cơ bản; biên 90 ở test cơ bản.
5. Câu ECHO sạch từ cấm, giá trị và số mong đợi; `{round}` chỉ ở khóa của lượt cơ bản trượt.
6. Mô phỏng vẽ đủ các trạng thái ở mục 7.1, kể cả "quyết định đúng, dòng in thiếu" và "không có quyết định".
7. Ví dụ tổng kết chạy đúng bằng `python3`; migration `0013` qua `content-migration.test.ts`; typecheck, `npm test`, `npm run test:py`, build qua; e2e được viết.

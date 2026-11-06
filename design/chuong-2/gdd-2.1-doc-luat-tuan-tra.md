# Level 2.1 – "Đọc luật tuần tra"

> Chương 2 – Trạm Sentinel · Độ khó: Easy · Khái niệm: sáu phép so sánh `== != < > <= >=`, kết quả là `bool`
> Câu đố: `src/levels/level-2-1.json`. Câu chữ người chơi đọc: tài liệu `level:2.1` ở D1 (câu ban đầu vào `db/migrations/0011_content_level_2_1.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Trục truyện và phác câu đố: `design/gdd-chuong-2.md` mục 6.1. Hợp đồng engine (thắng GDD này khi lệch): `docs/hop-dong-engine-chuong-2.md`. Brainstorm: `design/quyet-dinh/level-2-1-doc-luat-tuan-tra.md`.
> Mọi con số trong tài liệu này đo bằng `run_level` thật (python3 3.13.2) ngày 30/10/2026. Khóa `wrong_branch` và dòng mờ (`skipped_lines`) đã kiểm lại bằng `tests/integration/level-2-1.test.ts`.

## 1. Bối cảnh

Đêm đầu tiên ngoài Vùng Tối. Dưới chân rào ngoại vi, trong Đường Ống Số 9, drone D-31 nằm kẹt, đèn vẫn nhấp nháy, chip luật vẫn chạy. Kai cắm laptop vào chip. Trước mỗi quyết định, drone tính ba cờ đúng/sai từ cảm biến: mục tiêu có trong tầm không, mình có đang ở chế độ quét không, pin có sắp cạn không. Kai muốn biết drone "thấy" gì, nên phải tính đúng ba cờ ấy.

## 2. Mục tiêu học

Người chơi rời màn biết:

- một phép so sánh cho ra một giá trị `bool` (`True` hoặc `False`), gán thẳng vào biến được, không cần thêm lệnh nào;
- `=` là gán, `==` là so sánh; viết nhầm `=` có thể không báo lỗi mà gán đè;
- ở điểm bằng nhau, `<` và `<=` cho kết quả khác nhau; câu chữ "không vượt quá" là `<=`, "dưới" là `<`;
- so sánh chuỗi phân biệt từng ký tự; so số với chuỗi bằng `<` báo `TypeError`.

Không dạy: `if` (2.2), `and`/`or`/`not` (2.5; `not` vẫn được dùng nếu người chơi tự biết), so sánh nối chuỗi `a < b < c` (chỉ nhắc trong tổng kết).

## 3. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.1`).

Briefing là nhật ký chip luật của D-31, không phải lời ECHO. Nó cho người chơi biết, theo thứ tự:

- D-31 là drone tuần tra Vành Sentinel, đang kẹt trong ống; chip luật còn chạy và còn đọc cảm biến;
- trước mỗi quyết định, chip tính ba cờ từ bốn số đo cảm biến; mỗi cờ chỉ có hai giá trị: đúng hoặc sai;
- Kai cần tính lại ba cờ ấy, đúng như chip tính, kể cả khi số đo nằm đúng ở mép.

Briefing không nêu ký hiệu so sánh nào, không viết `True`/`False`.

`location`: tên Đường Ống Số 9 (dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng).

### 3.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.1`), 4 bước. Validator cấm mọi giá trị mong đợi, nên câu không được chứa `True`, `False` (cả viết thường); được nêu `bool`. Bốn bước lần lượt nói:

1. bốn số đo ở dòng khóa là dữ liệu cảm biến; không sửa chúng;
2. mỗi cờ là kết quả của đúng một phép so sánh và phải có kiểu `bool`; đọc kỹ luật ở ô Mục tiêu, nhất là chữ "không vượt quá" và "dưới";
3. không cần in gì: terminal đã hiện giá trị và kiểu của ba cờ sau mỗi lượt chạy;
4. bấm CHẠY; hoàn thành khi cả 3 mục tiêu chuyển thành xanh ở mọi tình huống; không quá 3 câu lệnh và qua lượt OMNI đổi số đo thì được thêm sao.

## 4. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (3 cờ); khung chat ECHO, Việc cần làm, Gợi ý | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng `patrol` không `decision` (mục 7) |

## 5. Code khởi đầu (có lỗi cài sẵn)

```python
# Cảm biến của D-31 (KHÔNG được sửa 4 dòng này)
khoang_cach = 30
tam_quet = 30
che_do = "QUET"
pin = 20

# Ba cờ D-31 tính trước khi quyết định
trong_tam = khoang_cach < tam_quet
dang_quet = che_do = "QUET"
het_pin = pin < "20"
```

Dòng 2–5 khóa (`locked_lines: [2, 3, 4, 5]`), nạp qua `inputs` đúng kiểu (`int`, `int`, `str`, `int`). Giá trị trên dòng khóa là tình huống 1.

| Dòng | Lỗi | Python cho ra | Bài học |
|---|---|---|---|
| 8 | `<` thay `<=` | `False` ở tình huống 1 (30 so với 30) | "Không vượt quá" tính cả điểm bằng nhau |
| 9 | `=` thay `==` | Không lỗi: gán chuỗi `'QUET'` cho cả `che_do` lẫn `dang_quet` (gán nối chuỗi) | `=` là gán, `==` mới là so sánh |
| 10 | So số với chữ `"20"` | `TypeError: '<' not supported between instances of 'int' and 'str'` | Số trong ngoặc kép là chuỗi; hai kiểu khác nhau không so lớn nhỏ được (nối bài 1.4) |

### 5.1. Chuỗi khóa phản ứng qua các lượt (đã đo)

| Lượt | Người chơi vừa sửa | Khóa | `details` | Câu lệnh mỗi tình huống | Sao |
|---|---|---|---|---|---|
| 1 | (code gốc) | `TypeError` | `line: 10`, `round: 1` | 3, 3 | 0 |
| 2 | Dòng 10 thành `pin < 20` | `type_mismatch` | `vars: "dang_quet"`, `round: 1` (giá trị `'QUET'`, kiểu `str`) | 3, 3 | 0 |
| 2' | Chỉ sửa dòng 9 trước | vẫn `TypeError` dòng 10 | | 3, 3 | 0 |
| 3 | Dòng 9 thành `che_do == "QUET"` | `wrong_value` | `vars: "trong_tam"`, `round: 1` (nhận `False`) | 3, 3 | 0 |
| 4 | Dòng 8 thành `<=` | `three_stars` | | 3, 3 | 3 |

Lỗi chạy đứng trước lỗi biến, sai kiểu đứng trước sai giá trị (`classify-run.ts`), nên ba lỗi lộ ra đúng một lỗi mỗi lượt theo thứ tự 10 → 9 → 8. Lượt 3 không có dòng nào bị bỏ qua (`skipped_lines` rỗng: mã chạy thẳng), editor không làm mờ dòng nào.

## 6. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.1`). Nhãn nêu luật bằng lời thường, không ký hiệu Python, không giá trị mong đợi. Kiểu cả ba là `bool`.

| Biến | Kiểu | Ý đồ nhãn | Tình huống 1 → 2 |
|---|---|---|---|
| `trong_tam` | `bool` | Đúng khi khoảng cách không vượt quá tầm quét | `True` → `False` |
| `dang_quet` | `bool` | Đúng khi chế độ là đúng chuỗi `QUET` | `True` → `False` |
| `het_pin` | `bool` | Đúng khi pin dưới 20 | `False` → `True` |

- **Mức cảnh báo ≤ 40%** (≤ 3 câu lệnh; 100% = 7 câu; từ 8 câu bị bắt).
- `simulation`: `{ "kind": "patrol" }`, không `decision` (hợp đồng engine mục 2: ba mục tiêu hiện như ba đèn báo của drone; tình huống đạt khi cả ba đèn đúng).

## 7. Diễn biến khi chạy (mô phỏng `patrol`)

Cảnh chung của Chương 2 (hợp đồng engine mục 2): dải đất giữa hai lớp rào, drone quét đèn, chấm của Kai ở mép dưới. Ở 2.1 drone là D-31 nằm trong ống; bảng cảm biến hiện bốn đầu vào của tình huống, ba đèn báo hiện ba cờ (giá trị nhận được, màu theo kiểu ở `design/gdd.md` mục 5.2).

### 7.1. Bảng biên cho timeline (trạng thái timeline phải vẽ)

| Trạng thái | Khi nào (đã đo) | Vẽ |
|---|---|---|
| Đạt mọi tình huống | lời giải 3 sao | Tình huống 1, 2 lần lượt: ba đèn đúng, "DRONE BỎ QUA" |
| Lỗi chạy ở tình huống 1 | code gốc (`TypeError` dòng 10) | Đèn `het_pin` không có giá trị; đèn khóa vào Kai, nhãn lỗi; tình huống 2 xám "CHƯA TỚI" |
| Sai kiểu | lượt 2 (`dang_quet` là `'QUET'`) | Đèn `dang_quet` hiện chữ `'QUET'` màu `str`, khác màu `bool`; "DRONE PHÁT HIỆN" |
| Sai giá trị ở tình huống 1 | lượt 3 (`trong_tam` nhận `False`) | Đèn sai đổi đỏ, ô cần/nhận cạnh đèn; tình huống 2 "CHƯA TỚI" |
| Sai ở tình huống 2 | `pin > 20`, `khoang_cach >= tam_quet` | Tình huống 1 qua, tình huống 2 phát hiện |
| Chuỗi `'True'` thay giá trị `bool` | `dang_quet = "True"` (`type_mismatch_value_match`) | Như sai kiểu; ô nhận hiện dấu nháy |
| Lỗi cú pháp | `dang_quet = (che_do = "QUET")` | Không tình huống nào chạy |
| Quá ngưỡng | thêm `print(...)` (4 câu), viết bằng `if` (5 câu) | Mọi tình huống qua, thanh cảnh báo vượt 40%, 1 sao |
| Phản công trượt | `che_do != "SAC"` (C1), tầm quét viết cứng (C1), ngưỡng pin viết cứng (C1) | Băng "OMNI ĐỔI LUẬT TUẦN TRA", tình huống mới; đèn sai, "DRONE PHÁT HIỆN" |
| Phản công timeout / bị hủy / lỗi phản công | vòng lặp vô hạn chỉ chạy với dữ liệu phản công | "TIẾN TRÌNH BỊ CẮT" (bài học M1) |

Giảm chuyển động, Esc, `aria-live`, điện thoại: khuôn chung `use-timeline-playback.ts`.

**Terminal** (lượt 3, ví dụ; chữ thật do `sim-vocabulary.ts` mục `patrol` sinh): `> TÌNH HUỐNG 1/2 · …`, ba biến kèm kiểu và giá trị (`trong_tam: bool False`…), dòng "DRONE PHÁT HIỆN", mức cảnh báo. Không có dòng `KHÔNG CHẠY Ở TÌNH HUỐNG` vì mã chạy thẳng.

## 8. Dữ liệu test (giá trị JSON)

Đặc tả; JSON thắng khi lệch. `expected` ghi `bool` JSON.

```json
"tests": [
  { "inputs": { "khoang_cach": 30, "tam_quet": 30, "che_do": "QUET", "pin": 20 },
    "expected": { "trong_tam": true, "dang_quet": true, "het_pin": false } },
  { "inputs": { "khoang_cach": 45, "tam_quet": 40, "che_do": "SAC", "pin": 7 },
    "expected": { "trong_tam": false, "dang_quet": false, "het_pin": true } }
],
"counter_attack_tests": [
  { "inputs": { "khoang_cach": 50, "tam_quet": 50, "che_do": "TUAN TRA", "pin": 19 },
    "expected": { "trong_tam": true, "dang_quet": false, "het_pin": true } },
  { "inputs": { "khoang_cach": 51, "tam_quet": 50, "che_do": "QUET", "pin": 21 },
    "expected": { "trong_tam": false, "dang_quet": true, "het_pin": false } }
]
```

Tình huống 1 chứa cả hai biên của khái niệm chính (khoảng cách bằng tầm quét, pin bằng 20). Tình huống 2 lật cả ba cờ, nên viết cứng theo tình huống 1 trượt ngay ở lượt cơ bản.

### 8.1. Bảng phủ (màn không có nhánh: mỗi phép so sánh cần cả hai kết quả và điểm bằng nhau)

| Phép so sánh | Kết quả đúng | Kết quả sai | Điểm bằng nhau | Giá trị thứ ba / phía kia của biên |
|---|---|---|---|---|
| `khoang_cach <= tam_quet` | B1 (30, 30) | B2 (45, 40) | B1 (30 = 30) cơ bản; C1 (50 = 50) | C2 (51 = 50 + 1) |
| `che_do == "QUET"` | B1, C2 | B2 (`SAC`), C1 (`TUAN TRA`) | (không áp dụng) | C1: giá trị thứ ba, bắt `!= "SAC"` |
| `pin < 20` | B2 (7), C1 (19) | B1 (20), C2 (21) | B1 (20) cơ bản | C1 (19), C2 (21) |

### 8.2. Bảng đột biến (đã đo; số câu lệnh là của hai tình huống cơ bản)

| Đột biến | Khóa | `details` | Câu | Sao |
|---|---|---|---|---|
| Code gốc | `TypeError` | dòng 10, tình huống 1 | 3, 3 | 0 |
| Sai biên: `khoang_cach < tam_quet` | `wrong_value` | `trong_tam`, tình huống 1 | 3, 3 | 0 |
| Sai biên: `pin <= 20` | `wrong_value` | `het_pin`, tình huống 1 | 3, 3 | 0 |
| Đảo hướng: `khoang_cach > tam_quet` | `wrong_value` | `trong_tam`, tình huống 1 | 3, 3 | 0 |
| Lật phía: `khoang_cach >= tam_quet` | `wrong_value` | `trong_tam`, tình huống 2 | 3, 3 | 0 |
| Đảo hướng: `pin > 20` | `wrong_value` | `het_pin`, tình huống 2 | 3, 3 | 0 |
| `=` thay `==` (code gốc dòng 9) | `type_mismatch` | `dang_quet` | 3, 3 | 0 |
| `dang_quet = (che_do = "QUET")` | `SyntaxError` | dòng 9, "Maybe you meant '==' or ':=' instead of '='?" | – | 0 |
| Chữ thường: `che_do == "quet"` | `wrong_value` | `dang_quet`, tình huống 1 | 3, 3 | 0 |
| So tên biến: `"che_do" == "QUET"` | `wrong_value` | `dang_quet`, tình huống 1 | 3, 3 | 0 |
| Chuỗi thay giá trị: `dang_quet = "True"` | `type_mismatch_value_match` | `dang_quet` | 3, 3 | 0 |
| Viết cứng tình huống 1: `True`, `True`, `False` | `wrong_value` | cả ba, tình huống 2 | 3, 3 | 0 |
| Viết cứng bằng chuỗi `"True"`… | `type_mismatch_value_match` | cả ba, tình huống 1 | 3, 3 | 0 |
| So nối chuỗi nhầm: `khoang_cach <= tam_quet == True` | `wrong_value` | `trong_tam`, tình huống 1 | 3, 3 | 0 |
| `che_do != "SAC"` | `wrong_value_counter` | `dang_quet`, phản công 1 | 3, 3 | 2 |
| Tầm quét viết cứng: `khoang_cach <= 30` (cũng `<= 44`, `< 40`) | `wrong_value_counter` | `trong_tam`, phản công 1 | 3, 3 | 2 |
| Ngưỡng pin viết cứng: `pin < 8`, `pin <= 8`, `pin == 7` | `wrong_value_counter` | `het_pin`, phản công 1 | 3, 3 | 2 |
| Viết bằng `if` (chưa dạy): cờ mặc định rồi `if` gán `True` | `alert_exceeded` | | 5, 4 | 1 |
| Lời giải đúng cộng `print(...)` dò | `alert_exceeded` | | 4, 4 | 1 |
| Thụt lề thừa ở dòng 9 | `IndentationError` | dòng 9, "unexpected indent" | – | 0 |

Không đột biến nào được 3 sao. Viết cứng theo tình huống 1 được 0 sao.

Lời giải đúng khác cách viết cũng 3 sao (đã đo): `tam_quet >= khoang_cach`, `"QUET" == che_do`, `20 > pin`; `not khoang_cach > tam_quet`; `pin <= 19` (dữ liệu chỉ có số nguyên); `(khoang_cach <= tam_quet) == True`; `che_do in "QUET"` (đúng với mọi dữ liệu của màn; chấp nhận, màn không dạy chuỗi con).

### 8.3. Bảng đo câu lệnh

| Lời giải | B1 | B2 | C1 | C2 | Lớn nhất trên test cơ bản |
|---|---|---|---|---|---|
| Code gốc | 3 | 3 | – | – | 3 |
| 3 sao (mục 9) | 3 | 3 | 3 | 3 | **3** |
| 2 sao (mục 9) | 3 | 3 | 3 | 3 | 3 |
| Viết bằng `if` | 5 | 4 | – | – | 5 |

`alert_limit_statements`: **3** (bằng lời giải tham khảo). Màn không có mục tiêu dòng in, nên điều chỉnh "gán biến rồi in một lần" của báo cáo validate không áp dụng.

## 9. Lời giải mẫu

**2 sao** (trượt phản công 1: `dang_quet` nhận `True` khi chế độ là `TUAN TRA`):

```python
trong_tam = khoang_cach <= tam_quet
dang_quet = che_do != "SAC"
het_pin = pin < 20
```

**3 sao** (3 câu lệnh, 40%):

```python
trong_tam = khoang_cach <= tam_quet
dang_quet = che_do == "QUET"
het_pin = pin < 20
```

Hai đoạn trên đặt ở dòng 8–10, sau dòng khóa và chú thích của code khởi đầu.

## 10. OMNI phản công (sao thứ 3)

Câu chữ: `counter_attack_banner` (D1, `level:2.1`). Ý đồ: OMNI đẩy D-31 sang chế độ tuần tra và nới tầm quét. Terminal hiện số đo mới của từng tình huống. Bắt được: so với chế độ sai (`!= "SAC"`), tầm quét viết cứng, ngưỡng pin viết cứng gần dữ liệu cơ bản; C2 thêm phía kia của biên tầm quét mới.

## 11. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:2.1`).

**Gợi ý** (miễn kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Nhìn dòng 10: số 20 nằm trong ngoặc kép là chữ, không phải số. Rồi nhìn dòng 9: một dấu bằng là đặt giá trị vào ô nhớ, không phải hỏi hai thứ có bằng nhau không |
| 2 (`hints[1]`) | Hướng tiếp cận: một phép so sánh tự nó đã là câu trả lời đúng/sai, gán thẳng vào cờ. Đọc từng chữ của luật: "không vượt quá" có tính lúc hai số bằng nhau, "dưới" thì không. Tính tay ba cờ với số trên dòng khóa rồi so với terminal |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": bảng sáu phép so sánh với ví dụ khác dữ liệu màn, mỗi dòng một kết quả `True`/`False`; `=` khác `==`; `5 < 5` khác `5 <= 5`; chuỗi so từng ký tự, phân biệt hoa thường; `3 < "4"` báo `TypeError` |

**Phản ứng miễn phí:** giọng cụt của ECHO, từ ngữ của chip, cờ, cảm biến; không nêu ký hiệu so sánh, không nói "nhỏ hơn hoặc bằng", không trích số đo.

| Khóa | Ý đồ |
|---|---|
| `entry` | D-31 kẹt nhưng chip còn tính; ba cờ là thứ drone thấy trước khi quyết định; bảo chạy một lần và nhìn ba đèn |
| `TypeError` (code gốc) | Chip đang so một con số với một thứ chỉ trông giống số; hai kiểu khác nhau không so lớn nhỏ được; dòng `{line}` |
| `type_mismatch` (lượt 2) | Cờ `{vars}` đang giữ chữ, không giữ đúng/sai; dòng đó đã đặt giá trị chứ không hỏi |
| `type_mismatch_value_match` | Cờ `{vars}` ghi đúng chữ nhưng là chữ trong ngoặc; chip chỉ đọc đúng/sai thật |
| `wrong_value` (lượt 3) | Cờ `{vars}` lệch với chip ở tình huống {round}; nhìn số đo của tình huống đó, nhất là chỗ hai số chạm nhau |
| `missing_var` | Chip chờ cờ `{vars}` mà không thấy |
| `NameError`, `SyntaxError`, `IndentationError` | Theo khuôn Chương 1, từ ngữ của chip (dòng `{line}`) |
| `alert_exceeded` | Ba cờ đúng, nhưng chip ghi nhận quá nhiều lệnh; mỗi lệnh là một lần drone có thể nghe thấy |
| `wrong_value_counter` | OMNI đổi số đo, cờ `{vars}` không đổi theo; luật đã viết theo số cũ chứ không theo cảm biến |
| `counter_type_mismatch`, `counter_error`, `counter_ValueError`, `counter_timeout` | Theo khuôn 1.5 |
| `two_stars` | (khóa không tới được khi màn có phản công; vẫn viết câu ngắn theo khuôn) |
| `three_stars` | OMNI đổi số đo mà ba cờ vẫn khớp chip; ngắn |
| Khóa chung còn lại (`generic`, `repeated_fail`, `timeout`, `runtime_error`, `ValueError`, `ZeroDivisionError`, `AttributeError`, `resource_limit`, `blocked_import`, `input_unsupported`, `system_exit`, `engine_error`) | Theo khuôn 1.5 |

`{round}` chỉ dùng trong `wrong_value`, `type_mismatch`, `missing_var` (các khóa sinh từ lượt cơ bản có ≥ 2 test). Không dùng trong khóa phản công và khóa lỗi biên dịch: ở đó `{round}` hiện "?" (review L2).

**Không viết câu cho `wrong_branch`** (lệch với `design/gdd-chuong-2.md` mục 6, lý do đã đo): cả ba mục tiêu đều là `bool`, và với `bool` mọi giá trị sai đều bằng giá trị mong đợi của tình huống kia. Nếu màn có câu cho khóa này, mọi `wrong_value` và mọi `wrong_value_counter` trong bảng đột biến đều thành `wrong_branch`; ECHO mất cách nói "OMNI đổi số đo", trong khi màn chưa có nhánh nào để nói. Lựa chọn và lý do: `design/quyet-dinh/level-2-1-doc-luat-tuan-tra.md` mục A.

`reaction_variants`: câu thay thế cho `wrong_value` (nói "vẫn lệch", chỉ thêm một chỗ để nhìn: đèn đỏ trên bảng tình huống), `type_mismatch` (nhìn màu đèn: màu chữ khác màu đúng/sai) và `TypeError`.

**Từ cấm của 2.1** (`forbidden_terms`, cộng `int`/`float`/`round`, `True`/`False` và mọi giá trị `expected` do engine tự thêm):

- ký hiệu và tên phép so sánh: `==`, `!=`, `<=`, `>=`, `<`, `>`, "nhỏ hơn hoặc bằng", "lớn hơn hoặc bằng", "không vượt quá", "bằng nhau", "hai dấu bằng", "dấu bằng";
- tên biến đầu vào `khoang_cach`, `tam_quet`, `che_do` (không cấm `pin` vì là từ thường trong truyện);
- mọi dữ liệu tình huống: `QUET`, `SAC`, `TUAN TRA`, `30`, `45`, `40`, `50`, `51`, `20`, `19`, `21`, `7`.

Danh sách đầy đủ nằm trong JSON. Các từ "điều kiện", "so sánh", "tình huống", "cờ" không bị cấm.

## 12. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Ba cờ đúng kiểu `bool` và đúng giá trị ở cả hai tình huống |
| ⭐⭐ | Thêm: ≤ 3 câu lệnh |
| ⭐⭐⭐ | Thêm: qua cả hai tình huống phản công |
| 0 sao | Trên 7 câu lệnh |

Không đổi `compute-stars.ts`.

## 13. Người chơi lần lượt làm gì

1. Từ `prologue-2` vào màn, briefing gõ chữ, ba mục tiêu khóa vào, ECHO nói `entry` kèm Việc cần làm.
2. **Lượt 1:** `TypeError` dòng 10; đèn khóa ở tình huống 1.
3. **Lượt 2:** sửa `"20"` thành `20` → `type_mismatch` ở `dang_quet` (đèn hiện chữ `'QUET'`).
4. **Lượt 3:** thêm dấu bằng → `wrong_value` ở `trong_tam`, tình huống 1 (30 với 30).
5. **Rẽ sai thường gặp:** `pin <= 20` (tình huống 1); `che_do != "SAC"` (2 sao, phản công); viết bằng `if` (1 sao, quá ngưỡng).
6. **Lượt 4:** `<=` → 3 sao. Hộp kết quả: "Đã thu: Cảm biến tầm quét".
7. TIẾP TỤC → Tổng kết → `after-2.1` → "VÀO NHIỆM VỤ" của 2.2.

## 14. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:2.1`).

- `scene`: `duong-ong`. Phông từng nhịp `outro_beats`: `design/quyet-dinh/canh-cutscene.md` mục "Gắn vào truyện Chương 2".
- `outro`: ba cờ của Kai khớp chip; chip D-31 mở thêm một vùng nhớ cũ, trong đó có một ghi chú của người viết luật. Dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-02**, mảnh thứ nhất, lần đầu lộ): KTS-02 viết luật cho drone; mỗi luật là một phép so sánh; drone không ghét ai, drone chỉ so. Không nói KTS-02 giấu mảnh "Quyết định" (để dành 2.7).
- `component`: Cảm biến tầm quét (ô 1/6 của thanh Bộ luật né).
- `outro_beats`, bốn nhịp:

| # | Kiểu, nền | Ý đồ | Cue, hiệu ứng |
|---|---|---|---|
| 1 | log, `duong-ong` | Bản ghi cuối của D-31: Trạm Sentinel đã bắn hạ nó vì nó bỏ qua một mục tiêu đứng đúng ở mép tầm quét. Một luật sai ở điểm bằng nhau | `scan_reject`, `fx: "focus"` (D-31) |
| 2 | echo | ECHO đọc bản ghi: Sentinel làm đúng luật, kể cả với drone của chính nó. Không bình luận thêm | |
| 3 | kai | Một câu: nếu Sentinel không tha cả drone của mình, nó sẽ không tha Kai | `fx: "focus"` |
| 4 | log, `hang-rao-ngoai` | Phía trên ống là Hàng Rào Ngoại Vi; drone bay dọc rào theo chu kỳ. Dẫn vào 2.2 | |

- Móc câu: luật của Sentinel tuyệt đối tới mức bắn cả drone sai luật.
- Không được lộ: KTS-02 là người giấu mảnh; 0xA7 là ai.

### 14.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.1`). Giọng kỹ thuật, không ECHO. Mọi `code` chạy bằng `python3` trong test tích hợp và phải in đúng `output`; ví dụ dùng dữ liệu khác màn (không dùng `30`, `20`, `QUET`…).

| Mục | Ý chính |
|---|---|
| Sáu phép so sánh | `== != < > <= >=` trên hai số nguyên, mỗi phép một dòng `print`, kết quả `True`/`False` |
| Kết quả là `bool` | `print(type(3 < 5))` → `<class 'bool'>`; gán thẳng kết quả vào biến |
| Điểm bằng nhau | `5 < 5` là `False`, `5 <= 5` là `True`; đọc luật bằng lời để chọn đúng phép |
| `=` và `==` | `=` gán, `==` so sánh; `a = b = "X"` không báo lỗi mà gán cho cả hai biến |
| So sánh chuỗi | `==` so từng ký tự, phân biệt hoa thường (`"Lan" == "lan"` là `False`) |

Lỗi thường gặp (`mistakes`): `8 < "9"` → `TypeError: '<' not supported between instances of 'int' and 'str'`; `x = (y = 1)` → `SyntaxError` có dòng gợi ý "Maybe you meant '==' or ':=' instead of '='?"; `co = "True"` là chuỗi, không phải `bool`; `a <= b == True` là so sánh nối (`a <= b and b == True`), không phải "kết quả của `a <= b` bằng `True`".

`next` báo trước màn sau: dùng một cờ đúng/sai để quyết định có chạy một lệnh hay không (`if`).

## 15. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `TypeError` dòng 10, tình huống 1 | **Có** (tích hợp) |
| Lượt 2, lượt 3 theo mục 5.1 | `type_mismatch` rồi `wrong_value` | **Có** |
| Lời giải 2 sao | 2 sao, `wrong_value_counter`, `vars: dang_quet` | **Có** |
| Lời giải 3 sao và ba cách viết khác (mục 8.2) | 3 sao, 3 câu | **Có** (tham số hóa) |
| Mọi dòng bảng đột biến | Khóa, sao, số câu như mục 8.2 | **Có** (`tests/fixtures/solutions/2.1/*.py`) |
| Màn không viết câu `wrong_branch` | Sai giá trị trả `wrong_value`/`wrong_value_counter` | **Có** |
| `che_do in "QUET"` | 3 sao (chấp nhận) | Không |
| Lời ECHO | Không chứa từ cấm, `True`/`False`, số trong dữ liệu | **Có** (test từ cấm theo level) |
| `task_steps` | Không chứa `True`/`False` | **Có** (validator) |
| Timeline `patrol` không `decision` | Các trạng thái ở mục 7.1 | **Có** (`patrol-timeline.test.ts`, hạ tầng H6, level giả) |
| Ví dụ tổng kết | Chạy bằng `python3`, in đúng `output` | **Có** |
| Đi trọn đường | e2e `level-2-1.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 16. Dữ liệu level (tóm tắt cho `src/levels/level-2-1.json`)

- `id` `"2.1"`, `chapter` 2, `difficulty` `"easy"`, `concepts` `["comparison", "bool"]`.
- `simulation`: `{ "kind": "patrol" }`.
- `inputs`: `["khoang_cach", "tam_quet", "che_do", "pin"]`; `locked_lines`: `[2, 3, 4, 5]`.
- `objectives`: `trong_tam`, `dang_quet`, `het_pin`, kiểu `bool`.
- `tests`, `counter_attack_tests`: mục 8. `alert_limit_statements`: 3.
- `scene`: `duong-ong`; `outro_beats`: bốn nhịp mục 14.
- `forbidden_terms`: mục 11.
- Lời giải và đột biến: `tests/fixtures/solutions/2.1/` (`original.py`, `two-star.py`, `three-star.py`, `three-star-mirror.py`, `three-star-not.py`, một file cho mỗi dòng mục 8.2); test `tests/integration/level-2-1.test.ts`.

## 17. Tiêu chí chấp nhận

1. Code khởi đầu cho đúng chuỗi khóa mục 5.1 qua harness thật (test tích hợp).
2. Mọi dòng bảng đột biến ra đúng khóa, sao, số câu; không dòng nào 3 sao.
3. Lời giải 3 sao: 3 câu ở mọi tình huống; lời giải 2 sao trượt phản công 1.
4. Màn không có câu `wrong_branch`; validator, test từ cấm và `content-migration.test.ts` qua với migration `0011`.
5. Mô phỏng `patrol` không `decision` vẽ đủ các trạng thái mục 7.1.
6. typecheck, `npm test`, `npm run test:py`, build qua; e2e được viết.

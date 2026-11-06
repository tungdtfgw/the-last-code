# Level 2.2 – "Lệnh nấp"

> Chương 2 – Trạm Sentinel · Độ khó: Easy · Khái niệm: `if`, khối lệnh, thụt lề
> Câu đố: `src/levels/level-2-2.json`. Câu chữ người chơi đọc: tài liệu `level:2.2` ở D1 (câu ban đầu vào `db/migrations/0012_content_level_2_2.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Trục truyện và phác câu đố: `design/gdd-chuong-2.md` mục 6.2. Hợp đồng engine (thắng GDD này khi lệch): `docs/hop-dong-engine-chuong-2.md`. Brainstorm: `design/quyet-dinh/level-2-2-lenh-nap.md`.
> Mọi con số trong tài liệu này đo bằng `run_level` thật (python3 3.13.2) ngày 30/10/2026. Khóa `wrong_branch` và dòng mờ (`skipped_lines`) đã kiểm lại bằng `tests/integration/level-2-2.test.ts`.

## 1. Bối cảnh

Kai ra khỏi Đường Ống Số 9 và tới chân Hàng Rào Ngoại Vi. Một drone bay dọc rào theo chu kỳ. Từ chip của D-31, Kai đã biết drone tính "mục tiêu có trong tầm quét không". Giờ Kai viết luật đầu tiên của chính mình: mặc định là đi, nhưng khi drone ở trong tầm quét thì nấp.

## 2. Mục tiêu học

Người chơi rời màn biết:

- `if <điều kiện>:` chạy khối lệnh bên dưới chỉ khi điều kiện là `True`; điều kiện sai thì Python bỏ qua cả khối;
- khối lệnh là các dòng lùi vào (4 dấu cách) ngay dưới dòng `if`; dòng `if` kết thúc bằng dấu `:`;
- một biến được gán giá trị mặc định trước `if`, rồi `if` gán đè khi cần; thứ tự hai lệnh quyết định kết quả;
- nhìn dòng bị làm mờ trong editor để biết khối có chạy ở tình huống đó không.

Không dạy: `else` (2.3; vẫn chấp nhận nếu người chơi tự viết), dòng sau khối luôn chạy (2.3 dạy kỹ), `elif` (2.4).

## 3. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.2`).

Briefing là nhật ký cảm biến của Hàng Rào Ngoại Vi, không phải lời ECHO. Nó cho người chơi biết, theo thứ tự:

- một drone bay dọc rào; mỗi lượt nó đo khoảng cách tới Kai và so với tầm quét của nó;
- Kai cần một lệnh cho mỗi lượt: đi hoặc nấp; mặc định là đi;
- chỉ khi drone đang ở trong tầm quét (khoảng cách không vượt quá tầm quét) thì lệnh mới đổi thành nấp; tầm quét đổi theo từng drone.

Briefing không nêu `if`, không viết ký hiệu so sánh.

`location`: tên Hàng Rào Ngoại Vi.

### 3.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.2`), 4 bước. Validator cấm giá trị mong đợi, nên câu không được chứa chữ `NAP` hay `DI` đứng riêng (không phân biệt hoa thường; "di chuyển" cũng bị bắt). Được nêu `if`. Bốn bước lần lượt nói:

1. bấm CHẠY một lần và đọc dòng Python báo lỗi; dòng nằm dưới `if` phải lùi vào để thuộc về nó;
2. biến `lenh` giữ lệnh của Kai; nó mang giá trị mặc định, và chỉ đổi khi drone ở trong tầm quét (luật ở ô Mục tiêu);
3. sau mỗi lượt, xem dòng nào bị làm mờ trong editor: đó là dòng không chạy ở tình huống đang hiện; xét kỹ tình huống drone đứng đúng mép tầm quét;
4. hoàn thành khi mục tiêu chuyển thành xanh ở cả ba tình huống; không quá 3 câu lệnh và qua lượt OMNI đổi tầm quét thì được thêm sao.

## 4. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (1 biến); khung chat ECHO, Việc cần làm, Gợi ý | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng `patrol`, `decision: {"var": "lenh"}` (mục 7) |

## 5. Code khởi đầu (có lỗi cài sẵn)

```python
# Cảm biến Hàng Rào Ngoại Vi (KHÔNG được sửa 2 dòng này)
khoang_cach = 25
tam_quet = 30

# Luật của Kai: mặc định là đi, drone trong tầm quét thì nấp
lenh = "DI"
if khoang_cach > tam_quet:
lenh = "NAP"
```

Dòng 2–3 khóa (`locked_lines: [2, 3]`), nạp qua `inputs` (`int`). Giá trị trên dòng khóa là tình huống 1.

| Dòng | Lỗi | Python hoặc drone báo | Bài học |
|---|---|---|---|
| 8 | Thân `if` không lùi vào | `IndentationError: expected an indented block after 'if' statement on line 7` | Khối lệnh của `if` là các dòng lùi vào bên dưới nó |
| 7 | Sai hướng: `>` (ngoài tầm) thay vì "trong tầm" | `lenh` nhận `'DI'` ở tình huống 1; dòng 8 bị làm mờ | Điều kiện quyết định khối có chạy không |
| 7 | (sau khi đổi hướng thành `<`) thiếu điểm bằng nhau | Trượt tình huống 3 (30 với 30) | Bài 2.1 quay lại: "không vượt quá" là `<=` |

### 5.1. Chuỗi khóa phản ứng qua các lượt (đã đo)

| Lượt | Người chơi vừa sửa | Khóa | `details` | Câu lệnh B1, B2, B3 | Dòng mờ ở tình huống hiện | Sao |
|---|---|---|---|---|---|---|
| 1 | (code gốc) | `IndentationError` | `line: 8` | – | – | 0 |
| 2 | Lùi dòng 8 vào | `wrong_branch` | `vars: "lenh"`, `round: 1` (nhận `'DI'`, là giá trị mong đợi của tình huống 2) | 2, 3, 2 | dòng 8 | 0 |
| 3 | Đổi `>` thành `<` | `wrong_branch` (lần hai liền: ECHO dùng `reaction_variants.wrong_branch`) | `round: 3` | 3, 2, 2 | dòng 8 | 0 |
| 4 | Đổi `<` thành `<=` | `three_stars` | | 3, 2, 3 | không | 3 |

Lượt 2 là chỗ dòng mờ (hợp đồng engine mục 6) làm việc của nó: người chơi thấy dòng 8 không chạy ở tình huống 1, nên hiểu điều kiện đang sai chứ không phải lệnh gán sai. Terminal in `> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8`.

## 6. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.2`). Nhãn nêu luật và hai giá trị chữ người chơi phải dùng (`NAP`, `DI`, như code khởi đầu đã có); nhãn không bị kiểm lộ đáp án, đây là đặc tả, không phải kết quả của một tình huống.

| Biến | Kiểu | Ý đồ nhãn |
|---|---|---|
| `lenh` | `str` | Lệnh của Kai: `NAP` khi khoảng cách không vượt quá tầm quét, còn lại `DI` |

- **Mức cảnh báo ≤ 40%** (≤ 3 câu lệnh; 100% = 7 câu; từ 8 câu bị bắt).
- `simulation`: `{ "kind": "patrol", "decision": { "var": "lenh" } }`. Validator `patrol` đòi `decision.var` trỏ tới mục tiêu biến kiểu `str`: thỏa.

## 7. Diễn biến khi chạy (mô phỏng `patrol`)

Cảnh chung (hợp đồng engine mục 2), drone bay dọc rào. Mỗi tình huống: bảng cảm biến hiện `khoang_cach` và `tam_quet`, rồi chip quyết định của Kai hiện giá trị `lenh`. Khớp: Kai làm theo lệnh, drone bay qua không quay đèn. Lệch: đèn khóa vào Kai, "BỊ PHÁT HIỆN", ô cần/nhận cạnh chip.

### 7.1. Bảng biên cho timeline (trạng thái timeline phải vẽ)

| Trạng thái | Khi nào (đã đo) | Vẽ |
|---|---|---|
| Lỗi cú pháp / thụt lề | code gốc, thiếu `:`, `=` trong điều kiện | Không tình huống nào chạy |
| Sai ở tình huống 1 | lượt 2 (`>`), `>=`, đổi chỗ hai vế, gán mặc định đặt sau `if` | Chip hiện `'DI'`; đèn khóa; tình huống 2, 3 "CHƯA TỚI" |
| Sai ở tình huống 3 (biên) | lượt 3 (`<`) | Tình huống 1, 2 qua; tình huống 3 bị phát hiện |
| Sai ở tình huống 2 | viết cứng `lenh = "NAP"` | Tình huống 1 qua; tình huống 2 bị phát hiện |
| Thiếu biến ở tình huống 2 | không có gán mặc định, hoặc gán mặc định nằm trong khối | Chip trống "KHÔNG CÓ LỆNH" (`missing_var`) |
| Chữ thường / chữ lạ | `"nap"`, `"lenh"` | Chip hiện chữ nhận được; ô cần/nhận (`wrong_value`) |
| Sai kiểu | `lenh = khoang_cach <= tam_quet` (`bool`) | Chip màu `bool`, khác màu `str` (`type_mismatch`) |
| Quá ngưỡng | thêm `print(lenh)` (4 câu) | Mọi tình huống qua, thanh cảnh báo vượt 40%, 1 sao |
| Phản công trượt | tầm quét viết cứng (C2, C3), ngưỡng khoảng cách viết cứng (C1 hoặc C3) | Băng "OMNI ĐỔI LUẬT TUẦN TRA", tình huống mới, chip sai, "BỊ PHÁT HIỆN" |
| Phản công timeout / bị hủy / lỗi phản công | vòng lặp vô hạn chỉ với dữ liệu phản công | "TIẾN TRÌNH BỊ CẮT" (bài học M1) |
| Đạt hết | lời giải 3 sao | Ba tình huống qua, phản công qua |

Sau khi mô phỏng phát xong một lượt không lỗi, editor làm mờ `skipped_lines` của tình huống đang hiện (hợp đồng mục 6). Giảm chuyển động, Esc, `aria-live`, điện thoại: khuôn chung.

## 8. Dữ liệu test (giá trị JSON)

Đặc tả; JSON thắng khi lệch.

```json
"tests": [
  { "inputs": { "khoang_cach": 25, "tam_quet": 30 }, "expected": { "lenh": "NAP" } },
  { "inputs": { "khoang_cach": 50, "tam_quet": 30 }, "expected": { "lenh": "DI" } },
  { "inputs": { "khoang_cach": 30, "tam_quet": 30 }, "expected": { "lenh": "NAP" } }
],
"counter_attack_tests": [
  { "inputs": { "khoang_cach": 41, "tam_quet": 40 }, "expected": { "lenh": "DI" } },
  { "inputs": { "khoang_cach": 40, "tam_quet": 40 }, "expected": { "lenh": "NAP" } },
  { "inputs": { "khoang_cach": 13, "tam_quet": 12 }, "expected": { "lenh": "DI" } }
]
```

**Đổi so với phác thảo** (`design/gdd-chuong-2.md` mục 6.2 ghi phản công thứ ba `(0, 12)` → `NAP`): thay bằng `(13, 12)` → `DI`. Đã đo: với `(0, 12)`, lời giải viết cứng `if khoang_cach <= 40:` qua cả ba tình huống phản công và được **3 sao**, vì không tình huống nào có tầm quét nhỏ mà khoảng cách nằm giữa tầm quét và 40. `(0, 12)` không bắt thêm đột biến nào mà hai phản công kia chưa bắt. `(13, 12)` bắt mọi ngưỡng khoảng cách viết cứng qua được lượt cơ bản (từ 30 tới 49) và đặt thêm một điểm "ngay ngoài biên" ở tầm quét khác. Lựa chọn và lý do: `design/quyet-dinh/level-2-2-lenh-nap.md` mục A; `design/gdd-chuong-2.md` mục 6.2 cần sửa theo.

### 8.1. Bảng phủ nhánh

Một quyết định: khối `if` có chạy không (khi viết theo code khởi đầu: mặc định `DI`, khối gán `NAP`).

| Test | Dữ liệu | Khối chạy? | `lenh` | Ghi chú |
|---|---|---|---|---|
| B1 | 25, 30 | có | `NAP` | trong tầm |
| B2 | 50, 30 | không | `DI` | ngoài tầm |
| B3 | 30, 30 | có | `NAP` | **biên** (bằng nhau), ở test cơ bản như hợp đồng mục 4 đòi |
| C1 | 41, 40 | không | `DI` | ngay ngoài biên, tầm quét mới |
| C2 | 40, 40 | có | `NAP` | biên, tầm quét mới |
| C3 | 13, 12 | không | `DI` | ngay ngoài biên, tầm quét nhỏ |

Cả hai nhánh (khối chạy / không chạy) có test cơ bản. Hai phía của biên đều có mặt: bằng nhau (B3, C2), hơn một (C1, C3).

### 8.2. Bảng đột biến (đã đo; số câu lệnh là của ba tình huống cơ bản)

| Đột biến | Khóa | `details` | Câu | Sao |
|---|---|---|---|---|
| Code gốc (thân không lùi vào) | `IndentationError` | dòng 8 | – | 0 |
| Đảo hướng: `khoang_cach > tam_quet` | `wrong_branch` | tình huống 1 | 2, 3, 2 | 0 |
| Sai biên: `khoang_cach < tam_quet` | `wrong_branch` | tình huống 3 | 3, 2, 2 | 0 |
| Lật phía: `khoang_cach >= tam_quet` | `wrong_branch` | tình huống 1 | 2, 3, 3 | 0 |
| Đổi chỗ hai vế: `tam_quet <= khoang_cach` | `wrong_branch` | tình huống 1 | 2, 3, 3 | 0 |
| Viết cứng tình huống 1: `lenh = "NAP"` | `wrong_branch` | tình huống 2 | 1, 1, 1 | 0 |
| Thụt lề sai: gán mặc định đặt sau khối `if` | `wrong_branch` | tình huống 1 (không dòng nào mờ: mọi dòng đều chạy) | 3, 2, 3 | 0 |
| Thụt lề sai: gán mặc định lùi vào trong khối | `missing_var` | tình huống 2 (dòng 7, 8 mờ: cả khối không chạy) | 3, 1, 3 | 0 |
| Thụt lề sai: thêm `lenh = "DI"` lùi vào cuối khối | `wrong_branch` | tình huống 1 | 4, 2, 4 | 0 |
| Bỏ gán mặc định | `missing_var` | tình huống 2 | 2, 1, 2 | 0 |
| Thiếu `:` | `SyntaxError` | dòng 7, "expected ':'" | – | 0 |
| `=` trong điều kiện | `SyntaxError` | dòng 7, "Maybe you meant '==' or ':=' instead of '='?" | – | 0 |
| Chữ thường `"nap"`/`"di"` | `wrong_value` | tình huống 1 | 3, 2, 3 | 0 |
| Gán tên biến: `lenh = "lenh"` | `wrong_value` | tình huống 1 | 3, 2, 3 | 0 |
| Gán cờ thay lệnh: `lenh = khoang_cach <= tam_quet` | `type_mismatch` | tình huống 1 | 1, 1, 1 | 0 |
| Tầm quét viết cứng: `khoang_cach <= 30` | `wrong_branch` | phản công 2 | 3, 2, 3 | 2 |
| Ngưỡng viết cứng: `khoang_cach <= 40` | `wrong_branch` | phản công 3 | 3, 2, 3 | 2 |
| Ngưỡng viết cứng: `khoang_cach < 45`, `< 50` | `wrong_branch` | phản công 1 | 3, 2, 3 | 2 |
| Viết cứng "nấp trừ khi 50": mặc định `NAP`, `if khoang_cach == 50` gán `DI` | `wrong_branch` | phản công 1 | 2, 3, 2 | 2 |
| Viết cứng dải 25–30 bằng `and` | `wrong_branch` | phản công 2 | 3, 2, 3 | 2 |
| Lời giải đúng cộng `print(lenh)` | `alert_exceeded` | | 4, 3, 4 | 1 |

Không đột biến nào được 3 sao. Viết cứng theo tình huống 1 được 0 sao. Mục "đảo `and`/`or`, ngoặc, `not`, thứ tự `elif`" của hợp đồng mục 4 không áp dụng: màn chưa có các cấu trúc đó.

Lời giải đúng khác cách viết cũng 3 sao (đã đo):

| Cách viết | Câu B1, B2, B3 |
|---|---|
| Mặc định `DI`, `if khoang_cach <= tam_quet:` gán `NAP` (lời giải tham khảo) | 3, 2, 3 |
| Mặc định `NAP`, `if khoang_cach > tam_quet:` gán `DI` | 2, 3, 2 |
| Hai `if` rời, không mặc định | 3, 3, 3 |
| `if not khoang_cach > tam_quet:` | 3, 2, 3 |
| `if khoang_cach < tam_quet + 1:` | 3, 2, 3 |
| `if/else` (chưa dạy) | 2, 2, 2 |
| `lenh = "NAP" if khoang_cach <= tam_quet else "DI"` (chưa dạy) | 1, 1, 1 |

### 8.3. Bảng đo câu lệnh

| Lời giải | B1 | B2 | B3 | C1 | C2 | C3 | Lớn nhất trên test cơ bản |
|---|---|---|---|---|---|---|---|
| 3 sao (tham khảo) | 3 | 2 | 3 | 2 | 3 | 2 | **3** |
| Hai `if` rời | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| 2 sao (tầm quét viết cứng) | 3 | 2 | 3 | – | – | – | 3 |

`alert_limit_statements`: **3**. Mức này không phạt hai `if` rời (cũng 3 câu): màn chưa dạy `else`, nên không có lối viết "đúng hơn" để phân biệt; 2.3 mới là màn phạt hai `if` rời. Màn không có mục tiêu dòng in, nên điều chỉnh "gán biến rồi in một lần" của báo cáo validate không áp dụng.

## 9. Lời giải mẫu

**2 sao** (trượt phản công 2: tầm quét 40, khoảng cách 40 nhận `'DI'`):

```python
lenh = "DI"
if khoang_cach <= 30:
    lenh = "NAP"
```

**3 sao** (3 câu lệnh, 40%):

```python
lenh = "DI"
if khoang_cach <= tam_quet:
    lenh = "NAP"
```

Hai đoạn trên đặt ở dòng 6–8, sau dòng khóa và chú thích của code khởi đầu.

## 10. OMNI phản công (sao thứ 3)

Câu chữ: `counter_attack_banner` (D1, `level:2.2`). Ý đồ: OMNI đổi drone trên rào; tầm quét không còn là con số Kai đã quen. Ba tình huống mới nằm sát biên. Bắt được: tầm quét viết cứng, ngưỡng khoảng cách viết cứng, viết cứng theo dữ liệu cơ bản.

## 11. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:2.2`).

**Gợi ý** (miễn kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Python báo dòng 8: dòng nằm dưới `if` phải lùi vào (4 dấu cách) để thuộc khối của nó. Rồi đọc lại điều kiện ở dòng 7 bằng lời: nó đang hỏi drone ở trong tầm hay ngoài tầm? |
| 2 (`hints[1]`) | Hướng tiếp cận: gán lệnh mặc định trước, rồi kiểm điều kiện, trong khối gán lệnh kia. Sau mỗi lượt, xem dòng nào bị làm mờ: dòng mờ là dòng không chạy ở tình huống đó. Xét riêng tình huống drone đứng đúng mép tầm quét (nối bài 2.1). Pseudocode ba dòng |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": cú pháp `if điều_kiện:` với dấu `:` và khối lùi 4 dấu cách, ví dụ khác dữ liệu màn; khối chỉ chạy khi điều kiện là `True`; thông báo `IndentationError: expected an indented block…`; gán mặc định trước `if` |

**Phản ứng miễn phí:** giọng cụt của ECHO, từ ngữ của rào, drone, lệnh; không nêu từ khóa, ký hiệu so sánh hay cách lùi dòng; không trích dữ liệu hay giá trị lệnh.

| Khóa | Ý đồ |
|---|---|
| `entry` | Hàng Rào Ngoại Vi; luật đầu tiên Kai tự viết; bảo chạy một lần |
| `IndentationError` (code gốc) | Python không biết dòng `{line}` có thuộc về điều kiện phía trên hay không; một khối lệnh phải nhìn ra được là khối |
| `wrong_branch` (lượt 2) | Mã đã chạy đúng một đường có thật, nhưng là đường dành cho một tình huống khác; xem dòng nào không chạy trong editor. Không dùng `{round}` (khóa này cũng đến từ lượt phản công, ở đó `{round}` hiện "?") |
| `wrong_value` | Chip của Kai nhận một lệnh mà drone không hiểu; lệnh phải đúng từng ký tự như ở ô Mục tiêu |
| `type_mismatch` | `{vars}` đang giữ một câu trả lời đúng/sai, không phải một lệnh |
| `missing_var` | Ở tình huống {round}, Kai không nhận được lệnh nào: có đường đi qua mà `{vars}` chưa từng được gán |
| `SyntaxError` | Dòng `{line}`: Python không đọc được dòng điều kiện; đọc dòng Python báo trong terminal |
| `NameError` | Theo khuôn Chương 1 |
| `alert_exceeded` | Lệnh đúng, nhưng quá nhiều câu lệnh; mỗi lệnh là một lần drone có thể nghe thấy |
| `wrong_value_counter` | (chỉ tới được khi giá trị sai không trùng lệnh nào: chữ thường, chữ lạ ở lượt phản công) OMNI đổi drone, lệnh không đổi theo |
| `three_stars` | Drone đổi mà luật của Kai vẫn đúng; ngắn |
| Khóa còn lại (`generic`, `repeated_fail`, `TypeError`, `ValueError`, `ZeroDivisionError`, `AttributeError`, `runtime_error`, `timeout`, `resource_limit`, `blocked_import`, `input_unsupported`, `system_exit`, `engine_error`, `type_mismatch_value_match`, `counter_type_mismatch`, `counter_error`, `counter_ValueError`, `counter_timeout`, `two_stars`) | Theo khuôn 1.5 |

`reaction_variants`: bắt buộc cho `wrong_branch` (lượt 2 và 3 ra cùng khóa liền nhau). Ý đồ câu thay: "vẫn" đi nhầm đường; chỉ thêm một chỗ để nhìn: tình huống drone đứng sát mép tầm quét. Không dùng `{round}`. Thêm câu thay cho `IndentationError` và `missing_var`.

Câu `wrong_branch` của 2.2 phải đúng ở cả ba nơi nó xuất hiện: lượt cơ bản sai hướng (lượt 2), sai biên (lượt 3), và lượt phản công (viết cứng). Vì vậy câu nói về "đường của tình huống khác", không nói "OMNI đổi" hay "điểm bằng nhau".

**Từ cấm của 2.2** (`forbidden_terms`, cộng `int`/`float`/`round` và giá trị `expected` do engine tự thêm, tức `NAP`, `DI`):

- từ khóa: `if`, `else`, `elif`;
- ký hiệu và tên phép so sánh: `==`, `!=`, `<=`, `>=`, `<`, `>`, "nhỏ hơn hoặc bằng", "lớn hơn hoặc bằng", "không vượt quá";
- cách sửa khối lệnh: "thụt lề", "thụt vào", "lùi vào", "dấu cách", "khoảng trắng", "dấu hai chấm";
- tên biến đầu vào `khoang_cach`, `tam_quet`;
- mọi dữ liệu tình huống: `25`, `30`, `50`, `41`, `40`, `13`, `12`.

Hệ quả cần nhớ khi viết câu: `DI` bị cấm như một từ riêng, không phân biệt hoa thường, nên ECHO không được viết "di chuyển"; dùng "đi", "bước", "rời chỗ". "nạp", "đi" không bị bắt (khác dấu).

## 12. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | `lenh` đúng kiểu `str` và đúng giá trị ở cả ba tình huống |
| ⭐⭐ | Thêm: ≤ 3 câu lệnh |
| ⭐⭐⭐ | Thêm: qua cả ba tình huống phản công |
| 0 sao | Trên 7 câu lệnh |

## 13. Người chơi lần lượt làm gì

1. Từ `after-2.1` vào màn, briefing gõ chữ, mục tiêu khóa vào, ECHO nói `entry` kèm Việc cần làm.
2. **Lượt 1:** `IndentationError` dòng 8; không tình huống nào chạy.
3. **Lượt 2:** lùi dòng 8 vào → `wrong_branch` ở tình huống 1; dòng 8 mờ; terminal "KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8".
4. **Lượt 3:** đổi `>` thành `<` → tình huống 1, 2 qua, tình huống 3 (30 với 30) trượt; `wrong_branch` lần hai, ECHO dùng câu thay.
5. **Rẽ sai thường gặp:** viết cứng `<= 30` (2 sao, phản công 2); đặt gán mặc định sau khối (`wrong_branch`, không dòng nào mờ); bỏ gán mặc định (`missing_var`).
6. **Lượt 4:** `<=` → 3 sao. Hộp kết quả: "Đã thu: Lệnh nấp".
7. TIẾP TỤC → Tổng kết → `after-2.2` → "VÀO NHIỆM VỤ" của 2.3.

## 14. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:2.2`).

- `scene`: `hang-rao-ngoai`. Phông từng nhịp `outro_beats`: `design/quyet-dinh/canh-cutscene.md` mục "Gắn vào truyện Chương 2".
- `outro`: drone bay qua đầu Kai mà không quay đèn; trong bộ nhớ đệm của một trụ rào còn một tệp cũ không thuộc dữ liệu tuần tra. Dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-01**, mảnh thứ ba; người đề xuất chia công tắc): ý nghĩa của mảnh "Quyết định". Không có nó, công tắc biết cách tắt nhưng không biết khi nào được tắt. Không nói mảnh nằm ở đâu, ai giữ.
- `component`: Lệnh nấp (ô 2/6).
- `outro_beats`, ba nhịp:

| # | Kiểu, nền | Ý đồ | Cue, hiệu ứng |
|---|---|---|---|
| 1 | card, `hang-rao-ngoai` | Tín hiệu 0xA7: Kai đi chậm quá; lịch của nó nhanh hơn | `glitch`, `fx: "signal_0xa7"` |
| 2 | echo | ECHO không nhắc tới 0xA7. Chỉ đọc phía trước: Bãi Container, đèn pha quét qua lại hai phía. Dẫn vào 2.3 | `fx: "trace"` (dọc chân rào) |
| 3 | kai | Một câu: Kai đi tiếp theo luật của mình | `fx: "focus"` |

- Móc câu: công tắc cần một "quyết định"; 0xA7 sốt ruột.
- Không được lộ: 0xA7 là ai, vì sao nó có lịch chính xác (để dành 2.5).

### 14.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.2`). Giọng kỹ thuật, không ECHO. Mọi `code` chạy bằng `python3` trong test tích hợp và phải in đúng `output`; ví dụ dùng dữ liệu khác màn.

| Mục | Ý chính |
|---|---|
| Cú pháp `if` | `if điều_kiện:` rồi khối lùi 4 dấu cách; khối chạy khi điều kiện là `True` (hai ví dụ: điều kiện đúng in ra, điều kiện sai không in gì) |
| Khối lệnh | Mọi dòng lùi vào cùng mức ngay dưới `if` thuộc về nó; khối có thể nhiều dòng |
| Giá trị mặc định | Gán trước `if`, gán đè trong khối; thứ tự hai lệnh quyết định kết quả |
| Điều kiện là một phép so sánh | Dùng lại sáu phép so sánh của 2.1; điểm bằng nhau |

Lỗi thường gặp (`mistakes`): thân không lùi vào → `IndentationError: expected an indented block after 'if' statement on line 2`; thiếu dấu `:` → `SyntaxError: expected ':'`; `=` trong điều kiện → `SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?`; không có giá trị mặc định mà điều kiện sai → `NameError: name '…' is not defined` khi dùng biến sau đó (đã thử: `NameError: name 'kq' is not defined`); gán mặc định đặt sau khối → luôn ra giá trị mặc định, không báo lỗi.

`next` báo trước màn sau: khi chỉ có hai ngả, phần "còn lại" của một điều kiện (`else`).

## 15. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `IndentationError` dòng 8 | **Có** (tích hợp) |
| Lượt 2, 3 theo mục 5.1 | `wrong_branch` tình huống 1, rồi tình huống 3; `skippedLines` `[8]` | **Có** |
| Lời giải 2 sao | 2 sao, `wrong_branch` ở phản công 2 | **Có** |
| Lời giải 3 sao và năm cách viết khác (mục 8.2) | 3 sao | **Có** (tham số hóa) |
| Mọi dòng bảng đột biến | Khóa, sao, số câu như mục 8.2 | **Có** (`tests/fixtures/solutions/2.2/*.py`) |
| Level không có câu `wrong_branch` (fixture giả, không phải 2.2) | Rơi về `wrong_value` / `wrong_value_counter` | Thuộc hạ tầng H4 |
| `print(lenh)` dò | 1 sao, `alert_exceeded` (terminal đã hiện `lenh`, `task_steps` không bảo in) | **Có** |
| Tab thay dấu cách, trộn tab và dấu cách | `TabError` → khóa `IndentationError` (`classify-run.ts`) | Không |
| Lời ECHO | Không chứa từ cấm, `NAP`, `DI`, số dữ liệu; `wrong_branch` không có `{round}` | **Có** |
| `task_steps` | Không chứa `NAP`/`DI` đứng riêng | **Có** (validator) |
| Timeline `patrol` có `decision.var` | Các trạng thái mục 7.1 | **Có** (`patrol-timeline.test.ts`, hạ tầng H6, level giả) |
| Ví dụ tổng kết | Chạy bằng `python3`, in đúng `output` | **Có** |
| Đi trọn đường | e2e `level-2-2.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 16. Dữ liệu level (tóm tắt cho `src/levels/level-2-2.json`)

- `id` `"2.2"`, `chapter` 2, `difficulty` `"easy"`, `concepts` `["if", "block"]`.
- `simulation`: `{ "kind": "patrol", "decision": { "var": "lenh" } }`.
- `inputs`: `["khoang_cach", "tam_quet"]`; `locked_lines`: `[2, 3]`.
- `objectives`: `lenh` kiểu `str`.
- `tests`, `counter_attack_tests`: mục 8. `alert_limit_statements`: 3.
- `scene`: `hang-rao-ngoai`; `outro_beats`: ba nhịp mục 14.
- `forbidden_terms`: mục 11.
- Lời giải và đột biến: `tests/fixtures/solutions/2.2/` (`original.py`, `two-star.py`, `three-star.py`, các cách viết 3 sao, một file cho mỗi dòng mục 8.2); test `tests/integration/level-2-2.test.ts`.

## 17. Tiêu chí chấp nhận

1. Code khởi đầu cho đúng chuỗi khóa mục 5.1 qua harness thật, kể cả `skippedLines: [8]` ở lượt 2 và 3.
2. Mọi dòng bảng đột biến ra đúng khóa, sao, số câu; không dòng nào 3 sao; `khoang_cach <= 40` chỉ 2 sao.
3. Lời giải 3 sao 3 câu (lớn nhất trên test cơ bản); hai `if` rời cũng 3 sao.
4. Câu `wrong_branch` và câu thay của nó có trong D1, không chứa `{round}`; test từ cấm, validator, `content-migration.test.ts` qua với migration `0012`.
5. Mô phỏng `patrol` với `decision.var` vẽ đủ các trạng thái mục 7.1.
6. typecheck, `npm test`, `npm run test:py`, build qua; e2e được viết.

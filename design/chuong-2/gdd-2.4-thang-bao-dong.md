# Level 2.4 – "Thang báo động"

> Chương 2 – Trạm Sentinel · Độ khó: Medium · Khái niệm: `elif` (nhiều nhánh, chỉ nhánh đúng đầu tiên chạy, thứ tự quan trọng)
> Câu đố: `src/levels/level-2-4.json`. Câu chữ người chơi đọc: tài liệu `level:2.4` ở D1 (câu ban đầu vào `db/migrations/0014_content_level_2_4.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Trục truyện và phác câu đố: `design/gdd-chuong-2.md` mục 6.4. Hợp đồng engine (thắng GDD này khi lệch): `docs/hop-dong-engine-chuong-2.md`. Brainstorm: `design/quyet-dinh/level-2-4-thang-bao-dong.md`.
> Mọi con số trong tài liệu này đo bằng `run_level` thật ngày 30/10/2026 trên python3 3.13.2, chạy lại trên 3.14.8 cho cùng kết quả (chỉ khác lời báo của một `SyntaxError`, ghi ở mục 8.2). Khóa `wrong_branch` và dòng mờ (`skipped_lines`) đã kiểm lại bằng `tests/integration/level-2-4.test.ts`.

## 1. Bối cảnh

Cuối Bãi Container là Tháp Đèn Pha, tháp phụ đặt mức báo động cho cả khu. Tháp đo khoảng cách tới tín hiệu lạ gần nhất rồi chọn một trong bốn mức. Mức càng cao, đèn pha quét càng dày và drone kéo về càng đông. Kai muốn đi lúc tháp còn ở mức thấp, nên phải biết trước tháp sẽ chọn mức nào với mỗi khoảng cách. Tháp xét từ gần nhất ra xa và dừng ở mức đầu tiên khớp.

## 2. Mục tiêu học

Người chơi rời màn biết:

- `if / elif / elif / else` là một chuỗi: Python xét từ trên xuống, chạy nhánh đầu tiên có điều kiện đúng rồi bỏ qua mọi nhánh còn lại.
- Thứ tự quan trọng: đặt điều kiện rộng (`< 100`) lên trước thì nhánh hẹp (`< 20`) không bao giờ tới.
- Các `if` rời không phải là chuỗi: mỗi `if` đều được kiểm, có thể chạy nhiều nhánh (in nhiều dòng) hoặc phải gán đè.
- `<` và `<=` khác nhau đúng ở điểm bằng nhau (nối lại 2.1, kiểm ở lượt phản công).

Không dạy: `and`/`or` để ghép khoảng (2.5), điều kiện lồng (2.6).

## 3. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.4`).

Briefing là nhật ký của Tháp Đèn Pha, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- tháp đặt mức báo động cho cả khu theo khoảng cách (mét) tới tín hiệu lạ gần nhất;
- có bốn mức; tháp xét từ gần nhất ra xa và dừng ở mức đầu tiên khớp (thang ở ô Mục tiêu);
- mỗi lần đo là một tình huống; Kai phải in đúng mức tháp sẽ đặt, từng ký tự.

Briefing không nêu từ khóa nào, không viết ký hiệu so sánh. Các mốc 20, 50, 100 và tên bốn mức được phép ở briefing và nhãn mục tiêu (đặc tả).

`location`: Vành Sentinel, Tháp Đèn Pha.

### 3.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.4`) (4 bước). Không chứa dòng mong đợi nào (`MUC: …`) hay số của tình huống nào. Bốn bước lần lượt nói:

1. bấm CHẠY với mã có sẵn; sau mỗi lượt, dòng mờ là dòng không chạy ở tình huống đang hiện;
2. sửa để mỗi tình huống in đúng một dòng: mức tháp sẽ đặt, theo thang ở ô Mục tiêu;
3. để ý khoảng cách đúng bằng một mốc thuộc mức nào (thang ghi "dưới"); không sửa dòng khóa;
4. hoàn thành khi mục tiêu chuyển thành xanh ở cả bốn tình huống; dùng không quá 5 câu lệnh và vẫn đúng khi OMNI đổi khoảng cách thì được thêm sao.

## 4. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (dòng in 1); khung chat ECHO | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng `patrol` dưới Tháp Đèn Pha (mục 7) |

## 5. Code khởi đầu (có lỗi cài sẵn)

```python
# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
if khoang_cach < 100:
    print("MUC: CANH GIAC")
elif khoang_cach <= 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 20:
    print("MUC: BAO DONG")
else:
    print("MUC: AN TOAN")
```

Dòng 2 khóa, nạp qua `inputs` (`khoang_cach` là số nguyên). Hai lỗi cài sẵn, không lỗi nào có traceback:

| Dòng | Lỗi | Python cho ra | Bài học |
|---|---|---|---|
| 5–10 | Thang xếp ngược: điều kiện rộng nhất đứng đầu | Tình huống 1 (10 m) in `MUC: CANH GIAC` | Chỉ nhánh đúng đầu tiên chạy; nhánh hẹp phải đứng trước |
| 7 | `<=` ở mốc 50, trong khi thang ghi "dưới 50" | Lượt cơ bản không lộ; phản công 50 m in `MUC: NGUY HIEM` | Điểm bằng nhau thuộc mức trên (nối lại 2.1) |

Lỗi thứ hai cố ý chỉ lộ ở lượt phản công, như dòng ca viết cứng của 1.6: người chơi đọc kỹ thấy `<=` lạc giữa ba dấu `<`.

### 5.1. Chuỗi khóa phản ứng qua các lượt (đã đo)

| Lượt | Mã | Kết quả | Khóa | Câu lệnh (4 tình huống) | Dòng mờ ở tình huống hiện |
|---|---|---|---|---|---|
| 1 | Code khởi đầu | Tình huống 1 in mức của tình huống 3 | `wrong_branch`, `out_line` 1, `round` 1 | 2, 2, 2, 4 | 7, 8, 9, 10, 12 |
| 2a | Đưa một nhánh lên đầu nhưng chưa đủ (ví dụ `<= 50` lên đầu) | Tình huống 1 in mức của tình huống 2 | `wrong_branch`, `round` 1 | 2, 2, 4, 4 | 7, 8, 9, 10, 12 |
| 2b | Xếp đúng thứ tự, còn `<= 50` | Cơ bản qua, phản công 50 m trượt | `wrong_branch` (phản công), 2 sao | 2, 3, 4, 4 | 7, 8, 9, 10, 12 (tình huống 1) |
| 3 | Đổi `<= 50` thành `< 50` | Đúng cả hai lượt | `three_stars`, 3 sao | 2, 3, 4, 4 | 7, 8, 9, 10, 12 (tình huống 1) |

Ở lượt 1, chỉ dòng 5 và 6 còn sáng ở tình huống 1: người chơi thấy tháp dừng ngay ở nhánh đầu và không xét tiếp.

## 6. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.4`). Nhãn ghi thang bằng lời, có tên bốn mức và ba mốc (đặc tả), không ghi kết quả của tình huống nào.

| Mục tiêu | Ý của nhãn | Tình huống 1 (10 m) |
|---|---|---|
| dòng 1 (`output_line`) | `MUC:`, một dấu cách, rồi mức: dưới 20 là `BAO DONG`, dưới 50 là `NGUY HIEM`, dưới 100 là `CANH GIAC`, còn lại là `AN TOAN` | `MUC: BAO DONG` |

- Đúng một dòng; không dòng thừa. Chương trình chạy hết, không lỗi. Luật so khớp như 1.1.
- **Mức cảnh báo ≤ 40%** (≤ 5 câu lệnh; 100% = 12).

## 7. Diễn biến khi chạy (mô phỏng `patrol`)

`"simulation": { "kind": "patrol", "decision": { "line": 1 } }`. Bốn tình huống cơ bản, mỗi tình huống một lần tháp đo. Bảng cảm biến hiện chip `khoang_cach`. Chip của Kai hiện dòng 1 nhận được (mức Kai đoán). Khớp: Kai đi đúng lúc, drone không quay lại. Lệch: đèn khóa vào Kai.

### 7.1. Bảng biên cho timeline (trạng thái timeline phải vẽ)

| Trạng thái | Khi nào (đã đo) | Timeline vẽ |
|---|---|---|
| Tình huống qua | Dòng 1 đúng | "DRONE BỎ QUA" |
| Mức của tình huống khác | `wrong_branch` (thang ngược, sai biên ở phản công, viết cứng) | Chip đỏ, cần/nhận cạnh nhau, "BỊ PHÁT HIỆN" |
| Không in gì | `print` chung thụt vào trong `else` (`output_missing`) | Chip trống, đèn khóa vào Kai |
| In nhiều dòng | Các `if` rời in ở mỗi nhánh đúng (`output_extra`) | Chip hiện dòng 1 (đúng), các dòng thừa ở danh sách dòng; tình huống trượt |
| Gõ sai chữ trong dòng | `output_mismatch`, `output_case_only` | Chip đỏ, ký tự lệch đầu tiên tô đỏ |
| Lỗi lúc chạy | `NameError` (gán ba nhánh, thiếu `else`, tình huống 150 m) | Đèn khóa ở tình huống 4, nhãn lỗi; tình huống 1–3 đã qua vẫn xanh |
| Lỗi cú pháp, thụt lề | `elif` sau `else`, thân `elif` không thụt lề | Không tình huống nào chạy |
| Các tình huống sau tình huống trượt | Mọi lượt trượt | Xám "CHƯA TỚI" |
| Đúng nhưng quá 5 câu lệnh | Các `if` rời gán đè (8), gán mặc định rồi chuỗi `elif` không `else` (6) | Như khuôn chung cho `alert_exceeded` |
| Phản công | 20, 50, 100, 0 m | Băng `counter_attack_banner`, "OMNI ĐỔI LUẬT TUẦN TRA", bốn tình huống mới, dừng ở tình huống trượt đầu tiên |
| Phản công bị cắt | `timeout`, `counterAborted`, `error.phase === "counter"`, thiếu `counterOutput` | "TIẾN TRÌNH BỊ CẮT" |
| Sau khi phát xong, lượt không lỗi | `skipped_lines` | Editor làm mờ; terminal in `> KHÔNG CHẠY Ở TÌNH HUỐNG n: dòng …` |

**Terminal** (lượt 1, ví dụ; chữ thật theo `sim-vocabulary.ts`):

```
> TÌNH HUỐNG 1/4 · khoang_cach = 10
>   dòng 1 · sai ở vị trí 6
>     cần:  MUC:·BAO·DONG
>     nhận: MUC:·CANH·GIAC
> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 7, 8, 9, 10, 12
> DRONE PHÁT HIỆN
```

## 8. Dữ liệu test (giá trị JSON)

```json
"inputs": ["khoang_cach"],
"locked_lines": [2],
"tests": [
  { "inputs": { "khoang_cach": 10 },  "expected": {}, "expected_output": ["MUC: BAO DONG"] },
  { "inputs": { "khoang_cach": 35 },  "expected": {}, "expected_output": ["MUC: NGUY HIEM"] },
  { "inputs": { "khoang_cach": 75 },  "expected": {}, "expected_output": ["MUC: CANH GIAC"] },
  { "inputs": { "khoang_cach": 150 }, "expected": {}, "expected_output": ["MUC: AN TOAN"] }
],
"counter_attack_tests": [
  { "inputs": { "khoang_cach": 20 },  "expected": {}, "expected_output": ["MUC: NGUY HIEM"] },
  { "inputs": { "khoang_cach": 50 },  "expected": {}, "expected_output": ["MUC: CANH GIAC"] },
  { "inputs": { "khoang_cach": 100 }, "expected": {}, "expected_output": ["MUC: AN TOAN"] },
  { "inputs": { "khoang_cach": 0 },   "expected": {}, "expected_output": ["MUC: BAO DONG"] }
]
```

### 8.1. Bảng phủ nhánh

Một chuỗi bốn nhánh: `< 20`, `< 50`, `< 100`, `else`.

| Test | `khoang_cach` | Nhánh | Ghi chú |
|---|---|---|---|
| Cơ bản 1 | 10 | `< 20` | Bắt thang ngược và mọi thứ tự đặt nhánh rộng trước `< 20` |
| Cơ bản 2 | 35 | `< 50` | Bắt `< 100` đứng trước `< 50` |
| Cơ bản 3 | 75 | `< 100` | |
| Cơ bản 4 | 150 | `else` | Nhánh dài nhất (4 câu lệnh) có mặt ở lượt cơ bản |
| Phản công 1 | 20 | `< 50` | **Biên** 20 |
| Phản công 2 | 50 | `< 100` | **Biên** 50 (bắt lỗi cài sẵn ở dòng 7) |
| Phản công 3 | 100 | `else` | **Biên** 100 |
| Phản công 4 | 0 | `< 20` | Giá trị nhỏ nhất |

Mọi nhánh có test cơ bản. Ba biên nằm ở phản công. Khái niệm chính của màn là thứ tự nhánh, và thứ tự sai lộ ngay ở lượt cơ bản (tình huống 1, 2); `<` hay `<=` ở điểm bằng nhau là khái niệm của 2.1, nên để ở phản công làm nấc phân biệt 2 sao với 3 sao. Đây là cách phác thảo `design/gdd-chuong-2.md` mục 6.4 đã chọn; brainstorm ghi lý do giữ.

### 8.2. Bảng đột biến (đã đo; câu lệnh là của bốn tình huống cơ bản)

Mỗi đột biến là toàn bộ file editor (dòng 1–4 như code khởi đầu). Không đột biến nào được 3 sao.

| # | Đột biến | Khóa | Tình huống | Câu lệnh | Sao |
|---|---|---|---|---|---|
| 1 | Code khởi đầu (thang ngược, `<= 50`) | `wrong_branch` | 1 | 2, 2, 2, 4 | 0 |
| 2 | Thang ngược, mọi mốc `<` | `wrong_branch` | 1 | 2, 2, 2, 4 | 0 |
| 3 | Đổi chỗ hai nhánh đầu (`< 50` trước `< 20`) | `wrong_branch` | 1 | 2, 2, 4, 4 | 0 |
| 4 | Đúng thứ tự, còn `<= 50` (lời giải 2 sao) | `wrong_branch` (phản công) | PC 2 | 2, 3, 4, 4 | 2 |
| 5 | Đúng thứ tự, cả ba mốc `<=` | `wrong_branch` (phản công) | PC 1 | 2, 3, 4, 4 | 2 |
| 6 | Xét từ xa vào, `>` thay `>=` (`> 100`, `> 50`, `> 20`) | `wrong_branch` (phản công) | PC 1 | 4, 4, 3, 2 | 2 |
| 7 | Viết cứng theo tình huống 1: `print("MUC: BAO DONG")` | `wrong_branch` | 2 | 1, 1, 1, 1 | 0 |
| 8 | Viết cứng từng giá trị: `== 10`, `== 35`, `== 75`, `else` | `wrong_branch` (phản công) | PC 1 | 2, 3, 4, 4 | 2 |
| 9 | Tách `elif` thành các `if` rời, mỗi nhánh một `print` | `output_extra` (2 dòng thừa) | 1 | 6, 5, 4, 4 | 0 |
| 10 | Tách nửa chuỗi: `if/elif` rồi `if/else` mới | `output_extra` (1 dòng thừa) | 1 | 4, 5, 4, 4 | 0 |
| 11 | Các `if` rời gán đè, rộng trước hẹp sau, mặc định `AN TOAN`, in một lần | `alert_exceeded` | | 8, 7, 6, 5 | 1 |
| 12 | Như 11 nhưng hẹp trước rộng sau | `wrong_branch` | 1 | 8, 7, 6, 5 | 0 |
| 13 | Gán mặc định `AN TOAN` rồi chuỗi `if/elif/elif` không `else`, in một lần | `alert_exceeded` | | 4, 5, 6, 5 | 1 |
| 14 | Gán ba nhánh, thiếu `else`, in một lần | `NameError`, dòng 11 | 4 | | 0 |
| 15 | Gán đủ bốn nhánh nhưng `print` chung thụt vào trong `else` | `output_missing` | 1 | 2, 3, 4, 5 | 0 |
| 16 | Thân `elif` không thụt lề | `IndentationError`, dòng 8 | | | 0 |
| 17 | `elif` đặt sau `else` | `SyntaxError`, dòng 9 (3.13: "invalid syntax"; 3.14: "'elif' block follows an 'else' block") | | | 0 |
| 18 | Thiếu `:` sau điều kiện | `SyntaxError`, dòng 5 ("expected ':'") | | | 0 |
| 19 | Gõ thiếu dấu cách: `"MUC:BAO DONG"` | `output_mismatch`, cột 5 | 1 | 2, 3, 4, 4 | 0 |

Không áp dụng: đảo `and`/`or`, bỏ ngoặc, quên `not` (chưa dạy). Viết cứng theo tình huống 1 trượt ngay ở lượt cơ bản (dòng 7). Viết cứng từng giá trị (dòng 8) được 2 sao, mức tối đa hợp đồng mục 4 cho phép; hạ xuống 1 sao cần thêm một tình huống cơ bản lặp nhánh, đổi lại bốn tình huống thành năm. Đã chọn giữ bốn (brainstorm).

`wrong_branch` không có ở dòng 19 vì `MUC:BAO DONG` không trùng dòng mong đợi nào. Dòng `print("MUC: {muc}")` thiếu `f` cho `output_mismatch` (cột 6), không phải `output_is_label`, vì `muc` không phải tên đầu vào hay tên mục tiêu; màn không cần câu `output_is_label`.

### 8.3. Bảng đo câu lệnh

| Lời giải | Cơ bản 10 / 35 / 75 / 150 | Phản công 20 / 50 / 100 / 0 | Lớn nhất (cơ bản) | Sao |
|---|---|---|---|---|
| Chuỗi `elif`, `print` trong từng nhánh (3 sao, mục 9) | 2 / 3 / 4 / 4 | 3 / 4 / 4 / 2 | 4 | 3 |
| Chuỗi `elif` gán `muc`, in một lần sau khối | 3 / 4 / 5 / 5 | 4 / 5 / 5 / 3 | **5** | 3 |
| Xét từ xa vào (`>= 100`, `>= 50`, `>= 20`, `else`) | 4 / 4 / 3 / 2 | | 4 | 3 |
| Biểu thức `a if c else b` lồng, một `print` | 1 / 1 / 1 / 1 | | 1 | 3 |
| Bốn `if` rời có khoảng (`>= 20 and < 50`; dùng `and` của 2.5) | 5 / 5 / 5 / 5 | | 5 | 3 |
| Lời giải 2 sao (mục 9) | 2 / 3 / 4 / 4 | 3 / 3 / 4 / 2 | 4 | 2 |
| Gán mặc định rồi chuỗi `elif` không `else` | 4 / 5 / 6 / 5 | | 6 | 1 |
| Các `if` rời gán đè | 8 / 7 / 6 / 5 | | 8 | 1 |

**`alert_limit_statements`: 5.** Bằng số câu lớn nhất của lối "gán biến rồi in một lần" (báo cáo validate khung, điều chỉnh 1), nên lối viết sạch này không bị phạt. Ngưỡng vẫn phân biệt lối sai màn muốn dạy: các `if` rời gán đè tới 8 câu, gán mặc định rồi chuỗi `elif` không `else` tới 6 câu, cả hai chỉ 1 sao. Phác thảo cũ đề xuất 4 (lời giải `print` trong từng nhánh); đã nâng lên 5. Đánh đổi: bốn `if` rời có khoảng viết bằng `and` cũng 5 câu, được 3 sao. Lối này cần `and` (chưa dạy tới 2.5), chạy đúng mọi khoảng cách, và tổng kết kiến thức chỉ ra vì sao chuỗi `elif` gọn hơn.

## 9. Lời giải mẫu

Lời giải 3 sao (tối đa 4 câu lệnh, 32%):

```python
# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
if khoang_cach < 20:
    print("MUC: BAO DONG")
elif khoang_cach < 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 100:
    print("MUC: CANH GIAC")
else:
    print("MUC: AN TOAN")
```

Lời giải 3 sao kiểu gán rồi in (tối đa 5 câu lệnh, 40%):

```python
# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
if khoang_cach < 20:
    muc = "BAO DONG"
elif khoang_cach < 50:
    muc = "NGUY HIEM"
elif khoang_cach < 100:
    muc = "CANH GIAC"
else:
    muc = "AN TOAN"
print(f"MUC: {muc}")
```

Lời giải 2 sao (qua lượt cơ bản, trượt phản công ở 50 m với `wrong_branch`): code khởi đầu xếp lại đúng thứ tự, giữ `<=` ở dòng 7.

```python
# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
if khoang_cach < 20:
    print("MUC: BAO DONG")
elif khoang_cach <= 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 100:
    print("MUC: CANH GIAC")
else:
    print("MUC: AN TOAN")
```

## 10. OMNI phản công (sao thứ 3)

Dòng cảnh báo là `counter_attack_banner` (D1, `level:2.4`): OMNI cho tín hiệu lạ dừng đúng trên các vạch của thang. Bốn tình huống mới: 20, 50, 100, 0 m. Bắt được: `<=` thay `<` ở bất kỳ mốc nào, `>` thay `>=` khi xét từ xa vào, viết cứng theo giá trị của lượt cơ bản.

## 11. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants`, `counter_attack_banner` (D1, `level:2.4`).

**Gợi ý:**

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Nhìn tình huống 1: tín hiệu ở rất gần mà tháp chọn một mức nhẹ. Dòng nào còn sáng? Python xét từ trên xuống và dừng ở điều kiện đúng đầu tiên; với khoảng cách rất nhỏ, điều kiện nào đúng trước? |
| 2 (`hints[1]`) | Hướng tiếp cận: xếp các mức từ hẹp nhất (gần nhất) tới rộng nhất; mức cuối không cần điều kiện. "Dưới 50" nghĩa là đúng 50 thì chưa thuộc mức đó. Pseudocode bốn nhánh, chưa có code |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": `if` / `elif` / `else` với một ví dụ khác đáp án (xếp loại điểm); chỉ một nhánh chạy; đặt điều kiện rộng lên đầu thì nhánh sau không bao giờ tới; `<` và `<=` khác nhau ở điểm bằng nhau; các `if` rời đều được kiểm, có thể chạy nhiều nhánh |

**Phản ứng miễn phí:** giọng cụt nhưng đủ câu, từ ngữ của tháp, thang, khoảng cách, tình huống; không nêu từ khóa, ký hiệu so sánh, tên mức hay mốc, không nói cách sửa ("đảo thứ tự", "hẹp trước").

| Khóa | Ý đồ |
|---|---|
| `entry` | Tháp Đèn Pha đặt mức cho cả khu; Kai cần biết trước tháp sẽ chọn gì; bảo chạy một lần rồi nhìn dòng nào còn sáng |
| `wrong_branch` | Mức Kai đoán là mức của một tình huống khác. Tháp đã dừng ở một nhánh có thật, chỉ là dừng sớm hoặc muộn. Nhìn những dòng còn sáng. Không dùng `{round}` (dùng chung cho lượt phản công) |
| `output_extra` | Tháp chỉ đặt một mức mỗi lần, mà mã in ra `{count}` dòng thừa: nhiều nhánh đã cùng chạy |
| `output_missing` | Ở tình huống `{round}`, Kai không đưa ra mức nào: dòng in không chạy |
| `output_mismatch`, `output_case_only` | Theo khuôn 1.1, có `{round}`: ký tự thứ `{col}` |
| `NameError` | Ở một tình huống, tên được in chưa từng được gán: không nhánh nào nhận khoảng cách đó |
| `alert_exceeded` | Đúng cả bốn tình huống, nhưng `{count}` câu lệnh. Tháp chỉ xét mỗi mức một lần, còn mã thì xét lại hoặc gán đè |
| `wrong_value_counter` | OMNI cho tín hiệu dừng ở chỗ mới, mức Kai đoán không khớp mức nào trong thang (khi không trùng tình huống nào) |
| `counter_error`, `counter_timeout` | Theo khuôn 1.6 |
| `SyntaxError`, `IndentationError`, `TypeError`, `runtime_error` | Theo khuôn 1.6. `SyntaxError` không nói thứ tự `elif`/`else`; traceback ở terminal đã nói |
| `two_stars`, `three_stars` | Ngắn. `three_stars`: tín hiệu dừng đúng trên vạch mà Kai vẫn đoán trúng |
| Các khóa chung còn lại (`timeout`, `resource_limit`, `blocked_import`, `system_exit`, `repeated_fail`, `engine_error`, `generic`) | Theo khuôn 1.6 |

`reaction_variants` có câu thay thế cho `wrong_branch`, `output_extra` và `alert_exceeded`: nói "vẫn" và chỉ thêm một chỗ để nhìn (dòng đầu tiên còn sáng; đếm số dòng in ra).

**Từ cấm của 2.4** (`forbidden_terms`, cộng danh sách chung, mọi dòng `expected_output` và các cụm số từ 2 chữ số trong đó):

```json
["if", "elif", "else", "<", ">", "<=", ">=", "==", "!=",
 "lớn hơn hoặc bằng", "nhỏ hơn hoặc bằng", "đảo thứ tự", "thứ tự ngược", "hẹp trước", "rộng trước",
 "thụt lề", "dấu hai chấm", "khoang_cach",
 "BAO DONG", "NGUY HIEM", "CANH GIAC", "AN TOAN",
 "10", "35", "75", "150", "20", "50", "100", "0"]
```

Tên bốn mức bị cấm riêng vì luật tự động chỉ bắt cả dòng `MUC: …`, không bắt tên mức đứng một mình.

## 12. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Đúng một dòng, đúng mức ở cả bốn tình huống, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 5 câu lệnh ở mọi tình huống cơ bản |
| ⭐⭐⭐ | Thêm: vượt phản công (20, 50, 100, 0 m) |
| 0 sao | Trên 12 câu lệnh |

Không đổi `compute-stars.ts`.

## 13. Người chơi lần lượt làm gì

1. Vào màn, briefing gõ chữ, mục tiêu khóa vào, ECHO nói `entry`. Bấm CHẠY.
2. **Lượt 1:** tình huống 1, tháp đặt mức của tình huống 3; chỉ dòng 5, 6 còn sáng. ECHO nói `wrong_branch`.
3. **Rẽ hay gặp:**
   - đưa từng nhánh lên một chút: vẫn `wrong_branch` ở tình huống 1 cho tới khi `< 20` đứng đầu;
   - đổi mọi `elif` thành `if`: in hai, ba dòng, `output_extra`;
   - viết lại bằng các `if` rời gán đè: đúng nhưng 8 câu lệnh, 1 sao.
4. **Xếp đúng thứ tự** → 2 sao; phản công trượt ở 50 m (`wrong_branch`).
5. **Đổi `<=` thành `<`** → 3 sao. Hộp kết quả: "Đã thu: Thang báo động".
6. TIẾP TỤC → Tổng kết kiến thức → `after-2.4` → "VÀO NHIỆM VỤ" của 2.5.

## 14. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:2.4`). Cảnh: `scene` là `thap-den-pha`; nhịp 3 của `outro_beats` có `focus` lên đỉnh tháp.

- `outro`: tháp hạ về mức thấp nhất đúng lúc Kai đi qua chân tháp. Bảng luật của tháp mở trên màn hình bảo trì; ở góc bảng có dòng chú thích của người đặt ngưỡng, dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-02**, mảnh thứ hai; người viết luật cho drone và Trạm Sentinel): các ngưỡng do tám người đặt; con số 60 được chọn trong một buổi chiều, sau đó không ai nghĩ lại. Không nói 60 là ngưỡng của cái gì: nhịp truyện sẽ nói.
- `component`: Thang báo động (ô 4/6).
- `outro_beats`, ba nhịp:
  1. log, `scan`: bảng luật của tháp còn một thang thứ hai, không đo khoảng cách mà đo công dân: mức tuân thủ dưới 60% thì tái định hướng (Ngưỡng tái định hướng, `design/gdd-chuong-2.md` mục 1).
  2. kai, `hold_ms` 1500: Kai hiểu Nhi đã bị xử lý bởi đúng một phép so sánh. Một hai câu, không gào.
  3. echo: ECHO chỉ đọc luật: ngưỡng áp cho mọi công dân, tháp chỉ so rồi chọn. Không an ủi, không hứa cứu Nhi (luật ECHO chương 2).
- Móc câu: điều gì đã đẩy Nhi xuống dưới 60%; ai đặt ngưỡng đó.

Câu ECHO ở nhịp 3 không chứa từ cấm (không có `<`, không có tên mức); "dưới" và "60" được phép.

### 14.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.4`). Giọng kỹ thuật, không ECHO. Mọi `code` chạy bằng `python3`; ví dụ khác đáp án (không dùng khoảng cách, mức hay mốc của màn).

| Mục | Ý chính |
|---|---|
| Chuỗi `if / elif / else` | Ví dụ xếp loại điểm bốn mức; đúng một nhánh chạy |
| Nhánh đúng đầu tiên thắng | Cùng ví dụ, đặt điều kiện rộng lên đầu thì mọi điểm đều ra cùng một loại |
| `else` ở cuối chuỗi | Nhận mọi trường hợp còn lại; thiếu `else` thì có giá trị không nhánh nào nhận |
| Các `if` rời khác chuỗi `elif` | Mỗi `if` đều được kiểm; ví dụ in hai dòng cho một giá trị |
| `<` hay `<=` ở mốc | Giá trị đúng bằng mốc rơi vào nhánh nào |
| Gán trong nhánh rồi in một lần | Cách viết khác, cùng kết quả |

Lỗi thường gặp (`mistakes`): `elif` sau `else` → `SyntaxError` (ghi lời báo người chơi sẽ thấy trong Pyodide, Python 3.14: `'elif' block follows an 'else' block`; mục `mistakes` không bị chạy trong test nên không vướng khác biệt với 3.13); thân `elif` không thụt lề → `IndentationError`; thiếu `else` rồi in biến → `NameError`; các `if` rời in nhiều dòng (không báo lỗi).

`next` báo trước màn sau: một quyết định ghép từ nhiều điều kiện.

## 15. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code khởi đầu | `wrong_branch`, `round` 1, câu lệnh 2/2/2/4, dòng mờ 7–10, 12 | **Có** (tích hợp) |
| Lời giải 3 sao (`print` trong nhánh; gán rồi in; xét từ xa vào) | 3 sao, 4, 5, 4 câu lệnh | **Có** (tham số hóa) |
| Lời giải 2 sao | 2 sao, `wrong_branch` ở phản công 50 m | **Có** |
| Mọi dòng bảng đột biến 8.2 | Đúng khóa, sao, câu lệnh | **Có** (`tests/fixtures/solutions/2.4/`) |
| Bốn `if` rời có khoảng bằng `and` | 3 sao, 5 câu (chấp nhận, mục 8.3) | **Có** |
| Khoảng cách âm | Không có trong test; rơi vào nhánh đầu | Không |
| `print("MUC:", muc)` | Đạt (chấm theo đầu ra) | Không |
| Lời ECHO | Không chứa từ cấm, tên mức, mốc, dòng mong đợi | **Có** |
| Timeline `patrol` với `decision.line`, `output_extra`, `output_missing` | Các trạng thái ở mục 7.1 | **Có** (nhánh hạ tầng) |
| Đi trọn đường: code khởi đầu → 3 sao | e2e `level-2-4.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 16. Dữ liệu level (tóm tắt cho `src/levels/level-2-4.json`)

Câu đố, JSON thắng khi lệch. Câu chữ ở D1 (tài liệu `level:2.4`, migration `0014`).

- `id` `"2.4"`, `chapter` 2, `difficulty` `"medium"`, `concepts` `["elif", "branch_order"]`.
- `simulation`: `{ "kind": "patrol", "decision": { "line": 1 } }`.
- `starter_code`: mục 5, đúng từng ký tự. `locked_lines` `[2]`, `inputs` `["khoang_cach"]`.
- `objectives`: `[{ "kind": "output_line", "line": 1 }]` (nhãn ở D1).
- `tests`, `counter_attack_tests`: mục 8. `alert_limit_statements` 5. `float_abs_tolerance` `1e-9`.
- `forbidden_terms`: mục 11.
- `scene` `"thap-den-pha"`; `outro_beats` (khung): `[{ "kind": "log", "fx": "scan" }, { "kind": "kai", "hold_ms": 1500 }, { "kind": "echo", "fx": "focus" }]`.
- Khóa `reactions` bắt buộc có câu: mọi khóa ở mục 11, gồm `wrong_branch`, `output_extra`, `NameError`.

## 17. Tiêu chí chấp nhận

1. Code khởi đầu cho `wrong_branch` ở tình huống 1 (test tích hợp qua `run-harness.ts`).
2. Lời giải 3 sao (`print` trong nhánh: tối đa 4 câu; gán rồi in: tối đa 5 câu) đều 3 sao; lời giải 2 sao: 2 sao, `wrong_branch` ở phản công 50 m.
3. Mọi dòng bảng đột biến 8.2 cho đúng khóa, sao, câu lệnh; không đột biến nào 3 sao; các `if` rời gán đè chỉ 1 sao.
4. Mọi nhánh có test cơ bản; ba biên ở phản công; nhánh dài nhất ở lượt cơ bản.
5. Câu ECHO sạch từ cấm, tên mức, mốc và dòng mong đợi; `wrong_branch` không dùng `{round}`.
6. Mô phỏng vẽ đủ các trạng thái ở mục 7.1.
7. Ví dụ tổng kết chạy đúng bằng `python3`; migration `0014` qua `content-migration.test.ts`; typecheck, `npm test`, `npm run test:py`, build qua; e2e được viết.

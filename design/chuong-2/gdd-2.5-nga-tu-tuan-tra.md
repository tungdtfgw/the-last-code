# Level 2.5 – "Ngã tư tuần tra"

> Chương 2 – Trạm Sentinel · Độ khó: Medium · Khái niệm: `and`, `or`, `not`, ngoặc trong điều kiện ghép
> Câu đố: `src/levels/level-2-5.json` (chưa dựng). Câu chữ người chơi đọc: tài liệu `level:2.5` ở D1 (câu ban đầu sẽ vào `db/migrations/0015_content_level_2_5.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Khung chương và phác câu đố: `design/gdd-chuong-2.md` mục 6.5. Hợp đồng engine (`patrol`, đếm câu lệnh, `wrong_branch`, `skipped_lines`): `docs/hop-dong-engine-chuong-2.md`. Brainstorm: `design/quyet-dinh/level-2-5-nga-tu-tuan-tra.md`.
> Mọi con số trong tài liệu này đo bằng harness thật (`run_level`, python3 3.13.2) ngày 30/10/2026. `wrong_branch` chưa có trong code; khóa ghi ở đây suy ra theo định nghĩa ở hợp đồng engine mục 5.1.

## 0. Khác với phác câu đố ở `design/gdd-chuong-2.md` mục 6.5

| Chỗ | Phác | GDD này | Lý do |
|---|---|---|---|
| Ngưỡng | 2 câu lệnh | **3** | Lời giải `if/else` gán biến rồi in một lần tốn 3 câu; ngưỡng không được phạt kiểu viết đó (`plans/reports/validate-261030-0152-chuong-2-khung.md` mục 1–2). Ngưỡng 3 vẫn phạt lối viết màn muốn tránh: chuỗi `if/elif` không dùng `and`/`or` tới 4 câu |
| Tình huống 2 | `(60, True, True)` → CHO | `(60, False, True)` → CHO | Test cũ để lọt một lỗi đặt ngoặc sai chỗ (`khoang_cach > 40 and not den_pha or not camera_bat`) qua cả bốn tình huống cơ bản. Tình huống mới bắt nó ngay ở lượt cơ bản, và vẫn bắt thiếu ngoặc, quên đèn pha, đảo `or` thành `and` ở vòng ngoài |
| Phản công | `(40, True, False)`, `(41, True, False)`, `(20, False, True)` | giữ nguyên | |
| Code khởi đầu | chỉ thiếu ngoặc | thiếu ngoặc **và** thiếu `not` trước `camera_bat` | Hai lỗi logic lộ ra ở hai tình huống khác nhau (2 rồi 3), để người chơi thấy mỗi tình huống thử một phần của luật |

Đề xuất sửa `design/gdd-chuong-2.md` mục 6.5 cho khớp (ngưỡng, tình huống 2, đã đo): ghi trong `plans/reports/brainstorm-261030-0152-level-2-5-2-6.md`.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.5`).

Briefing là nhật ký quan sát của Kai ở Ngã Tư Tuần Tra, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- Ngã Tư Tuần Tra là chỗ hai lộ trình drone cắt nhau; một drone đứng gác giữa ngã tư, đèn pha của tháp thỉnh thoảng quét qua;
- ba thứ quyết định Kai có qua được không: drone cách bao xa, camera của nó đang bật hay tắt, đèn pha có đang chiếu không;
- luật qua đường nói bằng lời thường: qua được khi drone ở xa **hoặc** camera tắt, **và** đèn pha không chiếu. Câu nói thì dễ, nhưng phải hiểu đúng chữ "và" ăn với phần nào. Briefing nêu ý này như một mối lo của Kai (đọc sai luật một lần là bị phát hiện), không giải thích ngoặc hay thứ tự tính.

Briefing không nêu từ khóa nào (`and`, `or`, `not`), không viết ký hiệu so sánh.

`location`: dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng. Ý đồ: Vành Sentinel · Ngã Tư Tuần Tra (khuôn `location` của 1.6).

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.5`), 4 bước, giọng hướng dẫn. Không chứa dòng đầu ra mong đợi (`LENH: …`) hay số của tình huống. Được nêu tên `print`, `if`, `else`. Bốn bước lần lượt nói:

1. ba dòng khóa là dữ liệu cảm biến của tình huống đang xét; game nạp dữ liệu mới cho mỗi tình huống, nên bạn không sửa ba dòng này;
2. sửa điều kiện của `if` cho đúng luật ở ô Mục tiêu; đọc kỹ chữ "và" trong luật áp lên phần nào;
3. sau mỗi lượt chạy, xem tình huống nào bị phát hiện và dòng nào bị làm mờ (dòng không chạy ở tình huống đó);
4. bấm CHẠY; hoàn thành khi qua cả bốn tình huống; không quá 3 câu lệnh và qua lượt OMNI đổi luật tuần tra thì được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (1 dòng đầu ra); khung chat ECHO | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng dải tuần tra `patrol` (mục 5) |

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Cảm biến ở ngã tư (KHÔNG được sửa 3 dòng này)
khoang_cach = 60
camera_bat = True
den_pha = False

# Kai được qua khi drone ở xa hoặc camera tắt, và đèn pha không chiếu
if khoang_cach > 40 or camera_bat and not den_pha:
    print("LENH: QUA")
else:
    print("LENH: CHO")
```

Dòng 2–4 khóa, nạp qua `inputs` (`khoang_cach` là `int`, hai biến kia là `bool`); dòng khóa hiện dữ liệu của tình huống 1. Lời chú thích dòng 6 nói luật bằng lời, đúng như người viết hiểu, và chính câu đó là chỗ dễ đọc sai.

| Dòng | Lỗi | Kết quả (đã đo) | Bài học |
|---|---|---|---|
| 7 | Thiếu ngoặc quanh vế "xa hoặc camera tắt" | Tình huống 2 `(60, False, True)` in `LENH: QUA`: `and` được tính trước `or`, nên khi drone ở xa thì đèn pha không còn được xét | `and` tính trước `or`; muốn nhóm khác thì đặt ngoặc |
| 7 | Thiếu `not` trước `camera_bat` | Sửa ngoặc mà chưa sửa chỗ này: tình huống 3 `(20, True, False)` in `LENH: QUA`, tức là camera bật lại được coi là lý do để qua | `not` đảo đúng một giá trị; "camera tắt" là `not camera_bat` |

Không lỗi nào gây traceback: cả hai cho ra một quyết định có thật, nhưng là quyết định của tình huống khác. Đây là chỗ khóa `wrong_branch` nói thay ECHO.

**Chuỗi khóa phản ứng qua các lượt** (đã đo, `alert_limit_statements` = 3):

| Lượt | Code | Khóa | Tình huống | Câu lệnh mỗi tình huống | Sao |
|---|---|---|---|---|---|
| 1 | Code gốc | `wrong_branch` (`out_line` 1, `round` 2) | 2 in `LENH: QUA` | 2, 2, 2, 2 | 0 |
| 2a | Chỉ thêm `not` | `wrong_branch` (`round` 2) | 2 in `LENH: QUA` | 2, 2, 2, 2 | 0 |
| 2b | Chỉ thêm ngoặc | `wrong_branch` (`round` 3) | 3 in `LENH: QUA` | 2, 2, 2, 2 | 0 |
| 3 | Cả hai | `three_stars` | | 2, 2, 2, 2; phản công 2, 2, 2 | 3 |

Lượt 1 terminal có dòng `> KHÔNG CHẠY Ở TÌNH HUỐNG 2: dòng 10` (hợp đồng engine mục 6): người chơi thấy nhánh `else` không chạy dù tình huống phải ra `CHO`.

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.5`). Nhãn nêu luật bằng lời và con số 40 (mét), nói rõ dòng in ra có hai dạng; không ghi ký hiệu Python, không ghi từ khóa.

Đầu ra mong đợi (đặc tả; cũng nằm trong `tests[].expected_output`):

- dòng 1 · `LENH: QUA` khi `(khoang_cach > 40 or not camera_bat) and not den_pha`, ngược lại `LENH: CHO`.
- Không dòng thừa. Chương trình chạy hết, không lỗi. Luật so khớp như 1.1 (NFC, bỏ khoảng trắng cuối dòng, phân biệt hoa thường).
- **Mức cảnh báo ≤ 40%** (≤ 3 câu lệnh; 100% = 7).

## 5. Diễn biến khi chạy (mô phỏng `patrol`)

`"simulation": { "kind": "patrol", "decision": { "line": 1 } }`. Đặc tả cảnh: hợp đồng engine mục 2. Riêng màn này:

- Bảng cảm biến mỗi tình huống có ba chip: `khoang_cach` (số, đơn vị m), `camera_bat`, `den_pha` (chip `bool` hiện `True`/`False` đúng cú pháp Python, màu theo bảng kiểu ở `design/gdd.md` mục 5.2).
- Chip của Kai hiện dòng in ra thứ nhất. Khớp: Kai băng qua ngã tư, drone không quay đèn. Lệch: đèn khóa vào Kai, "BỊ PHÁT HIỆN", ô cần/nhận cạnh chip.
- Bốn tình huống chạy liên tiếp, dừng ở tình huống sai đầu tiên; các tình huống sau xám "CHƯA TỚI".
- **Phản công:** băng `counter_attack_banner` (D1, `level:2.5`; ý đồ: OMNI đổi luật tuần tra, drone dời vị trí gác), "OMNI ĐỔI LUẬT TUẦN TRA", ba tình huống mới.

**Bảng biên cho mô phỏng** (nhánh hạ tầng H6 dùng làm case cho `patrol-timeline.test.ts` hoặc fixture; nhánh màn kiểm bằng e2e):

| Trường hợp | Mô phỏng phải làm | Ví dụ code |
|---|---|---|
| Lệch ở tình huống 2, các tình huống sau chưa chạy tới | Tình huống 1 qua, 2 bị phát hiện, 3–4 xám "CHƯA TỚI"; editor mờ dòng 10 | Code gốc |
| Không in gì | Chip của Kai trống, nhãn "BỊ PHÁT HIỆN", ô `nhận:` hiện thiếu (`▯`) | `print` thụt nhầm vào khối `else` (mục 8, đột biến 12) |
| In đúng chữ nhưng sai hoa thường | Lệch như mọi lỗi khác; ô cần/nhận tô ký tự lệch đầu tiên | `print("LENH: Qua")` |
| In thêm dòng | Tình huống đạt dòng 1 nhưng vẫn bị phát hiện vì dòng thừa | Hai `print` trong một nhánh |
| Lỗi cú pháp | Không tình huống nào chạy, "TRÌNH DỊCH TỪ CHỐI" | Thiếu `:`, viết `&&` |
| Quá 3 câu lệnh mà đúng | Mọi tình huống qua, thanh cảnh báo quá 40%, 1 sao, không phản công | Chuỗi `if/elif` không dùng `and`/`or` |
| Quá 7 câu lệnh | Bị bắt (0 sao), không phản công | |
| Phản công trượt ở tình huống biên 40 | Đợt mới: tình huống 1 bị phát hiện, ô `nhận:` `LENH: QUA` | `khoang_cach >= 40` |
| Phản công quá giờ hoặc lỗi | "TIẾN TRÌNH BỊ CẮT" (hợp đồng mục 2) | |

**Terminal** (lượt 1, ví dụ; chữ của từ vựng `patrol` do nhánh hạ tầng viết):

```
> LƯỢT CHẠY #1: Ngã Tư Tuần Tra
> TÌNH HUỐNG 1/4 · DRONE BỎ QUA
> TÌNH HUỐNG 2/4 · DRONE PHÁT HIỆN: dòng 1
    cần:  LENH:·CHO
    nhận: LENH:·QUA
> KHÔNG CHẠY Ở TÌNH HUỐNG 2: dòng 10
> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP
```

## 6. Lời giải tham khảo (đạt 2 sao, trượt phản công)

```python
if (khoang_cach >= 40 or not camera_bat) and not den_pha:
    print("LENH: QUA")
else:
    print("LENH: CHO")
```

2 câu lệnh. Qua bốn tình huống cơ bản (không tình huống nào có khoảng cách đúng 40), trượt tình huống phản công 1 `(40, True, False)`: in `LENH: QUA`, cần `LENH: CHO`. Khóa `wrong_branch` ở lượt phản công. Đoán ngưỡng khác (`> 50`) cũng chỉ 2 sao, trượt tình huống phản công 2 `(41, True, False)`.

## 7. OMNI phản công (sao thứ 3)

Ba tình huống mới; hai tình huống đầu nằm đúng ở biên 40 (so sánh, bài 2.1), tình huống thứ ba là tổ hợp "camera tắt nhưng đèn pha chiếu" chưa có ở lượt cơ bản.

Lời giải đạt 3 sao (2 câu lệnh, 27%):

```python
if (khoang_cach > 40 or not camera_bat) and not den_pha:
    print("LENH: QUA")
else:
    print("LENH: CHO")
```

Cũng đạt 3 sao (chấm theo đầu ra, không theo cách viết):

```python
if (khoang_cach > 40 or not camera_bat) and not den_pha:
    lenh = "QUA"
else:
    lenh = "CHO"
print(f"LENH: {lenh}")
```

(3 câu lệnh, 40%), cũng như biến trung gian `qua = (…) and not den_pha` rồi `if qua:` (3), biểu thức `"QUA" if … else "CHO"` (2), `not den_pha and (khoang_cach > 40 or camera_bat == False)` (2), và `if not den_pha:` lồng một `if/else` bên trong (2–3).

## 8. Bảng phủ nhánh, bảng đột biến, bảng đo câu lệnh

### 8.1. Bảng phủ nhánh

`A` = `khoang_cach > 40`, `B` = `not camera_bat`, `C` = `not den_pha`. Luật: `(A or B) and C`.

| Test | `khoang_cach`, `camera_bat`, `den_pha` | A | B | A or B | C | Nhánh | Dòng mong đợi | Bắt được |
|---|---|---|---|---|---|---|---|---|
| Cơ bản 1 | 60, True, False | T | F | T | T | `if` | `LENH: QUA` | `and` thay `or`; quên `not` trước `den_pha`; đảo hai nhánh |
| Cơ bản 2 | 60, False, True | T | T | T | F | `else` | `LENH: CHO` | Thiếu ngoặc; bỏ hẳn đèn pha; `or` thay `and` ở vòng ngoài; đặt ngoặc sai chỗ; viết cứng theo tình huống 1 |
| Cơ bản 3 | 20, True, False | F | F | F | T | `else` | `LENH: CHO` | Thiếu `not` trước `camera_bat` |
| Cơ bản 4 | 20, False, False | F | T | T | T | `if` | `LENH: QUA` | `and` thay `or` (lần hai); so `camera_bat` với chữ `"False"` |
| Phản công 1 | 40, True, False | F (biên) | F | F | T | `else` | `LENH: CHO` | `>=` thay `>` |
| Phản công 2 | 41, True, False | T (biên + 1) | F | T | T | `if` | `LENH: QUA` | Đoán ngưỡng lớn hơn 40 |
| Phản công 3 | 20, False, True | F | T | T | F | `else` | `LENH: CHO` | Tổ hợp chưa có ở lượt cơ bản; cùng cặp với cơ bản 4 cho thấy riêng đèn pha đổi kết quả |

- Cả hai nhánh có test cơ bản (1, 4 vào `if`; 2, 3 vào `else`).
- Mỗi vế của `or` là lý do duy nhất để qua ở một tình huống cơ bản: tình huống 1 chỉ có `A`, tình huống 4 chỉ có `B`. Cặp 1–3 cho thấy riêng `A` đổi kết quả; cặp 4–3 cho thấy riêng `B` đổi kết quả. Đó là phần khái niệm chính của màn, nên nằm ở lượt cơ bản.
- `C` sai trong khi `A or B` đúng có ở tình huống 2 (cơ bản). Cặp chỉ khác `C` là cơ bản 4 và phản công 3.
- Biên của phép so sánh (40/41) nằm ở phản công: so sánh là khái niệm của 2.1, không phải của màn này (hợp đồng engine mục 4 chỉ đòi biên của khái niệm chính ở lượt cơ bản).

### 8.2. Bảng đột biến (đã đo)

Mọi dòng chạy trên đủ bốn test cơ bản và ba test phản công. Test tích hợp `tests/integration/level-2-5.test.ts` chạy mọi dòng (file trong `tests/fixtures/solutions/2.5/`).

| # | Đột biến | Điều kiện hoặc thay đổi | Khóa | Tình huống trượt | Câu lệnh (cơ bản) | Sao |
|---|---|---|---|---|---|---|
| 1 | Code gốc | `khoang_cach > 40 or camera_bat and not den_pha` | `wrong_branch` | cơ bản 2 | 2, 2, 2, 2 | 0 |
| 2 | Bỏ ngoặc (chỉ còn lỗi này) | `khoang_cach > 40 or not camera_bat and not den_pha` | `wrong_branch` | cơ bản 2 | 2, 2, 2, 2 | 0 |
| 3 | Quên `not` (chỉ còn lỗi này) | `(khoang_cach > 40 or camera_bat) and not den_pha` | `wrong_branch` | cơ bản 3 | 2, 2, 2, 2 | 0 |
| 4 | Viết cứng theo tình huống 1 | chỉ `print("LENH: QUA")` | `wrong_branch` | cơ bản 2 | 1, 1, 1, 1 | 0 |
| 5 | Sai biên | `khoang_cach >= 40` | `wrong_branch` (phản công) | phản công 1 | 2, 2, 2, 2 | 2 |
| 6 | Đoán ngưỡng | `khoang_cach > 50` | `wrong_branch` (phản công) | phản công 2 | 2, 2, 2, 2 | 2 |
| 7 | `and` thay `or` | `(khoang_cach > 40 and not camera_bat) and not den_pha` | `wrong_branch` | cơ bản 1 | 2, 2, 2, 2 | 0 |
| 8 | `or` thay `and` ở vòng ngoài | `(khoang_cach > 40 or not camera_bat) or not den_pha` | `wrong_branch` | cơ bản 2 | 2, 2, 2, 2 | 0 |
| 9 | Quên `not` trước đèn pha | `(…) and den_pha` | `wrong_branch` | cơ bản 1 | 2, 2, 2, 2 | 0 |
| 10 | Bỏ hẳn đèn pha | `khoang_cach > 40 or not camera_bat` | `wrong_branch` | cơ bản 2 | 2, 2, 2, 2 | 0 |
| 11 | Ngoặc đặt sai chỗ | `khoang_cach > 40 and not den_pha or not camera_bat` | `wrong_branch` | cơ bản 2 | 2, 2, 2, 2 | 0 |
| 12 | Thân nhánh thụt lề sai (`print` nằm trong khối `else`, nhánh `if` chỉ gán) | gán `lenh` ở hai nhánh, `print` thụt vào `else` | `output_missing` | cơ bản 1 | 2, 3, 3, 2 | 0 |
| 13 | Thân `else` không thụt lề | `else:` rồi `print` sát lề | `IndentationError` (dòng 9) | | | 0 |
| 14 | Đảo hai nhánh | `QUA` trong `else`, `CHO` trong `if` | `wrong_branch` | cơ bản 1 | 2, 2, 2, 2 | 0 |
| 15 | Đảo thứ tự trong chuỗi `if/elif` | `if khoang_cach > 40` → `elif not camera_bat` → `elif den_pha` → `else` | `wrong_branch` | cơ bản 2 | 2, 2, 4, 3 | 0 |
| 16 | Chuỗi `if/elif` không dùng `and`/`or`, đúng | `if den_pha` → `elif khoang_cach > 40` → `elif camera_bat` → `else` | `alert_exceeded` | | 3, 2, 4, 4 | 1 |
| 17 | Gán mặc định rồi một `if` | `lenh = "CHO"`, `if …: lenh = "QUA"`, `print` | `alert_exceeded` | | 4, 3, 3, 4 | 1 |
| 18 | Hai `if` rời, cái sau là `not (…)` của cái trước | | `three_stars` | | 3, 3, 3, 3 | 3 |
| 19 | So `bool` với chữ | `camera_bat == "False"` | `wrong_branch` | cơ bản 4 | 2, 2, 2, 2 | 0 |
| 20 | Sai hoa thường | `print("LENH: Qua")` | `output_case_only` | cơ bản 1 | 2, 2, 2, 2 | 0 |
| 21 | Ký hiệu của ngôn ngữ khác | `(… \|\| !camera_bat) && !den_pha` | `SyntaxError` ("invalid syntax", dòng 7) | | | 0 |
| 22 | Thiếu `:` | | `SyntaxError` ("expected ':'") | | | 0 |
| 23 | `=` thay `==` trong điều kiện | `if camera_bat = False:` | `SyntaxError` ("Maybe you meant '==' or ':=' instead of '='?") | | | 0 |

Không đột biến nào được 3 sao, trừ dòng 18 (đúng luật, xem rủi ro trong `design/quyet-dinh/level-2-5-nga-tu-tuan-tra.md`). Viết cứng được 0 sao.

### 8.3. Bảng đo câu lệnh

| Cách viết (đều đúng luật) | Cơ bản 1–4 | Phản công 1–3 | Lớn nhất (cơ bản) | Sao |
|---|---|---|---|---|
| `if/else`, `print` trong từng nhánh | 2, 2, 2, 2 | 2, 2, 2 | 2 | 3 |
| Biểu thức `a if c else b` rồi `print` | 2, 2, 2, 2 | 2, 2, 2 | 2 | 3 |
| `if/else` gán biến rồi in một lần | 3, 3, 3, 3 | 3, 3, 3 | **3** | 3 |
| Biến `bool` trung gian rồi `if/else` | 3, 3, 3, 3 | 3, 3, 3 | 3 | 3 |
| `if not den_pha:` lồng `if/else` | 3, 2, 3, 3 | 3, 3, 2 | 3 | 3 |
| Hai `if` rời | 3, 3, 3, 3 | 3, 3, 3 | 3 | 3 |
| Gán mặc định rồi một `if` | 4, 3, 3, 4 | 3, 4, 3 | 4 | 1 |
| Chuỗi `if/elif` không `and`/`or` | 3, 2, 4, 4 | 4, 3, 2 | 4 | 1 |

`alert_limit_statements` = **3**: bằng số câu lớn nhất của kiểu "gán biến rồi in một lần" (luật validate mục 1). Nhánh dài nhất của chuỗi `if/elif` (4 câu) có mặt ở cơ bản 3 và 4, nên thanh cảnh báo không đo thiếu.

## 9. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants`, `counter_attack_banner` (D1, `level:2.5`).

**Gợi ý** (mở dần, không bị kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Nhìn tình huống bị phát hiện và dòng bị làm mờ. Đọc lại luật thành tiếng, rồi tự hỏi: khi drone ở xa, điều kiện hiện tại có còn xét đèn pha không? Và "camera tắt" khác "camera bật" ở chỗ nào trong dòng 7 |
| 2 (`hints[1]`) | Hướng tiếp cận: luật gồm hai phần nối bằng "và"; phần đầu tự nó là một lựa chọn "hoặc". Python tính "và" trước "hoặc", nên phần "hoặc" phải được gói lại. Pseudocode hai tầng, chưa có cú pháp Python |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": bảng đúng/sai của `and`, `or`, `not`; `and` tính trước `or`; ngoặc để đổi thứ tự; `not x` với `x` kiểu `bool`; ví dụ khác đáp án (không dùng tên biến hay số của màn) |

**Phản ứng miễn phí:** giọng cụt, lạnh, từ ngữ của ngã tư, drone, đèn pha. Không nêu từ khóa, ký hiệu, chữ "ngoặc", không trích dòng đầu ra hay số của tình huống. Được dùng "điều kiện", "nhánh", "tình huống", `{out_line}`; `{round}` chỉ ở khóa chỉ có ở lượt cơ bản (`output_*`, lỗi chạy).

| Khóa | Ý đồ |
|---|---|
| `entry` | Đặt cảnh: ngã tư, một drone gác, đèn pha quét qua; luật qua đường có ba phần; bảo chạy một lần và xem tình huống nào bị phát hiện |
| `wrong_branch` (code gốc, và mọi lỗi logic) | Mã đã ra quyết định của một tình huống khác (không dùng `{round}`, xem dưới bảng). Luật đúng một phần; một phần của điều kiện đang được xét sai chỗ hoặc bị đảo. Bảo nhìn dòng bị làm mờ |
| `output_mismatch`, `output_case_only`, `output_missing`, `output_extra` | Theo khuôn 1.1: dòng nào, ký tự thứ mấy; với `output_missing` thì Kai không nhận được lệnh nào ở tình huống `{round}` |
| `SyntaxError`, `IndentationError` | Dòng `{line}`; trình dịch không đọc được luật. Không nói thiếu dấu gì |
| `NameError`, `TypeError`, `runtime_error` | Theo khuôn chung |
| `alert_exceeded` | Mỗi lần kiểm hay gán thêm là một lần drone có thể nghe thấy; luật này gói được trong một câu điều kiện |
| `wrong_value_counter` | Dữ liệu mới của OMNI, lệnh in ra sai chữ (chỉ gặp khi dòng in sai ở lượt phản công mà không trùng tình huống nào) |
| `counter_error`, `counter_timeout` | Theo khuôn 1.4 |
| `three_stars` | OMNI dời chốt gác mà luật của Kai vẫn đúng; ngắn |
| `generic`, `repeated_fail`, `engine_error`, `timeout`, `resource_limit`, `blocked_import`, `system_exit` | Theo khuôn chung |

`wrong_branch` ở lượt phản công (đột biến 5, 6) dùng chung câu với lượt cơ bản (hợp đồng engine mục 5.1 thay cả `wrong_value_counter`). Vì vậy câu `wrong_branch` phải đúng ở cả hai lượt: không nói "OMNI chưa đổi gì", không nói "lượt đầu". `{round}` là số tình huống của lượt cơ bản; ở lượt phản công khóa không có `round` (`classify-run.ts` chỉ gắn `round` cho lượt cơ bản), nên câu chính không dùng `{round}`. Chỗ nói tình huống nào để cho mô phỏng và terminal. Đề xuất cho hạ tầng H4 (ghi trong báo cáo): gắn `round` cho tình huống phản công trượt, hoặc ghi rõ trong hợp đồng là không có.

`reaction_variants` có câu thay thế cho `wrong_branch` (hay lặp nhất: mọi lỗi logic ở màn này đều ra khóa đó) và `alert_exceeded`. Biến thể chỉ hiện khi cùng một câu sắp lặp lại hai lần liền (`echo-reactions.ts`). Câu thay thế nói "vẫn" sai và chỉ thêm một chỗ để nhìn (so tình huống bị phát hiện với tình huống đã qua; đếm số lần drone có thể nghe thấy).

`counter_attack_banner`: OMNI đổi luật tuần tra; drone dời chốt gác.

**Từ cấm của 2.5** (`forbidden_terms`, cộng danh sách chung và mọi dòng `expected_output`):

```json
["and", "or", "not", "if", "elif", "else",
 "==", "!=", "<=", ">=", "<", ">", "(", ")",
 "ngoặc", "ưu tiên", "tính trước", "đảo thứ tự", "thụt lề", "dấu hai chấm",
 "lớn hơn hoặc bằng", "nhỏ hơn hoặc bằng",
 "khoang_cach", "camera_bat", "den_pha",
 "True", "False", "LENH",
 "20", "40", "41", "60"]
```

- `"(", ")"` là ký hiệu một ký tự, so như chuỗi con (luật `echo-leaks.ts`). Phản ứng ECHO vì vậy không dùng ngoặc đơn; viết câu không cần ngoặc. Chỗ giữ `{round}`, `{line}` dùng ngoặc nhọn, không bị ảnh hưởng.
- Không cấm `QUA`, `CHO`: so không phân biệt hoa thường, hai chữ này trùng "qua", "cho" của tiếng Việt. Dòng mong đợi trọn vẹn (`LENH: QUA`, `LENH: CHO`) đã bị cấm tự động, cộng `LENH`.
- Luật mới "số trong dòng mong đợi" (hợp đồng mục 5.2) không thêm gì ở màn này vì dòng mong đợi không có chữ số; các số của tình huống phải liệt kê tay như trên.

## 10. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Dòng in đúng ở cả bốn tình huống, không dòng thừa, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 3 câu lệnh ở mọi tình huống cơ bản |
| ⭐⭐⭐ | Thêm: qua ba tình huống phản công |
| 0 sao | Trên 7 câu lệnh |

Không đổi `compute-stars.ts`.

## 11. Người chơi lần lượt làm gì

1. Vào màn, briefing gõ chữ, mục tiêu khóa vào, ECHO nói `entry`. Nút CHẠY có vòng sáng.
2. **Lượt 1:** tình huống 1 qua; tình huống 2 bị phát hiện, Kai nhận `QUA` khi đèn pha đang chiếu. Dòng 10 mờ. ECHO nói `wrong_branch`.
3. **Rẽ sai thường gặp:**
   - Chỉ thêm `not`: vẫn trượt tình huống 2, `reaction_variants.wrong_branch`.
   - Chỉ thêm ngoặc: qua tình huống 2, trượt tình huống 3.
   - Viết lại thành chuỗi `if/elif` để khỏi nghĩ về ngoặc: đúng nhưng 4 câu lệnh, 1 sao, `alert_exceeded`.
   - Viết `&&`, `||`, `!`: `SyntaxError` dòng 7.
4. **Sửa cả hai lỗi** → 3 sao ngay (code gốc đã dùng `>`). Người đổi `>` thành `>=` cho "chắc" chỉ được 2 sao, trượt phản công 1.
5. Hộp kết quả: "Đã thu: Điều kiện qua đường".
6. TIẾP TỤC → Tổng kết → `after-2.5` → "VÀO NHIỆM VỤ" của 2.6.

## 12. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:2.5`). Cấu trúc nhịp (kiểu, nền, cue, `fx`) nằm trong JSON.

- `scene`: `tram-sentinel` (phông có sẵn). Phase tích hợp đổi sang `nga-tu-tuan-tra` khi nhánh cảnh S xong (hợp đồng engine mục 8).
- `outro`: Kai qua ngã tư giữa hai lượt đèn; dưới chân cột đèn có một hộp điều khiển cũ còn lưu lịch tuần tra, dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-03**, mảnh thứ hai của người này): lịch tuần tra gốc do tám người viết, từng phút một; OMNI chưa từng đổi nó, vì không có lý do để đổi một thứ đã đúng. Không nói ai khác biết lịch này.
- `component`: Điều kiện qua đường (ô 5/6 sáng lên).
- `outro_beats`, bốn nhịp:

| # | Kiểu | Nền, cue, `fx` | Ý đồ |
|---|---|---|---|
| 1 | `echo` | `thanh-pho`, `fx: "trace"` | ECHO so lịch vượt rào mà 0xA7 gửi ở đầu chương với các luật Kai vừa giải: khớp tới từng giây. ECHO chỉ nói sự kiện này |
| 2 | `echo` | | ECHO im một nhịp rồi nói lịch đó chỉ có trong hộp điều khiển gốc. Không suy đoán ai gửi |
| 3 | `kai` | `tram-sentinel`, `fx: "focus"` | Kai nhớ lời KTS-03 ở Chương 1: đừng tin tín hiệu nào mang mã 0xA7. Một câu |
| 4 | `log` | | Kai đi tiếp về phía trạm sạc drone, nơi bảng lệnh của tháp hiện lên. Dẫn vào 2.6 |

- Không được lộ: 0xA7 là ai, 0xA7 có phải Kiến Trúc Sư; ECHO không nối lịch gốc với 0xA7 bằng một suy luận.
- Móc câu: ai ngoài tám người biết lịch gốc.

### 12.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.5`); `code`/`output` là câu đố (JSON). Mọi `code` dưới đây đã chạy bằng python3 3.13 và in đúng `output`; ví dụ khác đáp án.

| Mục | Ý chính | `code` | `output` |
|---|---|---|---|
| `and` | Đúng khi cả hai vế đúng | `a = 5`<br>`print(a > 0 and a < 10)`<br>`print(a > 0 and a > 10)` | `True`<br>`False` |
| `or` | Đúng khi ít nhất một vế đúng | `co_the = False`<br>`co_ve = True`<br>`print(co_the or co_ve)`<br>`print(co_the or not co_ve)` | `True`<br>`False` |
| `not` | Đảo một giá trị `bool` | `dong_cua = False`<br>`print(not dong_cua)` | `True` |
| Thứ tự tính | `not` trước `and`, `and` trước `or`; ngoặc đổi thứ tự | `print(True or False and False)`<br>`print((True or False) and False)` | `True`<br>`False` |
| Điều kiện ghép trong `if` | Một `if/else` với điều kiện ghép thay cho nhiều `if` | `tuoi = 15`<br>`co_ve = True`<br>`if tuoi >= 12 and co_ve:`<br>`    print("Vao rap")`<br>`else:`<br>`    print("Dung lai")` | `Vao rap` |

Lỗi thường gặp (`mistakes`; `code` và `error` là câu đố, `explain` ở D1):

| `code` | `error` | Ý của `explain` |
|---|---|---|
| `a = 5`<br>`if a > 0 && a < 10:`<br>`    print(a)` | `SyntaxError: invalid syntax` | Python dùng chữ `and`, `or`, `not`, không dùng `&&`, `\|\|`, `!` |
| `nong = True`<br>`mua = False`<br>`co_o = False`<br>`print(nong or mua and co_o)` | Không báo lỗi, nhưng in ra: True | Người viết muốn "(nóng hoặc mưa) và có ô"; thiếu ngoặc thì `and` được tính trước |
| `x = 5`<br>`if x == 1 or 2:`<br>`    print("Dung")` | Không báo lỗi, nhưng in ra: Dung | Vế sau `or` là `2`, không phải `x == 2`; mỗi vế phải là một phép so sánh đầy đủ |

`next` báo trước màn sau: một câu hỏi chỉ có nghĩa khi câu hỏi trước đã có câu trả lời (điều kiện lồng nhau), và dòng trống đọc từ kênh nhập.

## 13. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `wrong_branch`, `round` 2, `out_line` 1; `skipped_lines` của tình huống 2 là `[10]` | **Có** (tích hợp) |
| Lời giải 3 sao (if/else in, gán rồi in, biểu thức) | 3 sao; 2, 3, 2 câu lệnh | **Có** (tham số hóa) |
| Lời giải 2 sao `>=` | 2 sao, `wrong_branch` ở phản công | **Có** |
| Mọi dòng bảng đột biến 8.2 | Đúng khóa, sao, số câu lệnh | **Có** |
| `if camera_bat == False` thay `not camera_bat` | Đúng, cùng số câu | Không |
| `if camera_bat is False` | Đúng (dữ liệu là `bool` thật) | Không |
| Thêm `print` dò giá trị | Dòng thừa, `output_extra` | Không (khuôn chung) |
| Sửa dòng khóa | Không sửa được (khóa); dữ liệu vẫn nạp từ test | Đã có (engine) |
| Lời ECHO | Không chứa từ cấm, dòng mong đợi, số tình huống | **Có** (test từ cấm theo level) |
| Đi trọn đường: code gốc → 3 sao | e2e `level-2-5.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 14. Dữ liệu level

Câu đố sẽ nằm ở `src/levels/level-2-5.json`, câu chữ ở D1 (tài liệu `level:2.5`, migration `0015`). Dữ liệu test (đặc tả, JSON thắng khi lệch):

```json
"chapter": 2,
"difficulty": "medium",
"concepts": ["and", "or", "not"],
"simulation": { "kind": "patrol", "decision": { "line": 1 } },
"inputs": ["khoang_cach", "camera_bat", "den_pha"],
"locked_lines": [2, 3, 4],
"objectives": [{ "kind": "output_line", "line": 1 }],
"alert_limit_statements": 3,
"tests": [
  { "inputs": { "khoang_cach": 60, "camera_bat": true,  "den_pha": false }, "expected": {}, "expected_output": ["LENH: QUA"] },
  { "inputs": { "khoang_cach": 60, "camera_bat": false, "den_pha": true  }, "expected": {}, "expected_output": ["LENH: CHO"] },
  { "inputs": { "khoang_cach": 20, "camera_bat": true,  "den_pha": false }, "expected": {}, "expected_output": ["LENH: CHO"] },
  { "inputs": { "khoang_cach": 20, "camera_bat": false, "den_pha": false }, "expected": {}, "expected_output": ["LENH: QUA"] }
],
"counter_attack_tests": [
  { "inputs": { "khoang_cach": 40, "camera_bat": true,  "den_pha": false }, "expected": {}, "expected_output": ["LENH: CHO"] },
  { "inputs": { "khoang_cach": 41, "camera_bat": true,  "den_pha": false }, "expected": {}, "expected_output": ["LENH: QUA"] },
  { "inputs": { "khoang_cach": 20, "camera_bat": false, "den_pha": true  }, "expected": {}, "expected_output": ["LENH: CHO"] }
],
"scene": "tram-sentinel"
```

`starter_code` đúng như mục 3 (dòng 2–4 hiện giá trị của tình huống 1). `outro_beats` như mục 12. `knowledge_summary` như mục 12.1. `forbidden_terms` như mục 9.

## 15. Tiêu chí chấp nhận

1. JSON qua `validateLevel` (có cả luật `patrol`: ≥ 2 test cơ bản, `decision.line` trỏ tới mục tiêu `output_line` có thật) và migration `0015` qua `validateLevelText` (gồm hai luật mới cho `chapter >= 2`).
2. Code gốc ra `wrong_branch` ở tình huống 2; chỉ sửa ngoặc ra `wrong_branch` ở tình huống 3; sửa cả hai được 3 sao với 2 câu lệnh.
3. Mọi dòng bảng đột biến 8.2 cho đúng khóa, số sao và số câu lệnh trong `tests/integration/level-2-5.test.ts`; không dòng nào 3 sao trừ dòng 18.
4. Lời giải "gán biến rồi in một lần" được 3 sao; chuỗi `if/elif` không `and`/`or` được 1 sao.
5. Ví dụ tổng kết chạy đúng bằng python3; lời ECHO sạch từ cấm.
6. typecheck, `npm test`, `npm run test:py`, build qua; e2e được viết.

# Level 2.6 – "Bảng lệnh trạm sạc"

> Chương 2 – Trạm Sentinel · Độ khó: Medium · Khái niệm: điều kiện lồng nhau; chuỗi rỗng được coi là sai
> Câu đố: `src/levels/level-2-6.json`. Câu chữ người chơi đọc: tài liệu `level:2.6` ở D1 (câu ban đầu sẽ vào `db/migrations/0016_content_level_2_6.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Khung chương và phác câu đố: `design/gdd-chuong-2.md` mục 6.6. Hợp đồng engine (`patrol`, đếm câu lệnh, `wrong_branch`, `skipped_lines`): `docs/hop-dong-engine-chuong-2.md`. Kênh nhập, lời nhắc, `EOFError`: `docs/hop-dong-engine-level-1-5-den-1-7.md` (dùng lại nguyên). Brainstorm: `design/quyet-dinh/level-2-6-bang-lenh-tram-sac.md`.
> Mọi con số trong tài liệu này đo bằng harness thật (`run_level`, python3 3.13.2) ngày 30/10/2026. Khóa `wrong_branch` và `skipped_lines` đã kiểm lại bằng `tests/integration/level-2-6.test.ts`.

## 0. Khác với phác câu đố ở `design/gdd-chuong-2.md` mục 6.6

| Chỗ | Phác | GDD này | Lý do |
|---|---|---|---|
| Ngưỡng | 5 câu lệnh | **6** | Lời giải lồng nhau gán biến rồi in một lần tốn 6 câu; ngưỡng không được phạt kiểu viết đó (`plans/reports/validate-261030-0152-chuong-2-khung.md` mục 1). Ngưỡng 6 vẫn phạt lối viết màn muốn tránh: các `if` rời in thẳng (7 câu) |
| Dữ liệu test | | giữ nguyên | Đã đo: phủ đủ bốn nhánh lá ở lượt cơ bản, và mỗi test phản công bắt ít nhất một lời giải sai riêng (mục 8.2) |
| Code khởi đầu | | giữ ý, chốt từng dòng | |

Đề xuất sửa `design/gdd-chuong-2.md` mục 6.6 và bảng khung trong `design/quyet-dinh/cot-truyen-chuong-2.md` (ngưỡng 5 → 6): ghi trong `plans/reports/brainstorm-261030-0152-level-2-5-2-6.md`.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.6`).

Briefing là nhật ký của Trạm Sạc Drone, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- Trạm Sạc Drone là chỗ drone về sạc; trên bảng lệnh của tháp, mỗi drone đang sạc có một ô lệnh và một mức pin. Kai đọc bảng qua **kênh nhập** (như Trạm Thẩm Vấn ở Chương 1): dòng đầu là mã lệnh, dòng sau là mức pin;
- ô lệnh có thể trống: tháp chưa giao việc gì;
- Kai phải quyết định theo thứ tự: trước hết xem ô lệnh có gì không. Có lệnh thì chỉ còn hỏi đó là lệnh gì, pin không quan trọng nữa. Không có lệnh thì mới nhìn pin. Luật cụ thể nằm ở ô Mục tiêu.

Briefing không nêu từ khóa nào, không nói "lồng", không viết ký hiệu so sánh.

`location`: dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng. Ý đồ: Vành Sentinel · Trạm Sạc Drone.

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.6`), 4 bước, giọng hướng dẫn. Được nêu tên `input`, `print`, `if`. Không chứa dòng đầu ra mong đợi (`LENH: …`), mã lệnh hay số của tình huống. Bốn bước lần lượt nói:

1. chạy code có sẵn rồi đọc terminal; mỗi lần gọi `input()` đọc một dòng của bảng lệnh và luôn nhận về chữ, kể cả dòng trống;
2. sửa để chương trình xét đúng thứ tự ở ô Mục tiêu: có lệnh hay không trước, rồi mới tới lệnh gì hoặc mức pin;
3. chỉ in đúng một dòng; lời nhắc trong `input()` cũng bị in ra;
4. bấm CHẠY; hoàn thành khi qua cả bốn tình huống; không quá 6 câu lệnh và qua lượt OMNI đổi bảng lệnh thì được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (1 dòng đầu ra); khung chat ECHO | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng dải tuần tra `patrol` (mục 5) |

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Bảng lệnh gửi 2 dòng qua kênh nhập: mã lệnh (có thể trống), rồi mức pin
ma_lenh = input()
pin = input()

if pin < 30:
    print("LENH: DI")
elif ma_lenh == "XUAT KICH":
    print("LENH: NAP")
else:
    print("LENH: CHO")
```

Không có dòng khóa (`inputs: []`, `locked_lines: []`): mọi dữ liệu đến từ kênh nhập. Kênh nhập của tình huống 1: `["XUAT KICH", "80"]`.

**Không dùng lời nhắc trong `input()`.** Như 1.6, lời nhắc đi ra stdout và bị chấm như một phần dòng in; code khởi đầu gọi `input()` không đối số để dòng in duy nhất đúng là quyết định. Người chơi tự thêm lời nhắc sẽ gặp `output_has_prompt` (mục 9).

| Dòng | Lỗi | Kết quả (đã đo) | Bài học |
|---|---|---|---|
| 3 | Mức pin đọc vào mà không đổi kiểu | Dòng 5: `TypeError: '<' not supported between instances of 'str' and 'int'` ngay tình huống 1 | Nhắc lại 1.4 và 1.6: kênh nhập luôn trả chữ |
| 5–8 | Xét pin trước khi xét có lệnh hay không, trong một chuỗi phẳng | Sửa dòng 3 xong: tình huống 4 `["VE TRAM", "5"]` in `LENH: DI`. Drone có lệnh, nhưng pin thấp được xét trước | Câu hỏi về pin chỉ có nghĩa khi ô lệnh trống; câu hỏi thứ hai nằm trong khối của câu hỏi thứ nhất |

**Chuỗi khóa phản ứng qua các lượt** (đã đo, `alert_limit_statements` = 6):

| Lượt | Code | Khóa | Tình huống | Câu lệnh mỗi tình huống | Sao |
|---|---|---|---|---|---|
| 1 | Code gốc | `TypeError` (`line` 5, `round` 1) | 1 | 3, 3, 3, 3 | 0 |
| 2 | Dòng 3 thành `pin = int(input())` | `wrong_branch` (`out_line` 1, `round` 4) | 4 in `LENH: DI` | 5, 4, 5, 4 | 0 |
| 2b | Chỉ đổi thứ tự chuỗi phẳng: xét `"XUAT KICH"` trước, rồi `pin < 30` | `wrong_branch` (`round` 4) | 4 in `LENH: DI` | 4, 5, 5, 5 | 0 |
| 3 | Lồng nhau (mục 7), hoặc thêm vế "không có lệnh" vào điều kiện pin | `three_stars` | | 5, 5, 5, 5 (lồng) | 3 |

Lượt 2 terminal có `> KHÔNG CHẠY Ở TÌNH HUỐNG 4: dòng 7, 8, 10`: người chơi thấy dòng xét mã lệnh không hề được tới.

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.6`). Nhãn nêu đủ luật theo thứ tự xét, kể cả ngưỡng pin 30 và mã lệnh xuất kích (người chơi cần chúng để viết điều kiện), và nói dòng in ra có ba dạng. Không ghi ký hiệu Python.

Đầu ra mong đợi (đặc tả; cũng nằm trong `tests[].expected_output`):

- dòng 1:
  - ô lệnh có chữ (khác chuỗi rỗng): `LENH: NAP` nếu mã lệnh đúng bằng `XUAT KICH`, ngược lại `LENH: CHO`;
  - ô lệnh trống: `LENH: DI` nếu pin dưới 30 (drone kẹt sạc), ngược lại `LENH: CHO`.
- Không dòng thừa. Chương trình chạy hết, không lỗi. Luật so khớp như 1.1.
- **Mức cảnh báo ≤ 40%** (≤ 6 câu lệnh; 100% = 15).

"Ô lệnh có chữ" nghĩa là dòng đọc được khác `""`. Một dòng chỉ có dấu cách vẫn là có lệnh (phản công 3). Màn không dạy cắt khoảng trắng.

## 5. Diễn biến khi chạy (mô phỏng `patrol`)

`"simulation": { "kind": "patrol", "decision": { "line": 1 } }`. Đặc tả cảnh: hợp đồng engine mục 2. Riêng màn này:

- Bảng cảm biến mỗi tình huống không có chip `inputs` (màn không có dòng khóa); chỉ có hai dòng kênh nhập, hiện theo cú pháp chuỗi Python như terminal (`"XUAT KICH"`, `"80"`), thẻ đã đọc / chưa đọc theo `stdinRead` như mô phỏng `interrogation`.
- Chip của Kai hiện dòng in ra thứ nhất. Khớp: Kai đi qua dãy cột sạc, drone không rời cột. Lệch: drone rời cột, đèn khóa vào Kai, "BỊ PHÁT HIỆN", ô cần/nhận cạnh chip.
- **Phản công:** băng `counter_attack_banner` (D1, `level:2.6`; ý đồ: OMNI viết lại bảng lệnh), "OMNI ĐỔI LUẬT TUẦN TRA", ba tình huống mới.

**Bảng biên cho mô phỏng** (nhánh hạ tầng H6 dùng làm case cho `patrol-timeline.test.ts` hoặc fixture có `stdin`; nhánh màn kiểm bằng e2e):

| Trường hợp | Mô phỏng phải làm | Ví dụ |
|---|---|---|
| Dòng kênh nhập rỗng `""` | Thẻ vẫn hiện, rõ là trống (ví dụ `""` mờ cùng nhãn "TRỐNG"), không ẩn thẻ, không co lại thành không có gì | Tình huống 2, 3 |
| Dòng kênh nhập chỉ có một dấu cách `" "` | Phân biệt được với `""`: hiện dấu cách bằng `·` như `output-diff.ts` (`"·"`) | Phản công 3 |
| Lỗi ở tình huống 1 trước khi đọc dòng 2 | Thẻ dòng 2 hiện "CHƯA ĐỌC" (bài học 1.6), đèn khóa vào Kai, nhãn lỗi | Code gốc (`TypeError` sau khi đã đọc đủ 2 dòng: cả hai thẻ "ĐÃ ĐỌC") |
| Đọc quá số dòng (`EOFError`) | Khe kênh nhập trống, đèn đỏ "KÊNH NHẬP HẾT DÒNG" như `interrogation` | Gọi `input()` lần thứ ba |
| Lời nhắc dính vào dòng in | Ô `nhận:` hiện phần lời nhắc gạch chân (lấy từ `prompts`) | `input("Ma lenh: ")` |
| Không in gì ở một tình huống | Chip trống, `▯` ở ô `nhận:` | Thiếu `else` trong khối có lệnh |
| Lệch ở tình huống 4 | Tình huống 1–3 qua, 4 bị phát hiện; editor mờ dòng 7, 8, 10 | Lượt 2 |
| Chỉ đọc dòng pin khi cần | Thẻ dòng 2 "CHƯA ĐỌC" ở tình huống có lệnh, vẫn qua | Đọc pin trong nhánh `else` (mục 8.3) |
| Phản công trượt ở biên 30 | Đợt mới: tình huống 1 bị phát hiện, `nhận:` `LENH: DI` | `pin <= 30` |
| Phản công quá giờ hoặc lỗi | "TIẾN TRÌNH BỊ CẮT" | |

**Terminal** (lượt 2, ví dụ; chữ của từ vựng `patrol` do nhánh hạ tầng viết):

```
> LƯỢT CHẠY #2: Trạm Sạc Drone
> TÌNH HUỐNG 1/4 · KÊNH NHẬP: "XUAT KICH", "80" · DRONE BỎ QUA
> TÌNH HUỐNG 2/4 · KÊNH NHẬP: "", "12" · DRONE BỎ QUA
> TÌNH HUỐNG 3/4 · KÊNH NHẬP: "", "75" · DRONE BỎ QUA
> TÌNH HUỐNG 4/4 · KÊNH NHẬP: "VE TRAM", "5" · DRONE PHÁT HIỆN: dòng 1
    cần:  LENH:·CHO
    nhận: LENH:·DI
> KHÔNG CHẠY Ở TÌNH HUỐNG 4: dòng 7, 8, 10
> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP
```

## 6. Lời giải tham khảo (đạt 2 sao, trượt phản công)

```python
ma_lenh = input()
pin = int(input())

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH: NAP")
    else:
        print("LENH: CHO")
else:
    if pin <= 30:
        print("LENH: DI")
    else:
        print("LENH: CHO")
```

5 câu lệnh. Qua bốn tình huống cơ bản, trượt phản công 1 `["", "30"]`: in `LENH: DI`, cần `LENH: CHO`. Khóa `wrong_branch` ở lượt phản công.

Cũng 2 sao: liệt kê những mã lệnh đã thấy thay vì hỏi "có lệnh hay không" (`if ma_lenh == "XUAT KICH"` → `elif ma_lenh == "VE TRAM"` → `elif pin < 30` → `else`): trượt phản công 3 `[" ", "10"]`, vì một mã lệnh chưa gặp bị coi như ô trống.

## 7. OMNI phản công (sao thứ 3)

Ba tình huống mới: ô trống với pin đúng ở biên 30; lệnh xuất kích với pin rất thấp (có lệnh thì pin không còn quan trọng); một mã lệnh lạ chỉ gồm một dấu cách, với pin thấp.

Lời giải đạt 3 sao (5 câu lệnh, 33%):

```python
ma_lenh = input()
pin = int(input())

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH: NAP")
    else:
        print("LENH: CHO")
else:
    if pin < 30:
        print("LENH: DI")
    else:
        print("LENH: CHO")
```

Cũng đạt 3 sao (chấm theo đầu ra, không ép cách viết; hợp đồng chương mục "2.6 không ép lồng nhau"):

```python
ma_lenh = input()
pin = int(input())

if ma_lenh == "XUAT KICH":
    print("LENH: NAP")
elif ma_lenh == "" and pin < 30:
    print("LENH: DI")
else:
    print("LENH: CHO")
```

(4–5 câu lệnh), cũng như `if ma_lenh != "":` thay `if ma_lenh:` (5), `elif` thay `else: if` ở khối ngoài (5), lồng nhau gán biến rồi in một lần (6), và đọc dòng pin ngay trong điều kiện của nhánh ô trống (4). Tổng kết và gợi ý 3 dạy cách lồng; chỗ `if ma_lenh:` và `if ma_lenh != "":` cho cùng kết quả, màn không chấm riêng.

## 8. Bảng phủ nhánh, bảng đột biến, bảng đo câu lệnh

### 8.1. Bảng phủ nhánh

Theo lời giải lồng nhau: `N` = có lệnh (`ma_lenh` khác `""`), `X` = `ma_lenh == "XUAT KICH"`, `P` = `pin < 30`.

| Test | Kênh nhập | N | X | P | Nhánh lá | Dòng mong đợi | Bắt được |
|---|---|---|---|---|---|---|---|
| Cơ bản 1 | `"XUAT KICH"`, `"80"` | T | T | F | có lệnh → xuất kích | `LENH: NAP` | Đảo nghĩa có/không có lệnh; quên đổi kiểu (lỗi ngay đây) |
| Cơ bản 2 | `""`, `"12"` | F | (không xét) | T | trống → pin thấp | `LENH: DI` | So với dấu cách hoặc `None` thay cho rỗng; viết cứng theo tình huống 1 |
| Cơ bản 3 | `""`, `"75"` | F | (không xét) | F | trống → pin đủ | `LENH: CHO` | `or` thay `and` trong lời giải phẳng |
| Cơ bản 4 | `"VE TRAM"`, `"5"` | T | F | T | có lệnh → lệnh khác | `LENH: CHO` | Xét pin trước có lệnh (code gốc sau khi đổi kiểu); thiếu `else` trong khối có lệnh |
| Phản công 1 | `""`, `"30"` | F | (không xét) | F (biên) | trống → pin đủ | `LENH: CHO` | `<=` thay `<` |
| Phản công 2 | `"XUAT KICH"`, `"3"` | T | T | T | có lệnh → xuất kích | `LENH: NAP` | Liệt kê lệnh đã thấy rồi xét pin trước lệnh xuất kích |
| Phản công 3 | `" "`, `"10"` | T | F | T | có lệnh → lệnh khác | `LENH: CHO` | Liệt kê lệnh đã thấy thay vì hỏi có lệnh hay không |

- Cả bốn nhánh lá có test cơ bản (1, 4, 2, 3 theo thứ tự trong bảng).
- Biên của khái niệm chính (có lệnh / ô trống) nằm ở lượt cơ bản: `""` ở 2, 3; có chữ ở 1, 4. Tình huống 4 (có lệnh, pin thấp) là test duy nhất bắt lỗi "xét pin trước", nên phải ở lượt cơ bản.
- Biên 30 của phép so sánh nằm ở phản công (khái niệm của 2.1). Dấu cách là biên phụ của "có chữ", để ở phản công.

### 8.2. Bảng đột biến (đã đo)

Mọi dòng chạy trên đủ bốn test cơ bản và ba test phản công. Test tích hợp `tests/integration/level-2-6.test.ts` chạy mọi dòng (file trong `tests/fixtures/solutions/2.6/`).

| # | Đột biến | Thay đổi | Khóa | Tình huống trượt | Câu lệnh (cơ bản) | Sao |
|---|---|---|---|---|---|---|
| 1 | Code gốc | | `TypeError` (dòng 5) | cơ bản 1 | 3, 3, 3, 3 | 0 |
| 2 | Code gốc đã đổi kiểu (chuỗi phẳng xét pin trước) | `pin = int(input())` | `wrong_branch` | cơ bản 4 | 5, 4, 5, 4 | 0 |
| 3 | Chuỗi phẳng xét lệnh xuất kích trước, pin sau, không hỏi có lệnh | `if ma_lenh == "XUAT KICH"` → `elif pin < 30` → `else` | `wrong_branch` | cơ bản 4 | 4, 5, 5, 5 | 0 |
| 4 | Viết cứng theo tình huống 1 | chỉ `print("LENH: NAP")` | `wrong_branch` | cơ bản 2 | 3, 3, 3, 3 | 0 |
| 5 | Sai biên | `pin <= 30` | `wrong_branch` (phản công) | phản công 1 | 5, 5, 5, 5 | 2 |
| 6 | Liệt kê lệnh đã thấy | `XUAT KICH` → `VE TRAM` → `pin < 30` → `else` | `wrong_branch` (phản công) | phản công 3 | 4, 6, 6, 5 | 2 |
| 7 | Liệt kê lệnh, xét pin trước xuất kích | `VE TRAM` → `pin < 30` → `XUAT KICH` → `else` | `wrong_branch` (phản công) | phản công 2 | 6, 5, 6, 4 | 2 |
| 8 | Quên `not` (lời giải phẳng) | `elif ma_lenh and pin < 30` | `wrong_branch` | cơ bản 2 | 4, 5, 5, 5 | 0 |
| 9 | `or` thay `and` (lời giải phẳng) | `elif ma_lenh == "" or pin < 30` | `wrong_branch` | cơ bản 3 | 4, 5, 5, 5 | 0 |
| 10 | Đảo nghĩa ô lệnh | `if not ma_lenh:` với hai khối giữ nguyên | `wrong_branch` | cơ bản 1 | 5, 5, 5, 5 | 0 |
| 11 | So với dấu cách thay cho rỗng | `if ma_lenh != " ":` | `wrong_branch` | cơ bản 2 | 5, 5, 5, 5 | 0 |
| 12 | So với `None` | `if ma_lenh != None:` | `wrong_branch` | cơ bản 2 | 5, 5, 5, 5 | 0 |
| 13 | Thụt lề sai: `else` của khối trong lùi ra ngoài | khối có lệnh chỉ còn `if … NAP`; `else` ngoài in `CHO` | `wrong_branch` | cơ bản 2 | 5, 4, 4, 4 | 0 |
| 14 | Thụt lề sai: khối pin thụt vào khối có lệnh | `if pin < 30` nằm trong `if ma_lenh:` | `wrong_branch` | cơ bản 2 | 6, 4, 4, 7 | 0 |
| 15 | Thiếu `else` trong khối có lệnh | | `output_missing` | cơ bản 4 | 5, 5, 5, 4 | 0 |
| 16 | Các `if` rời in thẳng, đúng | bốn `if` với điều kiện ghép | `alert_exceeded` | | 7, 7, 7, 7 | 1 |
| 17 | Gán mặc định rồi `if/elif` | `lenh = "CHO"`, `if … NAP`, `elif … DI`, `print` | `alert_exceeded` | | 6, 7, 6, 6 | 1 |
| 18 | Gán mặc định rồi hai `if` rời | | `alert_exceeded` | | 7, 7, 6, 6 | 1 |
| 19 | Đọc hai dòng sai thứ tự | `pin = int(input())` trước `ma_lenh` | `ValueError` (`invalid literal for int() with base 10: 'XUAT KICH'`) | cơ bản 1 | 1, 1, 1, 1 | 0 |
| 20 | Lời nhắc trong `input()` | `input("Ma lenh: ")` | `output_has_prompt` | cơ bản 1 | 5, 5, 5, 5 | 0 |
| 21 | Đọc thêm một lần trong nhánh | `if int(input()) < 30:` sau khi đã đọc pin | `EOFError` | cơ bản 2 | 5, 4, 4, 5 | 0 |

Không đột biến nào được 3 sao. Viết cứng được 0 sao.

### 8.3. Bảng đo câu lệnh

| Cách viết (đều đúng luật) | Cơ bản 1–4 | Phản công 1–3 | Lớn nhất (cơ bản) | Sao |
|---|---|---|---|---|
| Lồng nhau, `print` trong từng nhánh | 5, 5, 5, 5 | 5, 5, 5 | 5 | 3 |
| Lồng nhau, `if ma_lenh != "":` | 5, 5, 5, 5 | 5, 5, 5 | 5 | 3 |
| Khối ngoài `if/elif/else`, khối có lệnh lồng | 5, 5, 5, 5 | 5, 5, 5 | 5 | 3 |
| Phẳng với `and` | 4, 5, 5, 5 | 5, 4, 5 | 5 | 3 |
| Đọc pin trong điều kiện của nhánh ô trống | 4, 4, 4, 4 | 4, 4, 4 | 4 | 3 |
| Phẳng với `and`, gán biến rồi in | 5, 6, 6, 6 | 6, 5, 6 | 6 | 3 |
| Lồng nhau, gán biến rồi in một lần | 6, 6, 6, 6 | 6, 6, 6 | **6** | 3 |
| Gán mặc định rồi `if/elif` | 6, 7, 6, 6 | 6, 6, 6 | 7 | 1 |
| Các `if` rời in thẳng | 7, 7, 7, 7 | 7, 7, 7 | 7 | 1 |

`alert_limit_statements` = **6**: bằng số câu lớn nhất của kiểu "gán biến rồi in một lần" (luật validate mục 1). Hai dòng `input()` tính 2 câu ở mọi cách viết.

## 9. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants`, `counter_attack_banner` (D1, `level:2.6`).

**Gợi ý** (mở dần, không bị kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Thứ đọc từ kênh nhập luôn là chữ, kể cả mức pin. Sau đó: nhìn tình huống bị phát hiện và các dòng bị làm mờ; drone ở tình huống đó có lệnh không, và mã của bạn có hỏi câu đó trước không |
| 2 (`hints[1]`) | Hướng tiếp cận: hai tầng câu hỏi. Tầng ngoài chỉ hỏi ô lệnh có gì không; mỗi nhánh của tầng ngoài có câu hỏi riêng của nó. Một dòng trống đọc vào là chuỗi rỗng, và Python coi chuỗi rỗng là sai trong điều kiện. Pseudocode hai tầng, chưa có cú pháp Python |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": `if` nằm trong khối của `if` khác, thụt thêm một mức; `else` thuộc về `if` cùng mức thụt lề; `if chuoi:` đúng khi chuỗi có ít nhất một ký tự (kể cả dấu cách), tương đương `if chuoi != "":`; `int(input())`. Ví dụ khác đáp án |

**Phản ứng miễn phí:** giọng cụt, lạnh, từ ngữ của trạm sạc, bảng lệnh, kênh nhập. Không nêu từ khóa, ký hiệu, chữ "lồng", không trích dòng đầu ra, mã lệnh hay số của tình huống. `{round}` chỉ ở khóa chỉ có ở lượt cơ bản.

| Khóa | Ý đồ |
|---|---|
| `entry` | Đặt cảnh: trạm sạc, bảng lệnh gửi qua kênh nhập hai dòng cho mỗi drone; ô lệnh có lúc trống; bảo chạy một lần |
| `TypeError` (code gốc) | Hai thứ khác kiểu bị đem so với nhau; mức pin đọc từ bảng trông giống số nhưng chưa phải số. Nói ở tình huống `{round}`, dòng `{line}` |
| `wrong_branch` (lượt 2 trở đi) | Mã đã ra quyết định của một tình huống khác; một câu hỏi đang được hỏi khi nó chưa có nghĩa. Bảo nhìn dòng bị làm mờ. Không dùng `{round}` (ở lượt phản công khóa này không có `round`) |
| `ValueError` | Một dòng chữ bị đòi đổi thành số; thường do đọc hai dòng sai thứ tự |
| `EOFError` | Mã chờ một dòng mà bảng không gửi; đếm số lần đọc kênh nhập |
| `output_has_prompt` | Lời nhắc mã tự in ra cũng đi vào dòng `{out_line}`; bảng lệnh không cần lời nhắc |
| `output_mismatch`, `output_case_only`, `output_missing`, `output_extra` | Theo khuôn 1.1; với `output_missing`, Kai không nhận được quyết định nào ở tình huống `{round}` |
| `SyntaxError`, `IndentationError`, `NameError`, `runtime_error` | Theo khuôn chung |
| `alert_exceeded` | Mỗi lần hỏi thêm hay gán thêm là một lần drone có thể nghe thấy; có những câu hỏi không cần hỏi lại ở mọi tình huống |
| `wrong_value_counter` | Bảng lệnh mới, lệnh in ra sai chữ (chỉ gặp khi dòng in sai ở phản công mà không trùng tình huống nào) |
| `counter_ValueError`, `counter_error`, `counter_timeout` | Theo khuôn 1.4 |
| `three_stars` | Bảng lệnh đổi mà Kai vẫn đọc đúng; ngắn |
| `generic`, `repeated_fail`, `engine_error`, `timeout`, `resource_limit`, `blocked_import`, `system_exit` | Theo khuôn chung |

`reaction_variants` có câu thay thế cho `wrong_branch`, `TypeError` và `alert_exceeded`.

`counter_attack_banner`: OMNI viết lại bảng lệnh của trạm sạc.

**Từ cấm của 2.6** (`forbidden_terms`, cộng danh sách chung và mọi dòng `expected_output`):

```json
["and", "or", "not", "if", "elif", "else",
 "==", "!=", "<=", ">=", "<", ">",
 "lồng", "lồng nhau", "thụt lề", "đảo thứ tự", "dấu hai chấm",
 "đổi kiểu", "ép kiểu", "chuyển kiểu",
 "lớn hơn hoặc bằng", "nhỏ hơn hoặc bằng",
 "ma_lenh", "LENH", "XUAT KICH", "VE TRAM",
 "10", "12", "30", "75", "80"]
```

- Không cấm các số một chữ số (`5`, `3`): chúng không lộ gì. Câu ECHO vẫn không viết số bằng chữ số, chỉ dùng chỗ giữ.
- Không cấm `pin` (là chữ "pin" tiếng Việt, ECHO cần dùng), `NAP`, `CHO`, `DI` (trùng chữ tiếng Việt khi so không phân biệt hoa thường); dòng mong đợi trọn vẹn đã bị cấm tự động, cộng `LENH`.
- Không cấm `input`: kênh nhập không phải bài học chính của màn, và ECHO cần nói về việc đọc kênh nhập ở `EOFError`, `ValueError`. Luật chung đã cấm `int`.

## 10. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Dòng in đúng ở cả bốn tình huống, không dòng thừa, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 6 câu lệnh ở mọi tình huống cơ bản |
| ⭐⭐⭐ | Thêm: qua ba tình huống phản công |
| 0 sao | Trên 15 câu lệnh |

## 11. Người chơi lần lượt làm gì

1. Vào màn, briefing gõ chữ, mục tiêu khóa vào, ECHO nói `entry`. Nút CHẠY có vòng sáng.
2. **Lượt 1:** `TypeError` dòng 5 ở tình huống 1 (cả hai thẻ kênh nhập "ĐÃ ĐỌC"). ECHO nói `TypeError`.
3. **Lượt 2:** đổi kiểu xong, tình huống 1–3 qua, tình huống 4 bị phát hiện. Dòng 7, 8, 10 mờ. ECHO nói `wrong_branch`.
4. **Rẽ sai thường gặp:**
   - Đổi chỗ hai điều kiện trong chuỗi phẳng: vẫn trượt tình huống 4, `reaction_variants.wrong_branch`.
   - Liệt kê `"VE TRAM"` như một lệnh riêng: qua lượt cơ bản, 2 sao, trượt phản công 3.
   - Thêm lời nhắc vào `input()`: `output_has_prompt`.
   - Đọc pin trước mã lệnh: `ValueError`.
5. **Hỏi "có lệnh không" trước, lồng câu hỏi thứ hai vào từng nhánh** → 3 sao. Người viết `pin <= 30` chỉ được 2 sao.
6. Hộp kết quả: "Đã thu: Đọc bảng lệnh" (ô 6/6, thanh đủ sáu luật).
7. TIẾP TỤC → Tổng kết → `after-2.6` → "VÀO NHIỆM VỤ" của 2.7.

## 12. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:2.6`). Cấu trúc nhịp trong JSON.

- `scene`: `tram-sentinel` (phông có sẵn). Phase tích hợp đổi sang `tram-sac` khi nhánh cảnh S xong (hợp đồng engine mục 8).
- `outro`: Kai đọc hết bảng lệnh mà không drone nào rời cột sạc. Cuối bảng còn một dòng ghi cũ, không thuộc lệnh tuần tra nào, dẫn vào mảnh nhật ký. Theo `design/gdd-chuong-2.md` mục 4, bảng lệnh là chỗ hiếm hoi có màu vàng ấm ở Chương 2.
- `lore_fragment` (**KTS-0█**): một bản ghi bị xóa mã người viết, đề ngày sau khi tám người chia mảnh, chỉ nói đã nộp một thứ gì đó. Không nêu tên, không có chi tiết nhận dạng (không giới tính, không chức vụ, không cách viết riêng của KTS nào đã lộ).
- `component`: Đọc bảng lệnh (ô 6/6 sáng lên; thanh Bộ luật né đủ sáu luật).
- `outro_beats`, bốn nhịp:

| # | Kiểu | Nền, cue, `fx` | Ý đồ |
|---|---|---|---|
| 1 | `log` | `tram-sentinel`, cue `siren`, `fx: "focus"` | Bảng lệnh đổi cùng lúc ở mọi cột sạc: tháp ra lệnh xuất kích tới một tín hiệu không định danh gần tháp |
| 2 | `echo` | `fx: "alert_tick"` | ECHO đọc lịch của tháp: đợt quét lớn đã dời sớm. ECHO chỉ nói giờ mới gần hơn, không nói Kai bị lộ |
| 3 | `kai` | | Kai hiểu tín hiệu không định danh đó là mình. Phải lên tháp ngay. Một câu |
| 4 | `echo` | `fx: "id_bar"` | ECHO: bộ luật né đã đủ sáu luật; từ đây Kai chạy cả sáu cùng lúc. Dẫn vào Boss 2.7 |

- ECHO không suy đoán về KTS-0█, không nhắc 0xA7 ở màn này.
- Móc câu: một Kiến Trúc Sư đã làm gì đó sau ngày chia mảnh; Sentinel biết có người trong dải.

### 12.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.6`); `code`/`output`/`stdin` là câu đố (JSON). Mọi `code` dưới đây đã chạy bằng python3 3.13 với `stdin` ghi kèm và in đúng `output`; ví dụ khác đáp án.

| Mục | Ý chính | `code` | `stdin` | `output` |
|---|---|---|---|---|
| `if` trong `if` | Câu hỏi thứ hai chỉ được hỏi khi câu trả lời thứ nhất đã rõ; khối trong thụt thêm một mức | `co_mua = True`<br>`co_o = False`<br>`if co_mua:`<br>`    if co_o:`<br>`        print("Mo o")`<br>`    else:`<br>`        print("Tim cho tru")`<br>`else:`<br>`    print("Di bo")` | | `Tim cho tru` |
| Chuỗi rỗng là sai | `""` là sai; chuỗi có ít nhất một ký tự là đúng, kể cả một dấu cách | `print(bool(""))`<br>`print(bool(" "))`<br>`print(bool("A"))` | | `False`<br>`True`<br>`True` |
| `if chuoi:` | Đọc như "nếu có chữ"; dòng trống từ `input()` là `""` | `ten = input()`<br>`if ten:`<br>`    print("Chao", ten)`<br>`else:`<br>`    print("Chua nhap ten")` | `"\n"` | `Chua nhap ten` |
| Viết rõ hơn | `if ten != "":` cho cùng kết quả với `if ten:` | `ten = input()`<br>`if ten != "":`<br>`    print("Chao", ten)`<br>`else:`<br>`    print("Chua nhap ten")` | `"Lan\n"` | `Chao Lan` |
| Lồng nhau và `and` | Một `if` trong `if`, không có `else` ở khối trong, giống một `if` với `and` | `co_ve = True`<br>`tuoi = 10`<br>`if co_ve:`<br>`    if tuoi >= 12:`<br>`        print("Vao")`<br>`if co_ve and tuoi >= 12:`<br>`    print("Vao")`<br>`print("Het")` | | `Het` |

Lỗi thường gặp (`mistakes`; `code` và `error` là câu đố, `explain` ở D1):

| `code` | `error` | Ý của `explain` |
|---|---|---|
| `diem = input()`<br>`if diem < 50:`<br>`    print("Thi lai")` | `TypeError: '<' not supported between instances of 'str' and 'int'` | `input()` trả chữ; đổi sang số trước khi so |
| `a = True`<br>`b = False`<br>`if a:`<br>`    if b:`<br>`        print("B")`<br>`else:`<br>`    print("Khong A")` | Không báo lỗi, nhưng không in gì | `else` thuộc về `if` cùng mức thụt lề; ở đây nó là của `if a:`, không phải `if b:` |
| `ten = " "`<br>`if ten:`<br>`    print("Co ten")` | Không báo lỗi, nhưng in ra: Co ten | Một dấu cách vẫn là một ký tự, nên chuỗi không rỗng |

`next` báo trước màn sau: Boss, Trạm Sentinel chạy cả sáu luật qua ba pha tuần tra liên tiếp.

## 13. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `TypeError` dòng 5, `round` 1, `stdin_read` 2 | **Có** (tích hợp) |
| Đổi kiểu dòng 3 | `wrong_branch`, `round` 4; `skipped_lines` của tình huống 4 là `[7, 8, 10]` | **Có** |
| Lời giải 3 sao lồng nhau, phẳng với `and`, `!= ""` | 3 sao; 5, 5, 5 câu lệnh | **Có** (tham số hóa) |
| Lời giải 2 sao `<= 30` và liệt kê lệnh | 2 sao, `wrong_branch` ở phản công | **Có** |
| Mọi dòng bảng đột biến 8.2 | Đúng khóa, sao, số câu lệnh | **Có** |
| Dòng kênh nhập rỗng `""` và `" "` | Harness trả nguyên văn (`""`, `" "`); validator nhận cả hai (không cắt khoảng trắng) | **Có** (harness: dòng rỗng và dòng một dấu cách) |
| `ma_lenh.strip()` | Đúng ở mọi test trừ phản công 3 (`" "` thành rỗng, pin 10 → `DI`): 2 sao. Ngoài phạm vi màn; chấp nhận | Không |
| `if len(ma_lenh) > 0:` | Đúng, cùng số câu | Không |
| `input()` ở level không có `stdin` | Vẫn `input_unsupported` (không đổi) | Đã có |
| Lời ECHO | Không chứa từ cấm, dòng mong đợi, số tình huống | **Có** |
| Ví dụ tổng kết có `stdin` | Chạy bằng `python3` với đầu vào đó, in đúng `output` | **Có** (test tích hợp sẵn có) |
| Đi trọn đường: code gốc → 3 sao | e2e `level-2-6.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 14. Dữ liệu level

Câu đố sẽ nằm ở `src/levels/level-2-6.json`, câu chữ ở D1 (tài liệu `level:2.6`, migration `0016`). Dữ liệu test (đặc tả, JSON thắng khi lệch):

```json
"chapter": 2,
"difficulty": "medium",
"concepts": ["nested_if", "empty_string"],
"simulation": { "kind": "patrol", "decision": { "line": 1 } },
"inputs": [],
"locked_lines": [],
"objectives": [{ "kind": "output_line", "line": 1 }],
"alert_limit_statements": 6,
"tests": [
  { "inputs": {}, "stdin": ["XUAT KICH", "80"], "expected": {}, "expected_output": ["LENH: NAP"] },
  { "inputs": {}, "stdin": ["", "12"],          "expected": {}, "expected_output": ["LENH: DI"] },
  { "inputs": {}, "stdin": ["", "75"],          "expected": {}, "expected_output": ["LENH: CHO"] },
  { "inputs": {}, "stdin": ["VE TRAM", "5"],    "expected": {}, "expected_output": ["LENH: CHO"] }
],
"counter_attack_tests": [
  { "inputs": {}, "stdin": ["", "30"],          "expected": {}, "expected_output": ["LENH: CHO"] },
  { "inputs": {}, "stdin": ["XUAT KICH", "3"],  "expected": {}, "expected_output": ["LENH: NAP"] },
  { "inputs": {}, "stdin": [" ", "10"],         "expected": {}, "expected_output": ["LENH: CHO"] }
],
"scene": "tram-sentinel"
```

`starter_code` đúng như mục 3. `outro_beats` như mục 12. `knowledge_summary` như mục 12.1 (mục có `stdin` ghi chuỗi có `\n` cuối). `forbidden_terms` như mục 9.

Màn này là level đầu tiên không có dòng khóa nào. `use-game.ts` và `game-screen.tsx` đã có đường lùi `locked_lines[0] ?? 1`; nhánh màn phải chạy e2e kiểm editor, nút đặt lại code và bảng cảm biến với `inputs: []`.

## 15. Tiêu chí chấp nhận

1. JSON qua `validateLevel` (có `stdin` ở mọi test, dòng `""` và `" "` hợp lệ, luật `patrol`) và migration `0016` qua `validateLevelText`.
2. Code gốc ra `TypeError` dòng 5 ở tình huống 1; đổi kiểu xong ra `wrong_branch` ở tình huống 4; lời giải lồng nhau được 3 sao với 5 câu lệnh.
3. Mọi dòng bảng đột biến 8.2 cho đúng khóa, số sao và số câu lệnh trong `tests/integration/level-2-6.test.ts`; không dòng nào 3 sao.
4. Lời giải lồng nhau gán biến rồi in một lần được 3 sao (6 câu); các `if` rời in thẳng được 1 sao (7 câu).
5. Ví dụ tổng kết (cả mục có `stdin` là dòng trống) chạy đúng bằng python3; lời ECHO sạch từ cấm.
6. typecheck, `npm test`, `npm run test:py`, build qua; e2e được viết.

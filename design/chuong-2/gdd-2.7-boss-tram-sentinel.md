# Level 2.7 – BOSS "Trạm Sentinel"

> Chương 2 – Trạm Sentinel · Độ khó: Boss · Khái niệm: tổng hợp Chương 2 (so sánh và `bool`, `if`, `else`, `elif` và thứ tự nhánh, `and`/`or`/`not` và ngoặc, điều kiện lồng, chuỗi rỗng coi là sai), cộng đổi kiểu dữ liệu từ kênh nhập (1.4, 1.6)
> Câu đố: `src/levels/level-2-7.json` (chưa dựng). Câu chữ người chơi đọc: tài liệu `level:2.7` ở D1 (câu ban đầu vào `db/migrations/0017_content_level_2_7.sql`); GDD chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Khung chương: `design/gdd-chuong-2.md` mục 6.7 và 8. Hạ tầng: `docs/hop-dong-engine-chuong-2.md` (thắng tài liệu này khi khác nhau). Brainstorm: `design/quyet-dinh/level-2-7-boss-tram-sentinel.md`.
> Mọi con số trong tài liệu này đo bằng harness thật (`run_level`, python3 3.13.2 và 3.14, cùng kết quả) ngày 30/10/2026.

## 0. Khác với phác thảo ở `design/gdd-chuong-2.md` mục 6.7

| Phác thảo | GDD này | Lý do |
|---|---|---|
| Ba pha tuần tra (ba test cơ bản) | **Bốn pha** | Thang báo động có bốn mức. Ba test cơ bản không thể đi qua cả bốn nhánh của dòng 2, mà hợp đồng engine mục 4 đòi mọi nhánh có một test cơ bản. Phép đo của phác thảo (`35`, `75`, `150`) cũng thiếu mức `BAO DONG` |
| `KAI: NAP` khi trong tầm **và camera bật** | `KAI: NAP` khi trong tầm **và (camera bật hoặc đèn pha bật)** | Luật phác thảo không có điều kiện nào trộn `and` với `or`, nên lỗi "thiếu ngoặc trong điều kiện ghép" mà phác thảo đặt vào code khởi đầu không có chỗ đứng. Truyện: đèn pha chiếu vào thì drone thấy Kai dù camera tắt |
| Ngưỡng đề xuất 14 | **17** | Báo cáo validate khung, điều chỉnh 1: ngưỡng không phạt kiểu "gán biến rồi in một lần" (17 câu). 17 vẫn bắt được thang tách thành các `if` rời gán đè (18–20 câu) |

Dữ liệu tình huống cũng đổi so với phép đo của phác thảo để mọi nhánh, mọi bẫy có mặt (mục 6). Đề xuất sửa mục 6.7 nằm trong báo cáo `plans/reports/brainstorm-261030-0152-level-2-7.md`.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:2.7`).

Briefing là nhật ký của Trạm Sentinel, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- đợt quét lớn đã dời sớm và đang bắt đầu; Trạm Sentinel chạy **bốn pha tuần tra liên tiếp**; mỗi pha tháp nạp dữ liệu cảm biến khác (tầm quét, camera, đèn pha) và gửi hai dòng qua kênh nhập (khoảng cách tới tín hiệu lạ, mã lệnh trên bảng lệnh, có thể trống); tín hiệu nào trả lời sai ở một pha là bị khóa đèn, cả lượt hỏng;
- bộ luật né của Kai phát bốn dòng, mỗi dòng ghép từ các luật Kai đã dựng ở sáu chặng trước (ô Mục tiêu ghi luật từng dòng);
- qua đủ bốn pha thì tháp áp luật khẩn cấp với dữ liệu mới (gieo trước lượt phản công, không nói dữ liệu gì).

Briefing không nêu từ khóa Python, ký hiệu so sánh hay giá trị của pha nào. Không nhắc 0xA7.

`location`: tên Trạm Sentinel (dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng).

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:2.7`), 4 bước, giọng hướng dẫn. Không chứa dòng đầu ra mong đợi, không chứa `True`/`False` hay giá trị dữ liệu. Bốn bước lần lượt nói:

1. bản nháp của Kai có bốn khối, mỗi khối in một dòng; chạy trước, đọc terminal xem pha nào, dòng nào sai; không sửa ba dòng khóa;
2. sửa từng khối cho khớp luật ở ô Mục tiêu; dòng mờ trong editor sau mỗi lượt là dòng không chạy ở pha đang hiện; đừng chép tay thứ tháp gửi vì mỗi pha một dữ liệu;
3. lượt chỉ đạt khi qua đủ bốn pha liên tiếp;
4. hoàn thành khi cả 4 mục tiêu chuyển thành xanh ở cả bốn pha; không quá 17 câu lệnh và qua luật khẩn cấp thì được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (4 dòng đầu ra, mỗi dòng ghi luật); khung chat ECHO | Editor `bo_luat_ne.py`, nút CHẠY, terminal | Mô phỏng `patrol` (mục 5) |

## 3. Code khởi đầu (có lỗi cài sẵn)

Bản nháp Kai ghép vội từ sáu chặng. Mỗi khối mang lại một lỗi đã gặp ở chặng đó; lỗi lộ ra lần lượt qua từng lượt sửa, như 1.7.

```python
# Dữ liệu cảm biến tháp nạp mỗi pha (KHÔNG được sửa 3 dòng này)
tam_quet = 40
camera_bat = True
den_pha = False

# Kênh nhập: dòng 1 là khoảng cách tới Kai, dòng 2 là mã lệnh của tháp (có thể trống)
khoang_cach = input()
ma_lenh = input()

# Luật 1 · Cảm biến tầm quét
trong_tam = khoang_cach < tam_quet
print(f"TRONG TAM: {trong_tam}")

# Luật 4 · Thang báo động
if khoang_cach < 100:
    print("MUC: CANH GIAC")
elif khoang_cach < 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 20:
    print("MUC: BAO DONG")
else:
    print("MUC: AN TOAN")

# Luật 6 · Đọc bảng lệnh
if ma_lenh:
    if ma_lenh == "XUAT KICH":
        lenh_drone = "XUAT KICH"
    else:
        lenh_drone = "CHO LENH"
else:
    lenh_drone = "KHONG CO"
    print(f"LENH DRONE: {lenh_drone}")

# Luật 2, 3, 5 · Quyết định của Kai
if trong_tam and camera_bat or den_pha:
    print("KAI: NAP")
elif den_pha or ma_lenh == "XUAT KICH":
    print("KAI: CHO")
else:
    print("KAI: QUA")
```

`locked_lines`: 2, 3, 4. `inputs`: `tam_quet`, `camera_bat`, `den_pha`. Chú thích trong code là câu đố (giống 1.7), không phải câu chữ D1.

| Dòng | Khối | Lỗi cài sẵn (chặng gốc) | Lộ ra ở đâu |
|---|---|---|---|
| 7 | Kênh nhập | Khoảng cách chưa đổi sang số (1.4, 1.6, 2.6) | Lượt 1, pha 1: `TypeError` ở dòng 11 |
| 11 | Cảm biến tầm quét | `<` thay `<=`: "không vượt tầm quét" gồm cả điểm bằng (2.1) | Chỉ ở luật khẩn cấp (phản công 1: khoảng cách đúng bằng tầm quét) |
| 15–22 | Thang báo động | Xếp ngược, điều kiện rộng đứng trước (2.4) | Pha 1, dòng 2 |
| 25–32 | Đọc bảng lệnh | Dòng in thụt vào khối `else`, chỉ chạy khi không có lệnh (2.3, 2.6) | Pha 1, dòng 3 (editor làm mờ dòng 32) |
| 35 | Quyết định | Thiếu ngoặc: `and` tính trước `or` (2.5) | Pha 3, dòng 4 |

Phần đúng sẵn: khối lồng của luật 6 (2.6), chuỗi rỗng coi là sai (`if ma_lenh:`), thứ tự `if/elif/else` của khối quyết định (2.2, 2.3, 2.4), vế `elif` có `or`.

### 3.1. Chuỗi khóa phản ứng qua các lượt sửa (đã đo)

Mỗi lượt sửa đúng một lỗi theo thứ tự lộ ra. "Câu lệnh" là số câu ở bốn pha cơ bản.

| Lượt | Đã sửa | Khóa | `details` | Câu lệnh P1–P4 | Sao |
|---|---|---|---|---|---|
| 1 | (code gốc) | `TypeError` | `line` 11, `round` 1 | 3, 3, 3, 3 | 0 |
| 2 | `khoang_cach = int(input())` | `wrong_branch` (không có câu thì `output_mismatch`) | `out_line` 2, `round` 1; nhận `MUC: CANH GIAC` (giá trị mong đợi của pha 2) | 11, 11, 11, 14 | 0 |
| 3 | thang xếp `< 20`, `< 50`, `< 100` | `output_mismatch` | `out_line` 3, `col` 1, `round` 1; nhận `KAI: NAP` ở chỗ dòng 3 vì dòng 3 không in | 12, 13, 11, 14 | 0 |
| 4 | dòng 32 ra khỏi khối `else` | `wrong_branch` (không có câu thì `output_mismatch`) | `out_line` 4, `round` 3; nhận `KAI: NAP` | 13, 13, 12, 15 | 0 |
| 5 | ngoặc: `trong_tam and (camera_bat or den_pha)` | `wrong_branch` ở luật khẩn cấp (không có câu thì `wrong_value_counter`) | phản công 1, `out_line` 1; nhận `TRONG TAM: False`. Không có `round` | 13, 13, 13, 15 (tối đa 15) | 2 |
| 6 | `<=` ở dòng 11 | `three_stars` | | 13, 13, 13, 15 | 3 |

Dòng không chạy (`skipped_lines`, hợp đồng engine mục 6) ở lượt 3, pha 1: 16, 19, 20, 22, 29, 31, **32**, 37, 38, 40. Dòng 32 (dòng in) mờ là manh mối chính của lượt này.

Lượt 1 không in dòng nào: lỗi nằm ngay ở dòng tính đầu tiên. Đây là lỗi dễ nhất (người chơi đã gặp ở 1.4, 1.6, 2.6), nên để nó chắn trước không làm người chơi lạc. Lượt 2–4 dừng ở pha 1, 1, 3: người chơi thấy các pha lần lượt qua.

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:2.7`, neo theo `line`). Mỗi nhãn mở bằng tên luật, rồi luật dựng dòng bằng lời, đủ để viết code mà không đoán. Nhãn được nêu ngưỡng (20, 50, 100) và các giá trị có thể (`NAP`, `CHO`, `QUA`…) vì đó là đặc tả; không ghi giá trị của pha nào. Nhãn dòng 4 phải nói rõ phần nào gộp với nhau (ví dụ dùng "drone thấy được Kai: camera bật hoặc đèn pha bật"), để đọc không ra hai nghĩa.

| Dòng | Luật | Đặc tả |
|---|---|---|
| 1 | Cảm biến tầm quét | `TRONG TAM: ` rồi `True` khi khoảng cách không vượt tầm quét, ngược lại `False` (như `print` in một `bool`) |
| 2 | Thang báo động | `MUC: BAO DONG` khi khoảng cách dưới 20, `MUC: NGUY HIEM` dưới 50, `MUC: CANH GIAC` dưới 100, còn lại `MUC: AN TOAN` |
| 3 | Đọc bảng lệnh | Có mã lệnh: `LENH DRONE: XUAT KICH` khi mã lệnh đúng là `XUAT KICH`, mã khác thì `LENH DRONE: CHO LENH`. Mã lệnh trống: `LENH DRONE: KHONG CO` |
| 4 | Quyết định của Kai | `KAI: NAP` khi Kai trong tầm quét **và** drone thấy được (camera bật hoặc đèn pha bật); nếu không, `KAI: CHO` khi đèn pha bật hoặc mã lệnh là `XUAT KICH`; còn lại `KAI: QUA` |

- Bốn pha phải đạt liên tiếp. Không dòng thừa, chạy hết không lỗi.
- **Mức cảnh báo ≤ 40%** (≤ 17 câu lệnh; 100% = 42). Tính theo pha nhiều câu lệnh nhất.
- Lời nhắc của `input()` **bị chấm**: kênh nhập ghi lời nhắc ra stdout không xuống dòng (như 1.6, 1.7), nên `input("Khoang cach: ")` làm dòng 1 thành `Khoang cach: TRONG TAM: True` (khóa `output_has_prompt`). Code khởi đầu dùng `input()` trống; nhãn và gợi ý không cần nhắc, ECHO nói khi nó xảy ra.

## 5. Diễn biến khi chạy (mô phỏng `patrol`)

`"simulation": { "kind": "patrol", "decision": { "line": 4 } }`. Đặc tả cảnh: hợp đồng engine mục 2.

- Mỗi test cơ bản là một tình huống ("PHA 1/4"… trong lời truyện; từ mở vòng của terminal là "TÌNH HUỐNG" theo `sim-vocabulary.ts`). Bảng cảm biến hiện `tam_quet`, `camera_bat`, `den_pha` và hai dòng kênh nhập. Chip của Kai hiện dòng 4 nhận được. Ba dòng còn lại đi vào danh sách dòng dùng chung (`output-slots`).
- Tình huống đạt khi cả bốn dòng đúng: Kai đi qua, drone không quay đèn lại. Một dòng bất kỳ sai: đèn khóa vào Kai, "BỊ PHÁT HIỆN", danh sách dòng hiện `cần:`/`nhận:` ở dòng sai. Các tình huống sau xám "CHƯA TỚI".
- Phản công: băng `counter_attack_banner`, nhãn "OMNI ĐỔI LUẬT TUẦN TRA", ba tình huống luật khẩn cấp chạy như tình huống mới.
- Đạt cả phản công: drone tắt đèn, Kai tới chân tháp. Cue `gate_open` rồi `star` (theo khuôn chung của `patrol`).

### 5.1. Bảng biên của mô phỏng

| Trường hợp | Cảnh phải vẽ | Ví dụ đo được |
|---|---|---|
| Lỗi chạy trước dòng in đầu tiên | Tình huống 1: đèn khóa vào Kai, nhãn `TypeError`; chip trống; mọi dòng "▯"; tình huống 2–4 "CHƯA TỚI" | Code gốc |
| Dòng 4 đúng nhưng dòng khác sai | Tình huống **trượt** (luật cả bộ, không chỉ dòng quyết định). Chip của Kai đúng giá trị nhưng drone vẫn phát hiện; dòng sai đỏ trong danh sách | Lượt 2: pha 1 nhận `KAI: NAP` đúng, dòng 2 sai |
| Thiếu dòng làm các dòng sau dồn lên | Dòng 3 hiện `KAI: NAP` đỏ, dòng 4 "▯"; chip Kai "▯" | Lượt 3, pha 1 |
| Dòng thừa | Dòng thứ 5 hiện ở cuối danh sách là dòng thừa | Đột biến "dòng 4 hai `if` rời, in" |
| Lời nhắc dính vào dòng 1 | Dòng 1 đỏ, `nhận:` có lời nhắc | Đột biến "lời nhắc trong `input`" |
| Mã lệnh trống `""` và một dấu cách `" "` | Bảng cảm biến phải phân biệt được hai thứ: hiện trong ngoặc kép (`""`, `" "`) như dòng `KÊNH NHẬP` của terminal | Pha 2, phản công 1 |
| Lỗi cú pháp, lỗi thụt lề | Không tình huống nào chạy | `=` thay `==`, thiếu `:` |
| Qua bốn pha nhưng quá 17 câu | Mọi tình huống đạt; thanh cảnh báo quá 40%; không có phản công | Thang tách `if` rời gán đè (18) |
| Quá 42 câu | Bị bắt: 0 sao, không phản công | (không có lời giải tự nhiên nào chạm tới) |
| Phản công timeout hoặc bị hủy | "TIẾN TRÌNH BỊ CẮT", không vẽ drone phát hiện (bài học M1) | `while True: pass` cuối code |
| Giảm chuyển động, Esc, điện thoại, `aria-live` | Theo khuôn `use-timeline-playback.ts` | |

Việc "dòng 4 đúng mà tình huống vẫn trượt" là chỗ hợp đồng mục 2 chưa nói rõ cho Boss ("Khớp: Kai đi qua" chỉ nói về `decision`). Báo cáo brainstorm đề xuất ghi rõ cho nhánh H6: tình huống đạt ⇔ test đạt.

**Terminal** (minh họa lượt 2; từ ngữ thật do `sim-vocabulary.ts` mục `patrol` quyết định):

```
> LƯỢT CHẠY #2
> TÌNH HUỐNG 1/4 · tam_quet = 40 · camera_bat = True · den_pha = False
> KÊNH NHẬP: "35", "XUAT KICH"
> dòng 1 khớp · TRONG TAM: True
> dòng 2 lệch
    cần:  MUC:·NGUY·HIEM
    nhận: MUC:·CANH·GIAC
> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 17, 18, 19, 20, 22, 29, 31, 32, 37, 38, 40
> DRONE PHÁT HIỆN
```

## 6. Bốn pha và luật khẩn cấp

### 6.1. Dữ liệu

| | `tam_quet` | `camera_bat` | `den_pha` | Kênh nhập | Đầu ra mong đợi |
|---|---|---|---|---|---|
| Pha 1 | 40 | True | False | `"35"`, `"XUAT KICH"` | `TRONG TAM: True` · `MUC: NGUY HIEM` · `LENH DRONE: XUAT KICH` · `KAI: NAP` |
| Pha 2 | 80 | False | True | `"75"`, `""` | `TRONG TAM: True` · `MUC: CANH GIAC` · `LENH DRONE: KHONG CO` · `KAI: NAP` |
| Pha 3 | 12 | False | True | `"15"`, `"VE TRAM"` | `TRONG TAM: False` · `MUC: BAO DONG` · `LENH DRONE: CHO LENH` · `KAI: CHO` |
| Pha 4 | 60 | True | False | `"150"`, `"TUAN TRA"` | `TRONG TAM: False` · `MUC: AN TOAN` · `LENH DRONE: CHO LENH` · `KAI: QUA` |
| Khẩn cấp 1 | 50 | True | False | `"50"`, `" "` | `TRONG TAM: True` · `MUC: CANH GIAC` · `LENH DRONE: CHO LENH` · `KAI: NAP` |
| Khẩn cấp 2 | 15 | False | False | `"20"`, `"XUAT KICH"` | `TRONG TAM: False` · `MUC: NGUY HIEM` · `LENH DRONE: XUAT KICH` · `KAI: CHO` |
| Khẩn cấp 3 | 120 | False | False | `"100"`, `""` | `TRONG TAM: True` · `MUC: AN TOAN` · `LENH DRONE: KHONG CO` · `KAI: QUA` |

Giá trị JSON chính xác (`tests` rồi `counter_attack_tests`; mọi test có `"expected": {}`):

```json
"tests": [
  { "inputs": { "tam_quet": 40, "camera_bat": true, "den_pha": false }, "stdin": ["35", "XUAT KICH"], "expected": {},
    "expected_output": ["TRONG TAM: True", "MUC: NGUY HIEM", "LENH DRONE: XUAT KICH", "KAI: NAP"] },
  { "inputs": { "tam_quet": 80, "camera_bat": false, "den_pha": true }, "stdin": ["75", ""], "expected": {},
    "expected_output": ["TRONG TAM: True", "MUC: CANH GIAC", "LENH DRONE: KHONG CO", "KAI: NAP"] },
  { "inputs": { "tam_quet": 12, "camera_bat": false, "den_pha": true }, "stdin": ["15", "VE TRAM"], "expected": {},
    "expected_output": ["TRONG TAM: False", "MUC: BAO DONG", "LENH DRONE: CHO LENH", "KAI: CHO"] },
  { "inputs": { "tam_quet": 60, "camera_bat": true, "den_pha": false }, "stdin": ["150", "TUAN TRA"], "expected": {},
    "expected_output": ["TRONG TAM: False", "MUC: AN TOAN", "LENH DRONE: CHO LENH", "KAI: QUA"] }
],
"counter_attack_tests": [
  { "inputs": { "tam_quet": 50, "camera_bat": true, "den_pha": false }, "stdin": ["50", " "], "expected": {},
    "expected_output": ["TRONG TAM: True", "MUC: CANH GIAC", "LENH DRONE: CHO LENH", "KAI: NAP"] },
  { "inputs": { "tam_quet": 15, "camera_bat": false, "den_pha": false }, "stdin": ["20", "XUAT KICH"], "expected": {},
    "expected_output": ["TRONG TAM: False", "MUC: NGUY HIEM", "LENH DRONE: XUAT KICH", "KAI: CHO"] },
  { "inputs": { "tam_quet": 120, "camera_bat": false, "den_pha": false }, "stdin": ["100", ""], "expected": {},
    "expected_output": ["TRONG TAM: True", "MUC: AN TOAN", "LENH DRONE: KHONG CO", "KAI: QUA"] }
]
```

Dữ liệu dòng khóa trong code khởi đầu (`40`, `True`, `False`) trùng pha 1, như 1.7.

### 6.2. Bảng phủ nhánh

P = pha (test cơ bản), K = luật khẩn cấp (phản công).

| Quyết định | Nhánh | Cơ bản | Phản công |
|---|---|---|---|
| Dòng 1 (`<=`) | `True` | P1, P2 | K1 (**biên** 50 = 50), K3 |
| | `False` | P3, P4 | K2 |
| Dòng 2 (`elif` bốn mức) | `BAO DONG` | P3 | |
| | `NGUY HIEM` | P1 | K2 (**biên** 20) |
| | `CANH GIAC` | P2 | K1 (**biên** 50) |
| | `AN TOAN` | P4 | K3 (**biên** 100) |
| Dòng 3, ngoài (`if ma_lenh:`) | có mã | P1, P3, P4 | K1 (**một dấu cách**), K2 |
| | trống | P2 | K3 |
| Dòng 3, trong | `XUAT KICH` | P1 | K2 |
| | mã khác | P3, P4 | K1 |
| Dòng 4, nhánh `NAP` | thấy nhờ camera | P1 | K1 |
| | thấy nhờ đèn pha | P2 | |
| Dòng 4, nhánh `CHO` | nhờ đèn pha (ngoài tầm) | P3 | |
| | nhờ lệnh xuất kích (đèn tắt) | | K2 |
| Dòng 4, nhánh `QUA` | ngoài tầm | P4 | |
| | trong tầm nhưng drone không thấy | | K3 |
| Dòng 4, thứ tự `if/elif` | cả hai điều kiện cùng đúng (phải ra `NAP`) | P1 (vì lệnh xuất kích), P2 (vì đèn pha) | |
| Dòng 4, ngoặc | ngoài tầm, đèn pha bật (thiếu ngoặc ra `NAP`, đúng là `CHO`) | P3 | |

Mọi nhánh có ít nhất một pha cơ bản. Mọi điểm biên số (khoảng cách bằng tầm quét; 20, 50, 100) và mã lệnh một dấu cách nằm ở luật khẩn cấp, như phác thảo. Lý do: khái niệm của riêng Boss là ghép luật thành một quyết định (dòng 4), và mọi tổ hợp làm đổi quyết định đó đều ở pha cơ bản. Các biên số thuộc khái niệm của 2.1 và 2.4, đã được chấm ở test cơ bản của chính hai màn đó; ở Boss chúng là sao thứ ba.

### 6.3. Bảng đột biến (đã đo)

"In" là lời giải tham khảo in trong từng nhánh (mục 7.1) đổi đúng một chỗ. Khóa ghi theo hợp đồng mục 5.1 (`wrong_branch` đi trước khóa chung khi level có câu cho nó).

| Đột biến | Khóa | Pha/dòng | Câu (tối đa) | Sao |
|---|---|---|---|---|
| Viết cứng theo pha 1 (bốn `print`) | `wrong_branch` | P2, dòng 2 | 6 | 0 |
| Sai biên dòng 1: `<` thay `<=` | `wrong_branch` | K1, dòng 1 | 14 | 2 |
| Sai biên thang: `<=` thay `<` | `wrong_branch` | K1, dòng 2 (`NGUY HIEM`) | 14 | 2 |
| Thang xếp ngược | `wrong_branch` | P1, dòng 2 | 14 | 0 |
| Thang tách `if` rời, in trong từng `if` | `output_mismatch` | P1, dòng 3 (dòng 2 in thừa) | 16 | 0 |
| Thang tách `if` rời gán đè, phần khác in | `alert_exceeded` | | **18** | 1 |
| Thang tách `if` rời gán đè, mọi phần gán rồi in | `alert_exceeded` | | **20** | 1 |
| Thiếu ngoặc dòng 4 (code gốc) | `wrong_branch` | P3, dòng 4 | 14 | 0 |
| Đảo `and`/`or` ở vế `NAP`: `trong_tam or (camera_bat and den_pha)` | `wrong_branch` | K3, dòng 4 | 14 | 2 |
| Đảo `and`/`or` ở vế `CHO`: `den_pha and ma_lenh == "XUAT KICH"` | `wrong_branch` | P3, dòng 4 | 14 | 0 |
| Quên vế camera: `trong_tam and den_pha` | `wrong_branch` | P1, dòng 4 | 14 | 0 |
| Quên vế đèn pha (luật cũ của phác thảo): `trong_tam and camera_bat` | `wrong_branch` | P2, dòng 4 | 14 | 0 |
| Quên cả vế "thấy được": `if trong_tam:` | `wrong_branch` | K3, dòng 4 | 14 | 2 |
| Bỏ vế lệnh xuất kích: `elif den_pha:` | `wrong_branch` | K2, dòng 4 | 14 | 2 |
| Đảo thứ tự `elif` dòng 4 (`CHO` trước `NAP`) | `wrong_branch` | P1, dòng 4 | 14 | 0 |
| Dòng 4 thành hai `if` rời, in trong từng `if` | `output_extra` | P1, dòng 5 | 14 | 0 |
| Quên `not` (`if ma_lenh:` mà in `KHONG CO`) | `wrong_branch` | P1, dòng 3 | 13 | 0 |
| Liệt kê mã lệnh đã thấy (`VE TRAM`, `TUAN TRA`), còn lại coi là trống | `wrong_branch` | K1, dòng 3 | 14 | 2 |
| Sai hoa thường mã lệnh (`"Xuat kich"`) | `wrong_branch` | P1, dòng 3 | 14 | 0 |
| `else` của khối trong thụt ra ngoài (ghép nhầm với `if ma_lenh:`) | `wrong_branch` | P2, dòng 3 | 13 | 0 |
| Dòng in thụt vào khối `else` (code gốc) | `output_mismatch` | P1, dòng 3 | 14 | 0 |
| Quên đổi kiểu khoảng cách (code gốc) | `TypeError` | P1, dòng 11 | 3 | 0 |
| Lời nhắc trong `input("Khoang cach: ")` | `output_has_prompt` | P1, dòng 1 | 14 | 0 |
| Đọc kênh nhập ba lần | `EOFError` | P1, dòng đọc thứ ba | 3 | 0 |
| `=` thay `==` trong điều kiện | `SyntaxError` | dòng của điều kiện | | 0 |
| Thiếu `:` | `SyntaxError` | dòng thiếu `:` | | 0 |
| Thân nhánh không thụt lề | `IndentationError` | dòng thân nhánh | | 0 |

Không đột biến nào được 3 sao. Viết cứng được 0 sao. Sáu đột biến được 2 sao đều là lỗi biên hoặc thiếu một vế chỉ lộ khi luật khẩn cấp đổi dữ liệu; đúng vai trò của sao thứ ba.

**Biến thể đúng (không phải đột biến):** dòng 4 viết bằng hai `if` rời **gán đè theo thứ tự ngược** (`kai = "QUA"`, rồi `if` của `CHO`, rồi `if` của `NAP`, rồi in) cho đúng mọi pha, tối đa 16 câu, **3 sao**. Ngưỡng không chặn được nó mà vẫn giữ 17 cho kiểu "gán rồi in" (mục 8). Đây là cách viết đúng có chủ ý, không phải lỗi "tách `elif`" (lỗi đó in thừa dòng và 0 sao như bảng trên). Tổng kết kiến thức nói rõ vì sao `elif` gọn hơn.

## 7. Lời giải tham khảo

### 7.1. Ba sao, in trong từng nhánh (tham khảo, dùng để chốt ngưỡng)

```python
khoang_cach = int(input())
ma_lenh = input()

trong_tam = khoang_cach <= tam_quet
print(f"TRONG TAM: {trong_tam}")

if khoang_cach < 20:
    print("MUC: BAO DONG")
elif khoang_cach < 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 100:
    print("MUC: CANH GIAC")
else:
    print("MUC: AN TOAN")

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH DRONE: XUAT KICH")
    else:
        print("LENH DRONE: CHO LENH")
else:
    print("LENH DRONE: KHONG CO")

if trong_tam and (camera_bat or den_pha):
    print("KAI: NAP")
elif den_pha or ma_lenh == "XUAT KICH":
    print("KAI: CHO")
else:
    print("KAI: QUA")
```

(Đặt sau 6 dòng đầu của code khởi đầu; dòng 7–8 thay bằng hai dòng đọc kênh nhập ở trên.)

### 7.2. Ba sao, đường người chơi sẽ đi

Code khởi đầu sửa đủ năm chỗ ở mục 3.1: dòng 7 `int(input())`, dòng 11 `<=`, thang xếp `< 20`, `< 50`, `< 100` (dòng 15–20), dòng 32 bỏ thụt lề, dòng 35 thêm ngoặc. 13, 13, 13, 15 câu.

### 7.3. Hai sao

Như 7.2 nhưng giữ `trong_tam = khoang_cach < tam_quet`. Qua bốn pha (tối đa 15 câu), trượt luật khẩn cấp 1 ở dòng 1.

### 7.4. Các kiểu viết khác đã đo

| Kiểu | Câu P1–P4 | Sao |
|---|---|---|
| In trong từng nhánh (7.1) | 12, 12, 12, 14 | 3 |
| Không dùng biến `trong_tam`, viết thẳng so sánh ở dòng 1 và dòng 4 | 11, 11, 11, 13 | 3 |
| Gán biến trong từng nhánh rồi in một lần ở mỗi khối (`muc`, `lenh_drone`, `kai`) | 15, 15, 15, **17** | 3 |
| Code khởi đầu sửa hết (7.2; khối 3 gán rồi in) | 13, 13, 13, 15 | 3 |
| Dòng 4 lồng: `if trong_tam:` bọc một `if/elif/else` | 13, 13, 12, 14 | 3 |
| `if not ma_lenh:` / `elif` / `else` cho dòng 3 | 12, 12, 12, 14 | 3 |
| `float(input())` thay `int(input())` | 12, 12, 12, 14 | 3 |
| Biểu thức `a if c else b` (chưa dạy) | 8, 9, 7, 9 | 3 |

Với các kiểu viết bằng `if/elif/else` ở bảng trên, số câu lớn nhất rơi vào pha 4 (khoảng cách 150, có mã lệnh, `QUA`): nhánh dài nhất của cả ba khối cùng chạy. Đột biến tách thang thành `if` rời gán đè đắt nhất ở pha 3 (khoảng cách 15: cả ba `if` cùng đúng), nên dữ liệu đặt pha 3 có nhánh dài ở dòng 3, 4 để đột biến đó vượt ngưỡng ngay cả khi phần khác in gọn.

Lời giải 3 sao và 2 sao, code khởi đầu và mọi dòng bảng đột biến là file trong `tests/fixtures/solutions/2.7/`; test tích hợp `tests/integration/level-2-7.test.ts` chạy chúng qua harness, kiểm khóa, sao, số câu, `round`, `out_line` (hợp đồng mục 4).

## 8. Ngưỡng cảnh báo

`alert_limit_statements`: **17**. 100% là 42 câu.

Bảng số câu theo pha (tối đa của lượt = số lớn nhất trên bốn pha cơ bản; phản công không tính):

| Lời giải | P1 | P2 | P3 | P4 | Tối đa | Sao |
|---|---|---|---|---|---|---|
| Tham khảo, in trong nhánh | 12 | 12 | 12 | 14 | 14 | 3 |
| Gán rồi in | 15 | 15 | 15 | 17 | 17 | 3 |
| Code khởi đầu sửa hết | 13 | 13 | 13 | 15 | 15 | 3 |
| Hai sao (7.3) | 13 | 13 | 13 | 15 | 15 | 2 |
| Thang `if` rời gán đè, phần khác in | 16 | 14 | 18 | 15 | 18 | 1 |
| Thang `if` rời gán đè, gán ở mọi khối | 18 | 16 | 20 | 17 | 20 | 1 |
| Dòng 4 `if` rời gán đè (biến thể đúng) | 16 | 16 | 14 | 15 | 16 | 3 |
| `a if c else b` | 8 | 9 | 7 | 9 | 9 | 3 |

Vì sao 17 mà không 14 như phác thảo: hợp đồng mục 3 lấy ngưỡng từ lời giải tham khảo, và báo cáo validate (điều chỉnh 1) đòi ngưỡng không phạt kiểu "gán biến rồi in một lần" nếu ngưỡng đó vẫn phân biệt được lối viết sai mà màn muốn dạy. Ở 17, lối sai của 2.4 (thang tách `if` rời gán đè) vẫn chỉ được 1 sao (18–20 câu). Ngưỡng 14 sẽ đẩy cả lời giải gán rồi in và đường sửa code khởi đầu (15) xuống 1 sao, tức là phạt chính bản nháp mà màn đưa cho người chơi.

## 9. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants`, `counter_attack_banner` (D1, `level:2.7`).

**Gợi ý** (Boss vẫn 3 mức, không đưa code đáp án):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Mỗi khối là một luật Kai đã dựng ở một chặng; lỗi của khối nào cũng là lỗi đã gặp ở chặng đó. Đọc terminal theo pha, sửa lỗi đầu tiên rồi chạy lại. Dòng mờ trong editor là dòng không chạy ở pha đang hiện |
| 2 (`hints[1]`) | Bốn khối, mỗi khối một câu hỏi tự kiểm, không đưa code: kênh nhập trả về kiểu gì; khoảng cách đúng bằng tầm quét thì có tính là trong tầm không; thang xét mức nào trước; dòng in nằm trong khối nào và có chạy ở mọi trường hợp không; khi luật nấp và luật chờ cùng đúng thì luật nào thắng; trong một điều kiện có cả "và" lẫn "hoặc", phần nào được tính trước |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": trang ôn một màn hình, mỗi khái niệm Chương 2 một ví dụ ngắn khác đáp án (so sánh ở điểm bằng, `if/elif/else` và thứ tự, khối lồng, chuỗi rỗng là sai, `and`/`or`/`not` với ngoặc, đổi kiểu trước khi so sánh) |

**Phản ứng miễn phí:** giọng truyện, cụt, căng hơn mọi màn trước của chương; từ ngữ của tháp, pha, đèn, luật, drone. Dùng `{round}` (pha sai đầu tiên), `{out_line}`, `{col}`, `{line}`.

**Luật chỗ giữ `{round}`:** `details.round` chỉ có khi lượt cơ bản trượt. `wrong_branch` cũng bắn ở luật khẩn cấp (đường 2 sao, mục 3.1 lượt 5), khi đó không có `round`. Vì vậy câu `wrong_branch` (và các biến thể của nó) **không** dùng `{round}`; chỉ dùng `{out_line}`. Các khóa của lượt phản công và `alert_exceeded`, `three_stars` cũng không dùng `{round}`.

| Khóa | Ý đồ |
|---|---|
| `entry` | Trạm Sentinel; đợt quét lớn đã tới; bốn pha. Một câu, lạnh, không an ủi |
| `TypeError` (code gốc) | Ở pha `{round}`, dòng `{line}`: tháp so một thứ đọc từ kênh nhập với một con số; hỏi thứ đó đang mang kiểu gì |
| `wrong_branch` | Mã đã chạy đúng một nhánh có thật, nhưng là nhánh của một tình huống khác; dòng `{out_line}` ra quyết định của lúc khác. Gợi người chơi nhìn dòng mờ trong editor. Không nói nhánh nào, không dùng `{round}` |
| `output_mismatch` | Pha `{round}`, dòng `{out_line}`, lệch từ ký tự thứ `{col}`. Nếu là lượt 3 (dòng 3 nhận dòng của Kai) câu chung vẫn đúng: một dòng không in, các dòng sau dồn lên |
| `output_missing` | Pha `{round}`: tháp đợi dòng `{out_line}` mà không thấy; có một dòng in không chạy ở pha này |
| `output_extra` | Pha `{round}`: tháp nhận nhiều dòng hơn bốn; có hai nhánh cùng in |
| `output_case_only` | Pha `{round}`, dòng `{out_line}`: chữ đúng, sai hoa thường |
| `output_has_prompt` | Lời nhắc đã đi ra cùng dòng đầu tiên; tháp không hỏi gì cả |
| `EOFError` | Kênh nhập mỗi pha chỉ có hai dòng; mã đọc nhiều hơn thế |
| `ValueError` | Pha `{round}`, dòng `{line}`: một dòng kênh nhập không đổi được thành số (ví dụ đọc ngược thứ tự hai dòng) |
| `NameError`, `SyntaxError`, `IndentationError`, `runtime_error` | Theo khuôn chương 1 và 2.2, thêm số pha khi có |
| `wrong_value_counter` | Luật khẩn cấp: dữ liệu mới nằm đúng ở chỗ hai luật giáp nhau; dòng `{out_line}` vẫn chạy như dữ liệu cũ. Không `{round}` |
| `counter_error`, `counter_timeout` | Mã lỗi hoặc treo khi tháp đổi luật |
| `alert_exceeded` | Qua bốn pha nhưng kiểm quá nhiều lần; mỗi lần kiểm là một lần drone có thể nghe thấy |
| `three_stars` | Tháp đổi luật, bộ luật né vẫn đứng. ECHO không khen, chỉ ghi nhận rồi nói về lõi luật phía trên |
| `repeated_fail` | Trỏ về gợi ý mức tiếp theo |
| `generic` | Câu chung, bắt buộc |

`reaction_variants` cho `wrong_branch` (khóa lặp nhiều nhất: ba trong sáu lượt của đường sửa), `output_mismatch`, `wrong_value_counter`.

`counter_attack_banner`: luật khẩn cấp của tháp, dữ liệu mới đúng ở ranh giới các luật (ý: "OMNI đổi luật tuần tra"; không nêu giá trị).

**Từ cấm của 2.7** (`forbidden_terms`, cộng danh sách chung `int`/`float`/`round` và mọi dòng `expected_output`; hints được miễn):

- từ khóa và ký hiệu: `if`, `elif`, `else`, `and`, `or`, `not`, `input`, `print`, `==`, `!=`, `<=`, `>=`, `<`, `>`;
- cụm nói thẳng cách sửa: `lớn hơn hoặc bằng`, `nhỏ hơn hoặc bằng`, `không vượt`, `đảo thứ tự`, `xếp ngược`, `thứ tự ưu tiên`, `ngoặc`, `thụt lề`, `thụt vào`, `dấu hai chấm`, `đổi kiểu`, `ép kiểu`, `chuyển kiểu`;
- tên biến: `tam_quet`, `camera_bat`, `den_pha`, `khoang_cach`, `ma_lenh`, `trong_tam`, `lenh_drone`;
- giá trị: `True`, `False`, `NAP`, `BAO DONG`, `NGUY HIEM`, `CANH GIAC`, `AN TOAN`, `XUAT KICH`, `CHO LENH`, `KHONG CO`, `VE TRAM`, `TUAN TRA`;
- số: `12`, `15`, `20`, `35`, `40`, `50`, `60`, `75`, `80`, `100`, `120`, `150`.

Không cấm `CHO`, `QUA` (trùng chữ thường "cho", "qua" trong câu tiếng Việt; khớp không phân biệt hoa thường sẽ chặn gần như mọi câu). Người rà câu tự kiểm hai từ này. Không cấm "nhánh", "điều kiện", "tình huống", "pha", "luật" (hợp đồng mục 5.2). Dòng `expected_output` không có cụm chữ số nào, nên luật số tự động của `chapter >= 2` không thêm gì; các số trên là dữ liệu tình huống.

## 10. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Bốn pha đều đạt bốn dòng, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 17 câu lệnh ở pha nhiều câu lệnh nhất |
| ⭐⭐⭐ | Thêm: qua ba tình huống luật khẩn cấp |
| 0 sao | Trên 42 câu lệnh |

Không đổi `compute-stars.ts`.

## 11. Người chơi lần lượt làm gì

1. Vào màn từ `after-2.6` (bảng lệnh vừa ra lệnh xuất kích, đợt quét lớn dời sớm). Briefing gõ chữ, bốn mục tiêu khóa vào lần lượt, ECHO nói `entry`.
2. **Lượt 1:** pha 1 lỗi `TypeError` ở dòng 11, chưa dòng nào in. ECHO nói `TypeError` kèm pha 1.
3. **Đổi kiểu khoảng cách** → pha 1 sai dòng 2 (`wrong_branch`). Người chơi nhớ 2.4: mức hẹp phải xét trước.
4. **Xếp lại thang** → pha 1 sai dòng 3; editor làm mờ dòng 32. Người chơi nhớ 2.3: dòng sau khối phải ra ngoài khối.
5. **Kéo dòng in ra** → pha 1, 2 qua; pha 3 sai dòng 4 (`wrong_branch`, đèn pha bật mà Kai ở ngoài tầm). Người chơi nhớ 2.5: `and` tính trước `or`.
6. **Thêm ngoặc** → bốn pha đạt, 15 câu, 2 sao; luật khẩn cấp 1 sai dòng 1 (khoảng cách bằng đúng tầm quét). Người chơi nhớ 2.1.
7. **`<=`** → 3 sao. Hộp kết quả không có dòng "Đã thu" (Boss không thêm luật).
8. TIẾP TỤC → Tổng kết Chương 2 (`#/learn/2.7`) → `after-2.7` → `teaser-2` → Bản đồ Chương 2.

## 12. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `outro_beats` (D1, `level:2.7`). 2.7 không có `component` (ô thứ 7 nằm ngoài 6 ô, engine bỏ thẻ thành phần). `scene`: `tram-sentinel`.

- `outro`: đợt quét lớn quét qua chỗ Kai nấp mà đèn không dừng lại; drone lần lượt bay về trạm sạc; Kai vào chân tháp, tới cửa lõi luật. Không có ai trực: tháp chưa từng cần người.
- `lore_fragment` (**KTS-02**, mảnh thứ ba): KTS-02 giấu mảnh "Quyết định" trong một nhánh mà OMNI không bao giờ chọn, vì điều kiện để vào nhánh đó là một quyết định do con người tự đưa ra. Giọng nhật ký kỹ thuật, bình thản. Không nói KTS-02 còn sống hay không, không nhắc KTS-0█.
- `outro_beats`, năm nhịp:

| # | `kind` | `backdrop` | `cue` | `fx` | Ý đồ |
|---|---|---|---|---|---|
| 1 | `log` | `tram-sentinel` | `terminal_line` | `focus` | Lõi luật mở bảng luật của tháp. Có một nhánh mà bộ đếm ghi số lần chạy bằng 0 kể từ ngày tháp được dựng. Nhánh đó mở ra khi Kai đứng trước nó (nối với dòng mờ "không chạy" mà người chơi đã quen) |
| 2 | `card` | `thanh-pho` | `pulse` | `fragment_found` | Thẻ "MẢNH THUẬT TOÁN 2/8 · QUYẾT ĐỊNH". Engine sáng hai mảnh đầu |
| 3 | `card` | `tram-sentinel` | `glitch` | `signal_0xa7` | Tín hiệu 0xA7 chúc mừng, thân thiện quá mức như ở Chương 1; nói nó biết Kai sẽ qua được, "trước cả bạn". Không nói mảnh kế tiếp ở đâu (để cho `teaser-2`) |
| 4 | `echo` | | | `omni_layer` | ECHO xác nhận một sự kiện kiểm được: tín hiệu 0xA7 lần này phát ra từ chính tháp Sentinel, tức là từ trong mạng của OMNI. ECHO không suy đoán thêm |
| 5 | `kai` | | | | Kai cất mảnh, không trả lời 0xA7 |

`fxSupported` đã kiểm: `focus` có trên `tram-sentinel` (tháp, điểm 69, 16); `fragment_found` chỉ có trên nền thành phố (`thanh-pho`); `signal_0xa7`, `omni_layer` vẽ trên mọi nền. Khi phông mới của Chương 2 có (phase I), các nhịp này vẫn dùng `tram-sentinel`, vì đó đúng là nơi xảy ra.

Nhịp 4 phải qua `findEchoLeak` (từ cấm ở mục 9).

**Không được lộ:** 0xA7 là Kiến Trúc Sư hay là KTS-0█ (twist chương 3); OMNI làm đúng một đặc tả hay theo một mục tiêu (twist chương 6); ai tạo ra ECHO. Không nối 0xA7 với "lịch gốc của tám người" (2.5) trong cùng một câu.

### 12.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:2.7`). Giọng tổng kết kỹ thuật, không có ECHO. Đây là tổng kết **cả Chương 2**: mỗi mục một khái niệm, một ví dụ ngắn **khác đáp án** (chủ đề đời thường: điểm thi, nhiệt độ, vé xe…, không dùng khoảng cách, tầm quét, mã lệnh), không chép nguyên mục của các màn trước. Mọi `code` chạy sạch và in đúng `output` (`tests/integration/knowledge-summary.test.ts`).

| Mục | Ý chính |
|---|---|
| So sánh cho ra `True`/`False` | Sáu phép so sánh; `=` gán, `==` so; ở điểm bằng nhau `<` và `<=` khác nhau |
| `if` và khối lệnh | Khối là các dòng thụt lề dưới `if`; chỉ chạy khi điều kiện đúng |
| `else`; dòng sau khối | `else` phủ đúng phần còn lại; dòng không thụt lề sau khối luôn chạy |
| `elif` và thứ tự | Chỉ nhánh đúng đầu tiên chạy; điều kiện hẹp đứng trước |
| `and`, `or`, `not` | `and` được tính trước `or`; dùng ngoặc khi muốn khác đi |
| Điều kiện lồng; chuỗi rỗng | `if` trong khối của `if`; `""` được coi là sai, `" "` thì không. Có `stdin` (ví dụ đọc một dòng có thể trống) |
| Dữ liệu từ kênh nhập | `input()` luôn trả chữ; đổi sang số trước khi so sánh với số |
| Thử ở điểm biên | Khi viết một điều kiện, thử giá trị đúng bằng ngưỡng và hai bên ngưỡng |

`mistakes`: một lỗi tiêu biểu cho mỗi chặng, lấy từ chính bản nháp của Boss và các màn trước: so chữ với số (`TypeError`, dòng 11 của bản nháp), `<` ở điểm bằng, thang xếp ngược, dòng in nằm trong khối `else`, thiếu ngoặc trong điều kiện ghép, `=` thay `==` (`SyntaxError`), thân `if` không thụt lề (`IndentationError`). `error` ghi đúng chữ Python in ra hoặc kết quả sai thật, đo bằng python3.

`next`: báo trước Chương 3 "Mê cung Máy chủ": các hành lang quét lặp lại không dứt, cần vòng lặp. Không dạy vòng lặp.

## 13. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | Pha 1, `TypeError` dòng 11; `rounds` có 4 phần tử, `rounds[0]` chưa dòng nào in; `details.round` = 1 | **Có** |
| Đi đường sửa mục 3.1 | Khóa, `round`, `out_line`, số câu đúng từng lượt | **Có** (mỗi lượt một fixture) |
| Lời giải 2 sao | Bốn pha đạt, 15 câu, `wrong_branch` ở luật khẩn cấp 1 (không có `round`) | **Có** |
| Lời giải 3 sao (7.1, 7.2, gán rồi in) | 3 sao; 14, 15, 17 câu | **Có** |
| Mọi dòng bảng đột biến (mục 6.3) | Đúng khóa, sao, pha/dòng | **Có** |
| Biến thể dòng 4 `if` rời gán đè | 3 sao, 16 câu | **Có** (để ngưỡng không bị hạ mà không ai biết) |
| `skipped_lines` lượt 3, pha 1 | Có dòng 32 | **Có** |
| Level thiếu câu `wrong_branch` | Lượt 2 ra `output_mismatch`, lượt 5 ra `wrong_value_counter` | Thuộc test hạ tầng H4 |
| `float(input())` | 3 sao (so sánh số thực với số nguyên đúng) | Không |
| Đọc ngược thứ tự hai dòng kênh nhập | `ValueError` ở pha 1 | Không |
| Mã lệnh viết thường `"xuat kich"` | Sai ở pha 1 dòng 3 (giống dòng "sai hoa thường") | Không |
| `patrol-timeline` cho Boss: dòng 4 đúng mà dòng khác sai; thiếu dòng làm dồn; phản công bị cắt | Mục 5.1 | **Có** (`patrol-timeline.test.ts`, nhánh H6, dùng level giả) |
| Câu ECHO trong `reactions`, `reaction_variants`, nhịp `echo` | Không chứa từ cấm, dòng mong đợi; không `{round}` ở khóa có thể bắn ở phản công | **Có** (validator) |
| Đi trọn đường: code gốc → 3 sao → Tổng kết → `after-2.7` → `teaser-2` → Bản đồ Chương 2 | e2e `tests/e2e/level-2-7.spec.ts` | **Có** (viết, chạy khi được yêu cầu) |

## 14. Dữ liệu level

`src/levels/level-2-7.json`:

- `id` `"2.7"`, `chapter` 2, `title` "Trạm Sentinel", `difficulty` `"boss"`;
- `concepts`: `comparison`, `if`, `else`, `elif`, `boolean_operators`, `nested_if`, `input`, `type_conversion` (tên khái niệm theo cách các màn 2.1–2.6 đặt; phase I thống nhất);
- `simulation`: `{"kind": "patrol", "decision": {"line": 4}}`;
- `starter_code` như mục 3; `locked_lines` `[2, 3, 4]`; `inputs` `["tam_quet", "camera_bat", "den_pha"]`;
- 4 mục tiêu `output_line` (dòng 1–4);
- `alert_limit_statements` 17; `float_abs_tolerance` 1e-9;
- `tests` (4) và `counter_attack_tests` (3) như mục 6.1, mỗi test có `stdin` 2 dòng và `expected_output` 4 dòng;
- `forbidden_terms` như mục 9; `scene` `"tram-sentinel"`; `outro_beats` như mục 12 (chỉ `kind`, `cue`, `backdrop`, `fx`); không có `component`.

Câu chữ ở D1 (tài liệu `level:2.7`, migration `0017`): `location`, `briefing`, `task_steps`, `objectives[].label`, `hints`, `reactions`, `reaction_variants`, `counter_attack_banner`, `outro`, `lore_fragment`, `outro_beats[].text`, `knowledge_summary`.

## 15. Tiêu chí chấp nhận

1. Code khởi đầu ra đúng chuỗi khóa mục 3.1 (6 lượt), qua harness thật trong `level-2-7.test.ts`.
2. Lời giải 2 sao: 2 sao, tối đa 15 câu, `wrong_branch` ở luật khẩn cấp 1. Lời giải 3 sao: 3 sao ở cả ba kiểu (14, 15, 17 câu).
3. Mọi dòng bảng đột biến cho đúng khóa và số sao; không dòng nào 3 sao; viết cứng 0 sao.
4. Bảng phủ nhánh đúng với dữ liệu JSON (mỗi nhánh của dòng 2, 3, 4 có một pha cơ bản).
5. `validateLevelText` qua: không câu ECHO nào chứa từ cấm, dòng mong đợi, hay `{round}` ở khóa có thể bắn ngoài lượt cơ bản.
6. `knowledge_summary` chạy sạch, khác đáp án.
7. `after-2.7` có năm nhịp mục 12, thẻ mảnh trên `thanh-pho` với `fragment_found`; không có thẻ thành phần.
8. Không câu nào lộ twist chương 3 hay 6 (người rà truyện kiểm theo mục 12).
9. `npm run typecheck`, `npm test`, `npm run test:py`, `npm run build` qua; e2e được viết.

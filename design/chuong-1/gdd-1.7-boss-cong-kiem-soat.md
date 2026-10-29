# Level 1.7 – BOSS "Cổng Kiểm Soát"

> Chương 1 – Vùng Tối · Độ khó: Boss · Khái niệm: tổng hợp Chương 1 (`print`, biến, bốn kiểu và `type()`, ép kiểu, toán tử, `input()`, f-string)
> Câu đố: `src/levels/level-1-7.json` (chưa dựng). Câu chữ người chơi đọc: tài liệu `level:1.7` ở D1 (câu ban đầu sẽ vào `db/migrations/0007_content_level_1_7.sql`) và đoạn hết chương ở `teaser[].text` của `chapter:1` (vá bằng `db/migrations/0008_content_chapter_1_het_chuong.sql`); GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 6.5. Brainstorm: `design/quyet-dinh/level-1-7-boss-cong-kiem-soat.md`. Hợp đồng engine (kênh nhập, nhiều vòng, kết chương): `docs/hop-dong-engine-level-1-5-den-1-7.md`.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:1.7`).

Briefing là nhật ký của Cổng Kiểm Soát, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- Cổng Kiểm Soát là lối ra cuối cùng của Vùng Tối; mỗi tín hiệu phải qua **ba vòng quét liên tiếp**, mỗi vòng cổng nạp dữ liệu phiên khác và gửi hai câu hỏi mới qua kênh nhập; trượt một vòng là cả lượt bị bác;
- Neural-ID phát sáu dòng, mỗi dòng là một thành phần Kai đã dựng ở sáu trạm trước (ô Mục tiêu ghi luật từng dòng);
- gói nào qua đủ ba vòng sẽ bị người trực ca đêm kiểm tay; mã người trực là NX-0417 (người chơi biết đó là Nhi; briefing không nói tên Nhi).

Briefing không nêu tên hàm nào.

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên Cổng Kiểm Soát.

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:1.7`) (4 bước). Không chứa dòng đầu ra mong đợi. Bốn bước lần lượt nói:

1. bản nháp của Kai có sáu lệnh in, mỗi lệnh là một thành phần; chạy trước, đọc terminal xem vòng nào, dòng nào vỡ; không sửa dòng khóa;
2. sửa từng dòng cho khớp luật ở ô Mục tiêu; mỗi vòng cổng đổi dữ liệu phiên và câu hỏi, nên đừng chép tay thứ gì cổng gửi;
3. lượt chỉ đạt khi qua đủ ba vòng liên tiếp;
4. xong khi cả 6 mục tiêu chuyển xanh ở cả ba vòng; không quá 9 câu lệnh và qua lượt kiểm tay thì được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (6 dòng đầu ra, mỗi dòng ghi tên thành phần); khung chat ECHO | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng Cổng Kiểm Soát (mục 5) |

Sáu mục tiêu làm cột Nhiệm vụ dài; cột tự cuộn, ô Nhiệm vụ tự gập sau lượt chạy đầu (luật có sẵn).

## 3. Code khởi đầu (có lỗi cài sẵn)

Bản nháp Kai ghép vội từ sáu trạm. Mỗi dòng in mang lại đúng một lỗi của một level trước, trừ dòng tiêu đề làm mốc.

```python
# Dữ liệu phiên cổng nạp mỗi vòng quét (KHÔNG được sửa 4 dòng này)
ho_ten = "ĐỖ MINH AN"
ma_khu = "K-07"
ma_phien = 4096
chieu_cao = "1.72"

# Cổng hỏi qua kênh nhập: dòng 1 là mã hỏi, dòng 2 là mức năng lượng
ma_hoi = input()
muc = input()

print("NID/2089")
print("HO SO: {ho_ten} / {ma_khu}")
print("KHUON:", "<class 'int'>")
print(f"SINH TRAC: {chieu_cao * 2}")
print(f"NANG LUONG: {muc / 100} PIN + {muc % 100}")
print(f"LOI DAP: {ma_hoi + 7}")
```

| Dòng | Thành phần | Lỗi cài sẵn (level gốc) | Vỡ ở đâu |
|---|---|---|---|
| 11 | Tiêu đề tín hiệu | Không lỗi (mốc, 1.1) | – |
| 12 | Hồ sơ danh tính | Thiếu `f`, in tên ô nhớ thay giá trị (1.2 + 1.6) | Vòng 1, vị trí 8 |
| 13 | Khuôn kiểu | Chép tay khuôn thay vì hỏi `type()` (1.3) | Vòng 2 (mã phiên đổi kiểu) |
| 14 | Dữ liệu sinh trắc | Nhân chữ, chưa đổi kiểu, chưa làm tròn (1.4) | Vòng 1, `1.721.72` |
| 15 | Năng lượng tín hiệu | Chia chữ cho số, và `/` thay phép chia lấy phần nguyên (1.5 + 1.6) | Vòng 1, `TypeError` |
| 16 | Lời đáp xác thực | Cộng chữ với số (1.6) | (sau khi sửa dòng 15) `TypeError` |

Lượt 1: dòng 11 phát, dòng 12 lệch, dòng 13 qua (vòng 1 trùng kiểu), dòng 14 lệch, dòng 15 vỡ `TypeError`. Ba dòng đầu cho người chơi thấy ngay "dòng nào đã ổn", dòng 13 là cái bẫy chỉ lộ ở vòng 2.

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:1.7`): mỗi nhãn mở bằng tên thành phần, rồi luật dựng dòng bằng lời; không ghi giá trị của vòng nào.

Đầu ra mong đợi của vòng 1 (đặc tả):

| Dòng | Luật | Vòng 1 |
|---|---|---|
| 1 | Tiêu đề cố định | `NID/2089` |
| 2 | `HO SO: ` họ tên ` / ` mã khu | `HO SO: ĐỖ MINH AN / K-07` |
| 3 | `KHUON: ` rồi khuôn (kiểu) của mã phiên, như `print` in ra | `KHUON: <class 'int'>` |
| 4 | `SINH TRAC: ` chiều cao × 2, làm tròn 2 chữ số | `SINH TRAC: 3.44` |
| 5 | `NANG LUONG: ` số pin đầy (pin chuẩn 100 đơn vị) ` PIN + ` phần lẻ | `NANG LUONG: 8 PIN + 28` |
| 6 | `LOI DAP: ` mã hỏi cộng 7 | `LOI DAP: 4179` |

- Ba vòng phải đạt liên tiếp. Không dòng thừa, chạy hết không lỗi.
- **Mức cảnh báo ≤ 40%** (≤ 9 câu lệnh; 100% = 22). Tính theo vòng nhiều câu lệnh nhất.

## 5. Diễn biến khi chạy (mô phỏng Cổng Kiểm Soát)

**Cảnh (SVG/CSS, `"simulation": {"kind": "checkpoint"}`):** cổng vòm lớn ở giữa với ba vòng quét đồng tâm; dưới cổng là thanh Neural-ID giả sáu ô (cùng hình với thanh ở bản đồ, ô ghi tên thành phần); bên cạnh là danh sách sáu dòng dùng chung với relay; góc phải là buồng trực tối đèn, có bóng người.

- Vòng quét n sáng lên, chip dữ liệu phiên của vòng hiện dưới cổng (`ma_phien = "7351"`, kênh nhập `"9035", "1500"`), sáu dòng chạy qua lần lượt: dòng đúng thì ô thành phần tương ứng sáng (`scan_pass`), dòng sai thì ô đỏ, danh sách hiện `cần:`/`nhận:` (`scan_reject`).
- **Vòng đạt:** vòng quét khóa lại (`objective_lock`), sang vòng sau. **Vòng trượt:** cổng sập chắn, các vòng sau xám "CHƯA TỚI", nhãn "BÁC Ở VÒNG n". Mô phỏng đọc `rounds` của `RunOutcome`.
- **Lỗi lúc chạy:** ô của dòng lỗi đỏ với nhãn lỗi, như relay. **Lỗi cú pháp:** không vòng nào sáng.
- **Đạt ba vòng:** cổng mở một nửa, "CỔNG MỞ MỘT NỬA". Cue `gate_open`.
- **Phản công = kiểm tay của NX-0417:** `counter_attack_banner`, đèn buồng trực bật, bóng người đứng dậy; dữ liệu kiểm tay hiện (mã phiên mang kiểu thứ năm, mức năng lượng có phần thập phân, mã khu khác); sáu dòng chạy lại một lần nữa. Qua: cổng mở hẳn, cả sáu ô sáng trắng, "CỔNG MỞ HOÀN TOÀN", `gate_open` rồi `star`. Không vẽ mặt Nhi; đoạn truyện sau màn lo phần đó.
- Đèn SENTINEL, giảm chuyển động (hiện thẳng khung cuối của từng vòng), Esc, `aria-live` ("Vòng 1 đạt. Vòng 2 bác ở dòng 3. Cổng đóng."), điện thoại theo khuôn chung.

**Terminal** (lượt 1, ví dụ):

```
> LƯỢT CHẠY #1: đi qua Cổng Kiểm Soát
> VÒNG QUÉT 1/3 · ma_phien = 4096 · kênh nhập: "4172", "828"
> CỔNG NHẬN: dòng 1 · NID/2089
> CỔNG BÁC: dòng 2 · sai ở vị trí 8
    cần:  HO·SO:·ĐỖ·MINH·AN·/·K-07
    nhận: HO·SO:·{ho_ten}·/·{ma_khu}
> CỔNG NHẬN: dòng 3 · KHUON: <class 'int'>
> CỔNG BÁC: dòng 4 · sai ở vị trí 12
> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP
> TRUY VẾT: dòng 15 — TypeError: unsupported operand type(s) for /: 'str' and 'int'
> CỔNG: ĐÓNG
```

## 6. Ba vòng quét và lượt kiểm tay

| | `ma_khu` | `ma_phien` | `chieu_cao` | Kênh nhập | Bắt được |
|---|---|---|---|---|---|
| Vòng 1 | `"K-07"` | `4096` | `"1.72"` | `"4172"`, `"828"` | Mọi lỗi tĩnh của bản nháp |
| Vòng 2 | `"K-07"` | `"7351"` | `"1.80"` | `"9035"`, `"1500"` | Khuôn chép tay; mọi dòng viết cứng của vòng 1 |
| Vòng 3 | `"K-07"` | `2.5` | `"1.653"` | `"0815"`, `"1234"` | Quên làm tròn (`3.306`); mã hỏi có số 0 đứng đầu (`int` bỏ nó: lời đáp 822) |
| Kiểm tay (phản công) | `"K-12"` | `True` | `"1.5"` | `" 4172"`, `"1500.0"` | Mức năng lượng có phần thập phân: `int("1500.0")` → `ValueError`, phải đổi qua `float` trước (bài 1.4); mã khu viết cứng |

Đầu ra mong đợi:

- Vòng 2: `NID/2089`, `HO SO: ĐỖ MINH AN / K-07`, `KHUON: <class 'str'>`, `SINH TRAC: 3.6`, `NANG LUONG: 15 PIN + 0`, `LOI DAP: 9042`.
- Vòng 3: `…`, `KHUON: <class 'float'>`, `SINH TRAC: 3.31`, `NANG LUONG: 12 PIN + 34`, `LOI DAP: 822`.
- Kiểm tay: `NID/2089`, `HO SO: ĐỖ MINH AN / K-12`, `KHUON: <class 'bool'>`, `SINH TRAC: 3.0`, `NANG LUONG: 15 PIN + 0`, `LOI DAP: 4179`.

Đã chạy thử bằng `python3` 3.13 ngày 28/10/2026: lời giải 3 sao cho đúng cả bốn bộ; lời giải 2 sao vỡ `ValueError` ở lượt kiểm tay; code khởi đầu vỡ `TypeError` ở dòng 15 cả bốn bộ.

## 7. Lời giải tham khảo

Đạt 2 sao (8 câu lệnh; qua ba vòng, vỡ ở lượt kiểm tay vì `int("1500.0")`):

```python
ma_hoi = int(input())
muc = int(input())

print("NID/2089")
print(f"HO SO: {ho_ten} / {ma_khu}")
print("KHUON:", type(ma_phien))
print(f"SINH TRAC: {round(float(chieu_cao) * 2, 2)}")
print(f"NANG LUONG: {muc // 100} PIN + {muc % 100}")
print(f"LOI DAP: {ma_hoi + 7}")
```

Đạt 3 sao: như trên với `muc = int(float(input()))`. `print(f"KHUON: {type(ma_phien)}")` cũng đạt.

## 8. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:1.7`).

**Gợi ý** (Boss vẫn 3 mức, không đưa đáp án):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Mỗi dòng in là một trạm đã qua; lỗi của dòng nào cũng là lỗi Kai từng gặp ở trạm đó. Đọc terminal theo vòng, sửa dòng vỡ đầu tiên rồi chạy lại |
| 2 (`hints[1]`) | Bảng sáu dòng: với mỗi dòng, một câu hỏi tự kiểm (thứ này cổng đổi giữa các vòng không? nó đến dưới kiểu nào? cần đổi kiểu trước khi tính không?), không đưa code |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": trang ôn tập một màn hình, mỗi khái niệm Chương 1 một ví dụ ngắn khác đáp án (f-string, `type()`, `int(float(…))`, `round`, `//` và `%`, `input()` luôn ra chữ) |

**Phản ứng miễn phí:** giọng cụt, căng hơn mọi level trước; từ ngữ của cổng, vòng quét, thành phần, người trực. Dùng chỗ giữ `{round}` (vòng sai đầu tiên) và `{out_line}`.

| Khóa | Ý đồ |
|---|---|
| `entry` | Cổng Kiểm Soát; ba vòng quét; người trực đêm nay là NX-0417. Một câu, lạnh, không an ủi |
| `TypeError` (code gốc) | Ở vòng `{round}`, một thành phần ép hai kiểu vào cùng phép tính; hỏi thành phần đó được dựng ở trạm nào |
| `output_is_label` | Cổng đọc được tên ô nhớ, không phải thứ trong ô |
| `output_mismatch` | Vòng `{round}`, dòng `{out_line}`, lệch từ ký tự thứ `{col}` |
| `output_missing`, `output_extra`, `output_has_prompt`, `EOFError`, `ValueError` | Theo khuôn 1.6, thêm số vòng |
| `wrong_value_counter` | Kiểm tay lệch: dữ liệu của người trực khác mọi vòng trước, dòng `{out_line}` vẫn viết cho vòng cũ |
| `counter_ValueError` | Người trực đưa một con số mang phần thập phân; dòng đổi kiểu vỡ |
| `counter_timeout` | Mã treo lúc kiểm tay |
| `alert_exceeded` | Qua ba vòng nhưng quá nhiều câu lệnh; Sentinel đã thấy |
| `three_stars` | Người trực nhìn tín hiệu lâu hơn bình thường, rồi đóng dấu. ECHO không bình luận gì thêm |

`reaction_variants` cho `output_mismatch`, `TypeError`, `wrong_value_counter`. Khóa `repeated_fail` của Boss chỉ về gợi ý mức tiếp theo.

**Từ cấm của 1.7** (`forbidden_terms`, cộng danh sách chung và mọi dòng `expected_output` của ba vòng và lượt kiểm tay): hợp các từ cấm của 1.3–1.6 có liên quan (tên hàm đổi kiểu, tên hàm đọc kênh nhập, f-string và "ngoặc nhọn", tên và ký hiệu toán tử giải bài, "làm tròn", các dấu nháy, "đổi kiểu", "ép kiểu", `type`), cùng mọi giá trị dữ liệu phiên. Tên thành phần và "kiểu" không bị cấm.

## 9. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Ba vòng quét đều đạt sáu dòng, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 9 câu lệnh ở vòng nhiều câu lệnh nhất |
| ⭐⭐⭐ | Thêm: qua lượt kiểm tay của NX-0417 |
| 0 sao | Trên 22 câu lệnh |

Không đổi `compute-stars.ts`.

## 10. Người chơi lần lượt làm gì

1. Vào màn từ đoạn `after-1.6` (0xA7 đang đợi trong cổng). Briefing gõ chữ, sáu mục tiêu khóa vào lần lượt (mỗi mục một tiếng, lâu hơn level thường), ECHO nói `entry`.
2. **Lượt 1:** vòng 1 vỡ `TypeError` ở dòng 15; dòng 1 và 3 sáng. ECHO nói `TypeError` kèm vòng 1.
3. **Sửa dần:** dòng 15 (đổi `muc` sang số, dùng `//`), dòng 16 (đổi `ma_hoi`), dòng 12 (thêm `f`), dòng 14 (đổi kiểu và làm tròn). Mỗi lần sửa, một ô thành phần nữa sáng ở vòng 1.
4. **Vòng 2 vỡ dòng 3**: khuôn chép tay. Người chơi nhớ lại 1.3: hỏi `type()` thay vì chép.
5. **Vòng 3 vỡ** nếu quên làm tròn (`3.306`). Ai đã làm tròn từ đầu (vì nhãn mục tiêu nói rõ) qua thẳng.
6. **Ba vòng đạt** → 2 sao (nếu ≤ 9 câu lệnh) → kiểm tay: `ValueError` vì `"1500.0"`. ECHO nói `counter_ValueError`.
7. **Đổi qua `float` trước** → 3 sao. Hộp kết quả không có dòng "Đã thu" (Boss không tạo thành phần mới).
8. TIẾP TỤC → Tổng kết Chương 1 → `after-1.7` → đoạn hết chương (`teaser`) → Bản đồ.

## 11. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `outro_beats` (D1, `level:1.7`). 1.7 không có `component` (ô thứ 7 nằm ngoài 6 ô, engine bỏ thẻ thành phần).

- `outro`: cổng mở; người trực ca đêm đóng dấu tay lên tín hiệu của ĐỖ MINH AN; dưới sàn cổng, một hộc kỹ thuật chỉ mở cho một Neural-ID có đủ sáu thành phần.
- `lore_fragment` (**KTS-05**, mảnh thứ hai; người thiết kế Neural-ID và người giấu mảnh "Định danh"): KTS-05 giấu mảnh ở nơi chỉ một danh tính được dựng bằng tay mới mở được, vì OMNI không bao giờ dựng thứ gì bằng tay. Nối mạch 1.2 (tái định hướng là gán lại, giá trị cũ không bị xóa ngay) bằng một câu hy vọng ngắn, không hứa.
- `outro_beats`, năm–sáu nhịp:
  1. kai: Nhi ngồi sau kính buồng trực, nhìn thẳng Kai qua màn hình kiểm; em không nhận ra anh.
  2. log: dấu duyệt của NX-0417 trễ hơn bình thường một nhịp (manh mối hy vọng nhỏ, khớp `three_stars`; không giải thích).
  3. card, `fx: "eight_fragments"`, cue `pulse`: MẢNH THUẬT TOÁN 1/8 · ĐỊNH DANH.
  4. card tín hiệu 0xA7, cue `glitch`: 0xA7 chúc mừng và nói nó đã đợi ở đây từ trước khi Kai tới. Thân thiện quá mức, như ở 1.4–1.6. Chưa nói mảnh kế tiếp ở đâu (để dành cho đoạn hết chương).
  5. echo: ECHO xác nhận tín hiệu 0xA7 phát ra từ chính hệ thống của cổng, tức là từ bên trong mạng của OMNI. ECHO không suy đoán thêm.
  6. kai (tùy chọn): Kai cất mảnh, không trả lời 0xA7.
- Sau đó là đoạn hết chương (mục 13).
- Không được lộ: 0xA7 là Kiến Trúc Sư (twist chương 3); ECHO do ai tạo hay OMNI chỉ làm đúng đặc tả (twist chương 6).

### 11.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:1.7`). Đây là tổng kết **cả Chương 1**: mỗi mục một khái niệm, một ví dụ ngắn khác đáp án (có `stdin` cho mục `input()`), không lặp nguyên mục của các màn trước.

| Mục | Ý chính |
|---|---|
| In và chuỗi | `print`, dấu phẩy, `+`, từng ký tự có nghĩa |
| Biến và gán lại | Tên giữ nguyên, giá trị đổi |
| Bốn kiểu và `type()` | `type()` cho biết kiểu thật; hỏi, đừng đoán |
| Đổi kiểu | `int`, `float`, `round`; `int(float("…"))` |
| Toán tử | `//`, `%`, `**`, thứ tự tính |
| Đọc và trả lời | `input()` ra chữ; f-string |
| Dữ liệu đổi thì mã vẫn đúng | Không chép tay giá trị; đọc từ tên, từ kênh nhập |

`mistakes`: một lỗi tiêu biểu mỗi màn, lấy từ chính bản nháp của Boss. `next` báo trước Chương 2: Trạm Sentinel, `if/elif/else`.

## 12. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | Vòng 1, `TypeError` dòng 15; `rounds[0]` có dòng 1, 3 đạt; `details.round` = 1 | **Có** |
| Lời giải 2 sao | Ba vòng đạt, 2 sao, `counter_ValueError` | **Có** |
| Lời giải 3 sao | 3 sao, 8 câu lệnh | **Có** |
| Khuôn chép tay, còn lại đúng | Vòng 2 bác ở dòng 3, `output_mismatch`, `{round}` = 2 | **Có** |
| Quên `round` | Vòng 3 bác ở dòng 4 | **Có** |
| Viết cứng mọi dòng theo vòng 1 | Vòng 2 bác ở dòng 3 | Không |
| `float(input())` cho mức năng lượng | Vòng 1 bác ở dòng 5 (`8.0 PIN + 28.0`) | Không |
| Đọc kênh nhập ba lần | `EOFError` ở vòng 1 | Không (đã test ở 1.6) |
| `rounds` khi level chỉ có 1 test | Không có trường `rounds` (1.1–1.6 không đổi) | **Có** |
| Timeline `checkpoint`: đạt, bác ở vòng 2, lỗi ở vòng 1, kiểm tay đạt/vỡ, giảm chuyển động | Khung hình đúng thứ tự, vòng sau vòng bác là "CHƯA TỚI" | **Có** (`checkpoint-timeline.test.ts`) |
| `after-1.7` dẫn vào `teaser`, rồi Bản đồ | Theo `progression.ts` hiện có | **Có** (một test `progression` với chương đủ 7 level) |
| Lời ECHO trong `reactions`, `outro_beats`, nhịp echo của `teaser` | Không chứa từ cấm, dòng mong đợi | **Có** |
| Đi trọn đường: code gốc → 3 sao → hết chương → Bản đồ 21 sao tối đa | e2e `level-1-7.spec.ts` | **Có** (viết, chạy khi được yêu cầu) |

## 13. Đoạn hết chương (`teaser` của `chapter:1`)

Câu chữ: `teaser[].text` (D1, `chapter:1`), thay câu "Còn tiếp" cũ bằng migration vá `0008`. Khung giữ nguyên 9 nhịp và `kind` (hợp đồng engine mục 6); `cue`, `backdrop`, `fx`, `hold_ms` sửa trong `src/story/chapter-1.json`.

| Nhịp | Kiểu | Ý đồ | Âm thanh, hiệu ứng |
|---|---|---|---|
| 1 | log, `thanh-pho` | Cổng Kiểm Soát đóng sau lưng Kai; lần đầu Kai đứng ngoài Vùng Tối | `gate_close_far` |
| 2 | echo | ECHO: Neural-ID giả đủ sáu thành phần, nhưng nó chỉ sống tới lần quét lớn kế tiếp | `fx: "id_bar"` (6 ô sáng) |
| 3 | log | Một mảnh trong tám đã về tay; bảy mảnh còn lại ở bảy nơi không ai biết | `fx: "eight_fragments"` |
| 4 | log | Phía trước là biên giới thành phố, Trạm Sentinel, drone tuần tra theo luật mà Kai chưa đọc được (báo trước Chương 2, không dạy `if`) | |
| 5 | card | Tín hiệu 0xA7 nhắc lại: mảnh thứ hai ở Trạm Sentinel, nó sẽ đợi | `glitch` |
| 6 | echo | ECHO khuyên Kai đừng đi theo lịch 0xA7 đặt ra; không giải thích | |
| 7 | log | Nhật ký ca trực của cổng: NX-0417 ghi một dòng thừa so với mẫu báo cáo | `scan_reject` |
| 8 | kai | Kai: một câu cho Nhi, rồi im lặng (`hold_ms` 2000) | |
| 9 | card | HẾT CHƯƠNG 1 · VÙNG TỐI; Chương 2: Trạm Sentinel, tín hiệu đang giải mã | `pulse` |

Sau nhịp 9 vẫn là nút **VỀ BẢN ĐỒ** và dòng mời chơi lại khi tổng sao chưa đủ (21). Nhãn đoạn ở danh sách xem lại đổi thành "Hết chương 1".

## 14. Dữ liệu level

Câu đố sẽ nằm ở `src/levels/level-1-7.json`: `inputs` `ho_ten`, `ma_khu`, `ma_phien`, `chieu_cao` (dòng 2–5, khối liền); ba `tests` và một `counter_attack_tests` như mục 6, mỗi test có `stdin` và `expected_output` 6 dòng; 6 mục tiêu `output_line`; `alert_limit_statements` 9; `simulation` `{"kind": "checkpoint"}`; không có `component`. Câu chữ ở D1 (tài liệu `level:1.7`, migration `0007`).

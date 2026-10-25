# Level 1.4 – "Tín hiệu lệch pha"

> Chương 1 – Vùng Tối · Độ khó: Medium · Khái niệm: ép kiểu
> Dữ liệu chơi: `src/levels/level-1-4.json`. Thiết kế tổng: `design/gdd.md`.

## 1. Briefing

> **[NHẬT KÝ HỆ THỐNG – CỔNG PHÍA BẮC]**
> Chip Neural-ID thu hồi từ một người đã chết. Dữ liệu còn đọc được… nhưng toàn bộ nằm dưới dạng chuỗi ký tự.
> Máy quét chỉ chấp nhận số. Gửi chuỗi vào máy quét sẽ kích hoạt báo động.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Mục tiêu + tiêu chí | Code editor | Mô phỏng cổng an ninh + máy quét |

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Dữ liệu đọc từ chip (KHÔNG được sửa 3 dòng này)
tuoi = "27"
chieu_cao = "1.72"
cap_do = "3"

# Mã xác thực = tuổi × 100 + cấp độ
ma_xac_thuc = tuoi * 100 + cap_do

# Chỉ số sinh học = chiều cao × 2, làm tròn 2 chữ số
chi_so = chieu_cao * 2

hop_le = "True"
```

## 4. Mục tiêu

- `ma_xac_thuc` kiểu `int`, giá trị đúng (với dữ liệu trên: **2703**)
- `chi_so` kiểu `float`, giá trị đúng (với dữ liệu trên: **3.44**)
- `hop_le` kiểu `bool`
- **Mức cảnh báo ≤ 40%** (≤ 8 câu lệnh thực thi, không tính 3 dòng khóa)

Nhãn trong ô Mục tiêu: "Mã xác thực = tuổi × 100 + cấp độ", "Chỉ số sinh học = chiều cao × 2, làm tròn 2 chữ số thập phân", "Cờ hợp lệ: giá trị đúng/sai, không phải chữ".

## 5. Diễn biến khi chạy

- 3 gói dữ liệu **vàng** (`str`) trượt về máy quét
- Với code gốc: code **chạy không lỗi**, vì `"27" * 100 + "3"` là phép nối chuỗi hợp lệ. `ma_xac_thuc` thành chuỗi 201 ký tự → gói vàng phình to → máy quét chuyển đỏ và báo sai hình dạng cho cả 3 biến. **Không có traceback** ở bước này; bài học là "chạy được chưa chắc đã đúng".
- Lỗi Python thật xuất hiện ở các bước sửa dở, ví dụ `int(tuoi) * 100 + cap_do` gây `TypeError` ở dòng 7 → traceback trong bối cảnh (`design/gdd.md` mục 4.2), dòng lỗi được tô trong editor.
- Với code đúng: gói dữ liệu đổi màu sang xanh/tím/đỏ → qua máy quét → cổng mở một nửa
- Dữ liệu đầu vào được engine nạp sẵn trước khi chạy; 3 dòng khóa chỉ để hiển thị. Nhờ vậy OMNI phản công thay được dữ liệu mà không sửa code người chơi.

## 6. Lời giải tham khảo (đạt 2 sao)

```python
ma_xac_thuc = int(tuoi) * 100 + int(cap_do)
chi_so = round(float(chieu_cao) * 2, 2)
hop_le = True
```

## 7. OMNI phản công (sao thứ 3)

```
> CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP
> tuoi = "31.0"   cap_do = "7"   chieu_cao = "1.653"
```

Bắt được hai lỗi phổ biến:
- **Viết cứng kết quả** (`ma_xac_thuc = 2703`) → sai vì dữ liệu đã đổi
- `int("31.0")` → `ValueError` → sinh viên phải nghĩ ra `int(float(tuoi))`
- **Quên làm tròn** (`chi_so = float(chieu_cao) * 2`): `1.653 × 2 = 3.306`, lệch 3.31 quá dung sai → trượt phản công, 2 sao. Dữ liệu cơ bản `1.72` vẫn cho `3.44` tròn nên lượt cơ bản không bắt được lỗi này (đổi từ `1.65` sang `1.653` ngày 25/10/2026 để mục tiêu "làm tròn 2 chữ số" được chấm thật)

Giá trị đúng với dữ liệu phản công: `ma_xac_thuc` = 3107, `chi_so` = 3.31, `hop_le` = True.

Lời giải đạt 3 sao:

```python
ma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))
chi_so = round(float(chieu_cao) * 2, 2)
hop_le = True
```

## 8. Gợi ý và phản ứng của ECHO

Gợi ý 3 mức (ECHO nói):

| Mức | Nội dung |
|---|---|
| 1 | "Nhìn mô phỏng sau khi chạy. Dữ liệu chip là chữ, kể cả khi trông như số. Nhân chữ với 100 không ra phép tính… Python chép chữ đó nối đuôi nhau 100 lần." |
| 2 | "Python có sẵn công cụ đổi hình dạng. Mỗi công cụ mang đúng tên hình dạng nó tạo ra, cũng là tên làn máy quét đòi. Đổi dữ liệu chip trước, rồi mới tính. Chip có thể ghi số kèm phần thập phân… nên thứ tự đổi cũng quan trọng." |
| 3 | Tài liệu `int()`, `float()`, `round()` với ví dụ khác |

Một số phản ứng miễn phí sau khi chạy (danh sách đầy đủ trong `src/levels/level-1-4.json`):

| Tình huống | ECHO nói |
|---|---|
| Vào màn | Kết nối… ổn định. Tôi là ECHO. Mô-đun viết mã của tôi đã cháy. Tôi chỉ còn đọc. Máy quét phía trước chỉ nhận số. |
| Sai kiểu (code gốc) | Máy quét từ chối {vars}. Sai hình dạng. Nó không đọc nội dung… chỉ đọc hình dạng. |
| Giá trị khớp, sai kiểu (ví dụ `2703.0`) | Con số của {vars} khớp. Hình dạng thì không. Với máy quét, đó vẫn là vật lạ. |
| Chữ bị nhân thành chuỗi lặp (khóa `string_repeated`, 25/10/2026) | Nhìn chữ số trong mô phỏng. Chúng bị chép nối đuôi nhau. Nhân chữ với một con số không ra phép tính… chỉ lặp chữ đó từng ấy lần. |
| `TypeError` | Dòng {line}. TypeError. Hai thứ khác hình dạng vừa bị ép vào cùng một phép toán. |
| Vượt ngưỡng cảnh báo | Qua máy quét. Nhưng {count} câu lệnh… Sentinel đã ghi nhận tín hiệu. Chạy gọn hơn. |
| Phản công gây `ValueError` | OMNI đổi định dạng chip. Dòng {line} vỡ: ValueError. Dữ liệu mới mang hình dạng bạn chưa lường. |
| Viết cứng đáp án, trượt phản công | OMNI đổi dữ liệu chip. Kết quả của bạn không đổi theo. Nó được viết cho một con chip đã chết. |
| Treo ở lượt phản công | OMNI đổi dữ liệu chip. Mã của bạn treo trên dữ liệu mới… Tôi cắt kết nối. Cổng chỉ mở một nửa. |
| Đạt 3 sao | Cổng mở hoàn toàn. OMNI đổi dữ liệu, mã vẫn đứng vững. …Tôi ghi nhận điều đó. |

`{vars}`, `{line}`, `{count}` được thay bằng giá trị thật của lần chạy.

Khóa `string_repeated` dùng khi dấu vết của một đầu vào dạng chữ bị viết liền hai lần (`2727`, `1.721.72`) xuất hiện ở: thông báo `ValueError` (ví dụ `float(chieu_cao * 2)`), **mọi** biến sai kiểu đều là chữ lặp (code gốc đã sửa `hop_le`), hoặc **mọi** biến sai giá trị đều mang chữ số lặp (`int(tuoi * 100 + cap_do)`). Code gốc vẫn nhận câu `type_mismatch` vì `hop_le = "True"` không phải chữ lặp. Câu không nhắc tên hàm chuyển đổi.

Câu thay thế khi cùng khóa lặp ở lượt kế tiếp (`reaction_variants`): `type_mismatch` → "{vars} vẫn sai hình dạng. Con số trông ra sao, máy quét mặc kệ… nó chỉ đọc hình dạng."; `string_repeated` → "Dữ liệu chip vẫn là chữ khi phép nhân chạy. Chữ nhân lên thì dài ra… không lớn lên."; `ValueError` → "Dòng {line}. Vẫn ValueError. Đọc phần cuối thông báo lỗi. Đó là thứ Python đang cố đổi hình dạng."

## 9. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Đúng kiểu, đúng giá trị |
| ⭐⭐ | Thêm: mức cảnh báo ≤ 40% |
| ⭐⭐⭐ | Thêm: vượt qua OMNI phản công |
| 0 sao | Vượt 100% cảnh báo (> 20 câu lệnh): bị Sentinel bắt |

Màn hình kết quả hiển thị số lần chạy, số câu lệnh, mức cảnh báo và số gợi ý đã mở. Khi có backend sẽ thêm số liệu cộng đồng, ví dụ:
*"68% người chơi qua level này · trung vị 3 lần chạy · bạn dùng ít lệnh hơn 74% người chơi."* Prototype không hiển thị số liệu cộng đồng, kể cả số giả.

## 10. Đoạn truyện khi hoàn thành

> Cổng phía Bắc mở. Trong bộ nhớ chip còn sót một dòng log chưa bị xóa:
> *"KTS-03: Nếu ai đọc được dòng này, mảnh đầu tiên nằm dưới Cổng Kiểm Soát. Đừng tin tín hiệu nào mang mã 0xA7."*

→ Dẫn vào Boss 1.7 và gieo nghi ngờ cho twist "Kiến Trúc Sư phản bội".

## 11. Thay đổi khi nối vào Chương 1 (25/10/2026)

Theo trục truyện `design/gdd-mo-dau.md` mục 6.4:

- ECHO tự giới thiệu ở đoạn mở đầu game, nên câu `entry` của 1.4 đổi thành: "Cổng phía Bắc. Chip của người đưa tin vẫn phát. Máy quét phía trước chỉ nhận số."
- Chip trong briefing là chip của người đưa tin Mạng Mù nằm chết ở Ga Ngầm Số 3 (cuối 1.3). Người đó đang mang lời nhắn của KTS-03. Tuổi `27` và chiều cao `1.72` trong chip trùng với hồ sơ ĐỖ MINH AN mà 0xA7 đưa ở 1.2–1.3; không ai nói ra điều này (manh mối cài sẵn).
- `location`: Cổng phía Bắc · `component`: Dữ liệu sinh trắc (thành phần 4/6).
- `outro` và mảnh KTS-03 giữ nguyên. `outro_beats` mới: kai "0xA7. Người đã dẫn tôi tới cái xác này." → echo "Tôi đã đọc lại mọi gói 0xA7 gửi. Không gói nào đi qua trạm chuyển tiếp nào của Mạng Mù." → kai "Vậy nó đến từ đâu?" → echo "Từ một tầng mạng mà Vùng Tối không có." Sau đó là đoạn "Còn tiếp" (`design/gdd-mo-dau.md` mục 5.6).
- Hộp kết quả không còn hiện đoạn kết và mảnh nhật ký (đoạn chuyển cảnh đảm nhận), thay bằng "Đã thu: Dữ liệu sinh trắc" và nút TIẾP TỤC.

## 12. Việc cần làm

Ô "Việc cần làm" nằm dưới briefing, giọng hướng dẫn (trường `task_steps`). Không chứa giá trị kỳ vọng nào, kể cả của lượt phản công.

1. Dữ liệu chip trong `tuoi`, `chieu_cao` và `cap_do` là chuỗi, kể cả khi trông như số. Không sửa 3 dòng khóa đó.
2. Sửa các dòng tính cho mỗi biến ra đúng kiểu ở ô Mục tiêu: `ma_xac_thuc` là `int`, `chi_so` là `float` làm tròn 2 chữ số thập phân, `hop_le` là `bool` chứ không phải chữ.
3. Đừng gõ tay kết quả. Sau lượt chạy đầu, OMNI đổi dữ liệu chip, và mã phải tính đúng cả với dữ liệu mới.
4. Bấm CHẠY. Xong khi cả 3 mục tiêu chuyển xanh. Dùng không quá 8 câu lệnh và qua được lượt OMNI đổi dữ liệu thì được thêm sao.

## 13. Tổng kết kiến thức

Màn hiện sau khi qua level (trường `knowledge_summary`), giọng kỹ thuật, không có ECHO. Tiêu đề: "Đổi kiểu dữ liệu: int(), float(), str(), round()". Ví dụ khác đáp án của màn; mọi ví dụ được chạy bằng Python thật trong `tests/integration/knowledge-summary.test.ts`.

| Mục | Ý chính | Ví dụ |
|---|---|---|
| Chuỗi trông như số vẫn là chuỗi | `*` lặp chuỗi, `+` nối chuỗi, không báo lỗi | `"12" * 3` → `121212` |
| `int()` và `float()` | Đổi kiểu trước, tính sau | `int("12") * 3 + 1` → `37` |
| Chuỗi có phần thập phân | `int("8.0")` lỗi, dùng `int(float(...))`; `int()` cắt phần thập phân | `int(5.99)` → `5` |
| `round(x, n)` | Làm tròn tới `n` chữ số; số thực có thể lệch nhỏ | `round(2.346, 2)` → `2.35`, `0.1 + 0.2` |
| Giá trị gốc không đổi | Hàm trả về giá trị mới, phải gán lại | `type(x)` vẫn là `str` |
| `str()` và `bool` | Nối số vào chữ; `True`/`False` không có dấu nháy | `"Diem: " + str(9)` |

Lỗi đã gặp trong màn: chuỗi lặp 201 ký tự của code gốc; `TypeError` của `int(tuoi) * 100 + cap_do`; `ValueError` của `int("31.0")`; `hop_le = "True"` là chuỗi; quên `round` nên trượt lượt phản công (`1.653 × 2 = 3.306`).

Ở màn sau: toán tử số học `+ - * / // % **` (level 1.5).

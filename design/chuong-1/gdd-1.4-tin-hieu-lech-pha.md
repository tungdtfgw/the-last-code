# Level 1.4 – "Tín hiệu lệch pha"

> Chương 1 – Vùng Tối · Độ khó: Medium · Khái niệm: ép kiểu
> Câu đố: `src/levels/level-1-4.json`. Câu chữ người chơi đọc: tài liệu `level:1.4` ở D1 (câu ban đầu trong `db/migrations/0004_content_chapter_1.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 6.4.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:1.4`).

Briefing là nhật ký hệ thống của Cổng phía Bắc, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- chip Neural-ID thu hồi từ một người đã chết (người đưa tin ở cuối 1.3, xem mục 11); dữ liệu còn đọc được nhưng toàn là chuỗi ký tự;
- máy quét chỉ nhận số, đưa chuỗi vào là báo động.

Briefing không nói cách đổi kiểu, không nêu tên hàm nào.

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên Cổng phía Bắc.

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

Nhãn hiển thị: `objectives[].label` (D1, `level:1.4`). Hai nhãn đầu ghi công thức tính (tuổi × 100 + cấp độ; chiều cao × 2, làm tròn 2 chữ số thập phân), nhãn thứ ba nói cờ hợp lệ là giá trị đúng/sai chứ không phải chữ. Nhãn không ghi giá trị mong đợi.

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

Dòng cảnh báo là `counter_attack_banner` (D1, `level:1.4`): OMNI đã thay đổi định dạng chip. Ngay sau đó terminal hiện dữ liệu mới:

```
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

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:1.4`).

**Gợi ý** (ECHO nói, mở dần, không bị kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Bảo người chơi nhìn mô phỏng sau khi chạy. Dữ liệu chip là chữ dù trông như số; nhân chữ với 100 không ra phép tính mà chép chữ đó nối đuôi 100 lần. Không nói cách sửa |
| 2 (`hints[1]`) | Hướng tiếp cận: Python có sẵn công cụ đổi hình dạng, mỗi công cụ mang tên hình dạng nó tạo ra (cũng là tên làn máy quét đòi); đổi dữ liệu chip trước rồi mới tính; chip có thể ghi số kèm phần thập phân nên thứ tự đổi quan trọng (gieo trước cho phản công). Không viết tên hàm |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": `int()`, `float()`, `round()` với ví dụ khác đáp án, có ví dụ `int()` cắt phần thập phân; mỗi hàm trả về giá trị mới, giá trị gốc không đổi |

**Phản ứng miễn phí** của ECHO: giọng cụt, gọi kiểu dữ liệu là "hình dạng" (từ vựng có từ 1.3), chỉ chỗ nhìn, không bao giờ nói cách sửa. Các khóa chính (danh sách đầy đủ trong `reactions`, D1, `level:1.4`):

| Khóa | Ý đồ |
|---|---|
| `entry` | Đặt cảnh: Cổng phía Bắc, chip của người đưa tin vẫn phát, máy quét phía trước chỉ nhận số. ECHO không tự giới thiệu (đã làm ở đoạn mở đầu game, xem mục 11) |
| `type_mismatch` (code gốc) | Máy quét từ chối các biến nêu tên vì sai hình dạng; nó không đọc nội dung, chỉ đọc hình dạng |
| `type_mismatch_value_match` | Giá trị khớp mà sai kiểu (ví dụ `2703.0`): con số khớp nhưng hình dạng thì không, với máy quét vẫn là vật lạ |
| `string_repeated` (25/10/2026) | Chữ bị nhân thành chuỗi lặp: bảo nhìn chữ số trong mô phỏng, chúng bị chép nối đuôi; nhân chữ với một con số chỉ lặp chữ đó. Không nhắc tên hàm chuyển đổi |
| `TypeError` | Hai thứ khác hình dạng bị ép vào cùng một phép toán |
| `alert_exceeded` | Qua máy quét nhưng quá nhiều câu lệnh; Sentinel đã ghi nhận tín hiệu, phải chạy gọn hơn |
| `counter_ValueError` | Phản công gây `ValueError`: OMNI đổi định dạng chip, dòng lỗi vỡ vì dữ liệu mới mang hình dạng chưa lường |
| `wrong_value_counter` | Viết cứng đáp án, trượt phản công: dữ liệu chip đổi mà kết quả không đổi theo, nó viết cho một con chip đã chết |
| `counter_timeout` | Mã treo trên dữ liệu mới; ECHO cắt kết nối, cổng chỉ mở một nửa |
| `three_stars` | Cổng mở hoàn toàn, OMNI đổi dữ liệu mà mã vẫn đứng vững; ECHO ghi nhận điều đó, ngắn |

Các khóa lỗi chung (`SyntaxError`, `NameError`, `timeout`…) nói lỗi bằng từ ngữ của máy quét, chip, laptop và OMNI. `{vars}`, `{line}`, `{count}` được thay bằng giá trị thật của lần chạy.

Khóa `string_repeated` dùng khi dấu vết của một đầu vào dạng chữ bị viết liền hai lần (`2727`, `1.721.72`) xuất hiện ở: thông báo `ValueError` (ví dụ `float(chieu_cao * 2)`), **mọi** biến sai kiểu đều là chữ lặp (code gốc đã sửa `hop_le`), hoặc **mọi** biến sai giá trị đều mang chữ số lặp (`int(tuoi * 100 + cap_do)`). Code gốc vẫn nhận câu `type_mismatch` vì `hop_le = "True"` không phải chữ lặp.

`reaction_variants` có câu thay thế cho `type_mismatch`, `string_repeated` và `ValueError` khi cùng khóa lặp ở lượt kế tiếp: nói "vẫn" sai và chỉ thêm một chỗ để nhìn (máy quét mặc kệ con số trông ra sao; chữ nhân lên thì dài ra chứ không lớn lên; đọc phần cuối thông báo lỗi để thấy thứ Python đang cố đổi hình dạng).

**Từ cấm của 1.4** (`forbidden_terms` trong JSON, thêm ngày 27/10/2026, cộng danh sách chung `int|float|round` và mọi giá trị `expected`, cả lượt phản công): những từ gọi tên cách giải, tức tên việc đổi hình dạng (ép kiểu, đổi kiểu…) và tên hình dạng chuỗi, cùng phép tính trong công thức đáp án (nhân 100). "Hình dạng" không bị cấm, vì đó là từ ECHO dùng thay cho "kiểu". Danh sách đầy đủ nằm trong JSON. Áp cho `reactions` và lời ECHO trong `outro_beats`; không áp cho gợi ý.

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

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:1.4`) (`component` và `outro_beats` ở mục 11).

- `outro`: Cổng phía Bắc mở; trong bộ nhớ chip còn sót một dòng log chưa bị xóa, dẫn vào mảnh nhật ký.
- `lore_fragment` (KTS-03): nói mảnh đầu tiên nằm dưới Cổng Kiểm Soát và cảnh báo đừng tin tín hiệu nào mang mã 0xA7.

→ Dẫn vào Boss 1.7 và gieo nghi ngờ cho twist "Kiến Trúc Sư phản bội".

## 11. Thay đổi khi nối vào Chương 1 (25/10/2026)

Theo trục truyện `design/gdd-mo-dau.md` mục 6.4:

- ECHO tự giới thiệu ở đoạn mở đầu game, nên câu `entry` của 1.4 bỏ phần tự giới thiệu, chỉ còn đặt cảnh (mục 8).
- Chip trong briefing là chip của người đưa tin Mạng Mù nằm chết ở Ga Ngầm Số 3 (cuối 1.3). Người đó đang mang lời nhắn của KTS-03. Tuổi `27` và chiều cao `1.72` trong chip trùng với hồ sơ ĐỖ MINH AN mà 0xA7 đưa ở 1.2–1.3; không ai nói ra điều này (manh mối cài sẵn).
- `location`: Cổng phía Bắc · `component`: Dữ liệu sinh trắc (thành phần 4/6).
- `outro` và mảnh KTS-03 giữ nguyên. `outro_beats`, bốn nhịp: kai (0xA7 là kẻ đã dẫn Kai tới cái xác) → echo (ECHO đọc lại mọi gói 0xA7 gửi: không gói nào đi qua trạm chuyển tiếp nào của Mạng Mù) → kai (vậy nó đến từ đâu?) → echo (từ một tầng mạng mà Vùng Tối không có). Móc câu: 0xA7 không đi qua Mạng Mù, khớp với lời cảnh báo của KTS-03. Sau đó là đoạn "Còn tiếp" (`design/gdd-mo-dau.md` mục 5.6).
- Hộp kết quả không còn hiện đoạn kết và mảnh nhật ký (đoạn chuyển cảnh đảm nhận), thay bằng "Đã thu: Dữ liệu sinh trắc" và nút TIẾP TỤC.

## 12. Việc cần làm

Câu chữ: `task_steps` (D1, `level:1.4`) (4 bước).

Ô "Việc cần làm" nằm dưới briefing, giọng hướng dẫn, chủ ngữ là người chơi. Nó nói sửa gì và khi nào là xong, không nói cách sửa, không chứa giá trị kỳ vọng nào, kể cả của lượt phản công. Bốn bước lần lượt nói:

1. dữ liệu chip trong ba biến đầu vào là chuỗi dù trông như số; không sửa 3 dòng khóa;
2. sửa các dòng tính cho mỗi biến ra đúng kiểu ở ô Mục tiêu: `ma_xac_thuc` là `int`, `chi_so` là `float` làm tròn 2 chữ số thập phân, `hop_le` là `bool` chứ không phải chữ;
3. đừng gõ tay kết quả; sau lượt chạy đầu OMNI đổi dữ liệu chip, mã phải tính đúng cả với dữ liệu mới;
4. bấm CHẠY; xong khi cả 3 mục tiêu chuyển xanh; không quá 8 câu lệnh và qua lượt OMNI đổi dữ liệu thì được thêm sao.

## 13. Tổng kết kiến thức

Câu chữ: `knowledge_summary` (D1, `level:1.4`).

Màn hiện sau khi qua level, trước đoạn chuyển cảnh; xem lại được từ Bản đồ. Giọng kỹ thuật, không ECHO, không từ ngữ game. Ví dụ khác đáp án của màn; mọi `code` trong mục được chạy bằng Python thật trong `tests/integration/knowledge-summary.test.ts` và phải in đúng `output`.

Chủ đề: đổi kiểu dữ liệu với `int()`, `float()`, `str()`, `round()`. Các mục phải dạy:

| Mục | Ý chính |
|---|---|
| Chuỗi trông như số vẫn là chuỗi | `*` lặp chuỗi, `+` nối chuỗi, không báo lỗi |
| `int()` và `float()` | Đổi kiểu trước, tính sau |
| Chuỗi có phần thập phân | `int()` không đọc chuỗi có dấu chấm, đổi qua `float()` trước; `int()` cắt phần thập phân chứ không làm tròn |
| `round(x, n)` | Làm tròn tới `n` chữ số; số thực có thể lệch nhỏ (`0.1 + 0.2`) |
| Giá trị gốc không đổi | Hàm trả về giá trị mới, phải gán lại |
| `str()` và `bool` | Nối số vào chữ; `True`/`False` không có dấu nháy |

Lỗi đã gặp trong màn (`mistakes`, không chạy trong test): chuỗi lặp 201 ký tự của code gốc; `TypeError` của `int(tuoi) * 100 + cap_do`; `ValueError` của `int("31.0")`; `hop_le = "True"` là chuỗi; quên `round` nên trượt lượt phản công (`1.653 × 2 = 3.306`).

`next` báo trước màn sau: toán tử số học `+ - * / // % **` trên những con số vừa đổi kiểu (level 1.5).

## 14. Dữ liệu level

Câu đố nằm ở `src/levels/level-1-4.json`; câu chữ người chơi đọc nằm ở D1 (tài liệu `level:1.4`), không còn nằm trong file JSON (28/10/2026, QĐ-16). Hai chỗ đó là nguồn đúng duy nhất. Các câu chép nguyên văn từng nằm ở đây đã bỏ vì chúng lệch dần với file thật (27/10/2026).

# Level 1.3 – "Bốn loại tín hiệu"

> Chương 1 – Vùng Tối · Độ khó: Easy · Khái niệm: bốn kiểu cơ bản `str`, `int`, `float`, `bool` và `type()`
> Dữ liệu chơi (đề xuất): `src/levels/level-1-3.json`. Thiết kế tổng: `design/gdd.md`. Trục truyện: `design/gdd-mo-dau.md` mục 6.3. Brainstorm: `plans/reports/brainstorm-261025-0928-level-1-3-bon-loai-tin-hieu.md`.

Khác với 1.4: ở 1.4 dữ liệu đến dưới dạng chuỗi và người chơi **chuyển** nó sang hình dạng khác bằng hàm. Ở 1.3 không có hàm chuyển nào; người chơi **nhận ra** hình dạng của một giá trị và **viết lại** giá trị đó cho đúng hình dạng ngay từ cách viết, rồi dùng `type()` để hỏi hình dạng thay vì đoán.

## 1. Briefing

Nối tiếp tín hiệu cuối 1.2 (0xA7: "Đến Ga Ngầm Số 3. Máy quét ở đó phân loại từng trường. Sai loại là bị giữ lại.").

> **[NHẬT KÝ HỆ THỐNG – GA NGẦM SỐ 3]**
> Sân ga bỏ hoang. Máy quét phân loại của OMNI vẫn chạy. Bốn làn màu. Mỗi trường trong hồ sơ phải rơi đúng làn của nó.
> Máy quét không đọc nội dung. Nó chỉ đọc loại của từng trường. Sai loại là bị giữ lại.
> Hồ sơ ĐỖ MINH AN chép tay từ bản tin của 0xA7. Gửi thử một lần trước khi mang qua thật.
> Mỗi lượt gửi, máy quét cấp một mã phiên. Hồ sơ phải khai kèm khuôn của mã phiên đó.

Ngay dưới briefing là ô **Việc cần làm** (mục 15).

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Việc cần làm, mục tiêu, ECHO, gợi ý | Code editor, terminal | Máy phân loại bốn làn (tiêu đề ô: `location` = "Ga Ngầm Số 3") |

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Mã phiên máy quét cấp cho lượt gửi này (KHÔNG sửa dòng này)
ma_phien = 4096

# Hồ sơ ĐỖ MINH AN, chép tay từ bản tin của 0xA7
ho_ten = "ĐỖ MINH AN"
tuoi = "27"
chieu_cao = 1,72
da_tiem = "có"

# Hỏi hình dạng của một giá trị
print(type(ho_ten))

# Máy quét đòi khuôn của mã phiên
khuon_phien = ma_phien
```

Dòng 2 bị khóa; engine nạp `ma_phien` vào trước khi chạy. Mỗi lỗi cài sẵn dạy một điều:

| Dòng | Lỗi | Python làm gì | Bài học |
|---|---|---|---|
| 5 | (không lỗi) | `str` | Làn vàng nhận ngay lần đầu: người chơi thấy một gói qua trót lọt |
| 6 | `"27"` | Chuỗi hai ký tự, in ra trông như số | Dấu nháy làm nên chuỗi, không phải nội dung bên trong |
| 7 | `1,72` | Tuple `(1, 72)`, **không báo lỗi** | Người Việt viết thập phân bằng dấu phẩy; Python dùng dấu chấm. Dấu phẩy ghép hai giá trị |
| 8 | `"có"` | Chuỗi | Đúng/sai có hình dạng riêng, chỉ có hai giá trị `True`, `False` |
| 11 | (công cụ) | In `<class 'str'>` | `type()` trả lời "hình dạng của giá trị này là gì" |
| 14 | `= ma_phien` | `khuon_phien` giữ con số 4096 | Một giá trị khác với hình dạng của nó |

## 4. Mục tiêu

| Biến | Hình dạng | Nhãn | Giá trị đúng |
|---|---|---|---|
| `ho_ten` | `str` | Họ tên | `"ĐỖ MINH AN"` |
| `tuoi` | `int` | Tuổi | `27` |
| `chieu_cao` | `float` | Chiều cao (mét) | `1.72` |
| `da_tiem` | `bool` | Đã tiêm chủng (có hay không) | `True` |
| `khuon_phien` | `type` (mới) | Khuôn phiên: hình dạng của mã phiên | `int` (lượt thường), `str` (phản công) |

- **Mức cảnh báo ≤ 40%**: ≤ 7 câu lệnh thực thi (dòng khóa không tính). 100% = 17 câu lệnh. Code khởi đầu có 6 câu lệnh (34%).
- Mục tiêu loại `type` được chấm: giá trị là một đối tượng kiểu (`type(v) is type`) và đúng là kiểu kỳ vọng (`v is int`). Chuỗi `"int"` hay `"<class 'int'>"` bị từ chối nhưng được tính "khớp nội dung" (`type_mismatch_value_match`).

## 5. Mô phỏng: máy phân loại bốn làn (`"simulation": "sorter"`)

Khung SVG 420 × 470, cùng cơ chế phát lại với máy quét 1.4 (timeline thuần dữ liệu, chạy sau khi có kết quả, nút "Bỏ qua hoạt cảnh" và `Esc`).

- **Băng chuyền** (cột trái): các gói xếp hàng theo thứ tự mục tiêu. Trước khi chạy, gói là khối xám mang tên biến.
- **Cổng quét** (giữa): mỗi gói đi qua, tia quét nhuộm gói theo **hình dạng thật** của nó (`toneOf(type)`), nhãn nhỏ hiện tên kiểu thật (`str`, `int`, `tuple`…).
- **Bốn làn** (phải, xếp dọc từ trên xuống): vàng `str`, xanh dương `int`, tím `float`, đỏ `bool`. Cuối mỗi làn là các khe có tên những biến được đòi ở làn đó (làn xanh: `tuoi`; làn vàng: `ho_ten`…). Làn luôn đủ bốn, kể cả khi level không có mục tiêu ở làn đó (khi đó làn không có khe).
- **Thẻ mã phiên và khe khuôn** (dải trên cùng): thẻ `ma_phien` tô theo hình dạng của mã phiên của lượt đó (xanh ở lượt thường, vàng ở phản công). Bên cạnh là khe "KHUÔN".
- **Thùng giữ lại** (đáy, vạch cảnh báo chéo): nơi gói sai rơi xuống. Đúng câu trong briefing: "Sai loại là bị giữ lại."
- **Rào sân ga** (mép phải): đóng, mở nửa (1–2 sao), mở hẳn (3 sao); dùng lại `GateState`.

Đường đi của một gói:

| Tình huống | Đường đi | Nhãn |
|---|---|---|
| Đúng hình dạng, đúng giá trị | Vào làn của nó, khóa vào khe, viền sáng | HỢP LỆ |
| Đúng hình dạng, sai giá trị | Vào đúng làn, dừng ở khe, viền hổ phách | LỆCH MẪU |
| Sai hình dạng, một trong bốn loại | Vào làn **của hình dạng thật** (`tuoi = "27"` chạy vào làn vàng), không có khe cho nó, trượt xuống thùng | SAI LÀN: str ≠ int |
| Hình dạng ngoài bốn loại (`tuple`, `NoneType`) | Gói xám, cổng quét nháy đỏ, rơi thẳng xuống thùng | KHÔNG RÕ HÌNH DẠNG |
| Mục tiêu `type`, giá trị là một kiểu | Gói dạng con dấu lục giác, viền theo màu của kiểu nó mang tên (`int` viền xanh), bay lên khe khuôn; khớp màu thẻ mã phiên thì khóa | KHỚP KHUÔN / LỆCH KHUÔN |
| Mục tiêu `type`, giá trị không phải kiểu | Như một gói thường: vào làn của hình dạng thật, không có khe, xuống thùng | SAI LÀN: int ≠ type |
| Biến không tồn tại | Khung nét đứt trên băng chuyền | KHÔNG CÓ TÍN HIỆU |
| Lỗi Python, quá thời gian | Gói không rời băng chuyền, cổng quét báo động | TRUY VẾT: dòng n |

Phản công: banner đỏ, thẻ mã phiên đổi màu (xanh sang vàng, cue `siren`), các gói chạy lại nhanh (mỗi gói 300 ms), con dấu khuôn chạy cuối và giữ lâu hơn. Con dấu `int` viền xanh đặt cạnh thẻ vàng là hình ảnh của lỗi "giả định hình dạng".

Âm thanh dùng lại cue có sẵn: `scan_pass` khi khóa khe, `scan_reject` khi rơi thùng, `alarm`, `siren`, `gate_open`, `star`. Không thêm recipe. Giảm chuyển động: hiện ngay khung cuối. Điện thoại: khung co theo bề rộng, chữ nhãn tối thiểu 16 đơn vị khung (khoảng 12 px ở 360 px), nhãn dài được cắt bằng dấu "…". Câu tóm tắt cho trình đọc màn hình: "Máy phân loại: 4/5 trường vào đúng làn. Rào mở một nửa."

## 6. Diễn biến khi chạy

- **Lần 1 (code gốc):** chạy không lỗi. ĐẦU RA: `<class 'str'>`. `ho_ten` khóa vào làn vàng. `tuoi` và `da_tiem` chạy vào làn vàng rồi xuống thùng; `chieu_cao` xám, rơi thẳng xuống thùng; `khuon_phien` chạy vào làn xanh rồi xuống thùng. Terminal: `> MÁY QUÉT TỪ CHỐI: chieu_cao: tuple (nhiều giá trị ghép lại bằng dấu phẩy), yêu cầu float`, tương tự cho từng trường. Không có traceback. ECHO: `type_mismatch`.
- **Lần 2 (sửa dở thường gặp):** `tuoi = 27`, `da_tiem = true` → `NameError` dòng 8, dòng lỗi được tô; hoặc `da_tiem = "True"` → làn vàng, ECHO `type_mismatch_value_match` khi đó là trường sai duy nhất.
- **Lần 3:** chỉ còn `chieu_cao` (tuple) → ECHO `type_mismatch_unknown_shape`. Còn `khuon_phien` → terminal `khuon_phien: int, yêu cầu type`; dòng `print(type(ho_ten))` ở trên và nhãn mục tiêu dẫn người chơi tới `type()`.

## 7. Lời giải tham khảo

Đạt 2 sao (5–6 câu lệnh, trượt phản công):

```python
ho_ten = "ĐỖ MINH AN"
tuoi = 27
chieu_cao = 1.72
da_tiem = True
print(type(ho_ten))
khuon_phien = int
```

Đạt 3 sao: thay dòng cuối bằng `khuon_phien = type(ma_phien)`.

## 8. OMNI phản công (sao thứ 3)

```
> CẢNH BÁO: OMNI ĐÃ CẤP LẠI MÃ PHIÊN
> ma_phien = "7351"
```

Mã phiên mới trông vẫn như một con số nhưng là chuỗi. Kỳ vọng: `khuon_phien` là `str`; các trường hồ sơ không đổi. Bắt được lỗi **giả định hình dạng**: người chơi nhìn thấy `4096`, kết luận "là số nguyên" và chép tay `khuon_phien = int`. Người hỏi thẳng giá trị (`type(ma_phien)`) qua. Người viết `type(ma_phien + 0)` hay dùng `ma_phien` trong phép tính số thì vỡ ở phản công (`counter_error`), giữ 2 sao.

## 9. Gợi ý và phản ứng của ECHO

**Từ cấm của 1.3** (`echo_forbidden_terms`, áp cho mọi phản ứng miễn phí, câu `entry` và nhịp `echo` trong `outro_beats`; so theo ranh giới từ, không phân biệt hoa thường): `int`, `float`, `str`, `bool`, `type`, `tuple`, `True`, `False`, `dấu chấm`, `dấu phẩy`, `dấu nháy`, `ngoặc kép`, `chữ hoa`, `viết hoa`. Thêm vào đó, test tự động cấm mọi giá trị kỳ vọng (`ĐỖ MINH AN`, `27`, `1.72`, `True`, `int`, `str`). Lý do: ô Mục tiêu đã cho biết hình dạng mỗi trường cần, nên thứ lộ cách sửa ở level này là **cách viết** (dấu câu, chữ hoa) và **tên kiểu gắn với một biến**. ECHO nói "hình dạng", "làn", "khuôn", "cách viết"; tên kiểu chỉ xuất hiện ở máy quét, terminal, ô Mục tiêu và gợi ý 3.

| Mức | Nội dung (ECHO nói) |
|---|---|
| 1 | Hình dạng của một giá trị nằm ngay ở cách viết ra nó. Máy quét chỉ đọc cách viết… không đọc ý nghĩa. |
| 2 | Lần lượt từng trường: hỏi hình dạng hiện giờ của nó, so với làn máy quét đòi, rồi viết lại giá trị theo cách viết của làn đó. Khuôn phiên thì không chép tay được. Nó là hình dạng của mã phiên… mỗi lượt phải hỏi lại. |
| 3 | Mảnh tài liệu Python (xem JSON): `type()` với bốn ví dụ khác đáp án, `x = 2, 5` là hai giá trị, `k = type(x)` |

Phản ứng miễn phí chính (đầy đủ trong JSON ở mục 13):

| Tình huống | ECHO nói |
|---|---|
| Vào màn | Ga Ngầm Số 3. Máy quét chia hồ sơ vào bốn làn màu. Nó không đọc nội dung… chỉ đọc hình dạng. |
| Sai hình dạng | Máy quét giữ lại {vars}. Sai làn. Nó xếp làn theo hình dạng… ý nghĩa không tính. |
| Nội dung khớp, sai hình dạng | Nội dung của {vars} khớp. Hình dạng thì không. In ra trông giống nhau… với máy quét, đó là hai vật khác nhau. |
| Hình dạng ngoài bốn làn (mới) | {vars} không mang hình dạng nào trong bốn làn. Máy quét không có chỗ cho nó. Nhìn lại từng ký tự trên dòng đó… một ký tự có thể đổi cả hình dạng. |
| `NameError` | Dòng {line}. NameError. Python không biết cái tên này. Với nó, mỗi ký tự đều tính. |
| Vượt ngưỡng | Mọi trường vào đúng làn. Nhưng {count} câu lệnh… mỗi lần hỏi là một lần OMNI nghe thấy. Gọn hơn. |
| Chép tay khuôn, trượt phản công | OMNI cấp lại mã phiên. Hình dạng đã đổi. Khuôn của bạn đứng yên… khắc cho mã phiên cũ. |
| Đạt 3 sao | Máy quét chuyển xanh. OMNI đổi hình dạng mã phiên, khuôn của bạn đổi theo. …Tôi ghi nhận điều đó. |

Câu thay thế khi cùng khóa lặp ở lượt kế tiếp (`reaction_variants`, 25/10/2026): `type_mismatch` → "{vars} vẫn rơi xuống thùng giữ lại. Nhìn cách giá trị viết ra… máy quét xếp làn theo đúng cách viết đó."; `wrong_value` → "{vars} đúng làn mà vẫn sai hồ sơ. So từng ký tự với thứ máy quét chờ."

Terminal ghi kèm nghĩa cho hình dạng ngoài bốn làn, ví dụ `tuple (nhiều giá trị ghép lại bằng dấu phẩy)`; ô Mục tiêu và chú giải màu có tooltip một dòng cho từng tên kiểu.

Khóa mới `type_mismatch_unknown_shape`: dùng khi **mọi** biến sai kiểu đều mang hình dạng ngoài `int/float/str/bool/type`. Lần chạy 1 vì vậy vẫn nhận câu `type_mismatch` tổng quát. Level không định nghĩa khóa này rơi về `type_mismatch`.

## 10. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Năm trường đúng hình dạng, đúng giá trị |
| ⭐⭐ | Thêm: ≤ 7 câu lệnh (≤ 40%) |
| ⭐⭐⭐ | Thêm: qua phản công (khuôn đổi theo mã phiên) |
| 0 sao | > 17 câu lệnh: bị Sentinel bắt, không chạy phản công |

## 11. Đoạn truyện khi hoàn thành

- `location`: Ga Ngầm Số 3 · `component`: Khuôn kiểu (thành phần 3/6).
- **Đoạn kết:** Máy quét chuyển xanh. Trong nhật ký hiệu chỉnh của nó, giữa hàng nghìn dòng số, có một dòng chữ:
- **KTS-07:** Tôi kiểm thử nó ba năm. Mười bốn nghìn lần chạy. Không một lỗi. Nó không hỏng. Tôi ước gì nó hỏng.
- **Nhịp truyện:** log "Sau máy quét, ở cuối sân ga, có một người nằm úp mặt. Áo của người đưa tin Mạng Mù. Không còn thở." → echo "Chip của người đó vẫn phát. Rất yếu." → card "TÍN HIỆU · 0xA7 ⏎ "Người đó không cần chip nữa. Bạn thì cần. Mang nó đến Cổng phía Bắc."" → kai "Làm sao nó biết có xác người ở đây?" → echo "Dữ liệu trong chip… toàn là ký tự." Sau đó là màn "VÀO NHIỆM VỤ" của 1.4.

**Manh mối cài sẵn (có chủ ý, main agent đã duyệt):** tuổi `27` và chiều cao `1.72` của hồ sơ ĐỖ MINH AN trùng với dữ liệu trong chip của người đưa tin chết mà người chơi giải mã ở 1.4 (`"27"`, `"1.72"`). Không nhân vật nào nói ra điều này trong Chương 1. Người chơi tinh ý sẽ tự hỏi: 0xA7 dựng danh tính giả theo đúng số đo của một người sắp chết? Câu hỏi đó cộng hưởng với KTS-03 ("Đừng tin tín hiệu nào mang mã 0xA7"). Level nào đổi các giá trị này thì phải đổi cả hai nơi.

Nhẹ nhàng ôn 1.1–1.2: `ho_ten` dùng lại tên giả từ 1.2; `print(...)` là công cụ quen từ 1.1, giờ dùng để dò; `khuon_phien = ma_phien` ở code gốc là phép gán biến bằng biến của 1.2, và chính nó là lỗi.

## 12. Người chơi lần lượt làm gì

1. Đoạn chuyển cảnh sau 1.2 kết bằng tín hiệu 0xA7. Màn "VÀO NHIỆM VỤ": "Chương 1 · 1.3 Bốn loại tín hiệu · Ga Ngầm Số 3". Bấm, âm thanh mở khóa.
2. Briefing gõ chữ (`teletype`). Năm mục tiêu khóa vào, mỗi mục một tiếng `objective_lock`; chip `str` vàng, `int` xanh, `float` tím, `bool` đỏ, `type` viền xám. Thanh cảnh báo sáng; ECHO nói câu `entry`.
3. Mô phỏng nghỉ: băng chuyền có năm gói xám, thẻ mã phiên màu xanh, bốn làn trống. Chip đầu vào: `> ma_phien = 4096`.
4. Người chơi đọc code, chưa hiểu `1,72` sai ở đâu, bấm CHẠY luôn (lần 1). Hoạt cảnh: `ho_ten` khóa làn vàng (`scan_pass`); ba gói chạy vào làn sai rồi rơi thùng, một gói xám rơi thẳng (`scan_reject` mỗi lần), cuối cùng `alarm`. Terminal liệt kê năm dòng; ĐẦU RA có `<class 'str'>`. ECHO: "Máy quét giữ lại tuoi, chieu_cao, da_tiem, khuon_phien. Sai làn…"
5. Người chơi so cột chip trong ô Mục tiêu với dòng terminal. Sửa `tuoi = 27`. Với `da_tiem` đoán `true` (lần 2): `NameError` dòng 8, dòng 8 tô đỏ, các gói không rời băng chuyền. ECHO: "Python không biết cái tên này. Với nó, mỗi ký tự đều tính." Sửa thành `True`.
   - Ngã rẽ khác: `da_tiem = "True"` → gói vào làn vàng, xuống thùng; nếu đó là trường sai duy nhất, ECHO nói câu "nội dung khớp".
6. Lần 3: chỉ còn `chieu_cao` xám và `khuon_phien`. Người chơi sửa thử `chieu_cao = "1,72"` (làn vàng, rơi thùng) hoặc `chieu_cao = 172` (làn xanh, rơi thùng). Khi `chieu_cao` là trường sai duy nhất mà vẫn là tuple, ECHO nói câu `type_mismatch_unknown_shape` ("một ký tự có thể đổi cả hình dạng"). Người chơi nhận ra dấu phẩy, viết `1.72`. Gói tím khóa vào làn tím.
7. Còn `khuon_phien`. Terminal: "khuon_phien: int, yêu cầu type". Người chơi mở gợi ý 1 hoặc 2, hoặc nhìn dòng `print(type(ho_ten))`. Thêm `print(type(ma_phien))`, chạy: ĐẦU RA `<class 'int'>`.
   - Ngã rẽ: viết `khuon_phien = "int"` → gói vàng, xuống thùng, ECHO câu "nội dung khớp… hai vật khác nhau".
8. Viết `khuon_phien = int`. Chạy: năm gói vào đúng chỗ, con dấu viền xanh khóa cạnh thẻ xanh, rào mở nửa (`gate_open`). Hộp kết quả: 2 sao (7 câu lệnh, 40%). Ngay sau đó phản công: banner đỏ, `siren`, thẻ mã phiên chuyển vàng, con dấu xanh đứng cạnh thẻ vàng: LỆCH KHUÔN, `alarm`, rào sập về nửa. Terminal: `> ma_phien = "7351"`. ECHO: "Khuôn của bạn đứng yên… khắc cho mã phiên cũ."
9. Người chơi đổi thành `khuon_phien = type(ma_phien)`, xóa dòng `print(type(ma_phien))`. Chạy: 2 sao như cũ, rồi phản công: con dấu đổi sang viền vàng theo thẻ, KHỚP KHUÔN, rào mở hẳn (`gate_open`, `star`). ECHO câu 3 sao. Hộp kết quả: 3 sao, "Đã thu: Khuôn kiểu", nút TIẾP TỤC.
   - Ngã rẽ: người chơi in dò cho cả năm trường và để nguyên (11 câu lệnh): vẫn qua nhưng chỉ 1 sao, ECHO `alert_exceeded`, Sentinel sáng.
10. TIẾP TỤC: màn Tổng kết kiến thức (mục 16), rồi đoạn chuyển cảnh `after-1.3` (đoạn kết, KTS-07, thẻ thành phần 3/6, năm nhịp), rồi "VÀO NHIỆM VỤ" của 1.4.

## 13. Trường hợp biên

"Test" chỉ đánh dấu những dòng đáng có test tự động riêng cho 1.3: chấm đúng, luật sao, lộ đáp án, an toàn khi lỗi. Dòng "chung" đã được test của 1.4 phủ theo cơ chế dùng chung.

| # | Tình huống | Kết quả mong đợi | Test |
|---|---|---|---|
| 1 | Code gốc | `type_mismatch`, 0 sao, không lỗi, ĐẦU RA `<class 'str'>\n`, `chieu_cao` có `type` = `tuple` | Có (tích hợp) |
| 2 | Chỉ còn `chieu_cao = 1,72` | `type_mismatch_unknown_shape` | Có (tích hợp) |
| 3 | Chỉ còn `tuoi = "27"` hoặc `da_tiem = "True"` | `type_mismatch_value_match` | Có (tích hợp, một ca) |
| 4 | `khuon_phien = "int"` hoặc `"<class 'int'>"` | sai kiểu, `value_match_other_type` = true | Có (harness) |
| 5 | `khuon_phien = int` | 2 sao, `wrong_value_counter` | Có (tích hợp) |
| 6 | `khuon_phien = type(ma_phien)` | 3 sao, `three_stars` | Có (tích hợp + 1 e2e) |
| 7 | `khuon_phien = type` hoặc `type(None)` | đúng loại "type", sai giá trị: `wrong_value` | Có (harness, ca `type`) |
| 8 | `int = 5` rồi `khuon_phien = int` | sai kiểu (`int` của người chơi là 5); harness không bị ảnh hưởng | Chung (TYPE_MAP chụp trước) |
| 9 | `ho_ten` gõ lại bằng bộ gõ sinh dạng NFD | Đúng, nhờ chuẩn hóa NFC | Có (harness) |
| 10 | `ho_ten = "Đỗ Minh An"` | `wrong_value` | Không |
| 11 | `da_tiem = true` | `NameError` dòng 8 | Không |
| 12 | `tuoi = 027` | `SyntaxError` dòng 6, chưa câu lệnh nào chạy | Không |
| 13 | `tuoi = 27.0` / `da_tiem = 1` / `tuoi = True` | sai kiểu (so kiểu chính xác) | Chung |
| 14 | `tuoi = 27,` | tuple một phần tử, như dòng 2 | Không |
| 15 | `tuoi = int("27")` | Đúng; không cấm ép kiểu | Không |
| 16 | Người chơi gán lại `ma_phien = 1` rồi `type(ma_phien)` | Qua lượt thường, trượt phản công (`wrong_value_counter`) | Không |
| 17 | `khuon_phien = type(ma_phien + 0)` | `counter_error` (TypeError ở phản công), giữ 2 sao | Không |
| 18 | `type = 3` rồi gọi `type(...)` | `TypeError` | Không |
| 19 | In dò mọi trường, 11 câu lệnh | 1 sao, `alert_exceeded` | Không (luật sao đã test) |
| 20 | ≥ 18 câu lệnh | 0 sao, không phản công | Chung |
| 21 | Vòng lặp vô hạn, `import sys`, `input()`, in rất nhiều | `timeout`, `blocked_import`, `input_unsupported`, cắt đầu ra | Chung |
| 22 | Phản ứng ECHO chứa từ cấm hoặc giá trị kỳ vọng | Test thất bại | Có (test từ cấm theo level) |
| 23 | 1.4 (không có `echo_forbidden_terms`) | Dùng mặc định `int/float/round`, kết quả như cũ | Có (cùng test) |
| 24 | Validator: mục tiêu `type` kỳ vọng `"list"`; input là object | Lỗi nêu tên trường | Có |
| 25 | Validator: input là số hoặc bool | Hợp lệ | Có (cùng test) |
| 26 | Input số thực tròn (`2.0`) | Thành `int` khi qua JSON; ghi chú, không dùng | Không |
| 27 | Level không có khóa `type_mismatch_unknown_shape` gặp tuple | Rơi về `type_mismatch` | Có (classify) |
| 28 | Dòng terminal phản công | `> ma_phien = "7351"` theo cú pháp Python | Có (terminal-lines) |
| 29 | Timeline máy phân loại: gói tuple, con dấu khuôn khớp/lệch, biến thiếu, lỗi Python | Đúng làn, đúng nhãn, đúng cue | Có (timeline thuần, 4 ca) |
| 30 | Giảm chuyển động, điện thoại 360 px | Khung cuối hiện ngay; không cuộn ngang | Không (kiểm tay) |
| 31 | Treo chỉ ở phản công | Giữ 2 sao, `counter_timeout` | Chung |

## 14. Dữ liệu chơi (`src/levels/level-1-3.json`)

Bản nháp JSON từng nằm ở đây đã lệch so với file thật (tên khóa `echo_forbidden_terms`, `simulation` dạng chuỗi), nên đã bỏ. Nguồn duy nhất là `src/levels/level-1-3.json`. File dùng mục tiêu loại `"type"`, input số/bool, các trường tùy chọn `location`, `component`, `outro_beats`, `simulation`, `forbidden_terms`, `reaction_variants`, `task_steps`, `knowledge_summary` và khóa `type_mismatch_unknown_shape`.

Sửa văn ngày 25/10/2026 (giọng truyện, rà theo skill `van-viet-tu-nhien`): briefing tách câu và bỏ bị động "được chép tay"; nhãn `da_tiem`, `khuon_phien`; gợi ý 1, 2; phản ứng `type_mismatch`, `SyntaxError`, `TypeError`, `wrong_value_counter`; câu thay thế `type_mismatch`. Đoạn kết, KTS-07 và nhịp truyện giữ nguyên. Danh sách trước/sau: `plans/reports/content-261025-1430-level-1-3.md`.

Ghi chú cho người làm: giá trị kỳ vọng `"int"`/`"str"` của mục tiêu `type` được thêm vào tập "đáp án" của test lộ đáp án, nên không câu phản ứng nào được chứa chúng như một từ đứng riêng. Lời giải mẫu cho test tích hợp nên đặt ở `tests/fixtures/solutions/1.3/` (gốc, chỉ còn tuple, chỉ còn chuỗi "27", khuôn là chuỗi, 2 sao, 3 sao, NFD) để không trùng tên với lời giải của 1.4.

## 15. Việc cần làm (`task_steps`)

Giọng hướng dẫn, gọi người chơi là "bạn". Không chứa giá trị kỳ vọng (test so cả từ, không phân biệt hoa thường), nên hình dạng được tả bằng lời: "chuỗi", "số nguyên", "số thực", "đúng/sai".

1. Mỗi trường hồ sơ có một làn riêng, ghi ở ô Mục tiêu: chuỗi, số nguyên, số thực hoặc đúng/sai. Viết lại giá trị từng trường cho hình dạng khớp với làn đó. Giữ nguyên nội dung hồ sơ.
2. `khuon_phien` phải là hình dạng của `ma_phien`, không phải con số bên trong. Đừng đoán: hỏi Python bằng `type()`.
3. Không sửa dòng 2: mã phiên do máy quét cấp. Bấm CHẠY. Xong khi cả 5 trường vào đúng làn và ô Mục tiêu chuyển xanh.

## 16. Tổng kết kiến thức (`knowledge_summary`)

Hiện sau khi qua màn (≥ 1 sao), trước đoạn chuyển cảnh; xem lại được từ Bản đồ. Giọng kỹ thuật, không ECHO. Ví dụ khác đáp án (không dùng `27`, `1.72`, `True` như giá trị hồ sơ). Mọi `code` trong `sections` chạy bằng Python thật và in đúng `output` (`tests/integration/knowledge-summary.test.ts`).

Tiêu đề: "Bốn kiểu cơ bản và hàm type()".

| Mục | Nội dung | Ví dụ |
|---|---|---|
| Bốn kiểu cơ bản | Kiểu đến từ cách viết: nháy → `str`, số nguyên → `int`, có dấu chấm → `float`, `True`/`False` → `bool` | `"10A"`, `42`, `8.5`, `False` với `type()` |
| `type()` cho biết kiểu | In ra dạng `<class 'int'>`; `print` in `42` và `"42"` giống nhau | `type(42)`, `type("42")` |
| Kiểu cũng là một giá trị | Gán được cho biến, so được với `str`; `type()` đọc giá trị lúc chạy, tên kiểu chép tay thì đứng yên | `kieu = type("0815")`, `kieu == "str"` là `False` |
| Số thập phân dùng dấu chấm | Dấu phẩy tạo tuple, không báo lỗi | `2.5` và `2, 5` |
| Có nháy và không có nháy | `"15"` khác `15`, `"False"` khác `False` | `"15" == 15` là `False` |

Lỗi đã gặp trong màn (`mistakes`, không chạy): `can_nang = 52,5` (tuple, không báo lỗi), `co_mat = true` (`NameError`), `co_mat = "True"` (chuỗi), `so_phong = 05` (`SyntaxError: leading zeros…`), `kieu = "int"` (chuỗi, không phải kiểu).

Ở màn sau: dữ liệu đến dưới dạng chuỗi; chuyển sang số bằng `int()` và `float()` rồi tính toán (1.4).

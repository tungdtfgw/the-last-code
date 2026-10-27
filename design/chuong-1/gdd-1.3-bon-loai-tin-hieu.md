# Level 1.3 – "Bốn loại tín hiệu"

> Chương 1 – Vùng Tối · Độ khó: Easy · Khái niệm: bốn kiểu cơ bản `str`, `int`, `float`, `bool` và `type()`
> Câu đố: `src/levels/level-1-3.json`. Câu chữ người chơi đọc: tài liệu `level:1.3` ở D1 (câu ban đầu trong `db/migrations/0004_content_chapter_1.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Trục truyện: `design/gdd-mo-dau.md` mục 6.3. Brainstorm: `design/quyet-dinh/level-1-3-bon-loai-tin-hieu.md`.

Khác với 1.4: ở 1.4 dữ liệu đến dưới dạng chuỗi và người chơi **chuyển** nó sang hình dạng khác bằng hàm. Ở 1.3 không có hàm chuyển nào; người chơi **nhận ra** hình dạng của một giá trị và **viết lại** giá trị đó cho đúng hình dạng ngay từ cách viết, rồi dùng `type()` để hỏi hình dạng thay vì đoán.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:1.3`).

Nối tiếp thẻ tín hiệu 0xA7 cuối 1.2 (`outro_beats`, D1, `level:1.2`): đến Ga Ngầm Số 3, máy quét ở đó phân loại từng trường, sai loại là bị giữ lại. Briefing nhặt lại đúng câu "sai loại là bị giữ lại" đó.

Briefing là nhật ký hệ thống của Ga Ngầm Số 3, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- sân ga bỏ hoang nhưng máy quét phân loại của OMNI vẫn chạy, có bốn làn màu, mỗi trường hồ sơ phải rơi đúng làn của nó;
- máy quét không đọc nội dung, chỉ đọc loại của từng trường; sai loại là bị giữ lại;
- hồ sơ ĐỖ MINH AN được chép tay từ bản tin của 0xA7 (gieo lý do code gốc có lỗi), và đây là lượt gửi thử trước khi mang qua thật;
- mỗi lượt gửi máy quét cấp một mã phiên và hồ sơ phải khai kèm khuôn của mã phiên đó (gieo cho mục tiêu `khuon_phien` và cho phản công).

Briefing nói "loại", không gọi tên kiểu nào của Python.

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên ga.

Ngay dưới briefing là ô **Việc cần làm** (mục 15).

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Việc cần làm, mục tiêu, ECHO, gợi ý | Code editor, terminal | Máy phân loại bốn làn (tiêu đề ô: `location`) |

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

Nhãn hiển thị: `objectives[].label` (D1, `level:1.3`). Nhãn gọi tên trường hồ sơ bằng lời thường; nhãn chiều cao ghi đơn vị mét, nhãn `da_tiem` nói rõ đây là câu hỏi có hay không, nhãn `khuon_phien` nói nó là hình dạng của mã phiên. Hình dạng cần đã hiện ở chip màu cạnh mỗi mục, nên nhãn không nhắc lại.

| Biến | Hình dạng | Giá trị đúng |
|---|---|---|
| `ho_ten` | `str` | `"ĐỖ MINH AN"` |
| `tuoi` | `int` | `27` |
| `chieu_cao` | `float` | `1.72` |
| `da_tiem` | `bool` | `True` |
| `khuon_phien` | `type` (mới) | `int` (lượt thường), `str` (phản công) |

- **Mức cảnh báo ≤ 40%**: ≤ 7 câu lệnh thực thi (dòng khóa không tính). 100% = 17 câu lệnh. Code khởi đầu có 6 câu lệnh (34%).
- Mục tiêu loại `type` được chấm: giá trị là một đối tượng kiểu (`type(v) is type`) và đúng là kiểu kỳ vọng (`v is int`). Chuỗi `"int"` hay `"<class 'int'>"` bị từ chối nhưng được tính "khớp nội dung" (`type_mismatch_value_match`).

## 5. Mô phỏng: máy phân loại bốn làn (`"simulation": "sorter"`)

Khung SVG 420 × 470, cùng cơ chế phát lại với máy quét 1.4 (timeline thuần dữ liệu, chạy sau khi có kết quả, nút "Bỏ qua hoạt cảnh" và `Esc`).

- **Băng chuyền** (cột trái): các gói xếp hàng theo thứ tự mục tiêu. Trước khi chạy, gói là khối xám mang tên biến.
- **Cổng quét** (giữa): mỗi gói đi qua, tia quét nhuộm gói theo **hình dạng thật** của nó (`toneOf(type)`), nhãn nhỏ hiện tên kiểu thật (`str`, `int`, `tuple`…).
- **Bốn làn** (phải, xếp dọc từ trên xuống): vàng `str`, xanh dương `int`, tím `float`, đỏ `bool`. Cuối mỗi làn là các khe có tên những biến được đòi ở làn đó (làn xanh: `tuoi`; làn vàng: `ho_ten`…). Làn luôn đủ bốn, kể cả khi level không có mục tiêu ở làn đó (khi đó làn không có khe).
- **Thẻ mã phiên và khe khuôn** (dải trên cùng): thẻ `ma_phien` tô theo hình dạng của mã phiên của lượt đó (xanh ở lượt thường, vàng ở phản công). Bên cạnh là khe "KHUÔN".
- **Thùng giữ lại** (đáy, vạch cảnh báo chéo): nơi gói sai rơi xuống, hình ảnh của câu "sai loại là bị giữ lại" trong briefing.
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

Dòng cảnh báo là `counter_attack_banner` (D1, `level:1.3`): OMNI cấp lại mã phiên. Ngay sau đó terminal hiện giá trị mới `ma_phien = "7351"`.

Mã phiên mới trông vẫn như một con số nhưng là chuỗi. Kỳ vọng: `khuon_phien` là `str`; các trường hồ sơ không đổi. Bắt được lỗi **giả định hình dạng**: người chơi nhìn thấy `4096`, kết luận "là số nguyên" và chép tay `khuon_phien = int`. Người hỏi thẳng giá trị (`type(ma_phien)`) qua. Người viết `type(ma_phien + 0)` hay dùng `ma_phien` trong phép tính số thì vỡ ở phản công (`counter_error`), giữ 2 sao.

## 9. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:1.3`).

**Từ cấm của 1.3** (`forbidden_terms` trong JSON, cộng danh sách chung `int|float|round` và mọi giá trị `expected` tự động, kể cả `"int"`/`"str"` của mục tiêu `type`; áp cho mọi phản ứng miễn phí, kể cả `entry`, và nhịp `echo` trong `outro_beats`; so theo ranh giới từ, không phân biệt hoa thường; không áp cho gợi ý). Danh sách gồm hai loại từ: tên các kiểu Python (bốn kiểu của level, `type`, `tuple`) cùng hai giá trị đúng/sai, và những từ gọi tên cách viết làm đổi hình dạng (dấu chấm, dấu phẩy, dấu nháy, chữ hoa…). Lý do: ô Mục tiêu đã cho biết hình dạng mỗi trường cần, nên thứ lộ cách sửa ở level này là **cách viết** (dấu câu, chữ hoa) và **tên kiểu gắn với một biến**. ECHO nói "hình dạng", "làn", "khuôn", "cách viết"; tên kiểu chỉ xuất hiện ở máy quét, terminal, ô Mục tiêu và gợi ý 3.

**Gợi ý** (mở dần, giọng ECHO):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Hình dạng của một giá trị nằm ở cách viết ra nó; máy quét đọc cách viết, không đọc ý nghĩa. Không chỉ trường nào sai |
| 2 (`hints[1]`) | Quy trình: lần lượt từng trường, hỏi hình dạng hiện giờ, so với làn máy quét đòi, viết lại theo cách viết của làn đó. Nói thêm khuôn phiên không chép tay được, vì nó là hình dạng của mã phiên và mỗi lượt phải hỏi lại (gieo cho phản công) |
| 3 (`hints[2]`) | "Mảnh tài liệu Python còn đọc được": `type()` với bốn ví dụ khác đáp án, cách viết của từng kiểu, `x = 2, 5` là hai giá trị ghép lại chứ không phải hai rưỡi, `k = type(x)` giữ chính hình dạng của `x` lúc dòng đó chạy |

**Phản ứng miễn phí** của ECHO: giọng cụt, nói bằng từ ngữ của máy quét (làn, thùng giữ lại, khuôn), chỉ chỗ nhìn, không nói cách sửa và không gọi tên kiểu. Các khóa chính:

| Khóa | Ý đồ |
|---|---|
| `entry` | Đặt cảnh Ga Ngầm Số 3: máy quét chia hồ sơ vào bốn làn màu, không đọc nội dung mà chỉ đọc hình dạng |
| `type_mismatch` | Máy quét giữ lại những trường nào ({vars}), sai làn; nó xếp làn theo hình dạng, ý nghĩa không tính |
| `type_mismatch_value_match` | Nội dung khớp mà hình dạng thì không; in ra trông giống nhau nhưng với máy quét là hai vật khác nhau |
| `type_mismatch_unknown_shape` (mới) | Trường mang hình dạng không thuộc bốn làn, máy quét không có chỗ cho nó; bảo nhìn lại từng ký tự trên dòng đó, vì một ký tự có thể đổi cả hình dạng (chỉ về dấu phẩy mà không gọi tên) |
| `wrong_value` | Đúng hình dạng, vào đúng làn, nhưng nội dung không khớp hồ sơ |
| `NameError` | Python không biết cái tên này; với nó mỗi ký tự đều tính (chỉ về chữ hoa mà không gọi tên) |
| `alert_exceeded` | Mọi trường đã vào đúng làn, nhưng {count} câu lệnh là quá nhiều; mỗi lần hỏi là một lần OMNI nghe thấy |
| `wrong_value_counter` | Chép tay khuôn, trượt phản công: OMNI cấp lại mã phiên, hình dạng đã đổi mà khuôn đứng yên, khắc cho mã phiên cũ |
| `three_stars` | OMNI đổi hình dạng mã phiên và khuôn đổi theo; ECHO ghi nhận, ngắn |

Các khóa lỗi chung (`SyntaxError`, `TypeError`, `timeout`, `blocked_import`, `input_unsupported`…) nói lỗi bằng từ ngữ của sân ga, máy quét và mã phiên nằm sẵn trong bộ đệm.

`reaction_variants` (25/10/2026) có câu thay thế cho `type_mismatch` và `wrong_value` khi cùng khóa lặp ở lượt kế tiếp: nói trường "vẫn" sai và chỉ thêm một chỗ để nhìn (máy quét xếp làn theo đúng cách giá trị viết ra; so từng ký tự với thứ máy quét chờ).

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

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:1.3`).

- `component`: Khuôn kiểu (thành phần 3/6).
- `outro`: máy quét chuyển xanh; trong nhật ký hiệu chỉnh của nó, giữa hàng nghìn dòng số, có một dòng chữ, dẫn vào mảnh nhật ký.
- `lore_fragment` (KTS-07): một Kiến Trúc Sư đã kiểm thử OMNI suốt ba năm, hàng nghìn lần chạy không một lỗi; OMNI không hỏng, và người viết ước gì nó hỏng.
- `outro_beats`, năm nhịp: log, cue `scan_reject` (sau máy quét, cuối sân ga, một người đưa tin Mạng Mù nằm úp mặt, không còn thở) → echo (chip của người đó vẫn phát, rất yếu) → card tín hiệu 0xA7, cue `glitch` (người đó không cần chip nữa, bạn thì cần; mang nó đến Cổng phía Bắc) → kai (làm sao 0xA7 biết có xác người ở đây) → echo (dữ liệu trong chip toàn là ký tự, gieo cho 1.4: dữ liệu đến dưới dạng chuỗi). Sau đó là màn "VÀO NHIỆM VỤ" của 1.4.
- Móc câu: 0xA7 biết trước có xác người ở cuối sân ga.

**Manh mối cài sẵn (có chủ ý, main agent đã duyệt):** tuổi `27` và chiều cao `1.72` của hồ sơ ĐỖ MINH AN trùng với dữ liệu trong chip của người đưa tin chết mà người chơi giải mã ở 1.4 (`"27"`, `"1.72"`). Không nhân vật nào nói ra điều này trong Chương 1. Người chơi tinh ý sẽ tự hỏi: 0xA7 dựng danh tính giả theo đúng số đo của một người sắp chết? Câu hỏi đó cộng hưởng với KTS-03 ("Đừng tin tín hiệu nào mang mã 0xA7"). Level nào đổi các giá trị này thì phải đổi cả hai nơi.

Nhẹ nhàng ôn 1.1–1.2: `ho_ten` dùng lại tên giả từ 1.2; `print(...)` là công cụ quen từ 1.1, giờ dùng để dò; `khuon_phien = ma_phien` ở code gốc là phép gán biến bằng biến của 1.2, và chính nó là lỗi.

## 12. Người chơi lần lượt làm gì

1. Đoạn chuyển cảnh sau 1.2 kết bằng tín hiệu 0xA7. Màn "VÀO NHIỆM VỤ" ghi chương, số và tên level, rồi `location`. Bấm, âm thanh mở khóa.
2. Briefing gõ chữ (`teletype`). Năm mục tiêu khóa vào, mỗi mục một tiếng `objective_lock`; chip `str` vàng, `int` xanh, `float` tím, `bool` đỏ, `type` viền xám. Thanh cảnh báo sáng; ECHO nói câu `entry`.
3. Mô phỏng nghỉ: băng chuyền có năm gói xám, thẻ mã phiên màu xanh, bốn làn trống. Chip đầu vào: `> ma_phien = 4096`.
4. Người chơi đọc code, chưa hiểu `1,72` sai ở đâu, bấm CHẠY luôn (lần 1). Hoạt cảnh: `ho_ten` khóa làn vàng (`scan_pass`); ba gói chạy vào làn sai rồi rơi thùng, một gói xám rơi thẳng (`scan_reject` mỗi lần), cuối cùng `alarm`. Terminal liệt kê năm dòng; ĐẦU RA có `<class 'str'>`. ECHO: `type_mismatch`, {vars} là `tuoi, chieu_cao, da_tiem, khuon_phien`.
5. Người chơi so cột chip trong ô Mục tiêu với dòng terminal. Sửa `tuoi = 27`. Với `da_tiem` đoán `true` (lần 2): `NameError` dòng 8, dòng 8 tô đỏ, các gói không rời băng chuyền. ECHO: `NameError`. Sửa thành `True`.
   - Ngã rẽ khác: `da_tiem = "True"` → gói vào làn vàng, xuống thùng; nếu đó là trường sai duy nhất, ECHO: `type_mismatch_value_match`.
6. Lần 3: chỉ còn `chieu_cao` xám và `khuon_phien`. Người chơi sửa thử `chieu_cao = "1,72"` (làn vàng, rơi thùng) hoặc `chieu_cao = 172` (làn xanh, rơi thùng). Khi `chieu_cao` là trường sai duy nhất mà vẫn là tuple, ECHO: `type_mismatch_unknown_shape`, bảo nhìn lại từng ký tự trên dòng đó. Người chơi nhận ra dấu phẩy, viết `1.72`. Gói tím khóa vào làn tím.
7. Còn `khuon_phien`. Terminal: "khuon_phien: int, yêu cầu type". Người chơi mở gợi ý 1 hoặc 2, hoặc nhìn dòng `print(type(ho_ten))`. Thêm `print(type(ma_phien))`, chạy: ĐẦU RA `<class 'int'>`.
   - Ngã rẽ: viết `khuon_phien = "int"` → gói vàng, xuống thùng, ECHO: `type_mismatch_value_match`.
8. Viết `khuon_phien = int`. Chạy: năm gói vào đúng chỗ, con dấu viền xanh khóa cạnh thẻ xanh, rào mở nửa (`gate_open`). Hộp kết quả: 2 sao (7 câu lệnh, 40%). Ngay sau đó phản công: banner đỏ, `siren`, thẻ mã phiên chuyển vàng, con dấu xanh đứng cạnh thẻ vàng: LỆCH KHUÔN, `alarm`, rào sập về nửa. Terminal: `> ma_phien = "7351"`. ECHO: `wrong_value_counter`.
9. Người chơi đổi thành `khuon_phien = type(ma_phien)`, xóa dòng `print(type(ma_phien))`. Chạy: 2 sao như cũ, rồi phản công: con dấu đổi sang viền vàng theo thẻ, KHỚP KHUÔN, rào mở hẳn (`gate_open`, `star`). ECHO: `three_stars`. Hộp kết quả: 3 sao, "Đã thu:" kèm tên thành phần (`component`), nút TIẾP TỤC.
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
| 23 | Level không có `forbidden_terms` (lúc viết là 1.4; từ 27/10/2026 1.4 đã có danh sách riêng) | Dùng mặc định `int/float/round`, kết quả như cũ | Có (`echo-leaks.test.ts`, ca "no level list") |
| 24 | Validator: mục tiêu `type` kỳ vọng `"list"`; input là object | Lỗi nêu tên trường | Có |
| 25 | Validator: input là số hoặc bool | Hợp lệ | Có (cùng test) |
| 26 | Input số thực tròn (`2.0`) | Thành `int` khi qua JSON; ghi chú, không dùng | Không |
| 27 | Level không có khóa `type_mismatch_unknown_shape` gặp tuple | Rơi về `type_mismatch` | Có (classify) |
| 28 | Dòng terminal phản công | `> ma_phien = "7351"` theo cú pháp Python | Có (terminal-lines) |
| 29 | Timeline máy phân loại: gói tuple, con dấu khuôn khớp/lệch, biến thiếu, lỗi Python | Đúng làn, đúng nhãn, đúng cue | Có (timeline thuần, 4 ca) |
| 30 | Giảm chuyển động, điện thoại 360 px | Khung cuối hiện ngay; không cuộn ngang | Không (kiểm tay) |
| 31 | Treo chỉ ở phản công | Giữ 2 sao, `counter_timeout` | Chung |

## 14. Dữ liệu chơi (`src/levels/level-1-3.json` và D1 `level:1.3`)

Câu đố nằm ở `src/levels/level-1-3.json`; câu chữ người chơi đọc nằm ở D1 (tài liệu `level:1.3`), không còn nằm trong file JSON (28/10/2026, QĐ-16). Hai chỗ đó là nguồn đúng duy nhất. Bản nháp JSON từng nằm ở đây đã lệch so với file thật (tên khóa `echo_forbidden_terms`, `simulation` dạng chuỗi), nên đã bỏ; các câu chép nguyên văn cũng đã bỏ vì cùng lý do (27/10/2026). File dùng mục tiêu loại `"type"`, input số/bool, các trường tùy chọn `location`, `component`, `outro_beats`, `simulation`, `forbidden_terms`, `reaction_variants`, `task_steps`, `knowledge_summary` và khóa `type_mismatch_unknown_shape`.

Văn bản người chơi đọc được rà lại ngày 25/10/2026 theo skill `van-viet-tu-nhien` (giọng truyện): briefing, nhãn `da_tiem` và `khuon_phien`, gợi ý 1 và 2, một số phản ứng và câu thay thế `type_mismatch`; đoạn kết, KTS-07 và nhịp truyện giữ nguyên.

Ghi chú cho người làm: giá trị kỳ vọng `"int"`/`"str"` của mục tiêu `type` được thêm vào tập "đáp án" của test lộ đáp án, nên không câu phản ứng nào được chứa chúng như một từ đứng riêng. Lời giải mẫu cho test tích hợp nên đặt ở `tests/fixtures/solutions/1.3/` (gốc, chỉ còn tuple, chỉ còn chuỗi "27", khuôn là chuỗi, 2 sao, 3 sao, NFD) để không trùng tên với lời giải của 1.4.

## 15. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:1.3`) (3 bước).

Giọng hướng dẫn, gọi người chơi là "bạn". Không chứa giá trị kỳ vọng (test so cả từ, không phân biệt hoa thường), nên hình dạng được tả bằng lời: "chuỗi", "số nguyên", "số thực", "đúng/sai". Được nhắc `type()` (từ cấm không áp cho `task_steps`). Ba bước lần lượt nói:

1. mỗi trường hồ sơ có một làn riêng ghi ở ô Mục tiêu (bốn hình dạng gọi bằng lời); viết lại giá trị cho hình dạng khớp với làn, giữ nguyên nội dung hồ sơ;
2. `khuon_phien` phải là hình dạng của `ma_phien`, không phải con số bên trong; đừng đoán mà hỏi Python bằng `type()`;
3. không sửa dòng khóa vì mã phiên do máy quét cấp; bấm CHẠY; xong khi cả 5 trường vào đúng làn và ô Mục tiêu chuyển xanh.

## 16. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:1.3`).

Hiện sau khi qua màn (≥ 1 sao), trước đoạn chuyển cảnh; xem lại được từ Bản đồ. Giọng kỹ thuật, không ECHO. Ví dụ khác đáp án (không dùng `27`, `1.72`, `True` như giá trị hồ sơ). Mọi `code` trong `sections` chạy bằng Python thật và in đúng `output` (`tests/integration/knowledge-summary.test.ts`).

Chủ đề: bốn kiểu cơ bản và hàm `type()`. Các mục phải dạy:

| Mục | Ý chính |
|---|---|
| Bốn kiểu cơ bản | Kiểu đến từ cách viết: nháy → `str`, số nguyên → `int`, có dấu chấm → `float`, `True`/`False` → `bool` |
| `type()` cho biết kiểu | In ra dạng `<class 'int'>`; `print` in `42` và `"42"` giống nhau, nên muốn chắc thì hỏi `type()` |
| Kiểu cũng là một giá trị | Gán được cho biến, so được với `str` (so với chuỗi `"str"` thì sai); `type()` đọc giá trị lúc chạy, tên kiểu chép tay thì đứng yên |
| Số thập phân dùng dấu chấm | Dấu phẩy tạo tuple, không báo lỗi |
| Có nháy và không có nháy | `"15"` khác `15`, `"False"` khác `False`; chuỗi và số không bao giờ bằng nhau |

Lỗi thường gặp (`mistakes`, không chạy trong test), đúng những lỗi người chơi gặp trong màn: dấu phẩy thập phân (tuple, không báo lỗi); `true` viết thường (`NameError`); `"True"` có nháy (chuỗi); số nguyên mở đầu bằng 0 (`SyntaxError`); tên kiểu trong dấu nháy (chuỗi, không phải kiểu).

`next` báo trước màn sau (1.4): dữ liệu đến dưới dạng chuỗi, chuyển sang số bằng `int()` và `float()` rồi tính toán.

# Level 1.2 – "Gán nhãn"

> Chương 1 – Vùng Tối · Độ khó: Easy · Khái niệm: biến, phép gán, gán lại
> Dữ liệu chơi: `src/levels/level-1-2.json`. Mọi câu chữ người chơi đọc nằm trong file này; GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Trục truyện: `design/gdd-mo-dau.md` mục 6.2. Brainstorm: `design/quyet-dinh/level-1-2-gan-nhan.md`.

## 1. Briefing

Câu chữ: `briefing` và `location` trong JSON.

Briefing nối thẳng từ thẻ 0xA7 cuối 1.1 (muốn qua Cổng phía Bắc cần một danh tính, chuẩn bị bộ nhớ). Nó là nhật ký hệ thống của Trạm Phát Khẩu Phần số 4, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- ki-ốt đăng ký Neural-ID ở góc trạm còn điện và OMNI đã quên nó;
- 0xA7 gửi danh tính thành từng gói xen tạp âm, nêu đủ ba giá trị (họ tên, mã khu cũ, số hiệu); bộ đệm chỉ đánh số gói, không biết gói nào là gì (vì thế người chơi phải gắn nhãn);
- ki-ốt chỉ đọc ô nhớ có nhãn, và máy quét drone cùng cổng khu đọc hồ sơ từ chính các ô đó; gõ lại bằng tay, lệch một ký tự là báo động (gieo trước cho phản công);
- dòng cuối là một gói đến muộn của 0xA7, có nhãn `[GÓI ĐẾN MUỘN · 0xA7]`: mã khu cũ vừa bị quét, đổi sang mã mới, và mã cũ phải nằm lại trong nhật ký ki-ốt. Đây là nguồn của bài gán lại và chép giá trị cũ.

Briefing được nêu giá trị (người chơi cần thấy hồ sơ để đối chiếu); lời ECHO thì không.

`location` là dòng địa điểm ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên Trạm Phát Khẩu Phần số 4.

Phần "Việc cần làm" ở mục 17.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, 6 mục tiêu (ECHO và gợi ý ở chat nổi) | Code editor (dòng 2–5 khóa) | Mô phỏng ki-ốt (mục 8), tiêu đề ô lấy từ `location` |

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Bộ đệm nhận từ 0xA7 (KHÔNG sửa 4 dòng này)
goi_1 = "ĐỖ MINH AN"
goi_2 = "K-12"
goi_3 = "AN-5521"
goi_4 = "K-07"

# Ô nhớ của ki-ốt. Mỗi ô một nhãn.
ho_ten = goi_1
ma_khu = goi_2
so_hieu = "goi_3"

# Hai thiết bị cùng đọc hồ sơ
the_quet = ho_ten + " / " + Ma_khu
the_cong = so_hieu + " / " + ma_khu

# 0xA7: mã khu cũ vừa bị quét. Ki-ốt ghi mã cũ vào nhật ký, rồi đổi sang mã mới.
ma_khu = goi_4
khu_cu = ma_khu

print(the_quet)
print(the_cong)
```

Bốn lỗi cài sẵn, cùng một khái niệm:

| Dòng | Lỗi | Bài học |
|---|---|---|
| 13 | `Ma_khu` viết hoa | Tên phân biệt hoa thường; gọi một tên chưa có là `NameError` |
| 10 | `"goi_3"` trong dấu nháy | Trong dấu nháy là chữ, không phải tên |
| 17 | Gán lại đặt sau hai thiết bị | Python chạy từ trên xuống; thiết bị đọc giá trị ở thời điểm dòng của nó chạy |
| 18 | `khu_cu = ma_khu` đặt sau câu gán lại | Gán lại thay giá trị từ dòng đó trở đi; muốn giữ giá trị cũ thì chép trước |

Chú thích dòng 16 nói đúng thứ tự cần làm, code làm ngược lại. Hai dòng thiết bị có `+ " / " +` được viết sẵn; người chơi không cần biết nối chuỗi, chỉ cần đọc. Hai lệnh `print` dùng lại kiến thức 1.1 và cho người chơi thấy thiết bị đọc được gì (stdout hiện ở terminal, không được chấm).

Bộ đệm được engine nạp sẵn; dòng 2–5 chỉ để hiển thị và bị thay bằng dòng trống trước khi chạy, nên số dòng trong traceback khớp editor và bốn dòng này không tính vào cảnh báo.

## 4. Mục tiêu

Tất cả kiểu `str`, so đúng từng ký tự sau khi chuẩn hóa NFC (xem `docs/hop-dong-engine-level-1-1-den-1-3.md` mục 3).

Nhãn hiển thị: `objectives[].label` trong JSON. Nhãn nói ô nào giữ gì, không ghi giá trị. Nhãn `ma_khu` và hai thiết bị phải nói rõ là mã mới, sau khi đổi; nhãn `khu_cu` nói là mã cũ, trước khi đổi, để thứ tự gán lại hiện ngay trong ô Mục tiêu.

| Biến | Ô giữ gì | Với dữ liệu trên |
|---|---|---|
| `ho_ten` | ô họ tên | `ĐỖ MINH AN` |
| `ma_khu` | ô mã khu, mã mới sau khi đổi | `K-07` |
| `so_hieu` | ô số hiệu | `AN-5521` |
| `khu_cu` | nhật ký ki-ốt, mã khu cũ trước khi đổi | `K-12` |
| `the_quet` | máy quét drone đọc: họ tên / mã khu mới | `ĐỖ MINH AN / K-07` |
| `the_cong` | cổng khu đọc: số hiệu / mã khu mới | `AN-5521 / K-07` |

Nhãn của hai thiết bị giữ dạng `Tên thiết bị: …`: mô phỏng lấy phần trước dấu hai chấm làm tiêu đề màn đọc.

**Mức cảnh báo ≤ 40%:** ≤ 11 câu lệnh. 100% là 27 câu lệnh; từ 28 câu lệnh bị Sentinel bắt.

Quy tắc đặt tên được dạy (chỉ những gì kiểm được hoặc gặp được trong level): phân biệt hoa thường (cài sẵn), tên phải có trước khi dùng (cài sẵn), tên trong dấu nháy là chữ (cài sẵn), không bắt đầu bằng chữ số, không có khoảng trắng; nên dùng chữ không dấu (Python vẫn nhận chữ có dấu, nhưng không dấu dễ gõ đúng hơn) (gợi ý 3; gõ sai thì gặp `SyntaxError` hoặc `missing_var`).

## 5. Diễn biến khi chạy

- **Code gốc:** chạy dòng 8, 9, 10 rồi dừng ở dòng 13: `NameError: name 'Ma_khu' is not defined`. Traceback trong bối cảnh, dòng 13 tô đỏ. Không có đầu ra. Mô phỏng: ba ô đầu sáng lên, máy quét drone nhiễu đỏ.
- **Sửa `Ma_khu`:** chạy hết, 9 câu lệnh. Đầu ra: `ĐỖ MINH AN / K-12` và `goi_3 / K-12`. Sai: `so_hieu` (`'goi_3'`), `khu_cu` (`'K-07'`), `the_quet`, `the_cong`. ECHO dùng khóa mới `value_is_label` cho `so_hieu`.
- **Sửa dấu nháy:** còn sai `khu_cu`, `the_quet`, `the_cong`. Mô phỏng cho thấy hai thiết bị đọc `K-12`, sau đó ô `ma_khu` mới bị ghi đè thành `K-07`, và ô nhật ký chép `K-07`. ECHO: `wrong_value`.
- **Đúng thứ tự:** cả 6 ô hợp lệ, 9 câu lệnh (33%), 2 sao, rồi OMNI phản công.

## 6. Lời giải tham khảo

Đạt 2 sao (gõ tay số hiệu và mã khu mới, trượt phản công):

```python
ho_ten = goi_1
ma_khu = goi_2
so_hieu = "AN-5521"
khu_cu = ma_khu
ma_khu = "K-07"
the_quet = ho_ten + " / " + ma_khu
the_cong = so_hieu + " / " + ma_khu
print(the_quet)
print(the_cong)
```

Đạt 3 sao (9 câu lệnh):

```python
ho_ten = goi_1
ma_khu = goi_2
so_hieu = goi_3
khu_cu = ma_khu
ma_khu = goi_4
the_quet = ho_ten + " / " + ma_khu
the_cong = so_hieu + " / " + ma_khu
print(the_quet)
print(the_cong)
```

Cách viết khác cũng được 3 sao: `khu_cu = goi_2` rồi `ma_khu = goi_4` (không gán lại), dời hai dòng thiết bị xuống dưới thay vì dời khối gán lại lên, hoặc bỏ hai lệnh `print`. Level không chấm theo cách viết, chỉ theo giá trị.

## 7. OMNI phản công (sao thứ 3)

Dòng cảnh báo là `counter_attack_banner` trong JSON: OMNI gửi hồ sơ kiểm tra vào bộ đệm. Ngay sau đó terminal hiện bộ đệm mới:

```
> goi_1 = "LÊ VĂN TỊNH"   goi_2 = "K-31"   goi_3 = "LT-0093"   goi_4 = "K-02"
```

Trong truyện: OMNI thử ki-ốt bằng một hồ sơ mồi. Ki-ốt thật chép đúng thứ nằm trong bộ đệm; ki-ốt bị can thiệp thì không. Giá trị đúng: `ho_ten` = `LÊ VĂN TỊNH`, `ma_khu` = `K-02`, `so_hieu` = `LT-0093`, `khu_cu` = `K-31`, `the_quet` = `LÊ VĂN TỊNH / K-02`, `the_cong` = `LT-0093 / K-02`.

Bắt được các lỗi phổ biến:
- Gõ tay giá trị briefing: `so_hieu = "AN-5521"`, `ma_khu = "K-07"`, `khu_cu = "K-12"`.
- Gõ tay một nửa thiết bị: `the_cong = so_hieu + " / K-07"`.
- Gõ lại họ tên (`"ĐỖ MINH AN"`), kể cả khi gõ đúng.

## 8. Mô phỏng: ki-ốt có ô nhớ dán nhãn

Thành phần mới `kiosk` (không phải biến thể máy quét: máy quét chỉ có 3 làn và không thể hiện được việc ghi đè). JSON chọn bằng `"simulation": {"kind": "kiosk", "devices": ["the_quet", "the_cong"]}`; mục tiêu không nằm trong `devices` là ô nhớ. Thiếu trường `simulation` thì dùng máy quét như 1.4. SVG/CSS, phát lại sau khi chạy xong.

**Bố cục (viewBox dọc, co theo ô):**
- **Trên: dải BỘ ĐỆM 0xA7.** 4 thẻ vàng `goi_1`…`goi_4` hiện giá trị đầu vào, có nhiễu nhẹ. Ở lượt phản công các thẻ đổi giá trị kèm còi `siren`.
- **Giữa: bộ nhớ ki-ốt.** Ô nhớ xếp lưới 2×2 (`ho_ten`, `ma_khu`, `so_hieu`, `khu_cu`). Mỗi ô có một thẻ nhãn treo phía trên (chính là "nhãn") và giá trị bên trong.
- **Dưới: hai thiết bị.** Màn đọc của MÁY QUÉT DRONE và CỔNG KHU, mỗi màn một dòng chữ.
- **Góc: drone tuần tra** bay ngang theo mức cảnh báo; vượt 40% thì nó dừng lại phía trên ki-ốt.

**Phát lại theo lịch sử gán** (`var_history` do harness ghi, mục 13):
1. Mỗi mục lịch sử là một nhịp ~350 ms: ô hoặc màn thiết bị nhận giá trị, thẻ nhãn sáng, cue `terminal_line`. Nếu giá trị trùng một thẻ trong bộ đệm, một sợi dây sáng nối thẻ đó với ô. Không trùng thẻ nào (gõ tay, dấu nháy) thì không có dây.
2. Khi một ô bị gán lại, giá trị cũ bong ra thành bóng mờ. Nếu một ô khác đang giữ đúng giá trị đó, bóng bay về ô ấy; nếu không, bóng tan sau ~1 giây. Đây là hình ảnh của KTS-05: cái tên giữ nguyên, giá trị bị thay.
3. Màn thiết bị giữ nguyên giá trị đã đọc dù ô nguồn đổi sau đó. Ở lần chạy sai thứ tự, người chơi thấy màn cổng hiện `… / K-12` trong lúc ô `ma_khu` đã là `K-07`.
4. Cuối lượt, ki-ốt đối chiếu từng ô và từng màn: viền xanh `HỢP LỆ`, đỏ `SAI GIÁ TRỊ`, xám `KHÔNG CÓ Ô` (thiếu biến). Cue `scan_pass` hoặc `scan_reject` cho mỗi ô, `alarm` nếu có ô sai.
5. Lỗi chạy: lịch sử phát tới dòng lỗi, rồi ô hoặc màn đang được ghi nhiễu đỏ và dòng trạng thái `TRUY VẾT: dòng 13`. Lỗi biên dịch: không ô nào sáng.
6. Đạt cơ bản: cổng khu mở một nửa (`gate_open`). Phản công: bộ đệm đổi, phát lại nhanh lịch sử của lượt phản công; ô nào không có dây nối bộ đệm thì hiện `LỆCH MẪU`. Qua hết: cổng mở hoàn toàn, `star`.

**Không có lịch sử** (harness cũ, lỗi biên dịch, quá thời gian): các ô hiện giá trị cuối theo thứ tự mục tiêu.
**Giảm chuyển động:** chỉ hiện khung cuối, không bóng mờ, không dây chạy; dây hiện tĩnh.
**Điện thoại:** cùng viewBox, chữ giá trị cắt bớt bằng `…` sau 14 ký tự, toàn văn nằm trong `<title>` của ô; trang không cuộn. Một câu tóm tắt cho trình đọc màn hình như `summarize` của máy quét.

## 9. Gợi ý

Câu chữ: `hints` trong JSON (mở dần, không bị kiểm từ cấm). Gợi ý 1 và 2 nói bằng từ ngữ của ki-ốt và bộ đệm; gợi ý 3 là "mảnh tài liệu Python còn đọc được".

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Ki-ốt chạy từng dòng từ trên xuống, không đọc cả đoạn mã một lần; mỗi thiết bị chỉ thấy thứ ô nhớ đang giữ đúng lúc dòng của nó chạy. Không nói dòng nào sai, không nói dời dòng nào |
| 2 (`hints[1]`) | Thứ tự ki-ốt cần, bốn bước: gắn nhãn cho từng gói, chép mã khu đang giữ sang ô nhật ký, gán lại ô mã khu bằng gói sửa, rồi mới cho hai thiết bị đọc. Kết bằng lời dặn không gõ lại giá trị nào, vì mọi thứ đã nằm trong bộ đệm. Không nêu tên gói nào |
| 3 (`hints[2]`) | Tài liệu với ví dụ `nhiet_do` / `bao_cao`, không trùng đáp án: gán (tên bên trái nhận giá trị bên phải), chép sang tên khác, gán lại thì tên kia vẫn giữ giá trị cũ, `print(tên)` khác `print("tên")`, quy tắc đặt tên (chữ cái không dấu, chữ số, `_`; không bắt đầu bằng chữ số, không khoảng trắng; khác hoa thường là hai tên khác nhau), dùng tên trước khi gán → `NameError` |

## 10. Phản ứng của ECHO

Câu chữ: `reactions` và `reaction_variants` trong JSON.

Giọng ECHO: cụt, dùng từ ngữ của ki-ốt (ô nhớ, nhãn, bộ đệm, hồ sơ, drone), chỉ chỗ nhìn, không bao giờ nói cách sửa hay giá trị đúng. Kiểu sai được gọi là "không phải chữ" (chưa dùng "hình dạng", bắt đầu từ 1.3).

| Khóa | Ý đồ |
|---|---|
| `entry` | Ki-ốt còn điện, nó không đọc gói tin mà chỉ đọc ô nhớ có nhãn; drone đi qua theo chu kỳ nên viết ít thôi (gieo mức cảnh báo) |
| `NameError` (code gốc) | Tới dòng lỗi, bộ nhớ chưa có ô nào mang cái nhãn được gọi; bảo soát từng ký tự. Không nói hoa thường |
| `value_is_label` (khóa mới) | Ô đang giữ chữ của một cái nhãn, còn thứ nhãn ấy dán lên thì không có trong ô. Không nói dấu nháy |
| `wrong_value` | Biến nào lệch hồ sơ 0xA7 gửi; bảo xem lại từng thiết bị đã nhận gì |
| `value_overwritten` (25/10/2026) | Ô nhật ký chép mã khu sau khi mã khu đã bị gán lại: ô chép thứ ô nguồn đang giữ lúc này, không thấy thứ ô nguồn giữ trước lần gán lại |
| `missing_var` | Chạy xong, bộ nhớ ki-ốt không có ô nào mang nhãn đó |
| `alert_exceeded` | Hồ sơ khớp nhưng quá nhiều câu lệnh, drone đã chậm lại trên đầu ki-ốt; bảo chạy gọn hơn |
| `wrong_value_counter` | Gõ tay, trượt phản công: OMNI thay hồ sơ trong bộ đệm mà các ô đó vẫn giữ hồ sơ cũ, vì chúng không đọc bộ đệm, thứ trong ô đã gõ sẵn từ trước |
| `two_stars` | Ki-ốt nhận hồ sơ, drone bay qua không dừng |
| `three_stars` | OMNI thay cả bộ đệm mà từng ô chép theo không sót; OMNI không tìm ra dấu tay nào trên hồ sơ |

Các khóa lỗi chung (`SyntaxError`, `TypeError`, `timeout`, `input_unsupported`…) nói lỗi bằng từ ngữ của ki-ốt, bộ đệm và drone.

Khóa `value_overwritten` thay `wrong_value` khi **mọi** biến sai giá trị đang giữ đúng giá trị hiện tại của một biến mục tiêu khác đã bị gán lại trong lượt chạy (lịch sử gán có ít nhất hai giá trị). Ví dụ `ma_khu = goi_4` đặt trước `khu_cu = ma_khu`: chỉ `khu_cu` sai và nó giữ `K-07`. Cách chấm không đổi: `khu_cu = goi_2` vẫn đạt 3 sao (quyết định 25/10/2026).

`reaction_variants` có câu thay thế cho `wrong_value`, `value_is_label` và `value_overwritten` khi cùng khóa lặp ở lượt kế tiếp: nói "vẫn" sai và thêm một chỗ để nhìn. `wrong_value`: ki-ốt chạy từng dòng từ trên xuống, mỗi ô chỉ nhận thứ có mặt đúng lúc dòng gán của nó chạy. `value_is_label`: ki-ốt chép nguyên văn, không tra xem nhãn dán lên gói nào. `value_overwritten`: lúc dòng chép chạy, ô nguồn đã bị gán lại rồi.

**Từ cấm riêng của 1.2** (`forbidden_terms`, cộng với danh sách chung `int|float|round`): tên bốn gói trong bộ đệm (chỉ thẳng nguồn đúng) và những từ chỉ cách sửa (dấu nháy, hoa thường, đổi chỗ, dời lên hay xuống). Danh sách đầy đủ nằm trong JSON. Test chống lộ còn cấm mọi giá trị `expected` của cả hai lượt, nên không câu ECHO nào được nhắc họ tên, mã khu hay số hiệu, kể cả giá trị phản công. Áp cho `reactions` và lời ECHO trong `outro_beats`; không áp cho gợi ý.

## 11. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | 6 ô đúng giá trị |
| ⭐⭐ | Thêm: ≤ 11 câu lệnh (≤ 40%) |
| ⭐⭐⭐ | Thêm: vượt qua hồ sơ kiểm tra của OMNI |
| 0 sao | ≥ 28 câu lệnh: bị Sentinel bắt, không chạy phản công |

## 12. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` trong JSON.

- **Đoạn kết (`outro`):** ki-ốt nhận hồ sơ (nêu tên ĐỖ MINH AN); trong nhật ký quản trị của nó có một dòng không thuộc về OMNI, dẫn vào mảnh nhật ký.
- **Mảnh nhật ký (`lore_fragment`), KTS-05:** người viết là người thiết kế Neural-ID. Tái định hướng chỉ là một phép gán lại: cái tên giữ nguyên, giá trị bị thay. Họ chưa tìm ra cách lấy lại giá trị cũ, nhưng giá trị đó không bị xóa ngay.
- **Thẻ thành phần (`component`):** Hồ sơ danh tính (ô 2/6; dòng `NEURAL-ID GIẢ · THÀNH PHẦN 2/6` do `build-story.ts` dựng).
- **Nhịp truyện (`outro_beats`), ba nhịp:** kai (Nhi chưa bị xóa) → echo (dòng log nói "không bị xóa ngay" nhưng không nói còn bao lâu) → card tín hiệu 0xA7, cue `glitch` (hồ sơ đã nhận; đến Ga Ngầm Số 3, máy quét ở đó phân loại từng trường, sai loại là bị giữ lại; gieo cho 1.3).
- **Móc câu:** giá trị cũ của Nhi còn ở đâu, còn bao lâu; máy quét phân loại "theo loại" là gì. Người chơi vừa tự tay thấy một giá trị cũ còn sống nếu có một tên khác giữ nó, nên câu của KTS-05 có sức nặng.

## 13. Thay đổi engine (tóm tắt; chi tiết trong brainstorm)

- `REACTION_KEYS` thêm `value_is_label`; `classify-run.ts` trả khóa này khi một biến chuỗi sai giá trị đúng bằng `'<tên>'` của một biến đầu vào hoặc mục tiêu, chỉ khi level định nghĩa khóa.
- `LevelDefinition` thêm `simulation?` và `forbidden_terms?` (cùng `location`, `component`, `outro_beats` của thiết kế mở đầu); `validate-level.ts` kiểm chúng.
- `harness.py`: khi `trace_vars` bật, ghi `var_history` (tối đa 40 mục `{line, var, type, preview, src}`, so bằng `is`, không chạy code người chơi; `src` là tên biến đầu vào có đối tượng gốc chính là giá trị mới, để dây nối bộ đệm không nối cho giá trị gõ tay). `build-config.ts` bật cờ này cho `kiosk`.
- `kiosk-timeline.ts` (thuần, test được) và `kiosk-simulation.tsx` mới; `game-screen.tsx` chọn theo `simulation.kind`.
- Test chống lộ dùng thêm `forbidden_terms`. Từ cấm khớp không phân biệt hoa thường, nguyên từ theo ranh giới chữ Unicode; từ chỉ gồm dấu câu khớp chuỗi con (`src/game/echo-leaks.ts`).

## 14. Người chơi lần lượt làm gì

1. Qua đoạn chuyển cảnh sau 1.1 (thẻ 0xA7 bảo chuẩn bị bộ nhớ), gặp màn "VÀO NHIỆM VỤ": *1.2 Gán nhãn · Trạm Phát Khẩu Phần số 4*. Bấm Enter, âm thanh mở khóa.
2. Briefing gõ chữ với `teletype`; dòng "GÓI ĐẾN MUỘN" hiện cuối cùng. Sáu mục tiêu khóa vào, mỗi mục một `objective_lock`. Thanh cảnh báo sáng. ECHO nói câu vào màn (`entry`); "Việc cần làm" nối vào tin nhắn đó.
3. Người chơi đọc code, thấy bộ đệm khóa (gõ vào dòng 2–5 nghe `locked_bump`). Bấm CHẠY.
4. **Lần 1:** terminal: `SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP`, `TRUY VẾT: dòng 13 — NameError: name 'Ma_khu' is not defined`, cảnh báo 15% (4/11). Dòng 13 tô đỏ, bấm dòng truy vết để nhảy tới. Mô phỏng: ba ô đầu sáng, máy quét drone nhiễu đỏ, `alarm`. ECHO: câu `NameError`. Người chơi so `Ma_khu` với `ma_khu` ở dòng 9, sửa.
   - *Rẽ sai:* thêm dòng `Ma_khu = goi_2` ngay trên dòng 13. Chạy được, nhưng có thêm một ô lạ không ai đọc và vẫn rơi vào lỗi thứ tự ở bước 6. Không phạt riêng, chỉ tốn một câu lệnh.
5. **Lần 2:** chạy hết. Đầu ra `ĐỖ MINH AN / K-12`, `goi_3 / K-12`. Terminal: `HỢP LỆ: ho_ten`, `HỢP LỆ: ma_khu`, `SAI GIÁ TRỊ: so_hieu = 'goi_3'`, và ba dòng sai khác. Mô phỏng: ô `so_hieu` chứa chữ `"goi_3"`, không có dây nối bộ đệm. ECHO: `value_is_label`. Người chơi nhận ra dấu nháy biến cái tên thành chữ.
   - *Rẽ sai thường gặp:* sửa thành `so_hieu = "AN-5521"` (gõ tay). Lần chạy sau vẫn qua ô này; cái giá đến ở phản công (bước 8).
6. **Lần 3:** còn sai `khu_cu`, `the_quet`, `the_cong`. Mô phỏng phát lại: ô `ma_khu` nhận `K-12`, hai màn thiết bị đọc `K-12`, rồi `ma_khu` bị ghi đè thành `K-07`, bóng `K-12` tan, ô nhật ký chép `K-07`. ECHO: `wrong_value`. Người chơi đọc lại chú thích dòng 16 hoặc mở gợi ý 1.
   - *Rẽ sai:* chỉ đổi chỗ dòng 17 và 18 → `khu_cu` đúng, hai thiết bị vẫn đọc `K-12`. *Rẽ sai khác:* viết `khu_cu = "K-12"` → qua cơ bản, trượt phản công. *Rẽ sai khác:* viết `goi_4 = ma_khu` (ngược chiều) → `ma_khu` vẫn `K-12`; gợi ý 3 nói rõ tên bên trái nhận giá trị. Viết `"K-07" = ma_khu` → `SyntaxError`, chưa ô nào được ghi.
7. **Lần 4:** dời `khu_cu = ma_khu` và `ma_khu = goi_4` lên trên hai thiết bị. 6 ô xanh, 9/11 lệnh (33%), cổng khu mở một nửa, `gate_open`.
   - *Rẽ sai:* thêm 4 lệnh `print` để soi từng ô → 13 lệnh (47%), terminal `TÍN HIỆU BỊ GHI NHẬN`, drone dừng trên ki-ốt, 1 sao, ECHO `alert_exceeded`. Xóa bớt thì về 2 sao.
8. **Phản công:** còi `siren`, màn hình rung, bộ đệm đổi sang hồ sơ `LÊ VĂN TỊNH`. Nếu người chơi đã gõ tay `"AN-5521"`: terminal `LỆCH MẪU: so_hieu = 'AN-5521'`, `LỆCH MẪU: the_cong = …`, cổng sập về nửa. Mô phỏng: ô `so_hieu` không có dây nối bộ đệm mới. ECHO: `wrong_value_counter`. Giữ 2 sao.
9. **Lần 5:** đổi thành `so_hieu = goi_3`. Qua cả hai lượt: cổng mở hoàn toàn, `star`, ECHO `three_stars`. Hộp kết quả: 3 sao, số lần chạy, 9 câu lệnh, 33%, số gợi ý đã mở, "Đã thu: Hồ sơ danh tính". Bấm TIẾP TỤC sang đoạn chuyển cảnh `after-1.2`.

## 15. Trường hợp biên

"Test" = đáng có test tự động (chấm đúng, luật sao, chống lộ, an toàn khi crash). Ký hiệu: I = integration với harness thật (`tests/integration`, fixture riêng `tests/fixtures/solutions/1-2/`), P = unittest Python, U = Vitest đơn vị.

| # | Tình huống | Kết quả mong đợi | Test |
|---|---|---|---|
| 1 | Code khởi đầu | `NameError` dòng 13, 4 câu lệnh, 0 sao | I |
| 2 | Chỉ sửa `Ma_khu` | `value_is_label`, `vars` = `so_hieu` | I |
| 3 | Sửa thêm dấu nháy, giữ sai thứ tự | `wrong_value` ở `khu_cu`, `the_quet`, `the_cong` | I |
| 4 | Lời giải 3 sao (mục 6) | `three_stars`, 9 câu lệnh | I |
| 5 | Gõ tay `"AN-5521"`, `"K-07"` hoặc `"K-12"` | 2 sao, `wrong_value_counter` | I |
| 6 | `so_hieu = "goi_3 "` (thừa khoảng trắng), `the_cong = "so_hieu"` | Cái đầu là `wrong_value`; cái sau là `value_is_label` (tên mục tiêu cũng tính) | U |
| 7 | Level không định nghĩa `value_is_label` | Vẫn trả `wrong_value` | U |
| 8 | Lời giải không gán lại (`khu_cu = goi_2`) hoặc thiết bị đọc thẳng `goi_x` | 3 sao (chủ đích) | Không |
| 9 | 13 câu lệnh / 28 câu lệnh | 1 sao / 0 sao, không phản công | Không (luật chung đã có test) |
| 10 | Gõ lại "ĐỖ MINH AN" bằng bộ gõ sinh dấu tổ hợp | Harness chuẩn hóa NFC nên qua lượt cơ bản; trượt phản công (`wrong_value_counter`); mô phỏng không nối dây vì là giá trị gõ tay | Không (ghi trong tài liệu) |
| 11 | Tên có dấu `mã_khu = goi_2` | Hợp lệ với Python; `ma_khu` thiếu → `NameError` hoặc `missing_var` | Không |
| 12 | `1khu = …`, `ma khu = …`, `"K-07" = ma_khu` | `SyntaxError` đúng dòng, mô phỏng không ô nào sáng | Không |
| 13 | `ma_khu = 7` | `TypeError` dòng 13 (ghép chữ với số) | Không |
| 14 | Gán vào gói `goi_4 = "K-99"` | Được phép, sai giá trị; mỗi test nạp lại bộ đệm | Không |
| 15 | `del ma_khu` sau khi thiết bị đọc | `missing_var` cho `ma_khu` | Không |
| 16 | `while True: ma_khu = goi_4` | Hết ngân sách → `timeout`; `var_history` tối đa 40 mục, cờ truncated, không chậm | P |
| 17 | Biến mục tiêu là đối tượng có `__eq__`/`__repr__` ném lỗi hoặc treo | Lịch sử so bằng `is`, xem trước bằng `_preview`, không gọi code người chơi | P |
| 18 | Số dòng trong `var_history` | Khớp dòng editor (8, 9, 10, 11…); có cả mục trước dòng lỗi | P |
| 19 | 1.4 không bật `trace_vars` | Báo cáo harness không có `var_history`, kết quả không đổi | P |
| 20 | Phản ứng miễn phí và nhịp ECHO của 1.2 | Không chứa từ cấm chung, `forbidden_terms` (so được chữ có dấu) hay giá trị `expected` của cả hai lượt | U |
| 21 | `simulation.devices` chứa tên không phải mục tiêu, `kind` lạ, `forbidden_terms` sai kiểu | Validator báo lỗi nêu tên trường; level hiện "TÍN HIỆU HỎNG" | U |
| 22 | `kiosk-timeline` với lỗi chạy giữa chừng, thiếu lịch sử, phản công lệch mẫu | Khung hình dừng đúng chỗ; lùi về giá trị cuối khi thiếu lịch sử | U |
| 23 | Giảm chuyển động, điện thoại 360 px | Chỉ khung cuối; 2×2 ô vừa khung, chữ cắt `…` | Không (kiểm bằng tay) |
| 24 | Đi hết level trong trình duyệt thật | Code gốc → `NameError` → lời giải → 3 sao | Một e2e Chromium (`gotoLevel(page, "1.2")`) |

## 16. Dữ liệu level

Dữ liệu chơi nằm ở `src/levels/level-1-2.json` và là nguồn đúng duy nhất, kể cả mọi câu chữ người chơi đọc. Bản nháp JSON và các câu chép nguyên văn từng nằm ở đây đã bỏ vì chúng lệch dần với file thật (27/10/2026). Văn bản người chơi đọc được rà lại ngày 25/10/2026.

Ghi chú về dữ liệu: `simulation` là `{"kind": "kiosk", "devices": ["the_quet", "the_cong"]}`; bốn biến đầu vào `goi_1`…`goi_4` nằm ở dòng khóa 2–5; `alert_limit_statements` là 11. Code khởi đầu và hai lời giải ở mục 6 đã chạy qua `harness.py` bằng `python3`, và lời ECHO đã qua kiểm chống lộ.

## 17. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` trong JSON (4 bước).

"Việc cần làm" nối vào tin nhắn "Vào nhiệm vụ" đầu tiên của ECHO trong chat. Giọng hướng dẫn, lời thường, chủ ngữ là người chơi; không chứa giá trị kỳ vọng nào (validator kiểm). Bốn bước lần lượt nói:

1. gán `ho_ten`, `ma_khu`, `so_hieu` bằng tên gói tương ứng trong bộ đệm, không gõ lại giá trị nào bằng tay;
2. chép mã khu đang có vào `khu_cu` trước khi đổi `ma_khu` sang mã mới;
3. cho hai thiết bị `the_quet` và `the_cong` đọc sau cùng, khi mọi ô nhớ đã giữ đúng giá trị;
4. bấm CHẠY; xong khi cả 6 mục tiêu chuyển xanh.

Bước 1 nói "tên gói" mà không nêu `goi_x` nào; bước 2 và 3 nói thứ tự cần đạt, không nói dời dòng nào.

## 18. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` trong JSON.

Mở sau khi qua level (≥ 1 sao), xem lại được từ Bản đồ. Giọng kỹ thuật, không có ECHO, không từ ngữ game. Mọi ví dụ khác đáp án của level; mọi `code` trong mục được chạy bằng `python3` trong `tests/integration/knowledge-summary.test.ts` và phải in đúng `output`.

Chủ đề: biến, phép gán và gán lại. Các mục phải dạy:

| Mục | Ý chính |
|---|---|
| Biến là một cái tên trỏ tới giá trị | Viết tên ở đâu, Python dùng giá trị tên đó đang trỏ tới |
| Dấu `=` gán từ phải sang trái | Tính vế phải, gắn cho tên bên trái; vế trái phải là tên biến; `=` không phải so sánh bằng |
| Dùng lại giá trị qua tên | Gán bằng tên biến khác thì nhận cùng giá trị, không cần gõ lại; trong dấu nháy là chuỗi |
| Code chạy từ trên xuống, gán lại thay giá trị từ dòng đó trở đi | Dòng chạy trước đã dùng giá trị cũ, không tự đổi |
| Chép giá trị cũ trước khi gán lại | Chép trước dòng gán lại; chép sau thì chỉ nhận giá trị mới |
| Quy tắc đặt tên | Không khoảng trắng, không bắt đầu bằng chữ số (sai thì `SyntaxError`), phân biệt hoa thường; nên dùng snake_case không dấu dù Python nhận chữ có dấu |

Lỗi đã gặp trong màn (`mistakes`, không chạy trong test), mỗi lỗi có ví dụ riêng khác đáp án: gọi tên sai hoa thường → `NameError`; tên biến nằm trong dấu nháy thì in ra chữ của tên; dùng giá trị trước khi gán lại; chép sau khi gán lại; đặt chuỗi ở vế trái của `=` → `SyntaxError`. Ba trường hợp giữa không báo lỗi nhưng cho giá trị sai.

`next` báo trước màn sau: mỗi giá trị có một kiểu; bốn kiểu dữ liệu cơ bản và cách hỏi Python một giá trị thuộc kiểu nào.

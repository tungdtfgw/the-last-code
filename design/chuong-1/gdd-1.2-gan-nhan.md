# Level 1.2 – "Gán nhãn"

> Chương 1 – Vùng Tối · Độ khó: Easy · Khái niệm: biến, phép gán, gán lại
> Dữ liệu chơi (bản nháp ở mục 16): `src/levels/level-1-2.json`. Thiết kế tổng: `design/gdd.md`. Trục truyện: `design/gdd-mo-dau.md` mục 6.2. Brainstorm: `plans/reports/brainstorm-261025-0928-level-1-2-gan-nhan.md`.

## 1. Briefing

Nối từ câu cuối của 1.1 (0xA7: "Muốn qua Cổng phía Bắc, cần một danh tính. Chuẩn bị bộ nhớ.").

> **[NHẬT KÝ HỆ THỐNG – TRẠM PHÁT KHẨU PHẦN SỐ 4]**
> Ki-ốt đăng ký Neural-ID ở góc trạm vẫn còn điện. OMNI đã quên nó.
> 0xA7 gửi danh tính thành từng gói, xen tạp âm: họ tên ĐỖ MINH AN, mã khu K-12, số hiệu AN-5521. Bộ đệm chỉ đánh số gói. Nó không biết gói nào là gì.
> Ki-ốt chỉ đọc ô nhớ có nhãn. Máy quét drone và cổng khu đọc hồ sơ từ chính các ô đó. Gõ lại bằng tay, lệch một ký tự là báo động.
> **[GÓI ĐẾN MUỘN · 0xA7]** K-12 vừa bị quét. Đổi sang K-07. Mã cũ phải nằm lại trong nhật ký ki-ốt.

Ngay dưới briefing là ô **Việc cần làm** (mục 17).

Màn "VÀO NHIỆM VỤ" lấy dòng địa điểm từ `location`: *Trạm Phát Khẩu Phần số 4*.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, 6 mục tiêu, ECHO, gợi ý | Code editor (dòng 2–5 khóa) | Mô phỏng ki-ốt (mục 8), tiêu đề ô lấy từ `location` |

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

Tất cả kiểu `str`, so đúng từng ký tự sau khi chuẩn hóa NFC (xem `plans/reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md` mục 3).

| Biến | Nhãn hiển thị | Với dữ liệu trên |
|---|---|---|
| `ho_ten` | Ô họ tên | `ĐỖ MINH AN` |
| `ma_khu` | Ô mã khu: mã mới, sau khi đổi | `K-07` |
| `so_hieu` | Ô số hiệu | `AN-5521` |
| `khu_cu` | Nhật ký ki-ốt: mã khu cũ, trước khi đổi | `K-12` |
| `the_quet` | Máy quét drone đọc: họ tên / mã khu mới | `ĐỖ MINH AN / K-07` |
| `the_cong` | Cổng khu đọc: số hiệu / mã khu mới | `AN-5521 / K-07` |

Nhãn của hai thiết bị giữ dạng `Tên thiết bị: …`: mô phỏng lấy phần trước dấu hai chấm làm tiêu đề màn đọc.

**Mức cảnh báo ≤ 40%:** ≤ 11 câu lệnh. 100% là 27 câu lệnh; từ 28 câu lệnh bị Sentinel bắt.

Quy tắc đặt tên được dạy (chỉ những gì kiểm được hoặc gặp được trong level): phân biệt hoa thường (cài sẵn), tên phải có trước khi dùng (cài sẵn), tên trong dấu nháy là chữ (cài sẵn), chữ không dấu, không bắt đầu bằng chữ số, không có khoảng trắng (gợi ý 3; gõ sai thì gặp `SyntaxError` hoặc `missing_var`).

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

```
> CẢNH BÁO: OMNI GỬI HỒ SƠ KIỂM TRA VÀO BỘ ĐỆM
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

## 9. Gợi ý (ECHO nói)

| Mức | Nội dung |
|---|---|
| 1 | "Ki-ốt không đọc cả đoạn mã một lần. Nó chạy từng dòng, từ trên xuống. Mỗi thiết bị đọc ô nhớ đúng lúc dòng của nó chạy… và chỉ thấy thứ ô đó đang giữ lúc ấy." |
| 2 | "Thứ tự ki-ốt cần: 1. Gắn nhãn cho từng gói trong bộ đệm. 2. Chép mã khu đang giữ sang ô nhật ký. 3. Gán lại ô mã khu bằng gói sửa. 4. Rồi mới để hai thiết bị đọc. Không gõ lại giá trị nào. Mọi thứ đã nằm trong bộ đệm." |
| 3 | Tài liệu: gán, gán lại, `print(tên)` và `print("tên")`, quy tắc đặt tên, `NameError`, với ví dụ `nhiet_do` / `bao_cao` (xem JSON). Không trùng đáp án |

## 10. Phản ứng của ECHO

Đầy đủ trong JSON (mục 16), 30 khóa. Các câu chính:

| Tình huống | ECHO nói |
|---|---|
| Vào màn | Ki-ốt còn điện. Nó không đọc gói tin… chỉ đọc ô nhớ có nhãn. Drone đi qua theo chu kỳ. Viết ít thôi. |
| `NameError` (code gốc) | Dòng {line}. NameError. Tới dòng này, bộ nhớ chưa có ô nào mang cái nhãn được gọi. Soát từng ký tự. |
| Ô giữ chữ của tên (khóa mới `value_is_label`) | Ô {vars} đang giữ chữ của một cái nhãn… còn thứ cái nhãn ấy dán lên thì không có trong ô. |
| Sai giá trị | {vars} lệch hồ sơ 0xA7 gửi. Xem lại từng thiết bị đã nhận gì. |
| Ô nhật ký chép mã khu sau khi mã khu đã bị gán lại (khóa `value_overwritten`, 25/10/2026) | Ô {vars} chép thứ ô nguồn đang giữ lúc này. Thứ ô nguồn giữ trước lần gán lại… nó không thấy. |
| Thiếu biến | Chạy xong, bộ nhớ ki-ốt không có ô nào mang nhãn {vars}. |
| Vượt ngưỡng | Hồ sơ khớp. Nhưng {count} câu lệnh… drone đã chậm lại trên đầu ki-ốt. Chạy gọn hơn. |
| Gõ tay, trượt phản công | OMNI thay hồ sơ trong bộ đệm. {vars} vẫn giữ hồ sơ cũ. Những ô đó không đọc bộ đệm… thứ trong ô đã gõ sẵn từ trước. |
| Đạt 2 sao | Ki-ốt nhận hồ sơ. Drone bay qua, không dừng lại. |
| Đạt 3 sao | OMNI thay cả bộ đệm. Từng ô chép theo, không sót. …OMNI không tìm ra dấu tay nào trên hồ sơ. |

Khóa `value_overwritten` thay `wrong_value` khi **mọi** biến sai giá trị đang giữ đúng giá trị hiện tại của một biến mục tiêu khác đã bị gán lại trong lượt chạy (lịch sử gán có ít nhất hai giá trị). Ví dụ `ma_khu = goi_4` đặt trước `khu_cu = ma_khu`: chỉ `khu_cu` sai và nó giữ `K-07`. Cách chấm không đổi: `khu_cu = goi_2` vẫn đạt 3 sao (quyết định 25/10/2026).

Câu thay thế khi cùng khóa lặp ở lượt kế tiếp (`reaction_variants`): `wrong_value` → "{vars} vẫn lệch hồ sơ. Ki-ốt chạy từng dòng từ trên xuống… mỗi ô chỉ nhận thứ có mặt đúng lúc dòng gán của nó chạy."; `value_is_label` → "Ô {vars} vẫn giữ chữ của một cái nhãn. Ki-ốt chép nguyên văn, không tra xem nhãn đó dán lên gói nào."; `value_overwritten` → "Ô {vars} vẫn mang giá trị mới. Lúc dòng chép chạy, ô nguồn đã bị gán lại rồi."

**Từ cấm riêng của 1.2** (`forbidden_terms`, cộng với danh sách chung `int|float|round`): `goi_1`…`goi_4` (chỉ thẳng nguồn đúng), `ngoặc`, `nháy`, `hoa thường`, `đổi chỗ`, `lên trên`, `xuống dưới` (chỉ cách sửa). Test chống lộ hiện có còn cấm mọi giá trị `expected`, nên không câu nào được nhắc `K-12`, `K-07`, `AN-5521`, `ĐỖ MINH AN` hay giá trị phản công. ECHO chưa dùng từ "hình dạng" (bắt đầu từ 1.3); kiểu sai được gọi là "không phải chữ".

## 11. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | 6 ô đúng giá trị |
| ⭐⭐ | Thêm: ≤ 11 câu lệnh (≤ 40%) |
| ⭐⭐⭐ | Thêm: vượt qua hồ sơ kiểm tra của OMNI |
| 0 sao | ≥ 28 câu lệnh: bị Sentinel bắt, không chạy phản công |

## 12. Đoạn truyện khi hoàn thành

- **Đoạn kết (`outro`):** "Ki-ốt nhận hồ sơ của ĐỖ MINH AN. Trong nhật ký quản trị của nó có một dòng không thuộc về OMNI:"
- **Mảnh nhật ký (`lore_fragment`), KTS-05:** "Tôi thiết kế Neural-ID. Tái định hướng chỉ là một phép gán lại: cái tên giữ nguyên, giá trị bị thay. Tôi chưa tìm ra cách lấy lại giá trị cũ. Nhưng nó không bị xóa ngay."
- **Thẻ thành phần (`component`):** NEURAL-ID GIẢ · THÀNH PHẦN 2/6: Hồ sơ danh tính.
- **Nhịp truyện (`outro_beats`):** kai "Nhi chưa bị xóa." → echo "Dòng log nói "không bị xóa ngay". Nó không nói còn bao lâu." → card "TÍN HIỆU · 0xA7 ⏎ "Hồ sơ đã nhận. Đến Ga Ngầm Số 3. Máy quét ở đó phân loại từng trường. Sai loại là bị giữ lại."" (cue `glitch`).
- **Móc câu:** giá trị cũ của Nhi còn ở đâu, còn bao lâu; máy quét phân loại "theo loại" là gì. Người chơi vừa tự tay thấy một giá trị cũ còn sống nếu có một tên khác giữ nó, nên câu của KTS-05 có sức nặng.

## 13. Thay đổi engine (tóm tắt; chi tiết trong brainstorm)

- `REACTION_KEYS` thêm `value_is_label`; `classify-run.ts` trả khóa này khi một biến chuỗi sai giá trị đúng bằng `'<tên>'` của một biến đầu vào hoặc mục tiêu, chỉ khi level định nghĩa khóa.
- `LevelDefinition` thêm `simulation?` và `forbidden_terms?` (cùng `location`, `component`, `outro_beats` của thiết kế mở đầu); `validate-level.ts` kiểm chúng.
- `harness.py`: khi `trace_vars` bật, ghi `var_history` (tối đa 40 mục `{line, var, type, preview, src}`, so bằng `is`, không chạy code người chơi; `src` là tên biến đầu vào có đối tượng gốc chính là giá trị mới, để dây nối bộ đệm không nối cho giá trị gõ tay). `build-config.ts` bật cờ này cho `kiosk`.
- `kiosk-timeline.ts` (thuần, test được) và `kiosk-simulation.tsx` mới; `game-screen.tsx` chọn theo `simulation.kind`.
- Test chống lộ dùng thêm `forbidden_terms`, so cụm có dấu bằng `includes`.

## 14. Người chơi lần lượt làm gì

1. Qua đoạn chuyển cảnh sau 1.1 (thẻ 0xA7 "Chuẩn bị bộ nhớ."), gặp màn "VÀO NHIỆM VỤ": *1.2 Gán nhãn · Trạm Phát Khẩu Phần số 4*. Bấm Enter, âm thanh mở khóa.
2. Briefing gõ chữ với `teletype`; dòng "GÓI ĐẾN MUỘN" hiện cuối cùng. Sáu mục tiêu khóa vào, mỗi mục một `objective_lock`. Thanh cảnh báo sáng. ECHO nói câu vào màn.
3. Người chơi đọc code, thấy bộ đệm khóa (gõ vào dòng 2–5 nghe `locked_bump`). Bấm CHẠY.
4. **Lần 1:** terminal: `SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP`, `TRUY VẾT: dòng 13 — NameError: name 'Ma_khu' is not defined`, cảnh báo 15% (4/11). Dòng 13 tô đỏ, bấm dòng truy vết để nhảy tới. Mô phỏng: ba ô đầu sáng, máy quét drone nhiễu đỏ, `alarm`. ECHO: câu `NameError`. Người chơi so `Ma_khu` với `ma_khu` ở dòng 9, sửa.
   - *Rẽ sai:* thêm dòng `Ma_khu = goi_2` ngay trên dòng 13. Chạy được, nhưng có thêm một ô lạ không ai đọc và vẫn rơi vào lỗi thứ tự ở bước 6. Không phạt riêng, chỉ tốn một câu lệnh.
5. **Lần 2:** chạy hết. Đầu ra `ĐỖ MINH AN / K-12`, `goi_3 / K-12`. Terminal: `HỢP LỆ: ho_ten`, `HỢP LỆ: ma_khu`, `SAI GIÁ TRỊ: so_hieu = 'goi_3'`, và ba dòng sai khác. Mô phỏng: ô `so_hieu` chứa chữ `"goi_3"`, không có dây nối bộ đệm. ECHO: `value_is_label`. Người chơi nhận ra dấu nháy biến cái tên thành chữ.
   - *Rẽ sai thường gặp:* sửa thành `so_hieu = "AN-5521"` (gõ tay). Lần chạy sau vẫn qua ô này; cái giá đến ở phản công (bước 8).
6. **Lần 3:** còn sai `khu_cu`, `the_quet`, `the_cong`. Mô phỏng phát lại: ô `ma_khu` nhận `K-12`, hai màn thiết bị đọc `K-12`, rồi `ma_khu` bị ghi đè thành `K-07`, bóng `K-12` tan, ô nhật ký chép `K-07`. ECHO: `wrong_value`. Người chơi đọc lại chú thích dòng 16 hoặc mở gợi ý 1.
   - *Rẽ sai:* chỉ đổi chỗ dòng 17 và 18 → `khu_cu` đúng, hai thiết bị vẫn đọc `K-12`. *Rẽ sai khác:* viết `khu_cu = "K-12"` → qua cơ bản, trượt phản công. *Rẽ sai khác:* viết `goi_4 = ma_khu` (ngược chiều) → `ma_khu` vẫn `K-12`; gợi ý 3 nói rõ "tên bên trái nhận giá trị". Viết `"K-07" = ma_khu` → `SyntaxError`, chưa ô nào được ghi.
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

## 16. Bản nháp JSON

> Bản nháp ban đầu, giữ để đối chiếu. Câu chữ đã được rà lại ngày 25/10/2026 (`plans/reports/content-261025-1430-level-1-2.md`); khi khác nhau, `src/levels/level-1-2.json` là bản đúng.

Hợp lệ với `validate-level.ts` hiện tại sau khi thêm `value_is_label` vào `REACTION_KEYS` (đã kiểm); các trường `location`, `component`, `simulation`, `forbidden_terms`, `outro_beats` hiện bị bỏ qua cho tới khi validator kiểm chúng. Đã chạy code khởi đầu và hai lời giải qua `harness.py` bằng `python3`, và chạy kiểm chống lộ: không câu nào lộ.

```json
{
  "schema_version": 1,
  "id": "1.2",
  "chapter": 1,
  "title": "Gán nhãn",
  "difficulty": "easy",
  "concepts": ["variables", "assignment", "reassignment"],
  "location": "Trạm Phát Khẩu Phần số 4",
  "component": "Hồ sơ danh tính",
  "simulation": { "kind": "kiosk", "devices": ["the_quet", "the_cong"] },
  "forbidden_terms": ["goi_1", "goi_2", "goi_3", "goi_4", "ngoặc", "nháy", "hoa thường", "đổi chỗ", "lên trên", "xuống dưới"],
  "briefing": "[NHẬT KÝ HỆ THỐNG – TRẠM PHÁT KHẨU PHẦN SỐ 4]\nKi-ốt đăng ký Neural-ID ở góc trạm vẫn còn điện. OMNI đã quên nó.\n0xA7 gửi danh tính thành từng gói, xen tạp âm: họ tên ĐỖ MINH AN, mã khu K-12, số hiệu AN-5521. Bộ đệm chỉ đánh số gói, không biết gói nào là gì.\nKi-ốt chỉ đọc ô nhớ có nhãn. Máy quét của drone và cổng khu cùng đọc hồ sơ từ các ô đó. Gõ lại bằng tay, lệch một ký tự là báo động.\n[GÓI ĐẾN MUỘN · 0xA7] K-12 vừa bị quét. Đổi sang K-07. Ki-ốt phải giữ mã cũ trong nhật ký.",
  "starter_code": "# Bộ đệm nhận từ 0xA7 (KHÔNG sửa 4 dòng này)\ngoi_1 = \"ĐỖ MINH AN\"\ngoi_2 = \"K-12\"\ngoi_3 = \"AN-5521\"\ngoi_4 = \"K-07\"\n\n# Ô nhớ của ki-ốt. Mỗi ô một nhãn.\nho_ten = goi_1\nma_khu = goi_2\nso_hieu = \"goi_3\"\n\n# Hai thiết bị cùng đọc hồ sơ\nthe_quet = ho_ten + \" / \" + Ma_khu\nthe_cong = so_hieu + \" / \" + ma_khu\n\n# 0xA7: mã khu cũ vừa bị quét. Ki-ốt ghi mã cũ vào nhật ký, rồi đổi sang mã mới.\nma_khu = goi_4\nkhu_cu = ma_khu\n\nprint(the_quet)\nprint(the_cong)\n",
  "locked_lines": [2, 3, 4, 5],
  "inputs": ["goi_1", "goi_2", "goi_3", "goi_4"],
  "objectives": [
    { "var": "ho_ten", "type": "str", "label": "Ô họ tên" },
    { "var": "ma_khu", "type": "str", "label": "Ô mã khu, sau khi 0xA7 sửa" },
    { "var": "so_hieu", "type": "str", "label": "Ô số hiệu" },
    { "var": "khu_cu", "type": "str", "label": "Nhật ký ki-ốt: mã khu trước khi sửa" },
    { "var": "the_quet", "type": "str", "label": "Máy quét drone đọc: họ tên / mã khu" },
    { "var": "the_cong", "type": "str", "label": "Cổng khu đọc: số hiệu / mã khu" }
  ],
  "alert_limit_statements": 11,
  "float_abs_tolerance": 1e-9,
  "tests": [
    {
      "inputs": { "goi_1": "ĐỖ MINH AN", "goi_2": "K-12", "goi_3": "AN-5521", "goi_4": "K-07" },
      "expected": {
        "ho_ten": "ĐỖ MINH AN", "ma_khu": "K-07", "so_hieu": "AN-5521", "khu_cu": "K-12",
        "the_quet": "ĐỖ MINH AN / K-07", "the_cong": "AN-5521 / K-07"
      }
    }
  ],
  "counter_attack_tests": [
    {
      "inputs": { "goi_1": "LÊ VĂN TỊNH", "goi_2": "K-31", "goi_3": "LT-0093", "goi_4": "K-02" },
      "expected": {
        "ho_ten": "LÊ VĂN TỊNH", "ma_khu": "K-02", "so_hieu": "LT-0093", "khu_cu": "K-31",
        "the_quet": "LÊ VĂN TỊNH / K-02", "the_cong": "LT-0093 / K-02"
      }
    }
  ],
  "counter_attack_banner": "CẢNH BÁO: OMNI GỬI HỒ SƠ KIỂM TRA VÀO BỘ ĐỆM",
  "hints": [
    "Ki-ốt không đọc cả đoạn mã một lần. Nó chạy từng dòng, từ trên xuống. Mỗi thiết bị đọc ô nhớ đúng vào lúc dòng của nó chạy… và chỉ thấy thứ ô đó đang giữ lúc ấy.",
    "Thứ tự ki-ốt cần:\n1. Gắn nhãn cho từng gói trong bộ đệm.\n2. Chép mã khu đang giữ sang ô nhật ký.\n3. Gán lại ô mã khu bằng gói sửa.\n4. Rồi mới để hai thiết bị đọc.\nKhông gõ lại giá trị nào. Mọi thứ đã nằm trong bộ đệm.",
    "Mảnh tài liệu Python còn đọc được:\nnhiet_do = \"18°C\"     # gán: tên bên trái nhận giá trị bên phải\nbao_cao = nhiet_do     # bao_cao nhận cùng giá trị \"18°C\"\nnhiet_do = \"21°C\"     # gán lại: nhiet_do đổi, bao_cao vẫn là \"18°C\"\nprint(nhiet_do)        → 21°C\nprint(\"nhiet_do\")      → nhiet_do   (trong dấu nháy là chữ, không phải tên)\nTên hợp lệ: chữ cái không dấu, chữ số, dấu _. Không bắt đầu bằng chữ số, không có khoảng trắng.\nNhiet_do và nhiet_do là hai tên khác nhau.\nDùng một tên trước khi gán cho nó → NameError."
  ],
  "reactions": {
    "entry": "Ki-ốt còn điện. Nó không đọc gói tin… chỉ đọc ô nhớ có nhãn. Drone đi qua theo chu kỳ. Viết ít thôi.",
    "type_mismatch": "Ki-ốt chờ chữ ở {vars}. Thứ nằm trong ô không phải chữ.",
    "type_mismatch_value_match": "Nội dung của {vars} trông khớp. Nhưng đó không phải chữ. Ki-ốt không nhận.",
    "wrong_value": "{vars} không khớp hồ sơ 0xA7 gửi. Đọc lại thứ từng thiết bị đã nhận.",
    "value_is_label": "Ô {vars} đang giữ chữ của một cái nhãn… không phải thứ nằm sau cái nhãn đó.",
    "missing_var": "Chạy xong, bộ nhớ ki-ốt không có ô nào mang nhãn {vars}.",
    "SyntaxError": "Dòng {line}. Trình dịch không hiểu câu này. Chưa ô nào được ghi.",
    "IndentationError": "Dòng {line}. Lề trái lệch. Với Python, khoảng trắng… là ngữ pháp.",
    "TypeError": "Dòng {line}. TypeError. Thiết bị vừa ghép chữ với một thứ không phải chữ.",
    "ValueError": "Dòng {line}. ValueError. Một giá trị không dùng được theo cách dòng này đòi.",
    "NameError": "Dòng {line}. NameError. Tới dòng này, bộ nhớ chưa có ô nào mang cái nhãn được gọi. Soát từng ký tự.",
    "ZeroDivisionError": "Dòng {line}. Chia cho không. Lõi từ chối.",
    "AttributeError": "Dòng {line}. AttributeError. Giá trị này không mang thứ bạn đang gọi.",
    "runtime_error": "Dòng {line}. {error_type}. Ki-ốt dừng giữa chừng. Đọc dòng truy vết.",
    "timeout": "Mã chạy quá lâu. Tôi cắt kết nối… trước khi drone quay lại.",
    "resource_limit": "Bộ nhớ quá tải. Tôi đã cắt tiến trình để giữ laptop sống.",
    "blocked_import": "Mô-đun đó bị phong tỏa. Ki-ốt chỉ có bộ đệm và bộ nhớ của nó.",
    "input_unsupported": "Không có ai đứng trước ki-ốt để gõ. Dữ liệu đã nằm trong bộ đệm.",
    "system_exit": "Chương trình tự cắt giữa chừng. Ki-ốt chưa nhận đủ hồ sơ.",
    "alert_exceeded": "Hồ sơ khớp. Nhưng {count} câu lệnh… drone đã chậm lại trên đầu ki-ốt. Chạy gọn hơn.",
    "counter_ValueError": "OMNI gửi hồ sơ kiểm tra. Dòng {line} vỡ: ValueError.",
    "counter_error": "OMNI gửi hồ sơ kiểm tra. Dòng {line}: {error_type}. Mã không chịu được.",
    "counter_type_mismatch": "Hồ sơ kiểm tra đi qua mã của bạn… và ra một thứ không phải chữ ở {vars}.",
    "wrong_value_counter": "OMNI thay hồ sơ trong bộ đệm. {vars} vẫn giữ hồ sơ cũ. Những ô đó không đọc bộ đệm… chúng được gõ sẵn.",
    "counter_timeout": "OMNI thay hồ sơ trong bộ đệm. Mã của bạn treo trên dữ liệu mới… Tôi cắt kết nối. Hồ sơ chỉ được nhận một nửa.",
    "two_stars": "Hồ sơ được nhận. Drone bay qua, không dừng lại.",
    "three_stars": "OMNI thay cả bộ đệm. Ki-ốt chép đúng từng ô theo. …OMNI không tìm ra dấu tay nào trên hồ sơ.",
    "repeated_fail": "Cùng một lỗi, lần thứ {count}. Nhật ký gợi ý vẫn ở đây. Tôi chỉ hỏi được… không trả lời thay.",
    "engine_error": "Lõi Python không phản hồi. Đang khởi động lại…",
    "generic": "Có gì đó không khớp. Đọc lại bộ nhớ ki-ốt."
  },
  "outro": "Ki-ốt nhận hồ sơ của ĐỖ MINH AN. Trong nhật ký quản trị của nó có một dòng không thuộc về OMNI:",
  "lore_fragment": "KTS-05: Tôi thiết kế Neural-ID. Tái định hướng chỉ là một phép gán lại: cái tên giữ nguyên, giá trị bị thay. Tôi chưa tìm ra cách lấy lại giá trị cũ. Nhưng nó không bị xóa ngay.",
  "outro_beats": [
    { "kind": "kai", "text": "Nhi chưa bị xóa." },
    { "kind": "echo", "text": "Dòng log nói \"không bị xóa ngay\". Nó không nói còn bao lâu." },
    { "kind": "card", "text": "TÍN HIỆU · 0xA7\n\"Hồ sơ đã nhận. Đến Ga Ngầm Số 3. Máy quét ở đó phân loại từng trường. Sai loại là bị giữ lại.\"", "cue": "glitch" }
  ]
}
```

## 17. Việc cần làm (`task_steps`)

Ô riêng giữa Nhiệm vụ và Mục tiêu, giọng hướng dẫn, không chứa giá trị kỳ vọng nào:

1. Gán `ho_ten`, `ma_khu`, `so_hieu` bằng tên gói tương ứng trong bộ đệm. Không gõ lại giá trị nào bằng tay.
2. Trước khi đổi `ma_khu` sang mã mới, chép mã khu đang có vào `khu_cu`.
3. Cho hai thiết bị `the_quet` và `the_cong` đọc sau cùng, khi mọi ô nhớ đã giữ đúng giá trị.
4. Bấm CHẠY. Xong khi cả 6 mục tiêu chuyển xanh.

Bước 1 nói "tên gói" mà không nêu `goi_x` nào; bước 2 và 3 nói thứ tự cần đạt, không nói dời dòng nào.

## 18. Tổng kết kiến thức (`knowledge_summary`)

Mở sau khi qua level (≥ 1 sao), giọng kỹ thuật, không có ECHO. Tiêu đề: **Biến, phép gán và gán lại**. Mọi ví dụ khác đáp án của level và chạy đúng bằng `python3` (test `tests/integration/knowledge-summary.test.ts`).

| Mục | Ý chính | Ví dụ |
|---|---|---|
| Biến là một cái tên trỏ tới giá trị | Viết tên ở đâu, Python dùng giá trị tên đó đang trỏ tới | `thanh_pho = "Hue"` → `Hue` |
| Dấu `=` gán từ phải sang trái | Tính vế phải, gắn cho tên bên trái; `=` không phải so sánh bằng | `mon_hoc`, `lop` → `Toan 10A` |
| Dùng lại giá trị qua tên | Gán bằng tên biến khác thì nhận cùng giá trị; trong dấu nháy là chuỗi | `lop_truong = ma_lop`, `print("ma_lop")` |
| Code chạy từ trên xuống, gán lại thay giá trị từ dòng đó trở đi | Dòng chạy trước đã dùng giá trị cũ, không tự đổi | `phong` P101 → P205, `lich_hop` giữ P101 |
| Chép giá trị cũ trước khi gán lại | Chép trước dòng gán lại | `gio_cu = gio_hen` → `8:00 9:30` |
| Quy tắc đặt tên | Không khoảng trắng, không bắt đầu bằng chữ số, phân biệt hoa thường, snake_case không dấu | `diem_toan` / `Diem_toan` → `9 5` |

Lỗi đã gặp trong màn (`mistakes`, không chạy): `print(Ma_khu)` → `NameError`; `phong = "so_phong"` in ra chữ của tên; dùng giá trị trước khi gán lại (`the_hs` giữ `Lop 10A`); chép sau khi gán lại (`gio_cu` nhận `9:30`); `"K-07" = ma_khu` → `SyntaxError: cannot assign to literal here…`.

Ở màn sau (`next`): "Mỗi giá trị đều có một kiểu. Bạn sẽ gặp bốn kiểu dữ liệu cơ bản của Python và cách hỏi Python xem một giá trị thuộc kiểu nào."

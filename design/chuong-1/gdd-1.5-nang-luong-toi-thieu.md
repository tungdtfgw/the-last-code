# Level 1.5 – "Năng lượng tối thiểu"

> Chương 1 – Vùng Tối · Độ khó: Medium · Khái niệm: toán tử số học `+ - * / // % **`, thứ tự tính
> Câu đố: `src/levels/level-1-5.json` (chưa dựng). Câu chữ người chơi đọc: tài liệu `level:1.5` ở D1 (câu ban đầu sẽ vào `db/migrations/0005_content_level_1_5.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 6.5. Brainstorm: `design/quyet-dinh/level-1-5-nang-luong-toi-thieu.md`. Hợp đồng engine: `docs/hop-dong-engine-level-1-5-den-1-7.md`.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:1.5`).

Briefing là nhật ký đồng hồ đo của Vành Đai Điện, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- sau Cổng phía Bắc là Vành Đai Điện: một hàng rào chia thành nhiều đoạn, mỗi đoạn ăn năng lượng theo bình phương điện áp; trong rào còn sẵn một phần dự trữ;
- rào chỉ tắt khi nhận **đúng** lượng năng lượng còn thiếu: thiếu một đơn vị thì rào giữ nguyên, thừa một đơn vị thì rào phóng điện và báo động (đúng như đoạn Còn tiếp đã báo trước);
- Kai nạp năng lượng bằng các pin chuẩn: một số pin đầy, và đúng một phần lẻ rút từ một pin nữa; pin không cắt được thành phân số.

Briefing không nêu tên toán tử nào, không viết ký hiệu `**`, `//`, `%`.

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên Vành Đai Điện.

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:1.5`) (4 bước). Giọng hướng dẫn, chủ ngữ là người chơi, không chứa giá trị kỳ vọng nào (kể cả của lượt phản công). Bốn bước lần lượt nói:

1. bốn số đo ở dòng khóa đã là số, không cần đổi kiểu; không sửa dòng khóa;
2. tính `nang_luong` đúng công thức ở ô Mục tiêu (số đoạn nhân bình phương điện áp, trừ phần dự trữ);
3. từ `nang_luong`, tính `so_pin` là số pin đầy (số nguyên) và `phan_le` là phần còn lại rút từ pin kế tiếp; đừng gõ tay kết quả, OMNI sẽ đổi số đo;
4. bấm CHẠY; xong khi cả 3 mục tiêu chuyển xanh; không quá 4 câu lệnh và qua lượt OMNI đổi số đo thì được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu; ECHO, Việc cần làm, Gợi ý trong khung chat nổi | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng Vành Đai Điện (mục 5) |

Ô Mục tiêu có dòng phụ lấy từ `sim-vocabulary.ts` (ví dụ "rào chỉ nhận đúng lượng năng lượng").

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Số đo của Vành Đai Điện (KHÔNG được sửa 4 dòng này)
so_doan = 6
dien_ap = 12
du_tru = 36
dung_luong = 100

# Năng lượng cần = số đoạn × điện áp mũ 2 − phần dự trữ
nang_luong = so_doan * dien_ap ^ 2 - du_tru

# Số pin đầy, và phần lẻ rút từ một pin nữa
so_pin = nang_luong / dung_luong
phan_le = nang_luong - so_pin
```

Dòng 2–5 khóa; bốn biến được engine nạp sẵn dưới dạng số nguyên (`inputs` có kiểu, như 1.3). Ba lỗi cài sẵn, đều **không** gây traceback:

| Dòng | Lỗi | Python cho ra | Bài học |
|---|---|---|---|
| 8 | `^` thay cho lũy thừa | `-106` (`^` là phép XOR bit và có độ ưu tiên thấp nhất: Python tính `(6 * 12) ^ (2 - 36)`) | Ký hiệu toán quen tay không phải toán tử Python. Lũy thừa là `**`, và `**` tính trước `*` |
| 11 | `/` thay cho chia lấy phần nguyên | `-1.06`, một số thực | `/` luôn trả số thực, kể cả khi chia hết |
| 12 | Trừ sai thứ: lấy năng lượng trừ số pin | `-104.94` (vẫn là số thực, vì `so_pin` đã là số thực) | Phần lẻ là số dư của phép chia, `%` |

Lượt chạy 1 cho năng lượng âm: mô phỏng vẽ kim đồng hồ quay ngược, rất dễ thấy là sai mà chưa cần đọc code.

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:1.5`). Nhãn ghi công thức bằng lời và ký hiệu toán thường (×, mũ 2), không ghi ký hiệu Python, không ghi giá trị mong đợi.

| Biến | Kiểu | Với dữ liệu trên |
|---|---|---|
| `nang_luong` | `int` | **828** (`6 × 12² − 36`) |
| `so_pin` | `int` | **8** (số pin đầy) |
| `phan_le` | `int` | **28** (phần rút từ pin thứ 9) |

- **Mức cảnh báo ≤ 40%** (≤ 4 câu lệnh; 100% = 10 câu lệnh). Code khởi đầu có 3 câu lệnh, lời giải 3: còn chỗ cho một `print` dò.

## 5. Diễn biến khi chạy (mô phỏng Vành Đai Điện)

**Cảnh (SVG/CSS, `"simulation": {"kind": "fence", "energy": "nang_luong", "cells": "so_pin", "remainder": "phan_le", "capacity": "dung_luong"}`):** một hàng rào gồm `so_doan` cột phát sáng chắn ngang màn; dưới là giá pin của Kai (ô pin đầy vẽ theo `capacity`), bên phải một đồng hồ năng lượng có vạch "cần" (giá trị kỳ vọng của test đang hiện).

- Pin trượt vào giá từng chiếc, mỗi chiếc một tiếng tách; đồng hồ nhích theo. Pin lẻ hiện là một ô pin đổ đầy đúng `phan_le / capacity`.
- **Đúng:** kim dừng đúng vạch, các cột rào tắt dần từ trái sang, trạng thái "RÀO TẮT MỘT NỬA" (như cổng mở một nửa của 1.4). Cue `gate_open`.
- **Thiếu:** kim dừng dưới vạch, rào vẫn sáng, nhãn "THIẾU n ĐƠN VỊ". **Thừa:** kim vượt vạch, tia lửa, rào phóng điện, nhãn "THỪA n ĐƠN VỊ". Cue `scan_reject`.
- **Sai kiểu** (ví dụ `so_pin` là số thực): ô pin hiện màu `float` (tím) và bị cắt ngang, nhãn "PIN KHÔNG CẮT ĐƯỢC"; giá từ chối. Màu theo bảng `design/gdd.md` mục 5.2.
- **Giá trị âm:** kim quay ngược quá vạch 0, nhãn "NĂNG LƯỢNG ÂM".
- **Lỗi lúc chạy, lỗi cú pháp, quá thời gian:** như các mô phỏng khác (đèn đỏ, nhãn lỗi, "TRÌNH DỊCH TỪ CHỐI").
- **Phản công:** dòng cảnh báo `counter_attack_banner`, màn rung, rào đổi số cột, đồng hồ hiện số đo mới, đợt pin thứ hai chạy. Qua: rào tắt hẳn, "RÀO TẮT HOÀN TOÀN", `gate_open` rồi `star`.
- Đèn SENTINEL, giảm chuyển động, nút "Bỏ qua hoạt cảnh (Esc)", vùng `aria-live` (ví dụ "Rào nhận 828 trên 828 đơn vị. Rào tắt một nửa.") và bố cục điện thoại theo khuôn các mô phỏng đã có.

**Terminal** (lượt 1, ví dụ): dòng mở theo `sim-vocabulary`, từng biến với kiểu và giá trị (`nang_luong: int -106`, `so_pin: float -1.06`…), mức cảnh báo, trạng thái rào.

## 6. Lời giải tham khảo (đạt 2 sao, trượt phản công)

```python
nang_luong = so_doan * dien_ap ** 2 - du_tru
so_pin = round(nang_luong / dung_luong)
phan_le = nang_luong - so_pin * dung_luong
```

`round(8.28)` cho 8 nên lượt cơ bản qua. Ngoài ra viết cứng `nang_luong = 828`, `so_pin = 8`, `phan_le = 28` cũng chỉ được 2 sao.

## 7. OMNI phản công (sao thứ 3)

Dòng cảnh báo là `counter_attack_banner` (D1, `level:1.5`): OMNI đổi tải của Vành Đai. Ngay sau đó terminal hiện số đo mới:

```
> so_doan = 7   dien_ap = 15   du_tru = 75   dung_luong = 110
```

Đáp án mới: `nang_luong` = 1500, `so_pin` = 13, `phan_le` = 70. Bắt được:

- **Viết cứng kết quả** → sai cả ba.
- **Làm tròn thay cho chia lấy phần nguyên**: `1500 / 110 = 13.63…`, `round` cho 14 → `so_pin` sai, kéo theo `phan_le` sai. Dữ liệu cơ bản (`8.28`) cố ý làm `round` và `//` cho cùng kết quả, để lượt phản công là nơi duy nhất phân biệt hai cách.

Lời giải đạt 3 sao (3 câu lệnh, 30%):

```python
nang_luong = so_doan * dien_ap ** 2 - du_tru
so_pin = nang_luong // dung_luong
phan_le = nang_luong % dung_luong
```

`phan_le = nang_luong - so_pin * dung_luong` và `so_pin = int(nang_luong / dung_luong)` cũng đạt 3 sao: chấm theo giá trị, không theo cách viết (dữ liệu chỉ có số dương).

## 8. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:1.5`).

**Gợi ý** (mở dần, không bị kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Bảo người chơi nhìn đồng hồ sau khi chạy: năng lượng âm là không thể có. Ký hiệu nào trên dòng 8 không làm điều người viết nghĩ; Python có ký hiệu riêng cho "mũ" |
| 2 (`hints[1]`) | Hướng tiếp cận: Python có hai phép chia, một cho số thực, một chỉ lấy phần nguyên; và một phép cho riêng phần dư. Pin là thứ đếm được nên phải là số nguyên. Chia lấy phần nguyên khác làm tròn (gieo trước cho phản công). Pseudocode ba dòng, chưa có ký hiệu Python |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": bảng bảy toán tử với ví dụ khác đáp án; `**` tính trước `*`; `/` luôn ra số thực; `//` và `%` đi thành cặp (`a == (a // b) * b + a % b`); `^` không phải lũy thừa; `round(2.5)` cho 2 |

**Phản ứng miễn phí:** giọng cụt, nói bằng từ ngữ của rào, pin và đồng hồ; không nêu tên hay ký hiệu toán tử cần dùng, không trích đáp án.

| Khóa | Ý đồ |
|---|---|
| `entry` | Đặt cảnh: Vành Đai Điện, rào chỉ tắt khi nhận đúng lượng năng lượng; bảo chạy một lần và nhìn đồng hồ |
| `wrong_value` (thường gặp sau khi sửa dòng 11, năng lượng vẫn âm) | Đồng hồ đọc được một con số mà không rào nào cần; một ký hiệu trên dòng tính `{vars}` không phải phép tính người viết định làm |
| `type_mismatch` (code gốc) | Pin ở dạng số lẻ thập phân; giá pin chỉ nhận pin nguyên |
| `type_mismatch_value_match` | Con số đúng mà kiểu sai (ví dụ `8.0`): giá pin vẫn từ chối |
| `TypeError`, `ZeroDivisionError`, `NameError` | Nói lỗi bằng từ ngữ của đồng hồ và pin |
| `alert_exceeded` | Rào tắt nhưng quá nhiều câu lệnh; Sentinel đo được nhịp nạp |
| `wrong_value_counter` | Viết cứng hoặc làm tròn: tải đổi mà số pin không đổi theo đúng cách, rào nhận thiếu hoặc thừa |
| `counter_timeout` | Mã treo trên số đo mới |
| `three_stars` | Rào tắt hẳn dù OMNI đổi tải; ngắn |

Khóa lỗi chung theo khuôn 1.4. `reaction_variants` có câu thay thế cho `wrong_value` và `type_mismatch`: nói "vẫn" sai và chỉ thêm một chỗ để nhìn (so độ dài kim với vạch "cần"; đếm số pin trên giá).

**Từ cấm của 1.5** (`forbidden_terms`, cộng danh sách chung và mọi giá trị `expected`): tên và ký hiệu các toán tử giải bài (lũy thừa, mũ, chia nguyên, chia lấy dư, số dư, `**`, `//`, `%`) và "làm tròn". Danh sách đầy đủ nằm trong JSON. Không cấm `^` vì ECHO được chỉ chỗ sai, chỉ không được nói cách sửa.

## 9. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Ba biến đúng kiểu và giá trị |
| ⭐⭐ | Thêm: ≤ 4 câu lệnh (≤ 40%) |
| ⭐⭐⭐ | Thêm: vượt phản công |
| 0 sao | Trên 10 câu lệnh (> 100%) |

Không đổi `compute-stars.ts`.

## 10. Người chơi lần lượt làm gì

1. Vào màn, briefing gõ chữ, ba mục tiêu khóa vào, ECHO nói `entry`.
2. **Lượt 1, code gốc:** kim quay ngược, `nang_luong: int -106`, hai pin tím bị cắt. Khóa `type_mismatch` (sai kiểu đứng trước sai giá trị) cho `so_pin`, `phan_le`.
3. **Rẽ sai thường gặp:**
   - Sửa dòng 11 thành `round(...)` hoặc `int(...)`: giá nhận pin, nhưng năng lượng vẫn âm → `wrong_value`.
   - Sửa `^` thành `* 2`: `108`, rào thiếu 720 đơn vị.
   - `(so_doan * dien_ap) ** 2 - du_tru`: `5148`, rào phóng điện vì thừa. Bài học thứ tự tính.
   - `phan_le = nang_luong / dung_luong`: số thực, sai kiểu.
4. **Lời giải 2 sao** (`round` hoặc viết cứng) → phản công: `so_pin` 14 thay vì 13, rào phóng điện, `wrong_value_counter`.
5. **Lời giải 3 sao** → rào tắt hẳn. Hộp kết quả: "Đã thu: Năng lượng tín hiệu".
6. TIẾP TỤC → Tổng kết kiến thức → `after-1.5` → "VÀO NHIỆM VỤ" của 1.6.

## 11. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:1.5`).

- `outro`: rào tắt; đồng hồ đo của rào còn lưu một bản ghi hiệu chỉnh cũ, dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-07**, mảnh thứ hai; người kiểm thử OMNI): KTS-07 từng đo OMNI và thấy nó không bao giờ dùng thừa một đơn vị nào; thứ chính xác tuyệt đối thì không biết thương lượng. Nối mạch "OMNI không hỏng" của 1.3, không lộ twist chương 6.
- `component`: Năng lượng tín hiệu (ô 5/6 sáng lên).
- `outro_beats`, ba nhịp: log (phía sau rào là Trạm Thẩm Vấn; trạm hỏi mọi tín hiệu đi qua, câu trả lời phải đúng từng ký tự) → echo (ECHO thấy bộ câu hỏi của trạm được nạp từ danh sách ca trực của Cổng Kiểm Soát) → kai (Kai nghĩ tới ca đêm). Không nhắc lại tên Nhi; người chơi đã biết từ đoạn Còn tiếp.
- Móc câu: trạm sẽ hỏi gì, và câu hỏi đến từ chính cái cổng Nhi đang trực.

### 11.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:1.5`). Giọng kỹ thuật, không ECHO. Mọi `code` chạy bằng `python3` trong test tích hợp và phải in đúng `output`; ví dụ khác đáp án.

| Mục | Ý chính |
|---|---|
| Bảy toán tử | `+ - * / // % **` trên số nguyên, mỗi cái một dòng kết quả |
| `/` và `//` | `/` luôn ra `float` (kể cả `8 / 2`); `//` lấy phần nguyên |
| `//` đi với `%` | Thương và số dư; `a == (a // b) * b + a % b` |
| Thứ tự tính | `**` trước `* / // %`, rồi tới `+ -`; ngoặc để đổi thứ tự |
| `//` không phải làm tròn | `7 // 2` là 3, `round(7 / 2)` là 4; `round(2.5)` là 2 |
| `^` không phải lũy thừa | `3 ^ 2` là 1 |

Lỗi thường gặp (`mistakes`): `dien_ap ^ 2`; `/` ra số thực ở chỗ cần số nguyên; ngoặc sai làm bình phương cả tích; `round` thay `//`; chia cho 0 (`ZeroDivisionError`).

`next` báo trước màn sau: đọc câu hỏi bằng `input()` và trả lời bằng f-string.

## 12. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `type_mismatch`, `nang_luong` = -106, `so_pin` = -1.06 | **Có** (lời giải mẫu qua harness thật) |
| Lời giải 3 sao bằng `//` `%`, và bằng `int(/)` cộng phép trừ | Cả hai 3 sao | **Có** (một test tham số hóa) |
| `round(nang_luong / dung_luong)` | 2 sao, phản công `wrong_value_counter` (`so_pin` 14) | **Có** |
| Viết cứng 828 / 8 / 28 | 2 sao, `wrong_value_counter` | **Có** |
| `so_pin = nang_luong // dung_luong` nhưng `nang_luong` là `828.0` (viết `/` ở đâu đó) | `so_pin` ra `8.0`: `type_mismatch_value_match` | **Có** |
| `(so_doan * dien_ap) ** 2 - du_tru` | `wrong_value` | Không |
| `dung_luong = 0` trong vùng sửa được rồi chia | `ZeroDivisionError` | Không |
| `import math` và `math.floor(...)` | Được phép, đạt nếu giá trị đúng | Không |
| 5–10 lệnh, đúng | 1 sao, `alert_exceeded` | Không (đã có) |
| Lời ECHO trong `reactions`, `reaction_variants`, `outro_beats` | Không chứa từ cấm, giá trị kỳ vọng | **Có** (test từ cấm theo level) |
| Timeline `fence`: đúng, thiếu, thừa, âm, sai kiểu, lỗi, phản công | Khung hình đúng thứ tự, đúng cue | **Có** (`fence-timeline.test.ts`) |
| Đi trọn đường: code gốc → 3 sao | e2e `level-1-5.spec.ts` | **Có** (viết, chạy khi người dùng yêu cầu) |

## 13. Dữ liệu level

Câu đố sẽ nằm ở `src/levels/level-1-5.json`, câu chữ ở D1 (tài liệu `level:1.5`, migration `0005`). Dữ liệu test (đặc tả, JSON thắng khi lệch):

- `inputs`: `so_doan`, `dien_ap`, `du_tru`, `dung_luong` (số nguyên).
- `tests`: `{6, 12, 36, 100}` → `{nang_luong: 828, so_pin: 8, phan_le: 28}`.
- `counter_attack_tests`: `{7, 15, 75, 110}` → `{nang_luong: 1500, so_pin: 13, phan_le: 70}`.
- `alert_limit_statements`: 4.

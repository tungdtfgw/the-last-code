# Level 1.6 – "Đối thoại với Cổng"

> Chương 1 – Vùng Tối · Độ khó: Medium · Khái niệm: `input()`, f-string
> Câu đố: `src/levels/level-1-6.json` (chưa dựng). Câu chữ người chơi đọc: tài liệu `level:1.6` ở D1 (câu ban đầu sẽ vào `db/migrations/0006_content_level_1_6.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 6.5. Brainstorm: `design/quyet-dinh/level-1-6-doi-thoai-voi-cong.md`. Hợp đồng engine (kênh nhập, lời nhắc, `EOFError`): `docs/hop-dong-engine-level-1-5-den-1-7.md` mục 1 và 3.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:1.6`).

Briefing là nhật ký của Trạm Thẩm Vấn, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- mọi tín hiệu đi về Cổng Kiểm Soát phải qua trạm; trạm gửi câu hỏi qua **kênh nhập**, từng dòng một, và đọc mọi thứ chương trình in ra như câu trả lời;
- trạm gửi hai dòng: một mã hỏi (dãy số) và tên ca trực; trả lời gồm ba dòng, đúng thứ tự, đúng từng ký tự (luật ở ô Mục tiêu);
- trạm đổi mã hỏi mỗi lượt; câu trả lời phải dựng từ thứ trạm vừa gửi, không chép từ lượt trước.

Briefing không nêu tên hàm nào, không viết `f"…"`.

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên Trạm Thẩm Vấn.

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:1.6`) (4 bước). Được nêu tên `input` và `print` (luật `task_steps`), không chứa dòng đầu ra mong đợi. Bốn bước lần lượt nói:

1. chạy code có sẵn rồi đọc terminal; mỗi lần gọi `input()` đọc một dòng trạm gửi, theo thứ tự, và luôn nhận về chữ;
2. sửa để terminal in đúng 3 dòng ở ô Mục tiêu: hồ sơ lấy từ dòng khóa, lời đáp tính từ mã hỏi, dòng ca lấy từ dòng thứ hai trạm gửi;
3. không in thêm gì: lời nhắc trong `input()` cũng đi vào câu trả lời; không sửa dòng khóa;
4. bấm CHẠY; xong khi cả 3 mục tiêu chuyển xanh; không quá 5 câu lệnh và qua lượt OMNI đổi câu hỏi thì được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (3 dòng đầu ra); khung chat ECHO | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng Trạm Thẩm Vấn (mục 5) |

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Hồ sơ ĐỖ MINH AN (KHÔNG được sửa 2 dòng này)
ho_ten = "ĐỖ MINH AN"
so_khu = 7

# Trạm Thẩm Vấn gửi câu hỏi qua kênh nhập. Mỗi input() đọc một dòng.
ma_hoi = input()
print("DANH TINH: {ho_ten}")
print(f"MA DAP: {ma_hoi + so_khu}")
print("CA DEM DA DUYET")
```

Dòng 2–3 khóa, nạp qua `inputs` (`so_khu` là số nguyên). Kênh nhập của lượt cơ bản: `["4172", "DEM"]`.

| Dòng | Lỗi | Python hoặc trạm báo | Bài học |
|---|---|---|---|
| 6 | Không lỗi | Đọc `"4172"` | Mẫu: `input()` trả về chữ |
| 7 | Thiếu `f` trước dấu nháy | Trạm nhận `DANH TINH: {ho_ten}`, lệch ở vị trí 12 | Không có `f` thì ngoặc nhọn chỉ là chữ |
| 8 | Cộng chữ với số | `TypeError: can only concatenate str (not "int") to str` | `input()` luôn trả `str`; đổi kiểu trước khi tính (nối lại bài 1.4) |
| 9 | Viết cứng tên ca | Lượt cơ bản đúng, phản công sai | Dòng thứ hai của trạm phải được đọc, không đoán |

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:1.6`). Nhãn mô tả cách dựng dòng, không ghi mã hỏi hay kết quả.

Đầu ra mong đợi (đặc tả; cũng nằm trong `tests[].expected_output`):

- dòng 1 · `DANH TINH: ` rồi họ tên trong hồ sơ: `DANH TINH: ĐỖ MINH AN`
- dòng 2 · `MA DAP: ` rồi mã hỏi cộng số khu: `MA DAP: 4179`
- dòng 3 · `CA `, tên ca trạm gửi, ` DA DUYET`: `CA DEM DA DUYET`
- Không dòng thừa. Chương trình chạy hết, không lỗi. Luật so khớp như 1.1 (NFC, bỏ khoảng trắng cuối dòng).
- **Mức cảnh báo ≤ 40%** (≤ 5 câu lệnh; 100% = 12).

## 5. Diễn biến khi chạy (mô phỏng Trạm Thẩm Vấn)

**Cảnh (SVG/CSS, `"simulation": {"kind": "interrogation"}`):** bên trái màn hình trạm với các dòng trạm gửi (mỗi dòng một thẻ, sáng lên "ĐÃ ĐỌC" theo `stdinRead`, dòng chưa đọc mờ); giữa là khe kênh nhập nối sang laptop; bên phải là danh sách câu trả lời dùng chung với relay (mỗi dòng mong đợi một ô, `cần:`/`nhận:`, ký tự lệch đầu tiên tô đỏ).

- Thẻ câu hỏi trượt qua khe mỗi lần `input()` được gọi (số lần lấy từ `stdinRead`, không phát lại từng lệnh).
- **Dòng đúng:** ô xanh "TRẠM NHẬN", cue `scan_pass`. **Sai:** ô đỏ "TRẠM BÁC · vị trí n", cue `scan_reject`. **Thiếu / thừa / chưa gửi:** như relay.
- **Lời nhắc bị in ra:** ô của dòng đó hiện phần lời nhắc gạch chân trong `nhận:` (lấy từ `prompts`).
- **Đọc quá số dòng trạm gửi (`EOFError`):** khe kênh nhập trống, đèn đỏ "KÊNH NHẬP HẾT DÒNG".
- **Đạt lượt cơ bản:** trạm đóng dấu, "TRẠM DUYỆT MỘT NỬA". Cue `gate_open`.
- **Phản công:** `counter_attack_banner`, màn rung, trạm gửi bộ câu hỏi mới (`["9035", "SANG"]`), đợt trả lời thứ hai. Qua: "TRẠM DUYỆT HOÀN TOÀN", `gate_open` rồi `star`.
- Đèn SENTINEL, giảm chuyển động, Esc, `aria-live`, điện thoại theo khuôn chung.

**Terminal** (lượt 1, ví dụ):

```
> LƯỢT CHẠY #1: trả lời Trạm Thẩm Vấn
> KÊNH NHẬP: "4172", "DEM" (đã đọc 1/2)
> TRẠM BÁC: dòng 1 · sai ở vị trí 12
    cần:  DANH·TINH:·ĐỖ·MINH·AN
    nhận: DANH·TINH:·{ho_ten}
> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP
> TRUY VẾT: dòng 8 — TypeError: can only concatenate str (not "int") to str
> TRẠM: ĐÓNG
```

## 6. Lời giải tham khảo (đạt 2 sao, trượt phản công)

```python
ma_hoi = input()
print(f"DANH TINH: {ho_ten}")
print(f"MA DAP: {int(ma_hoi) + so_khu}")
print("CA DEM DA DUYET")
```

4 câu lệnh. `print("MA DAP: 4179")` (viết cứng) cũng qua lượt cơ bản.

## 7. OMNI phản công (sao thứ 3)

Dòng cảnh báo là `counter_attack_banner` (D1, `level:1.6`): OMNI đổi bộ câu hỏi của trạm. Kênh nhập mới `["9035", "SANG"]`; đầu ra đúng: `DANH TINH: ĐỖ MINH AN`, `MA DAP: 9042`, `CA SANG DA DUYET`. Bắt được: viết cứng mã đáp, và dòng ca viết cứng (không đọc dòng thứ hai).

Lời giải đạt 3 sao (5 câu lệnh, 40%):

```python
ma_hoi = int(input())
ca = input()
print(f"DANH TINH: {ho_ten}")
print(f"MA DAP: {ma_hoi + so_khu}")
print(f"CA {ca} DA DUYET")
```

`print("DANH TINH:", ho_ten)` cũng đạt: chấm theo đầu ra. f-string là cách code khởi đầu và tổng kết dạy, không bắt buộc.

## 8. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:1.6`).

**Gợi ý:**

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | So dòng 7 và dòng 8: cả hai có ngoặc nhọn, chỉ một dòng có thứ đứng trước dấu nháy. Và thứ trạm gửi qua kênh nhập luôn đến dưới dạng chữ, dù trông như số |
| 2 (`hints[1]`) | Hướng tiếp cận: mỗi lần đọc kênh nhập lấy đúng một dòng, theo thứ tự trạm gửi; đọc hết những gì cần trước, đổi kiểu thứ cần tính, rồi mới in. Pseudocode năm dòng, chưa có code |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": `input()` với ví dụ khác đáp án, `int(input())`, f-string đặt biến và biểu thức trong ngoặc nhọn, lời nhắc của `input()` được in ra không xuống dòng, `EOFError` khi đọc quá số dòng |

**Phản ứng miễn phí:** giọng cụt, từ ngữ của trạm, kênh nhập, câu hỏi; không nêu tên hàm hay ký hiệu cần dùng, không trích dòng đầu ra mong đợi.

| Khóa | Ý đồ |
|---|---|
| `entry` | Trạm Thẩm Vấn; trạm hỏi qua kênh nhập và đọc mọi thứ được in ra như câu trả lời; bảo chạy một lần |
| `TypeError` (code gốc) | Hai thứ khác kiểu bị ghép vào một phép tính; thứ từ kênh nhập trông như số nhưng không phải |
| `output_is_label` (thiếu `f`) | Trạm nhận được tên của một ô nhớ trong ngoặc, không phải thứ cất trong ô đó |
| `output_has_prompt` | Lời nhắc chương trình tự in ra cũng đi vào câu trả lời; trạm đọc nó như một phần dòng `{out_line}` |
| `output_mismatch`, `output_missing`, `output_extra` | Theo khuôn 1.1: dòng nào, ký tự thứ mấy |
| `EOFError` | Chương trình chờ một câu hỏi mà trạm không gửi; đếm số lần đọc kênh nhập |
| `ValueError` | Một dòng chữ bị đòi đổi thành số (thường do đọc sai thứ tự) |
| `wrong_value_counter` | Câu hỏi đổi mà câu trả lời vẫn của lượt cũ |
| `counter_ValueError`, `counter_timeout` | Theo khuôn 1.4 |
| `three_stars` | Trạm đổi câu hỏi mà câu trả lời vẫn đúng; ngắn |

`reaction_variants` có câu thay thế cho `output_mismatch`, `output_is_label` và `TypeError`.

**Từ cấm của 1.6** (`forbidden_terms`, cộng danh sách chung và mọi dòng `expected_output`): tên hàm đọc kênh nhập, tên và ký hiệu chuỗi định dạng (f-string, "ngoặc nhọn", chữ `f` đứng trước dấu nháy), các dấu nháy, "đổi kiểu", "ép kiểu", tên biến hồ sơ, hai mã hỏi và hai tên ca. Không cấm ký tự `{` `}` vì chuỗi phản ứng dùng chỗ giữ `{line}`, `{out_line}`; cấm bằng tên gọi thay thế.

## 9. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Ba dòng khớp, không dòng thừa, chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 5 câu lệnh |
| ⭐⭐⭐ | Thêm: vượt phản công |
| 0 sao | Trên 12 câu lệnh |

## 10. Người chơi lần lượt làm gì

1. Vào màn, briefing gõ chữ, ba mục tiêu khóa vào, ECHO nói `entry`. Nút CHẠY có vòng sáng (tính theo `progress.runs` của từng level).
2. **Lượt 1:** dòng 1 lệch ở vị trí 12, dòng 8 vỡ `TypeError`. ECHO nói `TypeError` (lỗi chạy đứng trước lỗi đầu ra).
3. **Rẽ sai thường gặp:**
   - `ma_hoi + str(so_khu)` → `MA DAP: 41727`, lệch ở vị trí 12.
   - `input("Ma hoi: ")` → dòng 1 thành `Ma hoi: DANH TINH: …`, `output_has_prompt`.
   - Đọc `ca = input()` trước `ma_hoi` → `int("DEM")` → `ValueError`.
   - Gọi `input()` ba lần → `EOFError`.
4. **Sửa dòng 8 và thêm `f` ở dòng 7** → 2 sao, phản công vỡ dòng 3 (`CA DEM` thay vì `CA SANG`), `wrong_value_counter`.
5. **Đọc dòng thứ hai** → 3 sao. Hộp kết quả: "Đã thu: Lời đáp xác thực".
6. TIẾP TỤC → Tổng kết → `after-1.6` → "VÀO NHIỆM VỤ" của 1.7.

## 11. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:1.6`).

- `outro`: trạm đóng dấu duyệt; trong bộ nhớ trạm còn một bản ghi câu hỏi cũ không thuộc bộ câu hỏi của OMNI, dẫn vào mảnh nhật ký.
- `lore_fragment` (**KTS-01**, mảnh thứ hai; người đề xuất chia công tắc): mỗi mảnh được khóa bằng một câu hỏi mà máy chỉ kiểm được định dạng của câu trả lời, không kiểm được người trả lời; mảnh đầu tiên khóa dưới Cổng Kiểm Soát. Không nói ai giữ mảnh nào.
- `component`: Lời đáp xác thực (ô 6/6 sáng lên; thanh đủ sáu ô).
- `outro_beats`, bốn nhịp: echo (danh sách ca trực của trạm: gói nào qua trạm thì NX-0417 kiểm tay ở cổng) → kai (một câu ngắn về việc sắp đứng trước mặt em mình bằng một cái tên giả) → card tín hiệu 0xA7, cue `glitch` (đã thấy đủ sáu thành phần; đang đợi ở Cổng Kiểm Soát) → echo (tín hiệu đó không đi qua Mạng Mù; nó phát từ bên trong cổng). Không giải thích 0xA7 là ai.
- Móc câu: Nhi sẽ kiểm tay Neural-ID giả; 0xA7 đã ở trong cổng trước Kai.

### 11.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:1.6`). Các mục có `input()` dùng trường câu đố `stdin` (hợp đồng engine mục 4); test tích hợp nạp nó làm đầu vào chuẩn.

| Mục | Ý chính |
|---|---|
| `input()` đọc một dòng | Trả về `str`, kể cả khi người dùng gõ số (`print(type(...))`) |
| Mỗi lần gọi đọc dòng kế | Hai lần `input()` với hai dòng nhập |
| Đổi trước khi tính | `int(input())`; nối lại `int()` của 1.4 |
| f-string | `f"…{bien}…"`, biểu thức trong ngoặc nhọn (`{a + b}`) |
| Thiếu `f` | Ngoặc nhọn được in nguyên văn, không báo lỗi |
| Lời nhắc | `input("Ten: ")` in lời nhắc không xuống dòng; ở terminal thật chữ người dùng gõ hiện sau nó, còn khi dữ liệu được nạp sẵn thì dòng in kế tiếp dính vào lời nhắc |

Lỗi thường gặp (`mistakes`): `"4172" + 7` → `TypeError`; thiếu `f`; gọi `input()` nhiều hơn số dòng → `EOFError: EOF when reading a line`; `int("DEM")` → `ValueError`; lời nhắc làm lệch dòng đầu ra.

`next` báo trước màn sau: Boss, ghép mọi thứ của Chương 1, ba vòng quét liên tiếp.

## 12. Trường hợp biên

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `TypeError` dòng 8; báo cáo đầu ra có dòng 1 sai vị trí 12, dòng 2–3 thiếu; `stdin_read` 1 | **Có** |
| Lời giải 2 sao | 2 sao, `wrong_value_counter`, `out_line` 3 | **Có** |
| Lời giải 3 sao bằng f-string, và bằng `print` với dấu phẩy | Cả hai 3 sao | **Có** (tham số hóa) |
| Thiếu `f` ở dòng 7, còn lại đúng | `output_is_label` | **Có** |
| `input("Ma hoi: ")` | `output_has_prompt`, `out_line` 1 | **Có** |
| Gọi `input()` ba lần | `EOFError` (khi level có câu), không thì `runtime_error` | **Có** (harness + classify) |
| Đọc sai thứ tự | `ValueError` | Không |
| `input()` ở level không có `stdin` (1.1–1.5) | Vẫn `input_unsupported` | **Có** (harness, giữ hành vi cũ) |
| Dòng nhập có khoảng trắng đầu `" 9035"` | `int()` bỏ khoảng trắng; `input()` trả nguyên văn | **Có** (harness: trả nguyên văn) |
| Gán `ma_hoi = "4172"` thay vì đọc | Lượt cơ bản đạt, phản công trượt | Không |
| `print(f"MA DAP: {ma_hoi}{so_khu}")` | `41727`, `output_mismatch` | Không |
| Lời ECHO | Không chứa từ cấm, dòng mong đợi | **Có** |
| Timeline `interrogation`: đúng, sai, thiếu, lời nhắc, `EOFError`, phản công | Khung hình đúng | **Có** (`interrogation-timeline.test.ts`) |
| Ví dụ trong tổng kết có `stdin` | Chạy bằng `python3` với đầu vào đó, in đúng `output` | **Có** (test tích hợp) |
| Đi trọn đường | e2e `level-1-6.spec.ts` | **Có** (viết, chạy khi được yêu cầu) |

## 13. Dữ liệu level

Câu đố sẽ nằm ở `src/levels/level-1-6.json`, câu chữ ở D1 (tài liệu `level:1.6`, migration `0006`). Dữ liệu test (đặc tả, JSON thắng khi lệch):

- `inputs`: `ho_ten` (`"ĐỖ MINH AN"`), `so_khu` (`7`), như nhau ở mọi test.
- `tests`: `stdin` `["4172", "DEM"]` → `["DANH TINH: ĐỖ MINH AN", "MA DAP: 4179", "CA DEM DA DUYET"]`.
- `counter_attack_tests`: `stdin` `["9035", "SANG"]` → `["DANH TINH: ĐỖ MINH AN", "MA DAP: 9042", "CA SANG DA DUYET"]`.
- `objectives`: 3 mục `output_line`. `alert_limit_statements`: 5.

# Level 1.1 – "Khởi động"

> Chương 1 – Vùng Tối · Độ khó: Easy · Khái niệm: `print`, chuỗi
> Câu đố: `src/levels/level-1-1.json`. Câu chữ người chơi đọc: tài liệu `level:1.1` ở D1 (câu ban đầu trong `db/migrations/0004_content_chapter_1.sql`, sửa trên `#/admin`); GDD chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Thiết kế tổng: `design/gdd.md`. Hợp đồng truyện: `design/gdd-mo-dau.md` mục 6.1. Brainstorm: `design/quyet-dinh/level-1-1-khoi-dong.md`.
> Với phần lớn người chơi, đây là dòng code đầu tiên họ viết.

## 1. Briefing

Câu chữ: `briefing` và `location` (D1, `level:1.1`).

Briefing là nhật ký hệ thống của tầng hầm Lô 17, không phải lời ECHO. Nó phải cho người chơi biết, theo thứ tự:

- laptop nối dây lên Trạm chuyển tiếp R-17, và trạm phát nguyên văn mọi dòng in ra terminal vào Mạng Mù;
- giao thức bắt tay: 3 dòng, đúng thứ tự, đúng từng ký tự, chữ không dấu; sai một ký tự hay sai hoa thường là trạm bỏ gói;
- mã phiên do trạm cấp và đổi khi trạm khởi động lại (gieo trước cho phản công);
- gõ ở đâu (`neural_id.py`), bấm gì (CHẠY, Ctrl+Enter, ⌘+Enter trên Mac), xem kết quả ở đâu (terminal).

`location` là dòng ở màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng: tên tầng hầm Lô 17 và tên trạm R-17.

### 1.1. Việc cần làm (`task_steps`)

Câu chữ: `task_steps` (D1, `level:1.1`) (4 bước).

"Việc cần làm" được nối vào tin nhắn "Vào nhiệm vụ" đầu tiên của ECHO trong khung chat. Nó viết bằng lời thường, chủ ngữ là người chơi. Nó nói sửa gì và khi nào là xong, không nói cách sửa, không chứa dòng đầu ra mong đợi (validator kiểm). Bốn bước lần lượt nói:

1. chạy code có sẵn trước, rồi đọc terminal để biết dòng nào hỏng;
2. sửa 3 lệnh `print` cho terminal in ra 3 dòng ở ô Mục tiêu: đúng thứ tự, khớp từng ký tự, đúng hoa thường;
3. không sửa dòng khóa; mã phiên đổi khi trạm khởi động lại và dòng 2 vẫn phải đúng sau lần đổi đó;
4. xong khi cả 3 mục tiêu chuyển xanh; tối đa 4 câu lệnh (cảnh báo ≤ 40%) để được thêm sao.

## 2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Nhiệm vụ, Mục tiêu (3 dòng đầu ra); ECHO, Việc cần làm (mục 1.1) và Gợi ý nằm trong khung chat nổi | Editor `neural_id.py`, nút CHẠY, terminal | Mô phỏng trạm R-17 (mục 5) |

Trên điện thoại vẫn là 3 tab. Ô Mục tiêu có dòng phụ "trạm chỉ nhận đúng từng ký tự" thay cho "máy quét chỉ đọc hình dạng".

## 3. Code khởi đầu (có lỗi cài sẵn)

```python
# Trạm R-17 phát lại nguyên văn từng dòng in ra terminal.
# Mã phiên trạm vừa cấp (KHÔNG được sửa dòng này):
ma_phien = "K7Q2"

# Bản nháp gói bắt tay của Kai. Trạm chưa nhận dòng nào.
print("NID/2089")
print(PHIEN, ma_phien)
print("lo17 can lien lac")
```

Dòng 3 là dòng khóa; `ma_phien` được engine nạp sẵn. Ba lệnh in, một dòng mẫu đúng và hai lỗi cài sẵn:

| Dòng | Lỗi | Python hoặc trạm báo | Bài học |
|---|---|---|---|
| 6 | Không có lỗi | Trạm phát `NID/2089` | Mẫu để bắt chước: chữ trong dấu nháy được phát nguyên văn |
| 7 | `PHIEN` không có dấu nháy | `NameError: name 'PHIEN' is not defined` | Không có dấu nháy, Python coi `PHIEN` là một cái tên và đi tìm nó. Cùng dòng đó, `ma_phien` là một tên có thật nên không vỡ |
| 8 | Viết thường | Trạm bỏ gói: dòng 3 sai ở vị trí 1, chỉ khác hoa thường | Chuỗi khớp đến từng ký tự |

## 4. Mục tiêu

Nhãn hiển thị: `objectives[].label` (D1, `level:1.1`). Nhãn không có tiền tố "Dòng n ·", vì chip bên phải mỗi mục đã ghi "dòng n". Nhãn dòng 2 mô tả cách dựng dòng, không ghi mã phiên.

Đầu ra mong đợi (đặc tả, cũng nằm trong `tests[].expected_output`):

- dòng 1 · tiêu đề tín hiệu `NID/2089`
- dòng 2 · `PHIEN`, một dấu cách, rồi mã phiên mà trạm đang cấp (với dữ liệu trên: `PHIEN K7Q2`)
- dòng 3 · lời gọi, đúng cỡ chữ: `LO17 CAN LIEN LAC`
- Không phát thêm dòng nào. Chương trình chạy hết, không lỗi.
- **Mức cảnh báo ≤ 40%** (≤ 4 câu lệnh; dòng khóa không tính). Mỗi lệnh chạy là một xung điện trên dây lên mái; lưới điện của OMNI đo được xung, không đọc được chữ.

Luật so khớp (dùng chung cho mọi level có mục tiêu đầu ra): bỏ khoảng trắng cuối mỗi dòng và các dòng rỗng ở cuối đầu ra; chuẩn hóa NFC; còn lại phải khớp tuyệt đối. stderr không được chấm.

## 5. Diễn biến khi chạy (mô phỏng trạm R-17)

**Cảnh (SVG/CSS, `"simulation": "relay"`):** góc dưới trái là laptop của Kai với màn terminal nhỏ; một sợi dây chạy lên ăng-ten R-17 trên mái; bên phải là Mạng Mù, một lưới chấm mờ của các trạm chết. Dưới SVG là **danh sách phát** bằng HTML (chữ mono, tự xuống dòng), mỗi dòng mong đợi một ô.

- Mỗi dòng đầu ra là một gói vàng (màu `str`) chạy theo dây lên ăng-ten, lần lượt từng gói, 450 ms mỗi gói.
- **Khớp:** ăng-ten lóe, một vòng sóng tỏa vào Mạng Mù, ô trong danh sách chuyển xanh "ĐÃ PHÁT". Cue `scan_pass`.
- **Sai:** gói vỡ ở chân ăng-ten. Ô chuyển đỏ "BỎ GÓI · vị trí 6" và hiện hai hàng `cần:` / `nhận:`; ký tự sai đầu tiên được tô nền đỏ, dấu cách hiện thành `·`, tab thành `→`, ký tự thiếu ở cuối thành ô `▯`. Nếu ký tự sai không phải ASCII thì kèm mã (`U+0410`). Cue `scan_reject`.
- **Thiếu dòng:** ô xám "KHÔNG CÓ DÒNG". **Dòng thừa:** gói thêm vỡ, ô "DÒNG THỪA".
- **Lỗi lúc chạy:** các dòng đã kịp in vẫn được phát (trạm phát mọi dòng in ra), gói ở dòng lỗi vỡ với nhãn lỗi (`NameError · dòng 7`), các ô sau xám "CHƯA PHÁT". **Lỗi cú pháp:** không gói nào rời laptop; màn laptop hiện "TRÌNH DỊCH TỪ CHỐI". Cue `alarm`.
- **Đạt lượt cơ bản:** cả ba sóng nối thành một đường sáng vào Mạng Mù, trạng thái "KÊNH MỞ MỘT NỬA" (tương ứng cổng mở một nửa ở 1.4). Cue `gate_open`.
- **Phản công:** dòng cảnh báo trên cùng, màn rung, ăng-ten tắt một nhịp rồi sáng lại, chip dưới SVG đổi thành `> ma_phien = "M4X8"`, đợt gói thứ hai chạy. Qua: đường sáng chạy tới mép lưới, nơi có một chấm lạ không có trên bản đồ (móc câu cho 0xA7, không gắn nhãn), "KÊNH MỞ HOÀN TOÀN", cue `gate_open` rồi `star`.
- Đèn SENTINEL ở góc như 1.4: sáng khi vượt 40%, khóa mục tiêu khi vượt 100%.
- Giảm chuyển động: hiện thẳng khung cuối. Nút "Bỏ qua hoạt cảnh (Esc)" như máy quét. Vùng `aria-live` đọc một câu, ví dụ "Trạm R-17 phát 2/3 dòng. Dòng 3 sai ở vị trí 1. Kênh đóng."
- Điện thoại: SVG tỉ lệ 4:3 phía trên, danh sách phát cuộn trong ô của nó, cỡ chữ mono tối thiểu 14 px.

**Terminal** (ví dụ lượt chạy thứ hai, khi dòng 3 còn viết thường):

```
> LƯỢT CHẠY #2: phát qua trạm R-17
> R-17 ĐÃ PHÁT: dòng 1 · NID/2089
> R-17 ĐÃ PHÁT: dòng 2 · PHIEN K7Q2
> R-17 BỎ GÓI: dòng 3 · sai ở vị trí 1 (chỉ khác hoa thường)
    cần:  LO17·CAN·LIEN·LAC
    nhận: lo17·can·lien·lac
> MỨC CẢNH BÁO: 30% (3/4 lệnh)
> KÊNH: ĐÓNG
```

Ô ĐẦU RA của terminal vẫn hiện stdout thô như hiện nay.

## 6. Lời giải tham khảo (đạt 2 sao, trượt phản công)

```python
print("NID/2089")
print("PHIEN K7Q2")
print("LO17 CAN LIEN LAC")
```

## 7. OMNI phản công (sao thứ 3)

Dòng cảnh báo là `counter_attack_banner` (D1, `level:1.1`): OMNI quét lưới điện và trạm R-17 khởi động lại. Ngay sau đó terminal hiện giá trị mới `ma_phien = "M4X8"`.

OMNI không biết R-17 còn sống; nó chỉ quét lưới điện của khu, làm trạm mất điện và cấp mã phiên mới. Đầu ra đúng: `NID/2089`, `PHIEN M4X8`, `LO17 CAN LIEN LAC`. Bắt được lỗi chép cứng mã phiên. Lời giải đạt 3 sao (3 câu lệnh, 30%):

```python
print("NID/2089")
print("PHIEN", ma_phien)
print("LO17 CAN LIEN LAC")
```

`print("PHIEN " + ma_phien)` cũng đạt 3 sao: chấm theo đầu ra, không theo mã.

## 8. Hướng dẫn cho người viết code lần đầu

Không có tour giao diện. Bốn thứ, đều trong bối cảnh:

1. **Briefing** nói gõ ở đâu (`neural_id.py`), bấm gì (CHẠY, Ctrl+Enter) và xem ở đâu (terminal). Đây là nhật ký hệ thống, không phải lời ECHO.
2. **Câu `entry` của ECHO** bảo chạy thử trước khi sửa. Nó chỉ cách thao tác, không chỉ cách sửa.
3. **Vòng sáng trên nút CHẠY** cho tới lượt chạy đầu tiên của level (`progress.runs === 0`, áp cho mọi level). Giảm chuyển động: viền tĩnh.
4. **Lượt chạy đầu tiên luôn vỡ ở dòng 7**, nên lần đọc terminal đầu tiên là một dòng TRUY VẾT bấm được (nhảy tới dòng 7 trong editor), cạnh một dòng đã phát thành công để so.

## 9. Gợi ý và phản ứng của ECHO

Câu chữ: `hints`, `reactions`, `reaction_variants` (D1, `level:1.1`).

**Gợi ý** (mở dần, không bị kiểm từ cấm):

| Mức | Ý đồ |
|---|---|
| 1 (`hints[0]`) | Chỉ ra rằng hai dòng đầu cùng mở bằng một lệnh, một dòng phát được và một dòng vỡ; bảo người chơi đặt chúng cạnh nhau và so từng ký tự. Không nói khác ở đâu |
| 2 (`hints[1]`) | Hướng tiếp cận: chữ nằm trọn trong dấu nháy thì phát nguyên văn; một cái tên trần thì Python tra trong bộ nhớ và phát thứ đang cất dưới tên đó. Chữ cố định của giao thức thuộc loại thứ nhất, thứ trạm có thể đổi thuộc loại thứ hai. Kèm pseudocode 3 dòng, không phải code Python |
| 3 (`hints[2]`) | "Mảnh tài liệu Python": `print` và chuỗi với ví dụ khác đáp án: nháy đơn và kép, `NameError`, dấu phẩy chèn dấu cách, `+` không chèn, tên nằm trong dấu nháy chỉ là chữ, `"abc" == "ABC"` là `False` |

**Phản ứng miễn phí** của ECHO: giọng cụt, hỏi và chỉ chỗ nhìn, không bao giờ nói cách sửa. Khóa mới của level này: `output_missing`, `output_mismatch`, `output_case_only`, `output_extra`. Chỗ giữ mới: `{out_line}` (số thứ tự dòng đầu ra), `{col}` (vị trí ký tự).

| Khóa | Ý đồ |
|---|---|
| `entry` | Terminal đã mở; trạm lặp lại đúng từng ký tự những gì được in. Bảo người chơi chạy một lần trước khi sửa, rồi đọc terminal. Chỉ cách thao tác, không chỉ cách sửa |
| `NameError` (code gốc) | Python đi tìm một thứ mang tên đó trong bộ nhớ và không thấy. Bảo đặt dòng lỗi cạnh một dòng đã phát được |
| `output_mismatch` | Dòng nào lệch, từ ký tự thứ mấy; trạm không đoán ý mà bỏ cả gói |
| `output_case_only` | Mọi chữ cái đều đúng nếu bỏ qua cỡ chữ, nhưng trạm không bỏ qua |
| `output_is_label` (25/10/2026) | Tên của mã phiên nằm trong dấu nháy, ví dụ `print("PHIEN ma_phien")`: dòng phát mang chữ của một cái tên, không phải thứ đang cất dưới tên đó |
| `wrong_value_counter` | Viết cứng mã phiên, trượt phản công: trạm đã sang phiên mới mà dòng phát vẫn như cũ, viết cho một phiên đã chết |
| `three_stars` | Phiên đổi mà tín hiệu vẫn đi; ECHO ghi nhận điều đó, ngắn |

Các khóa lỗi chung (`SyntaxError`, `IndentationError`, `timeout`…) nói lỗi bằng từ ngữ của trạm R-17 và laptop chưa từng nối mạng.

Khóa `output_is_label` thay `output_mismatch` khi dòng sai đầu tiên chứa nguyên chữ tên một biến đầu vào hoặc biến mục tiêu (so nguyên từ) mà dòng cần không chứa. Level không có câu cho khóa này giữ `output_mismatch`.

`reaction_variants` có câu thay thế cho `output_mismatch` và `output_is_label` khi cùng khóa lặp ở lượt kế tiếp: nói "vẫn" lệch và chỉ thêm một chỗ để nhìn (đặt dòng cần và dòng nhận cạnh nhau; trạm không tra bộ nhớ cho thứ nó phát nguyên văn).

**Từ cấm của 1.1** (`forbidden_terms`, cộng danh sách chung `int|float|round` và mọi dòng `expected_output` tự động): tên biến mã phiên, các dấu nháy, những từ gọi tên cách sửa (dấu nháy, dấu phẩy, nối chuỗi, viết hoa…) và cả hai mã phiên. Danh sách đầy đủ nằm trong JSON. Khớp không phân biệt hoa thường, nguyên từ theo ranh giới chữ Unicode; từ chỉ gồm dấu câu khớp chuỗi con. Áp cho `reactions` và lời ECHO trong `outro_beats`; không áp cho gợi ý.

## 10. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Ba dòng đầu ra khớp, không dòng thừa, chương trình chạy hết không lỗi |
| ⭐⭐ | Thêm: ≤ 4 câu lệnh (≤ 40%) |
| ⭐⭐⭐ | Thêm: vượt phản công (mã phiên `M4X8`) |
| 0 sao | Trên 10 câu lệnh (> 100%): bị Sentinel bắt, không chạy phản công |

Không đổi `compute-stars.ts`.

## 11. Người chơi lần lượt làm gì

1. **Cổng và mở đầu.** Bấm "VÀO NHIỆM VỤ" (nghe `pulse` nếu đến từ đoạn mở đầu, không thì vào thẳng). Briefing gõ chữ với `teletype`, ba mục tiêu khóa vào từng cái (`objective_lock`), thanh cảnh báo sáng, ECHO nói câu `entry`. Nút CHẠY có vòng sáng.
2. **Lượt 1, chạy code gốc** (đúng lời ECHO). Nghe `run`. Mô phỏng: gói 1 lên ăng-ten, sóng tỏa (`scan_pass`); gói 2 vỡ "NameError · dòng 7" (`alarm`); ô 3 "CHƯA PHÁT". Terminal: `R-17 ĐÃ PHÁT: dòng 1`, `SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP`, `TRUY VẾT: dòng 7 — NameError: name 'PHIEN' is not defined`, `KÊNH: ĐÓNG`. ECHO nói câu `NameError`. Người chơi bấm dòng TRUY VẾT, con trỏ nhảy tới dòng 7.
3. **Rẽ sai thường gặp ở lượt 2:**
   - Bao cả dòng: `print("PHIEN, ma_phien")` → trạm bỏ gói dòng 2, vị trí 6, `cần: PHIEN·K7Q2`, `nhận: PHIEN,·ma_phien`. ECHO: sai ký tự. Bài học: trong dấu nháy, `ma_phien` chỉ là chữ.
   - `print("PHIEN" + ma_phien)` → `nhận: PHIENK7Q2`, vị trí 6: ký tự `K` được tô đỏ ở chỗ cần dấu cách.
   - Thêm dấu cách ở đầu dòng: `IndentationError: unexpected indent`. ECHO: lề trái lệch.
   - Dùng dấu nháy cong khi dán từ tài liệu: `SyntaxError: invalid character '“'`, không gói nào rời laptop.
4. **Lượt 2 hoặc 3, sửa đúng dòng 7** (`print("PHIEN", ma_phien)`). Gói 1 và 2 phát, gói 3 vỡ. Terminal: `BỎ GÓI: dòng 3 · sai ở vị trí 1 (chỉ khác hoa thường)`. ECHO: câu `output_case_only`.
5. **Sửa dòng 8 thành chữ hoa.** Ba gói phát, kênh mở một nửa, rồi phản công: còi `siren`, màn rung, chip `ma_phien = "M4X8"`, ba gói chạy lại và đều phát; đường sáng chạy tới chấm lạ; `gate_open`, `star`. Terminal kết thúc `KÊNH: MỞ HOÀN TOÀN`. Hộp kết quả: 3 sao, 3 lệnh, 30%, "Đã thu: Tiêu đề tín hiệu".
6. **Nhánh chép cứng.** Ai sửa dòng 7 thành `print("PHIEN K7Q2")` thì ở bước 5 qua lượt cơ bản (2 sao), nhưng trong phản công gói 2 vỡ: `cần: PHIEN·M4X8`, `nhận: PHIEN·K7Q2`. ECHO: câu `wrong_value_counter`. Nếu người chơi đổi thành `print("PHIEN M4X8")`, lượt cơ bản lại vỡ ở dòng 2 (vị trí 7). Đến đây đa số mở gợi ý 2 hoặc 3, hoặc nhận ra `ma_phien` ở dòng khóa.
7. **Lặp lỗi.** Ba lần liền cùng một khóa thất bại, ECHO thêm câu `repeated_fail` chỉ về nhật ký gợi ý.
8. **Bấm TIẾP TỤC** trong hộp kết quả: màn Tổng kết kiến thức (mục 12.1), rồi đoạn chuyển cảnh `after-1.1` (mục 12), rồi màn "VÀO NHIỆM VỤ" của 1.2.

## 12. Đoạn truyện khi hoàn thành

Câu chữ: `outro`, `lore_fragment`, `component`, `outro_beats` (D1, `level:1.1`).

- `outro`: tín hiệu đầu tiên đi vào Mạng Mù; trong bộ đệm của R-17 còn sót một dòng log cũ, dẫn vào mảnh nhật ký.
- `lore_fragment` (KTS-01): Kiến Trúc Sư cho biết họ còn tám người, mỗi người giấu một mảnh và không ai biết chỗ của người khác, kể cả người viết.
- `component`: Tiêu đề tín hiệu (ô 1/6 sáng lên).
- `outro_beats`, bốn nhịp: log (một lúc im lặng, rồi terminal nhận một gói tin) → card tín hiệu 0xA7, cue `glitch` (đã nghe; muốn qua Cổng phía Bắc cần một danh tính; chuẩn bị bộ nhớ, gieo cho 1.2) → echo (ECHO không có ghi chép nào về mã 0xA7) → kai (ít nhất đã có người nghe thấy).
- Móc câu: 0xA7 là ai, và vì sao nó nghe được một trạm mà OMNI coi là đã chết.

### 12.1. Tổng kết kiến thức (`knowledge_summary`)

Câu chữ: `knowledge_summary` (D1, `level:1.1`).

Màn hiện sau khi qua level, trước đoạn chuyển cảnh; xem lại được từ Bản đồ. Giọng kỹ thuật, không ECHO, không từ ngữ game. Ví dụ khác đáp án của level; mọi `code` trong mục được chạy bằng Python thật trong `tests/integration/knowledge-summary.test.ts` và phải in đúng `output`.

Chủ đề: `print`, chuỗi và tên biến. Các mục phải dạy:

| Mục | Ý chính |
|---|---|
| `print` in ra một dòng | Mỗi lần gọi là một dòng, theo thứ tự trong code |
| Chuỗi nằm trong dấu nháy | Nháy đơn và kép như nhau; dấu nháy không được in |
| Tên biến và chữ trong dấu nháy | Tên trần thì in giá trị; trong dấu nháy thì in chữ |
| Dấu phẩy trong `print` | Chèn đúng một dấu cách giữa hai giá trị |
| Dấu `+` nối chuỗi | Ghép sát, không chèn dấu cách |
| Từng ký tự đều có nghĩa | Hoa thường và dấu cách làm chuỗi khác đi; `==` |

Lỗi thường gặp (`mistakes`, không chạy trong test): thiếu dấu nháy → `NameError`; `Print` sai hoa thường → `NameError`; dấu nháy cong → `SyntaxError`; dấu cách đầu dòng → `IndentationError`; tên biến nằm trong dấu nháy và `+` không có dấu cách, hai trường hợp không báo lỗi nhưng in sai.

`next` báo trước màn sau: tự tạo biến, dùng tên ở nhiều chỗ, gán lại khi giá trị đổi.

## 13. Trường hợp biên

Cột "Test" chỉ đánh **Có** cho hàng kiểm việc chấm đúng, luật sao, rò đáp án hoặc an toàn khi lỗi. Hàng khác đã do Python hoặc test hiện có lo.

| Người chơi gõ / làm | Game làm gì | Test |
|---|---|---|
| Chạy code gốc | `NameError` dòng 7; báo cáo đầu ra vẫn có dòng 1 "ok", dòng 2–3 "missing"; mô phỏng phát gói 1 | **Có** (harness: đầu ra vẫn so khi lỗi; classify ra `NameError`) |
| Sửa dòng 7, để dòng 8 viết thường | `output_case_only`, `out_line` 3, `col` 1 | **Có** |
| Lời giải 3 sao với dấu phẩy hoặc với `+` | Cả hai đều 3 sao, 3 lệnh | **Có** (một test tham số hóa) |
| `print("PHIEN K7Q2")` | Lượt cơ bản đạt, 2 sao; phản công `wrong_value_counter`, `out_line` 2 | **Có** |
| `print("PHIEN M4X8")` | Lượt cơ bản sai dòng 2, vị trí 7 | Không |
| `print("PHIEN, ma_phien")`, `print("PHIEN" + ma_phien)` | `output_mismatch`, vị trí 6 | Không |
| Dấu cách cuối dòng, `print("NID/2089", "")`, `print()` ở cuối chương trình | Vẫn đạt (luật chuẩn hóa) | **Có** |
| Dấu cách đầu chuỗi `print(" NID/2089")`; `print()` ở giữa | `output_mismatch` vị trí 1 (dòng rỗng giữa chừng là sai) | **Có** (cặp với hàng trên) |
| In thêm một dòng sau dòng 3 | `output_extra`, `{count}` = 1 | **Có** |
| Xóa dòng 8, hoặc xóa hết code | `output_missing`, `out_line` 3 (hoặc 1), 0–2 lệnh | **Có** (một hàng) |
| Chữ có dấu `LO17 CẦN LIÊN LẠC` | `output_mismatch` vị trí 7 | Không |
| Cùng một chữ có dấu ở dạng NFD và NFC (cho các level sau) | Coi là bằng nhau | **Có** (harness unit) |
| Chữ giống hệt nhưng là ký tự Cyrillic `А` | `output_mismatch`, terminal kèm `U+0410` | Không |
| Tab giữa `PHIEN` và mã | `output_mismatch` vị trí 6, terminal hiện `→` | Không |
| In đủ 3 dòng đúng rồi `1/0` | `ZeroDivisionError`, 0 sao; mô phỏng phát 3 gói nhưng kênh đóng | **Có** (đầu ra đúng không cứu lượt lỗi) |
| `print("A" * 10**6)` | Đầu ra bị cắt → không đạt; không treo, không sập | **Có** |
| Ghi ra stderr (ví dụ cảnh báo của `warnings`) | Không ảnh hưởng chấm; hiện dưới nhãn riêng | **Có** |
| Dấu nháy cong `“ ”` | `SyntaxError: invalid character`, không gói nào phát | Không |
| `print "NID/2089"`, thiếu `)`, `Print(...)` | `SyntaxError` / `SyntaxError` / `NameError` với thông báo của Python | Không |
| Thụt lề trước `print` | `IndentationError` | Không |
| Gán lại `ma_phien = "K7Q2"` trong vùng sửa được | Phản công trượt như chép cứng | Không |
| Sửa dòng khóa (dán, kéo thả) | Editor chặn; dòng khóa vẫn bị thay bằng dòng trống trước khi chạy | Không (đã có test) |
| `input()` | `input_unsupported` | Không (đã có) |
| Một lệnh in cả ba dòng bằng `\n` | Đạt, 1 lệnh, 3 sao | Không |
| 5–10 lệnh, đầu ra đúng | 1 sao, `alert_exceeded` | Không (đã có test sao) |
| 11 lệnh trở lên, đầu ra đúng | 0 sao, không chạy phản công | Không (đã có test sao) |
| Vòng lặp vô hạn | Ngân sách lệnh cắt, `timeout` | Không (đã có) |
| Lời ECHO trong `reactions` và `outro_beats` | Không chứa từ cấm hay dòng đầu ra mong đợi | **Có** (test từ cấm theo level) |
| JSON 1.1 | Qua validator; `expected_output` thiếu hoặc lệch số dòng thì validator báo lỗi | **Có** (validator) |
| Đi trọn đường: code gốc → sửa → 3 sao | e2e một spec `level-1-1.spec.ts` | **Có** (một e2e) |

## 14. Dữ liệu level

Câu đố nằm ở `src/levels/level-1-1.json`; câu chữ người chơi đọc nằm ở D1 (tài liệu `level:1.1`), không còn nằm trong file JSON (28/10/2026, QĐ-16). Hai chỗ đó là nguồn đúng duy nhất. Bản nháp JSON và các câu chép nguyên văn từng nằm ở đây đã bỏ vì chúng lệch dần với file thật (27/10/2026). Văn bản người chơi đọc được rà lại ngày 25/10/2026 theo skill `van-viet-tu-nhien`.

Ghi chú về dữ liệu: `wrong_value_counter` được dùng lại cho phản công sai đầu ra. Các khóa về biến (`type_mismatch`, `type_mismatch_value_match`, `wrong_value`, `missing_var`, `counter_type_mismatch`) và `two_stars` không có vì không thể xảy ra ở level này; nếu có thì rơi về `generic`. Cue `glitch` là cue mới do `design/gdd-mo-dau.md` mục 5.2 thêm.

# Chương 2 "Trạm Sentinel": mở chương, chuyển cảnh, bản đồ và trục truyện

> Phiên bản 0.1 · 30/10/2026 · Thiết kế tổng: `design/gdd.md` mục 5B · Lựa chọn và lý do: `design/quyet-dinh/cot-truyen-chuong-2.md` · Hạ tầng: `docs/hop-dong-engine-chuong-2.md`
> Phạm vi: tên riêng và sự thật cố định của Chương 2, đoạn mở chương (`prologue-2`), cách nối từ Chương 1, chuyển cảnh và bản đồ của chương, trục truyện và phác câu đố của 2.1–2.7, đoạn hết chương (`teaser-2`). GDD chi tiết từng màn sẽ nằm ở `design/chuong-2/gdd-2.<n>-<slug>.md`.
> Câu chữ người chơi đọc nằm ở D1: tài liệu `chapter:2` (`prologue[].text`, `teaser[].text`, câu ban đầu ở `db/migrations/0010_content_chapter_2.sql`) và các tài liệu `level:2.x`. Cấu trúc nhịp (loại, cue, nền, hiệu ứng) nằm trong `src/story/chapter-2.json`. Tài liệu này chỉ ghi ý đồ (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`).

## 1. Tên riêng và sự thật cố định của Chương 2

Mọi màn dùng đúng chính tả dưới đây. Không màn nào tự đặt tên mới cho những thứ này. Tên của Chương 1 (`design/gdd-mo-dau.md` mục 1) vẫn đứng.

| Loại | Tên | Sự thật cố định |
|---|---|---|
| Địa điểm | **Vành Sentinel** | Dải đất rộng chừng một cây số giữa tường thành phố và rào ngoại vi. Drone tuần tra theo luật cố định, không có người trực. Ai vào dải này mà không có lệnh của OMNI đều bị xử lý |
| Địa điểm | **Trạm Sentinel** | Tháp chỉ huy giữa Vành Sentinel. Mọi drone nhận luật từ lõi luật của tháp. Mảnh thuật toán thứ hai ("Quyết định") nằm trong lõi đó |
| Địa điểm | **Đường Ống Số 9** | Ống thoát nước chui dưới rào ngoại vi. Một drone hỏng mắc kẹt ở đây (2.1) |
| Địa điểm | **Hàng Rào Ngoại Vi** | Lớp rào đầu tiên, drone bay dọc theo chu kỳ (2.2) |
| Địa điểm | **Bãi Container** | Bãi hàng bỏ hoang, đèn pha quét qua lại giữa các dãy container (2.3) |
| Địa điểm | **Tháp Đèn Pha** | Tháp phụ đặt mức báo động cho cả khu (2.4) |
| Địa điểm | **Ngã Tư Tuần Tra** | Nơi hai lộ trình drone cắt nhau (2.5) |
| Địa điểm | **Trạm Sạc Drone** | Chỗ drone về sạc; bảng lệnh của tháp hiện ở đây (2.6) |
| Vật | **D-31** | Mã drone hỏng ở Đường Ống Số 9. Chip luật của nó còn chạy |
| Vật | **Bộ luật né** | Thứ Kai dựng trong cả chương: sáu luật quyết định khi nào nấp, khi nào đi. Mỗi màn thường thêm một luật; Boss chạy cả sáu |
| Sự kiện | **Đợt quét lớn** | Lần quét toàn biên giới lúc rạng sáng. Neural-ID giả của Kai chỉ sống tới lần này (đã nói ở cuối Chương 1) |
| Luật | **Ngưỡng tái định hướng** | Trong bảng luật của Tháp Đèn Pha: công dân có mức tuân thủ dưới 60% bị tái định hướng. Nhi đã qua luật này (2.4) |
| Kiến Trúc Sư | **KTS-02** | Lộ lần đầu ở Chương 2. Người viết luật quyết định cho drone và cho Trạm Sentinel; người giấu mảnh "Quyết định" |
| Kiến Trúc Sư | **KTS-0█** | Một bản ghi mất mã người viết, ghi sau ngày tám người chia mảnh (2.6). Chương 2 **không** nói đó là ai |

Nhân vật và tín hiệu của Chương 1 tiếp tục: Kai (kể ở ngôi thứ nhất), Nhi (NX-0417), ECHO, 0xA7, danh tính giả ĐỖ MINH AN.

**Bộ luật né gồm 6 luật**, mỗi màn thường 2.1–2.6 thêm một luật; Boss 2.7 không thêm luật, nó lấy mảnh "Quyết định". Thanh ở bản đồ và thẻ chuyển cảnh là thanh 6 ô (`component_bar` của `chapter-2.json`: nhãn "Bộ luật né", đơn vị "Luật").

| Ô | Luật (`component`) | Màn |
|---|---|---|
| 1 | Cảm biến tầm quét | 2.1 |
| 2 | Lệnh nấp | 2.2 |
| 3 | Ngả rẽ | 2.3 |
| 4 | Thang báo động | 2.4 |
| 5 | Điều kiện qua đường | 2.5 |
| 6 | Đọc bảng lệnh | 2.6 |

### Luật lời thoại ECHO (bổ sung cho `design/gdd-mo-dau.md` mục 1)

- Mọi luật ECHO của Chương 1 vẫn đứng: không nói ai tạo ra nó, không nói nó chống OMNI, không lộ twist chương 6.
- **0xA7:** ECHO chỉ nói sự kiện kiểm được (tín hiệu đi qua đâu, lịch của nó khớp với luật nào). ECHO không đoán 0xA7 là ai, không gọi nó là Kiến Trúc Sư, không nói nó làm cho OMNI (twist chương 3).
- **OMNI:** ECHO được nói drone và tháp "làm đúng luật". ECHO không nói OMNI đang theo một mục tiêu nào (twist chương 6).
- **Nhi:** ECHO không hứa cứu được Nhi, không an ủi. Khi nói về ngưỡng tái định hướng, ECHO chỉ đọc luật.
- ECHO gọi đúng thuật ngữ Python khi cần (điều kiện, nhánh, so sánh, khối lệnh), nhưng không nêu từ khóa hay ký hiệu là đáp án của màn (danh sách từ cấm: hợp đồng engine mục 5.2).

## 2. Nối từ Chương 1

- Đoạn hết Chương 1 (`teaser`) kết bằng thẻ "HẾT CHƯƠNG 1". Câu cuối đổi bằng migration vá `0018`: bỏ "Tín hiệu đang giải mã", thay bằng lời dẫn sang Chương 2 (ý đồ: Chương 2 · Trạm Sentinel đã mở).
- Màn kết của `teaser` có nút **TIẾP TỤC** (focus sẵn) dẫn vào `prologue-2`, và nút **VỀ BẢN ĐỒ**.
- **Người chơi mới** đi liền mạch: 1.7 → Tổng kết → `after-1.7` → `teaser` → `prologue-2` → màn "VÀO NHIỆM VỤ" của 2.1.
- **Người chơi cũ** (đã xem `teaser` trước khi Chương 2 phát hành): TIẾP TỤC ở màn tiêu đề mở thẳng `prologue-2`, vì `teaser` đã xem được nhảy qua (hợp đồng engine mục 1.5).
- 2.1 mở khi 1.7 có ít nhất 1 sao. Không đòi tổng sao Chương 1.

## 3. Đoạn mở chương (`prologue-2`)

Câu chữ: `prologue[].text` (D1, `chapter:2`; 11 nhịp; cấu trúc trong `src/story/chapter-2.json`). Dài khoảng 40 giây nếu để tự chạy, ngắn hơn mở đầu game vì người chơi đã biết luật chơi.

| Nhịp | Kiểu, nền | Ý đồ | Âm thanh, hiệu ứng |
|---|---|---|---|
| 1 | log, `thanh-pho` | Đêm đầu tiên Kai ở ngoài Vùng Tối. Thành phố phía sau vẫn sáng theo nhịp của OMNI | `pulse` |
| 2 | log | Đường đi từ Vùng Tối ra biên giới thành phố; giữa thành phố và vùng đất bên ngoài là Vành Sentinel | `fx: "trace"` |
| 3 | log, `tram-sentinel` | Định nghĩa Vành Sentinel: drone tuần tra theo luật cố định, không người trực; vào không có lệnh là bị xử lý | |
| 4 | kai | Neural-ID giả chỉ sống tới đợt quét lớn lúc rạng sáng. Kai phải qua trước giờ đó | `fx: "alert_tick"` |
| 5 | card | Tín hiệu 0xA7 gửi một lịch vượt rào có giờ chính xác tới từng phút, nói nó đã tính sẵn | `glitch`, `fx: "signal_0xa7"` |
| 6 | echo | ECHO: lịch đó không đi qua trạm nào của Mạng Mù; đừng đi theo nó (nối lời khuyên ở cuối Chương 1) | |
| 7 | kai | Kai quyết định không đi theo lịch của ai. Muốn qua thì phải tự biết drone sẽ làm gì | |
| 8 | echo | ECHO: drone không đoán, drone so sánh rồi chọn; đọc luật của chúng, rồi viết luật của mình. Đây là câu giới thiệu khái niệm của cả chương, không nêu từ khóa | `echo_voice` |
| 9 | echo | ECHO đặt nhiệm vụ: một bộ luật né sáu luật, mỗi chặng một luật | `fx: "id_bar"` (6 ô rỗng) |
| 10 | log | Dưới chân rào ngoại vi, trong một ống thoát nước, đèn của một drone hỏng vẫn nhấp nháy. Dẫn vào 2.1 | |
| 11 | card, `thanh-pho` | Thẻ chương: Chương 2, Trạm Sentinel | `pulse` |

Không được lộ: 0xA7 là ai; vì sao 0xA7 có lịch chính xác (để dành cho 2.5); mục tiêu của OMNI.

## 4. Chuyển cảnh, bản đồ, mở khóa

- **Đoạn `after-2.x`:** cùng thứ tự Chương 1 (`design/gdd-mo-dau.md` mục 5.1): `outro` trên cảnh `scene` → mảnh nhật ký → thẻ thành phần "BỘ LUẬT NÉ · LUẬT n/6: <luật>" (ô mới sáng trong thanh 6 ô) → `outro_beats`. Hộp kết quả hiện "Đã thu: <luật>". 2.7 không có thẻ thành phần.
- **Thẻ mảnh:** trong `after-2.7`, người soạn viết một nhịp `card` "MẢNH THUẬT TOÁN 2/8 · QUYẾT ĐỊNH" trên nền `thanh-pho` với `fx: "fragment_found"`; engine sáng hai mảnh đầu.
- **Bản đồ Chương 2** (`#/map/2`): đường mòn từ Đường Ống Số 9 (dưới) lên Trạm Sentinel (trên), 7 nút. Bên cạnh: thanh Bộ luật né 6 ô, tổng sao chương (tối đa 21), nhật ký Kiến Trúc Sư của chương, ô Kiến thức, danh sách đoạn truyện ("Mở đầu chương 2", "Sau 2.1"… "Hết chương 2"). Hàng chuyển chương ở đầu bản đồ. Trạng thái nút như Chương 1.
- **Mở khóa:** 2.1 mở khi 1.7 có sao; 2.n mở khi 2.(n−1) có sao. Liên kết thẳng `#/level/2.x` mở được mọi màn đã dựng, như Chương 1.
- **Cảnh:** mỗi địa điểm một phông SVG mới (danh sách ở mục 1, id ở hợp đồng engine mục 8 phase S), theo hệ thống hình của `design/quyet-dinh/canh-cutscene.md`. Màu theo vai giữ nguyên: xanh tín hiệu là thứ của Kai, đỏ OMNI là drone, tháp, camera; vàng ấm hầu như vắng mặt ở Chương 2 (không có người trên biên giới), chỉ còn ở bảng lệnh trạm sạc. Trước khi phông mới có, nhịp dùng `tram-sentinel`.

## 5. Mô phỏng chung: dải tuần tra (`patrol`)

Cả bảy màn dùng một cảnh: dải đất giữa hai lớp rào, một drone quét đèn, chấm của Kai. Mỗi test cơ bản là một **tình huống**: bảng cảm biến hiện dữ liệu tình huống, rồi quyết định của Kai (giá trị của mục tiêu `decision`). Đúng thì Kai đi qua; sai thì đèn khóa vào Kai, "BỊ PHÁT HIỆN". Phản công là "OMNI ĐỔI LUẬT TUẦN TRA": tình huống mới, thường nằm đúng ở biên. Đặc tả kỹ thuật: hợp đồng engine mục 2.

Thanh cảnh báo trong truyện: mỗi câu lệnh là một lần drone có thể nghe thấy. Vì vậy kiểm thừa một điều kiện cũng tốn (hai `if` rời đắt hơn `if/else`, các `if` rời đắt hơn chuỗi `elif`).

Sau mỗi lượt chạy xong không lỗi, editor làm mờ các dòng không chạy ở tình huống đang hiện (hợp đồng engine mục 6). Đây là cách người chơi "thấy" nhánh nào đã chạy.

## 6. Trục truyện và phác câu đố từng màn (hợp đồng cho người soạn màn)

Người soạn màn giữ nguyên địa điểm, tình huống, khái niệm, luật tạo ra, chủ mảnh nhật ký và móc câu. Code khởi đầu, dữ liệu test và ngưỡng cụ thể được chốt trong GDD màn (`design/chuong-2/gdd-2.<n>-<slug>.md`); khi phác dưới đây lệch GDD màn, GDD màn thắng. Phác dưới đây đã chỉnh theo bảy GDD màn ngày 30/10/2026; mọi con số đã đo bằng harness thật (python3 3.13, Boss thêm 3.14).

Luật chung cho mọi màn:

- Ít nhất 2 test cơ bản; mọi nhánh có một test cơ bản; mọi biên có mặt ở test cơ bản hoặc phản công; bảng đột biến (hợp đồng engine mục 4).
- Đầu ra in không dấu như Chương 1 (`LENH: NAP`), để so từng ký tự không vướng gõ dấu.
- Mỗi màn có `task_steps`, `knowledge_summary` (giọng kỹ thuật, ví dụ khác đáp án), `forbidden_terms` gồm từ khóa của màn và mọi dữ liệu tình huống, `reaction_variants` cho các khóa hay lặp, câu cho `wrong_branch`. Ngoại lệ: màn chỉ có mục tiêu biến kiểu `bool` (2.1) không viết câu `wrong_branch`, vì engine không bao giờ trả khóa này cho biến `bool` (hợp đồng engine mục 5.1).
- Câu cho `wrong_branch` không dùng `{round}`: khóa này bắn cả ở lượt phản công, nơi không có số tình huống (hợp đồng engine mục 5.2, validator chặn).
- `forbidden_terms` không cấm số mẫu mà kiểm câu chữ điền vào chỗ giữ (hợp đồng engine mục 5.2, luật 4).
- Ngưỡng cảnh báo bằng số câu lớn nhất của lời giải tham khảo, hoặc của lối "gán biến rồi in một lần" nếu lối đó tốn hơn, miễn là ngưỡng vẫn đẩy lối viết sai mà màn dạy xuống 1 sao (hợp đồng engine mục 3).
- Lối "gán giá trị mặc định rồi đổi trong `if`" chỉ hợp lệ ở 2.2, nơi chưa dạy `else`. Câu chữ 2.2 (`task_steps`, gợi ý, ECHO, `knowledge_summary`) trình bày nó là cách viết được khi chỉ có `if`, không gọi nó là cách tốt nhất hay cách duy nhất. Từ 2.3 lối này tốn thêm câu lệnh và chỉ được 1 sao (2.3, 2.4, 2.5, 2.6 đều đã đo).
- Code khởi đầu cho đúng khóa phản ứng ghi trong GDD màn (kiểm bằng test tích hợp).

### 6.1. Level 2.1 "Đọc luật tuần tra" · Easy · so sánh `== != < > <= >=`, kết quả là `bool`

- **Địa điểm:** Đường Ống Số 9. Drone D-31 kẹt trong ống, chip luật còn chạy.
- **Tình huống:** Kai cắm laptop vào chip của D-31. Trước khi quyết định điều gì, drone tính ba cờ đúng/sai từ cảm biến. Kai phải tính đúng ba cờ ấy để biết drone "nhìn thấy" gì.
- **Vì sao cần khái niệm:** mọi quyết định của drone bắt đầu bằng một phép so sánh, và phép so sánh cho ra `True` hay `False`. Điểm bằng nhau là chỗ drone và Kai hay hiểu khác nhau.
- **Phác câu đố** (mục tiêu biến, kiểu `bool`):
  - Đầu vào khóa: `khoang_cach`, `tam_quet` (int), `che_do` (str), `pin` (int).
  - Mục tiêu: `trong_tam` (khoảng cách không vượt tầm quét), `dang_quet` (chế độ đúng bằng `"QUET"`), `het_pin` (pin dưới 20).
  - Code khởi đầu đã đo:
    ```python
    trong_tam = khoang_cach < tam_quet
    dang_quet = che_do = "QUET"
    het_pin = pin < "20"
    ```
    Lượt 1 ra `TypeError` ở dòng `het_pin` (so số với chữ). Sửa xong ra `type_mismatch` (`dang_quet` thành chữ vì `=` là phép gán), rồi `wrong_value` ở `trong_tam` (biên 30/30). Không có `wrong_branch`: cả ba mục tiêu là `bool`.
  - Test cơ bản (2): `(30, 30, "QUET", 20)` → `True, True, False` (cả hai biên ở đây); `(45, 40, "SAC", 7)` → `False, False, True` (lật cả ba cờ).
  - Phản công (2): `(50, 50, "TUAN TRA", 19)` → `True, False, True` (bắt `che_do != "SAC"`, tầm quét viết cứng); `(51, 50, "QUET", 21)` → `False, True, False` (phía "hơn một" của biên tầm quét mới).
  - Đã đo: lời giải 3 câu lệnh; `pin <= 20` trượt ở test cơ bản; `che_do != "SAC"` 2 sao. Ngưỡng 40%: 3 câu.
- **Luật tạo ra:** Cảm biến tầm quét.
- **Mảnh nhật ký: KTS-02** (lần đầu): người viết luật cho drone. Mỗi luật là một phép so sánh; drone không ghét ai, drone chỉ so.
- **Nhịp truyện:** nhật ký D-31 cho thấy nó bị chính Trạm Sentinel bắn hạ vì làm sai một luật. Sentinel không tha cả drone của mình. Dẫn ra Hàng Rào Ngoại Vi.
- **Móc câu:** drone bị xử lý vì sai luật; luật của Sentinel tuyệt đối tới mức nào.

### 6.2. Level 2.2 "Lệnh nấp" · Easy · `if` (khối lệnh, thụt lề)

- **Địa điểm:** Hàng Rào Ngoại Vi. Drone bay dọc rào theo chu kỳ.
- **Tình huống:** luật đầu tiên Kai tự viết: mặc định là đi, nhưng khi drone ở trong tầm quét thì nấp.
- **Vì sao cần khái niệm:** một lệnh chỉ chạy khi điều kiện đúng. Khối lệnh nằm dưới `if` là những gì "thuộc về" điều kiện đó.
- **Phác câu đố** (mục tiêu biến `lenh: str`, `decision: {"var": "lenh"}`):
  - Đầu vào khóa: `khoang_cach`, `tam_quet`.
  - Code khởi đầu đã đo:
    ```python
    lenh = "DI"
    if khoang_cach > tam_quet:
    lenh = "NAP"
    ```
    Lượt 1 ra `IndentationError`. Thụt lề xong thì sai hướng so sánh, ra `wrong_branch` ở tình huống 1. Đổi hướng thành `<` thì trượt ở tình huống biên.
  - Test cơ bản (3): `(25, 30)` → `NAP`, `(50, 30)` → `DI`, `(30, 30)` → `NAP`.
  - Phản công: `(41, 40)` → `DI`, `(40, 40)` → `NAP`, `(13, 12)` → `DI`. Bản phác cũ dùng `(0, 12)` → `NAP` ở chỗ này, nhưng với dữ liệu đó `if khoang_cach <= 40:` (ngưỡng viết cứng) được 3 sao; `(13, 12)` bắt mọi ngưỡng viết cứng từ 30 tới 49.
  - Đã đo: lời giải 3 câu (gán mặc định, `if`, thân); hai `if` rời cũng 3 câu, nên được 3 sao (chưa dạy `else`, không phạt). Tầm quét viết cứng (`<= 30`) trượt phản công, 2 sao. Ngưỡng: 3. Câu chữ không gọi lối gán mặc định là cách tốt nhất (luật chung ở trên).
- **Luật tạo ra:** Lệnh nấp.
- **Mảnh nhật ký: KTS-01** (mảnh thứ ba): ý nghĩa của mảnh "Quyết định". Không có nó, công tắc biết cách tắt nhưng không biết khi nào được tắt.
- **Nhịp truyện:** 0xA7 nhắn Kai đi chậm, lịch của nó nhanh hơn; ECHO không trả lời; Kai đi tiếp theo luật của mình.
- **Móc câu:** công tắc tắt cần một "quyết định"; 0xA7 sốt ruột.

### 6.3. Level 2.3 "Hai ngả" · Easy · `else` (và dòng sau khối luôn chạy)

- **Địa điểm:** Bãi Container. Đèn pha quét qua lại; mỗi tình huống Kai chỉ có hai ngả.
- **Tình huống:** đèn đang chiếu về phía nào thì Kai chạy về phía kia. Không được có lúc nào Kai đứng yên, cũng không được chạy hai hướng.
- **Vì sao cần khái niệm:** `else` phủ đúng phần còn lại của điều kiện, không sót và không chồng. Dòng viết sau khối, không thụt lề, chạy trong mọi trường hợp.
- **Phác câu đố** (biến `huong: str` và 1 dòng in, `decision: {"var": "huong"}`):
  - Đầu vào khóa: `goc_den` (độ, int).
  - Biến `huong`: `SANG PHAI` khi góc dưới 90, ngược lại `SANG TRAI`. Dòng in 1: `GOC DEN: <góc>`.
  - Code khởi đầu đã đo:
    ```python
    if goc_den < 90:
        huong = "SANG PHAI"
    if goc_den > 90:
        huong = "SANG TRAI"
        print(f"GOC DEN: {goc_den}")
    ```
    Tình huống 1 thiếu dòng in (`output_missing`, dòng in nằm nhầm trong khối). Sửa thụt lề xong thì tình huống biên 90 không nhánh nào chạy, `huong` không tồn tại (`missing_var`).
  - Test cơ bản (3): `45`, `135`, `90` (biên, ra `SANG TRAI`).
  - Phản công: `10`, `170`, `89`.
  - Đã đo: lời giải `if/else` gán rồi in 3 câu; hai `if` rời 4 câu, 1 sao; gán mặc định rồi đổi (lối của 2.2) 4 câu, 1 sao; viết cứng theo `45` qua lượt cơ bản, trượt phản công ở góc 10 (2 sao). Ngưỡng: 3.
  - Vì sao quyết định là biến: nếu in hướng ra dòng, hai `if` rời và lối gán rồi in cùng 4 câu, không ngưỡng nào vừa phạt cái trước vừa tha cái sau. Với biến, ngưỡng 3 tách đúng `if/else` khỏi hai `if` rời.
- **Luật tạo ra:** Ngả rẽ.
- **Mảnh nhật ký: KTS-07** (mảnh thứ ba): người kiểm thử đi hết mọi nhánh của OMNI, nhánh nào cũng có lý do. Gieo twist chương 6, không giải thích lý do là gì.
- **Nhịp truyện:** trên một container có dấu Mạng Mù (ký hiệu trạm R-17 khắc tay): đã có người qua đây trước Kai. ECHO đếm được dấu này đã cũ.
- **Móc câu:** ai đã qua trước; họ có tới được bên kia không.

### 6.4. Level 2.4 "Thang báo động" · Medium · `elif` (nhiều nhánh, thứ tự quan trọng)

- **Địa điểm:** Tháp Đèn Pha. Tháp đặt mức báo động cho cả khu theo khoảng cách tới tín hiệu lạ gần nhất.
- **Tình huống:** Kai phải đoán trước mức tháp sẽ đặt để canh lúc di chuyển. Bốn mức, xét từ gần nhất ra xa.
- **Vì sao cần khái niệm:** chỉ một nhánh chạy, nhánh đầu tiên có điều kiện đúng. Đặt điều kiện rộng lên trước thì nhánh hẹp không bao giờ tới.
- **Phác câu đố** (1 dòng in, `decision: {"line": 1}`):
  - Đầu vào khóa: `khoang_cach`.
  - `MUC: BAO DONG` (dưới 20), `MUC: NGUY HIEM` (dưới 50), `MUC: CANH GIAC` (dưới 100), còn lại `MUC: AN TOAN`.
  - Code khởi đầu đã đo: đúng bốn nhánh nhưng xếp ngược (`< 100` trước), ra `wrong_branch` ở tình huống 1 (`10` nhận `CANH GIAC`). Lỗi thứ hai cài sẵn: mốc 50 viết `<=`, chỉ lộ ở phản công 50 m (xếp đúng mà giữ `<=` là 2 sao).
  - Test cơ bản (4, mỗi nhánh một): `10`, `35`, `75`, `150`.
  - Phản công (biên): `20` → `NGUY HIEM`, `50` → `CANH GIAC`, `100` → `AN TOAN`, `0` → `BAO DONG`.
  - Đã đo: lời giải `print` trong từng nhánh 2/3/4/4 câu theo tình huống; gán rồi in một lần 3/4/5/5. Ngưỡng 5. Dùng `<=` qua lượt cơ bản, trượt biên ở phản công (2 sao); các `if` rời gán đè tới 8 câu, gán mặc định rồi `elif` không `else` tới 6 câu, cả hai 1 sao. Bốn `if` rời có khoảng viết bằng `and` cũng 5 câu, được 3 sao (chấp nhận).
- **Luật tạo ra:** Thang báo động.
- **Mảnh nhật ký: KTS-02** (mảnh thứ hai): các ngưỡng do tám người đặt; con số 60 được chọn trong một buổi chiều, không ai nghĩ lại.
- **Nhịp truyện:** bảng luật của tháp còn một thang khác, cho công dân: mức tuân thủ dưới 60% thì tái định hướng. Kai hiểu Nhi đã bị xử lý bởi đúng một phép so sánh. ECHO chỉ đọc luật, không an ủi.
- **Móc câu:** điều gì đã đẩy Nhi xuống dưới 60%; ai đặt ngưỡng đó.

### 6.5. Level 2.5 "Ngã tư tuần tra" · Medium · `and`, `or`, `not`

- **Địa điểm:** Ngã Tư Tuần Tra. Một drone đứng gác ngã tư, đèn pha tháp lâu lâu quét qua.
- **Tình huống:** Kai được qua khi drone ở xa **hoặc** camera của nó tắt, **và** đèn pha không chiếu.
- **Vì sao cần khái niệm:** một quyết định ghép từ nhiều điều kiện; `and` buộc cả hai đúng, `or` chỉ cần một, `not` đảo. `and` được tính trước `or`, nên thiếu ngoặc là đổi luật.
- **Phác câu đố** (1 dòng in, `decision: {"line": 1}`):
  - Đầu vào khóa: `khoang_cach` (int), `camera_bat` (bool), `den_pha` (bool).
  - `LENH: QUA` khi `(khoang_cach > 40 or not camera_bat) and not den_pha`, ngược lại `LENH: CHO`.
  - Code khởi đầu đã đo: `if khoang_cach > 40 or camera_bat and not den_pha:`, có `else`. Hai lỗi logic, không lỗi cú pháp: thiếu ngoặc (trượt tình huống 2 bằng `wrong_branch`) và thiếu `not` trước `camera_bat` (sửa ngoặc xong thì trượt tình huống 3).
  - Test cơ bản (4): `(60, True, False)` → QUA; `(60, False, True)` → CHO (bắt thiếu ngoặc, quên đèn pha, đặt ngoặc sai chỗ); `(20, True, False)` → CHO; `(20, False, False)` → QUA (bắt `and` thay `or`).
  - Phản công: `(40, True, False)` → CHO (bắt `>=`), `(41, True, False)` → QUA, `(20, False, True)` → CHO.
  - Đã đo: lời giải `print` trong từng nhánh 2 câu, gán rồi in 3 câu, ngưỡng 3; `and` thay `or` trượt tình huống 1 và 4; quên `not den_pha` trượt tình huống 2; `>=` trượt phản công (2 sao); chuỗi `if/elif` không `and`/`or` và gán mặc định rồi một `if` đều tới 4 câu, chỉ 1 sao. Hai `if` rời (3 câu) được 3 sao.
- **Luật tạo ra:** Điều kiện qua đường.
- **Mảnh nhật ký: KTS-03** (mảnh thứ hai): lịch tuần tra gốc do tám người viết; OMNI chưa từng đổi nó.
- **Nhịp truyện:** ECHO so lịch 0xA7 gửi ở đầu chương với các luật Kai vừa giải: khớp tới từng giây. ECHO chỉ nói điều đó, rồi im. Kai nhớ lời KTS-03 ở Chương 1.
- **Móc câu:** ai ngoài tám người biết lịch gốc. Không trả lời trong Chương 2.

### 6.6. Level 2.6 "Bảng lệnh trạm sạc" · Medium · điều kiện lồng nhau (kèm chuỗi rỗng coi là sai)

- **Địa điểm:** Trạm Sạc Drone. Bảng lệnh của tháp hiện lệnh cho từng drone đang sạc; Kai đọc nó qua kênh nhập.
- **Tình huống:** trước hết xem bảng có lệnh hay không; có lệnh thì xét lệnh gì, không có thì xét drone còn bao nhiêu pin.
- **Vì sao cần khái niệm:** câu hỏi thứ hai chỉ có nghĩa khi câu hỏi thứ nhất đã có câu trả lời, nên `if` nằm trong khối của `if` khác. Chuỗi rỗng là "không có gì" và được Python coi là sai, nên `if ma_lenh:` đọc được như "nếu có lệnh".
- **Phác câu đố** (1 dòng in, `stdin` 2 dòng: mã lệnh, mức pin; `decision: {"line": 1}`; `inputs: []`, `locked_lines: []`, level đầu tiên không có dòng khóa):
  - Có lệnh: `XUAT KICH` → `LENH: NAP`, lệnh khác → `LENH: CHO`. Không có lệnh: pin dưới 30 → `LENH: DI` (drone kẹt sạc), còn lại `LENH: CHO`.
  - Code khởi đầu đã đo: đọc hai dòng bằng `input()` không lời nhắc (lời nhắc bị chấm như 1.6), pin không đổi kiểu, rồi một chuỗi phẳng `if pin < 30 / elif ma_lenh == "XUAT KICH" / else`. Lượt 1 ra `TypeError` (so chữ với số, bài 1.4). Đổi kiểu xong thì trượt tình huống 4 bằng `wrong_branch`: lệnh khác nhưng pin thấp ra `DI`.
  - Test cơ bản (4): `["XUAT KICH", "80"]` → NAP; `["", "12"]` → DI; `["", "75"]` → CHO; `["VE TRAM", "5"]` → CHO.
  - Phản công: `["", "30"]` → CHO (biên); `["XUAT KICH", "3"]` → NAP; `[" ", "10"]` → CHO (một dấu cách vẫn là có lệnh).
  - Đã đo: lời giải lồng, `print` trong từng nhánh 5 câu ở mọi tình huống; lồng gán rồi in một lần 6 câu; ngưỡng 6. `pin <= 30` trượt phản công 1 (2 sao); liệt kê các mã lệnh đã thấy trượt phản công 3 (2 sao). Các `if` rời in thẳng 7 câu và gán mặc định rồi `if/elif` 7 câu, cả hai 1 sao. Lời giải không lồng mà dùng `and` 5 câu, được 3 sao: chấm theo hành vi, không ép cách viết; tổng kết kiến thức và gợi ý dạy cách lồng.
  - `if ma_lenh:` và `if ma_lenh != "":` cho cùng kết quả; màn không chấm riêng chỗ này, chỉ dạy trong tổng kết.
- **Luật tạo ra:** Đọc bảng lệnh.
- **Mảnh nhật ký: KTS-0█**: một bản ghi bị xóa mã người viết, đề ngày sau khi tám người chia mảnh, nói đã nộp một thứ gì đó. Không nêu tên, không đủ để đoán ai.
- **Nhịp truyện:** bảng lệnh đổi: tháp ra lệnh xuất kích tới "tín hiệu không định danh gần tháp", và đợt quét lớn được dời sớm. Kai phải lên tháp ngay.
- **Móc câu:** một Kiến Trúc Sư đã làm gì đó sau ngày chia mảnh; Sentinel đã biết có người trong dải.

### 6.7. Level 2.7 BOSS "Trạm Sentinel" · Boss · tổng hợp Chương 2

- **Địa điểm:** Trạm Sentinel, chân tháp và lõi luật.
- **Tình huống:** đợt quét lớn đã dời sớm. Tháp chạy bốn pha tuần tra liên tiếp (bốn test cơ bản = bốn tình huống), mỗi pha nạp dữ liệu cảm biến khác qua kênh nhập. Bộ luật né của Kai phải ra đúng cả bốn dòng ở cả bốn pha. Bốn pha là tối thiểu: thang báo động ở dòng 2 có bốn mức, mỗi mức cần một test cơ bản. Phản công là OMNI đổi luật khẩn cấp: dữ liệu nằm đúng ở các biên.
- **Phác câu đố** (4 dòng in, `decision: {"line": 4}`):
  - Đầu vào khóa: `tam_quet` (int), `camera_bat`, `den_pha` (bool). Kênh nhập: khoảng cách (chữ, phải đổi sang số), mã lệnh (có thể rỗng).
  - Bốn dòng:
    1. `TRONG TAM: <True/False>` (so sánh, 2.1);
    2. `MUC: …` theo thang bốn mức (2.4);
    3. `LENH DRONE: XUAT KICH | CHO LENH | KHONG CO` (lồng nhau, chuỗi rỗng, 2.6);
    4. `KAI: NAP` khi trong tầm **và** drone thấy được (camera bật hoặc đèn pha bật); nếu không, `KAI: CHO` khi đèn pha bật hoặc có lệnh xuất kích; còn lại `KAI: QUA` (`if/elif/else` với `and`/`or`, 2.2, 2.3, 2.5). Vế "camera bật hoặc đèn pha bật" cho lỗi thiếu ngoặc một chỗ đứng.
  - Code khởi đầu: bản nháp ghép từ sáu chặng, năm lỗi đã gặp: khoảng cách chưa đổi kiểu (2.6), `<` thay `<=` ở tầm quét (2.1), thang xếp ngược (2.4), dòng in `LENH DRONE` thụt vào khối `else` (2.3), thiếu ngoặc trong điều kiện ghép (2.5). Chuỗi khóa đã đo: `TypeError` (pha 1) → `wrong_branch` dòng 2 (pha 1) → `output_mismatch` dòng 3 (pha 1) → `wrong_branch` dòng 4 (pha 3) → `wrong_branch` ở luật khẩn cấp 1 (2 sao) → `three_stars`.
  - Bốn pha cơ bản đi qua mọi nhánh của dòng 2, 3, 4 (bảng phủ nhánh, GDD 2.7 mục 6.2). Ba tình huống luật khẩn cấp nằm ở biên: khoảng cách bằng đúng `tam_quet`; khoảng cách 20, 50, 100 (ba mốc của thang); mã lệnh là một dấu cách. Dữ liệu chính xác: GDD 2.7 mục 6.1.
  - Đã đo: lời giải tham khảo in trong nhánh tối đa 14 câu; đường sửa bản nháp 15; gán rồi in 17. Ngưỡng 17 (100% = 42); thang tách thành các `if` rời gán đè 18–20 câu, 1 sao. 27 đột biến, không cái nào 3 sao (GDD 2.7 mục 6.3, 8).
- **Không có luật mới.** Hộp kết quả không có dòng "Đã thu".
- **Mảnh nhật ký: KTS-02** (mảnh thứ ba): KTS-02 giấu mảnh "Quyết định" trong một nhánh mà OMNI không bao giờ chọn, vì điều kiện để vào nhánh đó là một quyết định do con người tự đưa ra.
- **Nhịp truyện** (`outro_beats`, 5–6 nhịp):
  1. log: lõi luật mở ra một nhánh chưa từng chạy;
  2. card `thanh-pho`, `fx: "fragment_found"`, cue `pulse`: MẢNH THUẬT TOÁN 2/8 · QUYẾT ĐỊNH;
  3. card tín hiệu 0xA7, cue `glitch`: chúc mừng, nói nó biết Kai sẽ qua được, "trước cả bạn";
  4. echo: tín hiệu 0xA7 lần này phát từ chính tháp Sentinel. ECHO không suy đoán;
  5. kai: Kai cất mảnh, không trả lời.
- **Tổng kết kiến thức:** tổng kết cả Chương 2 (so sánh, `if`, `else`, `elif`, `and/or/not`, lồng nhau, chuỗi rỗng); `next` báo trước Chương 3: Mê cung Máy chủ, vòng lặp.
- **Không được lộ:** 0xA7 là Kiến Trúc Sư (twist chương 3); OMNI làm đúng một đặc tả (twist chương 6).

## 7. Mạch tò mò xuyên chương

| Sau | Câu hỏi người chơi mang theo |
|---|---|
| Mở chương 2 | Vì sao 0xA7 có lịch chính xác tới từng phút? Neural-ID giả còn bao lâu? |
| 2.1 | Sentinel bắn cả drone của nó. Luật tuyệt đối tới đâu? |
| 2.2 | "Quyết định" là mảnh gì của công tắc? |
| 2.3 | Ai đã qua đây trước Kai? |
| 2.4 | Nhi bị xử lý bởi một con số. Ai đặt con số đó? |
| 2.5 | Ai ngoài tám người biết lịch gốc? |
| 2.6 | Một Kiến Trúc Sư đã làm gì sau ngày chia mảnh? |
| 2.7 | 0xA7 ở bên trong tháp. Nó ở khắp nơi OMNI có mặt? |
| Hết chương 2 | Nhi bị theo dõi vì Kai. Lần này 0xA7 muốn đi cùng |

## 8. Đoạn hết chương (`teaser-2`)

Câu chữ: `teaser[].text` (D1, `chapter:2`; 9 nhịp; cấu trúc trong `src/story/chapter-2.json`).

| Nhịp | Kiểu, nền | Ý đồ | Âm thanh, hiệu ứng |
|---|---|---|---|
| 1 | log, `tram-sentinel` | Kai đã ở bên kia rào ngoại vi; sau lưng là thành phố | `gate_close_far` |
| 2 | echo | Bộ luật né đủ sáu luật. Đợt quét lớn vừa đi qua; Neural-ID giả đã tắt. Từ đây Kai không có danh tính nào | `fx: "id_bar"` (6 ô sáng) |
| 3 | log, `thanh-pho` | Hai mảnh trong tám đã về tay | `fx: "fragment_found"` (2 mảnh) |
| 4 | log | Phía trước là một trung tâm dữ liệu bỏ hoang; hành lang của nó có cảm biến quét lặp lại không dứt (báo trước Chương 3, không dạy vòng lặp) | |
| 5 | card | Tín hiệu 0xA7: mảnh thứ ba ở trung tâm dữ liệu cũ; lần này nó sẽ đi cùng Kai | `glitch`, `fx: "signal_0xa7"` |
| 6 | echo | ECHO không trả lời 0xA7. Chỉ nói một sự kiện kiểm được: phía trước không còn trạm nào của Mạng Mù; từ đây ECHO chỉ biết những gì Kai thấy. Không lặp ý "0xA7 biết trước" của `after-2.7` nhịp 3 | |
| 7 | log | Gói tin cuối cùng Neural-ID giả nhận được trước khi tắt: nhật ký Cổng Kiểm Soát, NX-0417, mức tuân thủ 100% → 96%, đưa vào danh sách theo dõi | `scan_reject` |
| 8 | kai | Kai hiểu Nhi bị theo dõi vì anh. Một câu, rồi im lặng (`hold_ms` 2000) | |
| 9 | card | HẾT CHƯƠNG 2 · TRẠM SENTINEL; Chương 3: Mê cung Máy chủ, tín hiệu đang giải mã | `pulse` |

Sau nhịp 9: nút VỀ BẢN ĐỒ (focus sẵn) và dòng mời chơi lại khi tổng sao chương chưa đủ 21. Khi Chương 3 phát hành, câu nhịp 9 được vá như `0018` đã làm cho Chương 1.

Không được lộ: KTS-0█ là ai; 0xA7 là ai; OMNI theo mục tiêu gì. Ngưỡng 60% và con số 96% đủ xa nhau để không gây cảm giác Nhi sắp bị tái định hướng ngay, nhưng đủ để thành mối lo cho các chương sau.

## 9. Trường hợp biên của luồng chương

| Tình huống | Hành vi |
|---|---|
| Người chơi cũ đã xem `teaser` | TIẾP TỤC ở màn tiêu đề mở `prologue-2`; xong thì vào 2.1 |
| Người chơi qua 1.7 nhưng đóng tab giữa `teaser` | TIẾP TỤC chạy `teaser` trước, rồi `prologue-2` |
| Liên kết `#/story/prologue-2` khi 1.7 chưa có sao và chưa xem | Về Bản đồ |
| Liên kết `#/level/2.4` khi 2.3 chưa có sao | Vào được (khóa chỉ để dẫn đường), bản đồ vẫn hiện 2.4 khóa |
| D1 thiếu `chapter:2` hoặc câu lệch khung | Chương 1 chơi bình thường; bản đồ hiện Chương 2 "TÍN HIỆU HỎNG"; `#/level/2.x` về bản đồ |
| Một `level:2.x` hỏng | Nút đó "TÍN HIỆU HỎNG", màn sau nó mở khi màn đã dựng liền trước có sao (luật "đã dựng" như Chương 1) |
| Xem lại `teaser` từ bản đồ | Về bản đồ, không dẫn vào `prologue-2` |
| `#/map` khi đang chơi Chương 2 | Mở bản đồ Chương 2; hàng chuyển chương mở được Chương 1 |
| Tổng sao | Mỗi bản đồ đếm sao chương của nó (21 mỗi chương) |
| Giảm chuyển động, điện thoại, bàn phím, tắt tiếng, tab ẩn | Như Chương 1 (`design/gdd-mo-dau.md` mục 7) |

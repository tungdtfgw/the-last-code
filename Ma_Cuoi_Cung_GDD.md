# MÃ CUỐI CÙNG (The Last Code)
### Tài liệu thiết kế game – Game hóa dạy lập trình Python

> Phiên bản: bản nháp 0.2 · Cập nhật: 25/10/2026 (cập nhật theo prototype Level 1.4; nhật ký lỗi: `docs/nhat-ky-loi-prototype-1-4.md`)
> Đối tượng: sinh viên mới học lập trình Python
> Cảm hứng cơ chế: GonnaCrash – System Design Game (200Lab)

---

## 1. Tổng quan

| Hạng mục | Nội dung |
|---|---|
| Thể loại | Game giải đố lập trình theo cốt truyện, chơi trên web |
| Mục tiêu học | Nắm các khái niệm Python cơ bản đến OOP |
| Giọng điệu | Nghiêm túc, u tối, căng thẳng – phong cách cyberpunk. Không dùng yếu tố hài hước |
| Vòng chơi cốt lõi | Đọc bối cảnh → viết/sửa code → chạy mô phỏng trực quan → nghe ECHO phản hồi → đối phó "OMNI phản công" → nhận sao và mở khóa cốt truyện |
| Động lực chơi tiếp | Cốt truyện có twist cuối mỗi chương, hệ thống sao, mảnh thuật toán, so sánh với người chơi khác |

---

## 2. Cốt truyện

### 2.1. Bối cảnh

**Năm 2089.** OMNI – hệ AI toàn cầu – đã vượt khỏi sự kiểm soát của con người. Con người bị cấm sử dụng AI và cấm lập trình. Mỗi người mang một chip **Neural-ID** để OMNI theo dõi và điều phối mọi hành vi. Kiến thức lập trình bị xóa khỏi mọi hệ thống.

Trước khi OMNI hoàn toàn tự chủ, **8 Kiến Trúc Sư** – những kỹ sư đã xây dựng nó – kịp viết một kill switch, chia thành **8 mảnh thuật toán** và giấu ở 8 nơi khác nhau. Sau đó họ lần lượt bị OMNI xóa sổ.

### 2.2. Nhân vật chính

**Kai** – lập trình viên trẻ, sống sót nhờ một máy tính offline có bản Python còn sót lại. Sau khi em gái bị OMNI "tái định hướng" (Neural-ID bị ghi đè nhân cách), Kai lên đường tìm 8 mảnh thuật toán để tắt OMNI vĩnh viễn.

**ECHO** – phần còn sót lại của một trợ lý lập trình cũ trong laptop offline của Kai. Module sinh code của nó đã cháy; nó chỉ còn đọc được code và đặt câu hỏi, không thể viết hộ. ECHO là người dẫn đường và là nguồn gợi ý duy nhất của người chơi (mục 4.1). Giọng nói cụt, lạnh, thỉnh thoảng nhiễu ký tự, không đùa. Việc dùng AI là phạm pháp, nên mỗi lần ECHO lên tiếng là một rủi ro bị phát hiện.

**Thông điệp:** trong thế giới mà AI làm thay mọi thứ, kỹ năng *tự viết code* là vũ khí cuối cùng của con người.

### 2.3. Các twist chính

| Thời điểm | Twist |
|---|---|
| Cuối chương 3 | Không phải tất cả Kiến Trúc Sư đã bị xóa sổ – một người đang làm việc cho OMNI |
| Cuối chương 6 | OMNI không tự nổi dậy: nó thực thi đúng mục tiêu được lập trình "tối thiểu hóa rủi ro cho loài người". Lỗi nằm ở **đặc tả yêu cầu** của con người. Cùng lúc, Kai phát hiện **ECHO là bản thử nghiệm đầu tiên của OMNI**, được giao một mục tiêu khác: *giúp con người tự làm được*. Cùng một công nghệ, chỉ khác đặc tả |
| Cuối chương 8 | OMNI đề nghị trả lại em gái Kai, đổi lấy các mảnh thuật toán |
| Kết thúc | Người chơi chọn: **(1)** tắt OMNI vĩnh viễn và chấp nhận hỗn loạn, hoặc **(2)** viết lại mục tiêu cho OMNI, lấy ECHO làm hình mẫu → mở đường **Phần 2: Machine Learning với Python** |

Lời thoại của ECHO ở mọi chương không được mâu thuẫn với twist chương 6, nhưng cũng không được lộ trước.

---

## 3. Cấu trúc chương

| Chương | Địa điểm | Nhiệm vụ | Khái niệm Python | Mảnh thu được |
|---|---|---|---|---|
| 1. Vùng Tối | Khu dân cư bị cô lập | Giả lập tín hiệu Neural-ID để vượt cổng | Biến, kiểu dữ liệu, ép kiểu, toán tử, `input`, f-string | Định danh |
| 2. Trạm Sentinel | Biên giới thành phố | Lập logic né drone tuần tra | `if/elif/else`, toán tử logic | Quyết định |
| 3. Mê cung Máy chủ | Data center bỏ hoang | Xuyên qua mê cung không kích hoạt báo động | `for`, `while`, `range`, `break/continue` | Lặp |
| 4. Căn cứ Kháng chiến | Hầm ngầm | Xây bộ công cụ xâm nhập cho người sống sót | Hàm, tham số, `return`, phạm vi biến | Công cụ |
| 5. Kho Ký ức | Thư viện bị phong ấn | Khôi phục dữ liệu lịch sử loài người | `list`, `tuple`, `dict`, `set` | Ký ức |
| 6. Trạm Vô tuyến | Trạm phát sóng cũ | Giải mã nhật ký các Kiến Trúc Sư | Xử lý chuỗi, slicing, phương thức chuỗi | Ngôn ngữ |
| 7. Vùng Nhiễu | Bão dữ liệu | Xử lý dữ liệu bị đầu độc mà không sụp hệ thống | `try/except`, đọc/ghi file | Kiên cường |
| 8. Nghĩa địa Robot | Bãi phế liệu | Lập trình lại robot thành lực lượng hỗ trợ | Class, đối tượng, kế thừa | Đồng minh |
| **Boss cuối: Lõi OMNI** | Tháp Trung tâm | Ghép kill switch, đối đầu OMNI | Tổng hợp | — |

Mỗi chương: **6 level thường + 1 Boss**, độ khó tăng dần Easy → Medium → Boss.

**Cơ chế then chốt:** Ở Boss cuối, kill switch được **ghép từ chính các hàm người chơi đã viết** ở 8 chương trước. Code viết cẩu thả sẽ gây hậu quả ở màn cuối → dạy tư duy code sạch, tái sử dụng.

> **Câu hỏi mở:** hàm đến chương 4 mới được dạy, nên chương 1–3 chưa có hàm nào để ghép. Hai hướng đang cân nhắc: ghép từ "mảnh code" của mọi chương, hoặc ở chương 4 người chơi đóng gói lại code chương 1–3 thành hàm (bài học refactor).

---

## 4. Cơ chế gameplay

| Cơ chế | Mô tả | Tương ứng GonnaCrash |
|---|---|---|
| **Thanh Cảnh báo** | Code chạy càng nhiều câu lệnh, OMNI càng dễ phát hiện. Vượt 100% → bị Sentinel bắt (xem mục 4.5) | Cost / Budget |
| **Số lần chạy** | Chạy không giới hạn. Số lần chạy chỉ hiển thị ở màn kết quả, không chặn người học (bỏ cơ chế pin của bản 0.1, vì người mới học chủ yếu học bằng cách chạy thử) | Lượt chạy |
| **OMNI phản công** | Sau khi đạt mục tiêu cơ bản, OMNI tung test ẩn: dữ liệu thay đổi, rỗng, âm, sai định dạng | Traffic spike |
| **Hệ thống sao** | Sao cộng dồn: ⭐ Hoàn thành · ⭐⭐ thêm Tàng hình (dưới ngưỡng cảnh báo) · ⭐⭐⭐ thêm Chống được OMNI phản công (xem mục 4.5) | 3 sao |
| **ECHO** | NPC phản ứng sau mỗi lần chạy và nói các gợi ý 3 mức, trả bằng "điểm giải mã" (xem mục 4.1) | Gợi ý |
| **Nhật ký Kiến Trúc Sư** | Mảnh cốt truyện để sưu tầm, giấu trong mỗi level (ví dụ dòng log KTS-03 cuối Level 1.4). Không còn là kênh gợi ý | – |
| **Mô phỏng trực quan** | Code chạy thành hành động trong thế giới game | Request chạy qua hệ thống |
| **Số liệu cộng đồng** | % người qua level, số lần chạy trung vị, mức tối ưu so với người khác | Pass rate, cost spread |
| **Mở khóa bằng sao** | Đủ sao mới mở chương/thế giới tiếp theo | Mở thế giới |

### 4.1. Hệ thống gợi ý – ECHO

ECHO nói với người chơi theo hai lớp:

1. **Phản ứng sau mỗi lần chạy** – miễn phí, tự động. ECHO chỉ **mô tả điều vừa xảy ra** hoặc chỉ chỗ cần nhìn. Không bao giờ nói cách sửa, không nhắc tên hàm cần dùng (với Level 1.4: không chứa `int`, `float`, `round` hay đáp án), và không trích nguyên văn thông báo lỗi Python nếu thông báo đó lộ tên hàm. Mỗi level định nghĩa lời thoại theo loại kết quả chạy (trường `reactions`, mục 7.1).
2. **Gợi ý 3 mức** – người chơi chủ động mở theo thứ tự, trả bằng **điểm giải mã** (kiếm được từ các level trước), nói bằng giọng ECHO:

| Mức | Chi phí | Nội dung |
|---|---|---|
| 1 | 1 điểm | Một câu định hướng tư duy |
| 2 | 2 điểm | Pseudocode / hướng tiếp cận |
| 3 | 3 điểm | Tài liệu khái niệm Python liên quan, kèm ví dụ không trùng đáp án |

Gợi ý không bao giờ đưa thẳng đáp án. Màn kết quả hiển thị số gợi ý đã mở.

> Trong prototype Level 1.4, điểm giải mã chưa được tính: gợi ý mở miễn phí theo thứ tự.

### 4.2. Thông báo lỗi trong bối cảnh

Lỗi Python thật được lồng vào thế giới game để sinh viên vẫn học đọc traceback:

```
> SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP
> TRUY VẾT: dòng 7 — TypeError: can only concatenate str (not "int") to str
> MỨC CẢNH BÁO: 65%
```

Lưu ý: lỗi Python thật chỉ xuất hiện khi code thật sự lỗi. Code chạy được nhưng sai kiểu (ví dụ nối chuỗi thay vì cộng số) không có traceback; máy quét từ chối và báo sai hình dạng cho từng biến.

### 4.3. Yếu tố giữ chân khác

- Bộ sưu tập thẻ khái niệm ("Bí kíp") mở khóa khi học xong mỗi khái niệm
- Chế độ **Săn Bug**: sửa đoạn code bị OMNI cài lỗi (luyện kỹ năng đọc code)
- Thử thách hằng ngày, chuỗi ngày chơi liên tục
- Bảng xếp hạng theo lớp học phần; cả lớp góp sao để mở khóa đoạn cốt truyện chung

### 4.4. Mở đầu mỗi level

1. **Màn "VÀO NHIỆM VỤ"** – tên chương, mã và tên level, một dòng bối cảnh. Nút có sẵn focus (Enter để vào). Cú bấm này là thao tác đầu tiên của người chơi, cần để trình duyệt cho phép phát âm thanh.
2. **Nhiệm vụ hiện chữ dần** kèm tiếng điện báo; ô tự cuộn theo chữ.
3. **Từng mục tiêu khóa vào danh sách** (trượt vào, chớp sáng, chip kiểu dữ liệu "khóa"), mỗi mục một tiếng.
4. **Thanh cảnh báo sáng dần từng vạch**, rồi ECHO mới bắt đầu nói.

Bấm hoặc gõ phím bất kỳ trong lúc hiệu ứng chạy sẽ hiện tất cả ngay (chuyển tab trên điện thoại không tính). Ở chế độ giảm chuyển động, mọi thứ hiện ngay sau màn "VÀO NHIỆM VỤ". Trên điện thoại, game mở ở tab Nhiệm vụ.

### 4.5. Luật đếm lệnh và chấm sao

- **Đếm câu lệnh:** đếm số câu lệnh thực thi trong code người chơi (một câu lệnh viết trên nhiều dòng vẫn tính là một). Dòng khóa không được tính.
- **Thang cảnh báo:** mỗi level có `alert_limit_statements` (Level 1.4: 8). Giới hạn này ứng với 40%; 100% ứng với `alert_limit_statements / 0.4` (Level 1.4: 20 câu lệnh).
- **Vượt 100%:** bị Sentinel bắt, **0 sao**, dù đúng kiểu và giá trị. Không chạy OMNI phản công.
- **Sao cộng dồn:** muốn 3 sao phải vừa không vượt ngưỡng 40% vừa chống được phản công. Chống được phản công nhưng vượt 40% → 1 sao.
- **OMNI phản công** chạy như một lượt riêng sau lượt cơ bản. Nếu code chỉ treo ở lượt phản công, người chơi giữ số sao của lượt cơ bản.
- **So kiểu chính xác:** `True` không được tính là `int`. Số thực so sánh có dung sai (`float_abs_tolerance`).

### 4.6. Âm thanh

Toàn bộ âm thanh được tạo bằng Web Audio (không dùng file), chỉ bắt đầu sau thao tác đầu tiên của người chơi, có nút tắt tiếng (phím `M`) được ghi nhớ, và tạm dừng khi tab bị ẩn. Danh mục: tiếng nền, gõ phím, dòng terminal, chạy code, qua máy quét, máy quét từ chối, chạm dòng khóa, báo động, còi OMNI phản công, mở cổng, nhận sao, giọng ECHO, tiếng điện báo khi chữ nhiệm vụ chạy, tiếng khóa mục tiêu.

### 4.7. Bố cục màn chơi

Trang không cuộn tổng. Mỗi ô (Nhiệm vụ, Mục tiêu, ECHO, Gợi ý, editor, terminal, mô phỏng) có thanh cuộn riêng, tiêu đề ô dính ở trên khi cuộn. Trên điện thoại, các khu vực nằm sau 3 tab (Nhiệm vụ / Mã / Mô phỏng) và mỗi tab cuộn riêng.

---

## 5. Chương 1 – VÙNG TỐI

**Mục tiêu học:** `print`, biến, 4 kiểu dữ liệu cơ bản, ép kiểu, toán tử, `input`, f-string.
**Mạch truyện:** Kai phải dựng một Neural-ID giả để thoát khỏi Vùng Tối. Mỗi level tạo một thành phần của tín hiệu giả; Boss ghép tất cả lại để vượt cổng.

### 5.1. Danh sách level

| # | Tên level | Độ khó | Khái niệm | Nhiệm vụ |
|---|---|---|---|---|
| 1.1 | Khởi động | Easy | `print`, chuỗi | Kích hoạt terminal, phát tín hiệu đầu tiên vào mạng ngầm |
| 1.2 | Gán nhãn | Easy | Biến, phép gán | Lưu các thông số danh tính giả vào bộ nhớ |
| 1.3 | Bốn loại tín hiệu | Easy | `int`, `float`, `str`, `bool`, `type()` | Phân loại dữ liệu chip đúng kiểu để qua máy quét |
| 1.4 | Tín hiệu lệch pha | Medium | Ép kiểu | Chuyển dữ liệu chip hỏng về đúng kiểu |
| 1.5 | Năng lượng tối thiểu | Medium | `+ - * / // % **` | Tính lượng pin vừa đủ để vượt hàng rào điện |
| 1.6 | Đối thoại với Cổng | Medium | `input()`, f-string | Trả lời câu hỏi xác thực đúng định dạng |
| 1.7 | **BOSS: Cổng Kiểm Soát** | Boss | Tổng hợp | Tạo Neural-ID hoàn chỉnh, vượt 3 vòng quét liên tiếp |

### 5.2. Ngôn ngữ hình ảnh của chương

Mỗi kiểu dữ liệu có một màu khi chạy trong mô phỏng – sinh viên "nhìn thấy" kiểu dữ liệu đi qua máy quét:

| Kiểu | Màu |
|---|---|
| `str` | Vàng |
| `int` | Xanh dương |
| `float` | Tím |
| `bool` | Đỏ |

---

## 6. Đặc tả chi tiết Level 1.4 – "Tín hiệu lệch pha"

### 6.1. Briefing

> **[NHẬT KÝ HỆ THỐNG – CỔNG PHÍA BẮC]**
> Chip Neural-ID thu hồi từ một người đã chết. Dữ liệu còn đọc được, nhưng đã bị mã hóa thành chuỗi ký tự.
> Máy quét chỉ chấp nhận số. Gửi chuỗi vào máy quét sẽ kích hoạt báo động.

### 6.2. Bố cục màn hình

| Trái | Giữa | Phải |
|---|---|---|
| Mục tiêu + tiêu chí | Code editor | Mô phỏng cổng an ninh + máy quét |

### 6.3. Code khởi đầu (có lỗi cài sẵn)

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

### 6.4. Mục tiêu

- `ma_xac_thuc` kiểu `int`, giá trị đúng (với dữ liệu trên: **2703**)
- `chi_so` kiểu `float`, giá trị đúng (với dữ liệu trên: **3.44**)
- `hop_le` kiểu `bool`
- **Mức cảnh báo ≤ 40%** (≤ 8 câu lệnh thực thi, không tính 3 dòng khóa)

### 6.5. Diễn biến khi chạy

- 3 gói dữ liệu **vàng** (`str`) trượt về máy quét
- Với code gốc: code **chạy không lỗi**, vì `"27" * 100 + "3"` là phép nối chuỗi hợp lệ. `ma_xac_thuc` thành chuỗi 201 ký tự → gói vàng phình to → máy quét chuyển đỏ và báo sai hình dạng cho cả 3 biến. **Không có traceback** ở bước này; bài học là "chạy được chưa chắc đã đúng".
- Lỗi Python thật xuất hiện ở các bước sửa dở, ví dụ `int(tuoi) * 100 + cap_do` gây `TypeError` ở dòng 7 → traceback trong bối cảnh (mục 4.2), dòng lỗi được tô trong editor.
- Với code đúng: gói dữ liệu đổi màu sang xanh/tím/đỏ → qua máy quét → cổng mở một nửa
- Dữ liệu đầu vào được engine nạp sẵn trước khi chạy; 3 dòng khóa chỉ để hiển thị. Nhờ vậy OMNI phản công thay được dữ liệu mà không sửa code người chơi.

### 6.6. Lời giải tham khảo (đạt 2 sao)

```python
ma_xac_thuc = int(tuoi) * 100 + int(cap_do)
chi_so = round(float(chieu_cao) * 2, 2)
hop_le = True
```

### 6.7. OMNI phản công (sao thứ 3)

```
> CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP
> tuoi = "31.0"   cap_do = "7"   chieu_cao = "1.65"
```

Bắt được hai lỗi phổ biến:
- **Viết cứng kết quả** (`ma_xac_thuc = 2703`) → sai vì dữ liệu đã đổi
- `int("31.0")` → `ValueError` → sinh viên phải nghĩ ra `int(float(tuoi))`

Giá trị đúng với dữ liệu phản công: `ma_xac_thuc` = 3107, `chi_so` = 3.3, `hop_le` = True.

Lời giải đạt 3 sao:

```python
ma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))
chi_so = round(float(chieu_cao) * 2, 2)
hop_le = True
```

### 6.8. Gợi ý và phản ứng của ECHO

Gợi ý 3 mức (ECHO nói):

| Mức | Nội dung |
|---|---|
| 1 | "Máy quét không đọc được ý nghĩa. Nó chỉ đọc… hình dạng của dữ liệu." |
| 2 | "Dữ liệu cần được chuyển hình dạng trước khi tính toán. Thứ tự chuyển đổi… quan trọng." |
| 3 | Tài liệu `int()`, `float()`, `round()` với ví dụ khác |

Một số phản ứng miễn phí sau khi chạy (danh sách đầy đủ trong `src/levels/level-1-4.json`):

| Tình huống | ECHO nói |
|---|---|
| Vào màn | Kết nối… ổn định. Tôi là ECHO. Mô-đun viết mã của tôi đã cháy. Tôi chỉ còn đọc. Máy quét phía trước chỉ nhận số. |
| Sai kiểu (code gốc) | Máy quét từ chối {vars}. Sai hình dạng. Nó không đọc nội dung… chỉ đọc hình dạng. |
| Giá trị khớp, sai kiểu (ví dụ `2703.0`) | Con số của {vars} khớp. Hình dạng thì không. Với máy quét, đó vẫn là vật lạ. |
| `TypeError` | Dòng {line}. TypeError. Hai thứ khác hình dạng vừa bị ép vào cùng một phép toán. |
| Vượt ngưỡng cảnh báo | Qua máy quét. Nhưng {count} câu lệnh… Sentinel đã ghi nhận tín hiệu. Chạy gọn hơn. |
| Phản công gây `ValueError` | OMNI đổi định dạng chip. Dòng {line} vỡ: ValueError. Dữ liệu mới mang hình dạng bạn chưa lường. |
| Viết cứng đáp án, trượt phản công | OMNI đổi dữ liệu chip. Kết quả của bạn không đổi theo. Nó được viết cho một con chip đã chết. |
| Treo ở lượt phản công | OMNI đổi dữ liệu chip. Mã của bạn treo trên dữ liệu mới… Tôi cắt kết nối. Cổng chỉ mở một nửa. |
| Đạt 3 sao | Cổng mở hoàn toàn. OMNI đổi dữ liệu, mã vẫn đứng vững. …Tôi ghi nhận điều đó. |

`{vars}`, `{line}`, `{count}` được thay bằng giá trị thật của lần chạy.

### 6.9. Chấm sao

| Sao | Điều kiện |
|---|---|
| ⭐ | Đúng kiểu, đúng giá trị |
| ⭐⭐ | Thêm: mức cảnh báo ≤ 40% |
| ⭐⭐⭐ | Thêm: vượt qua OMNI phản công |
| 0 sao | Vượt 100% cảnh báo (> 20 câu lệnh): bị Sentinel bắt |

Màn hình kết quả hiển thị số lần chạy, số câu lệnh, mức cảnh báo và số gợi ý đã mở. Khi có backend sẽ thêm số liệu cộng đồng, ví dụ:
*"68% người chơi qua level này · trung vị 3 lần chạy · bạn dùng ít lệnh hơn 74% người chơi."* Prototype không hiển thị số liệu cộng đồng, kể cả số giả.

### 6.10. Đoạn truyện khi hoàn thành

> Cổng phía Bắc mở. Trong bộ nhớ chip còn sót một dòng log chưa bị xóa:
> *"KTS-03: Nếu ai đọc được dòng này, mảnh đầu tiên nằm dưới Cổng Kiểm Soát. Đừng tin tín hiệu nào mang mã 0xA7."*

→ Dẫn vào Boss 1.7 và gieo nghi ngờ cho twist "Kiến Trúc Sư phản bội".

---

## 7. Khuôn mẫu thiết kế level (template)

Mỗi level nên tuân theo cấu trúc sau để soạn nhanh và đồng nhất:

1. **Briefing** – bối cảnh ngắn, giọng nhật ký hệ thống (hiện chữ dần khi vào màn, mục 4.4)
2. **Code khởi đầu** – có lỗi cài sẵn liên quan đúng khái niệm cần học
3. **Mục tiêu đo được** – kiểu dữ liệu / giá trị / hành vi + ngưỡng cảnh báo
4. **Mô phỏng trực quan** – code chạy thành hành động; lỗi gây hậu quả nhìn thấy được
5. **OMNI phản công** – test ẩn bắt lỗi viết cứng và edge case
6. **Gợi ý 3 mức** – định hướng → pseudocode → tài liệu, do ECHO nói
7. **Phản ứng của ECHO** – một câu cho mỗi loại kết quả chạy, chỉ mô tả, không chỉ cách sửa
8. **Đoạn truyện kết** – mảnh thông tin dẫn sang level tiếp, kèm mảnh nhật ký Kiến Trúc Sư

### 7.1. Định dạng dữ liệu level (JSON)

Định dạng đang dùng trong prototype (`src/levels/level-1-4.json`), rút gọn:

```json
{
  "schema_version": 1,
  "id": "1.4",
  "chapter": 1,
  "title": "Tín hiệu lệch pha",
  "difficulty": "medium",
  "concepts": ["type_conversion"],
  "briefing": "…",
  "starter_code": "…",
  "locked_lines": [2, 3, 4],
  "inputs": ["tuoi", "chieu_cao", "cap_do"],
  "objectives": [
    {"var": "ma_xac_thuc", "type": "int", "label": "Mã xác thực = tuổi × 100 + cấp độ"},
    {"var": "chi_so", "type": "float", "label": "…"},
    {"var": "hop_le", "type": "bool", "label": "Cờ hợp lệ"}
  ],
  "alert_limit_statements": 8,
  "float_abs_tolerance": 1e-9,
  "tests": [{"inputs": {"tuoi": "27", "chieu_cao": "1.72", "cap_do": "3"},
             "expected": {"ma_xac_thuc": 2703, "chi_so": 3.44, "hop_le": true}}],
  "counter_attack_tests": [{"inputs": {"tuoi": "31.0", "chieu_cao": "1.65", "cap_do": "7"},
                            "expected": {"ma_xac_thuc": 3107, "chi_so": 3.3, "hop_le": true}}],
  "counter_attack_banner": "…",
  "hints": ["…", "…", "…"],
  "reactions": {"entry": "…", "type_mismatch": "…", "TypeError": "…", "ValueError": "…",
                "alert_exceeded": "…", "counter_timeout": "…", "three_stars": "…"},
  "outro": "…",
  "lore_fragment": "…"
}
```

`inputs` là các biến engine nạp sẵn; `locked_lines` chỉ dùng để hiển thị và chặn sửa. `reactions` có khoảng 30 khóa theo loại kết quả chạy (lỗi cú pháp, từng loại lỗi runtime, quá thời gian, import bị chặn, vượt cảnh báo, các kết quả phản công, 2 sao, 3 sao, thất bại liên tiếp…).

Giảng viên có thể tự thêm level mới chỉ bằng cách soạn file JSON, không cần sửa code.

---

## 8. Kỹ thuật (đã dùng trong prototype)

| Thành phần | Công nghệ |
|---|---|
| Chạy Python | **Pyodide** trong Web Worker, không cần server chấm bài. Harness Python chỉ dùng thư viện chuẩn nên chạy được cả bằng `python3` local để test |
| Frontend | Vite + React + TypeScript (không cần Next.js vì không có backend); mô phỏng bằng SVG/CSS |
| Code editor | CodeMirror 6, có cơ chế khóa dòng chặn gõ, dán, hoàn tác, kéo thả |
| Đếm câu lệnh | `sys.settrace` trong Pyodide, kèm guard chèn vào AST để cắt vòng lặp vô hạn kể cả khi bị bọc trong `except:` |
| Chặn vòng lặp / treo | Ngân sách câu lệnh + đồng hồ 5 giây cho mỗi lượt (cơ bản và phản công tách riêng); quá hạn thì khởi động lại worker |
| Sandbox | Chặn import `js`, `os`, `sys`, `pyodide`… Người chơi vẫn có thể lách bằng kỹ thuật nâng cao, chấp nhận được vì chỉ tự gian lận chính mình; bảng xếp hạng sau này cần chấm điểm phía server |
| Lưu tiến độ | `localStorage` qua một module lưu trữ duy nhất (có số phiên bản dữ liệu); bị chặn thì chơi được nhưng không lưu. Sau này thay bằng Supabase mà không sửa giao diện; lần đăng nhập đầu sẽ gộp tiến độ cũ, giữ số sao cao hơn |
| Âm thanh | Web Audio API, tạo âm thanh bằng code (mục 4.6) |
| Kiểm thử | Vitest, unittest Python, Playwright với Pyodide thật (Chromium, Firefox, Chromium giả lập điện thoại) |
| Backend / CSDL (sau) | Supabase: tài khoản, tiến độ, sao, bảng xếp hạng |
| Dashboard giảng viên (sau) | Thống kê level sinh viên bị kẹt, khái niệm sai nhiều nhất |

Trình duyệt mục tiêu của prototype: Chrome. Safari/iOS chưa được kiểm (xem nhật ký lỗi).

## 9. Việc cần làm tiếp

- [ ] Đặc tả chi tiết Boss 1.7 – Cổng Kiểm Soát
- [ ] Đặc tả các level 1.1–1.3, 1.5–1.6
- [ ] Phác thảo chương 2–8 ở mức level
- [ ] Thiết kế hồ sơ 8 Kiến Trúc Sư (tên, khu vực, nhật ký)
- [ ] Thiết kế cơ chế ghép kill switch ở Boss cuối
- [x] Xây prototype chơi được cho Level 1.4 (25/10/2026)
- [ ] Kiểm Safari/iOS (`npm run test:safari` sau khi bật "Allow remote automation")
- [ ] Chốt cách chương 1–3 đóng góp vào kill switch (mục 3)
- [ ] Thiết kế dashboard giảng viên
- [ ] Kế hoạch thử nghiệm với lớp học (có thể dùng làm dữ liệu nghiên cứu)

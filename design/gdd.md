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

1. **Phản ứng sau mỗi lần chạy** – miễn phí, tự động. ECHO chỉ **mô tả điều vừa xảy ra** hoặc chỉ chỗ cần nhìn. Không bao giờ nói cách sửa, không nhắc tên hàm cần dùng (với Level 1.4: không chứa `int`, `float`, `round` hay đáp án), và không trích nguyên văn thông báo lỗi Python nếu thông báo đó lộ tên hàm. Mỗi level định nghĩa lời thoại theo loại kết quả chạy (trường `reactions`, mục 7.1). ECHO không nói cùng một câu ở hai lượt chạy liền nhau: khi lượt sau ra cùng khóa, ECHO dùng câu thay thế trong `reaction_variants` (nếu level có), không thì thêm "Vẫn vậy." vào đầu câu. Câu thay thế chịu cùng luật và cùng test chống lộ với `reactions`.
2. **Gợi ý 3 mức** – người chơi chủ động mở theo thứ tự, trả bằng **điểm giải mã** (kiếm được từ các level trước), nói bằng giọng ECHO:

| Mức | Chi phí | Nội dung |
|---|---|---|
| 1 | 1 điểm | Một câu định hướng tư duy |
| 2 | 2 điểm | Pseudocode / hướng tiếp cận |
| 3 | 3 điểm | Tài liệu khái niệm Python liên quan, kèm ví dụ không trùng đáp án |

Gợi ý không bao giờ đưa thẳng đáp án. Màn kết quả hiển thị số gợi ý đã mở.

**Cách ECHO hiện trên màn chơi.** ECHO nói qua một khung chat nổi, không chiếm cột Nhiệm vụ:

- **Nút ECHO** (chân dung nhiễu sóng thu nhỏ) có chấm báo khi có câu chưa đọc.
- **Bong bóng xem trước:** mỗi câu mới (câu vào màn sau intro, phản ứng sau mỗi lượt chạy) hiện cạnh nút, gõ chữ kèm giọng ECHO. Bong bóng không tự tắt: nó ở lại tới khi người chơi đóng, mở khung chat, hoặc lượt chạy sau thay câu.
- **Khung chat** (bấm nút hoặc bong bóng, phím `E` ngoài ô gõ chữ; Esc đóng) chứa lịch sử hội thoại của level trong phiên chơi, mới nhất ở dưới, có nhãn "Lượt chạy #n" / "Gợi ý mức n". Cuối khung là **Nhật ký gợi ý**: nút giải mã mức tiếp theo, bấm hai lần để xác nhận; gợi ý đã mở hiện như tin ECHO trong luồng chat.
- Khung không chặn màn chơi: có thể để mở trong lúc sửa code và chạy.
- Lịch sử chat chỉ sống trong phiên. Số gợi ý đã mở được lưu, nên sau khi tải lại, gợi ý đã mở vẫn có trong khung.
- Hộp kết quả nhắc lại câu ECHO của lượt chạy.

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
4. **Thanh cảnh báo sáng dần từng vạch**, rồi ECHO "thức dậy": bong bóng đầu tiên hiện cạnh nút ECHO với câu vào màn. Nếu level có `task_steps`, bong bóng có thêm dòng "Mở để xem việc cần làm (E)" và nút ECHO ghi "việc cần làm" cho tới khi người chơi mở khung chat lần đầu ở level đó trong phiên. Khung chat không tự mở.

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

Trang không cuộn tổng. Ba cột: Nhiệm vụ (ô Nhiệm vụ, ô Mục tiêu), Mã (editor, terminal), Mô phỏng. Mỗi ô có thanh cuộn riêng, tiêu đề ô dính ở trên khi cuộn. ECHO, Việc cần làm và Nhật ký gợi ý nằm trong khung chat nổi (mục 4.1):

- Màn rộng: nút ECHO ở chân cột Nhiệm vụ (cột chừa chỗ cho nút). Khung chat mở ngay trên nút, rộng bằng cột, cao tối đa 80% màn hình, tự cuộn.
- Màn vừa (768–1199 px): cột Nhiệm vụ nằm dưới phải, nút và khung đi theo cột.
- Điện thoại: các khu vực nằm sau 3 tab (Nhiệm vụ / Mã / Mô phỏng), mỗi tab cuộn riêng. Nút ECHO nằm ở cuối thanh tab nên không che nút CHẠY. Bong bóng hiện ngay dưới nút. Khung chat là tấm trượt từ dưới lên, cao tối đa 85%, có nút đóng 44 px.
- Giảm chuyển động: bong bóng và khung hiện ngay, không gõ chữ, không trượt.
- Ô Nhiệm vụ gập lại được bằng tiêu đề (nút có mũi tên); gập thì chỉ còn một dòng (dòng tiêu đề nhật ký và "Mở lại") để Mục tiêu dùng chỗ trống. Ô tự gập một lần sau lượt chạy đầu tiên của level trong phiên, mở lại thì không tự gập nữa; trong phần mở đầu (mục 4.4) ô luôn mở.
- **Việc cần làm** (`task_steps`) nối tiếp tin "Vào nhiệm vụ" đầu tiên của ECHO trong khung chat, như một lượt chat chung: 2–4 bước đánh số, giọng hướng dẫn, chữ trong backtick hiện thành code. Level không có `task_steps` thì tin "Vào nhiệm vụ" chỉ có câu `entry`.
- **Tổng kết kiến thức** (`#/learn/<id>`): qua level (≥ 1 sao), TIẾP TỤC ở hộp kết quả mở màn tổng kết trước đoạn chuyển cảnh, mỗi lần đều hiện, không lưu đã xem. Giọng kỹ thuật, không ECHO, không hiệu ứng game: từng mục có giải thích, khối code và "Kết quả:", danh sách "Lỗi bạn có thể đã gặp", dòng "Ở màn sau". Khung tự cuộn, trang không cuộn; một nút TIẾP TỤC có sẵn focus (Enter/Space). Bản đồ có ô "Kiến thức" để mở lại tổng kết của level đã qua (xong thì về bản đồ). Level không có `knowledge_summary` thì bỏ qua bước này.

---

## 5. Chương 1 – VÙNG TỐI

**Mục tiêu học:** `print`, biến, 4 kiểu dữ liệu cơ bản, ép kiểu, toán tử, `input`, f-string.
**Mạch truyện:** Kai phải dựng một Neural-ID giả để thoát khỏi Vùng Tối. Mỗi level tạo một thành phần của tín hiệu giả; Boss ghép tất cả lại để vượt cổng. Tên riêng, địa điểm, mảnh nhật ký và móc câu của từng level: `design/gdd-mo-dau.md` mục 1 và 6.

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

## 6. Đặc tả từng level

Mỗi level có một GDD riêng trong `design/chuong-<n>/gdd-<chương>.<level>-<slug>.md`. Phần mở đầu game ở `design/gdd-mo-dau.md`.

| Level | File |
|---|---|
| Mở đầu, chuyển cảnh, trục truyện Chương 1 | `design/gdd-mo-dau.md` |
| 1.1 Khởi động | `design/chuong-1/gdd-1.1-khoi-dong.md` |
| 1.2 Gán nhãn | `design/chuong-1/gdd-1.2-gan-nhan.md` |
| 1.3 Bốn loại tín hiệu | `design/chuong-1/gdd-1.3-bon-loai-tin-hieu.md` |
| 1.4 Tín hiệu lệch pha | `design/chuong-1/gdd-1.4-tin-hieu-lech-pha.md` |
| 1.5 Năng lượng tối thiểu | `design/chuong-1/gdd-1.5-nang-luong-toi-thieu.md` |
| 1.6 Đối thoại với Cổng | `design/chuong-1/gdd-1.6-doi-thoai-voi-cong.md` |
| 1.7 BOSS Cổng Kiểm Soát (kèm đoạn hết chương) | `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md` |

Thay đổi engine dùng chung cho 1.5–1.7 (kênh nhập cho `input()`, nhiều vòng quét, kết chương, thứ tự làm và số migration): `docs/hop-dong-engine-level-1-5-den-1-7.md`.

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
  "counter_attack_tests": [{"inputs": {"tuoi": "31.0", "chieu_cao": "1.653", "cap_do": "7"},
                            "expected": {"ma_xac_thuc": 3107, "chi_so": 3.31, "hop_le": true}}],
  "counter_attack_banner": "…",
  "hints": ["…", "…", "…"],
  "reactions": {"entry": "…", "type_mismatch": "…", "TypeError": "…", "ValueError": "…",
                "alert_exceeded": "…", "counter_timeout": "…", "three_stars": "…"},
  "outro": "…",
  "lore_fragment": "…"
}
```

Hai trường tùy chọn (level không có vẫn hợp lệ):

```json
"task_steps": ["Sửa 3 lệnh `print` để terminal in ra đúng 3 dòng ở ô Mục tiêu, từng ký tự.", "Bấm CHẠY."],
"knowledge_summary": {
  "title": "…",
  "sections": [{"heading": "…", "body": "…", "code": "print(\"Xin chao\")", "output": "Xin chao"}],
  "mistakes": [{"code": "print(ho_ten)", "error": "NameError: name 'ho_ten' is not defined", "explain": "…"}],
  "next": "…"
}
```

- `task_steps`: 2–4 chuỗi không rỗng; chữ trong backtick hiện thành code. Không được chứa giá trị kỳ vọng hay dòng output kỳ vọng nào của test (validator kiểm); được nêu tên hàm như `print`.
- `knowledge_summary`: không kiểm lộ đáp án. `sections` không rỗng; `code`, `output` tùy chọn, có `output` thì phải có `code`. Mọi `code` trong `sections` phải chạy không lỗi bằng Python thật và in đúng `output` (`tests/integration/knowledge-summary.test.ts`); code gây lỗi đặt ở `mistakes`. `next` là câu sau tiêu đề "Ở màn sau", không lặp lại cụm đó.

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
| Lưu tiến độ | Theo tài khoản trên server (Vercel + Cloudflare D1), qua một module lưu trữ duy nhất. Tiến độ cũ trong `localStorage` được gộp vào tài khoản ở lần vào game đầu, giữ số sao cao hơn, rồi xóa khỏi máy. Xem `docs/quyet-dinh-ky-thuat.md` |
| Âm thanh | Web Audio API, tạo âm thanh bằng code (mục 4.6) |
| Kiểm thử | Vitest, unittest Python, Playwright với Pyodide thật (Chromium, Firefox, Chromium giả lập điện thoại) |
| Backend / CSDL | Vercel Functions + Cloudflare D1 (qua Worker cổng), thư qua Gmail SMTP: tài khoản kích hoạt qua email, tiến độ, sao. Bảng xếp hạng chưa làm. Xem `docs/quyet-dinh-ky-thuat.md` |
| Dashboard giảng viên (sau) | Thống kê level sinh viên bị kẹt, khái niệm sai nhiều nhất |

Trình duyệt mục tiêu của prototype: Chrome. Safari/iOS chưa được kiểm (xem nhật ký lỗi).

## 9. Việc cần làm tiếp

- [x] Đặc tả chi tiết Boss 1.7 – Cổng Kiểm Soát và đoạn hết Chương 1 (28/10/2026)
- [x] Đặc tả mở đầu game, chuyển cảnh và level 1.1–1.3 (25/10/2026)
- [x] Đặc tả các level 1.5–1.6 (28/10/2026)
- [x] Dựng level 1.5–1.7 và đoạn hết Chương 1 theo `docs/hop-dong-engine-level-1-5-den-1-7.md` (28/10/2026)
- [ ] Phác thảo chương 2–8 ở mức level
- [ ] Thiết kế hồ sơ 8 Kiến Trúc Sư (tên, khu vực, nhật ký)
- [ ] Thiết kế cơ chế ghép kill switch ở Boss cuối
- [x] Xây prototype chơi được cho Level 1.4 (25/10/2026)
- [ ] Kiểm Safari/iOS (`npm run test:safari` sau khi bật "Allow remote automation")
- [ ] Chốt cách chương 1–3 đóng góp vào kill switch (mục 3)
- [ ] Thiết kế dashboard giảng viên
- [ ] Kế hoạch thử nghiệm với lớp học (có thể dùng làm dữ liệu nghiên cứu)

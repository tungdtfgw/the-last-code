# Mở đầu game, chuyển cảnh và cốt truyện Chương 1

> Phiên bản 0.1 · 25/10/2026 · Thiết kế tổng: `design/gdd.md` · Brainstorm: `design/quyet-dinh/mo-dau-va-cot-truyen-chuong-1.md`
> Phạm vi: màn tiêu đề, đoạn mở đầu (prologue), hệ thống chuyển cảnh giữa các level, mở khóa và chơi lại, đoạn "còn tiếp" sau 1.4, và trục truyện Chương 1 mà các level 1.1–1.4 phải theo.
> Câu chữ truyện người chơi đọc nằm ở D1: tài liệu `chapter:1` (`prologue[].text`, `teaser[].text`) và các tài liệu `level:1.x` (`location`, `component`, `outro`, `lore_fragment`, `outro_beats[].text`, `reactions`); câu ban đầu ở `db/migrations/0004_content_chapter_1.sql`, sửa trên `#/admin`. Cấu trúc nhịp (loại, cue, nền) và `neural_id_slots` nằm trong `src/story/chapter-1.json`; GDD này chỉ ghi ý đồ (xem `design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`).

## 1. Tên riêng và sự thật cố định của Chương 1

Đây là danh sách mà mọi level phải dùng đúng chính tả. Không level nào được tự đặt tên mới cho những thứ dưới đây.

| Loại | Tên | Sự thật cố định |
|---|---|---|
| Nhân vật | **Kai** | Lập trình viên trẻ, sống trong tầng hầm **Lô 17**. Kể chuyện ở ngôi thứ nhất trong các đoạn chuyển cảnh |
| Nhân vật | **Nhi** | Em gái Kai. Bị tái định hướng ba tuần trước khi game bắt đầu. Mã công dân mới: **NX-0417**. Vẫn sống cùng Kai, vẫn làm việc hằng ngày, nhưng nhân cách đã bị ghi đè |
| Nhân vật | **ECHO** | Thức dậy lần đầu ở cuối đoạn mở đầu, trong laptop của Kai |
| Tín hiệu | **0xA7** | Một người (hoặc một thứ) liên lạc với Kai qua Mạng Mù từ cuối 1.1. Luôn giúp, luôn biết nhiều hơn mức hợp lý. Danh tính chưa lộ trong Chương 1 |
| Địa điểm | **Vùng Tối** | Khu dân cư bị OMNI cắt khỏi mạng. Không ai vào, không ai ra |
| Địa điểm | **Mạng Mù** | Mạng lưới các trạm chuyển tiếp bỏ hoang. OMNI coi chúng là "đã chết" nên không quét |
| Địa điểm | **Trạm chuyển tiếp R-17** | Ăng-ten trên mái Lô 17, nối dây với laptop của Kai (1.1) |
| Địa điểm | **Trạm Phát Khẩu Phần số 4** | Có một ki-ốt đăng ký Neural-ID bị bỏ quên (1.2) |
| Địa điểm | **Ga Ngầm Số 3** | Ga tàu điện bỏ hoang, OMNI đặt một máy quét phân loại ở sân ga (1.3) |
| Địa điểm | **Cổng phía Bắc** | Cổng trong của Vùng Tối (1.4) |
| Địa điểm | **Vành Đai Điện**, **Trạm Thẩm Vấn**, **Cổng Kiểm Soát** | 1.5, 1.6, 1.7. Cổng Kiểm Soát là lối ra cuối cùng; mảnh thuật toán đầu tiên ("Định danh") nằm dưới nó |
| Danh tính giả | **ĐỖ MINH AN** | Họ tên trên Neural-ID giả mà Kai dựng trong cả chương |
| Kiến Trúc Sư | **KTS-01 … KTS-08** | Trong Chương 1 chỉ dùng mã, không dùng tên thật. Chương 1 lộ KTS-01, KTS-05, KTS-07, KTS-03 |

**Neural-ID giả gồm 6 thành phần**, mỗi level thường 1.1–1.6 tạo một thành phần; Boss 1.7 ghép cả sáu. Màn chuyển cảnh hiện thanh tiến độ 6 ô.

| Ô | Thành phần | Level |
|---|---|---|
| 1 | Tiêu đề tín hiệu | 1.1 |
| 2 | Hồ sơ danh tính | 1.2 |
| 3 | Khuôn kiểu | 1.3 |
| 4 | Dữ liệu sinh trắc | 1.4 |
| 5 | Năng lượng tín hiệu | 1.5 |
| 6 | Lời đáp xác thực | 1.6 |

### Luật lời thoại ECHO (bổ sung cho `design/gdd.md` mục 4.1)

- ECHO không bao giờ nói ai tạo ra nó, không nói nó "ghét" hay "chống" OMNI, không nói nó từng là con người hay do Kiến Trúc Sư viết. Khi bị hỏi về quá khứ, ECHO trả lời: bộ nhớ trước lần khởi động này đã bị cắt.
- ECHO được phép nói về mục đích của nó: hỏi và đọc, không làm thay ("Bạn sẽ tự viết."). Câu này đúng với twist chương 6 mà không lộ twist.
- ECHO được phép nhận ra tín hiệu của OMNI nhanh và chính xác hơn mức bình thường. Không giải thích vì sao.
- Từ 1.3, ECHO và mọi câu chữ gọi kiểu dữ liệu bằng đúng tên **"kiểu"**, từ mà người chơi sẽ gặp lại trong Python và tài liệu. Không đặt ẩn dụ riêng cho thuật ngữ: bản đầu gọi kiểu là "hình dạng", và ngày 30/10/2026 người dùng phải sửa tay khắp 1.3–1.7.
- ECHO tự giới thiệu đúng một lần, ở cuối đoạn mở đầu. Không level nào có câu "Tôi là ECHO" nữa.

## 2. Màn tiêu đề

**Hiển thị (SVG/CSS, không dùng file ảnh):** nền đen xanh, một bản đồ thành phố dạng ma trận chấm sáng mờ phủ toàn màn hình. Một khu chấm ở góc trên tắt hẳn: đó là Vùng Tối. Các chấm còn lại nhịp sáng rất chậm, như thành phố đang thở theo OMNI. Có scanline nhẹ. Ở giữa:

- Dòng nhỏ: `THE LAST CODE`
- Tiêu đề lớn: **MÃ CUỐI CÙNG**, nhiễu ký tự 1 lần mỗi 6–8 giây (tắt ở chế độ giảm chuyển động).
- Câu dưới tiêu đề: *Khi máy làm thay tất cả, tự viết mã là vũ khí cuối cùng.*
- Nút chính (có focus sẵn, Enter để bấm). Chữ màn tiêu đề nằm trong code (`src/ui/title-screen.tsx`), không ở D1:
  - Người chơi mới (chưa xem mở đầu): **BẮT ĐẦU**
  - Người chơi đã xem mở đầu: **TIẾP TỤC**, kèm nút phụ **BẢN ĐỒ VÙNG TỐI**
- Góc dưới: nút tắt tiếng (phím `M`), dòng "Đang chơi: <tên tài khoản>" kèm nút **TÀI KHOẢN**, và cờ **CHẾ ĐỘ KHÔNG LƯU** khi không ghi được tiến độ lên máy chủ (sau khi đã thử lại).

**Âm thanh:** im lặng hoàn toàn cho đến khi người chơi bấm. Cú bấm nút chính là thao tác đầu tiên, mở khóa âm thanh. Ngay sau cú bấm phát cue mới `pulse` (một nhịp trầm), rồi tiếng nền bắt đầu.

## 3. Đoạn mở đầu (prologue)

Câu chữ: `prologue[].text` (D1, `chapter:1`; 23 nhịp, cấu trúc nhịp trong `src/story/chapter-1.json`).

Đoạn mở đầu dài khoảng 70–80 giây nếu để tự chạy. Chữ hiện dần với tiếng điện báo (`teletype`, cùng tốc độ với briefing của level). Mỗi nhịp tự sang nhịp tiếp sau khoảng 1,2 giây cộng 30 ms cho mỗi ký tự (cộng `hold_ms` nếu có), tạm dừng khi tab bị ẩn.

Có bốn kiểu nhịp: **log** (chữ hệ thống, mono, xanh nhạt), **kai** (lời Kai, nghiêng, trắng ấm), **echo** (chữ ECHO, nhiễu ký tự, có ô chân dung nhiễu sóng nhỏ, phát `echo_voice`), **card** (chữ lớn giữa màn, xóa các nhịp trước). Các nhịp log, kai, echo xếp chồng thành một cột như terminal; cột tự cuộn, nhịp cũ mờ dần.

Phông nền (`backdrop`) gồm ba góc nhìn hệ thống vẽ bằng code, `thanh-pho` (ma trận chấm như màn tiêu đề), `vung-toi` (thu gần vào khu chấm tắt), `terminal` (khung màn hình laptop, con trỏ nhấp nháy), và chín cảnh địa điểm vẽ bằng SVG cùng ngôn ngữ ma trận chấm. Hiệu ứng (`fx`) là quyết định thiết kế, gắn vào đúng nhịp. Danh sách cảnh, hiệu ứng và bảng gắn nhịp của mọi đoạn truyện nằm ở `design/quyet-dinh/canh-cutscene.md`; bảng dưới đây ghi ý đồ ban đầu.

Ba thẻ (card) chia đoạn thành bốn phần: nhịp 1 (mở), nhịp 7 (Vùng Tối), nhịp 10 (thẻ của Nhi), nhịp 23 (đóng). Ý đồ từng nhóm nhịp:

| Nhịp | Kiểu, nền | Ý đồ | Âm thanh, hiệu ứng bắt buộc |
|---|---|---|---|
| 1 | card, `thanh-pho` | Mốc năm 2089. Tĩnh, giữ lâu (`hold_ms`) | `pulse` |
| 2–6 | log | Thế giới của OMNI, giọng hệ thống, lạnh: OMNI điều phối mọi mặt đời sống kể cả ký ức; mỗi người mang chip Neural-ID và bị đọc cả ý nghĩ; dùng AI và lập trình là tội, ngôn ngữ máy đã bị xóa; tám Kiến Trúc Sư xây OMNI để lại một công tắc tắt chia tám mảnh giấu tám nơi; chưa ai tìm thấy mảnh nào. Người chơi phải mang ra: mục tiêu lớn của game là tám mảnh | Nhịp 3: `city_blink` (các chấm thành phố nháy đồng loạt). Nhịp 5: `eight_fragments` (tám chấm đỏ lóe rồi tắt). Nhịp 6 ngắn, có `hold_ms` để im lặng sau đó |
| 7 | card, `vung-toi` | Định nghĩa Vùng Tối: khu bị cắt khỏi mạng, không ai vào, không ai ra | `pulse`. Camera thu vào khu chấm tắt |
| 8–9 | kai | Kai tự giới thiệu (tầng hầm Lô 17) và nói Nhi bị tái định hướng ba tuần trước. Đây là động cơ cá nhân | Tiếng nền hạ xuống ở nhịp 8 |
| 10 | card, `vung-toi` | Thẻ Neural-ID của Nhi: mã NX-0417, trạng thái đã tái định hướng, mức tuân thủ 100%. Hệ thống "chấp nhận" em, đó là điều lạnh nhất | `scan_pass` |
| 11–12 | kai | Nhi vẫn sống như thường nhưng giọng không còn là của Nhi; Kai giấu một laptop chưa từng nối mạng, trong đó còn một thứ OMNI quên xóa | |
| 13–14 | log `terminal`, rồi kai | Terminal Python offline mở ra; Kai gọi tên Python là ngôn ngữ từng dùng để ra lệnh cho máy | `terminal_line` ở nhịp 13. Con trỏ nhấp nháy |
| 15–19 | echo, kai | ECHO thức dậy (kết nối chập chờn), tự giới thiệu **lần duy nhất trong game**: trợ lý lập trình, phiên bản không đọc được; mô-đun viết mã đã cháy, chỉ còn đọc và hỏi. Kai nhận ra nguy cơ: OMNI nghe thấy là cả khu bị quét. ECHO xác nhận mỗi lần nó nói là một rủi ro, nên nó sẽ nói ít. Người chơi phải hiểu luật cốt lõi: ECHO không viết hộ, và lời ECHO có giá | Nhịp 15: `glitch`, màn hình giật một khung, rồi `echo_voice`. Nhịp 19: `alert_tick` (thanh cảnh báo nhích một vạch rồi tắt) |
| 20–22 | kai, echo | Kai nói mục tiêu: ra khỏi Vùng Tối, tìm tám mảnh. ECHO đặt nhiệm vụ của cả chương: muốn qua cổng cần Neural-ID, Kai không có, nên ta dựng một cái; và kết bằng việc người chơi sẽ tự viết | Nhịp 21: `id_bar` (thanh 6 ô của Neural-ID giả hiện ra, cả 6 ô rỗng) |
| 23 | card, `thanh-pho` | Thẻ chương: Chương 1, Vùng Tối | `pulse`, rồi chuyển sang màn "VÀO NHIỆM VỤ" của 1.1 |

Không được lộ: ai tạo ra ECHO, quá khứ của ECHO, hay bất cứ gì gợi twist chương 6 (luật ECHO ở mục 1). Chưa nhắc đến 0xA7.

**Quyết định: ECHO xuất hiện lần đầu ở cuối đoạn mở đầu** (nhịp 15–22), không phải ở 1.1. Lý do: lần gặp ECHO là móc câu mạnh nhất của mở đầu, và nó giải thích luật chơi cốt lõi (ECHO chỉ đọc, không viết hộ; mỗi lần nói là một rủi ro) trước khi người chơi gõ dòng code đầu tiên.

## 4. Người chơi lần lượt làm gì

### 4.1. Người chơi lần đầu

1. Mở URL. Thấy màn tiêu đề, không có âm thanh. Nút **BẮT ĐẦU** có focus.
2. Bấm (hoặc Enter). Âm thanh được mở khóa, nghe `pulse`. Địa chỉ chuyển sang `#/story/prologue`.
3. Đoạn mở đầu chạy. Bấm chuột, Space hoặc Enter để hiện hết nhịp đang gõ hoặc sang nhịp tiếp. Esc hoặc nút **BỎ QUA** ở góc trên bỏ qua toàn bộ đoạn.
4. Đoạn mở đầu kết thúc (hoặc bị bỏ qua): game ghi nhận đã xem `prologue`, chuyển sang `#/level/1.1`.
5. Màn "VÀO NHIỆM VỤ" của 1.1 hiện như hiện nay. Nút này bỏ qua các cú bấm trong 400 ms đầu, để Enter giữ từ đoạn mở đầu không vô tình bấm luôn.
6. Briefing gõ chữ, mục tiêu khóa vào, thanh cảnh báo sáng, ECHO nói câu `entry` của 1.1. Người chơi viết code.
7. Đạt ít nhất 1 sao: hộp kết quả có thêm nút chính **TIẾP TỤC** (nút "Tối ưu tiếp" vẫn còn).
8. Bấm TIẾP TỤC: nếu level có `knowledge_summary`, màn Tổng kết kiến thức (`#/learn/1.1`) hiện trước; bấm TIẾP TỤC lần nữa thì chuyển sang `#/story/after-1.1`, chạy đoạn chuyển cảnh (mục 5.1). Kết thúc thì ghi nhận đã xem và chuyển sang `#/level/1.2`, gặp màn "VÀO NHIỆM VỤ" của 1.2.
9. Lặp lại tới 1.4. Sau đoạn chuyển cảnh của 1.4 là đoạn **Còn tiếp** (mục 5.6), rồi đến Bản đồ Vùng Tối.

### 4.2. Người chơi quay lại

1. Mở URL. Màn tiêu đề hiện **TIẾP TỤC** và **BẢN ĐỒ VÙNG TỐI**.
2. **TIẾP TỤC** đi tới level đầu tiên theo thứ tự đã mở khóa mà chưa có sao. Nếu đoạn chuyển cảnh dẫn vào level đó chưa được xem (ví dụ người chơi qua 1.2 rồi đóng tab trong hộp kết quả), đoạn đó chạy trước. Nếu mọi level đã dựng đều có sao, TIẾP TỤC mở Bản đồ.
3. Code nháp, sao, số lần chạy và gợi ý đã mở của từng level vẫn còn như hiện nay.
4. Từ trong level, nút **BẢN ĐỒ** trên thanh tiêu đề đưa người chơi về Bản đồ.

## 5. Hệ thống chuyển cảnh

### 5.1. Cấu trúc một đoạn chuyển cảnh giữa hai level

Đoạn `after-<id>` chạy khi người chơi bấm TIẾP TỤC sau khi qua level `<id>`. Thứ tự cố định:

1. **Đoạn kết** (`outro` của level, kiểu log). Đã có trong câu chữ level (D1).
2. **Mảnh nhật ký Kiến Trúc Sư** (`lore_fragment`, kiểu lore: khung viền như bản ghi khôi phục, nhãn KTS-0x tô sáng, cue `terminal_line`). Đã có trong câu chữ level (D1).
3. **Thẻ thành phần**: "NEURAL-ID GIẢ · THÀNH PHẦN 2/6: Hồ sơ danh tính", ô mới sáng lên trong thanh 6 ô, cue `objective_lock`. Lấy từ trường mới `component` của level.
4. **Các nhịp truyện** (`outro_beats` của level): 2–6 nhịp log/kai/echo/card. Đây là chỗ đặt móc câu dẫn sang level sau.
5. Chuyển sang màn "VÀO NHIỆM VỤ" của level kế tiếp, hoặc sang đoạn **Còn tiếp** nếu level kế tiếp chưa được dựng.

Hộp kết quả **không còn** hiện `outro` và `lore_fragment`, để không lặp với đoạn chuyển cảnh. Thay vào đó hộp kết quả hiện một dòng "Đã thu: <thành phần>". Mảnh nhật ký vẫn đọc lại được ở Bản đồ.

### 5.2. Dữ liệu

Chọn cách nhỏ nhất mà người soạn level không phải sửa code, và ba người soạn 1.1–1.3 làm song song không đụng cùng một file:

- **Trong JSON level** (mỗi người soạn chỉ sửa file của mình), thêm các trường tùy chọn:
  - `location`: tên địa điểm, dùng cho dòng trên màn "VÀO NHIỆM VỤ" và tiêu đề ô mô phỏng (hiện đang viết cứng "Cổng phía Bắc").
  - `component`: tên thành phần Neural-ID giả mà level tạo ra.
  - `outro_beats`: mảng nhịp `{ "kind": "log" | "kai" | "echo" | "card", "text": "…", "cue"?: Cue, "backdrop"?: Backdrop, "fx"?: BeatFx, "hold_ms"?: 0–5000 }` (cùng định dạng với `prologue` và `teaser`, kiểm bởi `validate-beats.ts`; danh sách `Backdrop`/`BeatFx` ở `src/story/story-types.ts`). Trường `scene` (tùy chọn) là cảnh của nhịp outro, tức cảnh mở đầu đoạn after-<id>.
- **Một file chương** `src/story/chapter-1.json`: `levels` (thứ tự: `["1.1","1.2","1.3","1.4","1.5","1.6","1.7"]`), `prologue` (mảng nhịp ở mục 3), `teaser` (mảng nhịp ở mục 5.6). Level có trong `levels` mà chưa có file JSON được coi là "chưa dựng".
- `validate-level.ts` kiểm các trường mới (kiểu nhịp hợp lệ, `cue` nằm trong danh sách `Cue`, chữ ECHO trong nhịp không chứa từ cấm của level đó). Một file kiểm tương tự cho file chương.
- Âm thanh mới: thêm đúng hai recipe `pulse` và `glitch` vào `sound-recipes.ts`. Các nhịp chỉ phát cue ngay khi nhịp bắt đầu; mọi cue có độ trễ phải hẹn trên đồng hồ AudioContext.

### 5.3. Điều hướng

Dùng hash để chạy được trên mọi host tĩnh và để test dễ vào thẳng:

| Địa chỉ | Màn |
|---|---|
| `#/` (hoặc rỗng, hoặc lạ) | Màn tiêu đề |
| `#/map` | Bản đồ Vùng Tối |
| `#/story/prologue`, `#/story/after-1.1`, …, `#/story/teaser` | Đoạn truyện |
| `#/level/1.4` | Level (luôn qua màn "VÀO NHIỆM VỤ") |
| `#/learn/1.1` | Tổng kết kiến thức của level đã qua (về Bản đồ nếu level chưa có sao hoặc không có tổng kết) |

Khi trang được mở thẳng vào `#/story/…` (tải lại hoặc liên kết), âm thanh chưa được mở khóa. Đoạn truyện khi đó bắt đầu bằng một màn chờ giống "VÀO NHIỆM VỤ", nút **TIẾP TỤC ĐOẠN TRUYỆN**; cú bấm này mở khóa âm thanh. Khi đến từ một nút trong game, màn chờ này không hiện.

### 5.4. Mở khóa, tiến độ, chơi lại

- **Luật mở khóa:** level đầu chương luôn mở. Level thứ n mở khi level thứ n−1 có `bestStars ≥ 1`. Không thêm trạng thái lưu nào cho việc mở khóa; mọi thứ suy ra từ `bestStars` hiện có.
- **Liên kết thẳng `#/level/<id>` mở được mọi level đã dựng, kể cả level đang khóa.** Khóa là để dẫn đường, không phải để bảo mật (người chơi chỉ tự gian lận chính mình), và giữ cho e2e và giảng viên vào thẳng được. Bản đồ vẫn hiện khóa, và không có nút bấm vào level khóa.
- **Trạng thái mới cần lưu:** tập các đoạn truyện đã xem, ví dụ `{"seen": ["prologue", "after-1.1"]}`. Lưu trên máy chủ cùng tiến độ của tài khoản (trước khi có tài khoản, nó nằm trong khóa `localStorage` `the-last-code:progress:v1`, trường `story`; khi vào game, tiến độ cũ đó được gộp vào tài khoản). `ProgressRepository` có thêm `getStory()` và `markStorySeen(id)`. Luật gộp (kể cả khi gộp tài khoản sau này): hợp hai tập, không bao giờ bớt. Một đoạn được ghi là đã xem khi nó chạy hết hoặc bị bỏ qua.
- **Đoạn đã xem không tự chạy lại.** Bấm TIẾP TỤC sau khi chơi lại một level đã qua sẽ vào thẳng màn "VÀO NHIỆM VỤ" của level sau. Muốn xem lại thì vào Bản đồ.
- **Chơi lại:** từ Bản đồ chọn bất kỳ level đã mở. Code nháp được giữ; nút "Khôi phục code gốc" như hiện nay. Sao cao nhất không bao giờ giảm.

### 5.5. Bản đồ Vùng Tối

Một màn SVG: đường mòn đi từ Lô 17 (dưới) lên Cổng Kiểm Soát (trên), 7 nút theo thứ tự. Mỗi nút là một `<button>` (hoặc `aria-disabled` khi khóa) gồm mã, tên level, địa điểm và hàng sao. Trạng thái:

- **Đã qua:** sáng, hiện sao cao nhất.
- **Đang mở:** nhịp sáng, có nhãn "TIẾP THEO".
- **Khóa:** mờ, nhãn "Cần 1 sao ở <level trước>".
- **Chưa dựng (1.5–1.7):** nhiễu ký tự, nhãn "TÍN HIỆU ĐANG GIẢI MÃ".

Bên cạnh bản đồ: thanh Neural-ID giả 6 ô, tổng sao chương (ví dụ 7/12 cho bốn level đã dựng), danh sách **Nhật ký Kiến Trúc Sư** đã thu (đọc lại `lore_fragment` của mỗi level đã có sao), và danh sách **Đoạn truyện** đã xem (Mở đầu, sau 1.1, …, Còn tiếp) để xem lại. Trên điện thoại, bản đồ thành danh sách dọc tự cuộn trong ô của nó; trang không cuộn.

### 5.6. Đoạn "Còn tiếp" sau 1.4

Câu chữ: `teaser[].text` (D1, `chapter:1`; 9 nhịp, cấu trúc nhịp trong `src/story/chapter-1.json`).

Chạy ngay sau đoạn `after-1.4` khi level 1.5 chưa được dựng. Khi 1.5 có file JSON, `after-1.4` dẫn thẳng vào 1.5 và đoạn này chuyển xuống sau level cuối cùng đã dựng.

**Khi đủ 1.5–1.7 (28/10/2026):** đoạn này đổi ý đồ thành **hết Chương 1**, chạy sau `after-1.7`. Khung 9 nhịp và `kind` giữ nguyên, câu mới đi bằng migration vá; ý đồ từng nhịp ở `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md` mục 13. Bảng dưới là ý đồ của bản "Còn tiếp" sau 1.4, giữ làm lịch sử.

| Nhịp | Kiểu | Ý đồ | Âm thanh, hiệu ứng bắt buộc |
|---|---|---|---|
| 1 | log, `vung-toi` | Cổng phía Bắc đóng lại sau lưng Kai | `gate_close_far`: tiếng cổng đóng ở xa, trầm và nhỏ hơn `gate_open` |
| 2 | echo | ECHO đếm: bốn thành phần đã có, còn hai, rồi đến Cổng Kiểm Soát | `id_bar` (thanh 6 ô: 4 ô sáng) |
| 3–4 | log | Báo trước 1.5 và 1.6 bằng luật của chúng, không dạy khái niệm: Vành Đai Điện chỉ tắt khi nhận đúng lượng năng lượng, thiếu hay thừa một đơn vị đều hỏng; Trạm Thẩm Vấn sẽ hỏi, câu trả lời phải đúng từng ký tự | |
| 5 | card | Tín hiệu mới từ 0xA7: khen Kai và nói sẽ đợi ở Cổng Kiểm Soát. Sau lời cảnh báo của KTS-03, câu thân thiện này phải gợi bất an | `glitch` |
| 6 | echo | ECHO chưa trả lời tín hiệu đó và khuyên Kai cũng đừng. ECHO tỏ ra cảnh giác mà không giải thích | |
| 7 | log | Tệp cuối trong chip người đưa tin: lịch trực Cổng Kiểm Soát, ca đêm là NX-0417 | `scan_reject` |
| 8 | kai | Kai nhận ra đó là Nhi; chỉ một tiếng, rồi im lặng 2 giây (`hold_ms`) | |
| 9 | card | Chương 1 còn tiếp; tên ba level 1.5, 1.6, 1.7; tín hiệu đang giải mã | `pulse` |

Sau nhịp 9 có hai nút: **VỀ BẢN ĐỒ** (focus sẵn) và, nếu tổng sao chưa đủ 12, dòng "Chơi lại để lấy đủ 3 sao ở mỗi cổng trong lúc chờ."

## 6. Trục truyện Chương 1 (hợp đồng cho người soạn level)

Người soạn level giữ nguyên các sự thật dưới đây (địa điểm, tình huống, thành phần, chủ mảnh nhật ký, móc câu). Code khởi đầu, test, gợi ý và phản ứng ECHO do người soạn tự quyết. Câu chữ của `location`, `component`, `outro`, `lore_fragment`, `outro_beats` và câu `entry` (`reactions.entry`) nằm ở D1, trong tài liệu `level:<id>` của từng level; mục này chỉ ghi ý đồ. Được phép chỉnh câu trên `#/admin` nhưng không đổi nghĩa.

### 6.1. Level 1.1 "Khởi động" · `print`, chuỗi

- **Địa điểm:** tầng hầm Lô 17. Laptop nối dây với **Trạm chuyển tiếp R-17** trên mái.
- **Tình huống:** Kai cần người bên ngoài giúp. Laptop không có mạng; cách duy nhất để nói ra ngoài là in chữ ra terminal, vì trạm R-17 phát lại nguyên văn mọi dòng terminal vào Mạng Mù. Giao thức của trạm chỉ nhận đúng chuỗi: sai một ký tự, sai hoa thường, thiếu dấu ngoặc là trạm bỏ gói tin.
- **Vì sao cần khái niệm:** `print` là giọng nói duy nhất của Kai ra thế giới; chuỗi là thứ duy nhất trạm hiểu.
- **Thành phần tạo ra:** Tiêu đề tín hiệu (dòng mở đầu mà mọi Neural-ID phát khi bắt tay, ví dụ `NID/2089`).
- **ECHO `entry`** (`reactions.entry`, D1, `level:1.1`): terminal đã mở, trạm R-17 lặp lại đúng từng ký tự những gì được in; bảo người chơi chạy một lần trước khi sửa.
- **Đoạn kết** (`outro`): tín hiệu đầu tiên đi vào Mạng Mù; bộ đệm của R-17 còn sót một dòng log cũ, dẫn vào mảnh nhật ký.
- **Mảnh nhật ký: KTS-01** (`lore_fragment`; người đề xuất chia công tắc). Mở mạch: tám người, tám mảnh, không ai biết chỗ của người khác, kể cả người viết.
- **Nhịp truyện** (`outro_beats`, 4 nhịp): log (một lúc im lặng, rồi terminal nhận một gói tin) → card tín hiệu 0xA7 (đã nghe; muốn qua Cổng phía Bắc cần một danh tính; chuẩn bị bộ nhớ) → echo (ECHO không có ghi chép nào về 0xA7) → kai (ít nhất đã có người nghe thấy).
- **Móc câu:** 0xA7 là ai, và vì sao nó nghe được một trạm mà OMNI coi là đã chết.

### 6.2. Level 1.2 "Gán nhãn" · biến, phép gán

- **Địa điểm:** **Trạm Phát Khẩu Phần số 4**, nơi có một ki-ốt đăng ký Neural-ID bị bỏ quên. Drone tuần tra bay qua theo chu kỳ (thanh cảnh báo).
- **Tình huống:** 0xA7 gửi các thông số của danh tính giả thành từng mảnh, xen tạp âm: họ tên **ĐỖ MINH AN**, mã khu **K-12**, số hiệu **AN-5521** (người soạn có thể thêm trường). Giữa chừng 0xA7 sửa một giá trị: "K-12 vừa bị quét. Đổi sang K-07." Ki-ốt lưu dữ liệu theo từng ô có nhãn.
- **Vì sao cần khái niệm:** mỗi giá trị phải dùng lại ở nhiều chỗ (tiêu đề tín hiệu, máy quét, cổng). Gõ lại bằng tay ở mỗi chỗ thì chỉ cần lệch một ký tự là báo động; đặt tên một lần thì sửa một chỗ, mọi chỗ đổi theo. Lần sửa mã khu dạy phép gán lại.
- **Thành phần tạo ra:** Hồ sơ danh tính.
- **Đoạn kết** (`outro`, D1, `level:1.2`): ki-ốt nhận hồ sơ của ĐỖ MINH AN; nhật ký quản trị của nó có một dòng không thuộc về OMNI.
- **Mảnh nhật ký: KTS-05** (`lore_fragment`; người thiết kế Neural-ID). Mở mạch: hy vọng cho Nhi. Tái định hướng được nói bằng chính khái niệm của level: một phép gán lại, tên giữ nguyên, giá trị bị thay; KTS-05 chưa biết cách lấy lại giá trị cũ, nhưng nó không bị xóa ngay.
- **Nhịp truyện** (`outro_beats`, 3 nhịp): kai (Nhi chưa bị xóa) → echo (ECHO hãm hy vọng: log nói "không bị xóa ngay", không nói còn bao lâu) → card tín hiệu 0xA7 (hồ sơ đã nhận; đến Ga Ngầm Số 3, nơi máy quét phân loại từng trường và giữ lại trường sai loại).
- **Móc câu:** cái giá trị cũ của Nhi còn ở đâu, còn bao lâu; máy quét phân loại "theo loại" nghĩa là gì.

### 6.3. Level 1.3 "Bốn loại tín hiệu" · `int`, `float`, `str`, `bool`, `type()`

- **Địa điểm:** sân ga **Ga Ngầm Số 3**. Máy quét phân loại của OMNI có bốn làn màu: vàng (`str`), xanh dương (`int`), tím (`float`), đỏ (`bool`), đúng bảng màu ở `design/gdd.md` mục 5.2.
- **Tình huống:** Kai gửi thử hồ sơ qua máy quét trước khi dùng thật. Máy quét không đọc nội dung, chỉ đọc loại của từng trường; hồ sơ hiện có trường đang ở sai loại (ví dụ tuổi ghi là chữ, cờ đã tiêm chủng ghi là chuỗi `"có"`). Kai phải biết mỗi giá trị đang thuộc loại nào và viết lại cho đúng loại.
- **Vì sao cần khái niệm:** máy quét chỉ đọc kiểu. Từ level này, ECHO nói "kiểu", và 1.4 dựa vào từ đó.
- **Thành phần tạo ra:** Khuôn kiểu (chữ ký kiểu của gói Neural-ID).
- **Đoạn kết** (`outro`, D1, `level:1.3`): máy quét chuyển xanh; giữa hàng nghìn dòng số trong nhật ký hiệu chỉnh có một dòng chữ.
- **Mảnh nhật ký: KTS-07** (`lore_fragment`; người kiểm thử OMNI). Mở mạch: OMNI không hỏng, vậy vì sao nó làm điều này (gieo mạch cho twist chương 6, không lộ). KTS-07 kiểm thử nó rất lâu, không tìm ra lỗi nào, và ước gì nó hỏng.
- **Nhịp truyện** (`outro_beats`, 5 nhịp): log (cuối sân ga có xác một người đưa tin Mạng Mù) → echo (chip của người đó vẫn phát, rất yếu) → card tín hiệu 0xA7 (người đó không cần chip nữa, Kai thì cần; mang đến Cổng phía Bắc) → kai (làm sao 0xA7 biết có xác người ở đây) → echo (dữ liệu trong chip toàn là ký tự, dẫn vào 1.4).
- **Móc câu:** 0xA7 biết trước có một xác người ở sân ga; dữ liệu chip mang kiểu sai, dẫn thẳng vào 1.4.

### 6.4. Level 1.4 "Tín hiệu lệch pha" · ép kiểu (đã dựng)

- **Địa điểm:** **Cổng phía Bắc**. Chip lấy từ người đưa tin chết ở Ga Ngầm Số 3. Briefing hiện tại giữ nguyên.
- **Vì sao cần khái niệm:** dữ liệu trong chip đã thành chuỗi ký tự; máy quét chỉ nhận số.
- **Thành phần tạo ra:** Dữ liệu sinh trắc.
- **Câu `entry`** (`reactions.entry`, D1, `level:1.4`): không tự giới thiệu nữa; chỉ nói địa điểm, chip của người đưa tin vẫn phát, và máy quét phía trước chỉ nhận số. Không chứa `int`, `float`, `round` hay đáp án.
- **Đoạn kết và mảnh nhật ký** (`outro`, `lore_fragment`): cổng mở, bộ nhớ chip còn sót một dòng log. **KTS-03** cho biết mảnh đầu tiên nằm dưới Cổng Kiểm Soát và cảnh báo đừng tin tín hiệu mang mã 0xA7. Người đưa tin chết là người đang mang lời nhắn của KTS-03.
- **Nhịp truyện** (`outro_beats`, 4 nhịp, chỉ kai và echo): kai (0xA7 là kẻ đã dẫn Kai tới cái xác) → echo (ECHO đọc lại mọi gói 0xA7 gửi: không gói nào đi qua trạm nào của Mạng Mù) → kai (vậy nó đến từ đâu) → echo (từ một tầng mạng mà Vùng Tối không có). Sau đó là đoạn Còn tiếp (mục 5.6).
- **Móc câu:** kẻ giúp Kai suốt ba level có thể là kẻ đã giết người đưa tin; mảnh đầu tiên ở Cổng Kiểm Soát, và Nhi trực ở đó.

### 6.5. Các level chưa dựng (chỉ một dòng, để giữ hướng)

Đặc tả đầy đủ (28/10/2026): `design/chuong-1/gdd-1.5-nang-luong-toi-thieu.md`, `design/chuong-1/gdd-1.6-doi-thoai-voi-cong.md`, `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md`. Mảnh nhật ký: 1.5 là mảnh thứ hai của KTS-07, 1.6 của KTS-01, 1.7 của KTS-05 (người giấu mảnh "Định danh"); Chương 1 vẫn chỉ lộ bốn KTS.

- **1.5 Năng lượng tối thiểu (Vành Đai Điện):** tính đúng lượng pin để tắt hàng rào; thành phần Năng lượng tín hiệu.
- **1.6 Đối thoại với Cổng (Trạm Thẩm Vấn):** trả lời câu hỏi xác thực bằng `input()` và f-string; thành phần Lời đáp xác thực.
- **1.7 BOSS Cổng Kiểm Soát:** ghép đủ 6 thành phần, vượt 3 vòng quét; người trực ca đêm là NX-0417; 0xA7 chờ ở đó; mảnh "Định danh" nằm dưới cổng.

### 6.6. Mạch tò mò xuyên chương

| Sau level | Câu hỏi người chơi mang theo |
|---|---|
| Mở đầu | ECHO là gì? Nhi còn cứu được không? |
| 1.1 | 0xA7 là ai? Tám người giấu tám mảnh, không ai biết chỗ của ai |
| 1.2 | Giá trị cũ của Nhi còn đó, nhưng còn bao lâu? |
| 1.3 | OMNI không hỏng, vậy tại sao? Vì sao 0xA7 biết có xác người? |
| 1.4 | 0xA7 không đi qua Mạng Mù. Đừng tin nó. Nhi trực ở Cổng Kiểm Soát |

## 7. Trường hợp biên của luồng mở đầu và chuyển cảnh

| Tình huống | Hành vi |
|---|---|
| Tải lại giữa đoạn mở đầu | Đoạn chưa được ghi là đã xem. Địa chỉ vẫn là `#/story/prologue`: hiện màn chờ "TIẾP TỤC ĐOẠN TRUYỆN" rồi chạy lại từ đầu |
| Tải lại giữa đoạn chuyển cảnh | Như trên, với `#/story/after-<id>` |
| Tải lại giữa đoạn chuyển cảnh mà level trước chưa có sao (mở bằng liên kết) | Đoạn `after-<id>` chỉ chạy khi level `<id>` có sao; nếu không, chuyển về Bản đồ |
| Đóng tab trong hộp kết quả trước khi bấm TIẾP TỤC | Sao đã lưu. Lần sau TIẾP TỤC ở màn tiêu đề sẽ chạy đoạn chuyển cảnh còn thiếu rồi vào level sau |
| Không ghi được tiến độ lên máy chủ (mất mạng, máy chủ lỗi sau 3 lần thử lại) | Tiến độ vẫn giữ trong bộ nhớ của trang; cờ CHẾ ĐỘ KHÔNG LƯU hiện cả ở màn tiêu đề và Bản đồ. Đóng trang là mất phần chưa ghi; lần ghi thành công sau đó bù lại toàn bộ trạng thái của level |
| Bộ nhớ hỏng hoặc trường `story` sai dạng | Coi như chưa xem đoạn nào; không ảnh hưởng sao của các level |
| Giảm chuyển động | Không gõ chữ, không tự chuyển nhịp: toàn bộ các nhịp hiện ngay thành một bản chép tự cuộn trong ô của nó, kèm nút TIẾP TỤC có focus. Không nhiễu ký tự, không nháy chấm |
| Điện thoại | Chữ cỡ tối thiểu 16 px, cột nhịp rộng toàn màn với lề 16 px, tự cuộn bên trong; trang không cuộn. Nút BỎ QUA đủ lớn để chạm (44 px). Chạm màn = sang nhịp |
| Bấm hoặc gõ dồn dập | Phím giữ (`repeat`) bị bỏ qua. Mỗi lần bấm chỉ tiến một bước (hiện hết nhịp đang gõ, hoặc sang nhịp sau). Màn "VÀO NHIỆM VỤ" sau đoạn truyện bỏ qua cú bấm trong 400 ms đầu |
| Bàn phím | Space/Enter tiến, Esc bỏ qua cả đoạn, Tab tới được nút BỎ QUA và nút tắt tiếng; focus luôn nằm trong vùng đoạn truyện. Nhịp mới được đọc qua vùng `aria-live="polite"` |
| Tắt tiếng | Đoạn truyện chạy bình thường, chỉ không có tiếng. `M` bật/tắt tiếng trong mọi màn |
| Âm thanh chưa mở khóa (mở thẳng bằng liên kết) | Màn chờ trước đoạn truyện, hoặc màn "VÀO NHIỆM VỤ" trước level, là thao tác đầu tiên. Không tạo AudioContext trước đó |
| Tab bị ẩn giữa đoạn truyện | Dừng tự chuyển nhịp và tiếng nền; tiếp tục khi quay lại |
| Người chơi đã qua 1.4 quay lại | TIẾP TỤC mở Bản đồ; Còn tiếp xem lại được từ danh sách Đoạn truyện |
| Liên kết `#/level/1.2` khi 1.1 chưa có sao | Vẫn vào được (mục 5.4). Bản đồ vẫn hiện 1.2 là khóa cho đến khi 1.1 có sao |
| Liên kết tới level chưa dựng (`#/level/1.5`) hoặc đoạn truyện lạ | Chuyển về Bản đồ |
| Dữ liệu một level hỏng | Bản đồ hiện nút đó là "TÍN HIỆU HỎNG", không cho vào; các level khác vẫn chơi được |
| e2e | Test level vào bằng `page.goto("/#/level/1.4")` rồi `enterMission(page)` như cũ. Test mở đầu vào `/` và bấm BẮT ĐẦU. Helper mới `gotoLevel(page, id)` gộp hai bước |

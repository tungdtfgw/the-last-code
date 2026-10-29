# Brainstorm: Mở đầu game, chuyển cảnh giữa level và trục truyện Chương 1

Ngày: 2026-10-25. Chạy tự động, không hỏi được người dùng: mọi quyết định cần hỏi đã được tự chốt và liệt kê ở mục cuối.
Thiết kế chi tiết: `design/gdd-mo-dau.md`. Nguồn đã đọc: `CLAUDE.md`, `design/gdd.md` (v0.2), `design/chuong-1/gdd-1.4-tin-hieu-lech-pha.md`, `src/levels/level-1-4.json`, `src/app.tsx`, `src/ui/game-screen.tsx`, `src/ui/intro-gate.tsx`, `src/ui/results-dialog.tsx`, `src/storage/progress-repository.ts`, `src/storage/local-storage-repository.ts`, `src/storage/create-repository.ts`, `src/audio/sound-recipes.ts`, `src/game/validate-level.ts`, `tests/e2e/helpers.ts`, `docs/nhat-ky-loi-prototype-1-4.md`.

## Hiện trạng (đã kiểm trong mã nguồn)

- `src/app.tsx` vào thẳng level `"1.4"` bằng hằng số `LEVEL_ID`; không có định tuyến, không có màn tiêu đề.
- `GameScreen` có luồng mở đầu `gate → briefing → objectives → done`; nút "VÀO NHIỆM VỤ" là thao tác đầu tiên, mở khóa âm thanh.
- Hộp kết quả hiện `outro` và `lore_fragment` của level, chỉ có nút "Tối ưu tiếp".
- `ProgressRepository` chỉ lưu tiến độ từng level (`draft`, `bestStars`, `runs`, `hintsOpened`) và cài đặt `muted`. Không có trạng thái truyện.
- `validate-level.ts` bắt buộc `outro` và `lore_fragment`; chưa có trường nào cho đoạn chuyển cảnh.
- Tiêu đề ô mô phỏng viết cứng "Cổng phía Bắc" trong `game-screen.tsx`.
- Câu `entry` của 1.4 đang chứa lời tự giới thiệu "Tôi là ECHO…".
- Danh sách `Cue` có 13 âm; chưa có âm cho nhịp lớn hay nhiễu khi ECHO thức dậy.
- Helper e2e `enterMission(page)` chỉ cần nút "VÀO NHIỆM VỤ" hiện ra sau `goto`.

## Outcome

Người chơi mở URL thấy màn tiêu đề, bấm BẮT ĐẦU, xem một đoạn mở đầu khoảng 75 giây (bỏ qua được) kết thúc bằng lần đầu gặp ECHO, rồi vào Level 1.1. Mỗi lần qua một level, một đoạn chuyển cảnh (đoạn kết, mảnh nhật ký Kiến Trúc Sư, thành phần Neural-ID giả vừa thu, vài nhịp truyện) dẫn vào level sau. Level sau mở khi level trước có ít nhất 1 sao. Sau 1.4, đoạn "Còn tiếp" khép chương tạm thời bằng một móc câu mạnh (Nhi trực ở Cổng Kiểm Soát, 0xA7 đang chờ). Bản đồ Vùng Tối cho chơi lại, xem lại đoạn truyện và đọc lại nhật ký. Ba người soạn 1.1–1.3 có một trục truyện cụ thể (tên, địa điểm, tình huống, thành phần, chủ mảnh nhật ký, móc câu) để viết song song mà truyện vẫn liền mạch.

## Constraints

- Không backend, không file tài nguyên: hình là SVG/CSS, âm thanh là Web Audio tạo bằng code, mỗi âm một recipe; không tạo AudioContext trước thao tác đầu tiên; âm có độ trễ hẹn trên đồng hồ âm thanh.
- Mọi đoạn truyện bỏ qua được bằng phím và chuột, tôn trọng giảm chuyển động, chạy ở bề rộng điện thoại (trang không cuộn, từng ô tự cuộn), dùng được bằng bàn phím.
- Level là dữ liệu; thêm level mới không phải sửa code. Đoạn truyện cũng là dữ liệu.
- Trạng thái lưu chỉ đi qua `ProgressRepository`.
- Giọng u tối, nghiêm túc, không hài hước. Không lộ twist chương 6; lời ECHO không mâu thuẫn với nó. Twist chương 3 chỉ được gieo kín (tiếp nối 0xA7 đã có ở 1.4).
- e2e vẫn đơn giản: vào thẳng level rồi gọi `enterMission(page)`.

## Non-goals

- Đăng nhập, lưu đám mây, bảng xếp hạng, số liệu cộng đồng.
- Dựng level 1.5–1.7 hoặc đặc tả Boss. Chỉ có một dòng định hướng cho mỗi level.
- Cơ chế của 1.1–1.3 (code khởi đầu, test, gợi ý, phản ứng ECHO, mô phỏng): thuộc người soạn level.
- Lồng tiếng, nhạc nền có giai điệu, ảnh minh họa. (Cảnh vẽ cho cutscene đã được đưa vào sau, vẽ bằng SVG chứ không dùng ảnh minh họa: xem `design/quyet-dinh/canh-cutscene.md` và QĐ-18.)
- Điểm giải mã, mở khóa chương bằng sao, Chương 2.
- Viết code. Tài liệu này chỉ là thiết kế.

## Acceptance criteria

1. `design/gdd-mo-dau.md` có kịch bản đầy đủ của màn tiêu đề, đoạn mở đầu (từng nhịp: chữ, hình, âm thanh, cảm giác thời gian) và đoạn Còn tiếp.
2. Có lối đi từng bước cho người chơi lần đầu (từ mở URL tới vào 1.1) và người chơi quay lại.
3. Có cấu trúc đoạn chuyển cảnh, luật mở khóa, cách chơi lại, Bản đồ, định tuyến, trạng thái lưu mới và luật gộp của nó.
4. Có trục truyện cho 1.1–1.4 (và một dòng cho 1.5–1.7) gồm địa điểm, tình huống, lý do cần khái niệm Python, thành phần tạo ra, chủ mảnh nhật ký và mạch nó mở, móc câu cuối; có bảng tên riêng cố định.
5. Lần gặp ECHO đầu tiên được chốt, và có câu `entry` mới cho 1.4 không chứa lời tự giới thiệu và không chứa `int`, `float`, `round` hay đáp án.
6. Có bảng trường hợp biên: tải lại giữa đoạn, bộ nhớ bị chặn, giảm chuyển động, điện thoại, bấm dồn, người chơi đã qua 1.4, liên kết thẳng, âm thanh tắt hoặc chưa mở khóa.
7. Cách lưu dữ liệu đoạn truyện cho phép ba người soạn 1.1–1.3 làm song song mà không sửa chung một file.
8. Không lời ECHO nào trong tài liệu nói ECHO do ai tạo ra hay chống OMNI vì lý do gì.

## Các lựa chọn đã so sánh

### A. Đoạn truyện đặt ở đâu

1. **Tất cả trong một file chương** (`chapter-1.json` chứa mở đầu, thứ tự level, mọi đoạn chuyển cảnh, Còn tiếp). Phụ thuộc nhiều nhất vào giả định một người sửa file này. Hỏng đầu tiên khi ba người soạn 1.1–1.3 cùng viết đoạn chuyển cảnh song song: xung đột trên cùng một file.
2. **Chia đôi (chọn):** JSON level giữ đoạn chuyển cảnh của chính nó (`outro`, `lore_fragment` đã có, cộng `component`, `outro_beats`, `location` tùy chọn); file chương chỉ giữ thứ tự level, mở đầu và Còn tiếp. Phụ thuộc vào giả định đoạn chuyển cảnh luôn gắn với level vừa qua. Hỏng đầu tiên nếu sau này cần đoạn truyện độc lập giữa hai level (ví dụ giữa hai chương); khi đó thêm một mảng vào file chương, chi phí nhỏ.
3. **Viết cứng trong TSX.** Phụ thuộc vào giả định nội dung ít đổi. Hỏng ngay ở level thứ hai: mỗi level mới phải sửa code, trái với "level là dữ liệu".

### B. Điều hướng

1. **Máy trạng thái trong `App`, không có URL.** Nhỏ nhất, nhưng tải lại luôn về màn tiêu đề và e2e phải đi qua mở đầu và bản đồ mới vào được level. Hỏng đầu tiên ở e2e: mọi spec hiện có phải đổi luồng.
2. **Định tuyến bằng hash (chọn):** `#/`, `#/map`, `#/story/<id>`, `#/level/<id>`. Chạy trên mọi host tĩnh và trên `vite preview` mà không cần cấu hình fallback. Phụ thuộc vào giả định không cần URL đẹp. Hỏng đầu tiên nếu sau này cần SEO hoặc chia sẻ link đẹp, lúc đó đổi sang history API là việc cục bộ.
3. **History API (`/level/1.4`).** Cần host trả `index.html` cho mọi đường dẫn. Hỏng đầu tiên khi triển khai lên host tĩnh chưa cấu hình rewrite.

### C. Trạng thái lưu cho đoạn truyện

1. **Không lưu gì, suy ra tất cả.** Đoạn chuyển cảnh chạy mỗi lần bấm TIẾP TỤC. Hỏng đầu tiên với người chơi lại để lấy sao: phải bấm bỏ qua mỗi lần; và không phân biệt được người mới với người quay lại ở màn tiêu đề.
2. **Một tập `story.seen` (chọn)** trong cùng khóa `progress:v1`, trường tùy chọn, không tăng schema. Gộp bằng hợp tập. Phụ thuộc vào giả định "đã xem" là đủ, không cần biết xem đến nhịp nào. Hỏng đầu tiên nếu muốn tiếp tục giữa đoạn sau khi tải lại; đoạn dài nhất chỉ khoảng 75 giây nên chấp nhận chạy lại từ đầu.
3. **Thêm cờ riêng cho từng thứ** (`prologueSeen`, `teaserSeen`…). Hỏng đầu tiên ở level thứ năm: mỗi đoạn mới cần một trường mới và một thay đổi schema.

### D. Lần gặp ECHO đầu tiên

1. **Cuối đoạn mở đầu (chọn).** Phụ thuộc vào giả định người chơi xem mở đầu. Hỏng đầu tiên khi người chơi bỏ qua mở đầu; bù lại, câu `entry` của 1.1 vẫn nói luật cốt lõi (trạm lặp lại đúng từng ký tự) và ô ECHO trong level tự nói rõ vai trò.
2. **Trong câu `entry` của 1.1.** Phụ thuộc vào giả định một câu phản ứng ngắn đủ sức nặng cho lần gặp đầu. Hỏng đầu tiên ở cảm xúc: mở đầu mất cao trào, và câu `entry` phải gánh cả giới thiệu lẫn bối cảnh nhiệm vụ.

### E. Liên kết thẳng tới level đang khóa

1. **Mở được (chọn).** Phụ thuộc vào giả định khóa chỉ để dẫn đường. Hỏng đầu tiên nếu sau này có bảng xếp hạng cần chặn; lúc đó việc chấm vẫn phải làm phía server như nhật ký lỗi đã ghi.
2. **Chuyển về Bản đồ.** Hỏng đầu tiên ở e2e cho 1.2–1.4: test phải nạp sẵn tiến độ vào `localStorage` trước khi vào.

## Trade-offs

- Chia đôi dữ liệu (A2) đổi một chút "mọi thứ ở một chỗ" lấy việc ba người soạn làm song song không xung đột.
- Hash (B2) đổi URL đẹp lấy sự chắc chắn trên host tĩnh và e2e không đổi luồng.
- `story.seen` (C2) đổi khả năng tiếp tục giữa đoạn lấy một trường duy nhất, không tăng schema.
- ECHO ở mở đầu (D1) đổi rủi ro người chơi bỏ qua lấy một cao trào rõ cho móc câu.
- Mở khóa không chặn liên kết (E1) đổi tính chặt của tiến trình lấy test và giảng viên vào thẳng.

## Better approaches

Đề bài gợi ý "suy ra level mở khóa từ `bestStars`"; đó là hướng đã chọn, không có hướng nào tốt hơn (bằng chứng: `bestStars` đã có và không bao giờ giảm theo `mergeLevelProgress`). Có một điểm cải tiến so với hiện trạng: hộp kết quả thôi hiện `outro` và `lore_fragment`, vì nội dung đó chuyển sang đoạn chuyển cảnh và Bản đồ; nếu giữ cả hai thì người chơi đọc cùng một đoạn hai lần liền nhau. Chi phí: sửa `results-dialog.tsx` và một test nếu có test kiểm chữ lore trong hộp kết quả.

## Hướng đã chọn

- **Màn tiêu đề** `#/`: BẮT ĐẦU (mới) hoặc TIẾP TỤC + BẢN ĐỒ VÙNG TỐI (quay lại). Cú bấm đầu mở khóa âm thanh.
- **Mở đầu** `#/story/prologue`: 23 nhịp, bốn kiểu nhịp (log, kai, echo, card), ba phông nền SVG/CSS. ECHO thức dậy ở nhịp 15–22. Bấm để tiến từng nhịp, Esc hoặc nút BỎ QUA để bỏ cả đoạn.
- **Chuyển cảnh** `#/story/after-<id>`: đoạn kết → nhật ký KTS → thẻ thành phần (thanh 6 ô) → `outro_beats` → màn "VÀO NHIỆM VỤ" của level sau, hoặc Còn tiếp nếu level sau chưa dựng.
- **Mở khóa:** level n mở khi level n−1 có ≥ 1 sao; suy ra, không lưu.
- **Lưu mới:** `story.seen` (tập id đoạn truyện), qua `getStory()` và `markStorySeen(id)` trên `ProgressRepository`.
- **Bản đồ** `#/map`: 7 nút (1.5–1.7 "đang giải mã"), thanh Neural-ID giả, tổng sao, nhật ký KTS đã thu, danh sách đoạn truyện để xem lại.
- **Dữ liệu:** JSON level có thêm `location`, `component`, `outro_beats` (tùy chọn); file `src/story/chapter-1.json` chứa `levels`, `prologue`, `teaser`. Validator kiểm cả hai, kể cả từ cấm trong lời ECHO.
- **Âm thanh mới:** đúng hai recipe, `pulse` và `glitch`.
- **e2e:** `page.goto("/#/level/1.4")` rồi `enterMission(page)`; thêm helper `gotoLevel(page, id)`.
- **Trục truyện:** xem tóm tắt dưới đây và `design/gdd-mo-dau.md` mục 1 và 6.

### Tóm tắt trục truyện

| Level | Địa điểm | Kai cần gì, vì sao cần khái niệm | Thành phần | Mảnh nhật ký | Móc câu |
|---|---|---|---|---|---|
| Mở đầu | Lô 17 | Thoát Vùng Tối, tìm 8 mảnh, cứu Nhi (NX-0417) | (thanh 6 ô rỗng) | – | ECHO là gì; Nhi còn cứu được không |
| 1.1 | Tầng hầm Lô 17, Trạm chuyển tiếp R-17 | Nói ra ngoài: trạm phát lại nguyên văn mọi dòng in ra, chỉ nhận đúng chuỗi | Tiêu đề tín hiệu | KTS-01: tám người, tám mảnh, không ai biết chỗ của ai | 0xA7 trả lời |
| 1.2 | Trạm Phát Khẩu Phần số 4 (ki-ốt Neural-ID) | Lưu hồ sơ ĐỖ MINH AN theo ô có nhãn; dùng lại nhiều chỗ; 0xA7 sửa mã khu K-12 → K-07 | Hồ sơ danh tính | KTS-05: tái định hướng là phép gán lại, giá trị cũ không bị xóa ngay | Còn bao lâu cho Nhi |
| 1.3 | Ga Ngầm Số 3, máy quét bốn làn màu | Máy quét chỉ đọc "hình dạng" của từng trường | Khuôn kiểu | KTS-07: OMNI không hỏng | 0xA7 biết có xác người đưa tin; chip toàn ký tự |
| 1.4 | Cổng phía Bắc | Dữ liệu chip là chuỗi, máy quét chỉ nhận số | Dữ liệu sinh trắc | KTS-03 (giữ nguyên): mảnh đầu dưới Cổng Kiểm Soát, đừng tin 0xA7 | 0xA7 đến từ tầng mạng Vùng Tối không có; Nhi trực ca đêm ở Cổng Kiểm Soát |

## Rủi ro

- **1.1 cần chấm theo đầu ra `print`.** Mục tiêu hiện chỉ kiểm biến (`objectives` có `var` và `type`). Người soạn 1.1 sẽ cần một loại mục tiêu theo stdout; đây là thay đổi engine và schema, nằm ngoài tài liệu này nhưng chặn 1.1 nếu không ai làm.
- **Mô phỏng hiện chỉ có máy quét của 1.4.** Ki-ốt (1.2) và máy quét bốn làn (1.3) có thể dùng lại máy quét; trạm R-17 (1.1) thì không rõ. Người soạn level cần quyết định.
- **Đoạn mở đầu dài có thể làm sinh viên mất kiên nhẫn.** Giảm bằng: tiến từng nhịp khi bấm, nút BỎ QUA luôn hiện, đoạn chỉ tự chạy một lần.
- **Lời ECHO và 0xA7 có thể lộ quá tay twist.** Câu "Từ một tầng mạng mà Vùng Tối không có" và KTS-07 "Nó không hỏng" được chọn vì kín; người soạn không nên thêm chi tiết về nguồn gốc 0xA7 hay mục tiêu của OMNI.
- **Thông tin Nhi trực ở Cổng Kiểm Soát ràng buộc Boss 1.7.** Người thiết kế Boss phải dùng chi tiết này.
- **Bỏ `outro`/`lore` khỏi hộp kết quả** có thể làm vỡ test e2e hoặc unit đang kiểm chữ đó.
- **Ngữ cảnh âm thanh và định tuyến:** chuyển màn bằng hash không được tạo lại `AudioContext`; hook âm thanh phải sống ở cấp `App`, không ở `GameScreen` như hiện nay.

## Câu hỏi còn mở

Các câu dưới đây đã được tự chốt để không chặn công việc; người dùng có thể đổi.

1. **Tên em gái là Nhi, mã sau tái định hướng NX-0417.** Tên danh tính giả là ĐỖ MINH AN. Có muốn tên khác không?
2. **ECHO tự giới thiệu ở cuối đoạn mở đầu**, không ở 1.1. Người chơi bỏ qua mở đầu sẽ gặp ECHO lần đầu qua câu `entry` của 1.1, câu này không tự giới thiệu.
3. **0xA7 là người liên lạc giúp Kai từ 1.1** và biết vị trí xác người đưa tin. Điều này đẩy mạnh nghi ngờ "Kiến Trúc Sư phản bội" ngay trong Chương 1. Có quá sớm so với twist chương 3 không?
4. **Đoạn Còn tiếp tiết lộ Nhi (NX-0417) trực ca đêm ở Cổng Kiểm Soát.** Đây là ràng buộc cho Boss 1.7.
5. **Liên kết thẳng mở được level đang khóa.** Chọn vì e2e và giảng viên; đổi sang chặn thì e2e phải nạp sẵn tiến độ.
6. **Hộp kết quả bỏ `outro` và `lore_fragment`**, thay bằng dòng "Đã thu: <thành phần>".
7. **Đoạn truyện đã xem không tự chạy lại** khi chơi lại; xem lại qua Bản đồ.
8. **Mở khóa cần ≥ 1 sao** ở level trước, không cần 2 hay 3 sao.
9. **Hai cue mới `pulse` và `glitch`**; các nhịp còn lại dùng lại cue có sẵn.
10. Thứ tự KTS trong Chương 1 là 01, 05, 07, 03. Tên thật của các Kiến Trúc Sư chưa đặt (mục 9 của GDD vẫn mở).

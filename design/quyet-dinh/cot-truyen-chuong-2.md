# Quyết định: khung và trục truyện Chương 2 "Trạm Sentinel"

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng: mọi chỗ cần hỏi đã tự chốt và liệt kê ở mục cuối.
Đặc tả: `design/gdd-chuong-2.md`. Hạ tầng: `docs/hop-dong-engine-chuong-2.md`. Kiến trúc: QĐ-19 trong `docs/quyet-dinh-ky-thuat.md`.
Nguồn đã đọc: `CLAUDE.md`, `design/gdd.md`, `design/gdd-mo-dau.md`, các tài liệu trong `design/quyet-dinh/`, `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md`, `docs/hop-dong-engine-level-1-5-den-1-7.md`, `docs/nhat-ky-loi-prototype-1-4.md`, báo cáo review chương 1 (28/10), và mã: `src/story/*`, `src/app.tsx`, `src/ui/chapter-map.tsx`, `src/content/text-fields.ts`, `src/game/level-types.ts`, `validate-level.ts`, `classify-run.ts`, `compute-stars.ts`, `echo-leaks.ts`, `src/engine/python/harness.py`, `server/content/*`.

## Hợp đồng brainstorm

- **Outcome:** Chương 2 có khung đủ cụ thể để bảy người soạn viết GDD 2.1–2.7 song song mà không phải đoán, và để hạ tầng đa chương làm trước một lần. Khi xong, người chơi qua 1.7 đi liền vào Chương 2: bảy màn dạy so sánh, `if`, `else`, `elif`, `and/or/not`, điều kiện lồng, rồi Boss ở Trạm Sentinel lấy mảnh thứ hai "Quyết định".
- **Constraints:** level là dữ liệu; câu chữ chỉ ở D1, vào bằng migration; harness chỉ thư viện chuẩn; không đổi luật sao và luật đếm câu lệnh; Chương 1 chơi y như cũ; không lộ twist chương 3 và 6; giọng u tối, không hài hước; mọi màn chạy ở bề rộng điện thoại, giảm chuyển động, bàn phím.
- **Non-goals:** viết code, migration, câu chữ người chơi thật; GDD chi tiết từng màn; cơ chế ghép kill switch; điểm giải mã; mở chương bằng tổng sao; Chương 3 trở đi (chỉ một nhịp báo trước).
- **Acceptance criteria:** mục "Tiêu chí chấp nhận cốt lõi" ở cuối tài liệu này, cộng hợp đồng engine mục 11 cho hạ tầng.

## Các lựa chọn đã so sánh

### A. Hạ tầng nhiều chương

1. **Mỗi chương một file, một chuỗi mở khóa nối liền (chọn).** `chapter-<n>.json` nạp bằng glob; `order` là các `levels` nối nhau, luật "đã dựng" giữ nguyên. Giả định chính: thứ tự chơi là tuyến tính xuyên chương. Hỏng đầu tiên nếu sau này muốn chọn chương tự do; khi đó chỉ đổi luật mở khóa ở `progression.ts`.
2. **Một file chương duy nhất chứa mọi chương.** Ít file hơn, nhưng `CHAPTER_TEXT` và tài liệu D1 `chapter:1` phải đổi hình dạng (migration vá cấu trúc cho câu đã có), và mọi nhánh đều sửa chung một file. Hỏng ngay ở lúc chuyển giao: câu D1 cũ không khớp khung mới.
3. **Chương 2 là một "game" riêng (route và ngữ cảnh tách hẳn).** Không đụng tiến trình chương 1, nhưng lặp lại toàn bộ `progression.ts`, bản đồ, màn tiêu đề. Hỏng ở chương 3: lặp lần thứ ba.

### B. Id đoạn truyện của chương mới

1. **`prologue-<n>`, `teaser-<n>`; chương 1 giữ `prologue`, `teaser` (chọn).** Không id nào dùng lại id cũ, nên `story_seen` của người chơi hiện có không ảnh hưởng (bài học `teaser` của Chương 1). Giả định: không ai cần đổi tên id chương 1. Hỏng đầu tiên nếu muốn thống nhất tên cả hai chương; khi đó cần migration đổi `story_seen`, không đáng.
2. **Đổi cả chương 1 sang `prologue-1`, `teaser-1`.** Đồng đều hơn nhưng phải viết migration đổi `story_seen`, và tab đang mở lúc deploy có thể ghi lại id cũ (phép hợp tập không bao giờ xóa).

### C. Mô phỏng

1. **Một loại mới `patrol` cho cả bảy màn, làm trong hạ tầng (chọn).** Các nhánh màn không chạm file dùng chung nào (bài học 7). Giả định: một cảnh "tình huống → quyết định → drone" đủ cho mọi màn rẽ nhánh. Hỏng đầu tiên nếu một màn cần hình ảnh riêng; khi đó thêm tùy chọn cho `patrol` ở phase tích hợp.
2. **Mỗi màn một loại mới như Chương 1.** Hình phong phú hơn, nhưng bảy cảnh mới, bảy lần sửa `SIMULATION_KINDS`/`level-simulation.tsx`/`sim-vocabulary.ts` song song, và quyết định rẽ nhánh lại là cùng một cấu trúc.
3. **Dùng lại `scanner`/`relay`/`checkpoint`.** Không tốn gì, nhưng chữ và hình nói về cổng và trạm phát, lệch truyện drone; `checkpoint` vẽ thanh Neural-ID 6 ô.

### D. Thứ tự khái niệm

1. **So sánh → `if` → `else` → `elif` → `and/or/not` → lồng nhau → Boss (chọn).** Mỗi màn thêm đúng một thứ, màn sau dùng màn trước. Ngưỡng cảnh báo phân biệt được cấu trúc vừa học (hai `if` rời đắt hơn `if/else`; các `if` rời đắt hơn `elif`; lồng `if/elif` đắt hơn `and/or`). Giả định: người mới cần tách `if` và `else` thành hai màn. Hỏng đầu tiên nếu playtest thấy 2.2–2.3 quá dễ; khi đó gộp 2.2 với 2.3 và đẩy giá trị rỗng thành một màn riêng.
2. **Gộp `if/else` một màn, thêm một màn "giá trị đúng/sai ngầm" (truthy).** Truthy khó chấm riêng: `if s:` và `if s != "":` cho cùng kết quả với mọi chuỗi, nên test không phân biệt được người hiểu và người không hiểu. Đã chọn dạy chuỗi rỗng như phần phụ của 2.6, trong tổng kết, không chấm.
3. **Dạy `and/or` trước `elif`.** Điều kiện ghép không có `elif` thì bài toán ít nhánh, khó đặt bốn tình huống có ý nghĩa.

### E. Hiện nhánh đã chạy

1. **Harness trả `skipped_lines`, editor làm mờ dòng không chạy (chọn).** Đây là phản hồi chính khi học rẽ nhánh: kết quả sai, người chơi thấy ngay khối nào không chạy. Chi phí: một trường harness, một decoration CodeMirror, một dòng terminal. Mã thẳng không có dòng bị bỏ, nên Chương 1 không đổi.
2. **Không thêm gì, chỉ dựa vào dòng in và mô phỏng.** Rẻ nhất, nhưng khi hai nhánh in giống nhau hoặc nhánh gán biến, người chơi không thấy mã đi đường nào.
3. **Phát lại từng dòng như trình gỡ lỗi.** Mạnh nhất nhưng là một tính năng lớn, trái với "chỉ thêm hạ tầng thật sự cần".

### F. Khóa phản ứng cho lỗi rẽ nhánh

1. **Một khóa tùy chọn `wrong_branch` (chọn):** giá trị sai trùng giá trị mong đợi của một tình huống khác. Bắt được chung một lần các lỗi sai biên, sai thứ tự `elif`, đảo `and`/`or`, viết cứng, mà không cần biết lỗi cụ thể; ECHO nói được "mã đã chạy nhánh của một tình huống khác".
2. **Mỗi lỗi một khóa** (sai biên, sai thứ tự…). Cần phân tích mã người chơi; không làm được tin cậy chỉ từ kết quả chạy.
3. **Không thêm khóa.** ECHO chỉ nói "lệch ở ký tự thứ n", vô nghĩa với một quyết định một từ.

## Trade-offs

- A1 đổi khả năng chọn chương tự do lấy việc giữ nguyên luật mở khóa và không đổi hình dạng tài liệu D1.
- B1 đổi sự đồng đều tên id lấy việc không cần migration `story_seen`.
- C1 đổi hình ảnh riêng từng màn lấy bảy nhánh màn không xung đột và một cảnh được làm kỹ một lần.
- D1 đổi một màn có thể hơi dễ (2.3) lấy nhịp tăng đều và ngưỡng cảnh báo có ý nghĩa ở mỗi màn.
- E1 đổi một ít công editor lấy phản hồi trực quan cho đúng khái niệm của chương.
- F1 đổi độ chi tiết của lời ECHO lấy một luật phân loại tổng quát, kiểm được bằng test.

## Better approaches

Đề bài gợi ý mỗi màn có thể dùng lại kind cũ hoặc có kind mới. Hướng tốt hơn là **một kind mới chung cho cả chương, làm trong hạ tầng**: bằng chứng là Chương 1 phải gom các chỗ chung (`SIMULATION_KINDS`, `level-simulation.tsx`, `sim-vocabulary.ts`, `validate-level.ts`) ở mỗi nhánh màn và giải xung đột lúc rebase (`docs/hop-dong-engine-level-1-5-den-1-7.md` mục 7); với `patrol` trong hạ tầng, nhánh màn chỉ còn file của chính nó. Chi phí chuyển: hạ tầng dài thêm một việc (H6), và mọi nhánh màn phải chờ H xong.

Một điểm thứ hai: đề bài nhắc "số trong `expected_output` không tự bị cấm (review L1)". Sửa thẳng `levelLeaks` cho mọi level có thể làm câu chữ Chương 1 đã sửa trên D1 thành "hỏng" sau deploy, vì validator chạy trên câu D1 lúc tải. Hướng an toàn hơn là áp luật mới cho `chapter >= 2` (hợp đồng engine mục 5.2).

## Hướng đã chọn

- **Hạ tầng:** đa chương bằng file (A1), id mới (B1), `patrol` (C1), `skipped_lines` (E1), `wrong_branch` (F1), hai luật kiểm câu chữ cho `chapter >= 2`. Chi tiết, file sở hữu, số migration: hợp đồng engine.
- **Truyện:** Kai rời Vùng Tối, phải qua Vành Sentinel trước đợt quét lớn (Neural-ID giả chỉ sống tới đó, đã gieo ở cuối Chương 1). Không đi theo lịch của 0xA7, Kai tự đọc luật của drone rồi viết bộ luật né sáu luật. Mảnh "Quyết định" nằm trong lõi luật của tháp, ở một nhánh OMNI không bao giờ chọn.
- **Ba mạch truyện:** (1) 0xA7 biết lịch gốc tới từng giây, và tín hiệu của nó phát từ chính tháp: gieo twist chương 3, không lộ. (2) Ngưỡng tái định hướng 60% cho thấy Nhi bị xử lý bởi một phép so sánh, và cuối chương mức tuân thủ của Nhi tụt xuống 96% vì Kai: mối lo cho các chương sau. (3) KTS-02 lộ lần đầu; một bản ghi KTS-0█ mất mã người viết, đề ngày sau khi chia mảnh: gieo kẻ phản bội cho chương 3 mà không chỉ ai. KTS-07 thêm một mảnh "mọi nhánh của OMNI đều có lý do": gieo twist chương 6.

### Bảng khung bảy màn

| # | Tên | Độ khó | Khái niệm | Địa điểm | Luật tạo ra | Mảnh nhật ký | Mô phỏng | Ngưỡng 40% | Móc câu |
|---|---|---|---|---|---|---|---|---|---|
| 2.1 | Đọc luật tuần tra | Easy | So sánh `== != < > <= >=`, kết quả `bool` | Đường Ống Số 9 | Cảm biến tầm quét | KTS-02 (1) | `patrol`, không `decision` | 3 | Sentinel bắn cả drone sai luật |
| 2.2 | Lệnh nấp | Easy | `if`, khối lệnh, thụt lề | Hàng Rào Ngoài | Lệnh nấp | KTS-01 (3) | `patrol`, `decision.var` | 3 | "Quyết định" là gì của công tắc |
| 2.3 | Hai ngả | Easy | `else`; dòng sau khối luôn chạy | Bãi Container | Ngả rẽ | KTS-07 (3) | `patrol`, `decision.var` | 3 | Ai đã qua trước Kai |
| 2.4 | Thang báo động | Medium | `elif`, thứ tự nhánh | Tháp Đèn Pha | Thang báo động | KTS-02 (2) | `patrol`, `decision.line` | 5 | Ngưỡng 60% đã xử lý Nhi |
| 2.5 | Ngã tư tuần tra | Medium | `and`, `or`, `not`, ngoặc | Ngã Tư Tuần Tra | Điều kiện qua đường | KTS-03 (2) | `patrol`, `decision.line` | 3 | Lịch 0xA7 khớp lịch gốc |
| 2.6 | Bảng lệnh trạm sạc | Medium | Điều kiện lồng; chuỗi rỗng coi là sai | Trạm Sạc Drone | Đọc bảng lệnh | KTS-0█ | `patrol`, `decision.line`, `stdin`, không dòng khóa | 6 | Đợt quét lớn dời sớm |
| 2.7 | BOSS Trạm Sentinel | Boss | Tổng hợp Chương 2 (+ đổi kiểu từ kênh nhập) | Trạm Sentinel | (mảnh "Quyết định") | KTS-02 (3) | `patrol`, `decision.line` 4, `stdin`, 4 pha | 17 | 0xA7 phát từ trong tháp |

Phác câu đố, dữ liệu tình huống và số câu lệnh đã đo: `design/gdd-chuong-2.md` mục 6; số liệu chốt nằm trong GDD từng màn (`design/chuong-2/gdd-2.<n>-<slug>.md`). Bảng trên đã chỉnh theo các GDD đó ngày 30/10/2026: 2.3 đổi quyết định sang biến `huong`; ngưỡng 2.4, 2.5, 2.6, 2.7 nâng lên để không phạt lối "gán biến rồi in một lần"; Boss có bốn pha.

## Rủi ro

- **2.2 và 2.3 có thể quá dễ** với người đã biết lập trình. Chương này dành cho người mới; Easy là đúng vị trí. Đường lùi ở lựa chọn D.
- **Ngưỡng 2 câu ở 2.5** rất chặt: lời giải bằng biến trung gian (`an_toan = …` rồi `if an_toan:`) có 3 câu, chỉ 1 sao. Đã quyết trong GDD 2.5: ngưỡng 3, bằng lối gán biến rồi in một lần.
- **`wrong_branch` có thể bắn khi giá trị sai trùng tình cờ** một giá trị mong đợi khác. Với quyết định một từ, trùng tình cờ chính là sai nhánh; với dòng có số, rất hiếm. Chấp nhận.
- **Lộ twist chương 3:** chuỗi "lịch gốc chỉ tám người biết" (2.5) + "0xA7 phát từ trong tháp" (2.7) + "KTS-0█" (2.6) gợi khá mạnh. Đã giữ ba điều: ECHO không suy đoán, không nhịp nào nối 0xA7 với một Kiến Trúc Sư, KTS-0█ không có chi tiết nhận dạng. Người soạn màn không được thêm.
- **Ngưỡng 60% và 96%** có thể bị đọc là "Nhi sắp bị tái định hướng lại". Đó là mối lo chủ ý; chương 3 phải xử lý hoặc giữ mạch này.
- **Hạ tầng dài** (H1–H6) chặn mọi nhánh màn. Người soạn màn có thể viết GDD và tài liệu câu chữ trong lúc chờ; chỉ JSON và migration mới cần H.
- **Bỏ tên "BẢN ĐỒ VÙNG TỐI"** làm vỡ e2e có sẵn; hạ tầng phải sửa selector.

## Tiêu chí chấp nhận cốt lõi

Cả chương:
- Người chơi mới đi liền mạch 1.7 → `teaser` → `prologue-2` → 2.1 … 2.7 → `teaser-2` → bản đồ Chương 2.
- Người chơi cũ đã xem `teaser` bấm TIẾP TỤC thì gặp `prologue-2`.
- Bản đồ Chương 2 có 7 nút chơi được, tổng sao tối đa 21, thanh Bộ luật né 6/6 sau 2.6. Chương 1 không đổi kết quả test nào.

Mỗi màn:
- Đủ bảng phủ nhánh và bảng đột biến, chạy qua harness thật trong test tích hợp.
- Code khởi đầu ra đúng khóa đã ghi; lời giải 2 sao và 3 sao đúng số sao và số câu lệnh.
- Câu ECHO sạch từ cấm, số và dòng mong đợi; e2e được viết.

## Câu hỏi còn mở (đã tự chốt mặc định)

1. **Mở Chương 2 cần gì?** Mặc định: 1.7 có ít nhất 1 sao, như mọi màn. Không đòi tổng sao Chương 1.
2. **Kai đi đâu sau biên giới?** Mặc định: ra vùng đất bên ngoài thành phố, nơi có trung tâm dữ liệu bỏ hoang của Chương 3.
3. **Kiến Trúc Sư mới:** chỉ KTS-02 lộ ở Chương 2, cộng một bản ghi KTS-0█ không rõ người viết. Danh tính KTS-0█ và việc nó có phải 0xA7 hay không để chương 3 quyết.
4. **Nhi ở Chương 2:** không xuất hiện trực tiếp; chỉ qua ngưỡng 60% (2.4) và nhật ký 96% (`teaser-2`).
5. **Neural-ID giả tắt ở cuối Chương 2.** Chương 3 bắt đầu với Kai không có danh tính.
6. **Đầu ra in không dấu** (`LENH: NAP`), như Chương 1.
7. **Một mô phỏng `patrol` cho cả chương**, kể cả 2.1 (không có `decision`).
8. **2.6 không ép lồng nhau:** lời giải dùng `and` cũng được 3 sao vì chấm theo hành vi.
9. **Chuỗi rỗng coi là sai** chỉ dạy trong tổng kết 2.6, không chấm riêng.
10. **Sáu phông mới** làm ở một nhánh cảnh song song; trước khi có, nhịp dùng `tram-sentinel`.
11. **Câu cuối Chương 1 được vá** bằng migration `0018`, phát hành cùng Chương 2.

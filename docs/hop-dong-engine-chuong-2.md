# Hợp đồng engine và hạ tầng Chương 2 "Trạm Sentinel"

Ngày: 2026-10-30. Chạy tự động, không hỏi được người dùng; các điểm tự chốt nằm ở mục 12.
Trục truyện và khung bảy màn: `design/gdd-chuong-2.md`. Lựa chọn và lý do: `design/quyet-dinh/cot-truyen-chuong-2.md`. Quyết định kiến trúc: QĐ-19 trong `docs/quyet-dinh-ky-thuat.md`.

Tài liệu này chốt mọi thay đổi dùng chung mà Chương 2 cần, thứ tự làm, chia nhánh và số migration. Khi một GDD màn của Chương 2 nói khác tài liệu này, tài liệu này thắng. Hai hợp đồng cũ (`docs/hop-dong-engine-level-1-1-den-1-3.md`, `docs/hop-dong-engine-level-1-5-den-1-7.md`) vẫn đứng; tài liệu này chỉ cộng thêm.

## Hiện trạng (đã kiểm trong mã nguồn ngày 30/10/2026)

- Mọi thứ đang gắn cứng vào một chương:
  - `src/story/chapter.ts` import thẳng `chapter-1.json`; `getChapter(texts)` trả một chương.
  - `GameRoot` (`src/app.tsx`) dựng một `ChapterContext`; `Shell` nhận một `ctx`.
  - `server/content/bundled-content.ts` đọc một `CHAPTER_FILE`. `content-migration-cli.ts` và `src/ui/admin/admin-editor.tsx` (`bundledChapter()`) cũng chỉ biết một file chương. `tests/content-fixture.ts` có hằng `CHAPTER` trỏ vào `chapter-1.json`.
- `progression.ts`:
  - Id đoạn truyện cố định: `prologue`, `after-<id>`, `teaser`.
  - `rawStoryEnd("after-<id>")` dẫn tới level đã dựng kế tiếp, hết level thì tới `teaser`.
  - `componentSlot` lấy vị trí level trong `chapter.levels`. `seenStories` liệt kê `prologue`, `after-*`, `teaser`.
- Chữ gắn cứng chương 1 trong code: "Bản đồ Vùng Tối", "Chương 1 · Vùng Tối", "Lô 17 → Cổng Kiểm Soát", "Neural-ID giả" (`chapter-map.tsx`); nút "BẢN ĐỒ VÙNG TỐI" (`title-screen.tsx`); thẻ "NEURAL-ID GIẢ · THÀNH PHẦN n/6" (`build-story.ts`); "Hết chương 1" (`story-labels.ts`). `finishStory` trong `app.tsx` và màn kết của `story-screen.tsx` coi `teaser` là điểm cuối, chỉ có nút VỀ BẢN ĐỒ.
- Hiệu ứng `fragment_found` (`city-matrix.tsx`) luôn chỉ sáng một mảnh.
- `ROUTE_ID` là `^[\w.-]{1,64}$`, nhận được `prologue-2`, `teaser-2`.
- Đoạn hết chương 1 (`teaser[8]` của `chapter:1`, migration `0008`) kết bằng "Chương 2: Trạm Sentinel · Tín hiệu đang giải mã." Câu này sai khi Chương 2 phát hành.
- Phông `tram-sentinel` đã có (`scene-art.tsx`, `scene-catalog.ts`): tường biên giới, tháp, drone tuần tra.
- Migration hiện có tới `0009`.
- Cách đếm câu lệnh khi có nhánh, đo bằng harness thật (`run_level`) trên python3 3.13 và 3.14 (cùng kết quả), xem mục 3.

## 1. Nhiều chương

### 1.1. File chương

- Mỗi chương một file câu đố `src/story/chapter-<n>.json`, nạp bằng `import.meta.glob("./chapter-*.json")`. Thêm chương là thêm file và migration câu chữ của nó, không sửa code.
- Hình dạng giữ nguyên chương 1 (`schema_version`, `chapter`, `title`, `levels`, `neural_id_slots`, `prologue`, `teaser`). Thêm hai trường bắt buộc, cả hai là tên ngắn giống `title` (câu đố, không vào `CHAPTER_TEXT`, không cần migration):
  - `component_bar: { "label": string, "unit": string }`: tên thanh thành phần và tên một ô. Chương 1: `{"label": "Neural-ID giả", "unit": "Thành phần"}`. Chương 2: `{"label": "Bộ luật né", "unit": "Luật"}`.
  - `map: { "from": string, "to": string }`: hai đầu đường mòn trên bản đồ. Chương 1: `Lô 17` → `Cổng Kiểm Soát`. Chương 2: `Đường Ống Số 9` → `Trạm Sentinel`.
- `neural_id_slots` giữ tên cũ (đổi tên là churn không đem lại gì), nghĩa mới: số ô của thanh thành phần trong chương. Chương 2: 6.
- `prologue` và `teaser` giữ tên trường để `CHAPTER_TEXT` và `validateChapterText` không đổi. Với chương ≥ 2, `teaser` là đoạn hết chương ngay từ đầu.
- Tài liệu câu chữ D1: `chapter:<n>` (đã đúng mẫu `docIdOf`). Câu ban đầu của `chapter:2` vào bằng migration `0010` (mục 9).

### 1.2. Kiểm hợp lệ

- `validateChapter` kiểm thêm `component_bar` và `map` (chuỗi không rỗng, tối đa 40 ký tự).
- Một test chung (thay test "level phải nằm trong `chapter-1.json`"): mỗi file `src/levels/*.json` nằm trong đúng một `levels` của một file chương, và trường `chapter` của level bằng số của file đó; không id level nào lặp giữa các chương; số chương liền nhau từ 1.
- `getChapters(texts)` trả mọi chương theo số, mỗi chương `ok` hoặc lỗi. **Chương 1 hỏng → màn "DỮ LIỆU CHƯƠNG HỎNG"** như hiện nay. **Chương ≥ 2 hỏng** (thiếu dòng D1, câu lệch khung) → level của chương đó không vào được (route về bản đồ), bản đồ hiện chương đó với nhãn "TÍN HIỆU HỎNG"; chương 1 vẫn chơi được.

### 1.3. Ngữ cảnh tiến trình

`ChapterContext` thành `GameContext`:

```ts
interface GameContext {
  chapters: ChapterDefinition[];      // chương hợp lệ, theo số
  brokenChapters: number[];
  order: string[];                    // nối levels của mọi chương hợp lệ
  chapterOf: Map<string, number>;     // id level → số chương
  built: Map<string, LevelDefinition>;
  broken: Set<string>;
}
```

Luật "đã dựng" giữ nguyên, chạy trên `order` nối liền: level đã dựng đầu tiên của cả game luôn mở; mỗi level đã dựng sau đó mở khi level đã dựng **liền trước trong `order`** có ≥ 1 sao. Vì vậy 2.1 mở khi 1.7 có sao. Không thêm trạng thái lưu nào.

### 1.4. Id đoạn truyện

| Đoạn | Chương 1 (giữ nguyên) | Chương n ≥ 2 |
|---|---|---|
| Mở chương | `prologue` | `prologue-<n>` |
| Sau level | `after-<id>` | `after-<id>` (id level đã duy nhất) |
| Hết chương | `teaser` | `teaser-<n>` |

Không id nào của chương 2 trùng hay dùng lại id đã có (bài học `teaser` của Chương 1, `docs/hop-dong-engine-level-1-5-den-1-7.md` mục 7). Người chơi hiện có (`story_seen` có `prologue`, `after-1.1`…`after-1.7`, `teaser`) không mang id nào của chương 2, nên không cần migration xóa `story_seen`.

### 1.5. Đoạn truyện dẫn đi đâu (`rawStoryEnd`)

- `prologue-<n>` (và `prologue`) → level đã dựng đầu tiên của chương n; chương không có level nào → Bản đồ.
- `after-<id>` → level đã dựng kế tiếp **trong cùng chương**; hết level trong chương → đoạn hết chương của chương đó.
- Đoạn hết chương của chương n → `prologue-<m>` của chương hợp lệ kế tiếp có level đã dựng; không có → Bản đồ.
- `forward` giữ luật cũ: đoạn đã xem thì nhảy qua tới chỗ nó dẫn tới.

`titleContinue`: tìm level đã dựng đầu tiên chưa có sao, rồi đi theo chuỗi dẫn vào nó qua `forward` (đoạn dẫn của level đầu chương n ≥ 2 là `after-<level cuối chương n−1>`, nên chuỗi là `after-1.7` → `teaser` → `prologue-2` → 2.1). Người chơi cũ đã xem hết Chương 1 bấm TIẾP TỤC sẽ gặp `prologue-2`.

`guardRoute`:
- `prologue-<n>` chỉ mở khi đã xem, hoặc level đã dựng cuối của chương n−1 có sao.
- `teaser-<n>` chỉ mở khi đã xem, hoặc level đã dựng cuối của chương n có sao.
- Level thuộc chương hỏng → Bản đồ.

### 1.6. Màn kết của đoạn hết chương

`finishStory` thôi coi `teaser` là điểm dừng cố định. Đoạn hết chương nào cũng kết bằng một khung:
- Có chương kế tiếp đã dựng: nút **TIẾP TỤC** (focus sẵn, → `prologue-<m>`) và nút **VỀ BẢN ĐỒ**.
- Không có: chỉ **VỀ BẢN ĐỒ** và dòng mời chơi lại như hiện nay.

Xem lại từ bản đồ vẫn về bản đồ.

### 1.7. Thẻ thành phần và hiệu ứng

- `build-story.ts`: thẻ thành phần thành `${component_bar.label in hoa} · ${component_bar.unit in hoa} ${n}/${slots}: ${component}`. Chương 1 ra đúng chữ cũ ("NEURAL-ID GIẢ · THÀNH PHẦN 2/6: …"); chương 2 ra "BỘ LUẬT NÉ · LUẬT 2/6: …". In hoa bằng `toLocaleUpperCase("vi")`.
- `componentSlot` lấy vị trí level trong `levels` **của chương chứa nó**. Level thứ 7 (Boss) vẫn nằm ngoài 6 ô, không có thẻ.
- `fx: "id_bar"` vẽ thanh của chương đang phát (số ô và ô đã thu của chương đó).
- `fx: "fragment_found"` sáng **n mảnh đầu** với n là số chương của đoạn đang phát. Chương 1 vẫn sáng một mảnh. Không thêm trường dữ liệu.
- Thẻ "MẢNH THUẬT TOÁN 2/8 · QUYẾT ĐỊNH" là một nhịp `card` do người soạn 2.7 viết trong `outro_beats` (giống 1.7), không do engine sinh.

### 1.8. Bản đồ và định tuyến

- Route mới `#/map/<n>`; `#/map` mở chương chứa nút "TIẾP THEO", nếu không có thì chương cuối có level đã qua. Trên bản đồ có hàng chuyển chương (một nút cho mỗi chương có file, chương hỏng hiện "TÍN HIỆU HỎNG").
- `ChapterMap` nhận một chương: tiêu đề "Bản đồ · <title>", đầu ô "Chương n · <title>", hai đầu đường mòn từ `map`, thanh từ `component_bar`, tổng sao của chương (Chương 2: tối đa 21), nhật ký KTS, tổng kết kiến thức và đoạn truyện đã xem **của chương đó**.
- `seenStories` theo chương: `prologue-<n>`, `after-*`, `teaser-<n>` (chương 1 giữ id cũ).
- `storyLabel`: `prologue-<n>` → "Mở đầu chương n", `teaser-<n>` → "Hết chương n"; `prologue`, `teaser` giữ "Mở đầu", "Hết chương 1".
- Nút màn tiêu đề "BẢN ĐỒ VÙNG TỐI" đổi thành "BẢN ĐỒ".
- `useProgressSnapshot` đọc sao của mọi level trong `order` (đã là danh sách id, chỉ cần truyền `order` mới).

### 1.9. Server và công cụ câu chữ

- `server/content/bundled-content.ts`: đọc mọi `src/story/chapter-*.json` thay vì `CHAPTER_FILE`; mỗi file một tài liệu `chapter:<n>`. `vercel.json` `includeFiles` (`src/{levels,story}/*.json`) đã phủ.
- `content-migration-cli.ts`: thông báo lỗi nhắc `src/story/chapter-*.json`; tìm tài liệu theo `docId` như cũ.
- `admin-editor.tsx`: `bundledChapter()` thành tra cứu theo số chương.
- `tests/content-fixture.ts`: `realChapter(n = 1)`, `realChapterJson(n = 1)`; `realRegistry()` không đổi.
- `server/content/content-migration.test.ts` đã đòi mọi tài liệu trong bundle có dòng D1; sau thay đổi trên nó tự đòi cả `chapter:2`.

## 2. Mô phỏng `patrol` (dùng cho cả bảy màn)

Cả Chương 2 dùng một loại mô phỏng mới, làm ở nhánh hạ tầng, để các nhánh màn không phải sửa file dùng chung nào.

```json
"simulation": { "kind": "patrol", "decision": { "line": 4 } }
"simulation": { "kind": "patrol", "decision": { "var": "lenh" } }
"simulation": { "kind": "patrol" }
```

- **Cảnh:** dải đất giữa hai lớp rào, một drone tuần tra quét đèn, chấm của Kai ở mép dưới. Mỗi test cơ bản là một **tình huống** (dùng `RunOutcome.rounds`): bảng cảm biến hiện các đầu vào của tình huống (`inputs` và dòng `stdin`, dùng lại kiểu chip đã có), rồi quyết định của Kai.
- `decision` (tùy chọn) trỏ tới một mục tiêu: `{ "line": n }` (mục tiêu `output_line`) hoặc `{ "var": name }` (mục tiêu biến). Chip của Kai hiện giá trị nhận được của mục tiêu đó. Khớp: Kai đi qua, drone không quay đèn lại. Lệch: đèn khóa vào Kai, nhãn "BỊ PHÁT HIỆN", ô cần/nhận hiện cạnh. Không có `decision` (2.1): các mục tiêu hiện như đèn báo của drone, tình huống đạt khi mọi đèn đúng.
- Mục tiêu dòng in khác (Boss) đi vào danh sách dòng dùng chung (`output-slots-model.ts`, `output-slots.tsx`).
- **Tình huống đạt ⇔ test đạt:** một tình huống chỉ đạt khi **mọi** mục tiêu đúng, cả biến lẫn dòng in (`RoundVerdict.passed`), không chỉ mục tiêu `decision`. Chip quyết định đúng mà mục tiêu khác sai thì chip xanh, ô của mục tiêu sai đỏ, tình huống vẫn "BỊ PHÁT HIỆN". Code khởi đầu 2.3 (`huong` đúng, dòng in thiếu) và Boss 2.7 (dòng 4 đúng, dòng khác sai) rơi đúng vào trường hợp này.
- **Biến quyết định không có giá trị** (`missing_var`, ví dụ 2.3 ở góc 90 khi hai `if` rời đều không chạy): chip trống, Kai đứng yên giữa lối, tình huống "BỊ PHÁT HIỆN".
- **Bảng cảm biến hiện dòng `stdin` phân biệt được `""` và `" "`:** dòng rỗng là một thẻ trống có nhãn, không bị ẩn; dấu cách hiện thấy được (`·`, như `output-diff.ts`). 2.6 và 2.7 có cả hai loại dòng trong dữ liệu.
- **Level không có `inputs` và `locked_lines`** (`[]`, 2.6 là level đầu tiên như vậy) phải hợp lệ và hiện được: bảng cảm biến chỉ có dòng kênh nhập, editor và nút đặt lại code chạy với đường lùi `locked_lines[0] ?? 1` đã có.
- **Liên tiếp:** dừng ở tình huống sai đầu tiên; các tình huống sau xám "CHƯA TỚI" (cùng luật với terminal và `checkpoint`).
- **Lỗi lúc chạy:** đèn khóa vào Kai ở tình huống lỗi, nhãn lỗi như relay. **Lỗi cú pháp:** không tình huống nào chạy.
- **Phản công:** băng `counter_attack_banner`, nhãn "OMNI ĐỔI LUẬT TUẦN TRA", các test phản công chạy như các tình huống mới.
- **Bắt buộc từ bài học M1:** lượt phản công có `outcome.key === "timeout"`, `counterAborted`, `error.phase === "counter"` hoặc thiếu `counterVars`/`counterOutput` đều vẽ "TIẾN TRÌNH BỊ CẮT", không vẽ drone từ chối. `patrol-timeline.test.ts` có case cho từng trường hợp.
- Giảm chuyển động (khung cuối của từng tình huống), Esc, `aria-live` ("Tình huống 1 qua. Tình huống 2: bị phát hiện."), điện thoại: theo khuôn chung `use-timeline-playback.ts`.
- **Validator ép đúng điều kiện mà cảnh dựa vào (bài học L3):**
  - level `patrol` có ít nhất 2 test cơ bản;
  - `decision.line` trỏ tới một mục tiêu `output_line` có thật; `decision.var` trỏ tới một mục tiêu biến kiểu `str` (level còn được có thêm mục tiêu dòng in, như 2.3);
  - không có khóa lạ trong `simulation`.
- **Từ vựng** (`sim-vocabulary.ts`): một mục `patrol`. Chữ cụ thể do nhánh hạ tầng viết theo skill `van-viet-tu-nhien`; ý đồ:
  - từ mở vòng là "TÌNH HUỐNG", nên terminal in `> TÌNH HUỐNG 2/4 · …`;
  - dòng đạt là "DRONE BỎ QUA", dòng trượt là "DRONE PHÁT HIỆN";
  - tiêu đề hộp kết quả cho 1/2/3 sao nói về việc qua dải tuần tra.
- File: `src/ui/patrol-timeline.ts` (+ test), `src/ui/patrol-simulation.tsx`, một giá trị trong `SIMULATION_KINDS`, một nhánh trong `level-simulation.tsx`, một mục trong `sim-vocabulary.ts`, kiểm trong `validate-level.ts`, CSS trong `global.css`. Test dùng level giả trong `tests/fixtures/levels/`.

Không dựng thêm loại mô phỏng nào cho Chương 2. Nếu thiếu thời gian, `patrol` vẫn phải có; đường lùi là bỏ phần drone quét đèn, chỉ giữ bảng tình huống và chip quyết định.

## 3. Đếm câu lệnh khi có nhánh

Harness và `compute-stars.ts` **không đổi**. Đo ngày 30/10/2026 bằng `run_level` thật:

| Mã | Câu lệnh được đếm |
|---|---|
| Dòng `if` (mỗi lần tới) | 1 |
| Dòng `elif` (mỗi lần tới, tức là mọi điều kiện trước nó sai) | 1 |
| Dòng `else:` | 0 (không phải câu lệnh) |
| Thân nhánh | mỗi câu lệnh chạy là 1; nhánh không chạy là 0 |
| `and`, `or`, `not` trong một điều kiện | 0 thêm (vẫn là một câu lệnh) |
| `x = a if c else b` | 1 |

Ví dụ đo được: chuỗi `if/elif/elif/else` bốn mức, mỗi nhánh một `print`, cho 2, 3, 4, 4 câu lệnh ở bốn tình huống; ba `if` rời gán đè cùng một biến rồi in cho 5–8. `if` có thân, không `else`, cho 2 khi điều kiện sai, 3 khi đúng (tính cả câu gán mặc định trước nó).

Luật cho người viết GDD:

- Số câu lệnh của một lượt là **giá trị lớn nhất trên các test cơ bản** (`classify-run.ts`: `Math.max(...base.map(r => r.line_count))`). Test phản công **không** ảnh hưởng sao: không chặn vì cảnh báo, không giảm sao. Nhánh dài nhất phải có mặt trong test cơ bản, nếu không thì mức cảnh báo đo thiếu.
- `alert_limit_statements` = số câu lệnh lớn nhất trên các test cơ bản của **lời giải tham khảo**, hoặc của lối **"gán biến rồi in một lần"** nếu lối đó tốn hơn, miễn là ngưỡng vẫn đẩy lối viết sai mà màn dạy xuống 1 sao. Lối gán rồi in là code sạch, ngưỡng không phạt nó. Ghi bảng đo vào GDD (mỗi tình huống bao nhiêu câu, cả hai lối). Kết quả: 2.1–2.3 ngưỡng 3, 2.4 ngưỡng 5, 2.5 ngưỡng 3, 2.6 ngưỡng 6, 2.7 ngưỡng 17.
- Ngưỡng không được ép cách viết chưa dạy: lời giải bằng biểu thức `a if c else b` rẻ hơn, được chấp nhận; ngưỡng không đặt thấp hơn lời giải `if/else` thường.
- Ngưỡng **được phép** phân biệt cấu trúc đã dạy: ở 2.3, khi quyết định là biến `huong`, hai `if` rời (4 câu) vượt ngưỡng 3 của `if/else`; ở 2.4, các `if` rời gán đè (tới 8 câu) vượt ngưỡng 5 (lối gán rồi in của chuỗi `elif`). Truyện giải thích: mỗi lần kiểm là một lần drone có thể nghe thấy.

## 4. Dữ liệu test phải chấm đúng khái niệm (bài học 1.4)

Mỗi GDD màn Chương 2 phải có hai bảng, và lời giải mẫu phải được chạy bằng harness thật:

1. **Bảng phủ nhánh:** mỗi test cơ bản và phản công ứng với nhánh nào của từng quyết định.
   - Mọi nhánh có ít nhất một test **cơ bản**.
   - Mọi điểm biên (giá trị làm hai vế của một so sánh bằng nhau) có mặt ở test cơ bản hoặc phản công. Biên của khái niệm chính của màn nằm ở test cơ bản.
2. **Bảng đột biến:** các lời giải sai tiêu biểu kèm số sao mong đợi, tối thiểu những dòng áp dụng được:
   - viết cứng theo tình huống 1;
   - sai biên (`<` thay `<=`, `>` thay `>=`);
   - đảo `and`/`or`; bỏ ngoặc đổi thứ tự ưu tiên; quên `not`;
   - đảo thứ tự `elif`; tách `elif` thành các `if` rời;
   - thân nhánh thụt lề sai.

   Không đột biến nào được 3 sao. Viết cứng không được quá 1 sao nếu có thể, tối đa 2.

Test tích hợp `tests/integration/level-2-x.test.ts` chạy code khởi đầu, lời giải 2 sao, lời giải 3 sao và **mọi dòng của bảng đột biến** qua harness (`run-harness.ts`), kiểm khóa phản ứng, số sao và số câu lệnh. Lời giải và đột biến là file trong `tests/fixtures/solutions/2.x/`.

Mọi màn Chương 2 có **ít nhất 2 test cơ bản** (validator `patrol` ép điều này). Nhờ vậy viết cứng trượt ngay ở lượt cơ bản, `rounds` luôn có và `{round}` luôn có khi lượt cơ bản trượt (lượt phản công không có `{round}`, mục 5.1).

## 5. Phân loại và phản ứng ECHO

### 5.1. Khóa tùy chọn mới `wrong_branch`

| Khóa | Khi nào | Không có câu thì |
|---|---|---|
| `wrong_branch` | Giá trị sai đầu tiên **trùng giá trị mong đợi của chính mục tiêu đó ở một test khác** của level (cơ bản hoặc phản công): dòng in ra sai bằng `expected_output[line-1]` của test khác (so sau chuẩn hóa NFC như harness), hoặc biến sai có cùng kiểu và giá trị với `expected[var]` của test khác | khóa đang áp: `output_mismatch`/`output_case_only` hay `wrong_value` ở lượt cơ bản, `wrong_value_counter` ở lượt phản công |

- Nghĩa: mã chạy đúng một nhánh có thật, nhưng là nhánh của tình huống khác (sai biên, sai thứ tự `elif`, đảo `and`/`or`, viết cứng). ECHO nói chuyện đó mà không cần biết lỗi cụ thể.
- Đi qua `levelHasLine` như mọi khóa tùy chọn. Thêm vào `REACTION_KEYS` (thứ tự cuối danh sách).
- Thứ tự trong nhánh đầu ra: `output_has_prompt` → `output_is_label` → `wrong_branch` → khóa chung. Trong nhánh biến: `type_mismatch*` vẫn đứng trước; `value_is_label`, `value_overwritten` đứng trước `wrong_branch`.
- `details` giữ `out_line`/`vars` như khóa nó thay. `round` chỉ có ở lượt cơ bản (`classify-run.ts` chỉ gắn `details.round` cho test cơ bản trượt); ở lượt phản công `wrong_branch` không có `round`, nên câu cho khóa này không được dùng `{round}` (validator chặn, mục 5.2).
- **Không áp cho mục tiêu biến kiểu `bool`.** Với `bool`, giá trị sai nào cũng trùng giá trị mong đợi của một test khác, nên khóa vô nghĩa. Engine bỏ qua mọi biến `bool` khi xét khóa này: biến `bool` sai không bao giờ làm ra `wrong_branch`, khóa chung (`wrong_value`, `wrong_value_counter`) đứng nguyên. Level không cần né: màn chỉ có mục tiêu `bool` (2.1) đơn giản là không viết câu cho khóa này; màn trộn kiểu sau này vẫn dùng được nó cho các biến khác.
- Câu ECHO cho khóa này không được trích giá trị (luật lộ đáp án như mọi câu khác).

Không thêm khóa riêng cho `=` thay `==` trong điều kiện hay thiếu dấu `:`. Python 3.13 đã in "Maybe you meant '==' or ':=' instead of '='?" và "expected ':'" trong traceback ở terminal; khóa `SyntaxError` có `{line}` là đủ.

### 5.2. Luật kiểm câu chữ mới

Ba luật đầu dưới đây chỉ áp cho level có `chapter >= 2`, để câu chữ Chương 1 đang chạy trên D1 (có thể đã được sửa trên `#/admin`) không thể thành "hỏng" sau khi deploy. Luật 4 áp cho mọi level, vì nó không thể làm câu nào đang hợp lệ thành lỗi:

1. **Số trong dòng mong đợi là đáp án (review L1).** `levelLeaks` thêm vào `answers` mọi cụm chữ số dài từ 2 ký tự trở lên (kể cả phần thập phân, ví dụ `45`, `3.31`) nằm trong mỗi dòng `expected_output`. Người viết GDD vẫn liệt kê các số một chữ số đáng giấu và mọi dữ liệu tình huống trong `forbidden_terms`.
2. **`{round}` chỉ dùng được ở level có ít nhất 2 test cơ bản (review L2).** Mọi màn Chương 2 đều thỏa, nên luật này chỉ chặn sai sót về sau.
3. **`{round}` chỉ dùng được ở khóa luôn mang `round` khi lượt cơ bản trượt.** `classify-run.ts` chỉ gắn `details.round` cho test cơ bản trượt đầu tiên; ở mọi chỗ khác `renderTemplate` thay `{round}` bằng "?". Validator báo lỗi khi câu (trong `reactions` hoặc `reaction_variants`) của các khóa sau chứa `{round}`:
   - không bao giờ mang `round`: `entry`, `SyntaxError`, `IndentationError` (lỗi biên dịch, chưa test nào chạy), `alert_exceeded`, `two_stars`, `three_stars` (lượt cơ bản đã đạt), `counter_ValueError`, `counter_error`, `counter_type_mismatch`, `wrong_value_counter`, `counter_timeout` (lượt phản công), `repeated_fail` (chỉ nhận `{count}`), `engine_error`;
   - có lúc không mang `round`: `wrong_branch` (bắn cả ở lượt phản công), `timeout` (cả khi worker hết giờ hoặc phản công hết giờ), `generic`.
   Các khóa còn lại chỉ bắn từ test cơ bản trượt (`missing_var`, `type_mismatch*`, `wrong_value`, `value_is_label`, `value_overwritten`, `string_repeated`, `output_*`, `output_has_prompt`, `EOFError`, lỗi chạy có tên, `runtime_error`, `resource_limit`, `blocked_import`, `input_unsupported`, `system_exit`) và dùng được `{round}`.
4. **Số mẫu của kiểm câu chữ không được trùng dữ liệu tình huống.** `echoLineLeaks` (`src/game/echo-line-check.ts`) điền chỗ giữ bằng `SAMPLE` rồi mới so từ cấm. `SAMPLE` hiện là `line` 7, `count` 12, `out_line` 2, `col` 6, `round` 2, nên level nào cấm `"7"`, `"12"` hay `"2"` thì mọi câu dùng chỗ giữ tương ứng thành lỗi. Đã gặp: 2.1 cấm `7` mà câu `TypeError` của nó dùng `{line}`; 2.2 và 2.7 cấm `12`, trùng `{count}` của các khuôn như `alert_exceeded`, `output_extra`; 2.6 đã phải bỏ `12` khỏi `forbidden_terms`. Với `SAMPLE` cũ, câu chữ 2.1, 2.2, 2.7 viết đúng GDD sẽ không qua kiểm, nên H4 phải xong trước khi các nhánh màn sinh migration. H4 đổi các số mẫu sang dải không phải dữ liệu: `line` 9131, `out_line` 9132, `col` 9133, `round` 9134, `count` 9137 (`vars` `ma_xac_thuc, chi_so` và `error_type` `ValueError` không trùng từ cấm của màn nào trong Chương 2, giữ nguyên). Luật cho người soạn: được cấm mọi số dữ liệu của màn, kể cả số một chữ số; không dùng số 9131–9137 làm dữ liệu hay từ cấm. Sau H4, 2.6 có thể thêm lại `12` vào `forbidden_terms`.

Luật cũ giữ nguyên: `int`, `float`, `round` và `forbidden_terms` bị cấm trong `reactions`, `reaction_variants`, nhịp `echo`; hints được miễn; `task_steps` không chứa giá trị hay dòng mong đợi.

**Từ cấm gợi ý cho Chương 2** (mỗi GDD chọn tập phù hợp, cộng mọi giá trị dữ liệu tình huống): tên từ khóa của màn (`if`, `elif`, `else`, `and`, `or`, `not`), ký hiệu so sánh (`==`, `!=`, `<=`, `>=`, `<`, `>`), cụm nói thẳng cách sửa ("lớn hơn hoặc bằng", "nhỏ hơn hoặc bằng", "đảo thứ tự", "thụt lề", "dấu hai chấm"), tên biến đầu vào. "nhánh", "điều kiện", "tình huống" không bị cấm: ECHO cần chúng để mô tả.

## 6. Hiện nhánh đã chạy

Người mới học `if` không thấy được mã đã đi qua nhánh nào khi kết quả sai. Chương 2 thêm đúng một thứ cho việc này:

- **Harness:** mỗi kết quả test có thêm `skipped_lines`: các dòng mở đầu câu lệnh (`_statement_lines`) **không chạy lần nào** trong test đó, sắp tăng dần, tối đa 200. Chỉ có khi `status == "ok"` (chạy hết, không lỗi) và danh sách khác rỗng. Lượt lỗi đã có traceback chỉ dòng; mã chạy thẳng (mọi màn Chương 1) không có dòng nào bị bỏ, nên Chương 1 không đổi gì.
- **Phân loại:** `RunOutcome.skippedLines` là của test đang hiện (tình huống sai đầu tiên, hoặc tình huống 1).
- **Editor:** sau khi mô phỏng phát xong, các dòng trong `skippedLines` mờ đi, có gutter "–" và `title` "Không chạy ở tình huống n". Sửa code thì xóa ngay. Giảm chuyển động: hiện ngay, không chuyển màu dần.
- **Terminal:** một dòng `> KHÔNG CHẠY Ở TÌNH HUỐNG n: dòng 5, 6`, đặt trước dòng kết quả cuối, chỉ khi có `skippedLines`.
- unittest Python: `if` đúng/sai, `elif`, `else`, lồng nhau, lượt lỗi (không có trường), mã thẳng (không có trường).

## 7. Những gì KHÔNG đổi

- `compute-stars.ts`, `alert.ts`, `prepare-source.ts`, worker và giao thức worker (thêm trường trong JSON kết quả không đổi giao thức), luật sao và luật đếm câu lệnh.
- Kênh nhập `stdin`, `rounds`, `details.round`, `output_has_prompt`, `EOFError` (dùng lại nguyên như Chương 1).
- Bộ lưu tiến độ, `progress-store.ts`, API tiến độ, giới hạn 100 level và 200 đoạn truyện mỗi tài khoản (Chương 1 và 2 cộng lại: 14 level, 20 đoạn truyện).
- `text-fields.ts` (`LEVEL_TEXT`, `CHAPTER_TEXT`): Chương 2 không thêm trường câu chữ nào.
- Câu chữ Chương 1, trừ một nhịp ở mục 9 (`0018`).
- Các loại mô phỏng cũ.

## 8. Chia nhánh, thứ tự làm, file sở hữu

```
main
 └─ feat/chuong-2                       (nhánh tích hợp; vào main khi đủ bảy màn)
     ├─ feat/engine-chuong-2            (H1–H6, làm trước, merge trước tiên)
     ├─ feat/canh-chuong-2              (S, song song từ đầu, chỉ file cảnh)
     ├─ feat/level-2-1 … feat/level-2-7 (sau H; song song với nhau, merge thứ tự nào cũng được)
     └─ tích hợp (I, sau cùng, trên feat/chuong-2)
```

### Hạ tầng `feat/engine-chuong-2` (tuần tự trong nhánh)

| # | Việc | File chính |
|---|---|---|
| H1 | Nhiều chương: glob file chương, `component_bar`, `map`, `getChapters`, test "mỗi level đúng một chương", server đọc mọi file chương, admin, fixture; `chapter-1.json` thêm hai trường; `chapter-2.json` (khung nhịp `prologue`/`teaser` theo `design/gdd-chuong-2.md` mục 3 và 8) và tài liệu câu chữ `chapter:2` → `0010` | `src/story/chapter.ts`, `story-types.ts` (chỉ `ChapterDefinition`), `validate-chapter.ts`, `src/story/chapter-1.json`, `src/story/chapter-2.json`, `server/content/bundled-content.ts`, `content-migration-cli.ts`, `src/ui/admin/admin-editor.tsx`, `admin-list.tsx`, `tests/content-fixture.ts`, `db/migrations/0010_content_chapter_2.sql` |
| H2 | Tiến trình nhiều chương: `GameContext`, id đoạn truyện, `rawStoryEnd`, `titleContinue`, `guardRoute`, `componentSlot`, `chapterTotals`, `seenStories` theo chương; thẻ thành phần; `fragment_found` sáng n mảnh; màn kết đoạn hết chương | `src/story/progression.ts`, `build-story.ts`, `src/app.tsx`, `src/ui/story-screen.tsx`, `src/ui/story-labels.ts`, `src/ui/city-matrix.tsx`, `src/ui/cutscene-player.tsx` |
| H3 | Bản đồ nhiều chương, `#/map/<n>`, nút "BẢN ĐỒ" | `src/shell/route.ts`, `src/ui/chapter-map.tsx`, `src/ui/title-screen.tsx`, `src/shell/use-progress-snapshot.ts` |
| H4 | `wrong_branch` (bỏ qua biến `bool`); bốn luật kiểm của mục 5.2 (ba luật cho `chapter >= 2`, số mẫu mới cho mọi level) | `src/game/level-types.ts`, `classify-run.ts`, `echo-leaks.ts`, `validate-level.ts`, `src/game/echo-line-check.ts` |
| H5 | `skipped_lines`: harness, phân loại, editor, terminal | `src/engine/python/harness.py`, `tests/python/test_harness.py`, `src/engine/harness-types.ts`, `classify-run.ts`, `src/ui/code-editor.tsx`, `src/game/terminal-lines.ts` |
| H6 | Mô phỏng `patrol` (mục 2) | `src/ui/patrol-timeline.ts`(+test), `src/ui/patrol-simulation.tsx`, `level-types.ts`, `level-simulation.tsx`, `sim-vocabulary.ts`, `validate-level.ts`, `src/styles/global.css` |

Test hạ tầng dùng level và chương giả trong `tests/fixtures/` (một chương 2 giả có hai level; một level `patrol` có ba test cơ bản và `stdin`, có `""` và `" "` trong dữ liệu, kèm một bản `inputs: []`, `locked_lines: []`; một level `patrol` trộn `decision.var` với một mục tiêu `output_line`), không dùng level 2.x thật. Sau H, sửa các e2e có sẵn đang vỡ vì chữ đổi (`story-flow.spec.ts` dòng "BẢN ĐỒ VÙNG TỐI", `level-1-7.spec.ts` màn kết `teaser`); chỉ viết, chạy khi người dùng yêu cầu.

### Cảnh `feat/canh-chuong-2` (song song)

| # | Việc | File |
|---|---|---|
| S | Sáu phông mới theo `design/quyet-dinh/canh-cutscene.md` (khung 160×90, ma trận chấm, ba màu theo vai): `duong-ong`, `hang-rao-ngoai`, `bai-container`, `thap-den-pha`, `nga-tu-tuan-tra`, `tram-sac`; `focus`/`trace` của từng cảnh | `src/story/story-types.ts` (chỉ `BACKDROPS`), `src/ui/scene-art.tsx`, `src/story/scene-catalog.ts`, CSS cảnh trong `global.css` |

Nhánh này không sửa JSON level hay chương. Trước khi S vào nhánh tích hợp, mọi JSON Chương 2 dùng phông có sẵn (`tram-sentinel`, `thanh-pho`, `vung-toi`, `terminal`). Phase I đổi `scene`/`backdrop` sang phông mới (câu đố, không cần migration).

### Theo màn `feat/level-2-x` (song song, sau H)

Mỗi nhánh chỉ sửa file của mình, **không chạm file dùng chung nào**:

| Nhánh | File |
|---|---|
| 2.x | `src/levels/level-2-x.json`, `db/migrations/00yy_content_level_2_x.sql` (số ở mục 9), `tests/fixtures/solutions/2.x/*.py`, `tests/integration/level-2-x.test.ts`, `tests/e2e/level-2-x.spec.ts`, tài liệu câu chữ trong `plans/` (không theo dõi) |

- JSON câu đố và migration câu chữ **vào cùng một commit** (`content-migration.test.ts` đòi mọi level trong bundle có dòng D1).
- `npm run content:migration` lấy số lớn nhất + 1; người làm đổi tên file thành số được cấp trước khi commit.
- Màn nào cần đổi file dùng chung (một khóa phản ứng mới, một tùy chọn `patrol` mới) thì dừng và báo phase I, không tự sửa trong nhánh màn.

### Tích hợp (I, trên `feat/chuong-2`)

1. Merge H, rồi S và các nhánh màn (thứ tự nào cũng được; SQL câu chữ là `ON CONFLICT DO NOTHING`, D1 áp theo tên).
2. Đổi `scene`/`backdrop` trong `level-2-*.json` và `chapter-2.json` sang phông mới của S.
3. Migration vá `0018` (mục 9).
4. e2e: sửa `story-flow.spec.ts` cho luồng hết chương 1 → `prologue-2` → 2.1; thêm `tests/e2e/chapter-2-flow.spec.ts` (người chơi cũ đã xem `teaser`: TIẾP TỤC ở màn tiêu đề mở `prologue-2`; 2.7 → `after-2.7` → `teaser-2` → Bản đồ chương 2). Chỉ phase I sửa hai file này. Viết, chạy khi người dùng yêu cầu.
5. Cập nhật `CLAUDE.md` (đa chương, `patrol`, `wrong_branch`, `skipped_lines`), `design/gdd.md` mục 9.
6. Review mã cả nhánh trước khi vào `main`.

## 9. Số migration cấp sẵn

| Số | Tài liệu | Nhánh |
|---|---|---|
| `0010_content_chapter_2.sql` | `chapter:2` (câu nhịp `prologue`, `teaser`) | H1 |
| `0011_content_level_2_1.sql` | `level:2.1` | 2.1 |
| `0012_content_level_2_2.sql` | `level:2.2` | 2.2 |
| `0013_content_level_2_3.sql` | `level:2.3` | 2.3 |
| `0014_content_level_2_4.sql` | `level:2.4` | 2.4 |
| `0015_content_level_2_5.sql` | `level:2.5` | 2.5 |
| `0016_content_level_2_6.sql` | `level:2.6` | 2.6 |
| `0017_content_level_2_7.sql` | `level:2.7` | 2.7 |
| `0018_content_chapter_1_mo_chuong_2.sql` | Vá `chapter:1`: chỉ `$.teaser[8].text` (bỏ "Tín hiệu đang giải mã", dẫn sang Chương 2), tăng `revision`, thêm dòng lịch sử theo mẫu `docs/huong-dan-deploy.md` mục 9 | I |

Việc bất ngờ cần migration lấy số trống đầu tiên sau `0018` lúc merge vào nhánh tích hợp.

## 10. Phát hành

- Chỉ deploy khi H, S, bảy màn và I đã vào `feat/chuong-2` và review xong. Lý do: `teaser-2` và `prologue-2` nói về cả chương; `0018` đổi câu cuối Chương 1 thành lời dẫn sang Chương 2.
- Trên D1 thật: áp `0010`–`0018` **trước**, rồi deploy code ngay. Code cũ gặp dòng `chapter:2`, `level:2.x` thì bỏ qua (không có file câu đố tương ứng); `0018` chỉ đổi chữ một nhịp, khung 9 nhịp giữ nguyên nên code cũ vẫn đọc được.
- Không cần migration sửa `story_seen` (mục 1.4).

## 11. Tiêu chí chấp nhận của hạ tầng

1. Chương 1 chơi y như trước: mọi test 1.1–1.7 giữ kết quả; thẻ thành phần, bản đồ, đoạn truyện Chương 1 ra cùng chữ (trừ nút "BẢN ĐỒ" và màn kết `teaser` có thêm TIẾP TỤC khi Chương 2 đã dựng).
2. Chương giả trong fixture: 2.1 mở khi 1.7 có sao; `after-<level cuối chương 1>` → `teaser` → `prologue-2` → level đầu chương 2; `after-<level cuối chương 2>` → `teaser-2` → Bản đồ.
3. Snapshot người chơi cũ (sao 1.1–1.7, đã xem `prologue`, mọi `after-1.x`, `teaser`): `titleContinue` ra `prologue-2`; `guardRoute` chặn `teaser-2` và `after-2.x` khi chưa có sao tương ứng.
4. Chương 2 thiếu dòng D1: Chương 1 vẫn chơi được, bản đồ hiện Chương 2 "TÍN HIỆU HỎNG", route `#/level/2.1` về bản đồ.
5. `wrong_branch` chỉ trả khi level có câu cho nó; có test cho dòng in, biến, lượt phản công (không có `round`), và biến `bool` sai không bao giờ ra khóa này.
6. Các luật kiểm mới bắt câu ECHO chứa số của dòng mong đợi, `{round}` ở level một test và `{round}` ở các khóa của mục 5.2 luật 3, chỉ khi `chapter >= 2`; số mẫu mới (luật 4) không làm câu nào của Chương 1 đổi kết quả kiểm.
7. `skipped_lines` đúng cho `if`, `elif`, `else`, lồng nhau; không có ở lượt lỗi và ở mã thẳng.
8. `patrol-timeline.test.ts` phủ: mọi tình huống qua, sai ở tình huống 2, lỗi ở tình huống 1, phản công qua/trượt/timeout/bị hủy, có và không có `decision`, giảm chuyển động; chip quyết định đúng mà mục tiêu khác sai (tình huống vẫn "BỊ PHÁT HIỆN"); biến quyết định không có giá trị (chip trống, Kai đứng yên); dòng `stdin` `""` và `" "` hiện khác nhau và không bị ẩn; level `inputs: []`, `locked_lines: []`.
9. `npm run typecheck`, `npm test`, `npm run test:py`, `npm run build` qua; e2e được sửa và viết, chạy khi người dùng yêu cầu.

## 12. Điểm tự chốt (người dùng có thể đổi)

1. **Một chuỗi mở khóa xuyên chương**, 2.1 mở khi 1.7 có ≥ 1 sao. Không đòi tổng sao tối thiểu để mở chương (GDD mục 4 "đủ sao mới mở chương" để sau).
2. **Id đoạn truyện mới `prologue-2`, `teaser-2`**; chương 1 giữ `prologue`, `teaser`.
3. **`component_bar` và `map` là tên ngắn trong file câu đố**, theo tiền lệ `title`; không vào D1.
4. **Một mô phỏng `patrol` cho cả bảy màn**, làm trong hạ tầng. Đổi lại, các màn giống nhau hơn Chương 1 về hình; mỗi màn khác nhau ở dữ liệu tình huống và cảnh truyện.
5. **Thêm `wrong_branch` và `skipped_lines`**; không thêm khóa cho `=`/`==` và thiếu `:`.
6. **Ba luật kiểm câu chữ mới chỉ áp cho `chapter >= 2`;** số mẫu mới của kiểm câu chữ áp cho mọi level.
7. **Vá câu cuối Chương 1 bằng `0018`** thay vì để admin sửa tay.
8. **Phát hành cả chương một lần.**

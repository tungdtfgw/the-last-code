# Cook report: vỏ game, mở đầu và chuyển cảnh Chương 1

Plan: `plans/261025-0928-mo-dau-va-chuyen-canh/plan.md` (phase 1 → 6, chạy tự động `--auto`).
Ngày: 25/10/2026.

## Đã làm

- **Phase 1 – dữ liệu.** `CUES` thành hằng lúc chạy; thêm hai recipe `pulse`, `glitch` (`pulse` gộp trong 800 ms). `src/story/chapter-1.json` chép 23 nhịp mở đầu (GDD mục 3) và 9 nhịp Còn tiếp (5.6), có `backdrop`, `cue`, `fx`, `hold_ms` theo bảng. `validate-beats.ts`, `validate-chapter.ts`, `chapter.ts`; `echo-leaks.ts` (kiểm từ cấm và đáp án, dùng chung cho phản ứng ECHO và nhịp ECHO). Level JSON có thêm `location`, `component`, `outro_beats` (được kiểm); 1.4 có `entry` mới và 4 nhịp `outro_beats` theo 6.4. Registry có `invalidIds`.
- **Phase 2 – tiến độ.** `getStory()`/`markStorySeen()` trong cả hai repository; trường `story` tùy chọn trong `progress:v1`, gộp bằng hợp tập, hỏng thì rỗng. `src/story/progression.ts` chứa mọi luật: trạng thái nút, mở khóa theo "level đã dựng", `storyEnd`/`forward`, `continueAfterLevel`, `titleContinue`, `guardRoute`, `chapterTotals`, `seenStories`. `build-story.ts` ghép `after-<id>`.
- **Phase 3 – trình chạy đoạn truyện.** `cutscene-reducer.ts` (thuần) và `cutscene-player.tsx`: gõ chữ với `teletype`/`echo_voice`, tự chuyển sau 1,2 s + 30 ms/ký tự + `hold_ms`, dừng khi tab ẩn, bỏ phím giữ, Esc/BỎ QUA, thẻ `card` xóa nhịp trước, `aria-live`, bản chép khi giảm chuyển động. `city-matrix.tsx` (ma trận chấm tất định, Vùng Tối ở góc trên), `story-backdrop.tsx` (ba nền và các `fx`), `neural-id-bar.tsx`, `story-gate.tsx`.
- **Phase 4 – hai màn.** `title-screen.tsx`, `chapter-map.tsx` (SVG đường mòn và nút định vị bằng CSS trên desktop, danh sách dọc dưới 768 px), `story-labels.ts`.
- **Phase 5 – nối vỏ game.** `src/shell/` (`route.ts`, `use-hash-route.ts`, `use-progress-snapshot.ts`); `app.tsx` thành `Shell` giữ audio, repository, route, snapshot, phím `M`. `story-screen.tsx`, `level-simulation.tsx`. `GameScreen` nhận `audio`, có nút BẢN ĐỒ, tiêu đề ô mô phỏng lấy từ `location`. `IntroGate` chặn 400 ms sau đoạn truyện và phím giữ, có `data-armed`. Hộp kết quả có TIẾP TỤC, "Đã thu: …", bỏ outro/lore. `useAudio` có `gestured`. E2E: `LEVEL_URL`, `gotoLevel`, `enterMission` chờ `data-armed`; spec mới `story-flow.spec.ts`.
- **Phase 6 – tài liệu.** `CLAUDE.md` (Project, nguồn, E2E notes, mục Shell and routing, Story, Levels, Storage, UI/audio), `README.md` (luồng chơi, URL, cấu trúc), thêm 3 dòng vào `docs/nhat-ky-loi-prototype-1-4.md`.

Hướng thiết kế (bước 0 của phase 3, skill `ak:frontend-design`, tuyến "giữ hệ thống có sẵn"): giữ nguyên `tokens.css`; thêm ba token `--voice-log`, `--voice-kai`, `--city-dot`; thêm font JetBrains Mono 400 nghiêng cho lời Kai. Kiểm hình bằng ảnh chụp Playwright (không gửi sự kiện chuột) ở 1280 px và 375 px; sau vòng đầu đã sửa: lớp tối sau chữ trên nền chấm, khung laptop đè chữ, thẻ chưa căn giữa, Vùng Tối bị cắt khỏi khung trên điện thoại, bản chép cuộn xuống cuối.

## Lệch so với plan (và lý do)

1. **`CutscenePlayer` nhận `collected: number[]` (các ô đã có) thay vì một số đếm.** Ô của thành phần theo vị trí level trong chương (1.4 là ô 4), không theo số lượng; một số đếm không vẽ đúng ô được.
2. **`buildStory(id, ctx)` không nhận `snap`**: hàm không cần tiến độ.
3. **`ChapterContext` có thêm `chapter`** để lấy `neural_id_slots` và nhịp chương.
4. **Prop `controls` cho trình chạy (nút tắt tiếng)**: GDD mục 7 yêu cầu Tab tới được nút tắt tiếng trong đoạn truyện. Tách `MuteButton` dùng chung cho thanh chạy, màn tiêu đề, bản đồ, đoạn truyện.
5. **`LoreText` tách file riêng** vì khung lore và Nhật ký trên bản đồ cùng tô nhãn KTS.
6. **Giảm chuyển động không phát `pulse` khi mở** (câu hỏi mở 6 nói phát một lần): test của plan yêu cầu không có cue nhịp; cú bấm ở màn tiêu đề đã phát `pulse`.
7. **Nhịp 21 mở đầu hiện thanh Neural-ID rỗng** (`collected = []` cho prologue), kể cả khi xem lại.
8. **Teaser không có nền ghi trong GDD 5.6**: đặt `vung-toi` ở nhịp 1.
9. **Nút TIẾP TỤC của hộp kết quả luôn hiện**, vì hộp chỉ mở khi có ≥ 1 sao (`game-reducer.ts`).
10. **Snapshot tiến độ đọc lại theo route; Shell không render khi snapshot chưa đọc cho route hiện tại**, để `guardRoute` không dùng dữ liệu cũ.
11. **Ngoài plan, sửa `useTypewriter`** (lỗi thật, tìm ra khi chạy e2e): chế độ "full"/"hidden" tính trong render; tiến độ gõ gắn với (chữ, key). Đã ghi vào nhật ký lỗi.
12. **Sửa sau review (agent `code-reviewer`)**:
    - hash có mã thoát hỏng (`#/story/%E0`) làm sập app → nay về màn tiêu đề;
    - nhịp đầu không được đọc qua `aria-live` → nay điền sau khi mount;
    - chặn 400 ms có thể dùng giá trị cũ → nay reset khi rời level;
    - `markStorySeen` có thể mất một id khi gọi chồng nhau → nay gộp đồng bộ;
    - không điều hướng nếu người chơi đã rời đoạn truyện;
    - đọc tiến độ lỗi → coi như người chơi mới thay vì màn trắng;
    - `validate-level` kiểm id theo đúng dạng route mở được.
13. **Bước journal tự động của cook bị bỏ qua**: báo cáo này thay cho nhật ký phiên.

## Test (số thật)

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | sạch |
| `npm test` | 24 file, 226 test qua (trước thay đổi: 19 file) |
| `npm run test:py` | 59 test, OK |
| `npm run build` | qua (cảnh báo chunk > 500 kB đã có từ trước) |
| `npm run test:e2e` lần 1 (trước sửa review) | 101 qua, 1 bỏ qua, 0 lỗi, 9,2 phút |
| e2e sau các sửa từ review | **đã viết, chưa chạy (người dùng chạy khi yêu cầu)**. Lần chạy đầy đủ thứ hai bị dừng giữa chừng theo yêu cầu người dùng. Trước khi dừng, các spec liên quan đã qua với code cuối: `story-flow` + `intro` + `level-1-4` trên chromium (23 qua), `story-flow` trên firefox và mobile-chromium (6 qua). |

Test bị bỏ qua là `mobile-chromium › edge-cases.spec.ts:196` "keyboard only", vốn đã bỏ qua trên điện thoại từ trước.

Test mới (chỉ các test plan liệt kê, cộng hai kiểm hồi quy cho lỗi review):
- `validate-chapter.test.ts`, `progression.test.ts`, `build-story.test.ts`, `cutscene-reducer.test.ts`, `cutscene-player.test.tsx`;
- thêm ca trong `validate-level.test.ts`, `progress-store.test.ts`, `echo-forbidden-terms.test.ts`;
- e2e `story-flow.spec.ts` (3 test, chạy trên chromium, firefox, mobile-chromium).

Sửa test cũ:
- mọi `goto("/")` thành `goto(LEVEL_URL)`;
- kiểm hộp kết quả 6.7 đổi `KTS-03` thành "Đã thu: Dữ liệu sinh trắc" và nút TIẾP TỤC;
- `audio.spec.ts` thêm `pulse`, `glitch`;
- test `entry` của ECHO đổi chữ;
- test cuộn ô gọi thêm `reload()`, vì `goto` cùng URL hash không tải lại trang.

Ngoài ra, `safari-smoke.mjs` trỏ tới `#/level/1.4`.

## Còn mở

- **Mở thẳng đoạn truyện bằng bàn phím:** nhấn Enter ở màn chờ "TIẾP TỤC ĐOẠN TRUYỆN" có thể làm mất cue của nhịp đầu (ví dụ `pulse` của mở đầu), vì `AudioContext` chưa chạy kịp. Bấm chuột thì không bị (âm thanh mở từ lúc nhấn xuống). Mức thấp, chưa sửa.
- **Mỗi lần vào level, worker Pyodide được dựng lại** (lấy từ cache). Plan đã chấp nhận; nếu thấy chậm thì chuyển `PyRunner` lên `Shell`.
- **Esc nhấn trong khoảng một nhịp ngay sau khi URL đổi sang `#/story/…` bị bỏ qua**, vì Shell đang đọc tiến độ. Không ảnh hưởng người chơi thật; e2e chờ nút BỎ QUA.
- **Thanh Neural-ID trên bản đồ ở 375 px chật**: tên thành phần bị cắt, ô cuộn được.
- Câu hỏi mở 1–5 trong `plan.md` giữ nguyên quyết định đã tự chốt.
- **Bộ e2e đầy đủ chưa chạy lại sau các sửa từ review** (theo yêu cầu người dùng: e2e chỉ chạy khi được yêu cầu). Lệnh: `npm run test:e2e`.
- **Chưa kiểm:** Safari thật, iOS, và kiểm tay giảm chuyển động bằng DevTools (đã kiểm bằng `reducedMotion` của Playwright).

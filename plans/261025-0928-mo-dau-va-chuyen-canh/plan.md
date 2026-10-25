---
title: "Vỏ game: màn tiêu đề, mở đầu, chuyển cảnh, Bản đồ Vùng Tối"
description: "Thêm định tuyến hash, màn tiêu đề, trình chạy đoạn truyện dùng chung, đoạn mở đầu, chuyển cảnh giữa level, đoạn Còn tiếp và Bản đồ Vùng Tối quanh Level 1.4 đã có."
status: completed
priority: P1
effort: 22h
branch: ""
tags: [feature, frontend]
blockedBy: []
blocks: []
created: 2026-10-25
---

# Vỏ game: mở đầu và chuyển cảnh Chương 1

## Overview

Bọc Level 1.4 hiện có trong một vỏ game: `#/` màn tiêu đề → `#/story/prologue` (23 nhịp) → `#/level/<id>` → hộp kết quả **TIẾP TỤC** → `#/story/after-<id>` (đoạn kết → nhật ký KTS → thẻ thành phần → `outro_beats`) → level đã dựng kế tiếp hoặc `#/story/teaser` → `#/map`. Đoạn truyện là dữ liệu; level mới chỉ cần file JSON và tự hiện trên bản đồ, trong luồng.

Nguồn quyết định (đã chấp nhận, không mở lại):
- Thiết kế: [`design/gdd-mo-dau.md`](../../design/gdd-mo-dau.md) (mục 2–7). Kịch bản mở đầu ở mục 3, Còn tiếp ở 5.6, nhịp của 1.4 ở 6.4.
- Contract: [`plans/reports/brainstorm-261025-0928-mo-dau-va-cot-truyen-chuong-1.md`](../reports/brainstorm-261025-0928-mo-dau-va-cot-truyen-chuong-1.md).
- GDD chung: [`design/gdd.md`](../../design/gdd.md) mục 4.4 (mở đầu level), 4.6 (âm thanh), 4.7 (bố cục).
- Lỗi cũ phải tránh: [`docs/nhat-ky-loi-prototype-1-4.md`](../../docs/nhat-ky-loi-prototype-1-4.md) mục 3–5 (mở khóa âm thanh bằng thao tác đầu, hẹn cue trên đồng hồ AudioContext, bỏ qua hiệu ứng, ảnh chụp Claude-in-Chrome làm bỏ qua hiệu ứng).
- Định dạng plan trước: [`plans/261024-2332-level-1-4-prototype/plan.md`](../261024-2332-level-1-4-prototype/plan.md).

## Quyết định kỹ thuật chính

- **Định tuyến hash tự viết, không thêm thư viện.** `parseRoute(hash)` thuần + hook `useHashRoute()` nghe `hashchange`. Thao tác của người chơi dùng `push` (gán `location.hash`); chuyển hướng và kết thúc đoạn truyện dùng `replace` (`history.replaceState` + tự cập nhật state, vì `replaceState` không phát `hashchange`). Nhờ vậy nút Back không quay lại một đoạn truyện vừa xem.
- **Mọi luật tiến trình nằm trong một module thuần `src/story/progression.ts`**: trạng thái nút bản đồ, mở khóa, đích của TIẾP TỤC (màn tiêu đề và hộp kết quả), đích khi đoạn truyện kết thúc, chặn route không hợp lệ. Đầu vào là `ChapterContext` (thứ tự level, tập level đã dựng, tập level hỏng) và `ProgressSnapshot` (`bestStars` từng level, tập đoạn đã xem). Đây là nơi duy nhất có test cho các luật này.
- **Luật "level đã dựng" (bổ sung cho GDD, vì hiện chỉ có 1.4):** mọi luật đi theo thứ tự `chapter.levels` nhưng **bỏ qua level chưa dựng hoặc hỏng**. Level đã dựng đầu tiên luôn mở; level đã dựng thứ n mở khi level đã dựng liền trước có `bestStars ≥ 1`. Mở đầu dẫn vào **level đã dựng đầu tiên** (hôm nay là 1.4; khi có `level-1-1.json` thì tự là 1.1). `after-<id>` dẫn vào level đã dựng kế tiếp; nếu không còn thì sang `teaser`. Thêm file JSON là đủ, không sửa code.
- **Dữ liệu truyện chia đôi như contract:** level JSON có thêm `location`, `component`, `outro_beats` (tùy chọn); `src/story/chapter-1.json` giữ `levels`, `neural_id_slots`, `prologue`, `teaser`. Đoạn `after-<id>` được ghép lúc chạy bằng `buildStory()` từ `outro` + `lore_fragment` + `component` + `outro_beats`. Nhịp JSON có thêm hai trường tùy chọn nhỏ `fx` (hiệu ứng nền: nháy thành phố, tám chấm đỏ, thanh cảnh báo, thanh 6 ô) và `hold_ms` (giữ lâu, im lặng 2 giây), vì kịch bản mục 3 và 5.6 cần chúng.
- **`useAudio` lên `App`**, truyền `audio` xuống `GameScreen`. Một `AudioEngine` sống suốt phiên, không tạo `AudioContext` trước thao tác đầu. Hook trả thêm `gestured` (đã có thao tác đầu chưa); màn chờ "TIẾP TỤC ĐOẠN TRUYỆN" hiện khi `!gestured`. Phím `M` chuyển lên `App`, dùng cho mọi màn.
- **Cue của nhịp phát ngay khi nhịp bắt đầu** (`play(cue)` không trễ). Nhịp chờ dùng timer JS chỉ để chuyển nhịp, không bao giờ để hẹn âm thanh. `pulse` có cửa sổ gộp 800 ms để cú bấm BẮT ĐẦU và nhịp 1 của mở đầu không kêu hai lần.
- **Trạng thái "đã xem"** là trường tùy chọn `story: { seen: string[] }` trong khóa `the-last-code:progress:v1`; không tăng `SCHEMA_VERSION`. Gộp bằng hợp tập. Ghi khi đoạn chạy hết hoặc bị bỏ qua, trước khi điều hướng.
- **Trình chạy đoạn truyện = reducer thuần + component.** `cutscene-reducer.ts` (chỉ số nhịp, đang gõ/đã hiện, kết thúc, cửa sổ nhịp hiển thị sau thẻ `card`, phông nền hiện tại) có test; `cutscene-player.tsx` lo phím, chuột, timer, typewriter (`useTypewriter` có sẵn), `aria-live`.
- **Level vẫn luôn qua màn "VÀO NHIỆM VỤ"**; khi đến từ đoạn truyện, nút bỏ qua cú bấm trong 400 ms đầu và mọi `keydown` có `repeat`. Nút có `data-armed` để e2e chờ đúng lúc.
- **Điểm mở rộng cho 1.1–1.3, không cài đặt:** ô mô phỏng bên phải đi qua một component `LevelSimulation` (hôm nay luôn trả về máy quét); tiêu đề ô lấy từ `location`. Chấm theo stdout của 1.1 không làm ở đây (xem phase 5, mục "Điểm mở rộng").

## Phases

| # | Phase | Effort | Phụ thuộc | Status |
|---|---|---|---|---|
| 1 | [Dữ liệu truyện, validator, hai cue mới](./phase-01-story-data-and-validation.md) | 3h | – | completed |
| 2 | [Lưu đoạn đã xem và luật tiến trình](./phase-02-story-storage-and-progression.md) | 3h | 1 | completed |
| 3 | [Trình chạy đoạn truyện và màn chờ](./phase-03-cutscene-player.md) | 5h | 1 | completed |
| 4 | [Màn tiêu đề và Bản đồ Vùng Tối](./phase-04-title-and-map-screens.md) | 5h | 2, 3 | completed |
| 5 | [Nối vỏ game: router, App, level, hộp kết quả, e2e](./phase-05-shell-wiring-and-e2e.md) | 5h | 2, 3, 4 | completed |
| 6 | [Tài liệu và chạy toàn bộ kiểm thử](./phase-06-docs-and-full-verification.md) | 1h | 5 | completed |

Chạy tuần tự 1 → 6, một implementer. Phase 3 và 4 chỉ dựng component (chưa gắn vào `App`), nên app vẫn chạy như cũ cho đến phase 5.

## Tiêu chí chấp nhận (ánh xạ về `design/gdd-mo-dau.md`)

| AC | Nội dung | GDD | Phase | Bằng chứng |
|---|---|---|---|---|
| 1 | Màn tiêu đề: BẮT ĐẦU (chưa xem mở đầu) hoặc TIẾP TỤC + BẢN ĐỒ VÙNG TỐI; nút chính có focus, Enter bấm; nút tắt tiếng + `M`; dòng lưu hoặc cờ CHẾ ĐỘ KHÔNG LƯU; im lặng đến cú bấm, rồi `pulse` | 2, 4.2 | 4, 5 | e2e `story-flow` (người chơi mới, tải lại) |
| 2 | Mở đầu đủ 23 nhịp đúng chữ, kiểu, nền, cue của mục 3; Còn tiếp đủ 9 nhịp của 5.6 | 3, 5.6 | 1 | `validate-chapter.test.ts` (số nhịp, kiểu, cue) + xem tay |
| 3 | Đoạn truyện: chuột/Space/Enter tiến đúng một bước, bỏ `repeat`; Esc hoặc BỎ QUA bỏ cả đoạn; tự chuyển sau 1,2 s + 30 ms/ký tự, dừng khi tab ẩn; `card` xóa nhịp trước; `aria-live="polite"`; chạm = tiến, BỎ QUA ≥ 44 px | 3, 4.1, 7 | 3 | `cutscene-reducer.test.ts`, `cutscene-player.test.tsx`, e2e |
| 4 | Giảm chuyển động: mọi nhịp hiện ngay thành bản chép tự cuộn, nút TIẾP TỤC có focus, không nhiễu, không nháy | 7 | 3 | `cutscene-reducer.test.ts`, `cutscene-player.test.tsx` |
| 5 | Mở thẳng `#/story/…`: màn chờ TIẾP TỤC ĐOẠN TRUYỆN, không có AudioContext trước cú bấm; đến từ nút trong game thì không có màn chờ | 5.3, 7 | 3, 5 | e2e deep link |
| 6 | Chuyển cảnh `after-<id>`: đoạn kết → nhật ký KTS (khung lore, `terminal_line`) → thẻ "NEURAL-ID GIẢ · THÀNH PHẦN n/6: …" với ô mới sáng (`objective_lock`) → `outro_beats` → level đã dựng kế tiếp hoặc Còn tiếp | 5.1 | 1, 2, 3 | `build-story.test.ts`, `progression.test.ts`, e2e |
| 7 | Hộp kết quả: thêm nút chính TIẾP TỤC, giữ "Tối ưu tiếp", dòng "Đã thu: <thành phần>", không còn `outro`/`lore_fragment` | 4.1, 5.1 | 5 | e2e `level-1-4.spec.ts` (sửa), `story-flow` |
| 8 | Định tuyến: `#/`, `#/map`, `#/story/<id>`, `#/level/<id>`; hash rỗng/lạ → tiêu đề; level chưa dựng hoặc hỏng, đoạn lạ, `after-<id>` khi `<id>` chưa có sao → bản đồ; level khóa vẫn vào được bằng liên kết | 5.3, 5.4, 7 | 2, 5 | `progression.test.ts` (`guardRoute`), e2e deep link |
| 9 | Mở khóa suy ra từ `bestStars` (bỏ qua level chưa dựng); TIẾP TỤC ở tiêu đề tới level đã dựng đầu tiên chưa có sao, chạy trước đoạn dẫn vào nó nếu chưa xem; mọi level có sao → đoạn còn thiếu rồi bản đồ; đoạn đã xem không tự chạy lại | 4.2, 5.4, 7 | 2 | `progression.test.ts` |
| 10 | `ProgressRepository.getStory()` / `markStorySeen(id)`; trường `story` trong `progress:v1`, không tăng schema; hợp tập, không bao giờ bớt; trường hỏng → rỗng, sao không đổi; kho bộ nhớ theo cùng luật | 5.4, 7 | 2 | `progress-store.test.ts` |
| 11 | Bản đồ: 7 nút theo thứ tự (đã qua/đang mở "TIẾP THEO"/khóa "Cần 1 sao ở …"/chưa dựng "TÍN HIỆU ĐANG GIẢI MÃ"/hỏng "TÍN HIỆU HỎNG"), thanh Neural-ID 6 ô, tổng sao, Nhật ký Kiến Trúc Sư, danh sách Đoạn truyện xem lại; điện thoại là danh sách dọc tự cuộn, trang không cuộn | 5.5, 7 | 4 | e2e `story-flow` + kiểm tay 375 px |
| 12 | Còn tiếp: kết thúc bằng VỀ BẢN ĐỒ (focus) và dòng "Chơi lại để lấy đủ 3 sao…" khi tổng sao chưa tối đa | 5.6 | 3, 4 | e2e `story-flow` |
| 13 | Nút BẢN ĐỒ trên thanh tiêu đề level | 4.2 | 5 | e2e `story-flow` |
| 14 | Một AudioContext suốt tiêu đề → mở đầu → level (audio ở `App`); recipe `pulse`, `glitch` render được | 2, 5.2 | 1, 5 | `sound-render.test.ts` (tự phủ recipe mới), e2e đếm AudioContext |
| 15 | Level JSON: `location`, `component`, `outro_beats` được kiểm (kiểu nhịp, cue thuộc `CUES`, nền, lời ECHO không chứa `int`/`float`/`round`/đáp án); 1.4 có `entry` mới, `location`, `component`, `outro_beats` theo 6.4; "Cổng phía Bắc" trong UI lấy từ `location` | 5.2, 6.4 | 1, 5 | `validate-level.test.ts`, `echo-forbidden-terms.test.ts` |
| 16 | Level mới chỉ cần JSON: có trong `chapter.levels` là tự vào bản đồ và luồng; level chương 1 nào không có trong `chapter.levels` làm test đỏ | 5.2 | 1, 2 | `validate-chapter.test.ts`, `progression.test.ts` |
| 17 | Màn "VÀO NHIỆM VỤ" sau đoạn truyện bỏ cú bấm trong 400 ms đầu và phím giữ | 4.1, 7 | 5 | e2e (qua `data-armed`) + xem tay |
| 18 | e2e cũ vẫn qua, chỉ đổi URL (`LEVEL_URL`) và một chỗ kiểm hộp kết quả; có helper `gotoLevel(page, id)` | 7 | 5 | `npm run test:e2e` |
| 19 | `CLAUDE.md` (Architecture) và `README.md` mô tả luồng mới | – | 6 | review tài liệu |

## Non-goals

- Dựng 1.1–1.3, 1.5–1.7, Boss; chấm theo stdout cho 1.1; mô phỏng mới cho từng level. Chỉ chừa điểm mở rộng.
- Tiếp tục giữa đoạn truyện sau khi tải lại (chạy lại từ đầu là đúng thiết kế).
- Hạ tiếng nền theo nhịp (nhịp 8 mục 3), chỉnh âm lượng từng cue (`gate_open` "âm lượng thấp" ở 5.6): phát cue như bình thường. Xem câu hỏi mở 3.
- Thư viện router, thư viện animation, file ảnh hoặc âm thanh.
- Sửa `design/*.md`.

## Rủi ro chính

- **Đổi `/` thành màn tiêu đề làm vỡ mọi e2e đang `goto("/")`.** Xử lý ở phase 5 bằng `LEVEL_URL` và thay một dòng mỗi chỗ; chạy spec liên quan trước bộ đầy đủ (~7 phút).
- **Âm thanh:** chuyển màn không được tạo lại engine; cue có trễ phải dùng `play(cue, delayMs)`. StrictMode chạy effect hai lần: cue cùng tên trong 30 ms được engine gộp, nên phát cue trong effect theo chỉ số nhịp là an toàn.
- **Kiểm hiệu ứng bằng ảnh chụp Claude-in-Chrome sẽ bỏ qua đoạn truyện** (sự kiện chuột). Kiểm bằng e2e và `__TLC_AUDIO_PROBE__`.
- **Mỗi lần vào level dựng lại worker Pyodide** (như hiện nay, lấy từ cache). Màn "VÀO NHIỆM VỤ" và hiệu ứng mở đầu che thời gian này; không chuyển `PyRunner` lên `App` trong plan này.

## Câu hỏi còn mở (đã tự chốt, không chặn)

1. **Người chơi cũ đã có sao ở 1.4 nhưng chưa có `prologue` trong `seen`** vẫn thấy BẮT ĐẦU (đúng chữ GDD mục 2). Có thể đổi thành "đã xem mở đầu hoặc có sao ở bất kỳ level nào" bằng một dòng trong `progression.ts`.
2. **Chữ trong Còn tiếp nói "Bốn thành phần"** và mở đầu nói "chuyển sang 1.1", trong khi hôm nay chỉ có 1.4: giữ đúng kịch bản; thanh 6 ô hiện số thành phần thật (1/6). Hết lệch khi 1.1–1.3 được dựng.
3. **Âm lượng thấp cho `gate_open` và hạ tiếng nền ở nhịp 8** bị bỏ vì `play()` chưa có tham số âm lượng. Nếu cần, thêm `gain` tùy chọn cho `play` sau.
4. **Tổng sao tối đa** tính bằng 3 × số level đã dựng (hôm nay 3, GDD lấy ví dụ 12 cho bốn level).
5. **Xem lại đoạn truyện từ Bản đồ** luôn quay về Bản đồ khi kết thúc (không dẫn tiếp vào level); thông tin "đang xem lại" giữ trong bộ nhớ `App`, tải lại giữa chừng thì theo luồng thường.
6. **Giảm chuyển động:** bản chép không phát cue của từng nhịp (phát cả loạt cùng lúc sẽ thành tạp âm); chỉ phát `pulse` một lần khi mở.

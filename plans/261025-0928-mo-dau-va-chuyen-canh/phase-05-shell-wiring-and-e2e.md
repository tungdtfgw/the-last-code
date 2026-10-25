---
phase: 5
title: "Nối vỏ game: router, App, level, hộp kết quả, e2e"
status: completed
priority: P1
effort: "5h"
dependencies: [2, 3, 4]
---

# Phase 5: Nối vỏ game: router, App, level, hộp kết quả, e2e

## Goal
`App` định tuyến bằng hash tới bốn màn; audio sống ở `App`; level có nút BẢN ĐỒ, `location`, màn "VÀO NHIỆM VỤ" chặn cú bấm dồn; hộp kết quả có TIẾP TỤC và "Đã thu"; e2e cũ qua với thay đổi tối thiểu và có spec mới cho luồng truyện.

## Context
- GDD mục 2, 4, 5.1, 5.3, 5.4, 7. Luật điều hướng ở `plan.md` (push cho thao tác người chơi, replace cho chuyển hướng và kết thúc đoạn).
- Hiện trạng: `src/app.tsx` vào thẳng `LEVEL_ID = "1.4"`; `GameScreen` tự gọi `useAudio(repository)` và xử lý phím `M`; `ResultsDialog` hiện `outro`/`lore_fragment` và chỉ có "Tối ưu tiếp"; tiêu đề ô mô phỏng viết cứng "Cổng phía Bắc".
- `useAudio` đã gắn listener thao tác đầu trên `window` (`pointerdown`, `keydown`, `click`, `touchend`) và chỉ tạo `AudioContext` trong `unlock()`.
- e2e: mọi spec gọi `page.goto("/")` (hoặc `a/b/c.goto("/")`) rồi `enterMission(page)`; `tests/safari/safari-smoke.mjs` mở `http://localhost:4173/`.

## Files
Tạo:
- `src/shell/route.ts`: `parseRoute(hash): Route` (`#/`, rỗng, lạ → title; `#/map`; `#/story/<id>`; `#/level/<id>`), `routeHash(route)`.
- `src/shell/use-hash-route.ts`: `{ route, navigate(route, { replace? }) }`; push = gán `location.hash`; replace = `history.replaceState(null, "", hash)` rồi tự `setRoute`; nghe `hashchange`.
- `src/shell/use-progress-snapshot.ts`: đọc `bestStars` của mọi id trong `chapter.levels` và `getStory()` thành `ProgressSnapshot`; trả `{ snapshot, refresh(): Promise<ProgressSnapshot> }`; tự `refresh` mỗi khi route đổi; trả `null` cho đến lần đọc đầu.
- `src/ui/story-screen.tsx`: nhận `storyId`, gọi `buildStory`, quyết định màn chờ (`!audio.gestured` → `StoryGate`), chạy `CutscenePlayer`; với `teaser` truyền `endPanel` (nút **VỀ BẢN ĐỒ** có focus; dòng "Chơi lại để lấy đủ 3 sao ở mỗi cổng trong lúc chờ." khi `stars < maxStars`). `onFinish` → `await repository.markStorySeen(id)` → `refresh()` → điều hướng `replace` tới `storyEnd` (hoặc về bản đồ nếu đang xem lại).
- `src/ui/level-simulation.tsx`: `LevelSimulation(props: SimulationProps)` hôm nay luôn render `ScannerSimulation`, kèm các nhãn kiểu (legend) của ô. Comment: "điểm chọn mô phỏng theo level; 1.1–1.3 thêm nhánh ở đây". `SimulationProps` là props hiện tại của `ScannerSimulation`.
- `tests/e2e/story-flow.spec.ts` (xem Tests).

Sửa:
- `src/audio/use-audio.ts`: thêm `gestured: boolean` vào `AudioControls` (state bật ở listener thao tác đầu, kể cả khi trình duyệt từ chối resume hoặc không có Web Audio). Không đổi luật tạo `AudioContext`.
- `src/app.tsx`: `App` → `ErrorBoundary` → `Shell`. `Shell` giữ `repository` (`useMemo`), `audio = useAudio(repository)`, `useHashRoute`, `useProgressSnapshot`, `ChapterContext` (từ `getChapter()` + `getDefaultRegistry()`), cờ `persistent` (+ `onPersistenceLost`), phím `M` toàn cục (chuyển từ `GameScreen`, giữ điều kiện `isTyping`), ref "route trước là đoạn truyện" và ref "đang xem lại từ bản đồ".
  - Chưa có snapshot cho route hiện tại → không render gì (đọc từ bộ nhớ, chỉ một nhịp).
  - Mọi route đi qua `guardRoute`; khác route gốc → `navigate(…, { replace: true })`.
  - `title` → `TitleScreen`; BẮT ĐẦU: `void audio.unlock().then(() => audio.play("pulse"))`, rồi push `#/story/prologue`. TIẾP TỤC: cùng cách mở khóa, rồi push `titleContinue`. BẢN ĐỒ: push `#/map`.
  - `map` → `ChapterMap`; chơi level: push `#/level/<id>`; xem lại: đặt cờ xem lại, push `#/story/<id>`.
  - `story` → `StoryScreen`.
  - `level` → `<GameScreen key={id} level audio repository entryGuardMs={cameFromStory ? 400 : 0} onMap onContinue />`. `onContinue`: `const snap = await refresh()` rồi push `continueAfterLevel(id, ctx, snap)`.
  - Chương hỏng (`getChapter()` lỗi) → `FatalScreen` "DỮ LIỆU CHƯƠNG HỎNG" như cách xử lý level hỏng hiện nay.
- `src/ui/game-screen.tsx`: nhận `audio` qua props (bỏ `useAudio`), bỏ xử lý `M` (giữ Ctrl/⌘+Enter); nút **BẢN ĐỒ** trên `topbar` gọi `onMap`; tiêu đề ô mô phỏng = `level.location ?? level.title`; dùng `LevelSimulation`; truyền `onContinue` và `entryGuardMs` xuống.
- `src/ui/intro-gate.tsx`: dòng trên cùng "Chương {chapter} · Vùng Tối" thêm ` · {location}` khi có; prop `guardMs`: bỏ `onClick` trong `guardMs` đầu (đặt `data-armed="true"` khi hết hạn, ngay lập tức nếu `guardMs = 0`); `onKeyDown` với `e.repeat` → `preventDefault()`.
- `src/ui/results-dialog.tsx`: bỏ khối `.results-lore`; thêm "Đã thu: <component>" khi `level.component` và `outcome.stars ≥ 1`; nút chính **TIẾP TỤC** (`autoFocus`, gọi `onContinue`) và giữ nút "Tối ưu tiếp" (gọi `onClose`). Esc vẫn đóng như cũ (focus về CHẠY).
- `src/styles/global.css`: nút BẢN ĐỒ trên topbar, hai nút trong hộp kết quả; bỏ kiểu `.results-lore` không còn dùng.
- `tests/e2e/helpers.ts`: `export const LEVEL_URL = "/#/level/1.4"`; `gotoLevel(page, id = "1.4", opts?)` = `page.goto(\`/#/level/${id}\`)` + `enterMission(page, opts)`; `enterMission` chờ `toHaveAttribute("data-armed", "true")` trước khi bấm.
- `tests/e2e/*.spec.ts`: thay mọi `.goto("/")` bằng `.goto(LEVEL_URL)` (một dòng mỗi chỗ, không đổi luồng test). `level-1-4.spec.ts` test 6.7: đổi `toContainText("KTS-03")` thành `toContainText("Đã thu: Dữ liệu sinh trắc")` và kiểm có nút TIẾP TỤC. `audio.spec.ts`: thêm `pulse`, `glitch` vào `CUES`.
- `tests/safari/safari-smoke.mjs`: `APP` trỏ tới `http://localhost:4173/#/level/1.4`.

## Steps
1. `use-audio.ts` (`gestured`), `route.ts`, `use-hash-route.ts`, `use-progress-snapshot.ts`.
2. `GameScreen`, `IntroGate`, `ResultsDialog`, `LevelSimulation`.
3. `app.tsx` (`Shell`), `story-screen.tsx`.
4. Sửa helper và các spec cũ; chạy `intro.spec.ts` và `level-1-4.spec.ts` trên chromium trước.
5. Viết `story-flow.spec.ts`; chạy nó trên chromium rồi mobile-chromium.
6. Kiểm tay trên `npm run dev` (xem `lsof -i :5173` trước; nếu người dùng đã chạy thì dùng lại): 1280 px và 375 px cho tiêu đề, mở đầu, bản đồ, Còn tiếp; giảm chuyển động (DevTools → Rendering). Không kết luận về hiệu ứng từ ảnh chụp Claude-in-Chrome.

## Tests
- `tests/e2e/story-flow.spec.ts` (ba test, mỗi test một context mới):
  1. **Người chơi mới:** `goto("/")` với `__TLC_AUDIO_PROBE__ = []` → thấy MÃ CUỐI CÙNG, BẮT ĐẦU có focus, probe rỗng (chưa có `context`). Bấm → URL `#/story/prologue`, không có nút TIẾP TỤC ĐOẠN TRUYỆN, probe có `context` và `pulse`. Esc → URL `#/level/1.4`, gate VÀO NHIỆM VỤ hiện → `enterMission`. Đếm sự kiện `context` trong probe = 1 (một AudioContext suốt luồng). Bấm BẢN ĐỒ → `#/map`, nút 1.4 có nhãn TIẾP THEO, nút 1.1 có "TÍN HIỆU ĐANG GIẢI MÃ". Về `#/` (tải lại) → thấy TIẾP TỤC và BẢN ĐỒ VÙNG TỐI.
  2. **Qua level → chuyển cảnh → Còn tiếp → bản đồ:** `gotoLevel(page)`, dán `SOLUTION_67`, chạy → hộp kết quả có "Đã thu: Dữ liệu sinh trắc", bấm TIẾP TỤC → `#/story/after-1.4` (không có màn chờ), thấy chữ `outro` của 1.4 → Esc → `#/story/teaser` → Esc → nút VỀ BẢN ĐỒ có focus → Enter → `#/map`: nút 1.4 có 3 sao, Nhật ký có "KTS-03", Đoạn truyện có "Sau 1.4" và "Còn tiếp". Về `#/` → TIẾP TỤC → `#/map` (đã xem hết).
  3. **Liên kết thẳng:** `#/story/prologue` khi mới mở → nút TIẾP TỤC ĐOẠN TRUYỆN, probe rỗng; bấm → đoạn chạy, probe có `context`. `#/level/1.5` → `#/map`. `#/story/after-1.4` khi 1.4 chưa có sao → `#/map`. `#/level/1.4` + `enterMission` vẫn chơi được (đã được các spec cũ phủ, ở đây chỉ kiểm gate hiện).
- Không thêm unit test cho `parseRoute`/hook: luật chặn route đã có test ở `progression.test.ts`; phần còn lại được e2e phủ.

## Validation
```bash
npm run typecheck && npm test
npx playwright test tests/e2e/story-flow.spec.ts tests/e2e/intro.spec.ts --project=chromium
npx playwright test tests/e2e/level-1-4.spec.ts tests/e2e/audio.spec.ts --project=chromium
npx playwright test tests/e2e/story-flow.spec.ts --project=mobile-chromium
```
(Bộ e2e đầy đủ chạy ở phase 6. Cổng 4173 phải trống vì `webServer` tự chạy preview.)

## Extension points cho 1.1–1.3 (không làm ở đây)
- **Mô phỏng theo level:** thêm nhánh trong `src/ui/level-simulation.tsx` (ví dụ một trường `simulation` trong level JSON + validator), giữ `SimulationProps`.
- **Chấm theo stdout (1.1):** cần loại mục tiêu mới trong `Objective` (`level-types.ts`), validator, `harness.py` (so stdout), `classify-run.ts`, `objectives-panel.tsx`. Vỏ game không phụ thuộc vào những chỗ này.
- **Chữ đặc thù 1.4 còn trong `game-screen.tsx`:** tên tệp `neural_id.py` và ghi chú "dòng khóa = dữ liệu chip" ở ô editor. Level không có dòng khóa sẽ cần chúng thành dữ liệu; để người làm 1.1 quyết định.
- **Level mới:** thêm `src/levels/level-1-x.json` có `chapter: 1`, `location`, `component`, `outro_beats`; id đã có trong `chapter.levels` nên tự vào bản đồ và luồng; mở đầu tự dẫn vào level đã dựng đầu tiên.

## Risks
- **Thứ tự khởi động âm thanh:** `play("pulse")` trước khi `unlock()` xong sẽ bị bỏ; vì vậy phát trong `.then`. Không chờ unlock để điều hướng (nhật ký lỗi mục 3: hiệu ứng phải bắt đầu ngay).
- **Hộp kết quả có `autoFocus` mới ở TIẾP TỤC:** test bàn phím E7 nhấn Esc để đóng, không phụ thuộc nút nào có focus; vẫn phải chạy lại.
- **`replaceState` không phát `hashchange`:** hook phải tự cập nhật state, nếu không màn không đổi.
- **Điều hướng khi `GameScreen` đang chạy code:** unmount đã dọn worker và lưu bản nháp (`flushDraft` trong cleanup của `use-game.ts`); không cần xử lý thêm.

## Rollback
Hoàn tác `app.tsx`, `game-screen.tsx`, `intro-gate.tsx`, `results-dialog.tsx`, `use-audio.ts`, helper và spec; xóa `src/shell/`, `story-screen.tsx`, `level-simulation.tsx`, `story-flow.spec.ts`. Phase 1–4 độc lập với `App` nên giữ được.

---
phase: 3
title: "Trình chạy đoạn truyện và màn chờ"
status: completed
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 3: Trình chạy đoạn truyện và màn chờ

## Goal
Một component chạy mọi đoạn truyện (mở đầu, `after-<id>`, Còn tiếp) từ mảng `PlayBeat[]`: gõ chữ, tự chuyển nhịp, tiến/bỏ qua bằng chuột, chạm và phím, ba phông nền SVG/CSS, giảm chuyển động, `aria-live`; cùng màn chờ "TIẾP TỤC ĐOẠN TRUYỆN". Chưa gắn vào `App`.

## Context
- GDD mục 3 (bốn kiểu nhịp, ba nền, nhịp tự chuyển sau 1,2 s + 30 ms/ký tự, dừng khi tab ẩn), 5.1 (khung lore, thẻ thành phần), 5.3 (màn chờ), 7 (giảm chuyển động, điện thoại, bấm dồn, bàn phím, tắt tiếng).
- Dùng lại: `src/ui/use-typewriter.ts`, `src/ui/use-reduced-motion.ts`, chân dung `Face` trong `src/ui/echo-panel.tsx`, token màu trong `src/styles/tokens.css`, kiểu `.intro-gate` trong `global.css`.
- Nhật ký lỗi mục 3–5: bắt đầu hiệu ứng ngay, không chờ unlock xong; cue có trễ chỉ qua `play(cue, delayMs)`; không kiểm hiệu ứng bằng ảnh chụp giữa chừng.
- **Bước 0 bắt buộc:** gọi skill `ak:frontend-design` với brief: cùng hướng nghệ thuật của `tokens.css` (terminal xâm nhập 2089, tối, nghiêm túc, không emoji); log mono xanh nhạt, Kai nghiêng trắng ấm, ECHO có nhiễu ký tự và ô chân dung nhỏ, thẻ chữ lớn giữa màn; nền ma trận chấm thành phố có khu tắt ở góc trên. Kết quả ghi vào `global.css` (mục mới `/* ---------- Story ---------- */`) và token mới nếu cần.

## Files
Tạo:
- `src/story/cutscene-reducer.ts` (thuần):
  - State `{ index; phase: "typing" | "shown"; ended: boolean; transcript: boolean }`. `init(beats, reduced)`: giảm chuyển động → `transcript: true`, `index = last`, `phase: "shown"`.
  - Action `advance`: đang gõ → `shown`; đã hiện → nhịp sau (`card` và `lore` vào thẳng `shown` nếu không gõ chữ) hoặc `ended` ở nhịp cuối. `typed` → `shown`. `auto` = `advance` chỉ khi `shown`. `skip` → `ended`. Trong `transcript` chỉ `finish`/`skip` có tác dụng.
  - `visibleBeats(beats, index)`: nhịp hiện tại là `card` → chỉ thẻ đó; ngược lại các nhịp từ sau thẻ `card` gần nhất tới `index` (thẻ xóa các nhịp trước).
  - `backdropAt(beats, index)`: nền khai báo gần nhất ≤ `index`, mặc định `thanh-pho`.
  - `autoDelayMs(beat)` = 1200 + 30 × số ký tự + `hold_ms`.
- `src/ui/cutscene-player.tsx`: props `{ beats: PlayBeat[]; play(cue): void; collected: number; slots: number; onFinish(reason: "end" | "skip"): void; endPanel?: ReactNode }`.
  - Cue của nhịp phát trong effect theo `index` (một lần khi nhịp bắt đầu; engine gộp lần chạy đôi của StrictMode). Tiếng gõ: `teletype` cho `log`/`kai`/`lore`, `echo_voice` cho `echo`, qua `onTick` của `useTypewriter` (26 ms/ký tự như briefing).
  - Timer tự chuyển chỉ chạy khi `shown` và `!document.hidden`; `visibilitychange` xóa và đặt lại timer.
  - Phím (listener trên `window`): bỏ qua `e.repeat`; Space/Enter → `advance` (bỏ qua khi focus đang ở một `<button>` để nút tự xử lý); Esc → `skip`. `pointerdown` trên sân khấu (không phải nút) → `advance`. `M` không xử lý ở đây (thuộc `App`).
  - Khi `ended`: không có `endPanel` → gọi `onFinish` đúng một lần; có `endPanel` (Còn tiếp) → hiện panel, gọi `onFinish("end")` để ghi đã xem, focus nút đầu trong panel.
  - Giảm chuyển động: bản chép tất cả nhịp (thẻ hiện dạng khối lớn tại chỗ, không xóa nhịp trước), tự cuộn trong ô, nút TIẾP TỤC có focus gọi `onFinish("end")`; không nhiễu, không nháy, không phát cue từng nhịp.
  - Nút BỎ QUA ở góc trên (≥ 44 × 44 px, có `<kbd>Esc</kbd>`), gốc màn `tabIndex={-1}` nhận focus khi mở để phím hoạt động ngay.
  - `aria-live="polite"` đọc toàn văn nhịp mới khi nó bắt đầu (không đọc từng ký tự); phần gõ chữ `aria-hidden`.
  - Kiểu nhịp: `log` mono xanh nhạt; `kai` nghiêng trắng ấm; `echo` có ô chân dung nhỏ (dùng lại `Face`, export từ `echo-panel.tsx`) và lớp nhiễu ký tự CSS; `lore` khung "BẢN GHI KHÔI PHỤC", nhãn `KTS-0x` đầu câu tô sáng (regex `^KTS-\d+`); `card` chữ lớn giữa màn, nhiều dòng theo `\n`, có `NeuralIdBar` khi `fx: "id_bar"` (ô `flashSlot` sáng lên).
  - Cột nhịp tự cuộn theo nhịp mới; nhịp cũ mờ dần (CSS `opacity` theo vị trí).
- `src/ui/story-backdrop.tsx`: `thanh-pho` / `vung-toi` / `terminal`, nhận `fx` hiện tại để bật lớp CSS (`city_blink`, `eight_fragments`, `alert_tick`). Dùng `CityMatrix`.
- `src/ui/city-matrix.tsx`: SVG ma trận chấm sinh tất định (hạt giống cố định), khu chấm tắt ở góc trên = Vùng Tối; prop `zoom` thu gần vào khu tắt (cho `vung-toi`); nhịp sáng chậm bằng CSS, tắt khi giảm chuyển động. Màn tiêu đề (phase 4) dùng lại.
- `src/ui/neural-id-bar.tsx`: 6 ô (`slots`), `filled`, `flashSlot?`, nhãn tên thành phần đã thu (tùy chọn), `aria-label="Neural-ID giả: n/6 thành phần"`. Bản đồ (phase 4) dùng lại.
- `src/ui/story-gate.tsx`: giống `IntroGate`, nút **TIẾP TỤC ĐOẠN TRUYỆN** có `autoFocus`, gọi `onEnter` (gọi `unlock()` rồi bắt đầu đoạn ngay, không chờ unlock xong).
- `src/story/cutscene-reducer.test.ts`, `src/ui/cutscene-player.test.tsx`.

Sửa:
- `src/ui/echo-panel.tsx`: export `Face` (đổi tên `EchoFace`), không đổi hành vi.
- `src/styles/global.css`: mục Story (bố cục toàn màn, trang không cuộn, cột tự cuộn, chữ ≥ 16 px trên điện thoại, lề 16 px, kiểu bốn nhịp, ba nền, `@media (prefers-reduced-motion: reduce)` tắt mọi animation của mục này).

## Steps
1. Bước 0 (skill thiết kế).
2. `cutscene-reducer.ts` + test.
3. `city-matrix.tsx`, `story-backdrop.tsx`, `neural-id-bar.tsx`.
4. `cutscene-player.tsx`, `story-gate.tsx`, CSS.
5. Test component.

## Tests
- `cutscene-reducer.test.ts`:
  - `advance` khi đang gõ chỉ hiện hết nhịp (index không đổi); lần sau mới sang nhịp; ở nhịp cuối → `ended`.
  - `skip` từ bất kỳ đâu → `ended`.
  - `visibleBeats`: sau thẻ `card` các nhịp cũ biến mất; khi thẻ là nhịp hiện tại chỉ còn thẻ.
  - `backdropAt` giữ nền khai báo trước đó.
  - `init(…, reduced=true)` → `transcript`, `advance` không đổi state.
- `cutscene-player.test.tsx` (jsdom, fake timers, `play` là `vi.fn`):
  - Space tiến một bước; `keydown` với `repeat: true` không làm gì; Esc gọi `onFinish("skip")` đúng một lần.
  - Hết chữ rồi chờ `autoDelayMs` → sang nhịp sau; khi `document.hidden` thì không sang.
  - Giảm chuyển động (mock `matchMedia`): mọi nhịp có trong DOM ngay, nút TIẾP TỤC có focus, `play` không được gọi cho cue của nhịp.

## Validation
```bash
npx vitest run src/story/cutscene-reducer.test.ts src/ui/cutscene-player.test.tsx
npm run typecheck
```

## Risks
- Timer tự chuyển và typewriter đều dùng `setInterval`/`setTimeout`: dọn trong cleanup của effect; không bao giờ dùng chúng để hẹn âm thanh.
- Phím Enter vừa kết thúc đoạn có thể kích hoạt nút ở màn sau: phase 5 xử lý bằng chặn 400 ms + `repeat` ở màn "VÀO NHIỆM VỤ".
- Hiệu ứng nhiễu ký tự trên chữ ECHO không được đổi nội dung đọc cho trình đọc màn hình: chỉ áp lên lớp `aria-hidden`.

## Rollback
Xóa các file mới; hoàn tác export trong `echo-panel.tsx` và mục CSS. Chưa có gì trong `App` dùng chúng.

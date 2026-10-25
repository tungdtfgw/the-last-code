---
phase: 4
title: "UI: hook phát lại, trạm R-17, mục tiêu đầu ra, vòng sáng CHẠY"
status: completed
priority: P1
effort: "6h"
dependencies: [3]
---

# Phase 4: UI: hook phát lại, trạm R-17, mục tiêu đầu ra, vòng sáng CHẠY

## Goal
1.1 chơi được trên màn hình: mô phỏng trạm R-17 phát lại kết quả theo GDD §5, ô Mục tiêu hiện ba dòng đầu ra, hộp kết quả và các nhãn dùng đúng chữ theo loại mô phỏng, nút CHẠY có vòng sáng tới lượt chạy đầu. Máy quét 1.4 chạy qua hook phát lại chung mà không đổi hành vi.

## Context
- GDD 1.1 §2 (bố cục), §5 (cảnh, danh sách phát, các trạng thái, phản công, Sentinel, giảm chuyển động, `aria-live`, điện thoại), §8.3 (vòng sáng). Hợp đồng §1 (hook chung), §7.
- Đọc lại trước khi sửa (vỏ game đã đổi): `src/ui/level-simulation.tsx` (điểm chọn mô phỏng, hiện luôn trả máy quét, có legend), `src/ui/game-screen.tsx` (tiêu đề ô = `location`), `src/ui/results-dialog.tsx` (TIẾP TỤC, "Đã thu"), `src/ui/scanner-simulation.tsx`.
- Logic phát lại hiện tại trong `scanner-simulation.tsx`: state `{frames, index}` đặt lại trong lúc render khi có timeline mới; effect phát `frame.cues` qua `onCue(c, 450 * i)` (đồng hồ audio, nhật ký lỗi §4), hẹn khung kế bằng `setTimeout(frame.hold)`, gọi `onDone` ở khung cuối; Esc (khi không có `dialog[open]`) và nút "Bỏ qua hoạt cảnh" nhảy khung cuối; giảm chuyển động nhảy thẳng khung cuối.
- Màu `str` là `--type-str` trong `tokens.css`; Sentinel, rung màn, banner phản công đã có class trong `global.css` (`.sim`, `.is-shaking`, `.sim-banner`, `.sentinel`).
- Kiểm hiệu ứng: không dùng ảnh chụp Claude-in-Chrome giữa hoạt cảnh (gửi sự kiện chuột làm bỏ qua). Dùng `__TLC_AUDIO_PROBE__`, e2e, hoặc xem bằng mắt.

## Files
Tạo:
- `src/ui/use-timeline-playback.ts`: `useTimelinePlayback<F extends { hold: number; cues: Cue[] }>(frames, { playing, onDone, onCue })` → `{ index, skip }`. Chuyển nguyên logic nói trên từ `scanner-simulation.tsx`, gồm cả listener Esc.
- `src/ui/relay-timeline.ts` (thuần):
  - `RelaySlot { line; expected; state: "idle" | "flying" | "sent" | "dropped" | "missing" | "unsent" | "error" | "extra"; diff?: ReturnType<typeof describeLine>; label?: string }`.
  - `RelayScene { wave: "base" | "counter"; slots; extra: RelaySlot[]; antenna: "idle" | "flash" | "off"; channel: "closed" | "half" | "open"; laptop: "idle" | "compile_error"; wavesLit: number; reachedEdge: boolean; status; banner; chip; sentinel; shake }`.
  - `relayRunningScene(level)`, `relayIdleScene(level)`, `buildRelayTimeline(outcome, level): RelayFrame[]`, `summarizeRelay(frames, level)`.
  - Luật khung: mở đầu 450 ms; lỗi cú pháp → một khung `laptop: "compile_error"`, status `TRÌNH DỊCH TỪ CHỐI`, cue `alarm`, không gói nào bay; mỗi dòng có trong `output.lines` một khung 450 ms (`sent` + `antenna: flash` + cue `scan_pass`; `dropped` với `diff`, nhãn `BỎ GÓI · vị trí c`, cue `scan_reject`); lỗi chạy: dòng đã phát như trên, dòng kế tiếp `error` nhãn `{type} · dòng {line}`, các dòng sau `unsent` "CHƯA PHÁT", cue `alarm`; không lỗi mà thiếu → `missing` "KHÔNG CÓ DÒNG"; thừa → slot `extra` "DÒNG THỪA" cue `scan_reject`; lượt cơ bản đạt → `channel: half`, status `KÊNH MỞ MỘT NỬA`, cue `gate_open`; Sentinel bắt → status `SENTINEL ĐÃ KHÓA MỤC TIÊU`, `sentinel` true, cue `alarm`; phản công: banner `counter_attack_banner`, `shake`, `antenna: off` một nhịp, chip `ma_phien = "M4X8"` (từ `counterInputs`, cùng cách `inputsLabel` của máy quét), cue `siren`, rồi đợt gói thứ hai theo `counterOutput`; qua → `channel: open`, `reachedEdge` true, status `KÊNH MỞ HOÀN TOÀN`, cue `gate_open` + `star`; trượt → `KÊNH VỀ MỘT NỬA · …`, cue `alarm`; phản công bị cắt (`counterAborted`) như máy quét. `sentinel` sáng khi vượt 40% (`stars === 1`) như máy quét.
  - `summarizeRelay`: "Trạm R-17 phát 2/3 dòng. Dòng 3 sai ở vị trí 1. Kênh đóng." (tên trạm từ `simulation.station`).
- `src/ui/relay-simulation.tsx`: SVG (laptop góc dưới trái có màn nhỏ, dây lên ăng-ten `station` trên mái, lưới chấm Mạng Mù bên phải, vòng sóng khi `flash`, đường sáng theo `wavesLit`, chấm lạ ở mép lưới khi `reachedEdge`, không nhãn) + danh sách phát HTML bên dưới (mỗi dòng mong đợi một ô; `dropped` hiện `cần:`/`nhận:` với ký tự sai đầu tiên bọc `<mark>`, kèm `U+XXXX` khi có). Dùng `useTimelinePlayback`, cùng nút "Bỏ qua hoạt cảnh (Esc)", vùng `aria-live` một câu, banner phản công, đèn SENTINEL ở góc.
- `src/ui/relay-timeline.test.ts`.

Sửa:
- `src/ui/scanner-simulation.tsx`: dùng `useTimelinePlayback`; bỏ phần đã chuyển. Không đổi gì khác. `level.objectives` → `varObjectives(level)` nếu phase 1 chưa làm.
- `src/ui/level-simulation.tsx`: nhánh theo `simulationOf(level).kind`: `relay` → `RelaySimulation`, mặc định → `ScannerSimulation`; legend 4 màu kiểu chỉ khi `scanner`.
- `src/ui/objectives-panel.tsx`: mục tiêu `output_line` vẽ chip `dòng N` thay cho chip kiểu và `<code>` tên biến; trạng thái `pass`/`fail` theo `outcome.output.lines[N-1].status === "ok"` (`idle` khi chưa chạy hoặc `engine_error`); `key` theo `kind + line|var`; dòng phụ `panel-meta` từ `vocabularyFor(level)`.
- `src/ui/results-dialog.tsx`: tiêu đề từ `vocabularyFor(level)`; tiêu chí 1: `Đầu ra khớp từng ký tự, chạy hết không lỗi` khi level chỉ có mục tiêu đầu ra, `Đúng kiểu, đúng giá trị` khi có biến (1.4 giữ nguyên).
- `src/ui/run-controls.tsx`: prop `firstRun: boolean` → class `is-first-run` trên nút CHẠY (chỉ khi không bận). `game-screen.tsx` truyền `state.progress.runs === 0`.
- `src/ui/terminal-panel.tsx`: prop `stderr: string | null`; hiện dưới nhãn riêng `LUỒNG LỖI (không chấm)` khi không rỗng. `game-screen.tsx` truyền `outcome.stderr`.
- `src/ui/game-screen.tsx`: `panel-meta` của editor `dòng khóa = dữ liệu nạp sẵn · Esc rồi Tab để rời`.
- `src/ui/code-editor.tsx`, `src/ui/locked-lines-extension.ts`: "Dòng dữ liệu chip bị khóa" → "Dòng dữ liệu nạp sẵn bị khóa". `tests/e2e/level-1-4.spec.ts` dòng assert tương ứng đổi theo (một dòng).
- `src/styles/global.css`: khối `.relay-*` (SVG, danh sách phát, `mark` sai ký tự, các trạng thái ô xanh/đỏ/xám); trên `< 768 px` SVG `aspect-ratio: 4 / 3`, danh sách cuộn trong ô của nó, chữ mono ≥ 14 px; `.btn-run.is-first-run` vòng sáng nhẹ (keyframes trên `box-shadow`/`outline`), `@media (prefers-reduced-motion: reduce)` → viền tĩnh. Dùng token có sẵn trong `tokens.css`, không thêm màu cứng.

## Steps
1. Tách `use-timeline-playback.ts`, chuyển máy quét sang; chạy `npx vitest run src/ui` và `npx playwright test tests/e2e/level-1-4.spec.ts tests/e2e/audio.spec.ts --project=chromium` trước khi làm tiếp (lưới an toàn cho cue và `onDone`).
2. `relay-timeline.ts` + test.
3. `relay-simulation.tsx` + CSS; nối vào `level-simulation.tsx`.
4. Ô Mục tiêu, hộp kết quả, vòng sáng, stderr, chữ trung tính.
5. Kiểm tay trên `npm run dev` (`lsof -i :5173` trước; dùng lại server có sẵn): `#/level/1.1` ở 1280 px và 375 px, chơi theo GDD §11 bước 2–6; giảm chuyển động (DevTools → Rendering) hiện thẳng khung cuối và vòng sáng tĩnh; không cuộn ngang trang.

## Tests
- `relay-timeline.test.ts` (outcome dựng tay hoặc qua harness thật như `scanner-timeline.test.ts` đang làm, theo cách file đó dùng):
  - code gốc: khung cuối ô 1 `sent`, ô 2 `error` nhãn `NameError · dòng 7`, ô 3 `unsent`; chuỗi cue `scan_pass` rồi `alarm`; kênh `closed`;
  - lỗi cú pháp: không ô nào rời `idle`, `laptop: "compile_error"`, một cue `alarm`;
  - dòng 3 sai hoa thường: ô 3 `dropped`, `diff.col` 1;
  - thiếu và thừa: ô `missing`; slot `extra` có mặt;
  - 3 sao: có khung `wave: "counter"` với chip chứa `M4X8` và cue `siren`; khung cuối `channel: "open"`, `reachedEdge`, cue `["gate_open", "star"]`;
  - 2 sao (chép cứng): khung cuối `channel: "half"`, ô 2 của đợt phản công `dropped`;
  - `summarizeRelay` cho ca lượt 2 GDD: đúng câu "Trạm R-17 phát 2/3 dòng. Dòng 3 sai ở vị trí 1. Kênh đóng."
- Không unit test cho component, hook, ô Mục tiêu, vòng sáng: e2e phase 5 và e2e 1.4 có sẵn phủ chúng.

## Validation
```bash
npx vitest run src/ui src/game
npm run typecheck && npm run build
npx playwright test tests/e2e/level-1-4.spec.ts tests/e2e/audio.spec.ts tests/e2e/intro.spec.ts --project=chromium
```

## Risks
- **StrictMode và hook:** effect chạy hai lần; giữ đúng cách viết hiện tại (cue cùng tên trong 30 ms được engine gộp; `onDone` chỉ ở khung cuối của timeline hiện hành).
- **Tràn ngang trên 375 px** do dòng `cần:`/`nhận:` dài: danh sách dùng `white-space: pre-wrap` và `overflow-wrap: anywhere`, cuộn dọc trong ô.
- **Vòng sáng làm bẩn ảnh/e2e cũ:** chỉ là class CSS; e2e 1.4 không chụp ảnh.
- **`level-simulation.tsx` của vỏ game có props khác dự kiến:** theo mã thật, giữ `SimulationProps` chung cho cả hai mô phỏng.

## Rollback
Xóa `relay-*`, `use-timeline-playback.ts`; hoàn tác `scanner-simulation.tsx`, `level-simulation.tsx`, các file UI và CSS. 1.1 vẫn chấm đúng (phase 1–3) nhưng hiện bằng máy quét.

## Ghi chú triển khai
- `RelaySlot` không có trạng thái `flying`: gói đang bay là `scene.active` (chỉ số ô), vẽ một lần mỗi khung bằng CSS keyframes.
- `useTimelinePlayback` trả `{ frame, index, skip, reduced }`.
- `SimulationLegend` nhận `level`, không vẽ gì với `relay`.
- Vòng sáng CHẠY: `.btn-run` có `clip-path` nên viền ngoài bị cắt; dùng nền sáng nhịp + viền trong (`inset`), giảm chuyển động: viền trong tĩnh.
- Khung cuối khi qua phản công bỏ banner (như máy quét).
- `index.html`: tiêu đề/description bỏ chữ "1.4" (trung tính).
- Không chạy Playwright (người dùng cấm). Đã xem bằng mắt ở 1512 px (code gốc, 3 sao); 375 px chưa xem được (cửa sổ không đổi cỡ), dựa vào CSS và project e2e `mobile-chromium`.

---
phase: 9
title: "Âm thanh thủ tục"
status: completed
priority: P2
effort: "2h"
dependencies: [7]
---

# Phase 9: Âm thanh thủ tục

## Goal
Toàn bộ âm thanh sinh bằng Web Audio API (không file, không vấn đề bản quyền), chỉ bắt đầu sau cử chỉ đầu tiên của người dùng, có nút tắt tiếng lưu qua repository.

## Files to Create
- `src/audio/audio-engine.ts` – lớp `AudioEngine` (singleton qua hook).
- `src/audio/sound-recipes.ts` – công thức từng âm (hàm nhận `ctx`, `destination`, `when`).
- `src/audio/use-audio.ts` – hook React: mở khóa theo cử chỉ, đồng bộ `muted` với `repository.updateSettings`.
- `src/audio/audio-engine.test.ts` – test với `AudioContext` giả (kiểm logic mute/unlock/throttle, không kiểm âm sắc).

## Kiến trúc
`AudioContext` → `masterGain` (mute = ramp về 0 trong 50 ms) → `compressor` (DynamicsCompressor chống vỡ tiếng) → `destination`. Nhánh `ambientGain` riêng cho tiếng nền.

## Danh mục âm (cue → công thức gợi ý)
| Cue | Khi nào | Công thức |
|---|---|---|
| `ambient_hum` | liên tục sau unlock | 2 sawtooth 55 Hz & 55.4 Hz (beat chậm) qua lowpass 180 Hz + noise lọc bandpass rất nhỏ; gain 0.04; LFO 0.1 Hz lên cutoff |
| `key_blip` | gõ phím trong editor (throttle ≥ 35 ms, bỏ phím điều hướng) | square 1800–2200 Hz ngẫu nhiên, 12 ms, gain 0.02 |
| `terminal_line` | mỗi dòng terminal mới | sine 900 Hz 30 ms |
| `run` | bấm CHẠY | sweep sine 200→800 Hz 180 ms + tick |
| `scan_pass` | gói qua máy quét đạt | 2 nốt sine 660→990 Hz, 80 ms mỗi nốt |
| `scan_reject` / `locked_blocked` | gói bị từ chối / sửa dòng khóa | square 140 Hz 120 ms, lowpass |
| `alarm` | lỗi/timeout/sai | square 440↔660 Hz luân phiên 4 lần × 120 ms |
| `siren` | OMNI phản công | sawtooth sweep 300→900→300 Hz trong 1.6 s, lặp 2 lần, qua bandpass |
| `gate_open` | cổng mở | noise qua lowpass sweep 200→2000 Hz 700 ms + sub 60 Hz |
| `star` | mỗi sao trao | arpeggio sine 523/659/784 Hz, 90 ms mỗi nốt, có delay ngắn |
| `echo_voice` | ECHO bắt đầu nói (và mỗi ~4 ký tự khi gõ chữ, throttle 60 ms) | sine/square 300–500 Hz ngẫu nhiên + ring-mod 30 Hz + bitcrush giả (WaveShaper), 40 ms – nghe như giọng nhiễu |

## Quy tắc
- Không tạo `AudioContext` trước cử chỉ. Lắng nghe `pointerdown`/`keydown` một lần (capture) → tạo/`resume()` context → bắt đầu ambient (nếu không mute). Nếu `resume()` bị từ chối → giữ im lặng, thử lại ở cử chỉ kế.
- Không có `AudioContext` (trình duyệt cũ) hoặc lỗi khởi tạo → engine no-op, game chạy bình thường.
- Mute: nút trong `run-controls` (`aria-pressed`, nhãn "TẮT TIẾNG"/"BẬT TIẾNG", phím tắt `M` khi focus không ở editor). Trạng thái đọc từ `repository.getSettings()` khi khởi động và lưu khi đổi. Khi mute: không phát cue nào và ambient gain = 0.
- Tab ẩn (`visibilitychange`) → `ctx.suspend()`; hiện lại → `resume()` nếu đã unlock.
- Giới hạn đồng thời: tối đa 8 voice; cue cùng loại trong < 30 ms bị gộp.
- Âm lượng tổng thận trọng (master 0.6), không có âm chói kéo dài > 2 s ngoài siren.

## Nối dây
- `scanner-simulation` gọi `onCue`; `code-editor` gọi `key_blip` qua `EditorView.updateListener` (chỉ khi `docChanged` do người dùng); terminal gọi `terminal_line`; ECHO panel gọi `echo_voice`; editor chặn dòng khóa gọi `locked_blocked`.

## Verification
- `npx vitest run src/audio`
- Thủ công Chrome + Safari/Firefox: tải trang không có âm cho tới khi click; ambient bật sau click; mute → im lặng tức thì; reload → vẫn mute; mở tab khác → không còn tiếng.

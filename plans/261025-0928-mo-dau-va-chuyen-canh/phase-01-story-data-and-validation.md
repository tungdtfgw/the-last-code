---
phase: 1
title: "Dữ liệu truyện, validator, hai cue mới"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Dữ liệu truyện, validator, hai cue mới

## Goal
Có kiểu nhịp, file chương `chapter-1.json`, các trường mới của level JSON, validator cho cả hai, hai recipe âm thanh `pulse` và `glitch`, và dữ liệu 1.4 đã cập nhật. Chưa có UI.

## Context
- GDD `design/gdd-mo-dau.md` mục 3 (23 nhịp mở đầu), 5.2 (dữ liệu), 5.6 (9 nhịp Còn tiếp), 6.4 (dữ liệu 1.4), mục 1 "Luật lời thoại ECHO".
- Validator hiện có: `src/game/validate-level.ts` (viết tay, mỗi lỗi nêu tên trường). Registry: `src/game/level-registry.ts` (`invalid` theo đường dẫn file).
- Kiểm từ cấm hiện nằm trong `src/game/echo-forbidden-terms.test.ts`; logic này phải dùng lại cho nhịp ECHO.
- `Cue` hiện là union type trong `src/audio/sound-recipes.ts`; validator cần danh sách giá trị lúc chạy.

## Files
Tạo:
- `src/story/story-types.ts`: `BEAT_KINDS = ["log","kai","echo","card"]`, `BACKDROPS = ["thanh-pho","vung-toi","terminal"]`, `BEAT_FX = ["city_blink","eight_fragments","alert_tick","id_bar"]`; `StoryBeat { kind; text; cue?: Cue; backdrop?; fx?; hold_ms? }`; `PlayBeat` = `StoryBeat` mở rộng thêm kind `"lore"` và trường nội bộ `flashSlot?: number` (chỉ do `buildStory` tạo, JSON không được dùng); `ChapterDefinition { schema_version: 1; chapter; title; levels: string[]; neural_id_slots; prologue: StoryBeat[]; teaser: StoryBeat[] }`.
- `src/story/validate-beats.ts`: `validateBeats(raw, field, errors, leakCheck?)`; kiểm mảng 1–30 nhịp, `kind` thuộc `BEAT_KINDS`, `text` chuỗi không rỗng ≤ 400 ký tự, `cue` thuộc `CUES`, `backdrop` thuộc `BACKDROPS`, `fx` thuộc `BEAT_FX`, `hold_ms` số nguyên 0–5000, không có khóa lạ; với nhịp `echo` gọi `leakCheck(text)` và báo lỗi theo vị trí (`outro_beats[2].text …`).
- `src/story/validate-chapter.ts`: `validateChapter(raw)`; `levels` mảng id không rỗng, không trùng; `neural_id_slots` số nguyên 1..`levels.length`; `prologue`, `teaser` qua `validateBeats` với kiểm từ cấm (không có đáp án).
- `src/story/chapter-1.json`: chép nguyên văn 23 nhịp mục 3 và 9 nhịp mục 5.6. `⏎` thành `\n`. Gán `backdrop` ở nhịp có ghi nền (nền được giữ cho các nhịp sau). Gán cue như bảng: `pulse` (1, 7, 23, Còn tiếp 9), `scan_pass` (10), `terminal_line` (13), `glitch` (15, Còn tiếp 5), `gate_open` (Còn tiếp 1), `scan_reject` (Còn tiếp 7). `teletype`/`echo_voice` là tiếng gõ chữ, không ghi trong `cue`. `fx`: `city_blink` (3), `eight_fragments` (5), `alert_tick` (19), `id_bar` (21, Còn tiếp 2). `hold_ms`: nhịp 1 ("Giữ lâu") ~2500, nhịp 6 ~1500, Còn tiếp 8 ("Im lặng 2 giây") 2000. `neural_id_slots: 6`, `levels: ["1.1","1.2","1.3","1.4","1.5","1.6","1.7"]`.
- `src/story/chapter.ts`: `getChapter()` nạp và kiểm `chapter-1.json` một lần, trả `{ ok, chapter } | { ok: false, errors }`.
- `src/game/echo-leaks.ts`: `FORBIDDEN_TERMS = /\b(int|float|round)\b/i`; `levelAnswers(level)`; `findEchoLeak(text, answers): string | null`. Chuyển nguyên logic từ `echo-forbidden-terms.test.ts` sang đây.
- `src/story/validate-chapter.test.ts` (xem Tests).

Sửa:
- `src/audio/sound-recipes.ts`: `export const CUES = [...] as const; export type Cue = (typeof CUES)[number]`, thêm `pulse` (một nhịp trầm: sine ~55 Hz + overtone, tấn công nhanh, tắt ~0,9 s) và `glitch` (nhiễu trắng qua bandpass, cắt nhịp 3–4 lát trong ~0,25 s). `RECIPES: Record<Cue, Recipe>` buộc đủ recipe.
- `src/audio/audio-engine.ts`: `THROTTLE_MS` thêm `pulse: 800`.
- `src/game/level-types.ts`: `location?: string; component?: string; outro_beats?: StoryBeat[]`.
- `src/game/validate-level.ts`: kiểm ba trường mới khi có (`location`, `component` chuỗi không rỗng ≤ 60 ký tự; `outro_beats` qua `validateBeats` với `leakCheck` dùng đáp án của chính level).
- `src/game/level-registry.ts`: thêm `invalidIds: Set<string>` (lấy `raw.id` nếu là chuỗi trong file hỏng) để Bản đồ hiện "TÍN HIỆU HỎNG".
- `src/levels/level-1-4.json`: `reactions.entry` = "Cổng phía Bắc. Chip của người đưa tin vẫn phát. Máy quét phía trước chỉ nhận số."; `location: "Cổng phía Bắc"`; `component: "Dữ liệu sinh trắc"`; `outro_beats` 4 nhịp theo 6.4 (kai, echo, kai, echo). `outro`, `lore_fragment`, `briefing` giữ nguyên.
- `src/game/echo-forbidden-terms.test.ts`: dùng `findEchoLeak`, thêm vòng lặp cho `outro_beats` kiểu `echo`.
- `src/game/echo-reactions.test.ts`: test "entry line" đổi sang chữ mới ("Chip của người đưa tin vẫn phát").
- `src/game/validate-level.test.ts`: thêm ca cho trường mới.

## Steps
1. Đổi `Cue` sang `CUES` const; thêm hai recipe; chạy `npx vitest run src/audio` (test render tự phủ recipe mới).
2. Viết `story-types.ts`, `echo-leaks.ts`, `validate-beats.ts`; nối vào `validate-level.ts`.
3. Viết `chapter-1.json` bằng cách chép từ GDD, rồi `validate-chapter.ts` + `chapter.ts`.
4. Cập nhật `level-1-4.json`, các test bị ảnh hưởng, `invalidIds` trong registry.

## Tests (chỉ những gì bảo vệ dữ liệu)
- `validate-chapter.test.ts`:
  - file thật hợp lệ, `prologue.length === 23`, `teaser.length === 9`, nhịp 15 có cue `glitch`, mọi id trong `levels` không trùng;
  - từ chối: kind lạ, cue lạ, `hold_ms` âm, nhịp ECHO chứa "int";
  - **mọi level trong registry có `chapter === 1` đều nằm trong `chapter.levels`** (bảo vệ "thêm JSON là tự vào luồng").
- `validate-level.test.ts`: 1.4 hợp lệ với trường mới; một bảng ca từ chối (`outro_beats` kind `lore`, cue lạ, nhịp ECHO lộ đáp án `2703`, `location` rỗng). Level không có trường mới vẫn hợp lệ (fixture `tests/fixtures/levels/level-test-sample.json` không đổi).
- `echo-forbidden-terms.test.ts` phủ cả `outro_beats` ECHO.

## Validation
```bash
npx vitest run src/story src/game/validate-level.test.ts src/game/echo-forbidden-terms.test.ts src/game/echo-reactions.test.ts src/audio
npm run typecheck
```

## Risks
- Chép kịch bản sai chữ: so lại từng dòng với GDD mục 3 và 5.6 sau khi viết (diff bằng mắt từng bảng).
- `validate-level.ts` import từ `src/story/` và `src/audio/sound-recipes.ts`: chỉ import hằng số, không kéo Web Audio vào lúc chạy validator (recipe là hàm, không chạy khi import).

## Rollback
Xóa `src/story/`, `src/game/echo-leaks.ts`; hoàn tác các file đã sửa. Trường mới là tùy chọn nên dữ liệu cũ vẫn chạy.

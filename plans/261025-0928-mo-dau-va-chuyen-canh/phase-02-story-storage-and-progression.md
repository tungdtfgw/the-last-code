---
phase: 2
title: "Lưu đoạn đã xem và luật tiến trình"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Lưu đoạn đã xem và luật tiến trình

## Goal
`ProgressRepository` lưu tập đoạn truyện đã xem; một module thuần quyết định mở khóa, đích của mọi nút TIẾP TỤC, đích khi đoạn truyện kết thúc, chặn route; và `buildStory()` ghép nhịp cho một id đoạn truyện.

## Context
- GDD mục 4.2, 5.1, 5.4, 5.6, 7. Luật "level đã dựng" ở `plan.md` (Quyết định kỹ thuật).
- `src/storage/progress-repository.ts` (interface, `sanitize*`, `mergeLevelProgress`), `local-storage-repository.ts` (`V1Progress`, `PROGRESS_KEY`), `memory-repository.ts`.

## Files
Sửa:
- `src/storage/progress-repository.ts`: `StoryProgress { seen: string[] }`; interface thêm `getStory(): Promise<StoryProgress>` và `markStorySeen(id: string): Promise<StoryProgress>`; `sanitizeStory(raw)` (mảng chuỗi, mỗi id 1–64 ký tự, bỏ trùng, tối đa 200 mục, sai dạng → rỗng); `mergeStory(a, b)` = hợp tập, giữ thứ tự xuất hiện. Comment: luật gộp dùng cho cả gộp tài khoản sau này.
- `src/storage/local-storage-repository.ts`: `V1Progress` có `story?: StoryProgress`; `readProgress` đọc `story` qua `sanitizeStory` (hỏng thì rỗng, `levels` không bị ảnh hưởng); `markStorySeen` gộp rồi `write(PROGRESS_KEY, …)`. Không đổi `SCHEMA_VERSION`.
- `src/storage/memory-repository.ts`: cùng hai hàm, cùng luật gộp.
- `src/storage/progress-store.test.ts`: thêm test (xem Tests).

Tạo:
- `src/story/progression.ts` (thuần, không import React):
  - `ChapterContext { order: string[]; built: Map<string, LevelDefinition>; broken: Set<string> }`, `buildChapterContext(chapter, registry)`.
  - `ProgressSnapshot { stars: Record<string, StarCount>; seen: ReadonlySet<string> }`.
  - `StoryId = "prologue" | "teaser" | \`after-${string}\``; `Route = { kind: "title" } | { kind: "map" } | { kind: "story"; id: string } | { kind: "level"; id: string }`.
  - `builtOrder(ctx)`: các id đã dựng theo thứ tự chương. `firstBuilt`, `nextBuiltAfter(id)`.
  - `nodeStates(ctx, snap)`: mỗi id trong `order` → `{ id, status: "cleared" | "open" | "locked" | "unbuilt" | "broken", stars, requires?: string, next: boolean }`. Có sao → `cleared`; level đã dựng đầu tiên hoặc level đã dựng liền trước có sao → `open`; còn lại `locked` với `requires` = level đã dựng liền trước. `next` = nút `open` đầu tiên chưa có sao (nhãn "TIẾP THEO").
  - `storyEnd(id, ctx, snap)`: `prologue` → level đã dựng đầu tiên (không có thì bản đồ); `after-X` → level đã dựng kế tiếp X, không còn thì `teaser`; `teaser` → bản đồ. Kết quả đi qua `forward()`.
  - `forward(route, ctx, snap)`: nếu route là đoạn truyện đã xem (trừ khi xem lại) thì nhảy tiếp tới `storyEnd` của nó, lặp cho đến khi gặp level, bản đồ hoặc đoạn chưa xem.
  - `continueAfterLevel(id, ctx, snap)` (TIẾP TỤC ở hộp kết quả) = `forward(story after-id)`.
  - `titleContinue(ctx, snap)`: duyệt level đã dựng theo thứ tự; gặp level L chưa có sao → đoạn dẫn vào L (`after-<level đã dựng trước L>`, hoặc `prologue` nếu L là level đầu) nếu chưa xem, ngược lại level L. Mọi level đều có sao → `forward(after-<level cuối>)` (chạy đoạn còn thiếu, cuối cùng là bản đồ).
  - `isReturning(snap)` = `seen.has("prologue")` (quyết định BẮT ĐẦU hay TIẾP TỤC; xem câu hỏi mở 1 trong `plan.md`).
  - `guardRoute(route, ctx, snap)`: level chưa dựng hoặc hỏng → bản đồ; level đã dựng (kể cả đang khóa) → giữ; `after-X` khi X chưa dựng hoặc chưa có sao → bản đồ; `teaser` khi level đã dựng cuối chưa có sao và chưa xem → bản đồ; id đoạn lạ → bản đồ.
  - `chapterTotals(ctx, snap)`: `{ stars, maxStars: 3 × số level đã dựng, components: { slot, levelId, name }[] }` (ô = vị trí trong `order`, chỉ tính level có `component` và có sao, `slot < neural_id_slots`).
- `src/story/build-story.ts`: `buildStory(id, chapter, ctx, snap): PlayBeat[] | null`. `prologue`/`teaser` lấy từ chương. `after-X`: `[{kind:"log", text: outro}, {kind:"lore", text: lore_fragment, cue:"terminal_line"} (bỏ nếu rỗng), {kind:"card", text:"NEURAL-ID GIẢ · THÀNH PHẦN n/6: <component>", cue:"objective_lock", fx:"id_bar", flashSlot:n} (bỏ nếu không có component), ...outro_beats]`. Id lạ → `null`.
- `src/story/progression.test.ts`, `src/story/build-story.test.ts`.

## Steps
1. Storage: kiểu, sanitize, merge, hai cài đặt, test.
2. `progression.ts` và test với registry dựng trong test bằng `buildRegistry` từ bản sao `level-1-4.json` đổi `id` (không thêm file fixture).
3. `build-story.ts` và test.

## Tests (chỉ các luật quan trọng)
- `progress-store.test.ts`:
  - `markStorySeen` qua một repository mới trên cùng storage (tải lại) vẫn còn; gọi lại cùng id không tạo trùng; tập không bao giờ bớt;
  - `story` sai dạng (`"x"`, `[1, null]`, `{seen: "a"}`) → rỗng, `bestStars` của level giữ nguyên;
  - dữ liệu cũ không có `story` → rỗng, `schemaVersion` vẫn 1;
  - `MemoryRepository` theo cùng luật.
- `progression.test.ts`, mỗi luật một ca (bảng `test.each`):
  - Chỉ 1.4 dựng: 1.4 `open` + `next`, 1.1–1.3 và 1.5–1.7 `unbuilt`; prologue kết thúc → `#/level/1.4`; `after-1.4` → `teaser`; teaser đã xem → bản đồ.
  - 1.1–1.4 dựng: 1.2 `locked` với `requires: "1.1"` khi 1.1 chưa có sao; mở khi 1.1 có 1 sao; 1.3 chưa dựng thì 1.4 phụ thuộc 1.2.
  - `titleContinue`: người chơi qua 1.2 rồi đóng tab (1.2 có sao, `after-1.2` chưa xem) → `story after-1.2`; đã xem → `level 1.3`; mọi level có sao, `after-1.4` chưa xem → `story after-1.4`; tất cả đã xem → bản đồ.
  - `continueAfterLevel` khi chơi lại (đoạn đã xem) → thẳng level sau.
  - `guardRoute`: `level 1.5` (chưa dựng) → bản đồ; `level 1.2` đang khóa → giữ; `story after-1.4` khi 1.4 chưa có sao → bản đồ; `story abc` → bản đồ; level hỏng → bản đồ.
  - Level hỏng có `status: "broken"`, không chặn level sau đã dựng.
- `build-story.test.ts`: `after-1.4` theo đúng thứ tự log → lore (`KTS-03`) → thẻ "THÀNH PHẦN 4/6: Dữ liệu sinh trắc" → 4 nhịp `outro_beats`; level không có `component`/`outro_beats` chỉ còn log + lore; id lạ → `null`.

## Validation
```bash
npx vitest run src/storage src/story
npm run typecheck
```

## Risks
- Hai tab cùng hồ sơ: `markStorySeen` ghi cả object progress từ bộ nhớ của tab đó, giống `updateLevel` hiện nay (người ghi sau thắng). Chấp nhận như luật D7 đã có; hợp tập không cứu được trường hợp này nhưng mất mát chỉ là phải xem lại một đoạn.
- `forward()` phải dừng: mỗi bước đi tới level sau theo thứ tự hoặc tới bản đồ, nên không lặp vô hạn; thêm giới hạn 20 bước cho chắc.

## Rollback
Hoàn tác storage (trường tùy chọn, dữ liệu đã ghi vẫn đọc được bởi bản cũ vì bản cũ bỏ qua khóa lạ); xóa `progression.ts`, `build-story.ts`.

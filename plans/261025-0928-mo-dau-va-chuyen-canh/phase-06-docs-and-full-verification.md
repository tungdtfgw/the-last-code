---
phase: 6
title: "Tài liệu và chạy toàn bộ kiểm thử"
status: completed
priority: P2
effort: "1h"
dependencies: [5]
---

# Phase 6: Tài liệu và chạy toàn bộ kiểm thử

## Goal
`CLAUDE.md` và `README.md` mô tả đúng luồng mới; toàn bộ test qua.

## Files
Sửa:
- `CLAUDE.md`:
  - Mục Project: không còn "vào thẳng 1.4"; nêu vỏ game và thêm `design/gdd-mo-dau.md` + contract `plans/reports/brainstorm-261025-0928-mo-dau-va-cot-truyen-chuong-1.md` vào danh sách nguồn (GDD chung giờ ở `design/gdd.md`).
  - Architecture: mục mới **Shell and routing** (route hash, `Shell` trong `app.tsx`, `guardRoute`, push/replace); mục **Story** (`src/story/`: `chapter-1.json`, `validate-chapter.ts`, `progression.ts` là nơi duy nhất quyết định mở khóa và đích TIẾP TỤC, `build-story.ts`, `cutscene-reducer.ts`; luật "level đã dựng"); **Levels are data** thêm `location`, `component`, `outro_beats` và việc phải thêm id vào `chapter.levels`; **Storage boundary** thêm `getStory`/`markStorySeen`, trường `story` trong `progress:v1`, hợp tập; **UI, intro and audio**: `useAudio` ở `App`, `gestured`, màn chờ đoạn truyện, `M` toàn cục, `pulse`/`glitch`, chặn 400 ms ở gate sau đoạn truyện.
  - E2E notes: dùng `gotoLevel(page, id)` hoặc `page.goto(LEVEL_URL)` + `enterMission(page)`; `/` giờ là màn tiêu đề.
- `README.md`: tiêu đề và đoạn mở không còn "prototype Level 1.4" đơn thuần; thêm luồng (tiêu đề → mở đầu → level → chuyển cảnh → Bản đồ), các URL `#/…` để vào thẳng; mục Cấu trúc thêm `src/story/` và `src/shell/`.

Không sửa `design/*.md`. Chỉ thêm vào `docs/nhat-ky-loi-prototype-1-4.md` nếu trong lúc làm có lỗi mới đáng ghi (theo đúng định dạng bảng triệu chứng / nguyên nhân / xử lý).

## Steps
1. Đọc lại hai file, sửa phần bị ảnh hưởng, kiểm mọi đường dẫn nhắc tới đều tồn tại.
2. Chạy toàn bộ kiểm thử.
3. Đối chiếu bảng AC trong `plan.md`, cập nhật `status` của plan và các phase.

## Validation
```bash
npm run typecheck && npm test && npm run test:py
npm run build
npm run test:e2e        # ~7 phút, chromium + firefox + mobile-chromium
ls design/gdd-mo-dau.md design/gdd.md plans/reports/brainstorm-261025-0928-mo-dau-va-cot-truyen-chuong-1.md src/story src/shell
```

## Risks
- Firefox: `history.replaceState` và `hashchange` hoạt động như Chromium; nếu spec Firefox lỗi riêng, kiểm thứ tự cập nhật state trong `use-hash-route.ts` trước.

## Rollback
Hoàn tác hai file tài liệu.

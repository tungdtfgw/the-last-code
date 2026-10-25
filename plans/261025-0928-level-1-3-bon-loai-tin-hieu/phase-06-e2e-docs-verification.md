---
phase: 6
title: "E2E 1.3 → 1.4, tài liệu, kiểm toàn bộ"
status: completed
priority: P1
effort: "2h"
dependencies: [5]
---

# Phase 6: E2E 1.3 → 1.4, tài liệu, kiểm toàn bộ

## Goal
Một e2e chơi 1.3 từ màn "VÀO NHIỆM VỤ" tới 3 sao rồi đi qua `after-1.3` vào màn "VÀO NHIỆM VỤ" của 1.4. Tài liệu kiến trúc nêu hai mở rộng schema. Mọi bộ test qua.

## Context
- Hợp đồng mục 7 (mỗi level một e2e chơi tới 3 sao; chơi được từ đoạn chuyển cảnh trước tới đoạn sau). GDD 1.3 mục 11, 12.
- `tests/e2e/helpers.ts` sau plan vỏ game: `gotoLevel(page, id)`, `enterMission` (chờ `data-armed`), `replaceEditableCode(page, text, fromLine)`, `runAndWait`. `tests/e2e/story-flow.spec.ts` (mẫu đi qua đoạn truyện bằng `Esc`), `tests/e2e/level-1-4.spec.ts` (mẫu bỏ qua khi offline).
- `CLAUDE.md` mục "Levels are data", `docs/nhat-ky-loi-prototype-1-4.md`.

## Files
Tạo:
- `tests/e2e/level-1-3.spec.ts`, một test:
  1. `gotoLevel(page, "1.3")` (level khóa vẫn vào được bằng liên kết); thấy "Ga Ngầm Số 3" trên màn chờ; `enterMission`; `waitForPythonReady`.
  2. `replaceEditableCode(page, SOLUTION_13_3STAR, 3)` (dòng khóa là dòng 2), `runAndWait`.
  3. Hộp kết quả: 3 sao, "Đã thu: Khuôn kiểu"; terminal có `> ma_phien = "7351"`; ô mô phỏng có "KHỚP KHUÔN".
  4. Bấm TIẾP TỤC → URL `#/story/after-1.3`, thấy chữ `outro` của 1.3; `Esc` (bỏ cả đoạn) → URL `#/level/1.4`, nút "VÀO NHIỆM VỤ" hiện (không bấm).
  - Bỏ qua khi offline như `level-1-4.spec.ts`.

Sửa:
- `tests/e2e/helpers.ts`: hằng `SOLUTION_13_3STAR` (thân từ dòng 3 của `tests/fixtures/solutions/1.3/three-star.py`).
- `CLAUDE.md`, mục "Levels are data": một câu: mục tiêu có thể là `"type"` (biến phải giữ chính một hình dạng, kỳ vọng là tên kiểu), và giá trị `inputs` của test là chuỗi/số/bool (hiện theo cú pháp Python; `2.0` thành `int` qua JSON).
- `docs/nhat-ky-loi-prototype-1-4.md` mục 6 "Giới hạn còn lại": một dòng về `2.0` trong đầu vào. Chỉ thêm mục lỗi khi gặp lỗi thật lúc làm.
- `plan.md`: cập nhật `status` các phase.

## Steps
1. Viết spec, chạy chromium rồi mobile-chromium.
2. Sửa tài liệu.
3. Chạy toàn bộ (cổng 4173 phải trống; kiểm `lsof -i :4173` trước, không dừng tiến trình của người dùng).

## Validation
```bash
npx playwright test tests/e2e/level-1-3.spec.ts --project=chromium
npx playwright test tests/e2e/level-1-3.spec.ts --project=mobile-chromium
npm run typecheck
npm test
npm run test:py
npm run test:py:3.14
npm run build
npm run test:e2e          # khoảng 7 phút; 1.4 và luồng truyện phải qua không sửa kỳ vọng
```

## Risks
- Trên mobile-chromium, editor nằm sau tab "Mã" và kết quả sau tab "Mô phỏng": helper `showTab` lo; kiểm "KHỚP KHUÔN" sau `showTab(page, "Mô phỏng")`.
- `Esc` trên đoạn truyện có thể đến trước khi trình chạy gắn phím: dùng `expect(...).toPass()` như `enterMission`.
- Spec `story-flow` của vỏ game có thể giả định level đã dựng đầu tiên hay số nút bản đồ; nếu nó đỏ vì có thêm 1.3 thì sửa kỳ vọng đó theo luật "level đã dựng" (đây là thay đổi đúng, không phải lỗi).

## Rollback
Xóa spec và hằng; hoàn tác hai dòng tài liệu.

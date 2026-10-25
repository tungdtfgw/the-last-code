---
title: "ECHO và gợi ý thành khung chat nổi"
description: "Cột trái chỉ còn Nhiệm vụ + Mục tiêu; ECHO và Nhật ký gợi ý chuyển vào nút nổi, bong bóng xem trước và khung chat không chặn."
status: completed
priority: P2
effort: 4h
tags: [frontend, ui, a11y]
blockedBy: []
blocks: []
created: 2026-10-25
---

# ECHO chat popup

Hợp đồng: `plans/reports/brainstorm-261025-1333-echo-chat-popup.md` (Outcome, thiết kế, constraints, non-goals, 7 acceptance criteria). Không mở lại các quyết định đó.

## Phases

| # | Phase | Status | Depends |
|---|---|---|---|
| 1 | [Lịch sử chat + trạng thái chưa đọc (logic thuần)](phase-01-chat-state.md) | completed | – |
| 2 | [Giao diện nút, bong bóng, khung chat; bố cục cột trái](phase-02-chat-ui.md) | completed | 1 |
| 3 | [E2E (viết, không chạy), ảnh chụp, tài liệu, báo cáo](phase-03-verify-docs.md) | completed | 2 |

## Acceptance (rút gọn từ hợp đồng)

1. 1280×800, 4 level: cột trái chỉ có Nhiệm vụ + Mục tiêu, đọc hết.
2. Bong bóng hiện câu `entry` sau intro, câu phản ứng sau mỗi lượt; chấm chưa đọc đúng.
3. Khung chat: mọi câu ECHO của phiên theo thứ tự + gợi ý đã mở; mở gợi ý tăng `hintsOpened`, tải lại vẫn thấy.
4. Khung không chặn gõ code/CHẠY; `E` mở, Esc đóng, focus đúng.
5. 360×740: nút không che CHẠY/thanh tab; tấm trượt đóng mở được; không cuộn ngang.
6. Giảm chuyển động: không hoạt cảnh.
7. `npm run typecheck`, `npm test`, `npm run build` qua.

## Verification

`npm run typecheck && npm test && npm run build`; ảnh Playwright headless trên dev server :5173 (không chạy e2e).

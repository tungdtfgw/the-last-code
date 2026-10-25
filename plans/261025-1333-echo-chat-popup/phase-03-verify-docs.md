# Phase 3: kiểm chứng, e2e, tài liệu

## Steps
1. Sửa e2e tham chiếu panel cũ: `tests/e2e/intro.spec.ts` (`.echo-portrait.is-asleep` → nút ECHO ngủ; `.echo-line` → bong bóng), `edge-cases.spec.ts` (`.echo .sr-only` → `.echo-live`; câu hiện đủ ở bong bóng), `level-1-4.spec.ts` (`.echo .sr-only`; gợi ý mở trong khung chat), helper `openEchoChat` trong `helpers.ts`. Thêm `tests/e2e/echo-chat.spec.ts`: bong bóng sau entry, `E` mở / Esc đóng / focus, gợi ý mở trong khung. **Không chạy.**
2. `npm run typecheck`, `npm test`, `npm run build`.
3. Ảnh Playwright headless (dev server :5173 có sẵn) cho 4 level ở 1280×800 và 360×740 (cả `reducedMotion: "reduce"`), khung đóng và mở; đọc ảnh và sửa bố cục. Script/ảnh ở scratchpad `chat/`.
4. Cập nhật `design/gdd.md` §4.1/§4.7, CLAUDE.md mục UI.
5. Báo cáo `plans/reports/cook-261025-1333-echo-chat-popup.md`.

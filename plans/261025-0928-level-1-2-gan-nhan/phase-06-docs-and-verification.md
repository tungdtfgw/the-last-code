---
phase: 6
title: "Tài liệu và chạy toàn bộ kiểm thử"
status: completed
priority: P2
effort: "1h"
dependencies: [5]
---

# Phase 6: Tài liệu và kiểm thử toàn bộ

## Goal
Tài liệu mô tả đúng hai thứ chung mới (`var_history`, `value_is_label`) và mô phỏng ki-ốt; mọi bộ test xanh; 1.4 không đổi hành vi.

## Files
Sở hữu:
- `CLAUDE.md` (Architecture): bước 4 harness thêm một gạch "ghi `var_history` (≤ 40 mục, so `is`, có `src`) khi config có `trace_vars`; `build-config.ts` bật cho `kiosk`"; bước 5 thêm `value_is_label`; mục UI nêu `kiosk-timeline.ts` + `kiosk-simulation.tsx` chọn qua `LevelSimulation`. Đọc trước: file đang có thay đổi chưa commit của người dùng, chỉ thêm dòng, không viết lại.
- `design/chuong-1/gdd-1.2-gan-nhan.md`: chỉ hai chỗ cho khớp hợp đồng: mục 15 #10 (NFC: qua lượt cơ bản, trượt phản công, không nối dây) và mục 13 (mục lịch sử có `src`).
- `docs/nhat-ky-loi-prototype-1-4.md`: chỉ khi trong lúc làm gặp lỗi có nguyên nhân đáng ghi (ví dụ tracer, đo Pyodide).
- `plan.md` của plan này: cập nhật `status` từng phase, ghi kết quả đo của phase 2.

## Steps
1. Sửa tài liệu như trên; kiểm mọi liên kết và tên file nhắc tới có thật.
2. Chạy toàn bộ kiểm thử theo thứ tự dưới. Lỗi thì sửa nguyên nhân, không nới test.

## Validation
```bash
npm run typecheck
npm test
npm run test:py
npm run test:py:3.14
npm run build
npx playwright test tests/e2e/level-1-2.spec.ts tests/e2e/level-1-4.spec.ts --project=chromium
npm run test:e2e        # ~7 phút, chạy sau cùng
```

## Acceptance
- Mọi AC trong `plan.md` có bằng chứng (test xanh hoặc ghi chú kiểm tay trong báo cáo phase 5).
- Không còn tiến trình dev/preview do phiên này khởi động (`lsof -i :5173`, `lsof -i :4173`).

## Rollback
Hoàn tác các đoạn tài liệu; không ảnh hưởng code.

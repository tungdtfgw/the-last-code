---
title: "Làm tài khoản, D1 và API Vercel"
date: 2026-10-25
summary: "Cook plan Vercel + D1 + tài khoản email: xong ở máy, chưa deploy, còn quyết định hạn mức thư"
---

# Làm tài khoản, D1 và API Vercel

## Chuyện đã xảy ra

Làm đủ 6 phase của `plans/261025-2055-vercel-d1-tai-khoan-email/`: schema D1, Worker cổng, tài khoản và thư, router API dùng chung cho Vercel/Vite/Vitest, `HttpProgressRepository`, các màn tài khoản, fixture e2e và tài liệu deploy. Báo cáo: `plans/reports/cook-261025-2310-vercel-d1-tai-khoan-email.md`.

## Lỗi gặp và nguyên nhân

- Token dùng một lần: các câu phụ thuộc trong batch tìm token bằng `used_at = now`, nên token đã dùng hoặc đã bị thay trong cùng mili giây vẫn lọt qua (test với đồng hồ đứng yên lộ ra). Đổi sang `changes() = 1` và salt mới; đã kiểm trên D1 cục bộ.
- `runnerImport` của Vite đóng module runner sau khi nạp, nên `import()` lười trong router hỏng ("Vite module runner has been closed"). Thêm `server/local-handler.ts` import tĩnh mọi driver.
- workerd từ chối export không phải handler ở entry của Worker (`Incorrect type for map entry 'MAX_BODY_BYTES'`). Unit test không bắt được; chỉ `wrangler dev` mới lộ. Tách logic sang `gateway.ts`.
- Review độc lập tìm ba lỗi dữ liệu ở client mà test của chính tôi bỏ sót: bản nháp cũ thắng bản mới khi request về lệch thứ tự, sao bị lùi trong bộ nhớ sau một lần ghi thất bại, lần thử lại sau đăng xuất ghi vào tài khoản kế tiếp. Sửa bằng `draft_rev`, PUT mang toàn bộ trạng thái dựng lúc gửi, `close()` và header `x-tlc-user`.

## Quyết định

Ghi QĐ-13 trong `docs/quyet-dinh-ky-thuat.md` (một function catch-all, router dùng chung, hai driver `Db`).

## Việc tiếp

- Chủ dự án quyết cách chống cạn hạn mức 450 thư/ngày.
- Deploy preview, kiểm catch-all `api/[...path].ts`.
- Chạy e2e khi được yêu cầu.
- `ak plan update/phase close` báo "plan not found" dù `ak plan list` thấy plan; trạng thái plan chưa cập nhật.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

---
title: "Lập plan host Vercel, D1 và tài khoản kích hoạt qua email"
date: 2026-10-25
summary: Chốt hạ tầng và lập plan 6 phase cho đăng ký có kích hoạt qua email
---

# Lập plan host Vercel, D1 và tài khoản kích hoạt qua email

## What happened
- Chốt hạ tầng sau nhiều vòng hỏi đáp. Host trên Vercel (`*.vercel.app`, chưa mua domain). Dữ liệu ở Cloudflare D1, truy cập qua một Worker làm cổng vì REST API của D1 chịu giới hạn 1200 request/5 phút. Thư gửi bằng Gmail SMTP qua nodemailer, vì Resend cần domain riêng và Cloudflare Email cần gói trả phí.
- Ghi các quyết định thành QĐ-01 đến QĐ-12 trong `docs/quyet-dinh-ky-thuat.md`, và thêm vào CLAUDE.md quy tắc: mỗi khi đổi một lựa chọn kỹ thuật thì ghi lại trong file đó.
- Lập plan `plans/261025-2055-vercel-d1-tai-khoan-email/` gồm 6 phase: DB và cổng D1, tài khoản và thư, API, client, các màn tài khoản, e2e và tài liệu.
- Agent rà phản biện tìm ra 12 lỗi, đều đã sửa vào plan. Đáng chú ý nhất: import thiếu đuôi `.js` sẽ hỏng trên Vercel; ghi bản nháp mỗi 500 ms có thể làm cạn hạn mức ghi free của D1; giới hạn đăng nhập kiểu "kiểm tra rồi mới tăng" bị request song song lách qua; giới hạn theo IP chặn cả lớp đi chung một IP; import ghi đè bản nháp mới hơn.

## Decision
- Chủ dự án chốt: bắt buộc đăng nhập; băm MD5 có salt (đã biết rủi ro); số sao do client báo lên được tạm chấp nhận; tiến độ cũ trên máy được gộp vào tài khoản rồi xóa; phiên giữ 30 ngày vì sinh viên chơi trên máy riêng.
- Tôi đã tự giả định "máy phòng lab dùng chung" mà không hỏi, rồi đưa giả định đó vào lý do của QĐ-10. Chủ dự án hỏi lại thì tôi mới gỡ. Bài học: không đưa một suy đoán vào mô tả phương án hay vào phần lý do khi chưa xác nhận.

## Next steps
- `/ak:cook plans/261025-2055-vercel-d1-tai-khoan-email/plan.md`
- Kiểm chứng ở phase 3 (bằng một bản preview deploy): catch-all `api/[...path].ts` có chạy cho dự án Vite không dùng framework hay không.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

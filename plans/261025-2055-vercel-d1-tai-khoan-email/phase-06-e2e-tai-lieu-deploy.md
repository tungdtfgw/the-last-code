---
phase: 6
title: "E2E, tài liệu và hướng dẫn deploy"
status: pending
priority: P2
effort: "4h"
dependencies: [5]
---

# Phase 6: E2E, tài liệu và hướng dẫn deploy

## Goal

Các e2e spec có sẵn chạy được khi game bắt buộc đăng nhập; có spec mới cho luồng tài khoản; tài liệu và sổ quyết định khớp với hệ thống mới; có hướng dẫn deploy từng bước. Spec chỉ viết, chạy khi chủ dự án yêu cầu (quy ước của repo).

## Files to Create / Modify

- Create: `tests/e2e/fixtures.ts` (`test` mở rộng từ `@playwright/test`: tự tạo một tài khoản mới đã kích hoạt cho mỗi test và gắn cookie phiên vào `context`; xuất thêm `newSignedInContext(browser)`)
- Create: `tests/e2e/account.spec.ts`
- Modify: mọi `tests/e2e/*.spec.ts` đang `import { test } from "@playwright/test"` → import `test` từ `./fixtures`; các test tự gọi `browser.newContext()` thì dùng `newSignedInContext`
- Modify: `playwright.config.ts` (`webServer.env`: `DB_DRIVER=sqlite`, `SQLITE_PATH=.data/e2e.sqlite`, `MAIL_TRANSPORT=outbox`, `AUTH_RATE_LIMIT=off`, `APP_ORIGIN=http://localhost:4173`; xóa `.data/e2e.sqlite` và `.data/outbox/` trước khi chạy)
- Modify: `tests/e2e/edge-cases.spec.ts`: "two tabs on the same profile" chuyển thành hai tab cùng tài khoản (ghi sau thắng, sao không giảm); test reduced motion (dòng 107) tự tạo context nên dùng `newSignedInContext`
- Modify: `tests/e2e/level-1-4.spec.ts`: test "storage blocked" (khoảng dòng 227–244) đang chờ banner "CHẾ ĐỘ KHÔNG LƯU"; viết lại thành: chặn `localStorage` thì cài đặt tắt tiếng rơi về bộ nhớ, tiến độ vẫn lưu lên server và không có banner. Thêm một test mới: API ghi tiến độ trả 503 liên tục (`page.route`) thì banner hiện. Các test tự tạo context ở khoảng dòng 228, 248, 268 dùng `newSignedInContext`
- Modify: `tests/e2e/intro.spec.ts` (test tự tạo context ở khoảng dòng 75 dùng `newSignedInContext`)
- Create: `docs/huong-dan-deploy.md`
- Modify: `README.md`, `CLAUDE.md`, `design/gdd.md` (dòng 292 và 295 đang ghi Supabase), `docs/quyet-dinh-ky-thuat.md`
- Create: `plans/reports/cook-<YYMMDD-HHMM>-vercel-d1-tai-khoan-email.md` (báo cáo khi làm xong)

## Fixture e2e

- Tạo tài khoản bằng API thật của preview server: `POST /api/auth/register` với username ngẫu nhiên, đọc thư mới nhất gửi tới email đó trong `.data/outbox/`, lấy token từ `link`, `POST /api/auth/activate`, `POST /api/auth/login`, rồi chép cookie `tlc_session` vào `context`.
- Test cũ seed tiến độ bằng `localStorage` qua `addInitScript` vẫn dùng được: khi vào game, tiến độ trên máy được gộp vào tài khoản (QĐ-10). Gộp là idempotent và import không đè bản nháp đã có trên server, nên `addInitScript` chạy lại sau mỗi lần reload không làm mất chỗ test vừa sửa. Ghi chú điều này ở đầu `fixtures.ts`.
- Test cần trạng thái "người mới" đã có sẵn, vì mỗi test có một tài khoản riêng.

## `account.spec.ts`

1. Chưa đăng nhập, mở `/#/level/1.1` thì bị chuyển sang `#/login`.
2. Đăng ký qua UI → màn báo đã gửi thư → mở link trong outbox → "Tài khoản đã kích hoạt" → đăng nhập → thấy màn tiêu đề với username.
3. Đăng nhập khi chưa kích hoạt thì thấy nút "Gửi lại thư kích hoạt", bấm thì outbox có thư mới.
4. Chơi 1.1 tới 1 sao, đăng xuất, mở context mới, đăng nhập cùng tài khoản: bản đồ hiện 1.1 có sao.
5. Máy có tiến độ cũ (seed `localStorage`) → đăng nhập → sao có trên bản đồ, và `localStorage` không còn khóa `the-last-code:progress:v1`.
6. Quên mật khẩu → link reset → đặt mật khẩu mới → mật khẩu cũ bị từ chối, mật khẩu mới vào được; một context đăng nhập từ trước bị đẩy về `#/login` ở lần ghi tiến độ kế tiếp.
7. Màn tài khoản → "Đổi mật khẩu qua email" → outbox có thư reset.
8. Layout không cuộn trang ở 1280×800 và 360×740 trên `#/login` và `#/register`.

## `docs/huong-dan-deploy.md`

1. **Gmail:** tạo một Gmail riêng cho game, bật xác minh 2 bước, tạo App Password.
2. **D1:** `npx wrangler login`; `npx wrangler d1 create the-last-code --location=apac`; chép `database_id` vào `workers/d1-gateway/wrangler.toml`.
3. **Migration:** sao lưu trước bằng `npx wrangler d1 export the-last-code --remote --output=backup-<ngày>.sql` (bỏ qua ở lần đầu khi DB còn trống), rồi `npx wrangler d1 migrations apply the-last-code --remote`.
4. **Worker cổng:** tạo khóa bằng `openssl rand -base64 32`; `npx wrangler secret put GATEWAY_SECRET`; `npx wrangler deploy`; ghi lại URL `*.workers.dev`.
5. **Vercel:** import repo, chọn region `sin1` (đã có trong `vercel.json`), đặt các biến `DB_DRIVER=gateway`, `D1_GATEWAY_URL`, `D1_GATEWAY_SECRET`, `MAIL_TRANSPORT=smtp`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `APP_ORIGIN`; deploy.
6. **Kiểm tra sau deploy:** đăng ký bằng một email thật, nhận thư (xem cả mục Spam), kích hoạt, đăng nhập, chơi 1.1, mở trình duyệt khác đăng nhập lại thấy sao.
7. **Đổi khóa cổng D1:** đặt khóa mới ở Worker và Vercel, rồi redeploy Vercel.
8. **Xử lý sự cố:** thư không tới (App Password sai, chạm hạn mức Gmail), 500 `server_misconfigured` (thiếu biến), lỗi D1 hạn mức ngày (chờ tới 07:00 giờ Việt Nam, tức nửa đêm UTC).

## Tài liệu khác

- `README.md`: mục "Chạy" thêm `npm run dev` (đã có API cục bộ với SQLite và thư ghi ra `.data/outbox/`), mục "Cấu trúc" thêm `server/`, `api/`, `workers/d1-gateway/`, `db/migrations/`, bỏ "thay bằng Supabase sau này", trỏ tới `docs/huong-dan-deploy.md`.
- `CLAUDE.md`: mục Architecture thêm "Accounts and server" (luồng `AccountGate`, router, driver `Db`, cổng D1, các biến môi trường, thư outbox ở local); sửa mục "Storage boundary" (bỏ Supabase, mô tả `HttpProgressRepository` và việc gộp rồi xóa tiến độ cũ); mục E2E notes thêm fixture đăng nhập.
- `design/gdd.md` dòng 292 và 295: thay Supabase bằng Vercel + D1, trỏ tới `docs/quyet-dinh-ky-thuat.md`.
- `docs/quyet-dinh-ky-thuat.md`: ghi kết quả kiểm tra catch-all của Vercel (phase 3) và mọi quyết định mới phát sinh khi làm.

## Verification

- `npm run typecheck`, `npm test`, `npm run test:py`, `npm run build`
- `npx playwright test tests/e2e/account.spec.ts --project=chromium` **chỉ khi chủ dự án yêu cầu chạy e2e**
- Đọc lại từng lệnh trong `docs/huong-dan-deploy.md` so với `wrangler.toml`, `vercel.json` và `server/config.ts`

---
title: "Host Vercel, CSDL D1, tài khoản kích hoạt qua email"
description: "Đưa game lên Vercel kèm API, lưu tài khoản và tiến độ trong Cloudflare D1 qua một Worker làm cổng, đăng ký có link kích hoạt và đổi mật khẩu qua Gmail SMTP."
status: pending
priority: P1
effort: 28h
branch: main
tags: [feature, infra, backend, database, auth, frontend]
blockedBy: []
blocks: []
created: 2026-10-25
mode: hard
---

# Plan: Host Vercel, CSDL D1, tài khoản kích hoạt qua email

## Kết quả cần đạt

Game chạy ở `<ten-game>.vercel.app`. Người chơi phải đăng nhập mới chơi được. Họ đăng ký bằng username, mật khẩu và email, bấm link trong thư để kích hoạt, rồi đăng nhập bằng username và mật khẩu. Tiến độ (sao, bản nháp, số lần chạy, gợi ý, đoạn truyện đã xem) lưu ở D1 và theo tài khoản sang mọi máy. Quên mật khẩu hoặc muốn đổi mật khẩu thì nhận link qua email.

Mọi quyết định công nghệ đã chốt nằm trong `docs/quyet-dinh-ky-thuat.md` (QĐ-03 đến QĐ-11). Plan không tranh luận lại các quyết định đó.

## Scope Challenge

- **Code dùng lại được:** interface async `ProgressRepository`, các hàm thuần `mergeLevelProgress`, `mergeStory`, `sanitize*` (dùng chung client và server), banner "CHẾ ĐỘ KHÔNG LƯU" (tái dùng khi ghi lên server thất bại), định tuyến hash `parseRoute` / `guardRoute`.
- **Phạm vi yêu cầu (giữ nguyên, HOLD SCOPE):** host Vercel; D1; mail Gmail SMTP; đăng ký, kích hoạt, đăng nhập; quên và đổi mật khẩu qua email; `HttpProgressRepository`; gộp tiến độ cũ trên máy.
- **Thêm vào vì bắt buộc cho phạm vi trên (không phải tính năng mới):** Worker cổng D1 (QĐ-08), giới hạn số lần thử và số thư (không có thì bị dò mật khẩu và cạn hạn mức Gmail 500 thư/ngày), SQLite cục bộ cho dev/test (để test chạy không cần tài khoản Cloudflare).
- **Không làm:** bảng xếp hạng, chấm sao phía server, đăng nhập Google, mua domain, đổi email, xóa tài khoản, trang quản trị.
- **Độ phức tạp:** khoảng 35 file mới hoặc sửa, 6 phase. Nhiều hơn ngưỡng 8 file vì có ba tầng thật (Worker, API, client); mỗi tầng giữ ở mức tối thiểu.

## Kiến trúc

```
Trình duyệt (Vite build, hash route)
   │  fetch /api/*  (cookie phiên HttpOnly, cùng domain)
   ▼
Vercel Function  api/[...path].ts  → server/router.ts
   │   ├─ server/auth/*      đăng ký, kích hoạt, đăng nhập, quên/đổi mật khẩu, phiên
   │   ├─ server/progress/*  đọc/ghi tiến độ, nhập tiến độ cũ
   │   └─ server/mail/*      nodemailer → smtp.gmail.com:465
   │  Db.batch([{sql, params}])
   ▼
Db driver ── production: GatewayDb ── HTTPS + Bearer ──▶ Worker d1-gateway ──▶ D1
          └─ dev/test:  SqliteDb (node:sqlite, file .data/*.sqlite)
```

- Toàn bộ API là một Vercel Function catch-all, nên chỉ có một function và một chỗ định tuyến.
- Handler viết theo kiểu Web `Request → Response`. Cùng một handler chạy trên Vercel, trong Vite dev/preview (plugin nhỏ ở phase 3) và trong Vitest.
- SQL giữ ở dạng SQLite chung cho D1 và `node:sqlite`. Thư mục migration duy nhất là `db/migrations/`.

## Phases

| # | Phase | Ưu tiên | Công | Phụ thuộc | Trạng thái |
|---|---|---|---|---|---|
| 1 | [CSDL và Worker cổng D1](./phase-01-csdl-va-cong-d1.md) | P1 | 4h | – | pending |
| 2 | [Tài khoản và gửi thư (server)](./phase-02-tai-khoan-va-gui-thu.md) | P1 | 6h | 1 | pending |
| 3 | [API tiến độ, router, chạy trên Vercel và Vite](./phase-03-api-router-vercel.md) | P1 | 4h | 2 | pending |
| 4 | [Client: tài khoản, HttpProgressRepository, gộp tiến độ cũ](./phase-04-client-tai-khoan-va-tien-do.md) | P1 | 5h | 3 | pending |
| 5 | [Màn đăng nhập, đăng ký, kích hoạt, mật khẩu](./phase-05-man-tai-khoan.md) | P1 | 5h | 4 | pending |
| 6 | [E2E, tài liệu và hướng dẫn deploy](./phase-06-e2e-tai-lieu-deploy.md) | P2 | 4h | 5 | pending |

## Tiêu chí nghiệm thu

1. Đăng ký với username, mật khẩu, email hợp lệ thì nhận được thư có link `/#/activate/<token>`. Chưa bấm link thì đăng nhập bị từ chối kèm nút gửi lại thư.
2. Bấm link một lần thì tài khoản được kích hoạt. Link dùng lại hoặc quá 24 giờ thì báo hết hạn.
3. Đăng nhập đúng thì vào màn tiêu đề. Chưa đăng nhập thì mọi route trong game chuyển về màn đăng nhập.
4. Tiến độ ghi khi chơi được lưu ở server: đăng nhập ở trình duyệt khác thấy đúng sao, bản nháp và đoạn truyện đã xem.
5. Máy có tiến độ cũ trong `localStorage` thì lần vào game đầu tiên sau khi đăng nhập gộp vào tài khoản (sao lấy cao hơn, đoạn truyện hợp hai tập), sau đó `localStorage` không còn tiến độ.
6. "Quên mật khẩu" trên màn đăng nhập và "Đổi mật khẩu" trên màn tài khoản đều gửi link `/#/reset/<token>` (hạn 1 giờ, dùng một lần). Đặt mật khẩu mới xong thì mọi phiên cũ bị đăng xuất.
7. Sai mật khẩu 10 lần trong 15 phút thì username đó bị khóa đăng nhập 15 phút. Mỗi email chỉ nhận tối đa 1 thư mỗi phút và 5 thư mỗi ngày. Toàn hệ thống dừng gửi khi đã gửi 450 thư trong ngày.
8. DB chỉ chứa `md5(salt + mật khẩu)` với salt riêng mỗi user; token và id phiên chỉ lưu bản băm SHA-256.
9. Worker cổng D1 từ chối mọi request không có đúng khóa bí mật.
10. `npm run typecheck`, `npm test`, `npm run test:py`, `npm run build` đều qua. Có e2e spec cho luồng tài khoản (chỉ viết, chạy khi chủ dự án yêu cầu).

## Rủi ro chính

- **Catch-all `api/[...path].ts` trên Vercel cho dự án không dùng framework** `[UNVERIFIED]`: kiểm tra ở phase 3 bằng `vercel dev` hoặc một bản preview deploy. Phương án lui: rewrite `/api/(.*)` sang `/api/index` và đọc đường dẫn gốc trong `server/router.ts`.
- **Độ trễ:** Vercel Function đặt ở `sin1` (Singapore), D1 tạo với location hint `apac`. Mỗi request API có hai chặng mạng.
- **Hạn mức Gmail khoảng 500 thư/ngày:** giới hạn 450 thư/ngày ở tiêu chí 7, kèm thông báo rõ cho người chơi.
- **Import ESM trên Vercel:** Vercel biên dịch từng file và không thêm đuôi cho import, nên import thiếu `.js` chạy local được nhưng hỏng khi deploy. Phase 1 đặt quy ước đuôi `.js` kèm test quét import; phase 3 xác nhận bằng một bản preview deploy.
- **Hạn mức ghi của D1 (100 nghìn dòng/ngày) và Workers (100 nghìn request/ngày):** nếu ghi bản nháp sau mỗi 500 ms thì một lớp có thể dùng gần hết trong một buổi. Phase 4 gom bản nháp, mỗi level tối đa một lần ghi mỗi 10 giây.
- **MD5** (QĐ-07): rủi ro đã được chủ dự án chấp nhận.

## Red Team Review

Một agent rà phản biện (25/10/2026) theo bốn góc: giả định, chỗ dễ hỏng, thiếu phạm vi, bảo mật. Agent đã đối chiếu với code và chạy thử `node:sqlite` cùng câu upsert. 12 phát hiện, tất cả đã sửa vào các phase trừ một điểm cần chủ dự án quyết định.

| # | Mức | Phát hiện | Sửa ở |
|---|---|---|---|
| 1 | major | Import thiếu đuôi `.js` sẽ hỏng trên Vercel (`ERR_MODULE_NOT_FOUND`) | phase 1 (quy ước + test), phase 3 (preview deploy) |
| 2 | major | Giới hạn body đếm ký tự, giới hạn thật tính byte; 4xx làm mất bản nháp im lặng; `keepalive` giới hạn tổng | phase 3, phase 4 |
| 3 | major | Bản nháp lúc đóng tab xếp sau hàng đợi nên bị mất; response cũ đè bản nháp mới trong bộ nhớ | phase 4 |
| 4 | major | Ghi bản nháp mỗi 500 ms có thể cạn hạn mức ghi free của D1 trong một buổi học | phase 4, rủi ro |
| 5 | major | Giới hạn đăng nhập "kiểm tra rồi mới tăng" bị request song song lách qua | phase 2 |
| 6 | major | Giới hạn đăng ký 20/giờ theo IP chặn cả lớp đi chung một IP (wifi trường) | phase 2 (bỏ giới hạn theo IP) |
| 7 | major | Import ghi đè bản nháp mới hơn trên server bằng bản cũ trên máy | phase 3 (`COALESCE`), phase 6 |
| 8 | minor | Import có thể vượt 20 câu mỗi batch; 4xx lặp lại ở mọi lần khởi động | phase 1 (64 câu), phase 3 (`json_each`, giới hạn), phase 4 |
| 9 | minor | Tải lại trang kích hoạt thì bị báo "link hết hạn" | phase 2 (`alreadyActive`), phase 5 |
| 10 | minor | Thiếu các e2e spec sẽ hỏng; tiêu chí 9 không có test tự động | phase 1 (test Worker), phase 6 |
| 11 | minor | Agent giả định máy dùng chung (giả định này do tôi đưa vào lý do QĐ-10, chủ dự án chưa nói): cookie 30 ngày và token nằm trong lịch sử trình duyệt | phase 5 (xóa token khỏi hash). Chủ dự án xác nhận máy riêng nên giữ phiên 30 ngày (QĐ-12) |
| 12 | minor | So khóa khác độ dài làm Worker trả 500; đăng ký trùng song song trả 500 | phase 1, phase 2 |

## Validation Log

### Session 1 (25/10/2026, trước khi viết phase)

- Chơi khách: **bắt buộc đăng nhập** (QĐ-09).
- Truy cập D1: **Worker làm cổng** (QĐ-08).
- Sau khi gộp tiến độ cũ: **xóa bản trên máy** (QĐ-10).
- Chấm sao: **tạm chấp nhận số sao client báo lên** (QĐ-11).

### Session 2 (25/10/2026, sau red team)

- Sinh viên chơi trên **máy riêng**; phiên giữ **30 ngày** (QĐ-12). Sửa lý do QĐ-10 vì câu cũ dựa trên giả định máy lab chưa được xác nhận.

### Verification Results

- Claims checked: 22 (agent red team đối chiếu code, kèm hai lần chạy thử `node:sqlite` và câu upsert)
- Verified: 10 | Failed: 0 | Đã sửa vào plan: 12 phát hiện
- Tier: Full (6 phase)

### Whole-Plan Consistency Sweep

- Đã rà lại các con số đổi sau red team: giới hạn câu mỗi batch (64), giới hạn body (16/256/512 KB, đo bằng byte), bỏ giới hạn theo IP, `alreadyActive`, `COALESCE` cho import. Không còn chỗ nào ghi số cũ.
- Không còn mâu thuẫn chưa giải quyết.

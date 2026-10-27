---
phase: 2
title: "Tài khoản và gửi thư (server)"
status: pending
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: Tài khoản và gửi thư (server)

## Goal

Viết logic phía server cho đăng ký, kích hoạt, gửi lại thư, đăng nhập, đăng xuất, phiên, quên và đổi mật khẩu, giới hạn số lần thử, và gửi thư qua Gmail SMTP. Phần này chưa gắn HTTP; mọi hàm nhận `Db` và `Mailer` qua tham số để test được với SQLite.

## Files to Create / Modify

- Create: `server/auth/password.ts` (MD5 có salt, so khớp `timingSafeEqual`)
- Create: `server/auth/tokens.ts` (sinh token, băm SHA-256)
- Create: `server/auth/validate.ts` (luật username, email, mật khẩu)
- Create: `server/auth/accounts.ts` (đăng ký, kích hoạt, gửi lại, đăng nhập, quên/đổi mật khẩu)
- Create: `server/auth/sessions.ts` (tạo, đọc, thu hồi phiên; dựng header `Set-Cookie`)
- Create: `server/auth/rate-limit.ts`
- Create: `server/mail/mailer.ts` (interface `Mailer`, `SmtpMailer` bằng nodemailer, `OutboxMailer` ghi file JSON)
- Create: `server/mail/templates.ts` (thư kích hoạt, thư đặt lại mật khẩu; tiếng Việt)
- Create: `server/auth/accounts.test.ts`, `server/auth/rate-limit.test.ts`
- Modify: `package.json` (thêm `nodemailer`, `@types/nodemailer`)

## Luật dữ liệu

- **Username:** trim, chuyển chữ thường, khớp `^[a-z0-9_]{3,20}$`.
- **Email:** trim, chữ thường, tối đa 254 ký tự, khớp một regex đơn giản `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- **Mật khẩu:** 8 đến 72 ký tự. Không có luật nào khác.
- **Băm mật khẩu (QĐ-07):** `md5(salt + password)` dạng hex bằng `node:crypto`. Salt là 16 byte ngẫu nhiên. Đặt hàm trong một file riêng để sau này đổi thuật toán chỉ phải sửa một chỗ.
- **Token trong link:** 32 byte ngẫu nhiên, mã base64url (43 ký tự, khớp `ROUTE_ID` của `src/shell/route.ts`). DB chỉ lưu `sha256(token)`.
- **Hạn token:** kích hoạt 24 giờ, đặt lại mật khẩu 1 giờ, cả hai dùng một lần. Khi phát token mới cùng mục đích thì token cũ của user đó bị đánh dấu đã dùng.
- **Phiên:** id 32 byte ngẫu nhiên trong cookie `tlc_session`, DB lưu `sha256(id)`, hạn 30 ngày. Cookie có `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`. Riêng `Secure` bỏ đi khi chạy trên `http://localhost` (dev và e2e).

## Hàm và hành vi

| Hàm | Hành vi |
|---|---|
| `register(db, mailer, {username, email, password}, origin)` | Kiểm tra dữ liệu. Trong **một batch**: xóa tài khoản trùng username hoặc email nếu nó **chưa kích hoạt quá 7 ngày**, rồi `INSERT … ON CONFLICT DO NOTHING RETURNING id`. Không có dòng trả về thì đọc lại xem trùng cột nào và trả `username_taken` / `email_taken` (hai người đăng ký cùng lúc cũng ra lỗi này, không ra 500). Thành công: phát token `activate`, gửi thư. |
| `activate(db, token)` | Token đúng, đúng mục đích, chưa dùng, chưa hết hạn thì ghi `activated_at` và đánh dấu token đã dùng, trả `{ok}`. Token là token `activate` **đã dùng** của một tài khoản đã kích hoạt thì trả `{ok, alreadyActive: true}` (người chơi tải lại trang hoặc bấm link hai lần không bị báo "hết hạn"). Còn lại: `token_invalid` (không phân biệt hết hạn với sai). |
| `resendActivation(db, mailer, usernameOrEmail, origin)` | Luôn trả thành công cho phía gọi. Chỉ gửi thư khi tài khoản tồn tại và chưa kích hoạt. |
| `login(db, {username, password})` | **Tăng bộ đếm `login:<username>` trước** (một câu, `RETURNING count`), vượt 10 thì từ chối ngay mà không kiểm tra mật khẩu. Nhờ vậy gửi song song hàng trăm request cũng chỉ thử được 10 mật khẩu. Sai username hoặc mật khẩu đều trả `bad_credentials`. Đúng mà chưa kích hoạt thì trả `not_activated` (kèm email đã che, ví dụ `t***@gmail.com`). Đúng thì tạo phiên và xóa bộ đếm thất bại. |
| `logout(db, sessionId)` | Xóa phiên. |
| `currentUser(db, sessionId)` | Trả `{id, username, email}` hoặc null. Xóa phiên hết hạn khi gặp. |
| `requestPasswordReset(db, mailer, usernameOrEmail, origin)` | Luôn trả thành công. Chỉ gửi thư `reset` khi tài khoản tồn tại **và đã kích hoạt**. Dùng cho cả "Quên mật khẩu" (người chơi nhập username hoặc email) và "Đổi mật khẩu" khi đã đăng nhập (server tự lấy email của phiên). |
| `resetPassword(db, token, newPassword)` | Token `reset` hợp lệ thì đặt salt và hash mới, đánh dấu token đã dùng, **xóa mọi phiên** của user. |

`origin` là `APP_ORIGIN` (vd `https://ten-game.vercel.app`). Link trong thư: `${origin}/#/activate/<token>` và `${origin}/#/reset/<token>`. Token nằm sau `#` nên không đi vào log của server.

## Giới hạn (`rate-limit.ts`)

Dùng cửa sổ cố định trong bảng `rate_limits`. Mỗi lần kiểm tra là **tăng trước rồi mới xét**: một câu `INSERT … ON CONFLICT(key) DO UPDATE … RETURNING count` (nếu cửa sổ đã qua thì đặt lại `count = 1`), rồi so `count` với giới hạn. Không có bước "đọc rồi mới tăng", nên request song song không lách qua được. Áp dụng như nhau cho mọi khóa bên dưới.

| Khóa | Giới hạn | Khi vượt |
|---|---|---|
| `login:<username>` | 10 lần sai / 15 phút | `too_many_attempts` kèm số phút còn lại |
| `mail:<email>` | 1 thư / 60 giây và 5 thư / ngày (hai khóa) | Không gửi; với `register` vẫn tạo tài khoản và báo người chơi chờ rồi gửi lại |
| `mail-day:<YYYY-MM-DD UTC>` | 450 thư / ngày toàn hệ thống | `mail_quota` – "Hôm nay hệ thống đã gửi quá nhiều thư, bạn thử lại vào ngày mai." |

Không giới hạn theo IP: wifi trường đi ra Internet qua chung một IP công khai, giới hạn theo IP sẽ chặn cả lớp đăng ký trong cùng buổi. Giới hạn theo email và giới hạn 450 thư/ngày đủ để chặn việc lạm dụng gửi thư. Biến `AUTH_RATE_LIMIT=off` tắt giới hạn `mail:<email>` cho e2e. `server/config.ts` (phase 3) chỉ chấp nhận biến này khi `DB_DRIVER=sqlite`, để production không bao giờ tắt được. Giới hạn sai mật khẩu theo username và giới hạn 450 thư/ngày luôn bật.

## Gửi thư

- `SmtpMailer`: `nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })`. Tạo một lần cho mỗi instance. Người gửi `"Mã Cuối Cùng" <GMAIL_USER>`.
- `OutboxMailer`: ghi mỗi thư thành `.data/outbox/<thời điểm>-<to>.json` gồm `{to, subject, text, html, link}`. Dùng cho dev và e2e (`MAIL_TRANSPORT=outbox`). Đây là đường gửi thật của môi trường cục bộ, không phải mock trong test.
- `templates.ts`: mỗi thư có bản text và HTML đơn giản (một đoạn, một nút, link dạng chữ bên dưới, câu "Nếu bạn không yêu cầu, hãy bỏ qua thư này."). Viết lời theo skill `van-viet-tu-nhien`, giọng hướng dẫn.
- Gửi lỗi (SMTP từ chối, mạng): `register` vẫn giữ tài khoản và trả `mail_failed` để UI hiện nút gửi lại; ghi `console.error` không kèm mật khẩu.

## Tasks & Steps

1. Viết `validate.ts`, `password.ts`, `tokens.ts` trước (hàm thuần).
2. Viết `rate-limit.ts` và test cửa sổ (tiêm `now` vào hàm để test không phải chờ).
3. Viết `sessions.ts`: `createSession`, `readSessionCookie(header)`, `sessionCookie(id, {secure})`, `clearSessionCookie()`.
4. Viết `mailer.ts`, `templates.ts`.
5. Viết `accounts.ts` theo bảng hành vi.
6. Viết test với `SqliteDb(":memory:")` và `OutboxMailer` trỏ vào thư mục tạm:
   - đăng ký → thư có link → kích hoạt → đăng nhập được; kích hoạt lần hai bằng cùng token trả `{ok, alreadyActive: true}`; token lạ trả `token_invalid`;
   - hai lệnh đăng ký cùng username chạy song song: một cái thành công, cái kia trả `username_taken`;
   - 30 lần đăng nhập sai gửi song song (`Promise.all`) thì chỉ tối đa 10 lần được kiểm tra mật khẩu;
   - đăng nhập khi chưa kích hoạt trả `not_activated`;
   - token kích hoạt quá 24 giờ bị từ chối (tiêm `now`);
   - tài khoản chưa kích hoạt quá 7 ngày bị thay khi đăng ký lại cùng username;
   - đặt lại mật khẩu: mật khẩu cũ hết dùng được, phiên cũ bị xóa, token reset dùng lại bị từ chối;
   - `requestPasswordReset` với email không tồn tại trả thành công và không gửi thư;
   - sai 10 lần thì lần thứ 11 bị khóa dù mật khẩu đúng;
   - DB không chứa mật khẩu gốc, token gốc hay id phiên gốc (đọc bảng rồi tìm chuỗi gốc).

## Verification

- `npx vitest run server/auth`
- `npm run typecheck`

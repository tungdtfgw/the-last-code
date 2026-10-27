# Hướng dẫn deploy

Game chạy trên Vercel (bản build tĩnh và API ở `api/index.ts`, mọi `/api/*` được rewrite vào đó), dữ liệu nằm ở Cloudflare D1,
Vercel gọi D1 qua Worker cổng `workers/d1-gateway/`, thư gửi bằng Gmail SMTP. Lý do của từng lựa
chọn: `docs/quyet-dinh-ky-thuat.md` (QĐ-03 đến QĐ-13).

```
Trình duyệt ──/api/*──▶ Vercel Function (sin1) ──HTTPS + Bearer──▶ Worker d1-gateway ──▶ D1 (apac)
                              └── smtp.gmail.com:465 (App Password)
```

Làm lần lượt từ bước 1. Bước 7 và 8 dùng khi vận hành.

## 1. Gmail

1. Tạo một tài khoản Gmail riêng cho game (không dùng Gmail cá nhân: lộ App Password là lộ quyền gửi thư của tài khoản đó).
2. Bật xác minh 2 bước cho tài khoản này.
3. Vào <https://myaccount.google.com/apppasswords>, tạo một App Password tên "the-last-code". Chép 16 ký tự, bỏ dấu cách.

Gmail cho gửi khoảng 500 thư/ngày. Server tự dừng ở 450 thư/ngày; thư kích hoạt của tài khoản mới dùng tối đa 300 thư trong số đó, phần còn lại dành cho thư gửi lại và thư đặt lại mật khẩu. Mỗi mạng (một IP) được gửi tối đa 60 yêu cầu đăng ký, gửi lại thư và quên mật khẩu mỗi giờ (QĐ-14).

## 2. Tạo D1

```bash
cd workers/d1-gateway
npm install
npx wrangler login
npx wrangler d1 create the-last-code --location=apac
```

Lệnh `create` in ra `database_id`. Chép nó vào `workers/d1-gateway/wrangler.toml`, thay `REPLACE_WITH_DATABASE_ID`.

## 3. Migration

Sao lưu trước mỗi lần áp migration (bỏ qua ở lần đầu, khi DB còn trống):

```bash
npx wrangler d1 export the-last-code --remote --output=backup-$(date +%y%m%d-%H%M).sql
```

Áp migration (thư mục `db/migrations/`, wrangler ghi các file đã áp vào bảng `d1_migrations`):

```bash
npx wrangler d1 migrations apply the-last-code --remote
```

Giữ file backup ngoài repo (`.gitignore` không chặn `*.sql`).

## 4. Worker cổng D1

```bash
openssl rand -base64 32                     # khóa bí mật chung giữa Worker và Vercel
npx wrangler secret put GATEWAY_SECRET      # dán khóa vừa tạo
npx wrangler deploy
```

Ghi lại URL Worker in ra cuối lệnh `deploy` (dạng `https://the-last-code-d1-gateway.<tài-khoản>.workers.dev`). Lần deploy đầu tiên của một tài khoản, tên miền `workers.dev` mới cần vài phút mới có chứng chỉ HTTPS; trong lúc đó `curl` báo lỗi SSL (mã 35).

Kiểm tra nhanh: request không có khóa phải bị từ chối.

```bash
curl -i -X POST https://the-last-code-d1-gateway.<tài-khoản>.workers.dev/batch   # 401
```

## 5. Vercel

1. Import repo vào Vercel. `vercel.json` đã đặt lệnh build, thư mục `dist` và region `sin1`.
2. Đặt biến môi trường cho Production (và Preview nếu muốn dùng bản preview):

| Biến | Giá trị |
|---|---|
| `DB_DRIVER` | `gateway` |
| `D1_GATEWAY_URL` | URL Worker ở bước 4 |
| `D1_GATEWAY_SECRET` | khóa ở bước 4 |
| `MAIL_TRANSPORT` | `smtp` |
| `GMAIL_USER` | địa chỉ Gmail ở bước 1 |
| `GMAIL_APP_PASSWORD` | App Password ở bước 1 |
| `APP_ORIGIN` | `https://<ten-game>.vercel.app`, không có `/` ở cuối; link trong thư dùng địa chỉ này |

Không đặt `AUTH_RATE_LIMIT` ở Vercel (server bỏ qua biến này khi `DB_DRIVER=gateway`).

3. Deploy. Đổi biến môi trường thì phải redeploy mới có hiệu lực.

## 6. Kiểm tra sau deploy

1. Mở `https://<ten-game>.vercel.app/api/auth/me`: phải trả 401 `{"error":"unauthorized"}`. Nếu trả 404, xem mục "Hàm API trả 404" ở bước 8.
2. Mở game, đăng ký bằng một email thật. Thư kích hoạt phải tới trong vài phút (xem cả mục Spam).
3. Bấm link kích hoạt, đăng nhập, chơi 1.1 tới khi có sao.
4. Mở một trình duyệt khác, đăng nhập cùng tài khoản: bản đồ phải hiện sao của 1.1.
5. Thử "Quên mật khẩu" và đặt mật khẩu mới. Trình duyệt đầu tiên bị đẩy về màn đăng nhập ở lần ghi tiến độ kế tiếp.

## 7. Đổi khóa cổng D1

```bash
openssl rand -base64 32
cd workers/d1-gateway && npx wrangler secret put GATEWAY_SECRET
```

Sửa `D1_GATEWAY_SECRET` trên Vercel rồi redeploy. Giữa hai bước này API báo lỗi 500, nên làm lúc không có lớp nào đang chơi.

## 8. Xử lý sự cố

Log của API xem ở Vercel (Project → Logs). Log của Worker: `cd workers/d1-gateway && npx wrangler tail`.

- **API trả 500 `server_misconfigured`:** thiếu biến môi trường. Log ghi tên biến thiếu (`[api] thiếu biến môi trường: …`), không ghi giá trị.
- **API trả 500 `server_error`, log có `gateway 401`:** khóa ở Vercel và Worker khác nhau. Đặt lại theo bước 7.
- **Log có `gateway unreachable`:** sai `D1_GATEWAY_URL`, hoặc Worker chưa deploy.
- **Thư không tới:** App Password sai hoặc đã bị thu hồi (log có `[mail] gửi thư … thất bại`), thư nằm trong Spam, hoặc đã chạm hạn mức (người chơi thấy "Hôm nay hệ thống đã gửi quá nhiều thư").
- **D1 báo vượt hạn mức ngày:** gói free cho 100 nghìn lượt ghi dòng/ngày. Hạn mức đặt lại lúc nửa đêm UTC, tức 07:00 giờ Việt Nam.
- **Hàm API trả 404:** rewrite `/api/(.*)` → `/api/index` trong `vercel.json` bị mất, hoặc file `api/index.ts` bị đổi tên. Đừng dùng tên kiểu `api/[...path].ts`: ngoài Next.js, Vercel build ra hàm nhưng không định tuyến `/api/auth/me` vào đó (đã thử 27/10/2026).

## Chạy cục bộ

`npm run dev` và `npm run preview` tự có API: SQLite ở `.data/dev.sqlite`, thư ghi thành file JSON trong
`.data/outbox/` (mở file, chép `link` vào trình duyệt để kích hoạt). Không cần tài khoản Cloudflare hay Gmail.

Muốn thử Worker cổng với D1 cục bộ:

```bash
cd workers/d1-gateway
printf 'GATEWAY_SECRET=local-dev-secret\n' > .dev.vars     # .dev.vars đã nằm trong .gitignore
npx wrangler d1 migrations apply the-last-code --local
npx wrangler dev --port 8799
```

Rồi chạy game với `DB_DRIVER=gateway`, `D1_GATEWAY_URL=http://localhost:8799`,
`D1_GATEWAY_SECRET=local-dev-secret`. Thư lúc đó phải đi qua Gmail thật (`MAIL_TRANSPORT=smtp` cùng
`GMAIL_USER`, `GMAIL_APP_PASSWORD`), vì server chỉ nhận outbox khi `DB_DRIVER=sqlite`.

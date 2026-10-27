# Hướng dẫn deploy

Game chạy trên Vercel (bản build tĩnh và API ở `api/index.ts`, mọi `/api/*` được rewrite vào đó), dữ liệu nằm ở Cloudflare D1,
Vercel gọi D1 qua Worker cổng `workers/d1-gateway/`, thư gửi bằng Gmail SMTP. Lý do của từng lựa
chọn: `docs/quyet-dinh-ky-thuat.md` (QĐ-03 đến QĐ-15).

```
Trình duyệt ──/api/*──▶ Vercel Function (sin1) ──HTTPS + Bearer──▶ Worker d1-gateway ──▶ D1 (apac)
                              └── smtp.gmail.com:465 (App Password)
```

Làm lần lượt từ bước 1. Bước 7, 8 và 9 dùng khi vận hành; bước 10 bật trang quản lý kịch bản lần đầu.

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

Áp migration (thư mục `db/migrations/`, wrangler ghi các file đã áp vào bảng `d1_migrations`; lệnh này áp mọi file chưa áp, kể cả `0003_content_text.sql` của trang quản lý kịch bản và các file `*_content_*.sql` mang câu chữ):

```bash
npx wrangler d1 migrations apply the-last-code --remote
```

Giữ file backup ngoài repo (`.gitignore` không chặn `*.sql`).

**Áp migration trước khi deploy code.** Câu chữ người chơi đọc chỉ nằm ở D1 (QĐ-16). Code mới mà D1 thiếu migration câu chữ của nó thì level đó hiện "TÍN HIỆU HỎNG", thiếu câu của chương thì cả game hiện "DỮ LIỆU CHƯƠNG HỎNG". Vì vậy luôn chạy lệnh trên với D1 thật xong rồi mới deploy lên Vercel.

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
| `ADMIN_USERNAMES` | username được vào trang quản lý kịch bản, cách nhau bằng dấu phẩy (ví dụ `tungdt`). Bỏ trống: không ai là admin |

**`ADMIN_USERNAMES`: tạo và kích hoạt tài khoản trước, rồi mới thêm username vào biến, rồi redeploy.** Một tên chưa ai đăng ký nằm trong danh sách là để ngỏ quyền admin cho người đăng ký tên đó trước. Khi khởi động, server ghi cảnh báo `[config] ADMIN_USERNAMES có tên chưa có tài khoản đã kích hoạt: …` vào log.

Không đặt `AUTH_RATE_LIMIT` ở Vercel (server bỏ qua biến này khi `DB_DRIVER=gateway`).

3. Deploy. Đổi biến môi trường thì phải redeploy mới có hiệu lực.

## 6. Kiểm tra sau deploy

1. Mở `https://<ten-game>.vercel.app/api/auth/me`: phải trả 401 `{"error":"unauthorized"}`. Nếu trả 404, xem mục "Hàm API trả 404" ở bước 8.
2. Mở game, đăng ký bằng một email thật. Thư kích hoạt phải tới trong vài phút (xem cả mục Spam).
3. Bấm link kích hoạt, đăng nhập, chơi 1.1 tới khi có sao.
4. Mở một trình duyệt khác, đăng nhập cùng tài khoản: bản đồ phải hiện sao của 1.1.
5. Thử "Quên mật khẩu" và đặt mật khẩu mới. Trình duyệt đầu tiên bị đẩy về màn đăng nhập ở lần ghi tiến độ kế tiếp.
6. Đăng nhập bằng tài khoản admin, vào Tài khoản → "Quản lý kịch bản" (`#/admin`), lưu thử một câu, tải lại game: câu mới phải hiện.

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

## 9. Câu chữ và trang quản lý

Câu chữ người chơi đọc chỉ nằm ở D1 (bảng `content_text`, QĐ-16). `src/levels/*.json` và `src/story/chapter-1.json` chỉ giữ câu đố. Câu ban đầu của mỗi level hay chương vào D1 bằng một migration `db/migrations/*_content_*.sql`; câu của chương 1 và level 1.1–1.4 nằm trong `0004_content_chapter_1.sql`.

- **Sửa câu:** dùng trang `#/admin`. Mỗi lần lưu thành một bản mới; nút "Lịch sử" trên trang cho nạp một bản cũ vào form (bản 1 là câu từ migration), bấm Lưu để khôi phục bản đó. Trang chỉ sửa tài liệu đã có câu trong D1; tài liệu chưa có hiện lỗi "chưa có câu chữ: thêm migration".
- **Level mới:** thêm file JSON câu đố vào `src/levels/` và id vào `chapter-1.json`, rồi viết một tài liệu câu chữ (cùng hình dạng trường như `src/content/text-fields.ts` mô tả, thường để trong `plans/`) và sinh migration:

  ```bash
  npm run content:migration -- plans/<thư-mục>/cau-chu-level-1-5.json --doc level:1.5
  ```

  Lệnh kiểm tài liệu bằng đúng bộ kiểm của trang quản trị (kể cả lộ đáp án của ECHO), in lỗi theo đường dẫn trường và dừng nếu sai; đúng thì ghi `db/migrations/<số kế>_content_level_1_5.sql`. Có thể ghi `"docId": "level:1.5"` trong file thay cho `--doc`. Lệnh từ chối tài liệu đã có migration câu chữ. Commit file SQL cùng file JSON câu đố, áp lên D1 thật (bước 3) rồi mới deploy.
- **Đổi cấu trúc câu đố của level đã có câu** (thêm mục tiêu, thêm hay đổi loại nhịp…): không sinh lại migration, vì câu trên D1 có thể đã được admin sửa. Viết tay một migration vá đúng đường dẫn bằng `json_set`/`json_insert` của SQLite, tăng `revision` và thêm một dòng lịch sử. Ví dụ thêm mục tiêu `moi` vào cuối danh sách mục tiêu của 1.4 (file `db/migrations/0007_content_level_1_4_muc_tieu_moi.sql`):

  ```sql
  UPDATE content_text
  SET text = json_insert(text, '$.objectives[#]', json('{"var":"moi","label":"Mục tiêu mới"}')),
      revision = revision + 1, updated_at = '2026-11-05T00:00:00.000Z', updated_by = 'migration'
  WHERE doc_id = 'level:1.4';
  INSERT INTO content_text_history (doc_id, revision, text, saved_at, saved_by)
  SELECT doc_id, revision, text, updated_at, updated_by FROM content_text
  WHERE doc_id = 'level:1.4' AND updated_at = '2026-11-05T00:00:00.000Z'
  ON CONFLICT(doc_id, revision) DO NOTHING;
  ```

  Đổi một phần tử có sẵn thì dùng `json_set`, ví dụ nhịp đầu của 1.1 đổi sang ECHO: `json_set(text, '$.outro_beats[0].kind', 'echo', '$.outro_beats[0].text', 'Câu mới.')`. Chèn vào giữa một mảng thì ghi lại cả mảng bằng `json_set(text, '$.outro_beats', json('[…]'))`. Mỗi phần tử phải giữ đúng khóa neo của câu đố (`var`/`line` của mục tiêu, `kind` của nhịp, `code` của lỗi thường gặp); lệch neo là level hỏng. Giữa lúc áp migration vá và lúc deploy code mới, level đó hỏng (câu mới không khớp câu đố cũ), nên làm lúc không có lớp nào chơi và deploy ngay sau đó. Trước khi commit, chạy `npm test`: test đọc câu từ mọi migration và kiểm từng level.

## 10. Bật trang quản lý kịch bản (một lần)

Các bước này ra ngoài máy, chủ dự án tự chạy:

1. Sao lưu D1 rồi áp migration (bước 3); kiểm tra `0003_content_text.sql` và `0004_content_chapter_1.sql` đã có trong `d1_migrations`, và `SELECT doc_id, revision, updated_by FROM content_text` trả `chapter:1`, `level:1.1` … `level:1.4` ở bản 1, người lưu `migration`:

   ```bash
   npx wrangler d1 execute the-last-code --remote --command "SELECT doc_id, revision, updated_by FROM content_text"
   ```

2. Tạo và kích hoạt tài khoản admin trên game.
3. Đặt `ADMIN_USERNAMES` trên Vercel (bước 5) cho Preview trước.
4. Deploy một bản preview.
5. Đăng nhập admin trên bản preview, mở `/api/admin/content`: phải trả 200 và liệt kê `chapter:1`, `level:1.1` … `level:1.4`, không tài liệu nào có lỗi. Điều này chứng minh `includeFiles` trong `vercel.json` đã đưa các file JSON vào function. Nếu trả 500 và log có `ENOENT`, dùng cách lùi trong QĐ-15.
6. Mở game trên bản preview: bản đồ phải hiện đủ 1.1–1.4, không có "TÍN HIỆU HỎNG". Lưu thử một câu trên `#/admin`, mở `/api/content/text`: phải thấy bản đó. Rồi khôi phục câu cũ bằng "Lịch sử" (nạp bản 1).
7. Ghi kết quả vào mục "Đã kiểm trên Vercel" của QĐ-15, rồi đặt `ADMIN_USERNAMES` cho Production và redeploy.

## Chạy cục bộ

`npm run dev` và `npm run preview` tự có API: SQLite ở `.data/dev.sqlite`, thư ghi thành file JSON trong
`.data/outbox/` (mở file, chép `link` vào trình duyệt để kích hoạt). Không cần tài khoản Cloudflare hay Gmail.
Server áp các migration còn thiếu (cả migration câu chữ) mỗi lần khởi động, nên sau khi kéo về một migration mới thì khởi động lại `npm run dev`; trước đó level mới hiện "TÍN HIỆU HỎNG".
Muốn có sẵn một tài khoản admin ở máy, tạo file `.env.local` ở gốc repo (đã nằm trong `.gitignore`):

```bash
LOCAL_ADMIN_USERNAME=tungdt
LOCAL_ADMIN_PASSWORD=mat-khau-cua-ban    # 8–72 ký tự
# LOCAL_ADMIN_EMAIL=tungdt@example.com   # tùy chọn, mặc định <username>@local.test
```

Mỗi lần `npm run dev` khởi động, server tạo tài khoản đó (đã kích hoạt, không cần thư) hoặc đặt lại mật khẩu theo file, và cho nó quyền admin; log in ra `[local-admin] tài khoản admin "tungdt" sẵn sàng`. Đăng nhập rồi vào Tài khoản → Quản lý kịch bản. Việc này chỉ chạy với SQLite ở máy: server trên Vercel không đọc `LOCAL_ADMIN_*`. `npm run preview` không đọc `.env.local`, để e2e chỉ thấy biến do Playwright đặt. Biến khác (`ADMIN_USERNAMES`, `MAIL_TRANSPORT`, `GMAIL_*`…) cũng đặt được trong `.env.local` cho `npm run dev`; biến đặt trên dòng lệnh thắng file.

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

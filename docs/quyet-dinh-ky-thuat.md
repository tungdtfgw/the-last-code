# Quyết định kỹ thuật

Sổ ghi các lựa chọn công nghệ đã chốt và lý do. Mỗi khi đổi một lựa chọn, thêm một mục mới ở cuối
(không xóa mục cũ) và sửa dòng "Trạng thái" của mục bị thay thế.

Mẫu một mục: ngày · quyết định · các phương án đã xét · lý do chọn · đánh đổi chấp nhận · khi nào cần xét lại.

---

## QĐ-01 · Frontend: Vite + React + TypeScript, không Next.js

- **Ngày:** 24/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** app là trang tĩnh do Vite build. Python của người chơi chạy bằng Pyodide trong Web Worker, không có máy chủ chạy code.
- **Lý do:** mọi thứ chạy phía client (Pyodide, Web Worker, Web Audio). Next.js chỉ thêm SSR và hydration mà không đem lại gì.

## QĐ-02 · Lưu tiến độ qua một interface duy nhất

- **Ngày:** 24/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** mọi đọc/ghi tiến độ đi qua `ProgressRepository` (`src/storage/`). Hiện có bản `localStorage` và bản bộ nhớ.
- **Lý do:** sau này thay nơi lưu (lên server) mà không sửa UI. Luật gộp `mergeLevelProgress` / `mergeStory` (sao, gợi ý, số lần chạy không giảm; tập đoạn truyện chỉ tăng) dùng lại khi gộp tiến độ cũ vào tài khoản.

## QĐ-03 · Host trên Vercel

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** bản build tĩnh và API (Vercel Functions, Node.js, thư mục `api/`) cùng nằm trên Vercel, tên miền miễn phí `<ten-game>.vercel.app`. Chưa mua domain riêng.
- **Phương án đã xét:**
  - Cloudflare Pages/Workers (`*.pages.dev`): gom được web, API và DB về một chỗ, nhưng gửi Gmail SMTP từ Workers (TCP socket) chưa được kiểm chứng, và gói Workers Free giới hạn 10 ms CPU mỗi request.
  - Vercel: chủ dự án đã quen dùng; Functions là Node.js đầy đủ nên dùng thẳng `nodemailer`.
- **Lý do chọn:** ít rủi ro kỹ thuật nhất cho việc gửi mail, và quen thuộc.
- **Đánh đổi:** DB nằm ở nhà cung cấp khác (xem QĐ-04), thêm một chặng mạng cho mỗi lệnh ghi.

## QĐ-04 · CSDL: Cloudflare D1

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** dữ liệu tài khoản và tiến độ lưu trong Cloudflare D1 (SQLite), gói free.
- **Phương án đã xét:**
  - Supabase: gói free chỉ 2 project đang chạy, project ngủ đông sau 7 ngày không hoạt động (lớp học có tuần nghỉ là hỏng buổi), Pro $25/tháng. Muốn chống ghi sao giả vẫn phải viết function riêng, nên lợi thế "không cần backend" không còn.
  - Neon (Postgres): free nhiều project, tự thức dậy khi có query. Hợp lệ, nhưng chủ dự án chọn D1.
  - D1: free khoảng 5 triệu lượt đọc dòng/ngày, 100 nghìn lượt ghi dòng/ngày, 5 GB; không ngủ đông, không giới hạn số project kiểu Supabase.
- **Lý do chọn:** dữ liệu rất nhỏ (vài trường mỗi người mỗi level), không ngủ đông, $0.
- **Cách truy cập từ Vercel:** D1 chỉ có binding trong Cloudflare Workers. Từ ngoài Cloudflare có REST API, nhưng nó chịu giới hạn chung 1200 request/5 phút cho cả tài khoản, vượt là bị khóa mọi lệnh API trong 5 phút; một lớp cùng chơi có thể chạm mức này. Vì vậy dự kiến đặt một Worker nhỏ làm cổng D1 (binding D1, xác thực bằng khóa bí mật chung với Vercel). Chi tiết chốt trong plan.
- **Đánh đổi:** từ 01/09/2026, vượt hạn mức ngày thì query D1 báo lỗi tới nửa đêm UTC. Thêm một chặng mạng Vercel → Cloudflare.
- **Xét lại khi:** cần truy vấn quan hệ phức tạp hoặc phân tích dữ liệu nghiên cứu nặng (chuyển Postgres), hoặc chuyển host sang Cloudflare.

## QĐ-05 · Gửi mail: Gmail SMTP qua App Password

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** mail kích hoạt tài khoản và mail đổi mật khẩu gửi bằng `nodemailer` qua `smtp.gmail.com` (cổng 465), xác thực bằng App Password của một tài khoản Gmail riêng cho game. App Password lưu trong biến môi trường của Vercel.
- **Phương án đã xét:**
  - Resend: cần domain riêng đã xác minh DNS (SPF/DKIM). `vercel.app`, `pages.dev`, `workers.dev` đều không xác minh được.
  - Cloudflare Email Service: gói free không gửi tới người lạ; gói Paid $5/tháng.
  - Brevo/Mailjet với địa chỉ gửi `@gmail.com`: dễ vào spam.
  - Gmail SMTP: $0, không cần domain, mail đi đúng từ Gmail nên ít vào spam.
- **Lý do chọn:** không cần mua domain, $0.
- **Đánh đổi:** Gmail cá nhân giới hạn khoảng 500 mail/ngày; người nhận thấy địa chỉ `@gmail.com`; lộ App Password là lộ quyền gửi mail của tài khoản đó (vì thế dùng Gmail riêng).
- **Xét lại khi:** mua domain riêng (chuyển sang Resend), hoặc vượt hạn mức gửi.

## QĐ-06 · Tài khoản: username + mật khẩu, email để kích hoạt và đổi mật khẩu

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** đăng ký bằng username, mật khẩu, email. Tài khoản phải bấm link kích hoạt gửi qua email mới đăng nhập được. Đăng nhập bằng username + mật khẩu. Đổi/quên mật khẩu cũng qua link gửi về email.
- **Phương án đã xét:** đăng nhập bằng link email (không mật khẩu), đăng nhập Google, mã lớp do giáo viên phát.
- **Lý do chọn:** chủ dự án muốn tài khoản có mật khẩu quen thuộc.

## QĐ-07 · Băm mật khẩu: MD5 có muối riêng mỗi user

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng (chủ dự án chốt, đã biết rủi ro)
- **Quyết định:** lưu `md5(salt + mật khẩu)` với `salt` ngẫu nhiên riêng cho mỗi user.
- **Phương án đã xét:** scrypt/Argon2 (mặc định của Better Auth), PBKDF2 qua WebCrypto.
- **Lý do chọn:** game học vui, chủ dự án ưu tiên đơn giản.
- **Rủi ro chấp nhận:** nếu DB bị lộ, MD5 đoán ngược được phần lớn mật khẩu rất nhanh; sinh viên dùng lại mật khẩu ở nơi khác sẽ bị ảnh hưởng. Muối chỉ chặn bảng tra có sẵn, không chặn dò thử.
- **Xét lại khi:** có dữ liệu thật của nhiều sinh viên, hoặc có yêu cầu tuân thủ bảo vệ dữ liệu cá nhân. Đổi sang thuật toán mạnh chỉ cần thay hàm băm và băm lại ở lần đăng nhập kế tiếp của từng user.

## QĐ-08 · Vercel truy cập D1 qua một Worker làm cổng

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng (chốt chi tiết cho QĐ-04)
- **Quyết định:** một Cloudflare Worker nhỏ (`workers/d1-gateway/`) gắn binding D1 và nhận đúng một kiểu lệnh: một lô câu SQL có tham số, chạy trong một giao dịch. Chỉ chấp nhận request có khóa bí mật chung với Vercel (`Authorization: Bearer`). Mọi logic (tài khoản, tiến độ) nằm ở Vercel.
- **Phương án đã xét:** REST API của D1 (Cloudflare ghi rõ chỉ hợp cho việc quản trị vì chịu giới hạn chung 1200 request/5 phút, vượt là khóa mọi lệnh API 5 phút).
- **Lý do chọn:** Cloudflare khuyên dùng cách này cho truy cập từ ngoài Workers; Workers Free cho 100 nghìn request/ngày.
- **Đánh đổi:** thêm một thứ phải deploy và giữ bí mật; mỗi truy vấn thêm một chặng mạng.

## QĐ-09 · Bắt buộc đăng nhập để chơi

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** chưa đăng nhập thì chỉ thấy các màn đăng nhập, đăng ký, kích hoạt, quên mật khẩu. Tiến độ chỉ lưu ở server. Cài đặt tắt tiếng vẫn lưu trên máy (là tùy chọn của thiết bị).
- **Phương án đã xét:** cho chơi khách bằng `localStorage`, đăng nhập là tùy chọn.
- **Đánh đổi:** không có mạng hoặc server lỗi thì không chơi được; mọi e2e test phải đăng nhập trước.

## QĐ-10 · Gộp tiến độ cũ trên máy rồi xóa

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** mỗi lần vào game khi đã đăng nhập, nếu máy còn tiến độ trong `localStorage` (người từng chơi bản cũ) thì gộp vào tài khoản bằng luật `mergeLevelProgress` / `mergeStory`, gộp xong thì xóa bản trên máy.
- **Lý do:** tiến độ chỉ còn một nguồn là tài khoản; xóa bản trên máy để lần vào game sau không gộp lại cùng dữ liệu cũ. Sinh viên chơi trên máy riêng (chủ dự án xác nhận 25/10/2026).

## QĐ-11 · Số sao do trình duyệt báo lên, tạm chấp nhận

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** server tin số sao client gửi lên (chỉ kiểm tra khuôn 0–3 và luật không giảm). Người rành devtools có thể ghi sao giả.
- **Xét lại khi:** làm bảng xếp hạng; khi đó phải chấm lại code Python phía server (dự án riêng).

## QĐ-12 · Phiên đăng nhập 30 ngày

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng
- **Quyết định:** cookie phiên sống 30 ngày, không có ô "Ghi nhớ đăng nhập".
- **Lý do:** sinh viên chơi trên máy riêng, không có nguy cơ người sau vào nhầm tài khoản.
- **Xét lại khi:** game được dùng trên máy dùng chung (phòng lab).

## QĐ-13 · API: một Vercel Function và một router dùng chung

- **Ngày:** 25/10/2026 · **Trạng thái:** đang áp dụng; tên file entry đổi ngày 27/10/2026 (xem "Đã kiểm trên Vercel")
- **Quyết định:** toàn bộ `/api/*` đi vào một function `api/index.ts` (rewrite `/api/(.*)` trong `vercel.json`), chuyển cho `server/router.ts` (kiểu Web `Request → Response`). Cùng router đó chạy trong `vite dev` / `vite preview` (plugin `server/vite-api-plugin.ts`) và trong Vitest. CSDL đi qua interface `Db` với hai driver: Worker cổng D1 ở production, `node:sqlite` ở máy (file `.data/*.sqlite`, cùng thư mục migration `db/migrations/`). Thư ở máy ghi ra `.data/outbox/` thay vì gửi.
- **Lý do:** một chỗ định tuyến; dev và e2e chạy đủ luồng tài khoản mà không cần tài khoản Cloudflare hay Gmail; test chạy API thật thay cho mock.
- **Đã kiểm:** handler `export default { fetch }` theo tài liệu Vercel Functions; các luồng tài khoản và tiến độ chạy qua Worker cổng với D1 cục bộ (`wrangler dev`), gồm cả `changes()` trong một batch D1.
- **Đã kiểm trên Vercel (27/10/2026):** tên `api/[...path].ts` không dùng được. Vercel build ra hàm `api/[...path]` nhưng `GET /api/auth/me` trả 404 `NOT_FOUND` của Vercel; kiểu catch-all này chỉ có ở Next.js. Đổi sang `api/index.ts` cùng rewrite thì router vẫn đọc được đường dẫn gốc từ `request.url`: `/api/auth/me` trả 401, `/api/nope` trả 404 `not_found` của router, POST không phải JSON trả 415, một lần đăng nhập sai ghi được dòng `login:<username>` vào D1 qua Worker cổng.
- **Đánh đổi:** import tương đối trong `server/`, `api/` và các file `src/` mà server dùng phải ghi đuôi `.js` (Vercel không tự thêm đuôi); `server/imports.test.ts` kiểm quy ước này.

## QĐ-14 · Giữ hạn mức thư: giới hạn theo mạng và phần thư dành riêng

- **Ngày:** 26/10/2026 · **Trạng thái:** đang áp dụng (chủ dự án chốt)
- **Vấn đề:** plan ban đầu bỏ giới hạn theo IP vì cả lớp dùng chung một IP của wifi trường. Khi đó một người đăng ký khoảng 450 email khác nhau là tiêu hết 450 thư/ngày, và tới hết ngày không ai nhận được thư kích hoạt hay thư đặt lại mật khẩu.
- **Quyết định:**
  - Mỗi mạng (một địa chỉ IPv4, hoặc một khối IPv6 /64) được gửi tối đa 60 yêu cầu đăng ký, gửi lại thư kích hoạt và quên mật khẩu mỗi giờ, gộp chung (`mail-ip:<mạng>`). Server đếm cả khi tài khoản không tồn tại, nên câu trả lời không lộ tài khoản nào có thật. Địa chỉ lấy từ `x-forwarded-for`, header mà Vercel ghi đè nên client không giả được.
  - Thư kích hoạt đầu tiên của tài khoản mới chỉ được dùng tối đa 300 trong 450 thư/ngày (`mail-day-signup:<ngày>`). Ít nhất 150 thư còn lại luôn dành cho thư gửi lại và thư đặt lại mật khẩu.
  - `AUTH_RATE_LIMIT=off` (chỉ có hiệu lực với SQLite ở máy) tắt cả giới hạn theo địa chỉ email lẫn giới hạn theo mạng, để e2e tạo được nhiều tài khoản.
- **Phương án đã xét:** captcha ở màn đăng ký (thêm dịch vụ ngoài, thêm bước cho học sinh); chấp nhận rủi ro rồi theo dõi bộ đếm.
- **Đánh đổi:** một lớp hơn 60 người cùng đăng ký trong một giờ trên cùng mạng sẽ có người phải chờ. Kẻ dùng nhiều IP vẫn tiêu được phần 300 thư của đăng ký, nhưng không chạm được phần dành riêng.

## QĐ-15 · Câu chữ người chơi đọc nằm ở D1, sửa qua trang quản trị

- **Ngày:** 27/10/2026 · **Trạng thái:** đã thay một phần bởi QĐ-16 (28/10/2026): bỏ câu dự phòng trong JSON, `content:export`/`content:import` và `db/content-text-revisions.json`; phần còn lại vẫn áp dụng. `includeFiles` chưa kiểm trên Vercel
- **Vấn đề:** người viết kịch bản muốn sửa briefing, gợi ý, lời ECHO, đoạn kết, tổng kết và đoạn truyện mà không mở JSON, không dùng git và không chờ deploy.
- **Quyết định:**
  - Ranh giới: chỉ câu chữ lên D1 (`content_text`, một dòng mỗi tài liệu `level:<id>` / `chapter:<n>`, kèm `revision`). Phần câu đố (code khởi đầu, test, giá trị mong đợi, cấu trúc mục tiêu, mô phỏng, `forbidden_terms`, loại nhịp và cue, ví dụ code của tổng kết) ở lại `src/levels/*.json` và `src/story/chapter-1.json`, đóng gói như cũ. Trường nào là câu chữ do `src/content/text-fields.ts` mô tả; game, server, CLI và form quản trị cùng dùng mô tả đó, nên level mới không cần code mới.
  - D1 thắng khi đã có dòng; không có dòng thì dùng câu trong JSON. Game ghép câu D1 lên JSON (`applyText`) rồi chạy bộ kiểm như cũ; câu không còn hợp với câu đố làm level hiện "TÍN HIỆU HỎNG".
  - Admin là danh sách username trong biến `ADMIN_USERNAMES` (không thêm cột vai trò). Server kiểm session và danh sách ở mọi request `/api/admin/*` (401/403).
  - Lưu có kiểm revision lạc quan: `PUT` gửi `baseRevision`, ghi có điều kiện trong một batch; bản cũ nhận 409 kèm revision và người lưu mới nhất. Mỗi lần lưu thêm một dòng vào `content_text_history`, giữ toàn bộ lịch sử để khôi phục.
  - Server kiểm câu bằng đúng bộ kiểm của game (`validateLevel`, `validateChapter`, kiểm lộ đáp án của ECHO) trên JSON câu đố của chính bản deploy, đọc bằng `fs` (`server/content/bundled-content.ts`) và đưa vào function bằng `functions.includeFiles` trong `vercel.json`.
  - `npm run content:export` chép câu D1 vào JSON của repo; `npm run content:import` đẩy câu trong repo lên D1, từ chối khi D1 đã có bản mới hơn số ghi ở `db/content-text-revisions.json`.
- **Lý do:** test tích hợp, kiểm lộ đáp án và CI cần câu đố cố định theo commit; một hai người sửa thì đổi danh sách admin bằng redeploy là đủ.
- **Phương án đã xét:** đưa cả tài liệu level lên D1 (bỏ: test và CI phải đọc D1 mới chạy được câu đố); sửa câu qua pull request (bỏ: người viết kịch bản không dùng git).
- **Đánh đổi:** câu trong repo có thể cũ hơn D1 tới lần export kế tiếp (trang quản trị gắn nhãn "Repo khác D1"); người chơi đang mở game chỉ thấy câu mới sau khi tải lại trang. Một tên trong `ADMIN_USERNAMES` mà chưa ai đăng ký là để ngỏ quyền admin cho người đăng ký tên đó trước; server ghi cảnh báo lúc khởi động.
- **Đã kiểm trên Vercel:** chưa. Cần chạy mục "Bật trang quản lý kịch bản" trong `docs/huong-dan-deploy.md` trên một bản preview; nếu `includeFiles` không đưa được JSON vào function (`GET /api/admin/content` trả 500), cách lùi là sinh một module TypeScript từ các file JSON lúc build và ghi lại thành một mục QĐ mới.
- QĐ-04, QĐ-08, QĐ-13 không bị thay thế.

## QĐ-16 · Chỉ D1 giữ câu chữ; câu ban đầu đi bằng migration

- **Ngày:** 28/10/2026 · **Trạng thái:** đang áp dụng (chủ dự án chốt). Thay phần "bản chụp" của QĐ-15.
- **Vấn đề:** sau QĐ-15 câu chữ có hai bản: D1 (game dùng) và JSON trong repo (câu dự phòng, bản chụp cho test và GDD). Hai bản lệch nhau tới lần export kế tiếp; sửa nhầm JSON thì game không đổi mà không ai hay.
- **Quyết định:**
  - `src/levels/*.json` và `src/story/chapter-1.json` không còn trường câu chữ nào (mọi đường dẫn trong `LEVEL_TEXT`/`CHAPTER_TEXT` của `src/content/text-fields.ts`). Các file chỉ còn câu đố và khóa neo (`var`/`line` của mục tiêu, `kind` của nhịp, `code` của lỗi thường gặp).
  - Câu ban đầu của mỗi tài liệu vào D1 bằng migration SQL: `db/migrations/0004_content_chapter_1.sql` cho `chapter:1` và `level:1.1`–`level:1.4` (sinh từ JSON trước khi xóa câu, so khớp từng ký tự). Mỗi tài liệu là revision 1 (`updated_by = 'migration'`) cùng một dòng lịch sử, đều `ON CONFLICT DO NOTHING`: chạy lại migration không bao giờ đè câu admin đã sửa. Mỗi câu lệnh phải dưới 100 KB (giới hạn của D1).
  - Level mới: file JSON câu đố cùng một tài liệu câu chữ (hình dạng `extractText`) do người làm design viết; `npm run content:migration -- <file.json> [--doc level:1.5]` kiểm tài liệu bằng đúng bộ kiểm của trang quản trị (kể cả lộ đáp án) rồi ghi `db/migrations/<số kế>_content_level_1_5.sql`. Script từ chối tài liệu đã có migration câu chữ.
  - Không có dòng D1 thì không có câu: level hiện "TÍN HIỆU HỎNG", chương hiện "DỮ LIỆU CHƯƠNG HỎNG". Câu D1 không khớp cấu trúc câu đố (lệch neo, thiếu hay thừa phần tử) là lỗi kiểm, không còn âm thầm lấy câu repo.
  - Trang quản trị chỉ sửa tài liệu đã có dòng: tài liệu chưa có dòng hiện trong danh sách với lỗi "chưa có câu chữ: thêm migration"; `GET`/`PUT` cho nó trả 404 `no_text`; server không bao giờ tạo dòng mới.
  - Đổi cấu trúc câu đố của level đã có câu (thêm mục tiêu, thêm nhịp…): viết tay một migration vá đúng đường dẫn bằng `json_set`/`json_insert`, tăng `revision` và thêm dòng lịch sử (mẫu ở `docs/huong-dan-deploy.md`).
  - Test chạy trên câu thật từ migration: `tests/content-fixture.ts` áp mọi migration vào SQLite trong bộ nhớ rồi ghép câu lên JSON câu đố. Một test bắt mọi level trong bundle và chương 1 phải có dòng `content_text` qua được bộ kiểm.
- **Lý do:** một nguồn duy nhất cho câu chữ; migration nằm trong git nên câu ban đầu vẫn theo commit, test vẫn ổn định, và D1 thật nhận câu qua đúng đường `wrangler d1 migrations apply` đang dùng cho schema.
- **Phương án đã xét:** giữ bản chụp như QĐ-15 (bỏ: hai bản lệch nhau); seed câu bằng lệnh riêng lúc deploy (bỏ: thêm một bước dễ quên, e2e và dev phải tự seed); cho trang quản trị tạo tài liệu mới (bỏ: câu ban đầu cần review cùng câu đố trong một commit).
- **Đánh đổi:** migration câu chữ phải áp lên D1 thật **trước** khi deploy code; deploy trước là mọi level hỏng. GDD không còn trỏ được tới câu trong repo; muốn đọc câu hiện hành thì mở trang quản trị. Câu admin sửa trên D1 chỉ nằm ở D1 (và bảng lịch sử), không về repo.

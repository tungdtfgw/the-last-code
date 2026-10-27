# Báo cáo cook: host Vercel, CSDL D1, tài khoản kích hoạt qua email

Plan: `plans/261025-2055-vercel-d1-tai-khoan-email/`. Ngày 25/10/2026.

## Kết quả

Đã làm đủ 6 phase ở mức code, test và tài liệu. Game bắt buộc đăng nhập; đăng ký, kích hoạt qua link
trong thư, đăng nhập, quên và đổi mật khẩu qua email đều chạy được ở máy (SQLite + thư ghi ra
`.data/outbox/`). Tiến độ lưu ở server, tiến độ cũ trong `localStorage` được gộp vào tài khoản rồi xóa.
Chưa deploy lên Vercel hay Cloudflare thật (cần tài khoản và sự đồng ý của chủ dự án).

## Đã kiểm

- `npm run typecheck`, `npm test` (45 file, 443 test), `npm run test:py` (78 test), `npm run build`: qua.
- `server/client-bundle.test.ts` sau build: `dist/` không chứa code server.
- Trình duyệt thật (Chromium headless, dev server riêng cổng 5199): đăng ký, đăng nhập khi chưa kích hoạt (hiện nút gửi lại), mở link trong outbox, đăng nhập, màn tiêu đề có "Đang chơi", màn tài khoản, đăng xuất. Màn đăng nhập và đăng ký không cuộn ở 1280×800 và 360×740.
- Worker cổng chạy bằng `wrangler dev` với D1 cục bộ: không có khóa thì 401; mọi luồng tài khoản và tiến độ (gồm `changes()` trong batch, `json_each`, `ON CONFLICT DO NOTHING RETURNING`, migration `0002`, upsert có `draft_rev`) chạy đúng qua `GatewayDb`.
- E2E: đã viết `tests/e2e/fixtures.ts`, `tests/e2e/account.spec.ts` và sửa các spec cũ để đăng nhập. **Chưa chạy** (quy ước repo: chỉ chạy khi chủ dự án yêu cầu).

## Review độc lập

Agent `code-reviewer` (báo cáo `plans/reports/code-reviewer-261025-2245-accounts-d1.md`) tìm 5 lỗi major, 6 minor. Đã sửa:

- Bản nháp cũ đè bản mới khi request chậm hoặc thử lại về sau: thêm `level_progress.draft_rev` (migration `0002_draft_rev.sql`), server giữ bản nháp có revision cao nhất.
- Ghi thất bại hẳn thì lần ghi thành công sau làm mất sao trong bộ nhớ: mỗi PUT giờ mang toàn bộ trạng thái level từ bộ nhớ, dựng lúc gửi; bộ nhớ chỉ tăng.
- Sau đăng xuất, lần thử lại của tài khoản cũ ghi vào tài khoản mới: `close()` dừng mọi lần thử, request mang `x-tlc-user` và server trả 409 nếu khác phiên.
- Số dòng level/đoạn truyện không giới hạn: tối đa 100 level và 200 đoạn truyện mỗi tài khoản.
- Khóa đăng nhập tính từ lần sai đầu tiên: giờ khóa đủ 15 phút từ lần vượt giới hạn.
- Đăng xuất thất bại bị bỏ qua: giờ giữ đăng nhập và báo lỗi.
- Tiến độ cũ quá lớn bị xóa: bỏ bản nháp khỏi gói nhập khi gói quá 400 KB, giữ sao.
- E2E hai tab có thể chập chờn: chờ server có bản nháp của tab B rồi mới kiểm.

Sửa sau khi chủ dự án chọn phương án 1 và 2 (26/10/2026, QĐ-14): mỗi mạng tối đa 60 yêu cầu gửi thư mỗi giờ; thư kích hoạt của tài khoản mới dùng tối đa 300 trong 450 thư/ngày.

- **Cạn hạn mức 450 thư/ngày (đã xử lý như trên):** người lạ đăng ký khoảng 450 email khác nhau là chặn mọi thư kích hoạt và đặt lại mật khẩu tới hết ngày. Plan đã bỏ giới hạn theo IP vì cả lớp đi chung IP. Phương án: giới hạn theo IP nhưng rộng (vd 60 lần đăng ký/giờ), tách ngân sách thư cho gửi lại và đặt lại mật khẩu, thêm thử thách chống bot chỉ ở đăng ký, hoặc chấp nhận và theo dõi bộ đếm.

Chấp nhận, không sửa: gửi lại thư và quên mật khẩu trả 429 chỉ khi tài khoản tồn tại (đăng ký vốn đã lộ email đã dùng); phiên hết hạn (401) thì các lần ghi chưa gửi bị bỏ.

## Lệch so với plan

- Thư e2e ghi vào `.data/e2e-outbox/` (plan ghi `.data/outbox/`) để không lẫn với thư của `npm run dev`.
- Plugin Vite nạp `server/local-handler.ts` (không phải thẳng `router.ts`) vì module runner của Vite đóng sau khi nạp, nên mọi driver phải import tĩnh.
- Entry của Worker chỉ export handler; logic nằm ở `workers/d1-gateway/src/gateway.ts` (workerd từ chối export khác, phát hiện khi chạy `wrangler dev`).
- `register` trả thêm `mailError`, `retryAfterSec` khi chưa gửi được thư.

## Còn lại

- Deploy lần đầu và kiểm `GET /api/auth/me` trả 401 trên Vercel: xác nhận catch-all `api/[...path].ts` và quy ước đuôi `.js` (QĐ-13, `docs/huong-dan-deploy.md` mục 6 và 8).
- Chạy e2e khi chủ dự án yêu cầu, bắt đầu bằng `npx playwright test tests/e2e/account.spec.ts --project=chromium`.
- `ak plan` không cập nhật được trạng thái plan (`planstore: plan not found` dù `ak plan list` thấy plan; `ak plan resolve` còn trỏ tới thư mục cũ `261025-1358-…`). Trạng thái trong file plan vẫn là `pending`; đúng ra phase 1, 2, 4, 5 xong, phase 3 và 6 còn bước deploy và chạy e2e.

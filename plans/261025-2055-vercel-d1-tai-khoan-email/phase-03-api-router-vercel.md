---
phase: 3
title: "API tiến độ, router, chạy trên Vercel và Vite"
status: pending
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: API tiến độ, router, chạy trên Vercel và Vite

## Goal

Gắn logic phase 2 và API tiến độ thành các endpoint HTTP. Cùng một router chạy trên Vercel (một function catch-all), trong `vite dev` / `vite preview` (để `npm run dev` và e2e có API) và trong Vitest.

## Files to Create / Modify

- Create: `server/config.ts` (đọc và kiểm tra biến môi trường một lần)
- Create: `server/progress/progress-store.ts` (đọc toàn bộ tiến độ, ghi một level, đánh dấu đoạn truyện, nhập tiến độ cũ)
- Create: `server/router.ts` (`handle(request: Request): Promise<Response>`)
- Create: `server/router.test.ts`, `server/progress/progress-store.test.ts`
- Create: `api/[...path].ts` (adapter Vercel: `export default { fetch: handle }`)
- Create: `server/vite-api-plugin.ts` (plugin Vite: chuyển `/api/*` của dev và preview server vào `handle`)
- Create: `vercel.json`
- Modify: `vite.config.ts` (thêm plugin)
- Modify: `src/storage/progress-repository.ts` (xuất thêm kiểu `ProgressSnapshotDto` dùng chung client/server; không đổi hành vi)

## Biến môi trường (`config.ts`)

| Biến | Production | Dev / e2e |
|---|---|---|
| `DB_DRIVER` | `gateway` | `sqlite` |
| `D1_GATEWAY_URL`, `D1_GATEWAY_SECRET` | bắt buộc | – |
| `SQLITE_PATH` | – | `.data/dev.sqlite`, e2e `.data/e2e.sqlite` |
| `MAIL_TRANSPORT` | `smtp` | `outbox` |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | bắt buộc | – |
| `APP_ORIGIN` | `https://<ten-game>.vercel.app` | `http://localhost:5173` hoặc `:4173` |
| `AUTH_RATE_LIMIT` | không đặt | `off` cho e2e (chỉ có hiệu lực khi `sqlite`) |

Thiếu biến bắt buộc thì function trả 500 `{error: "server_misconfigured"}` và ghi log tên biến thiếu (không ghi giá trị).

## Endpoint

Mọi endpoint nhận và trả JSON. Request `POST`/`PUT` phải có `Content-Type: application/json`, không thì trả 415. Cùng với cookie `SameSite=Lax`, điều này chặn form của trang khác gửi lệnh thay người chơi (CSRF). Lỗi trả `{ error: <mã>, ...chi tiết }`. Body tối đa 16 KB cho `/api/auth/*`, 256 KB cho `PUT /api/progress/levels/:id` và 512 KB cho `import`, **đo bằng byte** (`MAX_DRAFT_CHARS = 50_000` đếm ký tự; sau UTF-8 và escape JSON, một bản nháp hợp lệ có thể tới khoảng 150 KB). Vượt thì trả 413.

| Method + đường dẫn | Cần phiên | Body / kết quả |
|---|---|---|
| `POST /api/auth/register` | không | `{username, email, password}` → 201 `{ok, mailSent}` |
| `POST /api/auth/activate` | không | `{token}` → `{ok}` |
| `POST /api/auth/resend-activation` | không | `{usernameOrEmail}` → `{ok}` |
| `POST /api/auth/login` | không | `{username, password}` → `Set-Cookie`, `{user}` |
| `POST /api/auth/logout` | có | → xóa cookie, `{ok}` |
| `GET /api/auth/me` | có | → `{user}`, hoặc 401 |
| `POST /api/auth/forgot-password` | không | `{usernameOrEmail}` → `{ok}` |
| `POST /api/auth/change-password-email` | có | → gửi link đặt lại tới email của phiên, `{ok}` |
| `POST /api/auth/reset-password` | không | `{token, password}` → `{ok}` |
| `GET /api/progress` | có | → `{levels: {[id]: LevelProgress}, story: {seen}}` |
| `PUT /api/progress/levels/:id` | có | `Partial<LevelProgress>` → `LevelProgress` đã gộp |
| `POST /api/progress/story` | có | `{id}` → `{seen}` |
| `POST /api/progress/import` | có | `{levels, story}` (tiến độ cũ trên máy) → snapshot đã gộp |

Mọi response API có `Cache-Control: no-store`. Id level và id đoạn truyện kiểm tra bằng cùng regex `ROUTE_ID` (`^[\w.-]{1,64}$`).

## Ghi tiến độ không mất dữ liệu khi gọi chồng nhau

`PUT /api/progress/levels/:id` gộp ngay trong SQL bằng một câu upsert, để hai request đến cùng lúc không đè nhau. Luật trùng với `mergeLevelProgress`:

```sql
INSERT INTO level_progress (user_id, level_id, draft, best_stars, runs, hints_opened, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
ON CONFLICT (user_id, level_id) DO UPDATE SET
  draft        = CASE WHEN ?8 = 1 THEN excluded.draft ELSE level_progress.draft END,  -- ?8: patch có khóa draft
  best_stars   = MAX(level_progress.best_stars, excluded.best_stars),
  runs         = MAX(level_progress.runs, excluded.runs),
  hints_opened = MAX(level_progress.hints_opened, excluded.hints_opened),
  updated_at   = excluded.updated_at
RETURNING draft, best_stars, runs, hints_opened, updated_at;
```

Server làm sạch patch bằng `sanitizeLevelProgress` trước khi bind. Bản nháp sai khuôn (quá dài, không phải chuỗi) thì không được ghi, giống luật hiện tại. `import` khác ở một điểm: bản nháp trên máy là bản cũ, nên chỉ được điền vào khi tài khoản **chưa có** bản nháp (`draft = COALESCE(level_progress.draft, excluded.draft)`). Sao, số lần chạy, gợi ý vẫn lấy MAX. Đoạn truyện nhập bằng một câu `INSERT OR IGNORE INTO story_seen SELECT ?1, value, ?2 FROM json_each(?3)`. Server bỏ qua im lặng các id không khớp `ROUTE_ID`, nhận tối đa 50 level và 200 đoạn truyện; tất cả nằm trong một `batch` (tối đa 51 câu cho 50 level, nên giới hạn 20 câu của cổng D1 ở phase 1 nâng lên **64 câu**). Test so kết quả SQL với `mergeLevelProgress` trên cùng bộ input, và kiểm tra import không đè bản nháp mới hơn trên server.

## Vercel

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "regions": ["sin1"],
  "functions": { "api/[...path].ts": { "maxDuration": 15 } }
}
```

Game dùng hash route nên không cần rewrite SPA.

`[UNVERIFIED]` Catch-all `api/[...path].ts` có chạy cho dự án không dùng framework hay không. Kiểm tra bằng một bản preview deploy (`vercel deploy`) với `GET /api/auth/me`. Nếu không chạy: đổi thành `api/index.ts`, thêm `"rewrites": [{ "source": "/api/(.*)", "destination": "/api/index" }]`, và cho `router.ts` đọc đường dẫn gốc. Ghi kết quả vào `docs/quyet-dinh-ky-thuat.md`.

## Plugin Vite (`vite-api-plugin.ts`)

- Trong `configureServer` và `configurePreviewServer`: middleware cho `/api/*` chuyển Node `IncomingMessage` thành `Request`, gọi `handle`, rồi ghi `Response` ra.
- Plugin nạp `server/router.ts` bằng `import()` động, chỉ khi server khởi động, để code server không lọt vào bundle client.
- Khi chạy local, plugin đặt mặc định `DB_DRIVER=sqlite`, `MAIL_TRANSPORT=outbox`, `APP_ORIGIN` theo cổng (chỉ khi các biến này chưa được đặt).
- Thêm một test kiểm tra `dist/` sau `npm run build` không chứa chuỗi `nodemailer` hay `node:sqlite`.

## Tasks & Steps

1. `config.ts`, rồi `progress-store.ts` cùng test (gộp đúng luật, gọi chồng không mất sao, import idempotent khi gọi hai lần).
2. `router.ts`: bảng định tuyến nhỏ (method + regex), đọc cookie phiên, gắn user, trả lỗi đúng mã. Test gọi thẳng `handle(new Request(...))` với SQLite `:memory:` và `OutboxMailer`: đủ luồng đăng ký → đọc thư trong outbox → kích hoạt → đăng nhập → ghi và đọc tiến độ; 401 khi thiếu phiên; 415 khi sai content type; cookie có `HttpOnly` và `SameSite=Lax`.
3. `api/[...path].ts`, `vercel.json`.
4. Plugin Vite, sửa `vite.config.ts`, rồi chạy `npm run dev` và gọi thử `curl -X POST localhost:5173/api/auth/register`.

## Verification

- `npx vitest run server`
- `npm run build` rồi chạy test kiểm tra `dist/`
- `npm run dev` và `npm run preview`: `GET /api/auth/me` trả 401
- Preview deploy trên Vercel: `GET /api/auth/me` trả 401 (xác nhận catch-all)

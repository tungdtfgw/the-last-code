---
phase: 1
title: "CSDL và Worker cổng D1"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: CSDL và Worker cổng D1

## Goal

Có schema D1, một interface `Db` dùng chung với hai driver (Worker cổng cho production, `node:sqlite` cho dev/test) và Worker cổng D1 chỉ nhận lệnh có khóa bí mật.

## Files to Create / Modify

- Create: `db/migrations/0001_init.sql`
- Create: `server/db/db.ts` (interface `Db`, kiểu `Statement = { sql: string; params: (string | number | null)[] }`)
- Create: `server/db/sqlite-db.ts` (driver `node:sqlite` `DatabaseSync`, tự áp migration)
- Create: `server/db/gateway-db.ts` (driver gọi Worker qua `fetch`)
- Create: `server/db/create-db.ts` (chọn driver theo `DB_DRIVER=gateway|sqlite`)
- Create: `server/db/db.test.ts`
- Create: `workers/d1-gateway/wrangler.toml`, `workers/d1-gateway/src/index.ts`, `workers/d1-gateway/src/auth.ts`, `workers/d1-gateway/src/auth.test.ts`, `workers/d1-gateway/tsconfig.json`, `workers/d1-gateway/package.json`
- Create: `server/imports.test.ts` (quy ước đuôi `.js`, xem cuối file)
- Modify: `.gitignore` (thêm `.data/`, `.vercel/`, `.env*`, `.dev.vars`, `.wrangler/`)
- Modify: `tsconfig.json` (`include` thêm `server`, `api`), `vitest.config.ts` (`include` thêm `server/**/*.test.ts`, `workers/**/*.test.ts`)

## Schema (`0001_init.sql`)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,               -- crypto.randomUUID()
  username TEXT NOT NULL UNIQUE,     -- chữ thường, ^[a-z0-9_]{3,20}$
  email TEXT NOT NULL UNIQUE,        -- trim + chữ thường
  password_md5 TEXT NOT NULL,        -- hex md5(salt + mật khẩu)
  salt TEXT NOT NULL,                -- 16 byte ngẫu nhiên, hex
  activated_at TEXT,                 -- NULL = chưa kích hoạt
  created_at TEXT NOT NULL
);
CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,          -- sha256(id phiên trong cookie)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE email_tokens (
  token_hash TEXT PRIMARY KEY,       -- sha256(token trong link)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('activate', 'reset')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX email_tokens_user ON email_tokens(user_id);
CREATE TABLE level_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  draft TEXT,
  best_stars INTEGER NOT NULL DEFAULT 0 CHECK (best_stars BETWEEN 0 AND 3),
  runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
  hints_opened INTEGER NOT NULL DEFAULT 0 CHECK (hints_opened BETWEEN 0 AND 3),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, level_id)
);
CREATE TABLE story_seen (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  PRIMARY KEY (user_id, story_id)
);
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,              -- vd 'login:<username>', 'mail:<email>', 'mail-day:<YYYY-MM-DD>'
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL
);
```

Thời điểm lưu dạng chuỗi ISO 8601 UTC, khớp `updatedAt` hiện có.

## Tasks & Steps

1. Viết `Db`:
   ```ts
   export interface Db {
     /** Chạy các câu theo thứ tự trong một giao dịch; trả về các dòng của từng câu. */
     batch(statements: Statement[]): Promise<Record<string, unknown>[][]>;
   }
   ```
   Thêm hai helper `all(db, sql, params)` và `first(db, sql, params)` gọi `batch` với một câu.
2. `SqliteDb`: mở file (hoặc `:memory:` cho test), bật `PRAGMA foreign_keys = ON`, áp các file `db/migrations/*.sql` chưa có trong bảng `d1_migrations` (cùng tên bảng và cột `name` mà wrangler dùng, để một DB cục bộ không lệch với D1). `batch` chạy trong `BEGIN … COMMIT`, lỗi thì `ROLLBACK` rồi ném lại.
3. Worker `d1-gateway` (`src/index.ts`):
   - Chỉ nhận `POST /batch`. Sai method hoặc đường dẫn thì trả 404.
   - Kiểm tra `Authorization: Bearer <GATEWAY_SECRET>` trong một hàm thuần `checkAuth(header, secret)` ở `workers/d1-gateway/src/auth.ts`: băm SHA-256 cả hai phía rồi so bằng `crypto.subtle.timingSafeEqual` (hàm này ném lỗi khi hai buffer khác độ dài, băm trước thì luôn cùng 32 byte). Sai hoặc thiếu header thì trả 401, không bao giờ 500.
   - Body `{ statements: Statement[] }`, tối đa 64 câu và 512 KB (một lần nhập tiến độ cũ có thể chứa nhiều bản nháp). Mỗi `params` chỉ nhận string, number hoặc null.
   - Chạy `env.DB.batch(statements.map(s => env.DB.prepare(s.sql).bind(...s.params)))`, trả `{ results: rows[][] }`. Lỗi SQL thì trả 400 `{ error: message }`, không trả stack.
   - `wrangler.toml`: `[[d1_databases]] binding = "DB"`, `migrations_dir = "../../db/migrations"`. `GATEWAY_SECRET` đặt bằng `wrangler secret put`, không ghi vào file.
4. `GatewayDb`: `fetch(D1_GATEWAY_URL + "/batch")` với header Bearer `D1_GATEWAY_SECRET`, timeout 8 giây (`AbortSignal.timeout`). Không phải 2xx thì ném `DbError` (không lộ SQL ra ngoài API). Vì vậy logic ở phase 2 không được dựa vào việc bắt lỗi `UNIQUE`: các chỗ có thể trùng dùng `ON CONFLICT DO NOTHING RETURNING …` và xét số dòng trả về.
5. `create-db.ts`: đọc `DB_DRIVER`. Production mặc định `gateway` và bắt buộc có hai biến `D1_GATEWAY_*`; `sqlite` đọc `SQLITE_PATH` (mặc định `.data/dev.sqlite`). Tạo một lần cho mỗi instance function.
6. Test `db.test.ts` (SQLite `:memory:`): migration áp đúng một lần khi mở lại; `batch` rollback khi câu thứ hai lỗi; ràng buộc `CHECK` chặn `best_stars = 4`.
7. Test `workers/d1-gateway/src/auth.test.ts` (chạy trong Vitest, thêm `workers/**/*.test.ts` vào `include`): đúng khóa thì qua; sai khóa, thiếu header, khóa khác độ dài thì bị từ chối mà không ném lỗi. Kèm một test gọi `fetch(request, env)` của Worker với `env.DB` giả chỉ ghi lại câu lệnh, để xác nhận request không có khóa trả 401 và không chạm DB (tiêu chí nghiệm thu 9).

## Import trong code server

`package.json` có `"type": "module"`. Vercel biên dịch từng file `.ts` riêng và không thêm đuôi cho import, nên `import "./db"` sẽ hỏng với `ERR_MODULE_NOT_FOUND` khi deploy dù chạy local vẫn được. Quy ước: mọi import tương đối trong `server/`, `api/` và các file `src/` mà server dùng phải ghi đuôi `.js` (TypeScript `moduleResolution: "bundler"`, Vite và Vitest đều hiểu `.js` trỏ tới `.ts`). Code server chỉ được import những file `src/` không có import runtime nào khác (hiện là `src/storage/progress-repository.ts` và hằng `ROUTE_ID`; tách `ROUTE_ID` ra `src/shell/route-id.ts` nếu cần). Thêm test `server/imports.test.ts` quét `server/`, `api/` và các file `src/` đó, báo lỗi nếu có import tương đối thiếu `.js`.

## An toàn dữ liệu

- Trước mỗi lần áp migration lên D1 thật: `npx wrangler d1 export <db> --remote --output=backup-<ngày>.sql`, ghi vào runbook ở phase 6.
- Lần đầu tạo D1: `npx wrangler d1 create the-last-code --location=apac`.

## Verification

- `npx vitest run server/db/db.test.ts`
- `npx wrangler dev` trong `workers/d1-gateway` với D1 cục bộ: `curl` không có khóa phải trả 401; có khóa thì `SELECT 1` chạy được.
- `npm run typecheck`

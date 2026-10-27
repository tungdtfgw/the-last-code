---
phase: 4
title: "Client: tài khoản, HttpProgressRepository, gộp tiến độ cũ"
status: pending
priority: P1
effort: "5h"
dependencies: [3]
---

# Phase 4: Client: tài khoản, HttpProgressRepository, gộp tiến độ cũ

## Goal

Trình duyệt biết người chơi đã đăng nhập hay chưa. Đã đăng nhập thì game dùng `HttpProgressRepository` (tiến độ ở server), và tiến độ cũ trong `localStorage` được gộp lên rồi xóa. Chưa đăng nhập thì chỉ vào được các màn tài khoản (giao diện các màn này ở phase 5).

## Files to Create / Modify

- Create: `src/account/account-api.ts` (gọi `/api/auth/*`, `/api/progress*`; trả `{ok: true, data}` hoặc `{ok: false, error}`)
- Create: `src/account/account-errors.ts` (mã lỗi → câu tiếng Việt)
- Create: `src/account/auth-route.ts` (`parseAuthRoute(hash)`: `login`, `register`, `forgot`, `account`, `activate/<token>`, `reset/<token>`)
- Create: `src/account/account-gate.tsx` (thay chỗ `Shell` trong `Boot`, quyết định hiện màn tài khoản hay game)
- Create: `src/storage/http-repository.ts`
- Create: `src/storage/import-local-progress.ts`
- Create: `src/storage/http-repository.test.ts`, `src/account/auth-route.test.ts`
- Modify: `src/storage/local-storage-repository.ts` (thêm `readLocalProgress(storage)` và `clearLocalProgress(storage)`; chỉ xóa khóa tiến độ, giữ khóa cài đặt)
- Modify: `src/storage/create-repository.ts` (tách `createSettingsStore()` dùng cho cài đặt tắt tiếng)
- Modify: `src/app.tsx` (`Boot` render `AccountGate`; `Shell` nhận `repository` và `user` qua props thay vì tự tạo)
- Modify: `src/storage/progress-store.test.ts` (test cho hai hàm mới)

## Luồng khởi động

```
Boot → AccountGate
  GET /api/auth/me
    ├─ lỗi mạng / 5xx  → FatalScreen "KHÔNG KẾT NỐI ĐƯỢC MÁY CHỦ" + nút "Thử lại"
    ├─ 401             → signed-out
    │     hash là màn tài khoản → render màn đó (phase 5)
    │     hash khác            → replace sang #/login
    └─ 200 {user}      → signed-in
          tiến độ cũ trên máy? → POST /api/progress/import → thành công thì clearLocalProgress
          GET /api/progress → new HttpProgressRepository(snapshot, settingsStore)
          hash #/login, #/register, #/forgot → replace sang #/
          hash #/account, #/activate/…, #/reset/… → render màn đó (phase 5)
          còn lại → <Shell key={user.id} repository=… user=… />
```

- `Shell` có `key={user.id}`, nên đăng xuất rồi đăng nhập tài khoản khác sẽ dựng lại toàn bộ trạng thái game.
- Import thất bại vì mạng hoặc 5xx thì **không xóa** tiến độ trên máy; lần vào game sau thử lại. Import là idempotent (phase 3) nên gửi lại không sai.
- Import bị server từ chối với 4xx (khác 401) thì dữ liệu trên máy hỏng theo cách server không nhận: xóa nó và vào game tiếp, để không lặp lại lỗi ở mọi lần khởi động.
- `parseRoute` của game không đổi. Hash tài khoản được `parseAuthRoute` xét trước; `AccountGate` tự lắng nghe `hashchange`.

## `HttpProgressRepository`

- Tạo từ snapshot `GET /api/progress`, giữ bản sao trong bộ nhớ. `getLevel` và `getStory` đọc bộ nhớ, không gọi mạng; nhờ vậy `useProgressSnapshot` (đọc mọi level mỗi lần đổi route) không sinh hàng chục request.
- `updateLevel(id, patch)`: gộp ngay vào bộ nhớ bằng `mergeLevelProgress` và trả về kết quả đó, rồi đẩy `PUT /api/progress/levels/:id` vào **hàng đợi riêng của level đó** để các lần ghi đến server đúng thứ tự. Khi server trả bản đã gộp, repository gộp lại các patch còn chờ trong hàng đợi lên trên bản đó (`mergeLevelProgress(serverRow, …pending)`) rồi mới lưu vào bộ nhớ, để bộ nhớ không lùi về bản nháp cũ.
- **Gom bản nháp để tiết kiệm hạn mức D1:** `use-game.ts` lưu bản nháp sau mỗi 500 ms ngừng gõ. Lớp 40 người gõ 2 giờ có thể sinh khoảng 96 nghìn lần ghi, gần bằng hạn mức free 100 nghìn dòng ghi/ngày của D1 và 100 nghìn request/ngày của Workers. Vì vậy repository giữ patch chỉ có `draft` lại và gửi tối đa một lần mỗi 10 giây cho mỗi level, bỏ qua nếu bản nháp không đổi so với lần gửi trước. Patch có `runs`, `bestStars` hoặc `hintsOpened` thì gửi ngay, kèm luôn bản nháp đang giữ.
- **Khi ẩn hoặc đóng trang** (`visibilitychange` → hidden, `pagehide`): gửi ngay bản nháp mới nhất của mỗi level còn đang giữ, **không xếp sau hàng đợi** (nếu xếp sau, request có thể chưa kịp đi thì trang đã đóng). Server gộp sao, số lần chạy, gợi ý theo MAX nên gửi lệch thứ tự không sai; bản nháp đến sau cùng thắng, và đó là bản mới nhất. `use-game.ts` cũng flush bản nháp trong cùng các sự kiện này và thứ tự giữa hai listener không chắc chắn, nên quy tắc là: `updateLevel` được gọi khi `document.visibilityState === "hidden"` thì gửi ngay, không gom.
- `markStorySeen(id)`: gộp vào bộ nhớ bằng `mergeStory`, rồi `POST /api/progress/story`.
- `getSettings` / `updateSettings`: chuyển cho `settingsStore` (`localStorage`, hoặc bộ nhớ khi bị chặn). Cài đặt không lên server (QĐ-09).
- **Lỗi khi ghi:**
  - Lỗi mạng hoặc 5xx: thử lại sau 1, 3, 9 giây. Hết lượt thì gọi listener của `onPersistenceLost` một lần (banner "CHẾ ĐỘ KHÔNG LƯU" có sẵn hiện lên) và vẫn tiếp tục thử các lần ghi sau.
  - 401: gọi `onSessionExpired`, và `AccountGate` chuyển về `#/login` với thông báo "Phiên đăng nhập đã hết, bạn đăng nhập lại nhé."
  - 4xx khác (413, 400…): không thử lại vì gửi lại cũng hỏng, nhưng coi là mất dữ liệu và gọi `onPersistenceLost` ngay, không bỏ qua im lặng.
- **`keepalive`:** trình duyệt cho tổng cộng khoảng 64 KB cho **mọi** request `keepalive` đang bay trên trang, tính bằng byte. Repository chỉ đặt `keepalive: true` khi kích thước body (`new TextEncoder().encode(body).length`) dưới 60 KB **và** không còn request `keepalive` nào đang bay; còn lại thì gửi thường.
- `persistent` là `true` lúc tạo.

## Test

`http-repository.test.ts` chạy với server thật trong cùng tiến trình: `fetch` của test chuyển thẳng tới `handle` của `server/router.ts` (SQLite `:memory:`, `OutboxMailer`, kèm một cookie jar nhỏ). Không có mock cho logic.

- Ghi ba bản nháp liên tiếp thì server giữ bản cuối, và chỉ một request được gửi trong cửa sổ 10 giây (tiêm đồng hồ).
- Có một `PUT` đang bay thì `flush` khi ẩn trang vẫn gửi ngay bản nháp mới nhất, không chờ.
- Response của request cũ về sau khi đã có patch mới trong hàng đợi thì `getLevel` vẫn trả bản nháp mới.
- Server trả 413 thì `onPersistenceLost` được gọi.
- `bestStars` không giảm khi ghi một giá trị thấp hơn.
- Repository thứ hai tạo từ `GET /api/progress` thấy đúng dữ liệu của repository thứ nhất (giả lập "máy khác").
- Server trả 503 hai lần rồi 200 thì dữ liệu vẫn lên và banner không bật (tiêm `fetch` bọc ngoài `handle` để trả 503; tiêm hàm chờ để test không phải đợi thật).
- Phiên bị xóa thì lần ghi sau gọi `onSessionExpired`.
- `import-local-progress`: máy có 2 level và 1 đoạn truyện, tài khoản có sẵn 1 level với sao cao hơn, thì sau import sao lấy cao hơn, đoạn truyện hợp hai tập, `localStorage` không còn khóa tiến độ nhưng còn khóa cài đặt. Import lỗi thì `localStorage` còn nguyên.

Test có sẵn "no file outside src/storage touches localStorage directly" phải vẫn qua: mọi chỗ đọc/xóa `localStorage` nằm trong `src/storage/`.

## Verification

- `npx vitest run src/storage src/account`
- `npm run typecheck`
- `npm test` (toàn bộ, vì `app.tsx` đổi)

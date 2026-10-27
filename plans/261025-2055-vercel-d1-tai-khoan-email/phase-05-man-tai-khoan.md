---
phase: 5
title: "Màn đăng nhập, đăng ký, kích hoạt, mật khẩu"
status: pending
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 5: Màn đăng nhập, đăng ký, kích hoạt, mật khẩu

## Goal

Có đủ các màn tài khoản theo phong cách hiện tại của game (tokens trong `tokens.css`, nền thành phố như màn tiêu đề). Các màn không cuộn trang ở 1280×800 và 360×740, dùng được hoàn toàn bằng bàn phím, và lời viết tiếng Việt tự nhiên.

## Files to Create / Modify

- Create: `src/ui/account/auth-layout.tsx` (khung chung: tiêu đề "MÃ CUỐI CÙNG" nhỏ, một panel form, vùng thông báo `aria-live="polite"`)
- Create: `src/ui/account/login-screen.tsx`
- Create: `src/ui/account/register-screen.tsx`
- Create: `src/ui/account/forgot-screen.tsx`
- Create: `src/ui/account/activate-screen.tsx`
- Create: `src/ui/account/reset-screen.tsx`
- Create: `src/ui/account/account-screen.tsx`
- Modify: `src/account/account-gate.tsx` (render các màn theo `parseAuthRoute`)
- Modify: `src/ui/title-screen.tsx` (dòng "Đang chơi: <username>" và nút TÀI KHOẢN)
- Modify: `src/app.tsx` (truyền `user` và `onAccount` vào `TitleScreen`)
- Modify: `src/styles/global.css` (khối `.auth-*`)
- Modify: `src/account/account-errors.ts` (chốt câu chữ)

## Các màn

| Hash | Nội dung | Sau khi xong |
|---|---|---|
| `#/login` | Username, Mật khẩu, nút ĐĂNG NHẬP; link "Quên mật khẩu?" và "Chưa có tài khoản? Đăng ký" | Về `#/`. Lỗi `not_activated` hiện email đã che và nút "Gửi lại thư kích hoạt" |
| `#/register` | Username (gợi ý luật ngay dưới ô), Email, Mật khẩu, Nhập lại mật khẩu, nút ĐĂNG KÝ | Thay form bằng lời báo "Đã gửi thư kích hoạt tới <email>…" và nút gửi lại (khóa 60 giây, có đếm ngược) |
| `#/activate/<token>` | Tự gửi `POST /api/auth/activate` khi mở (một lần, giữ bằng ref để StrictMode không gửi hai lần) | Thành công hoặc `alreadyActive`: "Tài khoản đã kích hoạt." và nút ĐĂNG NHẬP (hoặc VÀO GAME nếu đang đăng nhập). Lỗi: báo link hết hạn và nút gửi lại thư |
| `#/forgot` | Ô "Username hoặc email", nút GỬI LINK | Luôn báo "Nếu tài khoản tồn tại, thư đặt lại mật khẩu đã được gửi." |
| `#/reset/<token>` | Mật khẩu mới, Nhập lại, nút ĐẶT MẬT KHẨU | Báo thành công và đưa về `#/login` (mọi phiên cũ đã bị đăng xuất) |
| `#/account` (đã đăng nhập) | Username, email đã che, nút "Đổi mật khẩu qua email", nút ĐĂNG XUẤT, nút "Về màn tiêu đề" | Đổi mật khẩu: báo đã gửi link. Đăng xuất: về `#/login` |

## Quy tắc chung

- Ô nhập có `<label>` thật và `autocomplete` đúng (`username`, `email`, `current-password`, `new-password`), để trình duyệt và trình quản lý mật khẩu điền giúp.
- Kiểm tra phía client giống server (username, email, độ dài mật khẩu, hai ô mật khẩu khớp) và báo lỗi ngay dưới ô. Server vẫn là nơi quyết định.
- Khi đang gửi thì khóa nút và đổi chữ thành "ĐANG GỬI…". Enter trong ô cuối là gửi form.
- Lỗi từ server hiện trong vùng `aria-live`. Không hiện mã lỗi thô.
- Phím `M` không tắt tiếng khi đang gõ trong ô (đã có `isTyping`). Các màn tài khoản không phát âm thanh và không tạo `AudioContext`.
- Không hiện "CHẾ ĐỘ KHÔNG LƯU" trên các màn này.
- Màn activate và reset đọc token xong thì giữ token trong state và gọi `history.replaceState` đổi hash thành `#/activate` / `#/reset`, để token không nằm lại trong lịch sử trình duyệt (link reset còn dùng được trong 1 giờ). `parseAuthRoute` nhận cả dạng không có token (hiện lời báo "Link không hợp lệ" nếu state không có token, ví dụ khi tải lại trang reset).
- Câu chữ viết theo skill `van-viet-tu-nhien`, giọng hướng dẫn: ngắn, nói thẳng việc người chơi cần làm. Ví dụ hướng đi: "Mở thư vừa gửi tới t***@gmail.com và bấm link để kích hoạt. Không thấy thư thì xem cả mục Spam."

## Tasks & Steps

1. `auth-layout.tsx` và CSS, kiểm tra ở 1280×800 và 360×740 trước.
2. Login và register, nối `account-api.ts`.
3. Activate, forgot, reset.
4. Account screen và nút TÀI KHOẢN trên màn tiêu đề.
5. Rà toàn bộ câu chữ bằng skill `van-viet-tu-nhien`.
6. Test component (Testing Library, jsdom) cho những luật dễ hỏng: form register báo lỗi khi hai mật khẩu khác nhau và không gửi request; màn activate chỉ gửi một request dù React render hai lần (StrictMode).

## Verification

- `npm run typecheck`, `npm test`
- `npm run dev`: đi hết luồng đăng ký → mở link trong `.data/outbox/` → đăng nhập → chơi 1.1 → đăng xuất → đăng nhập lại thấy sao còn nguyên. Chụp màn ở 1280×800 và 360×740.

import type { Mail } from "./mailer.js";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const IGNORE = "Nếu bạn không yêu cầu, hãy bỏ qua thư này.";

function render(to: string, subject: string, intro: string, button: string, link: string, expiry: string): Mail {
  const text = `${intro}\n\n${button}: ${link}\n\n${expiry}\n${IGNORE}\n\n– Mã Cuối Cùng`;
  const html = `<!doctype html><html lang="vi"><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
<p>${escapeHtml(intro)}</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#0b7a75;color:#fff;text-decoration:none;border-radius:4px">${escapeHtml(button)}</a></p>
<p style="font-size:13px;color:#555">Nút không bấm được thì chép link này vào trình duyệt:<br><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
<p style="font-size:13px;color:#555">${escapeHtml(expiry)} ${escapeHtml(IGNORE)}</p>
<p>– Mã Cuối Cùng</p>
</body></html>`;
  return { to, subject, text, html, link };
}

export const activationMail = (to: string, username: string, link: string) =>
  render(
    to,
    "Kích hoạt tài khoản Mã Cuối Cùng",
    `Chào ${username}, bạn vừa đăng ký tài khoản Mã Cuối Cùng. Bấm nút bên dưới để kích hoạt tài khoản, rồi đăng nhập bằng username và mật khẩu của bạn.`,
    "Kích hoạt tài khoản",
    link,
    "Link dùng được một lần, trong 24 giờ.",
  );

export const resetMail = (to: string, username: string, link: string) =>
  render(
    to,
    "Đặt lại mật khẩu Mã Cuối Cùng",
    `Chào ${username}, có yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để chọn mật khẩu mới. Đặt xong, mọi máy đang đăng nhập tài khoản này sẽ bị đăng xuất.`,
    "Đặt mật khẩu mới",
    link,
    "Link dùng được một lần, trong 1 giờ.",
  );

import { MAX_PASSWORD, MIN_PASSWORD } from "./account-rules";

export interface ApiFailure {
  error: string;
  retryAfterSec?: number;
  email?: string;
}

const minutes = (sec = 60) => Math.max(1, Math.ceil(sec / 60));

/** Server error codes as sentences for the player. Raw codes never reach the screen. */
export function errorMessage(f: ApiFailure): string {
  switch (f.error) {
    case "network":
      return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
    case "invalid_username":
      return "Username dài 3–20 ký tự, chỉ gồm chữ thường không dấu, số và dấu gạch dưới.";
    case "invalid_email":
      return "Email chưa đúng dạng, ví dụ ten@gmail.com.";
    case "invalid_password":
      return `Mật khẩu dài từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự.`;
    case "username_taken":
      return "Username này đã có người dùng. Bạn chọn tên khác nhé.";
    case "email_taken":
      return "Email này đã có tài khoản. Bạn đăng nhập, hoặc dùng “Quên mật khẩu”.";
    case "bad_credentials":
      return "Sai username hoặc mật khẩu.";
    case "not_activated":
      return `Tài khoản chưa kích hoạt. Mở thư gửi tới ${f.email ?? "email của bạn"} và bấm link kích hoạt.`;
    case "too_many_attempts":
      return `Bạn nhập sai quá nhiều lần. Thử lại sau ${minutes(f.retryAfterSec)} phút.`;
    case "mail_rate_limited":
      return f.retryAfterSec && f.retryAfterSec <= 120
        ? `Thư vừa gửi xong. Chờ ${f.retryAfterSec} giây rồi gửi lại.`
        : "Email này đã nhận đủ thư trong hôm nay. Bạn thử lại vào ngày mai.";
    case "network_rate_limited":
      return `Mạng bạn đang dùng vừa gửi quá nhiều yêu cầu. Thử lại sau ${minutes(f.retryAfterSec)} phút.`;
    case "mail_quota":
      return "Hôm nay hệ thống đã gửi quá nhiều thư, bạn thử lại vào ngày mai.";
    case "mail_failed":
      return "Chưa gửi được thư. Bạn bấm gửi lại sau ít phút.";
    case "token_invalid":
      return "Link đã hết hạn hoặc đã dùng rồi.";
    case "unauthorized":
      return "Phiên đăng nhập đã hết, bạn đăng nhập lại nhé.";
    default:
      return "Máy chủ đang gặp lỗi. Bạn thử lại sau ít phút.";
  }
}

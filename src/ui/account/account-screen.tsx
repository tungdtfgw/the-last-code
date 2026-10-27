import { useState } from "react";
import type { AccountApi, AccountUser } from "../../account/account-api";
import { errorMessage } from "../../account/account-errors";
import { maskEmail } from "../../account/account-rules";
import { AuthLayout, type Notice } from "./auth-layout";

export function AccountScreen(props: { api: AccountApi; user: AccountUser; onSignOut(): Promise<boolean>; onTitle(): void }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const changePassword = async () => {
    setBusy(true);
    const res = await props.api.changePasswordEmail();
    setBusy(false);
    setNotice(
      res.ok
        ? { tone: "ok", text: `Đã gửi link đổi mật khẩu tới ${maskEmail(props.user.email)}. Link dùng được trong 1 giờ.` }
        : { tone: "error", text: errorMessage(res) },
    );
  };

  const signOut = async () => {
    setBusy(true);
    if (await props.onSignOut()) return;
    setBusy(false);
    setNotice({ tone: "error", text: "Chưa đăng xuất được. Kiểm tra mạng rồi thử lại." });
  };

  return (
    <AuthLayout title="Tài khoản" notice={notice}>
      <dl className="auth-facts">
        <div>
          <dt>Username</dt>
          <dd>{props.user.username}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{maskEmail(props.user.email)}</dd>
        </div>
      </dl>
      <div className="auth-actions">
        <button type="button" className="btn btn-ghost" onClick={() => void changePassword()} disabled={busy}>
          Đổi mật khẩu qua email
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void signOut()} disabled={busy}>
          ĐĂNG XUẤT
        </button>
        <button type="button" className="btn btn-run" onClick={props.onTitle} autoFocus>
          VỀ MÀN TIÊU ĐỀ
        </button>
      </div>
    </AuthLayout>
  );
}

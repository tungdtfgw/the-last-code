import { useState } from "react";
import type { AccountApi } from "../../account/account-api";
import { errorMessage } from "../../account/account-errors";
import { AuthForm, AuthLayout, AuthLinks, Field, type Notice } from "./auth-layout";

export function ForgotScreen(props: { api: AccountApi }) {
  const [who, setWho] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const submit = async () => {
    if (!who.trim()) {
      setNotice({ tone: "error", text: "Nhập username hoặc email của tài khoản." });
      return;
    }
    setBusy(true);
    const res = await props.api.forgotPassword(who.trim());
    setBusy(false);
    setNotice(
      res.ok
        ? { tone: "ok", text: "Nếu tài khoản tồn tại, bạn sẽ nhận thư đặt lại mật khẩu trong vài phút. Link dùng được trong 1 giờ. Không thấy thư thì xem cả mục Spam." }
        : { tone: "error", text: errorMessage(res) },
    );
  };

  return (
    <AuthLayout title="Quên mật khẩu" notice={notice} lead={<p>Nhập username hoặc email. Bạn sẽ nhận một link để đặt mật khẩu mới.</p>}>
      <AuthForm onSubmit={submit} busy={busy} submitLabel="GỬI LINK">
        <Field label="Username hoặc email" value={who} onChange={setWho} autoComplete="username" autoFocus />
      </AuthForm>
      <AuthLinks>
        <a href="#/login">Về đăng nhập</a>
      </AuthLinks>
    </AuthLayout>
  );
}

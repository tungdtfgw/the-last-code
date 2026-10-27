import { useState } from "react";
import type { AccountApi, AccountUser } from "../../account/account-api";
import { errorMessage } from "../../account/account-errors";
import { AuthForm, AuthLayout, AuthLinks, Field, type Notice } from "./auth-layout";

export function LoginScreen(props: { api: AccountApi; notice?: string | null; onSignedIn(user: AccountUser): void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(props.notice ? { tone: "info", text: props.notice } : null);
  const [unactivated, setUnactivated] = useState<string | null>(null);

  const submit = async () => {
    if (!username.trim() || !password) {
      setNotice({ tone: "error", text: "Nhập username và mật khẩu." });
      return;
    }
    setBusy(true);
    const res = await props.api.login({ username, password });
    setBusy(false);
    if (res.ok) return props.onSignedIn(res.data.user);
    setUnactivated(res.error === "not_activated" ? username : null);
    setNotice({ tone: "error", text: errorMessage(res) });
  };

  const resend = async () => {
    if (!unactivated) return;
    setBusy(true);
    const res = await props.api.resendActivation(unactivated);
    setBusy(false);
    setNotice(
      res.ok
        ? { tone: "ok", text: "Đã gửi lại thư kích hoạt. Không thấy thư thì xem cả mục Spam." }
        : { tone: "error", text: errorMessage(res) },
    );
  };

  return (
    <AuthLayout title="Đăng nhập" notice={notice}>
      <AuthForm onSubmit={submit} busy={busy} submitLabel="ĐĂNG NHẬP">
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" autoFocus />
        <Field label="Mật khẩu" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </AuthForm>
      {unactivated && (
        <button type="button" className="btn btn-ghost auth-secondary" onClick={() => void resend()} disabled={busy}>
          Gửi lại thư kích hoạt
        </button>
      )}
      <AuthLinks>
        <a href="#/forgot">Quên mật khẩu?</a>
        <a href="#/register">Chưa có tài khoản? Đăng ký</a>
      </AuthLinks>
    </AuthLayout>
  );
}

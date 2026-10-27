import { useEffect, useRef, useState } from "react";
import type { AccountApi } from "../../account/account-api";
import { errorMessage } from "../../account/account-errors";
import { MAX_PASSWORD, MIN_PASSWORD } from "../../account/account-rules";
import { AuthForm, AuthLayout, AuthLinks, Field, hideToken, type Notice } from "./auth-layout";

/** Sets a new password from a reset link. Every session of the account ends, this browser's included. */
export function ResetScreen(props: { api: AccountApi; token: string | null; onDone(): void }) {
  const token = useRef(props.token);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [state, setState] = useState<"form" | "done" | "invalid">(token.current ? "form" : "invalid");

  useEffect(() => hideToken("reset"), []);

  const submit = async () => {
    const e: typeof errors = {};
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) e.password = `Mật khẩu dài từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự.`;
    if (confirm !== password) e.confirm = "Hai mật khẩu chưa khớp.";
    setErrors(e);
    if (Object.keys(e).length || !token.current) return;
    setBusy(true);
    const res = await props.api.resetPassword(token.current, password);
    setBusy(false);
    if (res.ok) setState("done");
    else if (res.error === "token_invalid") setState("invalid");
    else setNotice({ tone: "error", text: errorMessage(res) });
  };

  if (state === "done") {
    return (
      <AuthLayout
        title="Đã đặt mật khẩu mới"
        lead={<p>Mọi máy đang đăng nhập tài khoản này đã bị đăng xuất. Bạn đăng nhập lại bằng mật khẩu mới.</p>}
      >
        <button type="button" className="btn btn-run auth-submit" onClick={props.onDone} autoFocus>
          ĐĂNG NHẬP
        </button>
      </AuthLayout>
    );
  }

  if (state === "invalid") {
    return (
      <AuthLayout title="Link không dùng được" lead={<p>Link đặt lại mật khẩu đã hết hạn hoặc đã dùng rồi. Bạn xin một link mới.</p>}>
        <AuthLinks>
          <a href="#/forgot">Gửi link mới</a>
          <a href="#/login">Về đăng nhập</a>
        </AuthLinks>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Đặt mật khẩu mới" notice={notice}>
      <AuthForm onSubmit={submit} busy={busy} submitLabel="ĐẶT MẬT KHẨU">
        <Field
          label="Mật khẩu mới"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={errors.password}
          autoFocus
        />
        <Field label="Nhập lại mật khẩu" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
      </AuthForm>
    </AuthLayout>
  );
}

import { useState } from "react";
import type { AccountApi } from "../../account/account-api";
import { errorMessage } from "../../account/account-errors";
import { MAX_PASSWORD, MIN_PASSWORD, isEmail, isUsername, normalizeEmail, normalizeUsername } from "../../account/account-rules";
import { AuthForm, AuthLayout, AuthLinks, Field, useCountdown, type Notice } from "./auth-layout";

const RESEND_WAIT_SEC = 60;

type Errors = Partial<Record<"username" | "email" | "password" | "confirm", string>>;

/** Same rules as the server, so most mistakes show under the field before any request. */
export function checkRegistration(v: { username: string; email: string; password: string; confirm: string }): Errors {
  const e: Errors = {};
  if (!isUsername(normalizeUsername(v.username))) e.username = "Dùng 3–20 ký tự: chữ không dấu, số, dấu gạch dưới.";
  if (!isEmail(normalizeEmail(v.email))) e.email = "Email chưa đúng dạng, ví dụ ten@gmail.com.";
  if (v.password.length < MIN_PASSWORD || v.password.length > MAX_PASSWORD) e.password = `Mật khẩu dài từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự.`;
  if (v.confirm !== v.password) e.confirm = "Hai mật khẩu chưa khớp.";
  return e;
}

export function RegisterScreen(props: { api: AccountApi }) {
  const [values, setValues] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, startWait] = useCountdown();
  const set = (k: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    const found = checkRegistration(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const res = await props.api.register({ username: values.username, email: values.email, password: values.password });
    setBusy(false);
    if (!res.ok) {
      setNotice({ tone: "error", text: errorMessage(res) });
      return;
    }
    setSentTo(normalizeEmail(values.email));
    if (res.data.mailSent) {
      startWait(RESEND_WAIT_SEC);
      setNotice(null);
    } else {
      startWait(res.data.retryAfterSec ?? RESEND_WAIT_SEC);
      setNotice({ tone: "error", text: errorMessage({ error: res.data.mailError ?? "mail_failed", retryAfterSec: res.data.retryAfterSec }) });
    }
  };

  const resend = async () => {
    if (!sentTo) return;
    setBusy(true);
    const res = await props.api.resendActivation(sentTo);
    setBusy(false);
    if (res.ok) {
      startWait(RESEND_WAIT_SEC);
      setNotice({ tone: "ok", text: "Đã gửi lại thư kích hoạt." });
    } else {
      if (res.retryAfterSec) startWait(Math.min(res.retryAfterSec, RESEND_WAIT_SEC));
      setNotice({ tone: "error", text: errorMessage(res) });
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Kiểm tra email"
        notice={notice}
        lead={
          <p>
            Mở thư vừa gửi tới <strong>{sentTo}</strong> và bấm link để kích hoạt tài khoản. Không thấy thư thì xem cả mục Spam.
          </p>
        }
      >
        <button type="button" className="btn btn-ghost auth-secondary" onClick={() => void resend()} disabled={busy || wait > 0}>
          {wait > 0 ? `Gửi lại thư (${wait} giây)` : "Gửi lại thư kích hoạt"}
        </button>
        <AuthLinks>
          <a href="#/login">Đã kích hoạt? Đăng nhập</a>
        </AuthLinks>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Đăng ký" notice={notice}>
      <AuthForm onSubmit={submit} busy={busy} submitLabel="ĐĂNG KÝ">
        <Field
          label="Username"
          value={values.username}
          onChange={set("username")}
          autoComplete="username"
          hint="3–20 ký tự: chữ không dấu, số, dấu gạch dưới."
          error={errors.username}
          autoFocus
        />
        <Field label="Email" type="email" value={values.email} onChange={set("email")} autoComplete="email" error={errors.email} />
        <Field
          label="Mật khẩu"
          type="password"
          value={values.password}
          onChange={set("password")}
          autoComplete="new-password"
          error={errors.password}
        />
        <Field
          label="Nhập lại mật khẩu"
          type="password"
          value={values.confirm}
          onChange={set("confirm")}
          autoComplete="new-password"
          error={errors.confirm}
        />
      </AuthForm>
      <AuthLinks>
        <a href="#/login">Đã có tài khoản? Đăng nhập</a>
      </AuthLinks>
    </AuthLayout>
  );
}

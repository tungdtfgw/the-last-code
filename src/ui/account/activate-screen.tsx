import { useEffect, useRef, useState } from "react";
import type { AccountApi, ApiResult } from "../../account/account-api";
import { errorMessage } from "../../account/account-errors";
import { AuthForm, AuthLayout, AuthLinks, Field, hideToken, type Notice } from "./auth-layout";

type Outcome = "pending" | "done" | "invalid";

/**
 * Sends the activation once when it opens: the request lives in a ref, so a
 * second effect run (StrictMode) reuses it instead of sending again.
 */
export function ActivateScreen(props: { api: AccountApi; token: string | null; signedIn: boolean; onDone(): void }) {
  const token = useRef(props.token);
  const request = useRef<Promise<ApiResult<unknown>> | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(token.current ? "pending" : "invalid");
  const [who, setWho] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    hideToken("activate");
    if (!token.current) return;
    request.current ??= props.api.activate(token.current);
    let alive = true;
    void request.current.then((res) => {
      if (!alive) return;
      setOutcome(res.ok ? "done" : "invalid");
      if (!res.ok && res.error !== "token_invalid") setNotice({ tone: "error", text: errorMessage(res) });
    });
    return () => {
      alive = false;
    };
  }, [props.api]);

  const resend = async () => {
    if (!who.trim()) return setNotice({ tone: "error", text: "Nhập username hoặc email đã đăng ký." });
    setBusy(true);
    const res = await props.api.resendActivation(who.trim());
    setBusy(false);
    setNotice(
      res.ok
        ? { tone: "ok", text: "Nếu tài khoản chưa kích hoạt, bạn sẽ nhận thư mới trong vài phút. Không thấy thư thì xem cả mục Spam." }
        : { tone: "error", text: errorMessage(res) },
    );
  };

  if (outcome === "pending") return <AuthLayout title="Đang kích hoạt…">{null}</AuthLayout>;

  if (outcome === "done") {
    return (
      <AuthLayout title="Tài khoản đã kích hoạt" lead={<p>{props.signedIn ? "Bạn vào game được rồi." : "Bạn đăng nhập bằng username và mật khẩu vừa tạo."}</p>}>
        <button type="button" className="btn btn-run auth-submit" onClick={props.onDone} autoFocus>
          {props.signedIn ? "VÀO GAME" : "ĐĂNG NHẬP"}
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Link không dùng được"
      notice={notice}
      lead={<p>Link kích hoạt đã hết hạn, đã dùng rồi, hoặc bị cắt mất một phần. Nhập username hoặc email để nhận thư mới.</p>}
    >
      <AuthForm onSubmit={resend} busy={busy} submitLabel="GỬI LẠI THƯ">
        <Field label="Username hoặc email" value={who} onChange={setWho} autoComplete="username" />
      </AuthForm>
      <AuthLinks>
        <a href="#/login">Về đăng nhập</a>
      </AuthLinks>
    </AuthLayout>
  );
}

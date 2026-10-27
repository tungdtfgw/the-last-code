import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSettingsStore } from "../storage/create-repository";
import { HttpProgressRepository } from "../storage/http-repository";
import { importLocalProgress } from "../storage/import-local-progress";
import { FatalScreen } from "../ui/fatal-screen";
import { AccountScreen } from "../ui/account/account-screen";
import { ActivateScreen } from "../ui/account/activate-screen";
import { AuthLayout } from "../ui/account/auth-layout";
import { ForgotScreen } from "../ui/account/forgot-screen";
import { LoginScreen } from "../ui/account/login-screen";
import { RegisterScreen } from "../ui/account/register-screen";
import { ResetScreen } from "../ui/account/reset-screen";
import { createAccountApi, type AccountApi, type AccountUser } from "./account-api";
import { isPublicAuthRoute, isSignedOutOnly, parseAuthRoute } from "./auth-route";

type Phase =
  | { kind: "checking" }
  | { kind: "offline" }
  | { kind: "signed-out"; notice: string | null }
  | { kind: "signed-in"; user: AccountUser; repository: HttpProgressRepository };

export interface GameProps {
  user: AccountUser;
  repository: HttpProgressRepository;
  onAccount(): void;
}

const SESSION_ENDED = "Phiên đăng nhập đã hết, bạn đăng nhập lại nhé.";
/** Sign-out waits this long at most for the last writes to land. */
const SIGN_OUT_FLUSH_MS = 3000;

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((next: string, replace = false) => {
    if (replace) window.history.replaceState(null, "", next);
    else if (window.location.hash !== next) window.location.hash = next;
    setHash(next);
  }, []);
  return { hash, go };
}

/**
 * Decides between the account screens and the game (QĐ-09: play needs an
 * account). Signed in, it folds any old local progress into the account, loads
 * the account's progress once, and hands the game an `HttpProgressRepository`.
 */
export function AccountGate({ renderGame, api: given }: { renderGame(props: GameProps): ReactNode; api?: AccountApi }) {
  const api = useMemo(() => given ?? createAccountApi(), [given]);
  const settings = useMemo(() => createSettingsStore(), []);
  const { hash, go } = useHash();
  const route = parseAuthRoute(hash);
  const [phase, setPhase] = useState<Phase>({ kind: "checking" });

  /** Signed in: import old local progress, read the account's progress, build the repository. */
  const enter = useCallback(
    async (user: AccountUser): Promise<boolean> => {
      await importLocalProgress(api);
      const snap = await api.getProgress();
      if (!snap.ok) {
        if (snap.status === 401) setPhase({ kind: "signed-out", notice: SESSION_ENDED });
        else setPhase({ kind: "offline" });
        return false;
      }
      const repository = new HttpProgressRepository(snap.data, api, settings, { userId: user.id });
      setPhase({ kind: "signed-in", user, repository });
      return true;
    },
    [api, settings],
  );

  const check = useCallback(async () => {
    setPhase({ kind: "checking" });
    const me = await api.me();
    if (me.ok) await enter(me.data.user);
    else if (me.status === 401) setPhase({ kind: "signed-out", notice: null });
    else setPhase({ kind: "offline" });
  }, [api, enter]);

  useEffect(() => {
    void check();
  }, [check]);

  // A repository lives as long as its sign-in; a 401 on any write ends the session here.
  const repository = phase.kind === "signed-in" ? phase.repository : null;
  useEffect(() => {
    if (!repository) return;
    const off = repository.onSessionExpired(() => {
      repository.close();
      setPhase({ kind: "signed-out", notice: SESSION_ENDED });
    });
    return () => {
      off();
    };
  }, [repository]);

  // Signed out, only the public account screens; signed in, no login/register/forgot.
  const redirect =
    phase.kind === "signed-out" && !isPublicAuthRoute(route) ? "#/login" : phase.kind === "signed-in" && isSignedOutOnly(route) ? "#/" : null;
  useEffect(() => {
    if (redirect) go(redirect, true);
  }, [redirect, go]);

  /** Lets the last writes land, ends the session, then stops the repository so no retry reaches the next account. */
  const signOut = useCallback(async (): Promise<boolean> => {
    if (phase.kind !== "signed-in") return true;
    phase.repository.flushHeld();
    await Promise.race([phase.repository.idle(), new Promise((r) => setTimeout(r, SIGN_OUT_FLUSH_MS))]);
    const res = await api.logout();
    if (!res.ok) return false; // the cookie is still valid: stay signed in rather than pretend
    phase.repository.close();
    setPhase({ kind: "signed-out", notice: null });
    go("#/login", true);
    return true;
  }, [phase, api, go]);

  /** After a password reset every session is gone, this one included. */
  const afterReset = useCallback(() => {
    if (phase.kind === "signed-in") phase.repository.close();
    setPhase({ kind: "signed-out", notice: null });
    go("#/login", true);
  }, [phase, go]);

  if (phase.kind === "checking") return <AuthLayout title="Đang kết nối…">{null}</AuthLayout>;
  if (phase.kind === "offline") {
    return (
      <FatalScreen
        title="KHÔNG KẾT NỐI ĐƯỢC MÁY CHỦ"
        message="Game cần máy chủ để mở tài khoản và lưu tiến độ. Kiểm tra mạng rồi thử lại."
        action={{ label: "Thử lại", onClick: () => void check() }}
      />
    );
  }
  if (redirect) return null;

  const signedIn = phase.kind === "signed-in";
  switch (route?.kind) {
    case "login":
      return (
        <LoginScreen
          key={phase.kind === "signed-out" ? phase.notice ?? "" : ""}
          api={api}
          notice={phase.kind === "signed-out" ? phase.notice : null}
          onSignedIn={(user) => {
            void enter(user).then((ok) => ok && go("#/", true));
          }}
        />
      );
    case "register":
      return <RegisterScreen api={api} />;
    case "forgot":
      return <ForgotScreen api={api} />;
    case "activate":
      return <ActivateScreen api={api} token={route.token} signedIn={signedIn} onDone={() => go(signedIn ? "#/" : "#/login", true)} />;
    case "reset":
      return <ResetScreen api={api} token={route.token} onDone={afterReset} />;
    case "account":
      if (phase.kind !== "signed-in") return null;
      return <AccountScreen api={api} user={phase.user} onSignOut={signOut} onTitle={() => go("#/")} />;
  }
  if (phase.kind !== "signed-in") return null;
  return renderGame({ user: phase.user, repository: phase.repository, onAccount: () => go("#/account") });
}

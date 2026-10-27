// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import type { AccountApi } from "../../account/account-api";
import { ActivateScreen } from "./activate-screen";
import { RegisterScreen } from "./register-screen";

afterEach(cleanup);

const apiWith = (overrides: Partial<AccountApi>) => overrides as AccountApi;

test("register: mismatched passwords show an error under the field and send nothing", () => {
  const register = vi.fn();
  render(<RegisterScreen api={apiWith({ register })} />);
  fireEvent.change(screen.getByLabelText("Username"), { target: { value: "alice" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@x.io" } });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "password2" } });
  fireEvent.click(screen.getByRole("button", { name: "ĐĂNG KÝ" }));
  expect(screen.getByText("Hai mật khẩu chưa khớp.")).toBeTruthy();
  expect(screen.getByLabelText("Nhập lại mật khẩu").getAttribute("aria-invalid")).toBe("true");
  expect(register).not.toHaveBeenCalled();
});

test("activate: one request even though StrictMode runs the effect twice; the token leaves the address bar", async () => {
  window.history.replaceState(null, "", "#/activate/tok");
  const activate = vi.fn(async () => ({ ok: true as const, status: 200, data: { ok: true as const } }));
  render(
    <StrictMode>
      <ActivateScreen api={apiWith({ activate })} token="tok" signedIn={false} onDone={() => {}} />
    </StrictMode>,
  );
  await act(async () => {});
  expect(activate).toHaveBeenCalledTimes(1);
  expect(await screen.findByText("Tài khoản đã kích hoạt")).toBeTruthy();
  expect(window.location.hash).toBe("#/activate");
});

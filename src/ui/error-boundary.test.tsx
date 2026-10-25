// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

afterEach(cleanup);

function Boom(): never {
  throw new Error("kaboom");
}

test("unexpected React error shows the in-world fatal screen with reload (C8)", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const reload = vi.fn();
  Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload } });
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );
  expect(screen.getByRole("heading", { name: "HỆ THỐNG SỤP ĐỔ" })).toBeTruthy();
  expect(screen.getByText("kaboom")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tải lại" }));
  expect(reload).toHaveBeenCalled();
});

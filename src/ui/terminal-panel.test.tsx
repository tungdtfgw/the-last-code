// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { TerminalPanel } from "./terminal-panel";

afterEach(cleanup);

test("player text is shown as raw text, never parsed as HTML (E10)", () => {
  const evil = '<img src=x onerror="window.__pwned=1">';
  const { container } = render(
    <TerminalPanel
      lines={[{ tone: "reject", text: `> SAI GIÁ TRỊ: ma_xac_thuc = ${evil}` }, { tone: "trace", text: `> TRUY VẾT: dòng 7 — X: ${evil}`, jumpLine: 7 }]}
      stdout={evil}
      stdoutTruncated
      stderr={evil}
      note="nhật ký máy quét"
      onJump={() => {}}
    />,
  );
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain(evil);
  expect(container.textContent).toContain("LUỒNG LỖI (không chấm)");
  expect(container.textContent).toContain("[đã cắt bớt]");
  expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
});

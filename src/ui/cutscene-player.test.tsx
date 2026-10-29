// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { PlayBeat } from "../story/story-types";
import { CutscenePlayer } from "./cutscene-player";

const beats: PlayBeat[] = [
  { kind: "log", text: "Dòng một.", cue: "pulse" },
  { kind: "kai", text: "Dòng hai." },
  { kind: "echo", text: "Dòng ba.", cue: "glitch" },
];

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

const setup = () => {
  const play = vi.fn();
  const onFinish = vi.fn();
  render(<CutscenePlayer beats={beats} play={play} collected={[]} slots={6} onFinish={onFinish} />);
  return { play, onFinish };
};
const live = () => document.querySelector("[aria-live]")!.textContent;
const key = (k: string, init: KeyboardEventInit = {}) => act(() => void fireEvent.keyDown(window, { key: k, ...init }));
const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  act(() => void document.dispatchEvent(new Event("visibilitychange")));
};

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setHidden(false);
});

describe("CutscenePlayer", () => {
  test("Space advances one step; held keys do nothing; Esc finishes once as a skip", () => {
    const { onFinish, play } = setup();
    expect(play).toHaveBeenCalledWith("pulse");
    key(" "); // finish typing beat 1
    expect(live()).toBe("Dòng một.");
    key(" "); // next beat
    expect(live()).toBe("Kai: Dòng hai.");
    key(" ", { repeat: true });
    key("Enter", { repeat: true });
    expect(live()).toBe("Kai: Dòng hai.");
    key("Escape");
    key("Escape");
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith("skip");
  });

  test("a shown beat moves on after its auto delay, but not while the tab is hidden", () => {
    setup();
    act(() => void vi.advanceTimersByTime(26 * 20)); // typing done
    setHidden(true);
    act(() => void vi.advanceTimersByTime(10_000));
    expect(live()).toBe("Dòng một.");
    setHidden(false);
    act(() => void vi.advanceTimersByTime(1200 + 30 * "Dòng một.".length));
    expect(live()).toBe("Kai: Dòng hai.");
  });

  test("reduced motion: every beat at once, TIẾP TỤC focused, no beat cues", () => {
    mockReducedMotion(true);
    const { play, onFinish } = setup();
    for (const b of beats) expect(screen.getByText(b.text)).toBeTruthy();
    const next = screen.getByRole("button", { name: "TIẾP TỤC" });
    expect(document.activeElement).toBe(next);
    expect(play).not.toHaveBeenCalled();
    act(() => void fireEvent.click(next));
    expect(onFinish).toHaveBeenCalledWith("end");
  });

  test("a new backdrop fades in over the old one, which then goes", () => {
    const scenes = () => [...document.querySelectorAll<HTMLElement>(".scene-layer")].map((l) => l.dataset.scene);
    render(
      <CutscenePlayer
        beats={[
          { kind: "log", text: "Một.", backdrop: "tang-ham" },
          { kind: "kai", text: "Hai.", backdrop: "ga-ngam" },
        ]}
        play={vi.fn()}
        collected={[]}
        slots={6}
        onFinish={vi.fn()}
      />,
    );
    expect(scenes()).toEqual(["tang-ham"]);
    key(" ");
    key(" ");
    expect(scenes()).toEqual(["tang-ham", "ga-ngam"]);
    act(() => void vi.advanceTimersByTime(600));
    expect(scenes()).toEqual(["ga-ngam"]);
  });

  test("reduced motion: the transcript sits on the story's first backdrop, still", () => {
    mockReducedMotion(true);
    render(
      <CutscenePlayer
        beats={[
          { kind: "log", text: "Một.", backdrop: "cong-bac", fx: "focus" },
          { kind: "kai", text: "Hai.", backdrop: "terminal", fx: "signal_0xa7" },
        ]}
        play={vi.fn()}
        collected={[]}
        slots={6}
        onFinish={vi.fn()}
      />,
    );
    expect(document.querySelector(".story-backdrop.is-still")).toBeTruthy();
    expect([...document.querySelectorAll<HTMLElement>(".scene-layer")].map((l) => l.dataset.scene)).toEqual(["cong-bac"]);
    expect(document.querySelector(".is-focus, .fx-signal")).toBeNull();
  });
});

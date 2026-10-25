# Cook report: Level 1.4 prototype "Tín hiệu lệch pha"

Plan: `plans/261024-2332-level-1-4-prototype/` (phases 1–10 completed). Date: 2026-10-25.

## What was built

A static Vite 8 + React 19 + TypeScript 7 app that plays all of Level 1.4 in the browser:

- **Level data** `src/levels/level-1-4.json` (briefing, locked lines, objectives, base + counter-attack tests, 3 hints, 28 ECHO reactions, outro, KTS-03 lore). It is validated on load. `import.meta.glob` registry, so a new level is just a new JSON file.
- **Python harness** `src/engine/python/harness.py`, stdlib only, runs in Pyodide 314.0.7 (Python 3.14) and in local `python3`.
  - Grading uses exact types (`type(v) is T`, with captured type references).
  - The alert bar counts statements, not wrapped lines: it counts line events on statement start lines.
  - A 100k line-event loop budget that `except Exception` cannot swallow.
  - Blocked imports, no `input`/`exit`, capped stdout/preview/traceback, safe `repr`, and private references to `math`/`json`/`ast`.
- **Worker + runner**: `py-worker.ts` is a module worker that loads Pyodide from jsDelivr. `PyRunner` handles loading, retry, a 5 s wall-clock timeout with terminate + rebuild, stale `runId` filtering, a single in-flight run, and a proactive rebuild after `resource_limit` or a corrupted report.
- **Grading layer** in `src/game/`: `classifyRun`, `computeStars`, `selectReaction` (with `repeated_fail` on the 3rd identical failure), `buildTerminalLines` (in-world GDD 4.2 log), and the game reducer + `useGame` hook.
  - PM decisions are implemented: stars are cumulative, and > 20 statements = caught by the Sentinel, 0 stars, no counter-attack (the harness skips the counter tests).
- **Storage** `src/storage/`: an async `ProgressRepository` with localStorage and memory implementations.
  - Per-field sanitising, a schema version, and quota/security fallback to "CHẾ ĐỘ KHÔNG LƯU".
  - Best stars, hints and runs never decrease, and an oversized draft never replaces a good one.
  - A static test checks that nothing outside `src/storage` touches `localStorage`.
- **UI** (art direction is recorded in `src/styles/tokens.css`): a dark, cold intrusion-terminal look with Chakra Petch + JetBrains Mono (self-hosted, Vietnamese subset).
  - Fixed type colours: str yellow, int blue, float purple, bool red. Alarm is orange-red with a hazard hatch, an icon and a word.
  - CodeMirror 6 editor with a locked chip block (transaction filter, flash, sound, `aria-live`), click-to-jump traceback lines, and an SVG scanner + gate simulation driven by a pure timeline. The timeline covers packets swelling by length, re-colouring by type, bouncing or breaking, the Sentinel lamp, the OMNI counter-attack banner, and Esc to skip.
  - ECHO wireframe portrait with RGB-split / slice glitch and a typewriter. Hints open in order with confirmation.
  - Native `<dialog>` results showing run count, statement count, alert level and hints opened, plus the lore.
  - Boot overlay with stages, in-world load error with THỬ LẠI, fatal screens, an error boundary, mobile tabs, and reduced-motion support.
- **Audio** `src/audio/`: all cues from phase 9 are procedural Web Audio, with an ambient hum. The `AudioContext` is created only on the first gesture. Mute is persisted (button or `M`). The tab is suspended when hidden, there are at most 8 voices, and close cues are merged.

## How to run

See `README.md`. `npm install`, then `npm run dev` (http://localhost:5173), or `npm run build && npm run preview` (http://localhost:4173). The first load needs network access to `cdn.jsdelivr.net` (~10 MB).

## Verification (real output, final run)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm test` (Vitest) | 17 files, 150 tests passed (includes a pipeline that runs the real harness through `python3`) |
| `npm run test:py` (Python 3.13.2) | 50 tests OK |
| `npm run test:py:3.14` (uv, CPython 3.14.8, same major as Pyodide) | 50 tests OK |
| `npm run build` | OK (one >500 kB chunk warning for React + CodeMirror, accepted) |
| `npm run test:e2e` (Playwright Chromium, build + preview on 4173, real Pyodide from CDN) | 16 passed (~56 s) |

The e2e suite covers:

- **Boot and play:** boot lock (C1), original code (AC 1, 8), TypeError on line 7 (AC 1b), 6.6 → 2 stars + ValueError (AC 2), 6.7 → 3 stars + hints in results (AC 3, 11).
- **Editor:** locked lines vs typing, select-all, insert, clipboard paste and line join (AC 5); reset with a clean undo history (B8); focus kept on the run button (E7).
- **Runner:** double click counts one run (C2); infinite loop then recovery (A11); C-level hang `10**10**8` → wall-clock timeout + worker rebuild (A12); `"x"*10**10` → resource limit (A27).
- **Storage:** reload persistence (AC 10); blocked storage still reaches 3 stars (D1).
- **Layout and network:** 375 px with no horizontal scroll and the run switching to the sim tab (E1, E2); CDN blocked → THỬ LẠI recovers (C3).

**Other checks:**
- Dev server checked manually through Playwright scripts at 1440, 768 and 375 px.
- `render-check.mjs` reported 0 errors. The only warnings were justified `.sr-only` clipping and gutter contrast, which was fixed.
- Keyboard-only tab order was checked.
- Every server I started (dev 5173 via a background task, preview 4173 via Playwright) has been stopped, and both ports are free.

**Code review:** two `code-reviewer` passes. All High and Medium findings were fixed, each with a regression test:
- Wrapped statements inflated the count.
- Patching shared `math`/`json` broke later runs.
- A crash left the game stuck in "running".
- An oversized draft wiped the saved draft.
- Undo after reset was blocked.
- Terminal `aria-live` stopped after 120 lines (now stable ids).
- Focus was lost on run (now `aria-disabled`).
- The mobile load error was hidden.
- A deep recursion flooded the traceback (now capped).
- Internal error class names leaked.
- The odd-limit alert threshold drifted (now integer arithmetic).

## Deviations from the plan text

- Ports are 5173 (dev) and 4173 (preview) as the user required, not the plan's 5174/5175.
- Packet width in the simulation uses `clamp(48, 40 + 18·log2(len), 176)` in a 420-wide viewBox that fits the right column. `ma_xac_thuc` (201 chars) still gets the widest packet.
- Resetting the code rebuilds the editor state, which also clears undo history, instead of dispatching an annotated transaction. The annotation API still exists and is unit tested.

## Known gaps / limitations

- **Edge-case matrix A11 wording:** a bare `except:` wrapped around an *outer* infinite loop escapes the line budget, because CPython unsets the tracer after it raises. It is caught by the 5 s wall-clock timeout, which rebuilds the worker. The player sees the same `timeout` result.
- **Counter-only hangs inside C code** (a hang on the counter inputs only) hit the shared 5 s timeout, so the whole run reports `timeout` / 0 stars instead of keeping the base 2 stars. Python-level loops are unaffected, because the line budget is per test.
- **Manual QA:** rows B5 (drag-and-drop), C4 (unsupported-browser screen), C8 (error boundary), E3–E6 audible checks, E8 reduced motion in the OS and E9 have unit or implementation coverage. They still need the PM's manual QA checklist in `phase-10-hardening-e2e-qa.md` in real Chrome and Safari/Firefox. E2E ran only on Chromium.
- **iOS audio unlock** also listens to `click`/`touchend`, but this has not been tried on a real device.
- **Sandbox escapes** (`__subclasses__`) are an accepted risk: the player can only cheat themselves, as documented in the harness header.

---

## Follow-up (2026-10-25): edge-case gaps closed, manual checks automated

### Changes

1. **Fast budget beats `except:` / `except BaseException` / `finally` and similar.**
   - CPython removes the trace function after it raises.
   - `harness.py` now rewrites the player's AST and inserts a guard call at four places: the start of every `for`/`while` body, every `except` handler, every `finally` block, and every comprehension filter.
   - The call targets a unique string constant. After compiling, that constant is swapped for the guard function inside the code objects. So no name exists that the player can read, rebind or delete.
   - The guard keeps the line number of the statement it precedes, so line numbers and statement counts are unchanged.
   - Proof that the guard is required: with it disabled, the nested bare-`except` case hangs on both 3.13 and 3.14 until the 3 s alarm kills it (exit 142). With the guard, every case returns `timeout` in under 1 s.
2. **A counter-attack hang keeps the base result.**
   - `PyRunner.run` now runs `phase: "base"` and then `phase: "counter"` as separate worker messages, each with its own 5 s timer.
   - If the counter phase hangs, the worker is rebuilt and the result is marked `counter_aborted: "timeout"`.
   - `classifyRun` returns the new key `counter_timeout` and keeps the base stars (2, or 1 if the statement limit was exceeded).
   - Terminal: `> TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG: quá thời gian. Kết quả dữ liệu gốc vẫn được giữ.` ECHO: "OMNI đổi dữ liệu chip. Mã của bạn treo trên dữ liệu mới… Tôi cắt kết nối. Cổng chỉ mở một nửa."
   - Simulation: the packets stay at the source and the gate goes back to half.
3. **Drag and drop:** the e2e test covers synthetic DataTransfer drops on lines 2–4, a real mouse drag of editor text, and a real drag from an element outside the editor. A drop on line 7 is the positive control.
4. **Sound evidence.**
   - The engine has an opt-in probe, `window.__TLC_AUDIO_PROBE__`, active only when a test page defines it.
   - The e2e test checks:
     - No `AudioContext` exists before the first gesture.
     - After the first click or tap the state is `running` and the ambient sound starts.
     - The expected cues fire: `run`, `key_blip`, `scan_reject`, `alarm`, `terminal_line`, `echo_voice`, `scan_pass`, `siren`, `gate_open`, `star`.
     - A hidden tab gives `suspended`; visible again gives `running`.
     - After mute, no cue plays, and that still holds after a reload.
   - Unit test with `OfflineAudioContext` (`node-web-audio-api`): every cue is rendered through the real master/compressor chain. Each peak is between 0.021 (`key_blip`) and 0.189 (`scan_reject`), and each cue goes quiet within its declared duration. The ambient sound is audible but quiet.
   - Fixed a real bug: the `star` cue (and any second cue in a frame) was cancelled when the animation ended. Delayed cues are now scheduled on the audio clock.
5. **Reduced motion:** e2e with `reducedMotion: "reduce"` reaches 3 stars in under 4 s. There is no speaking/shaking class and no typewriter caret, `animation-duration` is about 0, and the ECHO line appears in full at once.
6. **Other browsers.**
   - New Playwright projects: `firefox`, plus `mobile-chromium` (Pixel 7 viewport, touch and isMobile, with a desktop user agent).
   - Why the desktop user agent: with an Android user agent, CodeMirror switches to its Android IME code path, and Playwright's desktop key events don't exercise that path (Enter doesn't split lines). That would be a test artifact, not a game bug.
   - Real bugs found and fixed:
     - On phones, keyboard focus was lost when the game switched tabs during a run and when the results dialog closed. Focus now returns to CHẠY after the code tab is shown again.
     - A horizontally scrolled editor hid the start of each line under the gutter. This was a test-helper issue, fixed in the helper.
   - **WebKit could not run on this machine.**
     - Playwright WebKit builds 2370 (1.64.1) and 2380 (1.65 `next`) segfault at launch on macOS 26.0, headless and headed, inside and outside the sandbox.
     - The `webkit` and `mobile-webkit` projects are in the config behind `E2E_WEBKIT=1` and run unchanged elsewhere.
     - Real Safari 26 is covered by `npm run test:safari` (safaridriver). It checks boot, the original code, refusing a locked line, 3 stars, the audio unlock and the cues, and stops both processes it starts.
     - It currently stops at "You must enable 'Allow remote automation'", which is a setting only the machine owner can turn on.
7. **New automated tests for the remaining matrix rows:**
   - A26: 10^8-character string in Pyodide.
   - C4: module-worker failure → unsupported-browser screen.
   - C8: error-boundary unit test.
   - D7: two tabs.
   - E1: 1280 / 768 / 360 px.
   - E6: hidden tab suspends audio.
   - E7: full keyboard-only playthrough.
   - E9: type labels and alarm icon + word.

`edge-case-matrix.md` now has no QA-only rows. Section F (audio evidence) and row A12b were added. The phase-10 QA checklist is ticked with the evidence for each item; the only open item is real Safari, for the reason above.

### Verification (final run)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm test` (Vitest) | 19 files, 169 tests passed |
| `npm run test:py` (Python 3.13.2) | 59 tests OK |
| `npm run test:py:3.14` (CPython 3.14.8 via uv) | 59 tests OK |
| `npm run build` | OK |
| `npm run test:e2e` (chromium, firefox, mobile-chromium; build + preview on 4173; real Pyodide) | 80 passed, 1 skipped, 0 failed (5.7 m) |
| `npm run test:safari` | not run: Safari remote automation is not enabled on this machine (clear error, processes stopped) |

The skipped test is the keyboard-only playthrough on `mobile-chromium`, which emulates a touch device with no hardware keyboard. It runs on chromium and firefox. Ports 4173, 5173 and 4444 are free, and no process I started is still running.

### Remaining limitations

- WebKit/Safari has no automated run on this machine (see 6). Run `npm run test:safari` once remote automation is enabled, or `E2E_WEBKIT=1 npm run test:e2e` on a machine where Playwright WebKit launches.
- Real Android IME input isn't emulated (see 6). Touch, layout and audio unlock are covered by `mobile-chromium`.
- A hang inside C code during the *base* tests still ends in the 5 s wall-clock timeout with 0 stars. That is intended: the base result doesn't exist yet.

## Quyết định phạm vi trình duyệt (2026-10-25)

Người dùng xác nhận chỉ cần Chrome cho prototype. Safari/WebKit/iOS nằm ngoài phạm vi nghiệm thu: Playwright WebKit 2370 bị segfault khi khởi động trên macOS 26.0 (đã thử lại ngoài sandbox), máy không có runtime iOS Simulator, và chạy Safari thật cần bật "Allow remote automation". Khi cần kiểm Safari: bật thiết lập đó rồi chạy `npm run test:safari`.

Kiểm chứng cuối của PM: typecheck qua, Vitest 169/169, Python 59/59, build thành công, e2e Chromium + Firefox 54/54 với Pyodide thật; chơi tay trên Chrome xác nhận vòng lặp trong `except:` trống bị cắt nhanh (~3,2 s kể cả hiệu ứng) và treo chỉ ở lượt phản công vẫn giữ 2 sao.

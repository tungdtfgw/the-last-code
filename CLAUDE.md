# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Mã Cuối Cùng" (The Last Code): a browser game that teaches Python. The current code is a playable prototype of Level 1.4 "Tín hiệu lệch pha". There is no backend. Player code runs in Pyodide inside a Web Worker. All in-game text is Vietnamese; code identifiers are English.

Sources of truth, in priority order:
1. `plans/reports/brainstorm-261024-2316-level-1-4-prototype.md`: the accepted contract. It wins over the GDD where they differ.
2. `Ma_Cuoi_Cung_GDD.md` (v0.2): the game design. Section 4.5 holds the counting and star rules, 4.1 the ECHO rules.
3. `docs/nhat-ky-loi-prototype-1-4.md`: past bugs and their root causes. Read it before touching the runner, harness, audio or intro.
4. `plans/261024-2332-level-1-4-prototype/edge-case-matrix.md`: about 60 edge cases, each mapped to the test that covers it.

## Commands

```bash
npm run dev                  # Vite on :5173 (strict port; check `lsof -i :5173` first, the user often has one running)
npm run build                # tsc --noEmit + vite build
npm run preview              # serve the build on :4173
npm run typecheck
npm test                     # Vitest: src/**/*.test.ts(x) + tests/integration (runs the real harness via local python3)
npx vitest run src/game/compute-stars.test.ts      # single Vitest file
npx vitest run -t "counter_timeout"                # by test name
npm run test:py              # unittest for the Python harness (python3 >= 3.13)
python3 -m unittest tests.python.test_harness.<Class>.<test>   # single Python test
npm run test:py:3.14         # same suite on 3.14 (Pyodide's version; needs uv)
npm run test:e2e             # Playwright against build+preview on :4173, real Pyodide from cdn.jsdelivr.net
npx playwright test tests/e2e/intro.spec.ts --project=chromium -g "skip"   # narrow e2e run
```

E2E notes:
- Projects are `chromium`, `firefox` and `mobile-chromium`. WebKit is opt-in with `E2E_WEBKIT=1` because Playwright WebKit segfaults on macOS 26.
- The `webServer` config starts its own preview on :4173, so nothing else may hold that port.
- The full suite takes about 7 minutes. Run the relevant spec first.
- Every e2e test must pass the level's entry gate. Use `enterMission(page)` from `tests/e2e/helpers.ts` after every `goto` or `reload`.

## Architecture

### Run pipeline

One click on CHẠY flows through these stages:

1. **`src/game/use-game.ts`** is the game loop hook. It wires the runner, grading, ECHO and storage together. State lives in a pure reducer, `game-reducer.ts`, whose phases are `booting → ready → running → animating`.
2. **`src/game/prepare-source.ts`** replaces the locked lines (the chip input values) with blank lines. Inputs are injected into the Python namespace instead, so editor line numbers match tracebacks and locked lines are never counted.
3. **`src/engine/py-runner.ts`** (`PyRunner`) posts to **`py-worker.ts`**, which loads Pyodide and the harness (`import harnessSource from "./python/harness.py?raw"`).
   - A run is two separate messages: `phase: "base"` (the normal tests) and then `phase: "counter"` (OMNI counter-attack). Each has its own 5 s wall-clock timer.
   - On a timeout the worker is terminated and rebuilt.
   - A hang during the counter phase keeps the base result.
   - The message types are in `worker-protocol.ts`.
4. **`src/engine/python/harness.py`** uses only the standard library, so the same file runs in Pyodide and in local CPython for tests. It handles:
   - counting statements with `sys.settrace` (statements, not lines)
   - an AST-injected loop/except/finally guard. CPython drops the tracer after it raises, so a bare `except:` would otherwise escape the budget.
   - blocking imports (`js`, `os`, `sys`, `pyodide`…)
   - exact type checks (`type(v) is T`, so `True` is not an `int`)
   - float tolerance
   - truncating tracebacks and output
5. **`src/game/classify-run.ts`** maps the harness JSON to a `ReactionKey` and an outcome.
   - `compute-stars.ts` is the only place stars are decided. Stars are cumulative. Going over 100% alert (`limit / 0.4` statements) means caught: 0 stars and no counter-attack.
   - `echo-reactions.ts` picks ECHO's line. Free reactions must never contain `int`, `float`, `round` or the answer; `echo-forbidden-terms.test.ts` enforces this.
   - `terminal-lines.ts` builds the in-world log.
6. The UI plays the result back. `src/ui/scanner-simulation.tsx` plus `scanner-timeline.ts` animate the outcome after the run finishes; they do not run live. The terminal and ECHO update when the animation is done.

### Levels are data

`src/levels/*.json` is loaded with `import.meta.glob` in `level-registry.ts` and validated by `validate-level.ts`. A new level should need only a JSON file. That covers `inputs`, `locked_lines`, `objectives`, `alert_limit_statements`, `tests` and `counter_attack_tests` with `expected` values, `hints`, about 30 `reactions` keyed by `ReactionKey`, `outro` and `lore_fragment`. Test fixtures, including a second level, are in `tests/fixtures/`.

### Storage boundary

`src/storage/progress-repository.ts` defines the async `ProgressRepository` interface, which is the only door to persisted state:
- The implementations are `localStorage` (versioned key `the-last-code:progress:v1`) and in-memory. The in-memory one is the "CHẾ ĐỘ KHÔNG LƯU" fallback for when storage is blocked.
- A test fails if anything outside `src/storage/` touches `localStorage`.
- A future Supabase implementation replaces this module only.

### UI, intro and audio

- `src/ui/game-screen.tsx` lays out three columns: mission, code and simulation. Under 768 px these become three tabs.
- The page never scrolls. Each panel scrolls on its own, with a sticky heading (`.col > .panel` rules in `src/styles/global.css`). Design tokens are in `tokens.css`.
- **Level intro**, also in `game-screen.tsx`:
  - It runs in the order `gate → briefing → objectives → done`.
  - The `IntroGate` click is the first user gesture and unlocks audio.
  - The briefing types out with `useTypewriter`, then the objectives lock in one by one, then the alert meter appears, then ECHO wakes.
  - Any click or key skips to `done`; tab clicks do not count.
  - With `prefers-reduced-motion`, everything shows instantly.
- **Audio** (`src/audio/`) is procedural Web Audio with no asset files:
  - `sound-recipes.ts` defines one `Cue` per sound. Adding a cue means adding a recipe; `sound-render.test.ts` renders every recipe with `OfflineAudioContext`.
  - No `AudioContext` exists before the first gesture.
  - Delayed cues must be scheduled on the audio clock (`play(cue, delayMs)`), not with JS timers, which re-renders cancel.
  - Mute is persisted.
- **Test instrumentation:** e2e tests read `window.__TLC_AUDIO_PROBE__` when a page defines it before load; it is inert otherwise. Note that the Claude-in-Chrome screenshot action sends pointer events, which skip the intro. Verify the intro with the probe or with e2e tests, not with mid-animation screenshots.

## Repo conventions

- Markdown goes only in `plans/` (plans and reports, named `{type}-{YYMMDD-HHMM}-{slug}.md`) or `docs/`.
- `.claude/rules/` holds the workflow rules: brainstorm → plan → cook → test → review.
- The directory is not a git repo yet.

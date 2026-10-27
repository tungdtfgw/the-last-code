# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Mã Cuối Cùng" (The Last Code): a browser game that teaches Python. The current code is a game shell (title screen, prologue, transitions between levels, the "Còn tiếp" teaser and the Dark Zone map) around two playable levels: 1.1 "Khởi động" (`print`, graded on stdout) and 1.4 "Tín hiệu lệch pha". Playing needs an account (username + password, activated by an email link); progress lives on the server (Vercel Function + Cloudflare D1 through a gateway Worker). Player code still runs only in Pyodide inside a Web Worker; the server never runs Python. All in-game text is Vietnamese; code identifiers are English.

Sources of truth, in priority order:
1. `design/quyet-dinh/level-1-4-prototype.md`: the accepted contract. It wins over the GDD where they differ.
2. `design/gdd.md` (v0.2): the overall game design. Section 4.5 holds the counting and star rules, 4.1 the ECHO rules. Per-level designs live in `design/chuong-<n>/gdd-<chapter>.<level>-<slug>.md`; the game opening is `design/gdd-mo-dau.md`.
   - For the shell and story: `design/gdd-mo-dau.md` (opening script, transitions, map, unlock rules) and its contract `design/quyet-dinh/mo-dau-va-cot-truyen-chuong-1.md`.
   - Accepted design contracts for the other levels and features are in `design/quyet-dinh/`; the engine contract for levels 1.1–1.3 is `docs/hop-dong-engine-level-1-1-den-1-3.md`.
   - Player-facing text (briefing, task steps, objective labels, hints, ECHO reactions, outros, story beats, knowledge summaries) lives only in D1 (`content_text`, documents `level:<id>` / `chapter:1`). GDDs describe each text's intent and point to its field in that document (e.g. "`hints` (D1, `level:1.1`)"); they never copy the wording. Change wording on `#/admin`; change the GDD only when the intent changes (`design/quyet-dinh/nguon-duy-nhat-cho-cau-chu.md`). Text quoted in `design/quyet-dinh/` records what was decided at the time and is not updated.
3. `docs/nhat-ky-loi-prototype-1-4.md`: past bugs and their root causes. Read it before touching the runner, harness, audio or intro.
4. `docs/ma-tran-edge-case-1-4.md`: about 60 edge cases, each mapped to the test that covers it.
5. Player-facing text has one home, D1 (QĐ-16). `src/levels/*.json` and `src/story/chapter-1.json` hold the puzzle only; a document's first text arrives with a SQL migration (`db/migrations/*_content_*.sql`; chapter 1 and levels 1.1–1.4 are in `0004_content_chapter_1.sql`) and the admin page only edits it. Tests read the text from the migrations (`tests/content-fixture.ts`).
6. `docs/quyet-dinh-ky-thuat.md`: technical decisions (hosting, database, mail, accounts, password hashing) and why. Whenever a technology choice or an architecture decision changes, log it there as a new entry and mark the replaced entry's status; never delete old entries.

## Commands

```bash
npm run dev                  # Vite on :5173 with the local API (strict port; check `lsof -i :5173` first, the user often has one running)
npm run build                # tsc --noEmit + vite build
npm run preview              # serve the build on :4173
npm run typecheck
npm test                     # Vitest: src/**/*.test.ts(x), server/**, workers/d1-gateway/src/** and tests/integration (runs the real harness via local python3)
npx vitest run src/game/compute-stars.test.ts      # single Vitest file
npx vitest run -t "counter_timeout"                # by test name
npm run test:py              # unittest for the Python harness (python3 >= 3.13)
python3 -m unittest tests.python.test_harness.<Class>.<test>   # single Python test
npm run test:py:3.14         # same suite on 3.14 (Pyodide's version; needs uv)
npm run content:migration -- <text.json> [--doc level:1.5]   # check a new document's text, write its db/migrations/<next>_content_*.sql
npm run test:e2e             # Playwright against build+preview on :4173, real Pyodide from cdn.jsdelivr.net
npx playwright test tests/e2e/intro.spec.ts --project=chromium -g "skip"   # narrow e2e run
```

E2E notes:
- Write e2e specs with the feature, but run them only when the user asks. Default verification is typecheck, `npm test`, `npm run test:py` and `npm run build`.
- Projects are `chromium`, `firefox` and `mobile-chromium`. WebKit is opt-in with `E2E_WEBKIT=1` because Playwright WebKit segfaults on macOS 26.
- The `webServer` config starts its own preview on :4173, so nothing else may hold that port.
- The full suite takes about 7 minutes. Run the relevant spec first.
- Every route needs a signed-in player. Specs import `test`/`expect` from `tests/e2e/fixtures.ts`, not `@playwright/test`: each test gets a fresh activated account (made through the real API, mails read from `.data/e2e-outbox/`) and its session cookie. A test that builds its own context uses `newSignedInContext(browser, options)`. The preview server runs with `DB_DRIVER=sqlite`, `SQLITE_PATH=.data/e2e.sqlite`, `AUTH_RATE_LIMIT=off`; both are wiped before each run.
- The preview server also gets `ADMIN_USERNAMES=e2e_admin`; `createAccount({ username: ADMIN_USERNAME })` registers it once and signs in afterwards. `admin.spec.ts` saves into the shared database, so it runs on `chromium` only, in order, and puts the migrated 1.1 text (revision 1) back at the end.
- The fresh e2e database gets the real text from the migrations. A spec that needs a level's text reads it with `realLevelJson(id)` from `tests/content-fixture.ts` (no JSON module imports there, so Playwright can load it), never from `src/levels/*.json`.
- Seeding progress with `localStorage` in `addInitScript` still works: on entry the game folds it into the account (idempotent, never overwrites a server draft) and clears it.
- Drafts reach the server at most every 10 s per level, or at once when the page is hidden or left. To check a draft from another tab, navigate the writing tab away first.
- `/` is the title screen. Level tests open `LEVEL_URL` (`/#/level/1.4`) or call `gotoLevel(page, id)`; every one must pass the level's entry gate with `enterMission(page)` after every `goto` or `reload`. `enterMission` waits for the gate's `data-armed="true"`.
- `page.goto` to the same URL with only a hash is a same-document navigation, not a reload. Reload when a test needs a fresh start.

## Architecture

### Shell and routing

- `src/app.tsx`: `App → ErrorBoundary → Boot → AccountGate → Shell`. `Shell` (keyed by user id) gets the repository and user from the gate and owns `useAudio`, the hash route, a progress snapshot (`src/shell/use-progress-snapshot.ts`) and the global `M` key, and renders one of four screens: `TitleScreen`, `ChapterMap`, `StoryScreen`, `GameScreen`.
- `GameRoot` (in `app.tsx`) applies the account's D1 text: `getChapter(texts)` and `buildRegistry(bundledLevelModules(), texts)`, memoised on `texts`; a broken chapter shows "DỮ LIỆU CHƯƠNG HỎNG" (now only after sign-in).
- Routes (`src/shell/route.ts`): `#/` (empty or unknown → title), `#/map`, `#/story/<id>`, `#/level/<id>`. `use-hash-route.ts` pushes for player actions and replaces (`history.replaceState` plus a manual state update) for redirects and finished stories, so Back never replays a story.
- Every route goes through `guardRoute`: unbuilt or broken levels, unknown stories and `after-<id>` for a level without a star go to the map. Built levels are always reachable by link, even when locked on the map.
- A broken chapter file shows "DỮ LIỆU CHƯƠNG HỎNG". A broken level file shows as "TÍN HIỆU HỎNG" on the map.

### Story

- `getChapter(texts)` (`src/story/chapter.ts`) checks `texts["chapter:1"]` with `validateChapterText` and applies it to `prologue[].text`/`teaser[].text`; no row, or text that does not fit the beats, is "DỮ LIỆU CHƯƠNG HỎNG".
- `src/story/chapter-1.json`: level order (`levels`), `neural_id_slots`, the 23-beat `prologue` and the 9-beat `teaser` (kinds, cues, backdrops, holds; the beat text is in D1). Validated by `validate-chapter.ts`; beats by `validate-beats.ts` (kinds `log|kai|echo|card`, `cue` from `CUES`, `backdrop`, `fx`, `hold_ms`; ECHO lines go through `findEchoLeak`).
- `progression.ts` is the only place that decides unlocking, map node states, where every TIẾP TỤC goes, where a story leads when it ends (`storyEnd`, `forward` skips stories already seen) and the route guard. "Built" rule: rules follow `chapter.levels` but skip levels without a valid JSON file; the first built level is open, the next opens when the previous built one has a star. The prologue leads to the first built level; `after-<id>` leads to the next built level, or to the teaser when none is left.
- `build-story.ts` assembles `after-<id>` from the level: `outro` → `lore_fragment` (kind `lore`) → component card (`NEURAL-ID GIẢ · THÀNH PHẦN n/6`) → `outro_beats`.
- `cutscene-reducer.ts` (pure) and `src/ui/cutscene-player.tsx` play any story: click, tap, Space or Enter advance one step, held keys are ignored, Esc or BỎ QUA skip; a shown beat auto-advances after `1200 + 30 ms/char + hold_ms`, paused while the tab is hidden; a `card` wipes the beats before it. Reduced motion shows a transcript with a focused TIẾP TỤC and no beat cues.
- Opened directly (no gesture yet), a story starts behind `StoryGate` ("TIẾP TỤC ĐOẠN TRUYỆN"). A story is marked seen when it ends or is skipped; replays from the map return to the map.

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
   - NFC on every string comparison (`str` variables and output lines)
   - grading stdout line by line against a test's `expected_output`: `\r\n`/`\r` → `\n`, trailing spaces and trailing empty lines dropped, the rest exact; still graded when the run fails (so the simulation can show what went out), but a failing or truncated run never passes. stderr has its own buffer and is never graded.
   - truncating tracebacks and output
   - with `trace_vars` in the config (`build-config.ts` sets it for `kiosk` levels only): `var_history`, the objective variables' changes as `{line, var, type, preview, src}`. Compared by identity, previewed without running player code, at most 40 entries (`var_history_truncated`). `src` is the input whose loaded object the value is, so text typed by hand never counts as read from the buffer. Cost on Pyodide: `docs/do-chi-phi-var-history.md`.
5. **`src/game/classify-run.ts`** maps the harness JSON to a `ReactionKey` and an outcome.
   - `compute-stars.ts` is the only place stars are decided. Stars are cumulative. Going over 100% alert (`limit / 0.4` statements) means caught: 0 stars and no counter-attack.
   - Order: run errors, then variables, then the topmost wrong output line (`output_missing`, `output_case_only`, `output_mismatch`, details `{out_line}`, `{col}`), then `output_extra`. A wrong output under counter-attack is `wrong_value_counter`.
   - Optional keys refine a general one and are returned only when the level writes a line for them (`levelHasLine` in `classify-run.ts`, the one gate for all of them): `value_is_label` (a `str` variable holding the text of an input or objective name, e.g. `'goi_3'`) refines `wrong_value`. `RunOutcome.history`/`counterHistory` carry `var_history` to the simulation.
   - `echo-reactions.ts` picks ECHO's line. Free reactions (and ECHO beats in `outro_beats`) must never contain a forbidden term or an answer: `echo-leaks.ts` matches `int|float|round` plus the level's `forbidden_terms`, every `expected` value and every `expected_output` line, case-insensitive on Unicode word boundaries (punctuation-only terms as substrings). Hints are exempt. `echo-forbidden-terms.test.ts` and the validator enforce it.
   - `terminal-lines.ts` builds the in-world log; words that belong to a kind of simulation ("máy quét"/"CỔNG" vs "trạm R-17"/"KÊNH", result titles, panel notes) come from `sim-vocabulary.ts`. `output-diff.ts` builds the `cần:`/`nhận:` pair (`·` space, `→` tab, `▯` missing, `U+XXXX` for non-ASCII) for the terminal and the relay list.
6. The UI plays the result back after the run finishes; nothing runs live. Each simulation is a pure timeline (`scanner-timeline.ts`, `relay-timeline.ts`, `kiosk-timeline.ts`, `sorter-timeline.ts`, all tested) plus a component (`scanner-simulation.tsx`, `relay-simulation.tsx`, `kiosk-simulation.tsx`, `sorter-simulation.tsx`) that plays it through `use-timeline-playback.ts` (frame holds, cues on the audio clock, Esc/skip, reduced motion, `onDone`). The terminal and ECHO update when the animation is done.

### Levels are data

`src/levels/*.json` (the puzzle) is loaded with `import.meta.glob` in `level-registry.ts`, gets its D1 text applied and is validated by `validate-level.ts`. A new level needs a JSON puzzle file plus a text migration made with `npm run content:migration` from a text document (the `extractText` shape, written by the designer, usually kept in `plans/`); no code. Between them they cover `inputs`, `locked_lines`, `objectives`, `alert_limit_statements`, `tests` and `counter_attack_tests` with `expected` values, `hints`, about 30 `reactions` keyed by `ReactionKey`, `outro` and `lore_fragment`, plus the optional story fields `location` (entry gate line and simulation panel title), `component` (the Neural-ID component it builds) and `outro_beats`. The level id must also be listed in `chapter-1.json` `levels` (a test fails otherwise); that is enough for it to appear on the map and in the flow. Test fixtures, including a second level, are in `tests/fixtures/`.
- `simulation: { "kind": … }` picks the scene in `src/ui/level-simulation.tsx` (missing: `scanner`). Kinds in `SIMULATION_KINDS` only (today `scanner`, `relay` with a required `station` call sign, `kiosk` with `devices`: 1–3 objectives drawn as reader screens, the other 1–6 objectives are memory cells, `sorter` with no options: four type lanes); the validator rejects a kind with no scene. A new kind adds a timeline, a component, a vocabulary entry and one branch.
- Objectives are either variables (`{var, type, label}`, optional `kind: "var"`) or output lines (`{kind: "output_line", line, label}`, lines exactly 1..N). With N output lines, every test and counter test needs `expected_output` with exactly N lines (no newlines, no trailing spaces); `expected` only lists the variable objectives.
- A variable objective's `type` is `int|float|str|bool`, or `type`: the variable must hold a shape itself, graded `type(v) is type and v is <shape>`, and its expected value names one of the four (`"int"`). A string `"int"` or `"<class 'int'>"` counts as the right content in the wrong shape.
- Test `inputs` values may be strings, numbers or bools; they are injected with that Python type and shown in Python syntax (`"7351"`, `4096`, `True`). A round float (`2.0`) arrives as an `int` through JSON, so do not use one as a float input.
- Optional reaction keys (`value_is_label`, `type_mismatch_unknown_shape`) are returned only when the level writes a line for them (`levelHasLine` in `classify-run.ts`); otherwise the general key applies.
- `forbidden_terms` (optional) adds words to ECHO's banned list; it never replaces the common list.
- `task_steps` (optional, 2–4 non-empty strings) is the "Việc cần làm" list appended to ECHO's first "Vào nhiệm vụ" chat message (`task-steps-panel.tsx`); backticks render as code. It must not contain any expected value or expected output line (forbidden terms do not apply, so it may name `print`).
- `knowledge_summary` (optional: `title`, `sections[{heading, body, code?, output?}]`, `mistakes[{code, error, explain}]`, `next`) is the "Tổng kết kiến thức" screen at `#/learn/<id>`: results TIẾP TỤC → summary → `after-<id>` (routing in `src/story/progression.ts`); the map re-opens it. No leak check. `tests/integration/knowledge-summary.test.ts` runs every section `code` with python3 and requires a clean run printing exactly `output`; failing code goes in `mistakes`.
- The run button glows until the first run of a level (`progress.runs === 0`).
- Text vs puzzle: `src/content/text-fields.ts` (`LEVEL_TEXT`, `CHAPTER_TEXT`) lists which fields are player-facing text, with array anchors (`objectives` by `var`/`line`, beats by `kind`, `mistakes` by `code`). No repo file may hold a text field (`text-fields.test.ts` checks `stripText(file)` is the file). `extractText`, `stripText`, `applyText` (never touches other fields; an element whose anchors do not match gets no text and is reported in `drift`) and `checkTextShape` work from it, and `src/content/validate-text.ts` (`validateLevelText`/`validateChapterText`: shape → apply, any drift is an error → validator → `echoLineLeaks`) is the one check for text in the game, on the server, in the migration script and in the admin form. `buildRegistry(modules, texts)` runs it on `texts["level:<id>"]`; a bundled level without a row (`NO_TEXT`) or with failing text is broken ("TÍN HIỆU HỎNG"). A new text field in the schema must be added to `text-fields.ts` (`text-fields.test.ts` fails otherwise).
- Tests get the real text from `tests/content-fixture.ts`: `migratedTexts()` applies every migration to an in-memory SQLite, `realLevel(id)`/`realLevelJson(id)`/`realChapter()`/`realChapterJson()`/`realRegistry()` lay it onto the puzzle files, `registryOf(modules)` builds a registry of made-up levels that carry their own text. Tests that need only the puzzle may import the JSON. `server/content/content-migration.test.ts` requires every bundled level and chapter 1 to have a migrated row that passes the check, so a level file without its text migration fails `npm test`.
- Changing the puzzle structure of a level that already has text (an added objective, a changed beat kind): write a patch migration with `json_set`/`json_insert`, bump `revision` and add a history row (`docs/huong-dan-deploy.md` §9 has the pattern); never regenerate the text migration.

### Storage boundary

`src/storage/progress-repository.ts` defines the async `ProgressRepository` interface, which is the only door to persisted state:
- The game uses `HttpProgressRepository` (`http-repository.ts`): built from one `GET /api/progress` snapshot and kept in memory, so reads never hit the network. Memory is the player's truth: writes merge into it with `mergeLevelProgress`/`mergeStory`, and every PUT is built at send time from memory with the level's whole state (stars, runs, hints always; the draft plus its edit-time `draftRev` until a 2xx confirms that revision). The server keeps MAX for counters and the highest `draftRev` for the draft (`level_progress.draft_rev`), so arrival order does not matter and any later success repairs an earlier failure. Answers only raise memory, never lower it. Draft-only changes go out at most every 10 s per level; other changes go at once; while the page is hidden, or on `visibilitychange`/`pagehide`, unconfirmed drafts go at once. Network errors and 5xx retry after 1, 3, 9 s, then `onPersistenceLost` ("CHẾ ĐỘ KHÔNG LƯU"); other 4xx count as lost at once; 401 fires `onSessionExpired` (the gate goes to `#/login`). Writes carry `x-tlc-user`; the server answers 409 if the session belongs to someone else. Sign-out flushes, waits up to 3 s, logs out, then `close()` stops every retry. `keepalive` only under 60 KB with no other keepalive request in flight.
- Settings (mute) stay on the device: `createSettingsStore()` (`localStorage`, memory when blocked).
- `localStorage` (`the-last-code:progress:v1`) and in-memory implementations remain. On entry `importLocalProgress` folds old local progress into the account (`POST /api/progress/import`) and removes only the progress key; network/5xx keeps it for next time, other 4xx drops it.
- Seen stories: `getStory()` / `markStorySeen(id)`; merging is a set union that never removes. Unlocking has no stored state: it is derived from `bestStars`.
- A test fails if anything outside `src/storage/` touches `localStorage`.

### Accounts and server

- `src/account/account-gate.tsx` decides between account screens and the game: `GET /api/auth/me` → 401 shows the account screens (anything else redirects to `#/login`), network/5xx shows "KHÔNG KẾT NỐI ĐƯỢC MÁY CHỦ". Signed in, it imports old local progress, loads the snapshot and the D1 text (`GET /api/content/text`, in parallel; failure is "KHÔNG KẾT NỐI ĐƯỢC MÁY CHỦ") and renders `GameRoot`. Account hashes (`src/account/auth-route.ts`): `#/login`, `#/register`, `#/forgot`, `#/account`, `#/activate/<token>`, `#/reset/<token>`, and the admin page `#/admin`, `#/admin/level/<id>`, `#/admin/chapter/<id>` (signed-in admins only, others go to `#/`; the Tài khoản screen shows "Quản lý kịch bản" to admins; screens in `src/ui/admin/`, the form drawn from `text-fields.ts`, state in the pure `editor-reducer.ts`; a save updates the gate's `texts`, so the game shows it without a reload); the game router reads them as unknown. Activate/reset screens take the token out of the address bar. Screens: `src/ui/account/`; copy in `account-errors.ts`; field rules shared with the server in `src/account/account-rules.ts`.
- Content: `GET /api/content/text` (any player: `{docs: {"level:1.4": {revision, text}}}`, rows only) and `/api/admin/content[/(level|chapter)/<id>[/history[/<rev>]]]` (session + username in `ADMIN_USERNAMES`, checked per request: 401/403; `me`/`login` return `user.isAdmin`). PUT takes `{baseRevision, text}` → 200, 422 `invalid_text` with `{path, message}` errors, 409 `stale_revision`, 404 `no_text`. `server/content/`: `bundled-content.ts` reads the deploy's JSON with `fs` (`vercel.json` `includeFiles`), `content-store.ts` (`content_text`, `content_text_history`; conditional write plus history row in one batch guarded by `changes() = 1`), `admin-content.ts` (a document without a row is listed with an error; GET/PUT for it → 404 `no_text`; nothing creates a row), `content-migration.ts` (the SQL of a text migration: revision 1 plus history, `ON CONFLICT DO NOTHING`, each statement under D1's 100 KB), `content-migration-cli.ts` (`npm run content:migration`, loaded by `scripts/content-migration.mjs` through `runnerImport`).
- `server/router.ts` is the whole API (`createHandler(deps)` for tests, `handle` for Vercel). `api/index.ts` exports it (`vercel.json` rewrites every `/api/*` there; a `[...path]` file name is not routed outside Next.js); `server/vite-api-plugin.ts` serves it in `vite dev`/`preview` through `server/local-handler.ts` (loaded once with Vite's `runnerImport`, so every driver is imported statically there). Writes must be JSON (415 otherwise; with `SameSite=Lax` this is the CSRF guard); body limits in bytes (16/256/512 KB).
- `server/auth/accounts.ts`: register, activate (`alreadyActive` on a reused link of an active account), resend, login, password reset by email; `md5(salt + password)` in `password.ts` (QĐ-07). Tokens, session ids: 32 random bytes, only SHA-256 stored. One-time token claims are an `UPDATE … RETURNING` and the dependent statements in the same batch are guarded by `changes() = 1` (or the fresh salt), never by timestamps. Rate limits (`rate-limit.ts`) count first, decide after, in one statement: 10 wrong logins per username lock it for 15 min from the tripping attempt, 1 mail/min and 5/day per address, 60 register/resend/forgot requests an hour per network (IPv4 address or IPv6 /64 from `x-forwarded-for`, counted whether or not the account exists), 450 mails/day overall of which first activation mails may use 300 (QĐ-14). `AUTH_RATE_LIMIT=off` drops only the per-address and per-network limits and only with `DB_DRIVER=sqlite`.
- `server/db/`: `Db.batch(statements)` runs in one transaction. `SqliteDb` (`node:sqlite`) applies `db/migrations/*.sql` itself, tracked in `d1_migrations` like wrangler. `GatewayDb` posts to `workers/d1-gateway` (Bearer secret, max 64 statements / 512 KB). The Worker's entry module may export only handlers (workerd rejects other exports), so its logic lives in `gateway.ts`.
- `server/config.ts` reads the environment once: `DB_DRIVER` (`gateway` default, `sqlite`), `D1_GATEWAY_URL`, `D1_GATEWAY_SECRET`, `SQLITE_PATH`, `MAIL_TRANSPORT` (`smtp` default, `outbox` only with sqlite), `OUTBOX_DIR`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `APP_ORIGIN` (mail links; `https` turns on `Secure` cookies), `AUTH_RATE_LIMIT`, `ADMIN_USERNAMES` (comma-separated, optional; a name without an activated account is logged at start-up). Local only (`server/local-handler.ts`, SQLite): `LOCAL_ADMIN_USERNAME`/`LOCAL_ADMIN_PASSWORD` (optional `LOCAL_ADMIN_EMAIL`) provision an activated admin account on start (`server/local-admin.ts`); `vite dev` fills unset variables from `.env`/`.env.local`, `vite preview` does not. Missing values → 500 `server_misconfigured`, names logged.
- Relative imports in `server/`, `api/` and the `src/` files the server uses must end in `.js` (Vercel does not add extensions); `server/imports.test.ts` enforces it and keeps those `src/` files (`SHARED_SRC`: the validators, `level-types`, `echo-leaks`, `echo-line-check`, `story-types`, `cue-names`, `src/content/*`, …) importing only each other at runtime, with no `import.meta.glob`, `window` or `document`. `server/client-bundle.test.ts` checks `dist/` holds no server code.
- Server progress (`server/progress/progress-store.ts`) merges in SQL with the same rules as `mergeLevelProgress`; import only fills an empty draft (`COALESCE`). An account holds at most 100 level rows and 200 seen stories (413 `too_many_levels`).
- Deploy steps: `docs/huong-dan-deploy.md`.

### UI, intro and audio

- `src/ui/game-screen.tsx` lays out three columns: mission, code and simulation. Under 768 px these become three tabs. The top bar has a BẢN ĐỒ button; the results dialog has TIẾP TỤC (primary, goes to the next story or level) and "Tối ưu tiếp", and shows "Đã thu: <component>" instead of the outro and lore.
- The page never scrolls. Each panel scrolls on its own, with a sticky heading (`.col > .panel` rules in `src/styles/global.css`). Design tokens are in `tokens.css`.
- The mission column holds only the briefing and the objectives. ECHO and the hint log live in `src/ui/echo-chat.tsx`, a floating, non-blocking chat:
  - A portrait button with an unread dot, a preview bubble for each new line, and a chat panel with the session's ECHO history and the hint log (`hints-panel.tsx`) at its foot. `E` opens it outside text entry; Esc closes it.
  - On wide screens the button shares the mission grid area and sits at its foot. On phones it sits at the end of the tab bar and the chat is a bottom sheet.
  - The history is `GameState.chat` in `game-reducer.ts` (session only). Hints decoded earlier are rebuilt from `progress.hintsOpened`. The open, unread and bubble rules are the pure reducer in `src/game/echo-chat.ts`.
  - `task_steps` continues the first "Vào nhiệm vụ" message as one chat turn. Until the chat is opened once per level per page session (`stepsSeen` in `echo-chat.ts`), the bubble adds "Mở để xem việc cần làm (E)" and the button reads "việc cần làm". The chat never opens by itself.
- **Level intro**, also in `game-screen.tsx`:
  - It runs in the order `gate → briefing → objectives → done`.
  - The `IntroGate` click is the first user gesture and unlocks audio. Reached straight from a story, the gate ignores clicks for 400 ms and held keys (`data-armed` turns true when it accepts clicks).
  - The briefing types out with `useTypewriter`, then the objectives lock in one by one, then the alert meter appears, then ECHO wakes with its first bubble.
  - Any click or key skips to `done`; tab clicks do not count.
  - With `prefers-reduced-motion`, everything shows instantly.
- **Audio** (`src/audio/`) is procedural Web Audio with no asset files:
  - `sound-recipes.ts` defines one `Cue` per sound (names in `cue-names.ts`, which the validators import). Adding a cue means adding a recipe; `sound-render.test.ts` renders every recipe with `OfflineAudioContext`.
  - `useAudio` lives in `Shell`, so one `AudioContext` lasts the whole session; screens get `audio` as a prop. `gestured` tells whether the page has seen its first gesture (story gate decision). `M` toggles sound on every screen.
  - No `AudioContext` exists before the first gesture. The title's BẮT ĐẦU/TIẾP TỤC click unlocks and plays `pulse`.
  - Story beats play their cue the moment the beat starts; JS timers only move between beats. `pulse` has an 800 ms merge window so the title click and the first prologue beat do not both sound.
  - Delayed cues must be scheduled on the audio clock (`play(cue, delayMs)`), not with JS timers, which re-renders cancel.
  - Mute is persisted.
- **Test instrumentation:** e2e tests read `window.__TLC_AUDIO_PROBE__` when a page defines it before load; it is inert otherwise. Note that the Claude-in-Chrome screenshot action sends pointer events, which skip the intro. Verify the intro with the probe or with e2e tests, not with mid-animation screenshots.

## Repo conventions

- Markdown goes only in `plans/`, `docs/` or `design/`.
- `plans/` is local working space and is not in git: plans, phase files, agent reports (`{type}-{YYMMDD-HHMM}-{slug}.md`) and journals. Nothing tracked may link into it, and nothing in it is a source of truth.
- Project decisions live in tracked documents, never only in `plans/`:
  - technology and architecture choices: a new entry in `docs/quyet-dinh-ky-thuat.md`;
  - game design: `design/` (the overall GDD, one GDD per level, and accepted design contracts in `design/quyet-dinh/`);
  - engine contracts, test matrices and measurements behind a decision: `docs/` (e.g. `docs/hop-dong-engine-level-1-1-den-1-3.md`).
  When a brainstorm or plan settles a decision, write it into one of these before the work is closed; a report in `plans/` alone is lost to everyone else.
- `.claude/rules/` holds the workflow rules: brainstorm → plan → cook → test → review.

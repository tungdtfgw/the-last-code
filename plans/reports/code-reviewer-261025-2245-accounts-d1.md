# Code review: accounts + server-side progress (Vercel + D1 gateway)

Date: 2026-10-25 22:45 (Asia/Saigon). Scope: the uncommitted working tree against HEAD `c6de853`, including untracked files.
Plan: `plans/261025-2055-vercel-d1-tai-khoan-email/plan.md` and phases 01–06.
I did not re-argue the owner's decisions: QĐ-07 (MD5+salt), QĐ-08 (Vercel + D1 gateway), QĐ-09 (login required), QĐ-11 (the server trusts client stars), QĐ-12 (30-day sessions) and Gmail SMTP.

## Scope

- Server: `server/**`, `api/[...path].ts`, `vercel.json`, `workers/d1-gateway/**`, `db/migrations/0001_init.sql`
- Client: `src/storage/{http-repository,import-local-progress,local-storage-repository,create-repository,progress-repository}.ts`, `src/account/*`, `src/ui/account/*`, `src/app.tsx`, `src/ui/title-screen.tsx`
- E2E: `tests/e2e/fixtures.ts`, `tests/e2e/account.spec.ts` and the edited specs. I read these but did not run them.
- Verification: three throwaway Vitest probes in the session scratchpad. They drive the real router and SQLite through `HttpProgressRepository`. Nothing in the repo was edited. I did not re-run typecheck or `npm test`; the caller already reported them green.

## Overall assessment

The server side is solid. The one-time token claims (`changes() = 1` plus the fresh salt) are correct. Rate limiting counts before it decides. Tokens and sessions are stored only as hashes. Mail links come from `APP_ORIGIN`, not the `Host` header. The JSON-only content-type rule plus SameSite=Lax blocks cross-site form posts. The gateway compares the secret in constant time.

The weak spot is `HttpProgressRepository`. Probes confirmed three data-integrity bugs there: an older draft can win over a newer one, stars can roll back in memory, and an old account's writes can land in the next account. There are also two availability problems on the server: anyone can use up the whole mail quota, and level ids are unbounded.

## Critical

None.

## Major

### M1. A hide-flush races the queued PUT, so the older draft wins on the server and in memory (confirmed)

- Where: `src/storage/http-repository.ts:196-204` (`sendNow` skips the per-level chain), `:130` (writes made while hidden also skip the chain), `:231-235` (the rebase replays `q.pending` on top of the newest row).
- The plan's assumption (phase-04: "the draft that arrives last wins, and that is the newest one") is false. Two requests in flight can arrive in either order. A retried request reaches the server seconds later.
- Failure scenario: the player runs code, which queues `{runs, draft:"old"}`; that PUT is slow or retrying after a 503. The player types more and switches tab, so `sendNow` sends `{draft:"latest"}`, which lands first. The queued PUT lands after it.
- Probe result: the server draft is `old` and the in-memory draft is also `old`. The memory rollback happens because the rebase after the `latest` response re-applies `pending[0]`, which carries `"old"`.
- The existing test "hiding the page sends the newest draft at once, even with a PUT still in flight" misses this because its in-flight patch has no draft.
- Fix: order drafts on the server, not by arrival.
  - Add a client draft revision: a monotonic per-level counter, or `Date.now()` at edit time.
  - Store it as `level_progress.draft_rev` (needs migration `0002`).
  - Upsert with `draft = CASE WHEN excluded.draft_rev > level_progress.draft_rev THEN excluded.draft ELSE level_progress.draft END`.
  - In the client rebase, skip a pending patch's draft when its revision is older than the one in the row.
- Smaller client-only alternative, which leaves a narrower race: build each attempt's body when it is sent rather than when it is enqueued, from the current in-memory draft. Also drop `draft` from queued patches once a newer draft has been sent.

### M2. A dropped write is never re-sent, and the next successful write rolls stars back in memory (confirmed)

- Where: `src/storage/http-repository.ts:249-251` (the patch is given up after 1+3+9 s), `:231-235` (the rebase starts from the server row, not from local state), `:129/192/202` (`lastSentDraft` is set before the send succeeds).
- Failure scenario: the player earns 3 stars while the network is down for about 13 s (a train, wifi switching). The `{bestStars:3}` PUT is dropped and the banner shows. The next run sends `{runs:2}`. The server answers with `bestStars:0`, and the rebase sets memory to that row.
- Probe result: memory stars 3 → **0**, server stars 0. Within the same session the map loses the unlock. AC4 (another browser sees the right stars) fails for good.
- The same applies to drafts: after a failed send, `lastSentDraft === held.draft`, so unchanged text is never sent again.
- Fix:
  - Send the full merged `LevelProgress` from memory on every PUT, not the delta. The server merge (MAX, plus M1's revision rule for drafts) makes this idempotent, so any later success repairs earlier losses.
  - Rebase as `merge(row, localState)`, never `row` alone.
  - Set `lastSentDraft` only after a 2xx.
  - Optionally re-flush every level on the `online` event, and clear the banner after a later success.

### M3. After sign-out, the old account's in-flight writes land in the next signed-in account (confirmed)

- Where: `src/account/account-gate.tsx:108-115` (it waits at most 3 s, then calls `logout`), `src/storage/http-repository.ts:157-161` (`dispose` never stops retries) and `:239-241` (only `expired` stops a retry).
- Failure scenario: Alice's PUT gets a 5xx and is waiting out its 9 s retry. She signs out; after 3 s the gate moves on. Bob signs in on the same browser. Alice's retry goes out with Bob's cookie.
- Probe result: Bob's `1.1` row became `{draft:"alice code", bestStars:3, runs:7}`. Stars never go down, so Bob keeps Alice's stars permanently.
- The same happens when `afterReset` disposes without stopping the retries.
- Fix:
  - Add a `closed` flag that `dispose()` sets. `withRetry` must check it before every attempt, and so must the chain callbacks.
  - Defense in depth: send `x-account-id: <user.id>` on progress writes, and have the router return 409 when it does not match the session's user.

### M4. Anyone can use up the 450-mails-a-day quota, blocking every activation and reset for the day

- Where: `server/auth/accounts.ts:80` (the global `mail-day` counter), `:111-152` (`register` has no limit for anonymous callers), `server/router.ts:102-107`.
- This is not a re-run of the dropped per-IP limit. It is new evidence against the plan's claim that the per-email limit plus the 450/day limit are enough to stop mail abuse (phase-02, "Giới hạn"):
  - The per-email limit only throttles one address.
  - 450 registrations with distinct addresses (`x1@gmail.com`… or `victim+N@gmail.com`) take a few seconds of scripting. After that, every real student gets `mail_quota` until midnight UTC.
  - Mailing non-existent addresses produces bounces, which can get the Gmail sender account flagged.
- Options for the owner (product decision, not applied):
  1. A generous per-IP limit that still lets a classroom through, for example 60 registrations per IP per hour.
  2. Separate budgets: keep part of the 450 (for example 100) for resend and reset of already-registered addresses.
  3. A proof-of-work or Turnstile challenge on register only.
  4. Accept the risk and monitor the `mail-day` counter.

### M5. Level ids are unbounded per user, so one account can fill D1 storage

- Where: `server/router.ts:140-142` (any `ROUTE_ID` is accepted), `server/progress/progress-store.ts:69-72`.
- Failure scenario: an activated account loops `PUT /api/progress/levels/x<N>` with 50,000-character drafts (about 150 KB each). Roughly 3,400 requests fill a 500 MB D1 database. After that every write fails for every player.
- `markStorySeen` has the same issue at a smaller scale: each request adds a row and costs D1 writes.
- Fix (either is cheap):
  - Accept only the known level and story ids. Export the id list from `src/story/chapter-1.json`, which has no runtime imports.
  - Or cap per user in SQL: `INSERT … SELECT … WHERE (SELECT count(*) FROM level_progress WHERE user_id=?1) < 50 OR EXISTS(<row>)`, and do the same for `story_seen` with 200.

## Minor

### m1. `resend-activation` and `forgot-password` reveal whether an account exists through a 429

- Where: `server/auth/accounts.ts:186-194` and `:223-229`.
- Calling twice within a minute returns `mail_rate_limited` only when the account exists, and for `forgot` only when it is also activated. This contradicts the docstring "never tells whether an account exists".
- Low impact, because `register` already reveals taken addresses (`email_taken`).
- Fix: either drop the claim from the comments, or return `{ok:true}` for `mail_rate_limited` and surface only `mail_quota`.

### m2. The login lockout does not match AC7

- Where: `server/auth/rate-limit.ts:14-30`, `server/auth/accounts.ts:204`.
- It is a fixed window that starts at the first attempt. Ten failures in minute 14 lock the username for about 1 minute, not the 15 minutes AC7 promises.
- With no IP dimension, anyone can also keep a victim locked out by sending 10 bad guesses every 15 minutes. A password reset clears the key, which mitigates this.
- Fix: when the limit is hit, set `window_start = now`, which gives a true 15-minute lock. Or reword AC7.

### m3. A failed sign-out is ignored

- Where: `src/account/account-gate.tsx:112-114`.
- If `api.logout()` fails (offline or 5xx), the UI shows signed out but the HttpOnly cookie and the server session remain. The next load signs the player straight back in.
- Fix: when `logout` returns not-ok, keep the account screen and show an error.

### m4. Large old local progress is dropped instead of imported

- Where: `server/router.ts:35` (512 KB limit) versus `src/storage/import-local-progress.ts:32-34`.
- A browser whose old drafts total more than about 512 KB gets a 413 from the import. The client treats a 4xx as "discard", so the stars are cleared from localStorage too.
- Requests under the router limit but over about 475 KB pass the router, then exceed the gateway's 512 KB body limit (`gateway.ts:17`), because the batch also carries about 35 KB of SQL text. The gateway 413 surfaces as a 500, so the import is kept and retried on every sign-in, and it never succeeds.
- Unlikely today: 4 levels × 50,000 characters, mostly Vietnamese text.
- Fix: the client drops drafts from the import when the body exceeds a budget (stars, runs and stories are tiny), or imports in chunks.

### m5. A 401 throws away writes that were not yet sent

- Where: `src/storage/http-repository.ts:241-247`, `account-gate.tsx:92-95`.
- On session expiry, `dispose → flushHeld` runs while `expired` is already true. Held drafts and the 401'd patch are lost, and the new repository loads the server snapshot without them.
- Fixed 30-day sessions make this rare. If it matters, keep the unsent patches in memory and re-apply them after the next login with the same `user.id`.

### m6. The e2e D7 test can be flaky

- Where: `tests/e2e/edge-cases.spec.ts:256-262`.
- `b.goto("about:blank")` sends B's draft with a keepalive PUT. `c.goto(LEVEL_URL)` can read `GET /api/progress` before that PUT lands, so `c` shows tab A's text.
- Fix: poll `/api/progress` until the draft contains `# từ tab B` before opening `c`.

## E2E spec read-through (not run)

- `fixtures.ts`: account creation, the outbox lookup and cookie injection look right. With `workers: 1`, `uniqueName` cannot collide. With about 50 tests × 3 projects, the e2e run stays under the 450-mails-a-day limit, which stays on in e2e; retries plus WebKit bring it closer.
- `account.spec.ts`: the flows match the UI labels and the routes. The forgot-password test depends on `Escape` skipping the prologue so that `markStorySeen` gets a 401; that matches `cutscene-player`.
- Specs that build their own context all switched to `newSignedInContext`.

## Edge cases found by scouting

- `hideToken` (`auth-layout.tsx:113`) changes the URL with `replaceState` without telling `AccountGate`'s `useHash`. This is harmless today because the screens keep the token in a ref.
- In dev, `StrictMode` runs `check()` twice. That creates two repositories, and the first one keeps its document listeners. Harmless, since it never holds writes.
- `changes()` in a D1 batch: the caller verified this on local D1 and the logic reads correctly, so I did not re-check it.

## Positive observations

These are here because they lower the risk of the rest:

- One-time token claims are atomic and safe against reuse. `resetPassword` cleans up keyed on the fresh salt, so a reused token never reaches the delete statements.
- Errors from the database and SMTP are logged on the server and returned to the caller as `server_error` or `mail_failed`. The gateway's error text never reaches the browser.
- `config.ts` makes it impossible to turn off the mail limit or to use the outbox in production.

## Recommended actions

1. M3: a `closed` flag in `dispose` and a user-id header on progress writes. Smallest change with the biggest impact.
2. M2: send full level state, rebase on `merge(row, local)`, and set `lastSentDraft` only after a 2xx.
3. M1: add `draft_rev` (migration `0002`) and compare it in the upsert. Add a test where the in-flight PUT carries a draft.
4. M5: a whitelist or cap for level and story ids.
5. M4: the owner picks an option.
6. Minor items as time allows.

## Metrics

- Type coverage: strict TypeScript; the caller reported the typecheck green; I saw no `any` widening in the reviewed code.
- Tests: the caller reported unit and integration tests green. Three gaps were proven by probes (M1–M3).
- Lint: not configured.

## Unresolved questions

- Vercel routing of `api/[...path].ts` and ESM `.js` imports have not been checked with a preview deploy. The plan marks this `[UNVERIFIED]`.
- M4: which mitigation does the owner want, if any?

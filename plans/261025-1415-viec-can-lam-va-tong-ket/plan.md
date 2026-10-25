---
title: "Việc cần làm + Tổng kết kiến thức (schema + UI)"
status: done
created: 2026-10-25 14:15 (Asia/Saigon)
contract: plans/reports/brainstorm-261025-1415-van-viet-nhiem-vu-ro-tong-ket-kien-thuc.md
mode: fast
---

# Plan: Việc cần làm + Tổng kết kiến thức

Scope: engine/UI part only. Content (`src/levels/*.json`, `src/story/chapter-1.json`) belongs to other agents.

## Decisions (inside the accepted contract)

- **Placement of "Việc cần làm":** its own small panel (`.panel.task-steps`, does not shrink) between the Nhiệm vụ and Mục tiêu panels. Collapsing Nhiệm vụ never hides it. On phones it sits in the Nhiệm vụ tab. Appears when the briefing finishes typing (intro phase `objectives`), instantly under reduced motion or skip.
- **Route:** `#/learn/<id>`. `continueAfterLevel` returns `{kind:"learn"}` when the level has `knowledge_summary`, else the old story flow. `learnEnd` = the old `continueAfterLevel` result. `guardRoute`: learn needs a built level with ≥1 star and a summary, else map. Opened from the map, it returns to the map (same "replaying" ref pattern as story replays).
- **Map:** side panel "Kiến thức" with one button per cleared level that has a summary (node buttons cannot nest buttons).
- **Integration test** runs `code` with local `python3 -I -` and compares stdout to `output` (trailing whitespace trimmed per line); section code must exit 0 (errors belong in `mistakes`). Also runs on the test fixture so it is not purely vacuous.

## Phases

| # | Phase | Files | Done when |
|---|---|---|---|
| 1 | Schema + validator | `level-types.ts`, `validate-level.ts`, `validate-level.test.ts`, `tests/fixtures/levels/level-test-knowledge.json` | rejects: bad step count, empty step, step leaking an expected value/output line, output without code, unknown keys, missing title/next; accepts fixture and levels without fields |
| 2 | Progression + route | `progression.ts`, `progression.test.ts`, `shell/route.ts`, `app.tsx` | tests: continue → learn when summary, → story when not; learnEnd; guard |
| 3 | UI | `task-steps-panel.tsx`, `inline-code.tsx`, `knowledge-screen.tsx`, `game-screen.tsx`, `chapter-map.tsx`, `global.css` | renders at 1280×800 and 360×740, page never scrolls, Enter/Space continues |
| 4 | Integration test | `tests/integration/knowledge-summary.test.ts` | runs every `knowledge_summary` code block |
| 5 | E2E (write, do not run) | `helpers.ts` (`continueFromResults`), level/story specs, `knowledge-summary.spec.ts` | flows tolerate the new step |
| 6 | Docs + report | `design/gdd.md` §4.4/§4.7/§7.1, `CLAUDE.md`, `plans/reports/cook-261025-1415-viec-can-lam-va-tong-ket.md` | JSON shape + full example documented |

## Verification

`npm run typecheck`, `npm test`, `npm run test:py`, `npm run build`; screenshots on :5173 with injected sample level via `page.route`.

---
title: Level 1.4 prototype built and verified
date: 2026-10-24
summary: "Playable Pyodide Level 1.4 with scanner simulation, ECHO, audio; unit, Python and e2e suites green"
---

# Level 1.4 prototype built and verified

## What happened
Implemented plan 261024-2332 phases 1-10: Vite + React + TS app, stdlib Python harness run in a Pyodide module worker, grading/ECHO layer, storage repository, CodeMirror locked-line editor, SVG scanner timeline, procedural Web Audio.

## Notable findings
- Code review caught that counting raw `line` trace events inflates the alert bar when one statement wraps over lines; switched to counting statement start lines (ast) with a backward-jump rule for loops.
- Player code could patch shared `math`/`json` and break later grading; the harness now keeps private references.
- CPython unsets the tracer after it raises, so a bare `except:` around an outer infinite loop escapes the line budget (worse on 3.14); the 5 s worker timeout covers it.

## Decision
Ports fixed at 5173/4173 per user. Reset rebuilds the editor state (clean undo history).

## Next steps
PM manual QA checklist in phase-10 (Chrome + Safari/Firefox, iOS audio). Consider per-suite runs so a counter-only C hang keeps base stars.

Full report: plans/reports/cook-261024-2332-level-1-4-prototype.md

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

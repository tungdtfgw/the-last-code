---
name: project-review-tooling-limits
description: the-last-code repo has a scout-block hook that denies any Bash command touching node_modules, so scratch vitest probes outside src/ cannot resolve deps
metadata:
  type: project
---

A PreToolUse hook (`.claude/hooks/scout-block.cjs`, config `.claude/.ckignore`) blocks Bash commands whose text mentions `node_modules` (e.g. symlinking it into the scratchpad). Vitest config only includes `src/**/*.test.{ts,tsx}` and `tests/integration/**`.

**Why:** context-firewall policy of the project; review-only tasks must not edit src to add probe tests.

**How to apply:** for empirical CodeMirror/reducer probes during review-only work, reason from library semantics or ask the lead to run a probe; do not try to symlink node_modules or drop test files into src.

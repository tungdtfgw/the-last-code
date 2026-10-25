---
phase: 1
title: "Khởi tạo dự án & công cụ"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Khởi tạo dự án & công cụ

## Goal
Có một dự án Vite + React + TS build được, có Vitest, script test Python, cấu trúc thư mục cố định cho các phase sau.

## Context Links
- [plan.md](./plan.md) · contract `plans/reports/brainstorm-261024-2316-level-1-4-prototype.md`
- Node 24, npm 11, Python 3.13 (local). Không có pnpm/bun → dùng npm.

## Key Insights
- Phiên bản npm hiện tại (đã kiểm `npm view` ngày 2026-10-24): vite 8.3.x, react 19.3.x, typescript 7.0.x, vitest 5.0.x, @vitejs/plugin-react 6.1.x, @codemirror/view 6.43.x, @codemirror/state 6.7.x, @codemirror/lang-python 6.2.x, @playwright/test 1.64.x, pyodide 314.0.x. Cài bằng `npm install` (không ghi tay version) rồi để lockfile chốt.
- **Không** cài package npm `pyodide` cho runtime; worker import thẳng từ CDN. Chỉ ghi hằng `PYODIDE_VERSION` trong `src/engine/pyodide-config.ts`. Kiểm `npm view pyodide version` lúc làm và xác minh URL `https://cdn.jsdelivr.net/pyodide/v<ver>/full/pyodide.mjs` trả 200 bằng `curl -I`.
- Nếu TypeScript 7 (native compiler) vướng plugin/Vitest, hạ về TS 5.x mới nhất và ghi lý do vào README dev ngắn trong `package.json` "description" – không chặn tiến độ.

## Files to Create
- `/Users/tungdt/MyProjects/throwable/the-last-code/package.json` – scripts: `dev`, `build`, `preview`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch`, `test:py` (`python3 -m unittest discover -s tests/python -v`), `test:e2e` (`playwright test`), `test:all` (typecheck + test + test:py).
- `vite.config.ts` (plugin react, `worker.format: 'es'`, `server.port: 5174` cố định, `strictPort: true`).
- `vitest.config.ts` (environment `node` mặc định; test UI nào cần DOM thì dùng `// @vitest-environment jsdom`).
- `tsconfig.json`, `tsconfig.node.json`, `index.html` (`lang="vi"`, `<meta name="viewport">`, `<title>Mã Cuối Cùng – 1.4</title>`).
- `src/main.tsx`, `src/app.tsx` (placeholder), `src/vite-env.d.ts` (khai báo `*.py?raw`).
- Thư mục rỗng có `.gitkeep`: `src/engine/python/`, `src/levels/`, `src/game/`, `src/storage/`, `src/audio/`, `src/ui/`, `src/styles/`, `tests/python/`, `tests/fixtures/solutions/`, `tests/e2e/`.
- `.gitignore` (node_modules, dist, playwright-report, test-results, `__pycache__`).

## Tasks & Steps
1. `npm create vite@latest . -- --template react-ts` trong thư mục hiện tại (giữ `Ma_Cuoi_Cung_GDD.md`, `plans/`, `.claude/`, `.agentkit/`). Nếu tool từ chối thư mục không rỗng, tạo ở thư mục tạm trong scratchpad rồi copy file vào.
2. `npm i @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-python @codemirror/autocomplete`.
3. `npm i -D vitest jsdom @testing-library/react @playwright/test`.
4. Font tự host (offline sau lần đầu, có dấu tiếng Việt): cài `@fontsource/*` theo lựa chọn của bước thiết kế phase 7 – để phase 7 quyết định, phase này chưa cài.
5. Thêm scripts như trên; tạo cấu trúc thư mục.
6. Viết 1 test mẫu `src/game/sanity.test.ts` để xác nhận Vitest chạy, xóa ở phase 5.

## Verification
- `npm run typecheck && npm test && npm run build` đều exit 0.
- `npm run dev` mở `http://localhost:5174` thấy trang placeholder. Dừng dev server sau khi kiểm (rule process-management: ghi PID, không để process mồ côi).
- `curl -sI https://cdn.jsdelivr.net/pyodide/v<ver>/full/pyodide.mjs | head -1` → 200.

## Risk
- Template Vite đổi cấu trúc → chỉnh tay theo danh sách file trên.

## Rollback
Xóa các file tạo ở phase này (không có file nào có sẵn bị sửa).

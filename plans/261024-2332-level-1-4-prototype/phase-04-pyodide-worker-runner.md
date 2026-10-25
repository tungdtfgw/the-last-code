---
phase: 4
title: "Worker Pyodide & vòng đời runner"
status: completed
priority: P1
effort: "3h"
dependencies: [3]
---

# Phase 4: Worker Pyodide & vòng đời runner

## Goal
Pyodide chạy trong module Web Worker, có trạng thái tải rõ ràng, chạy harness theo yêu cầu, ngắt được mọi vòng lặp/treo bằng cách hủy và dựng lại worker, và không bao giờ để hai lần chạy chồng nhau.

## Key Insights
- Docs Pyodide (context7, bản stable): worker phải là **module worker** (`pyodide.asm.mjs` là ES module; `importScripts` không hỗ trợ). URL: `https://cdn.jsdelivr.net/pyodide/v<ver>/full/pyodide.mjs`.
- Ngắt bằng interrupt buffer cần `SharedArrayBuffer` + COOP/COEP → bỏ. Dùng: ngân sách `line` trong harness (bắt phần lớn vòng lặp Python) + `worker.terminate()` theo đồng hồ (bắt vòng lặp trong C như `10**10**8`).
- Lần tải thứ hai được trình duyệt cache → dựng lại worker sau timeout chỉ mất ~1–3 s.

## Files to Create
- `src/engine/pyodide-config.ts` – `PYODIDE_VERSION`, `PYODIDE_INDEX_URL`, `LOAD_TIMEOUT_MS = 60000`, `RUN_TIMEOUT_MS = 5000`.
- `src/engine/py-worker.ts` – code worker.
- `src/engine/worker-protocol.ts` – type message hai chiều.
- `src/engine/py-runner.ts` – lớp `PyRunner` ở main thread.
- `src/engine/py-runner.test.ts` – test với **worker giả** (inject factory) để kiểm máy trạng thái, timeout, chống chạy chồng.

## Giao thức
Main → worker: `{kind:"init"}`, `{kind:"run", runId, configJson, source}`.
Worker → main: `{kind:"progress", stage:"download"|"boot"|"harness"}`, `{kind:"ready", pythonVersion}`, `{kind:"init_error", message}`, `{kind:"result", runId, json}`, `{kind:"run_error", runId, message}`.

Worker: `const { loadPyodide } = await import(/* @vite-ignore */ PYODIDE_URL)`; `pyodide = await loadPyodide({ indexURL })`; `pyodide.runPython(harnessSource)` (import `harness.py?raw`); lấy `run_level = pyodide.globals.get("run_level")`. Khi chạy: `const out = run_level(configJson, source)` (chuỗi) → `postMessage({kind:"result", runId, json: out})`. Mọi exception JS/Python ngoài harness → `run_error`. Không bao giờ gửi object lớn: harness đã cắt preview/stdout.

## `PyRunner`
- Trạng thái: `idle → loading → ready ⇄ running`, `failed`, `restarting`. Phát sự kiện `onStatus(status, detail)` cho UI.
- `init()`: tạo worker qua `workerFactory()` (mặc định `new Worker(new URL("./py-worker.ts", import.meta.url), { type: "module" })`), gửi `init`, chờ `ready` tối đa `LOAD_TIMEOUT_MS`. Hết giờ hoặc `init_error` hoặc `worker.onerror` → `failed` với lý do (`offline` nếu `navigator.onLine === false`, `cdn` nếu lỗi tải, `timeout`).
- `retry()`: terminate + `init()` lại.
- `run(configJson, source)`: nếu không `ready` → trả `{kind:"not_ready"}` ngay (UI đã khóa nút, đây là lớp bảo vệ thứ hai). Nếu đang `running` → trả về **chính promise đang chạy** (double-click không tạo lần chạy thứ hai). Đặt timer `RUN_TIMEOUT_MS`; hết giờ → `terminate()`, trạng thái `restarting`, `init()` nền, resolve `{kind:"timeout"}`. Nhận `result` đúng `runId` → `JSON.parse` (lỗi parse → `{kind:"engine_error"}`) → `{kind:"ok", data}`. `run_error` hoặc `worker.onerror` giữa lúc chạy → terminate + dựng lại + `{kind:"engine_error", message}`.
- Message có `runId` cũ (sau timeout) bị bỏ qua.
- Sau kết quả có status `resource_limit` → chủ động dựng lại worker (heap wasm có thể đã hỏng).
- `dispose()` khi unmount: terminate (không để worker mồ côi).

## Tasks & Steps
1. Viết protocol + config. Kiểm lại version bằng `npm view pyodide version` và `curl -I` URL.
2. Viết worker; khai báo `self` là `DedicatedWorkerGlobalScope` trong file worker.
3. Viết `PyRunner` với `workerFactory` và `clock` (setTimeout) inject được.
4. Test bằng `FakeWorker` (EventTarget có `postMessage`/`terminate`): init thành công; init timeout → failed; run thành công; run timeout → resolve `timeout`, worker cũ bị terminate, worker mới được tạo; gọi `run` 2 lần liền → cùng promise, chỉ 1 message `run` được gửi; message trễ có `runId` cũ bị bỏ; `run` khi `loading` → `not_ready`.
5. Thử thủ công trong trình duyệt (trang dev tạm hoặc console): chạy code 6.7 qua runner, nhận JSON đúng; chạy `while True: pass` → timeout từ ngân sách line (nhanh); chạy `x = 10**10**8` → timeout đồng hồ 5 s rồi tự sẵn sàng lại.

## Verification
- `npx vitest run src/engine/py-runner.test.ts`
- Thủ công với `npm run dev` (port 5174), DevTools → Network: chỉ tải Pyodide một lần mỗi phiên (lần dựng lại lấy từ cache).

## Risk
- Vite xử lý `import()` URL ngoài → dùng `/* @vite-ignore */`; nếu build vẫn lỗi, đặt URL qua biến runtime.
- Firefox/Safari cũ không hỗ trợ module worker → ghi trình duyệt tối thiểu: Chrome/Edge 80+, Firefox 114+, Safari 15+. Phát hiện không hỗ trợ (`try new Worker(..., {type:'module'})` ném) → màn lỗi "TRÌNH DUYỆT KHÔNG HỖ TRỢ".

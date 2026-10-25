---
title: "Prototype Level 1.4 – Tín hiệu lệch pha"
description: "Web app chạy hoàn toàn trên trình duyệt, chơi trọn Level 1.4 với Pyodide, mô phỏng máy quét, NPC ECHO, chấm 1–3 sao và âm thanh thủ tục."
status: completed
priority: P1
effort: 34h
branch: ""
tags: [feature, frontend, experimental]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Prototype Level 1.4 – Tín hiệu lệch pha

## Overview

Xây một web app tĩnh (Vite + React + TypeScript) chơi được trọn Level 1.4 trong trình duyệt thật: briefing → sửa code trong CodeMirror 6 (dòng khóa) → chạy bằng Pyodide trong Web Worker → mô phỏng gói dữ liệu qua máy quét → OMNI phản công → chấm sao → ECHO phản ứng → lưu tiến độ qua một module lưu trữ duy nhất.

Nguồn quyết định: [brainstorm contract (ACCEPTED)](../reports/brainstorm-261024-2316-level-1-4-prototype.md) – ưu tiên hơn GDD khi khác nhau (không có pin; ECHO thay nhật ký KTS cho gợi ý; code gốc **không** lỗi, chỉ sai kiểu). GDD: `../../Ma_Cuoi_Cung_GDD.md` mục 4–8.

## Quyết định kỹ thuật chính

- **Vite + React + TS, không Next.js.** App không có backend, không cần SSR/route server. Pyodide, Web Worker, Web Audio, `localStorage` đều chỉ chạy phía client; Next.js thêm hydration/SSR guard mà không đem lại gì. Vite build ra thư mục tĩnh, deploy được ở bất kỳ static host nào.
- **CodeMirror 6** (nhẹ hơn Monaco, có `transactionFilter`/`StateField` để khóa dòng).
- **Pyodide `v314.0.x` từ jsDelivr** (Python 3.14) trong **module worker**. Ngắt vòng lặp bằng hai lớp: ngân sách sự kiện `line` trong `settrace` + `worker.terminate()` theo đồng hồ. Không dùng `SharedArrayBuffer` để khỏi cần header COOP/COEP.
- **Harness Python thuần stdlib** (`src/engine/python/harness.py`) chạy được cả trong Pyodide lẫn `python3` local (3.13) → test chấm điểm không cần trình duyệt.
- **Chấm per-biến trong Python** (có kiểu thật, `type(v) is T`), **phân loại kết quả + sao + chọn lời ECHO trong TS** (hàm thuần, Vitest).
- **Âm thanh thủ tục bằng Web Audio API**, không file asset.
- **Lưu trữ**: interface async `ProgressRepository`, bản `localStorage` + bản bộ nhớ (fallback). Sau này thay bằng Supabase mà không đụng UI.

## Phases

| # | Phase | Effort | Phụ thuộc | Status |
|---|---|---|---|---|
| 1 | [Khởi tạo dự án & công cụ](./phase-01-project-scaffold.md) | 2h | – | completed |
| 2 | [Dữ liệu level JSON & bộ nạp](./phase-02-level-data-and-loader.md) | 3h | 1 | completed |
| 3 | [Harness Python & sandbox](./phase-03-python-harness.md) | 5h | 2 | completed |
| 4 | [Worker Pyodide & vòng đời runner](./phase-04-pyodide-worker-runner.md) | 3h | 3 | completed |
| 5 | [Chấm sao, phân loại, phản ứng ECHO](./phase-05-grading-classification-echo.md) | 4h | 3 | completed |
| 6 | [Module lưu trữ tiến độ](./phase-06-progress-storage.md) | 2h | 1 | completed |
| 7 | [Thiết kế UI, editor khóa dòng, vòng chơi](./phase-07-ui-shell-editor-game-loop.md) | 7h | 4, 5, 6 | completed |
| 8 | [Mô phỏng máy quét & cổng](./phase-08-scanner-simulation.md) | 4h | 7 | completed |
| 9 | [Âm thanh thủ tục](./phase-09-procedural-audio.md) | 2h | 7 | completed |
| 10 | [Gia cố edge case, e2e, checklist QA](./phase-10-hardening-e2e-qa.md) | 2h | 8, 9 | completed |

Chạy tuần tự 1 → 10 (một implementer). Ma trận edge case đầy đủ: [edge-case-matrix.md](./edge-case-matrix.md).

## Ánh xạ tiêu chí chấp nhận (contract 1–12)

| AC | Nội dung rút gọn | Phase thực hiện | Bằng chứng |
|---|---|---|---|
| 1 | Code gốc chạy không lỗi, gói vàng 201 ký tự, máy quét đỏ, báo sai kiểu, không traceback | 3, 5, 8 | `harness` unittest + `grading-pipeline.test.ts` (fixture `original.py`) + e2e |
| 1b | Lỗi thật → traceback trong bối cảnh, đúng số dòng editor | 3, 7 | unittest dòng lỗi; fixture `type-error.py` dòng 7 |
| 2 | Lời giải 6.6 → 2 sao, phản công `ValueError` | 3, 5 | pipeline test `two-star.py` |
| 3 | Lời giải 6.7 → 3 sao | 3, 5 | pipeline test `three-star.py` + e2e |
| 4 | Viết cứng 2703 → trượt phản công | 5 | pipeline test `hardcoded.py` |
| 5 | Không sửa được dòng khóa | 7 | `locked-lines.test.ts` + e2e |
| 6 | Level mới chỉ cần JSON | 2 | `level-registry.test.ts` (fixture level thứ hai) |
| 7 | Test tự động cho chấm điểm | 3, 5 | `npm run test:py`, `npm test` |
| 8 | ECHO nói đúng câu theo kết quả | 5 | `classify-run.test.ts`, `echo-reactions.test.ts` |
| 9 | Phản ứng miễn phí không chứa `int`/`float`/`round`/đáp án | 2, 5 | `echo-forbidden-terms.test.ts` |
| 10 | Reload giữ tiến độ; `localStorage` bị chặn vẫn chơi được | 6, 10 | `progress-store.test.ts` + e2e reload |
| 11 | Màn kết quả hiện số gợi ý đã mở | 7 | e2e + checklist QA |
| 12 | Ngưỡng 8 câu lệnh (40%) | 2, 3, 5 | unittest đếm lệnh + `alert.test.ts` |

## Non-goals (giữ nguyên contract)

Supabase/tài khoản/bảng xếp hạng; số liệu cộng đồng (kể cả số giả); level khác, Boss, kill switch; điểm giải mã; cơ chế pin; chạy offline khi chưa từng tải Pyodide.

## Dependencies

- Mạng tới `cdn.jsdelivr.net` lần đầu tải Pyodide (~10 MB). `npx playwright install chromium` cho e2e.
- Skill bắt buộc ở phase 7: `ak:frontend-design` (thêm `ak:ui-ux-pro-max` nếu cần bảng màu/typography).

## Câu hỏi còn mở (không chặn)

Không còn. Hai điểm đã được PM chốt:

- **Sao tích lũy:** 3 sao cần cả ≤ 8 lệnh và chống được phản công. Qua phản công nhưng vượt ngưỡng 40% → 1 sao, màn kết quả ghi "đã chống được phản công". Logic nằm ở `computeStars`.
- **Vượt 100% cảnh báo (> 20 lệnh) → bị Sentinel bắt, 0 sao** (theo GDD mục 4), dù đúng kiểu và giá trị. Máy quét đỏ, còi báo động, log `> SENTINEL ĐÃ KHÓA MỤC TIÊU — MỨC CẢNH BÁO: 100%+`, ECHO dùng phản ứng `alert_exceeded`. Không chạy phản công trong trường hợp này. Có test trong `classify-run.test.ts`/pipeline test với fixture > 20 lệnh.

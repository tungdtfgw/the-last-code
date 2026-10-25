---
title: "Level 1.2 \"Gán nhãn\": ki-ốt ô nhớ, lịch sử gán, khóa value_is_label"
description: "Thêm level-1-2.json, var_history trong harness (chỉ bật cho kiosk), khóa phản ứng value_is_label, mô phỏng ki-ốt phát lại theo lịch sử gán, và một e2e chơi tới 3 sao."
status: completed
priority: P1
effort: 13h
branch: ""
tags: [feature, level, harness, frontend]
blockedBy: [261025-0928-mo-dau-va-chuyen-canh, 261025-0928-level-1-1-khoi-dong]
blocks: [261025-0928-level-1-3-bon-loai-tin-hieu]
created: 2026-10-25
---

# Level 1.2 "Gán nhãn"

## Overview

Đưa Level 1.2 vào luồng chương 1: người chơi dựng hồ sơ ĐỖ MINH AN trong một ki-ốt chỉ đọc ô nhớ có nhãn, học tên phân biệt hoa thường (`NameError`), tên trong dấu nháy là chữ, và gán lại theo thứ tự từ trên xuống. Engine thêm hai thứ chung, đều tùy chọn: lịch sử gán `var_history` trong harness (chỉ bật khi `simulation.kind === "kiosk"`) và khóa phản ứng `value_is_label`. Mô phỏng mới `kiosk` phát lại lịch sử đó sau khi chạy xong.

Nguồn quyết định (đã chấp nhận, không mở lại), theo thứ tự ưu tiên:
1. Hợp đồng engine: [`plans/reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md`](../reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md). Mục 1–4 và 7 do vỏ game và plan 1.1 làm trước; plan này coi là đã có. Mục 5 là của plan này.
2. GDD level: [`design/chuong-1/gdd-1.2-gan-nhan.md`](../../design/chuong-1/gdd-1.2-gan-nhan.md) (JSON nháp mục 16, lối đi mục 14, bảng biên mục 15) và brainstorm [`plans/reports/brainstorm-261025-0928-level-1-2-gan-nhan.md`](../reports/brainstorm-261025-0928-level-1-2-gan-nhan.md).
3. Hợp đồng truyện: [`design/gdd-mo-dau.md`](../../design/gdd-mo-dau.md) mục 6.2.
- Lỗi cũ phải tránh: [`docs/nhat-ky-loi-prototype-1-4.md`](../../docs/nhat-ky-loi-prototype-1-4.md) (tracer, hẹn cue trên đồng hồ audio, ảnh chụp làm bỏ qua hiệu ứng).

## Thứ tự và tiền đề

Vỏ game ([`plans/261025-0928-mo-dau-va-chuyen-canh/`](../261025-0928-mo-dau-va-chuyen-canh/plan.md)) → Level 1.1 (`plans/261025-0928-level-1-1-khoi-dong/`) → plan này. Lúc viết plan, plan 1.1 chưa có nội dung; plan này dựa vào hợp đồng engine. Trước mỗi phase, implementer **đọc lại code thật** và chỉnh đường dẫn, tên hàm nếu việc trước đó lệch. Những thứ plan này coi là đã có:

| Thứ | Ai làm | Plan này dùng ở |
|---|---|---|
| `location`, `component`, `outro_beats`, `chapter-1.json` có `"1.2"`, luồng `after-1.1 → 1.2 → after-1.2`, `gotoLevel(page, id)`, `LevelSimulation` | vỏ game | 1, 5 |
| `simulation: {kind, ...}` trong `LevelDefinition` + validator `kind`; thiếu thì `scanner` | 1.1 (hợp đồng mục 1) | 1, 5 |
| Hook phát lại `src/ui/use-timeline-playback.ts` (đồng hồ, Esc, giảm chuyển động, `onCue`/`onDone`) | 1.1 (mục 1) | 5 |
| `forbidden_terms` cộng dồn, so theo ranh giới chữ Unicode trong `echo-leaks.ts` | 1.1 (mục 2) | 1 |
| Harness chuẩn hóa NFC khi so `str` | 1.1 (mục 3) | 3 |
| Chữ trung tính trong `terminal-lines.ts`, `objectives-panel.tsx`, nhãn editor; vòng sáng CHẠY | 1.1 (mục 7) | 5 |

Nếu một thứ trong bảng chưa có, **không tự làm lại cả mục**: chỉ thêm phần tối thiểu 1.2 cần, ghi rõ trong báo cáo phase (phase 1 đã có sẵn một bước như vậy cho nhánh `kiosk` của validator).

## Quyết định kỹ thuật chính

- **`var_history` ghi trong tracer, so bằng `is`.** Ở mỗi sự kiện `line` của khung người chơi, so `ns.get(tên)` của từng biến mục tiêu với đối tượng lần trước. Khác thì thêm `{line, var, type, preview, src}`. `line` là **dòng bắt đầu câu lệnh** chạy gần nhất (lấy từ `stmt_lines`, không phải dòng nối tiếp). So lần cuối sau `exec`, kể cả khi lỗi. Xóa biến (`del`) ghi `type: null, preview: null`. Tối đa 40 mục (`var_history_max` trong `DEFAULT_LIMITS`); đầy thì `var_history_truncated: true` và **ngừng so** (tiết kiệm). Không bao giờ gọi `__eq__`/`__repr__` của người chơi (`_preview` sẵn có).
- **Trường `src` (bổ sung nhỏ cho hợp đồng mục 5):** tên biến đầu vào có đối tượng gốc (lúc nạp test) `is` giá trị mới, không có thì `null`. Đây là cách duy nhất để "dây nối bộ đệm" của GDD 8 phân biệt `so_hieu = goi_3` với `so_hieu = "AN-5521"` gõ tay: hai chuỗi bằng nhau nhưng khác đối tượng (đã kiểm bằng CPython 3.13: chuỗi từ `json.loads` không trùng identity với hằng trong code, kể cả hằng dạng định danh). Ngoại lệ đã biết: chuỗi 0–1 ký tự được CPython cache; 1.2 không có.
- **Chỉ bật cho kiosk:** `build-config.ts` thêm `trace_vars: level.simulation?.kind === "kiosk"`. Harness thiếu cờ thì báo cáo không có `var_history` (1.4 không đổi). Không đổi worker, giao thức worker: lượt `counter` dùng cùng config nên cũng có lịch sử.
- **Đo trên Pyodide trước khi nối UI** (phase 2). Ước tính trên CPython 3.13: +18 ms cho 100.000 sự kiện dòng (vòng `while True` hết ngân sách). Ngưỡng chấp nhận trên Pyodide (Chromium): ca xấu nhất thêm ≤ 300 ms và tổng < 2 s; lời giải 9 câu lệnh thêm ≤ 10 ms. Vượt ngưỡng → bậc lùi 1: chỉ so khi câu lệnh vừa chạy có thể gán (AST: có `Name` mục tiêu ở ngữ cảnh Store/Del, hoặc có lời gọi hàm). Vẫn vượt → bậc lùi 2: `trace_vars` false, ki-ốt hiện giá trị cuối (GDD 8 "Không có lịch sử").
- **`value_is_label`** trong `failureKey`, trước `wrong_value`: biến `str` đúng kiểu, sai giá trị, có `preview === "'<tên>'"` với tên thuộc `level.inputs` ∪ tên mục tiêu, và level có `reactions.value_is_label`. `vars` chỉ gồm các biến đó (GDD 15 ca 2: `vars = so_hieu`). Chỉ cho lượt cơ bản.
- **`RunOutcome` thêm `history`, `historyTruncated`, `counterHistory`, `counterHistoryTruncated`** (từ kết quả đang hiện, giống `vars`/`counterVars`). Không đổi `compute-stars.ts`, `prepare-source.ts`, worker.
- **Ki-ốt = timeline thuần + phần vẽ**, như hợp đồng mục 1. `kiosk-timeline.ts` dựng khung hình từ `RunOutcome` + `level`; `kiosk-simulation.tsx` chỉ vẽ, phát qua `use-timeline-playback.ts`. Bóng mờ của giá trị cũ bay về ô đang giữ **cùng preview** (so giá trị, đúng ẩn dụ GDD 8.2); dây nối bộ đệm theo `src` (so identity). Ô đích khi lỗi chạy lấy bằng regex tên bên trái `=` trên dòng traceback cuối.
- **Edge case 10 đổi theo hợp đồng mục 3 (NFC):** gõ lại "ĐỖ MINH AN" dạng tổ hợp giờ qua lượt cơ bản, trượt phản công (`wrong_value_counter`), ki-ốt không nối dây. Đúng bài học "gõ tay là rủi ro"; không có test riêng (bảng GDD ghi "Không").

## Phases

| # | Phase | Effort | Phụ thuộc | Status |
|---|---|---|---|---|
| 1 | [Dữ liệu level và schema](./phase-01-level-data-and-schema.md) | 1,5h | vỏ game, 1.1 | done |
| 2 | [Harness: `var_history` + đo chi phí trên Pyodide](./phase-02-harness-var-history.md) | 3h | 1 | done |
| 3 | [Chấm: `value_is_label`, chuyển lịch sử, test tích hợp](./phase-03-grading-and-integration.md) | 2h | 2 | done |
| 4 | [Timeline ki-ốt (thuần)](./phase-04-kiosk-timeline.md) | 2,5h | 3 | done |
| 5 | [Mô phỏng ki-ốt, nối vào màn chơi, e2e](./phase-05-kiosk-ui-and-e2e.md) | 3h | 4 | done |
| 6 | [Tài liệu và chạy toàn bộ kiểm thử](./phase-06-docs-and-verification.md) | 1h | 5 | done |

Kết quả (25/10/2026): xong cả 6 phase, báo cáo `plans/reports/cook-261025-0928-level-1-2-gan-nhan.md`. Đo phase 2 trên Pyodide 3.14.2: ca xấu nhất thêm 277 ms (tổng 584 ms), lời giải không đổi; trong ngưỡng, không áp bậc lùi (`plans/reports/bench-261025-1211-var-history.md`). E2E đã viết, chưa chạy.

Tuần tự 1 → 6, một implementer. Sau phase 1, level đã chơi được với mô phỏng mặc định (`LevelSimulation` chưa biết `kiosk` thì rơi về máy quét; phase 5 thêm nhánh).

## Tiêu chí chấp nhận

| AC | Nội dung | Nguồn | Phase | Bằng chứng |
|---|---|---|---|---|
| 1 | `src/levels/level-1-2.json` đúng GDD 16 (briefing, starter, khóa dòng 2–5, 6 mục tiêu `str`, ngưỡng 11, test + phản công, 3 gợi ý, 30 phản ứng, `location`, `component`, `outro_beats`, `simulation` kiosk, `forbidden_terms`); validator nhận; level vào chương 1 và tự hiện trên bản đồ | GDD 16, mở đầu 6.2 | 1 | `validate-level`/registry chạy trên mọi level, `validate-chapter.test.ts` |
| 2 | Không phản ứng hay nhịp ECHO nào của 1.2 chứa `int|float|round`, `forbidden_terms` (có dấu), hay giá trị `expected` của cả hai lượt | GDD 15 #20, hợp đồng 2 | 1 | `echo-forbidden-terms.test.ts` (tự lặp qua mọi level) |
| 3 | Validator báo lỗi nêu tên trường khi `devices` rỗng/trùng/không phải mục tiêu, hoặc không còn ô nhớ nào | GDD 15 #21 | 1 | `validate-level.test.ts` (một ca bảng) |
| 4 | Code khởi đầu → `NameError` dòng 13, 4 câu lệnh, 0 sao; sửa `Ma_khu` → `value_is_label`, `vars = so_hieu`; sửa dấu nháy → `wrong_value` ở `khu_cu, the_quet, the_cong` | GDD 5, 15 #1–3 | 3 | `tests/integration/level-1-2.test.ts` |
| 5 | Lời giải 3 sao GDD 6 → `three_stars`, 9 câu lệnh; lời giải 2 sao (gõ tay `"AN-5521"`, `"K-07"`) và `khu_cu = "K-12"` → 2 sao, `wrong_value_counter` | GDD 6, 7, 11, 15 #4–5 | 3 | `tests/integration/level-1-2.test.ts` |
| 6 | `value_is_label`: `"goi_3 "` → `wrong_value`; `the_cong = "so_hieu"` → `value_is_label`; level không có khóa → `wrong_value` | GDD 15 #6–7 | 3 | `classify-run.test.ts` |
| 7 | `var_history`: dòng khớp editor (8, 9, 10 rồi lỗi 13, có mục trước dòng lỗi); `src` đúng identity; tối đa 40 mục + cờ cắt; không gọi code người chơi; không bật thì không có trường, kết quả 1.4 không đổi | Hợp đồng 5, GDD 15 #16–19 | 2 | `tests/python/test_harness.py` lớp `VarHistory` |
| 8 | Chi phí `var_history` trên Pyodide đo và ghi lại; trong ngưỡng hoặc đã áp bậc lùi | Hợp đồng 5 | 2 | báo cáo `plans/reports/bench-261025-*-var-history.md` |
| 9 | Lịch sử chạy sai thứ tự đi tới UI đúng thứ tự: `ma_khu` K-12 → hai thiết bị đọc K-12 → `ma_khu` K-07 → `khu_cu` K-07 | GDD 5, 8.2–8.3 | 3 | `tests/integration/level-1-2.test.ts` |
| 10 | Timeline ki-ốt: phát theo lịch sử, dây theo `src`, bóng mờ bay về ô giữ cùng giá trị hoặc tan; lỗi chạy dừng đúng chỗ + nhiễu ô đang ghi + `TRUY VẾT: dòng 13`; lỗi biên dịch không ô nào sáng; thiếu lịch sử → giá trị cuối; phản công `LỆCH MẪU`, cổng sập về nửa; qua hết → cổng mở, `star` | GDD 8, 15 #22 | 4 | `kiosk-timeline.test.ts` |
| 11 | Ki-ốt vẽ được trên desktop và 360 px (2×2 ô, chữ cắt `…` sau 14 ký tự, toàn văn trong `<title>`), giảm chuyển động chỉ hiện khung cuối, câu tóm tắt cho trình đọc màn hình | GDD 8, 15 #23 | 5 | kiểm tay (ghi trong báo cáo phase 5) |
| 12 | Chơi 1.2 trong trình duyệt thật: cổng vào → code gốc `NameError` dòng 13 → lời giải → 3 sao, "Đã thu: Hồ sơ danh tính" → TIẾP TỤC sang `#/story/after-1.2` | GDD 14, 15 #24, hợp đồng 7 | 5 | `tests/e2e/level-1-2.spec.ts` |
| 13 | 1.4 không đổi hành vi: test cũ (Vitest, Python, e2e 1.4) vẫn xanh | Hợp đồng 5 | 6 | `npm test`, `npm run test:py`, `npm run test:e2e` |

## Non-goals

- Chấm theo lịch sử gán hay theo AST (lời giải không gán lại vẫn 3 sao, GDD 6).
- Chấm stdout ở 1.2 (stdout chỉ hiện ở terminal).
- Mọi phần của vỏ game và 1.1 (bảng tiền đề ở trên); mô phỏng `relay`/`sorter`.
- Test cho các ca bảng GDD đánh "Không" (#8–#15, #23) và mọi test hiển nhiên (kiểu, render đơn giản, sao theo luật chung đã có test).

## Rủi ro chính

- **Tracer chậm hơn trên Pyodide:** đo ở phase 2 trước khi nối UI; có hai bậc lùi, bậc 2 chỉ là một dòng trong `build-config.ts`.
- **Plan 1.1 lệch hợp đồng** (tên hook, chỗ đặt `simulation`): phase 1 và 5 bắt đầu bằng bước đọc lại code; chỉnh đường dẫn, không làm lại phần chung.
- **6 mục tiêu dài cột Nhiệm vụ:** cột tự cuộn; kiểm ở 360 px trong phase 5.
- **Kiểm hiệu ứng bằng ảnh chụp Claude-in-Chrome sẽ bỏ qua phần mở đầu level** (sự kiện chuột). Kiểm phát lại ki-ốt bằng e2e và xem tay, không dựa vào ảnh chụp giữa chừng.

## Câu hỏi còn mở (đã tự chốt, không chặn)

1. **Thêm trường `src` vào mục lịch sử** (hợp đồng chỉ nêu `{line, var, type, preview}`). Cần để không nối dây cho giá trị gõ tay như GDD 8 yêu cầu; chi phí chỉ khi có thay đổi (≤ 40 lần).
2. **Bóng mờ so theo preview, dây so theo identity.** Hai câu hỏi khác nhau: "ô khác có đang giữ giá trị này không" và "ô này có lấy từ bộ đệm không".
3. **`value_is_label` không áp cho lượt phản công** (lượt đó chỉ chạy sau khi lượt cơ bản đúng, nên không gặp).
4. **Giới hạn validator cho kiosk:** 1–3 thiết bị, 1–6 ô nhớ (bố cục 2 cột). 1.2 dùng 2 và 4.
5. **Bảng GDD 1.2 mục 15 #10 và mục 13** được chỉnh cho khớp NFC và `src` ở phase 6 (chỉ hai chỗ đó).
6. **e2e chạy theo cấu hình project mặc định** (chromium, firefox, mobile-chromium) như spec 1.4; nếu quá chậm, giới hạn bằng `--project=chromium` theo GDD 15 #24.

---
title: "Level 1.1 Khởi động: chấm đầu ra print, trạm R-17, phần engine dùng chung"
description: "Thêm mục tiêu output_line, so stdout theo dòng (NFC), từ cấm cộng dồn, chọn mô phỏng bằng simulation.kind, mô phỏng trạm R-17, rồi dữ liệu level-1-1.json chơi được tới 3 sao và chuyển cảnh."
status: completed
priority: P1
effort: 18h
branch: ""
tags: [feature, engine, frontend, level]
blockedBy: [261025-0928-mo-dau-va-chuyen-canh]
blocks: []
created: 2026-10-25
---

# Level 1.1 "Khởi động"

## Overview

Dựng Level 1.1 (`print`, chuỗi) và các phần engine mà 1.2, 1.3 sẽ coi là đã có. Người chơi chạy bản nháp lỗi, đọc terminal, sửa ba lệnh `print` để trạm R-17 phát đúng gói bắt tay; sao thứ ba bắt lỗi chép cứng mã phiên khi OMNI làm trạm khởi động lại (`K7Q2` → `M4X8`). Level vào luồng chương chỉ bằng `src/levels/level-1-1.json` (id đã có trong `chapter-1.json`).

Nguồn quyết định (đã chấp nhận, không mở lại), theo thứ tự ưu tiên:
1. Hợp đồng engine: [`plans/reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md`](../reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md). Mục 1–4 và 7 thuộc plan này. Thắng GDD level ở chỗ khác nhau.
2. GDD level: [`design/chuong-1/gdd-1.1-khoi-dong.md`](../../design/chuong-1/gdd-1.1-khoi-dong.md) (bản nháp JSON mục 14, lượt chơi mục 11, bảng biên mục 13). Brainstorm: [`plans/reports/brainstorm-261025-0928-level-1-1-khoi-dong.md`](../reports/brainstorm-261025-0928-level-1-1-khoi-dong.md) (luật so khớp, dạng báo cáo `output` của harness).
3. Hợp đồng truyện: [`design/gdd-mo-dau.md`](../../design/gdd-mo-dau.md) mục 6.1.
4. Lỗi cũ phải tránh: [`docs/nhat-ky-loi-prototype-1-4.md`](../../docs/nhat-ky-loi-prototype-1-4.md) mục 2–5 (bản riêng của module dùng chung trong harness, cue trễ hẹn trên đồng hồ audio, kiểm hiệu ứng bằng probe chứ không bằng ảnh chụp).

**Chạy sau plan vỏ game** [`plans/261025-0928-mo-dau-va-chuyen-canh/`](../261025-0928-mo-dau-va-chuyen-canh/plan.md). Plan này giả định đã có: định tuyến hash, `LevelSimulation` (`src/ui/level-simulation.tsx`), `location`/`component`/`outro_beats` trong `level-types.ts`, `src/game/echo-leaks.ts`, `useAudio` ở `App`, helper e2e `gotoLevel(page, id)`, hộp kết quả có TIẾP TỤC và "Đã thu". **Trước mỗi phase, đọc lại mã thật**; nếu vỏ game làm khác plan của nó (tên file, chữ ký hàm), theo mã thật và ghi chỗ lệch vào phần "Ghi chú triển khai" cuối phase.

## Quyết định kỹ thuật chính

- **Mục tiêu là hợp hai loại.** `VarObjective { kind?: "var"; var; type; label }` (1.4 không đổi JSON) và `OutputLineObjective { kind: "output_line"; line; label }`. Helper `varObjectives(level)` / `outputObjectives(level)` trong `level-types.ts`; mọi chỗ đang đọc `level.objectives` cho biến (build-config, classify, máy quét) đổi sang `varObjectives`. `TestCase.expected_output?: string[]`.
- **Luật so đầu ra cố định, nằm trong harness** (hợp đồng mục 4, brainstorm "Luật so khớp"): stdout riêng (stderr tách bộ đệm, không chấm), `\r\n`/`\r` → `\n`, NFC hai phía, bỏ khoảng trắng cuối dòng và dòng rỗng ở cuối, còn lại tuyệt đối; bị cắt thì không đạt; vẫn so khi chương trình lỗi nhưng lượt lỗi không đạt. Báo cáo `output` theo dạng trong brainstorm (`lines[]` với `status ok|wrong|missing`, `col`, `case_only`; `extra_lines` ≤ 3; `extra_count`; `truncated`; `ok`).
- **NFC ở mọi phép so chuỗi** (hợp đồng mục 3): cả biến `str` (`_values_equal`) lẫn dòng đầu ra. Harness giữ bản riêng `_nfc = unicodedata.normalize` như `math`/`json`.
- **Phân loại** (hợp đồng mục 4): lỗi chạy/dừng → biến (như cũ) → dòng đầu ra sai đầu tiên tính từ trên (`output_case_only` / `output_mismatch` / `output_missing`) → `output_extra`. Phản công sai đầu ra → `wrong_value_counter` với `out_line`. `OutcomeDetails` thêm `out_line`, `col`. Không đổi `compute-stars.ts`.
- **Từ cấm cộng dồn** (hợp đồng mục 2): `levelLeaks(level)` = `int|float|round` + `forbidden_terms` của level; đáp án = mọi `expected` + mọi dòng `expected_output`. Khớp không phân biệt hoa thường theo ranh giới chữ Unicode (`(?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_])`, cờ `iu`); từ chỉ gồm dấu câu khớp chuỗi con. Một module `echo-leaks.ts` dùng cho test, validator (`outro_beats`) và validator chương.
- **Chọn mô phỏng bằng `simulation: { kind, ...tùy chọn }`** (hợp đồng mục 1), thiếu → `scanner`. Plan này chỉ cài `scanner` và `relay`; `kiosk`/`sorter` do plan 1.2/1.3 thêm vào cùng hằng `SIMULATION_KINDS` (validator từ chối kind chưa cài, để level không bao giờ rơi vào mô phỏng không tồn tại). Tùy chọn của `relay`: `station` (bắt buộc, chuỗi ≤ 12 ký tự, ở 1.1 là `"R-17"`) để chữ "R-17" trong terminal và SVG đến từ dữ liệu. GDD mục 14 viết `"simulation": "relay"`; hợp đồng thắng.
- **Phát lại khung hình dùng chung**: tách `use-timeline-playback.ts` khỏi `scanner-simulation.tsx` (vị trí khung, effect hẹn khung, cue qua `onCue(cue, 450*i)` trên đồng hồ audio, Esc/nút bỏ qua, giảm chuyển động nhảy khung cuối, `onDone`). Máy quét chuyển sang hook mà không đổi hành vi; trạm R-17 chỉ viết `relay-timeline.ts` (thuần, có test) và `relay-simulation.tsx` (vẽ).
- **Chữ đặc thù theo loại mô phỏng, không theo level** (hợp đồng mục 7): `src/game/sim-vocabulary.ts` trả bộ chữ cho `scanner` (đúng chữ 1.4 hiện nay, nên test 1.4 không đổi) và `relay` (dùng `station`): dòng đầu terminal, danh từ "CỔNG"/"KÊNH", dòng phụ ô Mục tiêu, tiêu đề hộp kết quả. Chữ không thuộc loại nào thì làm trung tính ("dữ liệu chip" → "dữ liệu nạp sẵn"). Tên tệp `neural_id.py` giữ nguyên (briefing 1.1 nhắc đến nó).
- **So sánh hiển thị** (`cần:`/`nhận:`, `·` cho dấu cách, `→` cho tab, `▯` cho ký tự thiếu, `U+XXXX` khi ký tự sai không phải ASCII) là một hàm thuần `src/game/output-diff.ts`, dùng chung cho terminal và danh sách phát của trạm.
- **Vòng sáng trên CHẠY khi `progress.runs === 0`**, mọi level, không thêm trường; giảm chuyển động: viền tĩnh.

## Phases

| # | Phase | Effort | Phụ thuộc | Status |
|---|---|---|---|---|
| 1 | [Schema level, validator, từ cấm, dữ liệu 1.1](./phase-01-schema-validator-leaks-level-data.md) | 3h | vỏ game xong | completed |
| 2 | [Harness: chấm đầu ra, NFC, tách stderr](./phase-02-harness-output-grading.md) | 3h | 1 | completed |
| 3 | [Phân loại, terminal, bộ chữ theo mô phỏng](./phase-03-classify-terminal-vocabulary.md) | 3h | 2 | completed |
| 4 | [UI: hook phát lại, trạm R-17, mục tiêu đầu ra, vòng sáng CHẠY](./phase-04-relay-simulation-and-ui.md) | 6h | 3 | completed |
| 5 | [E2E 1.1, sửa spec luồng truyện, tài liệu, chạy toàn bộ](./phase-05-e2e-docs-verification.md) | 3h | 4 | completed |

Tuần tự 1 → 5, một implementer. Từ phase 1 `level-1-1.json` đã nằm trong registry nên luồng chương dẫn vào 1.1, nhưng 1.1 chỉ chơi đúng từ cuối phase 4; `story-flow.spec.ts` của vỏ game sẽ đỏ cho tới phase 5 (dự kiến, sửa ở đó).

## Tiêu chí chấp nhận

| AC | Nội dung | Nguồn | Phase | Bằng chứng |
|---|---|---|---|---|
| 1 | `level-1-1.json` qua validator; thêm JSON là đủ để 1.1 vào bản đồ và luồng (mở đầu → 1.1) | GDD 1.1 §14, hợp đồng §7 | 1, 5 | `validate-level.test.ts`, `validate-chapter.test.ts` (có sẵn), e2e |
| 2 | Validator: `output_line` là 1..N liên tiếp, không trùng; mỗi test và test phản công có `expected_output` đúng N chuỗi, không `\n`, không khoảng trắng cuối; `expected` chỉ cần biến của mục tiêu `var`; `simulation.kind` đã cài, tùy chọn kiểm theo kind; `forbidden_terms` mảng chuỗi không rỗng; nhịp ECHO trong `outro_beats` không chứa từ cấm của level | GDD §13 hàng "JSON 1.1", hợp đồng §1, §2, §4 | 1 | `validate-level.test.ts` |
| 3 | Từ cấm cộng dồn, Unicode, dấu câu khớp chuỗi con, `expected_output` là đáp án; áp cho `reactions` và ECHO trong `outro_beats`, không áp cho `hints`; 1.4 vẫn qua | hợp đồng §2, GDD §9 | 1 | `echo-leaks.test.ts`, `echo-forbidden-terms.test.ts` |
| 4 | Harness so đầu ra đúng luật: chuẩn hóa cuối dòng/cuối đầu ra, NFC (NFD == NFC, cả biến `str`), vẫn so khi lỗi, bị cắt thì không đạt, stderr không chấm và trả riêng, `col`/`case_only`/`extra_count` đúng | hợp đồng §3, §4; GDD §13 | 2 | `test_harness.py` lớp `OutputGrading` |
| 5 | Lời giải 2 sao (`print("PHIEN K7Q2")`) → 2 sao, `wrong_value_counter`, `out_line` 2; lời giải 3 sao bằng dấu phẩy và bằng `+` → 3 sao, 3 lệnh | GDD §6, §7, §10 | 3 | `tests/integration/level-1-1.test.ts` |
| 6 | Các hàng **Có** của GDD §13 chạy qua harness thật (bảng dưới) | GDD §13 | 2, 3 | integration + harness unit |
| 7 | Phân loại: lỗi trước đầu ra; dòng sai đầu tiên từ trên quyết định `output_case_only`/`output_mismatch`/`output_missing`; thừa dòng → `output_extra` với `{count}`; `{out_line}`, `{col}` điền được | hợp đồng §4 | 3 | `classify-run.test.ts`, integration |
| 8 | Terminal 1.1 đúng mẫu GDD §5 (dòng đầu "phát qua trạm R-17", ĐÃ PHÁT/BỎ GÓI/KHÔNG CÓ DÒNG/DÒNG THỪA, cặp `cần:`/`nhận:`, `KÊNH: …`); lỗi chạy vẫn liệt kê dòng đã phát; 1.4 không đổi một chữ | GDD §5, §11 bước 2, hợp đồng §7 | 3 | `terminal-lines.test.ts` (ca 1.1 + ca 1.4 cũ giữ nguyên) |
| 9 | Mô phỏng trạm R-17 theo GDD §5: gói theo dòng 450 ms, khớp/sai/thiếu/thừa/lỗi chạy/lỗi cú pháp, kênh nửa/mở, phản công đổi chip, cue đúng; Esc bỏ qua; giảm chuyển động hiện khung cuối; `aria-live` một câu; điện thoại SVG 4:3 + danh sách cuộn, chữ mono ≥ 14 px | GDD §5 | 4 | `relay-timeline.test.ts` (thuần), e2e, kiểm tay 375 px |
| 10 | Máy quét 1.4 chạy qua hook chung, hành vi không đổi | hợp đồng §1 | 4 | `scanner-timeline.test.ts`, e2e 1.4 có sẵn |
| 11 | Ô Mục tiêu vẽ `output_line` ("dòng N", đạt/chưa đạt theo dòng), dòng phụ theo loại mô phỏng; hộp kết quả có tiêu chí và tiêu đề đúng loại; chữ "dữ liệu chip" ngoài 1.4 thành trung tính | GDD §2, hợp đồng §7 | 3, 4 | e2e 1.1, e2e 1.4 (sửa một assert) |
| 12 | Vòng sáng trên CHẠY tới lượt chạy đầu tiên của level, mọi level; viền tĩnh khi giảm chuyển động | GDD §8.3, hợp đồng §7 | 4 | e2e 1.1 (có rồi mất sau lượt 1) |
| 13 | Một e2e chơi 1.1 từ cổng VÀO NHIỆM VỤ: code gốc → NameError dòng 7 → chỉ khác hoa thường → 3 sao, "Đã thu: Tiêu đề tín hiệu" → TIẾP TỤC → `#/story/after-1.1` → level đã dựng kế tiếp | GDD §11, §12, hợp đồng §7 | 5 | `tests/e2e/level-1-1.spec.ts` |
| 14 | Mọi test cũ vẫn qua (1.4 không đổi), trừ chỗ `story-flow.spec.ts` phải đổi vì 1.1 nay là level đã dựng đầu tiên | – | 5 | `npm test`, `npm run test:py`, `npm run test:e2e` |

### Hàng "Có" của GDD §13 → test

| Hàng GDD | Test |
|---|---|
| Chạy code gốc: `NameError` dòng 7, dòng 1 ok, 2–3 missing | integration `original` |
| Sửa dòng 7, dòng 8 viết thường: `output_case_only`, `out_line` 3, `col` 1 | integration |
| 3 sao bằng dấu phẩy / bằng `+` | integration (tham số hóa) |
| `print("PHIEN K7Q2")`: 2 sao, `wrong_value_counter`, `out_line` 2 | integration |
| Dấu cách cuối, `print("NID/2089", "")`, `print()` cuối: vẫn đạt; dấu cách đầu chuỗi, `print()` giữa: `output_mismatch` vị trí 1 | harness unit (luật) + integration (một ca mỗi phía) |
| In thêm một dòng: `output_extra`, `{count}` = 1 | integration |
| Xóa dòng 8 / xóa hết: `output_missing`, `out_line` 3 / 1 | integration (một test hai ca) |
| NFD == NFC | harness unit |
| Đủ 3 dòng rồi `1/0`: `ZeroDivisionError`, 0 sao, đầu ra vẫn được báo | integration |
| `print("A" * 10**6)`: bị cắt, không đạt, không treo | harness unit |
| stderr không ảnh hưởng chấm, trả riêng | harness unit |
| Lời ECHO trong `reactions`, `outro_beats` sạch | `echo-forbidden-terms.test.ts` |
| JSON 1.1 qua validator; `expected_output` thiếu/lệch số dòng bị báo | `validate-level.test.ts` |
| Đi trọn đường tới 3 sao | `tests/e2e/level-1-1.spec.ts` |

## Non-goals

- Mô phỏng `kiosk`/`sorter`, `var_history`, `ValueType "type"`, đầu vào test kiểu số/bool, khóa `value_is_label`/`type_mismatch_unknown_shape` (hợp đồng §5, §6: plan 1.2, 1.3).
- Sửa vỏ game (router, đoạn truyện, bản đồ, progression) ngoài việc sửa assert trong `story-flow.spec.ts`.
- Cờ so khớp theo level (bỏ qua hoa thường…), tự thay dấu nháy cong trong editor, tour giao diện.
- Test cho các hàng "Không" của GDD §13 và cho phần đã có test (dòng khóa, `input()`, vòng lặp vô hạn, luật sao).
- Sửa `design/*.md`.

## Rủi ro chính

- **Vỏ game lệch plan của nó** → mọi phase bắt đầu bằng đọc lại mã thật (`level-simulation.tsx`, `echo-leaks.ts`, `results-dialog.tsx`, `tests/e2e/helpers.ts`, `story-flow.spec.ts`).
- **`unicodedata` trên Pyodide**: là module chuẩn có sẵn trong bản Pyodide đang dùng; nếu import lỗi thì cả harness hỏng và e2e phase 5 đỏ ngay ở lượt chạy đầu. Kiểm sớm ở phase 2 bằng một lượt `npm run dev` (hoặc chạy `level-1-4.spec.ts` một test) sau khi sửa harness.
- **Đổi `Objective` thành hợp** chạm nhiều file UI/engine; `npm run typecheck` sau phase 1 chỉ ra hết chỗ dùng `o.var`.
- **Tách hook phát lại** có thể làm lệch cue hoặc lặp `onDone` (StrictMode). Giữ nguyên logic effect hiện tại, chỉ di chuyển; e2e `audio.spec.ts` và `level-1-4.spec.ts` là lưới an toàn.
- **Luồng chương đổi khi 1.1 tồn tại**: 1.4 bị khóa sau 1.1 trên bản đồ (vẫn vào được bằng liên kết, nên e2e 1.4 dùng `#/level/1.4` không ảnh hưởng); `story-flow.spec.ts` phải đổi kỳ vọng.

## Câu hỏi còn mở (đã tự chốt, không chặn)

1. **`simulation.station` cho `relay`** là trường mới không có trong GDD/hợp đồng; chọn để "R-17" không viết cứng trong mã. Bắt buộc với `relay`.
2. **`SIMULATION_KINDS` chỉ gồm loại đã cài** (`scanner`, `relay`); 1.2/1.3 thêm `kiosk`/`sorter` khi cài mô phỏng của chúng.
3. **Bộ chữ theo loại mô phỏng nằm trong mã** (`sim-vocabulary.ts`), không thành trường JSON. Đổi sang dữ liệu level nếu sau này hai level cùng loại cần chữ khác nhau.
4. **Tiêu đề hộp kết quả của `relay`**: 3 sao "Kênh mở hoàn toàn", 2 sao "Kênh mở một nửa", 1 sao "Kênh mở, bị ghi nhận"; tiêu chí 1 "Đầu ra khớp từng ký tự, chạy hết không lỗi" khi level chỉ có mục tiêu đầu ra. Tự đặt, GDD không nói.
5. **Lỗi chạy ở terminal**: chỉ liệt kê dòng đã kịp phát (ok/sai), không liệt kê dòng thiếu sau chỗ lỗi (khớp ví dụ GDD §11 bước 2).
6. **Đầu ra bị cắt** không có khóa phản ứng riêng: rơi vào khóa của dòng sai đầu tiên hoặc `output_extra` theo luật thường.
7. **`expected: {}` vẫn bắt buộc** trong mỗi test (giữ dạng bản nháp GDD); không nới thành tùy chọn.

---
title: "Level 1.3 \"Bốn loại tín hiệu\""
description: "Thêm mục tiêu kiểu `type`, đầu vào không phải chuỗi, khóa phản ứng type_mismatch_unknown_shape, máy phân loại bốn làn và src/levels/level-1-3.json để 1.3 chơi được trong luồng Chương 1."
status: completed
priority: P1
effort: 14h
branch: ""
tags: [feature, frontend, engine, level]
blockedBy: [261025-0928-mo-dau-va-chuyen-canh, 261025-0928-level-1-1-khoi-dong, 261025-0928-level-1-2-gan-nhan]
blocks: []
created: 2026-10-25
---

# Level 1.3 "Bốn loại tín hiệu"

## Overview

Người chơi qua Ga Ngầm Số 3 bằng cách viết lại năm trường của hồ sơ ĐỖ MINH AN cho đúng hình dạng (`str`, `int`, `float`, `bool`) và khai `khuon_phien` là chính hình dạng của `ma_phien` (`type(ma_phien)`). Phản công đổi `ma_phien` từ `4096` sang `"7351"`: ai chép tay `int` trượt. Mô phỏng là máy phân loại bốn làn màu.

Phần engine của plan này là mục 6 của hợp đồng: mục tiêu loại `"type"`, đầu vào test là chuỗi/số/bool, khóa `type_mismatch_unknown_shape`. Còn lại là dữ liệu level, mô phỏng `sorter`, test và một e2e.

Nguồn quyết định (đã chấp nhận, không mở lại), theo thứ tự ưu tiên:
1. Hợp đồng engine: [`plans/reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md`](../reports/decision-261025-0928-hop-dong-engine-level-1-1-den-1-3.md). Thắng GDD level khi khác nhau.
2. GDD level: [`design/chuong-1/gdd-1.3-bon-loai-tin-hieu.md`](../../design/chuong-1/gdd-1.3-bon-loai-tin-hieu.md) (bản nháp JSON mục 14, lối đi mục 12, bảng biên mục 13); brainstorm [`plans/reports/brainstorm-261025-0928-level-1-3-bon-loai-tin-hieu.md`](../reports/brainstorm-261025-0928-level-1-3-bon-loai-tin-hieu.md).
3. Trục truyện: [`design/gdd-mo-dau.md`](../../design/gdd-mo-dau.md) mục 6.3.
4. Lỗi cũ: [`docs/nhat-ky-loi-prototype-1-4.md`](../../docs/nhat-ky-loi-prototype-1-4.md). GDD chung: [`design/gdd.md`](../../design/gdd.md) 4.1, 4.2, 4.5, 5.2.

## Điều kiện trước (làm bởi plan khác, chạy TRƯỚC plan này)

| Plan | Cung cấp cho 1.3 |
|---|---|
| [`261025-0928-mo-dau-va-chuyen-canh`](../261025-0928-mo-dau-va-chuyen-canh/plan.md) | Router hash, `#/level/<id>`, `#/story/after-<id>`, `LevelSimulation` (`src/ui/level-simulation.tsx`), `location`/`component`/`outro_beats`, `gotoLevel(page, id)` trong `tests/e2e/helpers.ts`, `chapter-1.json` đã có `"1.3"` |
| `261025-0928-level-1-1-khoi-dong` | Hợp đồng mục 1–4, 7: `simulation: {kind}`, hook `use-timeline-playback.ts`, `forbidden_terms` cộng dồn + so theo ranh giới chữ Unicode trong `echo-leaks.ts` (dùng cho test và validator), NFC khi so chuỗi trong harness (kèm test NFD == NFC), mục tiêu `output_line` (`Objective` thành hợp `VarObjective | OutputLineObjective`), chữ trung tính trong `terminal-lines.ts`/`objectives-panel.tsx`, vòng sáng CHẠY |
| `261025-0928-level-1-2-gan-nhan` | Hợp đồng mục 5: `value_is_label`, `var_history` (chỉ với `kiosk`) |

**Người làm phải đọc lại mã thật trước mỗi phase** (`level-types.ts`, `validate-level.ts`, `echo-leaks.ts`, `classify-run.ts`, `echo-reactions.ts`, `harness.py`, `level-simulation.tsx`, `use-timeline-playback.ts`). Plan này viết trên trạng thái dự kiến sau ba plan trên; nếu tên file, chữ ký hàm hay vị trí logic khác, giữ ý định của bước và theo mã thật. Không làm lại việc của plan trước; thiếu gì nhỏ thì làm trong phase tương ứng ở đây và ghi lại.

## Quyết định kỹ thuật chính

- **`"type"` vào `VALUE_TYPES`** (hợp đồng mục 6 nói `ValueType` thêm `"type"`). Giá trị kỳ vọng của mục tiêu `type` là chuỗi tên kiểu thuộc bốn kiểu cơ bản (`"int" | "float" | "str" | "bool"`). Chỗ nào đang coi `VALUE_TYPES` là "bốn kiểu có màu" thì dùng hằng `BASE_TYPES` mới.
- **Harness chấm `type`:** `type_ok = type(v) is type`; `value_ok = v is TYPE_MAP[expected]` (TYPE_MAP chụp trước khi chạy code người chơi, nên `int = 5` không lừa được). `_preview` của một đối tượng kiểu trả `<class 'tên'>` (không gọi `repr` của người chơi). Chuỗi `"int"` hoặc `"<class 'int'>"` → `value_match_other_type = true`. Không thêm trường mới vào báo cáo harness.
- **Đầu vào có kiểu:** `InputValue = string | number | boolean`, cho `TestCase.inputs`, `HarnessTestResult.inputs`, `RunOutcome.counterInputs`. Harness không đổi (`ns.update(inputs)` đã nhận mọi giá trị JSON). Giới hạn đã biết: `2.0` qua JSON thành `int`; ghi chú trong validator, 1.3 không dùng.
- **Hiển thị đầu vào theo cú pháp Python** bằng một module thuần mới `src/game/python-literal.ts` (`formatPyLiteral`, `pyTypeOf`): chuỗi giữ `JSON.stringify` (nên dòng 1.4 y hệt cũ), số `String(n)`, bool `True`/`False`. Dùng ở `terminal-lines.ts`, `scanner-timeline.ts`, `sorter-timeline.ts`.
- **`type_mismatch_unknown_shape`** do `classify-run.ts` trả khi mọi biến sai kiểu mang hình dạng ngoài `int/float/str/bool/type` (lượt cơ bản). Rơi về `type_mismatch` nằm ở `reactionText` trong `echo-reactions.ts` qua một bảng `REACTION_FALLBACK` nhỏ (khóa vẫn trung thực cho lịch sử `repeated_fail` và mô phỏng). Nếu 1.1/1.2 đã có cơ chế rơi khóa, dùng lại nó.
- **Tông màu `shape`** cho chip mục tiêu `type` (viền xám trắng, không phải một trong bốn màu): `toneOf("type") = "shape"`, `--type-shape` trong `tokens.css`; chip mục tiêu dùng `toneVar(toneOf(o.type))`.
- **Máy phân loại** là timeline thuần `src/ui/sorter-timeline.ts` (kiểu `SorterScene`, khung `{scene, hold, cues}` như scanner) + `src/ui/sorter-simulation.tsx` vẽ SVG, phát lại bằng `use-timeline-playback.ts` của 1.1; thêm nhánh `sorter` vào `LevelSimulation`. Hình dạng mà con dấu khuôn mang lấy từ `preview` (`<class 'int'>` → `int`), không đổi giao thức harness. Không thêm recipe âm thanh.
- **Từ cấm:** level 1.3 dùng trường `forbidden_terms` (đổi tên từ `echo_forbidden_terms` của GDD), cộng dồn vào danh sách chung. Test rò rỉ đáp án có sẵn (sau 1.1) tự phủ 1.3 khi file JSON được đăng ký; `"int"`/`"str"` là giá trị kỳ vọng nên tự vào tập đáp án.
- **Lời giải mẫu** ở `tests/fixtures/solutions/1.3/*.py` (đầy đủ văn bản editor, kể cả dòng khóa), chạy qua harness thật bằng `python3`.

## Phases

| # | Phase | Effort | Phụ thuộc | Status |
|---|---|---|---|---|
| 1 | [Schema và validator: mục tiêu `type`, đầu vào có kiểu, `sorter`](./phase-01-schema-and-validator.md) | 1.5h | plan trước | completed |
| 2 | [Harness chấm mục tiêu `type`](./phase-02-harness-type-objective.md) | 1.5h | 1 | completed |
| 3 | [Phân loại, ECHO, terminal, màu `shape`](./phase-03-classify-echo-terminal.md) | 2h | 1, 2 | completed |
| 4 | [Dữ liệu level 1.3 và test tích hợp](./phase-04-level-data-and-integration.md) | 2h | 1–3 | completed |
| 5 | [Máy phân loại bốn làn](./phase-05-sorter-simulation.md) | 5h | 4 | completed |
| 6 | [E2E 1.3 → 1.4, tài liệu, kiểm toàn bộ](./phase-06-e2e-docs-verification.md) | 2h | 5 | completed |

Tuần tự 1 → 6, một implementer. Giữa phase 4 và 5, 1.3 đã vào luồng nhưng `LevelSimulation` còn vẽ máy quét (5 làn tràn khung): chấp nhận tạm, không phát hành giữa hai phase này.

## Tiêu chí chấp nhận

| AC | Nội dung | Nguồn | Phase | Bằng chứng |
|---|---|---|---|---|
| 1 | Mục tiêu `type`: đối tượng kiểu đúng → đạt; `"int"`/`"<class 'int'>"` → sai kiểu, khớp nội dung; `type`/`type(None)` → đúng loại, sai giá trị; `int = 5` rồi `khuon_phien = int` → sai kiểu; preview `<class 'int'>` | Hợp đồng 6; GDD 4, 13 #4 #7 #8 | 2 | `test_harness.py` lớp `TypeObjective` |
| 2 | Đầu vào số/bool đi qua `buildConfig` → harness → namespace với đúng kiểu Python, cả lượt thường và phản công | Hợp đồng 6 | 2, 4 | `TypeObjective` (đầu vào `4096` và `"7351"`); test tích hợp 3 sao |
| 3 | Validator: mục tiêu `type` kỳ vọng ngoài bốn tên → lỗi nêu tên trường; đầu vào object/null/mảng → lỗi; đầu vào số/bool hợp lệ; `simulation.kind = "sorter"` hợp lệ; 1.4 vẫn hợp lệ | GDD 13 #24 #25 | 1 | `validate-level.test.ts` |
| 4 | Code gốc: `type_mismatch`, 0 sao, không lỗi, stdout `<class 'str'>\n`, `chieu_cao.type = "tuple"` | GDD 6, 13 #1 | 4 | `grading-pipeline-1-3.test.ts` |
| 5 | Chỉ còn `chieu_cao = 1,72` → `type_mismatch_unknown_shape`; chỉ còn `tuoi = "27"` → `type_mismatch_value_match` | GDD 13 #2 #3 | 3, 4 | test tích hợp |
| 6 | Lời giải 2 sao (`khuon_phien = int`) → 2 sao, `wrong_value_counter`; 3 sao (`type(ma_phien)`) → 3 sao, `three_stars`; cả hai ≤ 7 câu lệnh | GDD 7, 8, 10, 13 #5 #6 | 4 | test tích hợp |
| 7 | Level không định nghĩa `type_mismatch_unknown_shape` (1.4) → câu ECHO của `type_mismatch` | Hợp đồng 6; GDD 13 #27 | 3 | `echo-reactions.test.ts` |
| 8 | Dòng terminal phản công `> ma_phien = "7351"`; đầu vào số hiện `4096`, bool `True`; dòng 1.4 không đổi | Hợp đồng 6; GDD 13 #28 | 3 | `terminal-lines.test.ts` |
| 9 | Không phản ứng miễn phí, `entry` hay nhịp `echo` của `outro_beats` 1.3 chứa từ trong `forbidden_terms` hay giá trị kỳ vọng (gồm `int`, `str`, `27`, `1.72`, `True`, `ĐỖ MINH AN`); 1.4 vẫn qua với mặc định | Hợp đồng 2; GDD 9, 13 #22 #23 | 4 | `echo-forbidden-terms.test.ts` (có sẵn, tự phủ level mới) |
| 10 | Máy phân loại: gói tuple xám rơi thùng "KHÔNG RÕ HÌNH DẠNG"; gói sai làn vào làn của hình dạng thật rồi rơi thùng; con dấu khuôn KHỚP/LỆCH KHUÔN theo thẻ mã phiên; biến thiếu "KHÔNG CÓ TÍN HIỆU"; lỗi Python: gói không rời băng chuyền, "TRUY VẾT: dòng n"; cue đúng (`scan_pass`, `scan_reject`, `alarm`, `siren`, `gate_open`, `star`) | GDD 5; 13 #29 | 5 | `sorter-timeline.test.ts` (4 ca) |
| 11 | Giảm chuyển động hiện ngay khung cuối; 360 px không cuộn ngang, chữ nhãn ≥ 16 đơn vị khung; câu tóm tắt cho trình đọc màn hình | GDD 5; 13 #30 | 5 | kiểm tay |
| 12 | Chơi được từ màn "VÀO NHIỆM VỤ" của 1.3 tới 3 sao, "Đã thu: Khuôn kiểu", TIẾP TỤC → `after-1.3` (KTS-07) → màn "VÀO NHIỆM VỤ" của 1.4 | Hợp đồng 7; GDD 11, 12 | 6 | `tests/e2e/level-1-3.spec.ts` |
| 13 | 1.4 hành xử như cũ: mọi test Vitest, Python và e2e hiện có qua không sửa kỳ vọng | Đề bài | 1–6 | `npm test`, `npm run test:py`, `npm run test:e2e` |

## Non-goals

- Ép kiểu, `isinstance`, so sánh; cấm `int("27")` (vẫn được chấm đúng).
- Thêm trường mới vào báo cáo harness (ví dụ tên kiểu mà con dấu mang): suy từ `preview`.
- Recipe âm thanh mới, thư viện animation.
- Test cho các dòng GDD 13 đánh "Không" hoặc "Chung" (#10–21, #26, #31), và NFD (#9: thuộc test NFC của plan 1.1).
- Cờ `star_tier` để `khuon_phien` chỉ chặn sao 3 (brainstorm, rủi ro 1).
- Sửa `design/*.md`.

## Rủi ro chính

- **Plan 1.1/1.2 lệch dự kiến** (tên hook phát lại, chữ ký `findEchoLeak`, `Objective` hợp, chỗ chọn mô phỏng). Giảm bằng: đọc mã thật đầu mỗi phase; các bước ở đây mô tả ý định, không phụ thuộc tên dòng.
- **`"type"` trong `VALUE_TYPES`** có thể làm đổi những chỗ đang lặp bốn màu (chú giải màu, `toneOf`). Phase 1 grep mọi chỗ dùng `VALUE_TYPES`/`ValueType` và tách `BASE_TYPES`.
- **Mô phỏng mới tốn công nhất** và có rủi ro bố cục trên điện thoại. Timeline thuần được test; phần vẽ kiểm tay ở 360 px và với giảm chuyển động.
- **Gõ "ĐỖ MINH AN" trong e2e:** dùng `keyboard.insertText` (đã dùng trong helper), không gõ phím từng ký tự.

## Câu hỏi còn mở (đã tự chốt, không chặn)

1. **Rơi khóa ở `echo-reactions.ts`, không ở `classify-run.ts`.** 1.2 có thể đã chọn "chỉ trả khóa khi level có nó" cho `value_is_label`; nếu vậy và người làm muốn đồng nhất, chuyển kiểm vào `classify-run.ts` là một dòng. Kết quả người chơi thấy như nhau.
2. **`"type"` vào thẳng `VALUE_TYPES`** theo chữ hợp đồng (brainstorm đề xuất `OBJECTIVE_TYPES` riêng). Khác biệt chỉ là tên hằng.
3. **Hình dạng của con dấu suy từ `preview`.** Nếu sau này `preview_chars` nhỏ hơn độ dài `<class 'bool'>` thì phải thêm trường; hiện 80 ký tự.
4. **E2E chỉ có một test** theo chính sách người dùng; không e2e cho lượt 2 sao/phản công (đã có test tích hợp và timeline).
5. **Số thực tròn trong đầu vào** (`2.0` thành `int`) chỉ được ghi chú, không chặn bằng validator (validator không phân biệt được `2` và `2.0` sau khi parse JSON).

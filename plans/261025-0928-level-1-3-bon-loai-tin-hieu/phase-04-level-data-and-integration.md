---
phase: 4
title: "Dữ liệu level 1.3 và test tích hợp"
status: completed
priority: P1
effort: "2h"
dependencies: [1, 2, 3]
---

# Phase 4: Dữ liệu level 1.3 và test tích hợp

## Goal
`src/levels/level-1-3.json` qua validator, vào luồng Chương 1 (sau `after-1.2`, trước 1.4), không rò rỉ đáp án; các lời giải trong GDD chạy qua harness thật cho đúng khóa và số sao.

## Context
- GDD 1.3 mục 14 (bản nháp JSON), 3, 4, 7, 8, 11, 13 #1 #2 #3 #5 #6 #22 #23. Trục truyện `design/gdd-mo-dau.md` 6.3.
- Hợp đồng mục 1 (`simulation` là object), 2 (`forbidden_terms`).
- `tests/integration/run-harness.ts` (`gradeFixture(level, name)` đọc `tests/fixtures/solutions/<name>.py`, nên `"1.3/original"` dùng được), `tests/integration/grading-pipeline.test.ts` (mẫu viết test).
- `src/game/echo-forbidden-terms.test.ts` và `src/game/echo-leaks.ts` sau plan 1.1 (từ cấm cộng dồn, ranh giới chữ Unicode).

## Files
Tạo:
- `src/levels/level-1-3.json`: chép bản nháp GDD mục 14, với hai sửa theo hợp đồng:
  - `"simulation": { "kind": "sorter" }` (thay `"simulation": "sorter"`);
  - `"forbidden_terms": [...]` (đổi tên từ `echo_forbidden_terms`, giữ nguyên danh sách).
  - Giữ đúng `starter_code`, `locked_lines: [2]`, đầu vào `4096` / `"7351"`, `alert_limit_statements: 7`, `location`, `component`, `outro`, `lore_fragment`, `outro_beats` (sự thật của `gdd-mo-dau.md` 6.3 không đổi).
- `tests/fixtures/solutions/1.3/` (văn bản editor đầy đủ, gồm dòng chú thích 1 và dòng khóa 2 `ma_phien = 4096`, giữ bố cục dòng của `starter_code` để số dòng lỗi khớp):
  - `original.py`: đúng `starter_code`.
  - `only-tuple.py`: mọi trường đúng, `khuon_phien = type(ma_phien)`, còn `chieu_cao = 1,72`.
  - `only-string-age.py`: mọi trường đúng, còn `tuoi = "27"`.
  - `two-star.py`: lời giải GDD mục 7 (`khuon_phien = int`).
  - `three-star.py`: như trên, `khuon_phien = type(ma_phien)`.
  - `name-error.py`: `da_tiem = true` trên dòng 8 (dùng ở phase 5 cho timeline lỗi Python).
- `tests/integration/grading-pipeline-1-3.test.ts`.

## Steps
1. Tạo JSON; `npx vitest run src/game/level-registry.test.ts src/game/validate-level.test.ts` (registry nạp mọi file trong `src/levels`).
2. Chạy test từ cấm có sẵn; nếu một câu bị bắt, sửa câu chữ trong JSON (giữ ý, không đổi sự thật truyện) và ghi lại câu đã sửa.
3. Tạo fixture và test tích hợp.
4. `npm test` toàn bộ.

## Tests
`grading-pipeline-1-3.test.ts` (harness thật qua `python3`):
- `original` → `type_mismatch`, 0 sao, `error` không có, `stdout === "<class 'str'>\n"`, `chieu_cao.type === "tuple"`, `ho_ten` đạt (GDD 13 #1).
- `only-tuple` → `type_mismatch_unknown_shape` (#2).
- `only-string-age` → `type_mismatch_value_match` (#3).
- `two-star` → `{ key: "wrong_value_counter", stars: 2 }`, `baseLineCount ≤ 7`, `counterInputs.ma_phien === "7351"` (#5).
- `three-star` → `{ key: "three_stars", stars: 3, counterSurvived: true }`, `baseLineCount ≤ 7` (#6).

`echo-forbidden-terms.test.ts`: không sửa; nó lặp mọi level đã đăng ký nên tự phủ 1.3 (#22) và vẫn chạy 1.4 với mặc định (#23). Chỉ sửa nếu sau 1.1 nó chưa đọc `forbidden_terms` của level hay chưa phủ `outro_beats` (khi đó đó là thiếu sót của 1.1: sửa nhỏ ở đây và ghi lại).

## Validation
```bash
npx vitest run tests/integration/grading-pipeline-1-3.test.ts src/game/echo-forbidden-terms.test.ts src/game/validate-level.test.ts
npm test
```
Kiểm tay nhanh: `npm run dev` (xem `lsof -i :5173` trước), mở `#/level/1.3`, chạy code gốc: terminal đúng năm dòng như GDD mục 6, ECHO câu `type_mismatch`. Mô phỏng lúc này còn là máy quét (phase 5 thay).

## Risks
- Từ cấm `"type"`, `"int"` và đáp án `"27"` khớp nhầm trong câu ECHO: luật ranh giới chữ Unicode không bắt `TypeError`; nếu bắt, sửa luật là việc của 1.1, còn câu chữ thì sửa ở JSON.
- Bố cục dòng của fixture lệch `starter_code` làm dòng lỗi lệch: fixture `name-error` phải có `true` đúng ở dòng 8.

## Rollback
Xóa `level-1-3.json` (1.3 rời luồng, bản đồ hiện "TÍN HIỆU ĐANG GIẢI MÃ"), fixture và test.

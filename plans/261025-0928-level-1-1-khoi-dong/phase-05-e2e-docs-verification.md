---
phase: 5
title: "E2E 1.1, sửa spec luồng truyện, tài liệu, chạy toàn bộ"
status: completed
priority: P1
effort: "3h"
dependencies: [4]
---

# Phase 5: E2E 1.1, sửa spec luồng truyện, tài liệu, chạy toàn bộ

## Goal
Một e2e chơi 1.1 từ cổng tới 3 sao và qua chuyển cảnh; spec luồng truyện của vỏ game phản ánh việc 1.1 nay là level đã dựng đầu tiên; tài liệu nói đúng schema mới; mọi bộ test xanh.

## Context
- GDD 1.1 §11 (lượt chơi), §12 (đoạn sau level). Hợp đồng §7 (mỗi level chơi được từ chuyển cảnh trước tới chuyển cảnh sau; một e2e mỗi level).
- Đọc lại: `tests/e2e/helpers.ts` (`gotoLevel`, `enterMission` chờ `data-armed`, `replaceEditableCode(page, text, fromLine)`, `runAndWait`), `tests/e2e/story-flow.spec.ts`, `src/story/progression.ts` (level đã dựng kế tiếp sau 1.1: hôm nay là 1.4 vì 1.2, 1.3 chưa có).
- Dòng khóa của 1.1 là dòng 3; vùng sửa bắt đầu từ dòng 4. Không dùng `fromLine` mặc định (5) của 1.4.
- `webServer` tự chạy preview ở :4173; cổng đó phải trống. Bộ đầy đủ ~7 phút; chạy spec liên quan trước.

## Files
Tạo:
- `tests/e2e/level-1-1.spec.ts` (một test, chạy trên mọi project mặc định).

Sửa:
- `tests/e2e/helpers.ts`: hằng `L11_FIX_LINE_7`, `L11_SOLUTION_3_STARS` (thân code sau dòng khóa) nếu cần dùng chung; không thêm helper mới nếu `replaceEditableCode` đủ.
- `tests/e2e/story-flow.spec.ts`: kỳ vọng mới vì 1.1 có thật: mở đầu → Esc → `#/level/1.1`; bản đồ: 1.1 "TIẾP THEO", 1.4 khóa "Cần 1 sao ở 1.1" (hoặc chữ thật của `progression`), 1.2 "TÍN HIỆU ĐANG GIẢI MÃ". Test 2 (qua 1.4) giữ nguyên luồng vì vào bằng liên kết. Chỉ sửa assert, không đổi cấu trúc test.
- `CLAUDE.md` mục "Levels are data": thêm `simulation` (`kind`, tùy chọn theo kind), mục tiêu `output_line` + `expected_output`, `forbidden_terms` (cộng dồn); mục Run pipeline bước 4–5: harness so stdout theo dòng (NFC, stderr tách riêng), `sim-vocabulary.ts`, `use-timeline-playback.ts`, `relay-*`. Ngắn, theo giọng hiện có.
- `README.md`: chỉ khi có đoạn liệt kê level hoặc schema; nếu không thì không sửa.
- `docs/nhat-ky-loi-prototype-1-4.md`: chỉ thêm hàng nếu trong lúc làm gặp lỗi có nguyên nhân đáng ghi (ví dụ `unicodedata` trên Pyodide, StrictMode khi tách hook).

## Steps
1. Viết `level-1-1.spec.ts`; chạy chromium, rồi mobile-chromium.
2. Sửa `story-flow.spec.ts`; chạy nó.
3. Tài liệu.
4. Chạy toàn bộ (Validation). Nếu có test cũ đỏ: tìm nguyên nhân, sửa mã; không nới test.

## Tests
- `tests/e2e/level-1-1.spec.ts`, một test đi theo GDD §11:
  1. `__TLC_AUDIO_PROBE__ = []` trước khi tải; `gotoLevel(page, "1.1")` (qua cổng VÀO NHIỆM VỤ, có `location` "Tầng hầm Lô 17 · Trạm chuyển tiếp R-17"); ô Mục tiêu có 3 dòng `dòng 1..3`; `waitForPythonReady`; nút CHẠY có class `is-first-run`.
  2. Chạy code gốc → terminal có `R-17 ĐÃ PHÁT: dòng 1` và `TRUY VẾT: dòng 7 — NameError`; nút CHẠY không còn `is-first-run`; danh sách phát của trạm có ô "CHƯA PHÁT".
  3. Sửa dòng 7 thành `print("PHIEN", ma_phien)` → terminal có `chỉ khác hoa thường`, `nhận: lo17·can·lien·lac`.
  4. Sửa dòng 8 thành chữ hoa → hộp kết quả 3 sao, "Kênh mở hoàn toàn", "Đã thu: Tiêu đề tín hiệu"; terminal kết thúc `KÊNH: MỞ HOÀN TOÀN`; probe có `siren`, `gate_open`, `star`.
  5. TIẾP TỤC → URL `#/story/after-1.1` (không có màn chờ), thấy chữ `outro` của 1.1 → Esc → URL là `#/level/<id>` của level đã dựng kế tiếp (khác `1.1`; hôm nay `1.4`), gate VÀO NHIỆM VỤ hiện.
  - Không thêm e2e cho các nhánh sai (đã có integration) hay cho 375 px riêng (project `mobile-chromium` chạy chính test này).

## Validation
```bash
npx playwright test tests/e2e/level-1-1.spec.ts --project=chromium
npx playwright test tests/e2e/level-1-1.spec.ts tests/e2e/story-flow.spec.ts --project=mobile-chromium
npm run typecheck && npm run build
npm test
npm run test:py && npm run test:py:3.14
npm run test:e2e
```

## Risks
- **Gõ vào editor ở 1.1:** `replaceEditableCode` thay từ một dòng tới hết; dùng `fromLine` 4 với toàn bộ thân sửa (giữ dòng chú thích nếu muốn). Thụt lề tự động khi Enter đã được helper xử lý.
- **Chờ hoạt cảnh phản công** dài hơn 1.4 (3 gói × 2 đợt + còi): `runAndWait` có hạn 30 s, đủ.
- **Đích sau `after-1.1` đổi khi 1.2 được dựng:** assert "khác 1.1 và là `#/level/`" chứ không viết cứng `1.4`.

## Rollback
Xóa `level-1-1.spec.ts`; hoàn tác `story-flow.spec.ts`, `helpers.ts`, tài liệu. Muốn gỡ cả level khỏi luồng: xóa `src/levels/level-1-1.json` (engine dùng chung giữ lại cho 1.2, 1.3).

## Ghi chú triển khai
- E2E: đã viết `level-1-1.spec.ts`, sửa `story-flow.spec.ts`; **chưa chạy** (người dùng chạy khi yêu cầu). Typecheck có phủ `tests/e2e`.
- `story-flow` test 2: sau mở đầu nay vào 1.1, nên test mở 1.4 bằng liên kết; tổng sao `3/6`; TIẾP TỤC ở màn tiêu đề nay vào `#/level/1.1` (1.1 chưa có sao).
- Không thêm dòng vào `docs/nhat-ky-loi-prototype-1-4.md`: không gặp lỗi có nguyên nhân đáng ghi.

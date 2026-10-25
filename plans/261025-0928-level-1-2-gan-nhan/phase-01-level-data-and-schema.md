---
phase: 1
title: "Dữ liệu level và schema"
status: completed
priority: P1
effort: "1,5h"
dependencies: [vỏ game, level 1.1]
---

# Phase 1: Dữ liệu level và schema

## Goal
`src/levels/level-1-2.json` hợp lệ, vào chương 1, qua kiểm chống lộ. Schema có khóa `value_is_label` và nhánh `kiosk` của `simulation` được kiểm. Chưa có logic chấm mới hay UI mới.

## Context
- GDD 1.2 mục 16 (JSON nháp), mục 10 (từ cấm), mục 15 #20–21.
- Hợp đồng mục 1 (`simulation` là object, tùy chọn theo `kind` nằm cạnh `kind`, validator kiểm theo `kind`), mục 2 (`forbidden_terms` cộng dồn, logic ở `echo-leaks.ts`).
- Đọc trước: `src/game/level-types.ts`, `src/game/validate-level.ts` (+ test), `src/game/echo-leaks.ts`, `src/game/echo-forbidden-terms.test.ts`, `src/story/chapter-1.json`, `src/game/level-registry.ts`. Xác nhận plan 1.1 đã thêm `simulation` và `forbidden_terms` thế nào (tên kiểu, hàm kiểm).

## Files
Sở hữu (phase này tạo/sửa):
- Tạo `src/levels/level-1-2.json`: chép nguyên GDD 16. Không đổi chữ.
- Sửa `src/game/level-types.ts`: thêm `"value_is_label"` vào `REACTION_KEYS` (đặt cạnh `wrong_value`). Nếu union `simulation` của 1.1 chưa có nhánh kiosk: `{ kind: "kiosk"; devices: string[] }`.
- Sửa `src/game/validate-level.ts`: nhánh `kind === "kiosk"`: `devices` là mảng chuỗi 1–3 phần tử, không trùng, mỗi phần tử là tên một mục tiêu; số mục tiêu không nằm trong `devices` (ô nhớ) từ 1 đến 6. Lỗi nêu tên trường (`simulation.devices[1] "x" không phải biến mục tiêu`). Bỏ qua bước này nếu 1.1 đã kiểm đúng như vậy.
- Sửa `src/game/validate-level.test.ts`: một ca bảng cho kiosk (xem Tests).

Không sửa: `echo-leaks.ts`, `echo-forbidden-terms.test.ts` (đã lặp qua mọi level và dùng `forbidden_terms` từ 1.1), `chapter-1.json` (đã liệt kê `"1.2"`).

## Steps
1. Đọc lại code thật theo Context; ghi lệch so với hợp đồng (nếu có) vào báo cáo phase.
2. Thêm khóa `value_is_label`; thêm/kiểm nhánh kiosk trong validator.
3. Tạo `level-1-2.json` từ GDD 16.
4. Chạy test chống lộ. Nếu báo lộ: sửa câu trong JSON (giữ ý, đổi chữ) và ghi lại chỗ đổi; không nới luật.
5. Mở `npm run dev` (kiểm `lsof -i :5173` trước, dùng lại server đang chạy nếu có), vào `#/level/1.2`: level hiện, chạy được với mô phỏng mặc định. Bản đồ hiện 1.2 là đã dựng.

## Tests (chỉ cái bảo vệ điều quan trọng)
- `validate-level.test.ts`, một `test.each` trên bản sao 1.2 bị sửa: `devices: []`, `devices: ["the_quet","the_quet"]`, `devices: ["khong_co"]`, mọi mục tiêu đều là thiết bị, `kind: "abc"` → mỗi ca có lỗi chứa `simulation`. (Kiểu sai của `forbidden_terms` thuộc test của 1.1; chỉ thêm ca đó nếu 1.1 chưa có.)
- Chống lộ (GDD #20): không viết test mới, `echo-forbidden-terms.test.ts` tự phủ 1.2.

## Validation
```bash
npx vitest run src/game/validate-level.test.ts src/game/echo-forbidden-terms.test.ts src/game/level-registry.test.ts src/story
npm run typecheck
```

## Risks
- Hàm so ranh giới chữ Unicode của 1.1 có thể bắt `"nháy"` trong một phản ứng: GDD nói đã kiểm, nhưng kiểm lại bằng test thật.
- Thêm khóa vào `REACTION_KEYS` không ảnh hưởng 1.4 (khóa tùy chọn).

## Rollback
Xóa `level-1-2.json`; hoàn tác hai file schema. Level 1.2 trở lại "TÍN HIỆU ĐANG GIẢI MÃ" trên bản đồ.

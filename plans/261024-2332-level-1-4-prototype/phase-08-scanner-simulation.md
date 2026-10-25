---
phase: 8
title: "Mô phỏng máy quét & cổng"
status: completed
priority: P1
effort: "4h"
dependencies: [7]
---

# Phase 8: Mô phỏng máy quét & cổng

## Goal
Cột phải "nhìn thấy" kiểu dữ liệu: gói dữ liệu màu theo kiểu trượt tới máy quét, phình theo độ dài, qua cổng hoặc bị chặn; OMNI phản công có hoạt cảnh riêng. Không được cắt bỏ (contract: rủi ro lớn nhất là mất cảm giác game).

## Quyết định
SVG + Web Animations API trong React (một component). Ít mã hơn Canvas, dễ thêm nhãn chữ cho a11y, scale theo `viewBox` khi resize. Chuyển sang Canvas chỉ khi đo được < 50 fps trên máy của PM.

## Files to Create
- `src/ui/scanner-simulation.tsx`
- `src/ui/scanner-timeline.ts` – hàm thuần `buildTimeline(outcome, level): Step[]` (dễ test).
- `src/ui/scanner-timeline.test.ts`
- `src/ui/type-colors.ts` – ánh xạ kiểu → token màu (dùng chung objectives/terminal).

## Cảnh
Từ trái sang phải: nguồn chip (ô dữ liệu) → làn dẫn → **máy quét** (khung có tia quét ngang) → **cổng** hai cánh → khu sau cổng. Mỗi biến mục tiêu là một gói: hình khối bo góc phát sáng, nhãn tên biến + nhãn kiểu (`str`/`int`/…) + preview giá trị (rút gọn). Bề rộng gói = `clamp(48, 48 + 24·log2(length), 220)` px theo viewBox với chuỗi; `ma_xac_thuc` 201 ký tự phải phình rõ.

## Timeline theo outcome (`buildTimeline`)
- **Đang chạy:** tia quét chạy chậm, đèn "ĐANG XỬ LÝ".
- **Lỗi biên dịch / lỗi chạy / timeout / blocked:** gói không rời nguồn; máy quét nháy đỏ-cam, nhãn "TRUY VẾT: dòng N"; cổng đóng; âm `alarm`.
- **Thiếu biến:** khe gói trống nét đứt "KHÔNG CÓ TÍN HIỆU".
- **Sai kiểu / sai giá trị:** các gói trượt tới máy quét theo thứ tự objective; gói đạt → viền xanh lục mảnh + "HỢP LỆ"; gói trượt → máy quét chuyển đỏ, gói bị đẩy lùi, nhãn "SAI KIỂU: str ≠ int" hoặc "SAI GIÁ TRỊ".
- **Đạt (≥ 1 sao):** các gói đổi màu đúng kiểu (`int` xanh, `float` tím, `bool` đỏ) khi đi qua máy quét → cổng mở **một nửa** (`gate_half`). Vượt ngưỡng cảnh báo: thêm đèn Sentinel nhấp nháy + nhãn "TÍN HIỆU BỊ GHI NHẬN".
- **Phản công** (khi base đạt và có `counterVars`): màn rung nhẹ, banner `counter_attack_banner`, âm `siren`, hiện giá trị chip mới; ba gói mới (màu vàng – chuỗi đầu vào mới) chạy lại:
  - đạt → gói chuyển màu đúng, cổng mở **hoàn toàn**, âm `gate_open` rồi `star`.
  - lỗi (vd. `ValueError`) → gói vỡ tại máy quét, cổng đóng lại về nửa, nhãn lỗi.
  - sai giá trị → gói qua máy quét nhưng bị đánh dấu "LỆCH MẪU", cổng sập về nửa.
- Tổng thời lượng ≤ 4 s (base) + ≤ 4 s (phản công). Có nút "Bỏ qua hoạt cảnh" (phím Esc) → nhảy đến khung cuối. `prefers-reduced-motion`: không trượt/rung, chỉ chuyển trạng thái tức thì + nhãn.
- Chạy mới khi hoạt cảnh chưa xong: không xảy ra vì nút CHẠY khóa ở trạng thái `animating`; khi bỏ qua thì mở khóa ngay.
- Mỗi bước timeline phát sự kiện âm thanh (`onCue("scan_pass" | "alarm" | ...)`) cho phase 9.
- Văn bản trạng thái cuối cùng được đọc qua `aria-live` (một câu tóm tắt).

## Test
`scanner-timeline.test.ts`: outcome code gốc → 3 gói kiểu `str`, gói `ma_xac_thuc` rộng nhất, kết thúc `gate_closed` + cue `alarm`; outcome 6.6 → `gate_half` rồi phản công `gate_half` với lỗi; 6.7 → `gate_open` + cue `star`; timeout → không có bước gói di chuyển.

## Verification
- `npx vitest run src/ui/scanner-timeline.test.ts`
- Thủ công: xem 4 kịch bản (gốc, TypeError, 6.6, 6.7) ở 1280 px và 375 px; bật "Reduce motion" trong OS kiểm lại; DevTools Performance không có frame dài > 50 ms kéo dài.

## Risk
- Animation trôi lệch với state React → timeline là dữ liệu thuần, component chỉ phát lại; trạng thái cuối luôn đặt từ outcome, không phụ thuộc animation hoàn tất.

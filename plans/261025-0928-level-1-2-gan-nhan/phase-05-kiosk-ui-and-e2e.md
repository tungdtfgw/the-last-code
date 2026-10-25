---
phase: 5
title: "Mô phỏng ki-ốt, nối vào màn chơi, e2e"
status: completed
priority: P1
effort: "3h"
dependencies: [4]
---

# Phase 5: Mô phỏng ki-ốt và e2e

## Goal
Level 1.2 hiện ki-ốt (SVG/CSS, phát lại sau khi chạy xong) thay cho máy quét, dùng được ở 360 px và với giảm chuyển động. Một e2e chơi 1.2 từ cổng vào tới 3 sao rồi sang đoạn chuyển cảnh sau nó.

## Context
- GDD 1.2 mục 8 (bố cục: dải BỘ ĐỆM 0xA7 trên, lưới 2×2 ô nhớ có thẻ nhãn giữa, hai màn thiết bị dưới, drone ở góc), mục 14 (lối đi), 15 #23–24.
- Đọc lại: `src/ui/level-simulation.tsx` (điểm chọn mô phỏng của vỏ game), `src/ui/use-timeline-playback.ts` (1.1), `src/ui/scanner-simulation.tsx` (mẫu vẽ, `aria`, `<title>`), quy tắc `.scanner-*` trong `src/styles/global.css`, token màu ở `tokens.css`.
- `tests/e2e/helpers.ts`: `gotoLevel(page, id)`, `waitForPythonReady`, `replaceEditableCode(page, text, fromLine)`, `runAndWait`, `showTab`; mẫu spec `tests/e2e/level-1-4.spec.ts` (bỏ qua khi offline, xử lý tab trên điện thoại).
- Âm thanh: cue chỉ qua `onCue(cue, delayMs)` của hook (đồng hồ AudioContext), không timer JS (`docs/nhat-ky-loi-prototype-1-4.md`).

## Files
Sở hữu:
- Tạo `src/ui/kiosk-simulation.tsx`: props giống `ScannerSimulation` (`level`, `outcome`, `running`, `playing`, `onDone`, `onCue`). Dùng `use-timeline-playback.ts` với `buildKioskTimeline`; lúc chạy dùng `runningKioskScene`, lúc nghỉ `idleKioskScene`.
- Sửa `src/ui/level-simulation.tsx`: nhánh `level.simulation?.kind === "kiosk"` → `KioskSimulation`; chú giải 4 màu kiểu chỉ hiện với máy quét (nếu 1.1 chưa làm).
- Sửa `src/styles/global.css`: khối `.kiosk-*` đặt cạnh `.scanner-*`, chỉ dùng token sẵn có.
- Tạo `tests/e2e/level-1-2.spec.ts`.
- Sửa `tests/e2e/helpers.ts` chỉ khi cần hằng `SOLUTION_1_2_THREE_STAR` dùng chung; nếu không, để hằng trong spec.

## Vẽ (tóm tắt, chi tiết trong GDD 8)
- Một `<svg viewBox>` dọc, co theo ô; cùng viewBox cho điện thoại.
- Thẻ bộ đệm vàng (tông `str`) có nhiễu nhẹ (CSS, tắt khi giảm chuyển động). Lượt phản công: thẻ đổi giá trị, rung theo `shake`.
- Ô nhớ: thẻ nhãn treo phía trên (sáng khi `lit`), giá trị bên trong, cắt `…` sau 14 ký tự, toàn văn trong `<title>`. Viền theo `verdict`: xanh HỢP LỆ, đỏ SAI GIÁ TRỊ/KHÔNG PHẢI CHỮ, xám KHÔNG CÓ Ô, cam LỆCH MẪU. `noise` → lớp nhiễu đỏ.
- Dây: đường từ thẻ bộ đệm `wire` tới ô; có chuyển động "chạy" khi mới nối, tĩnh khi giảm chuyển động.
- Bóng mờ: phần tử theo `ghost.id`, CSS ~1 s bay tới ô `to` hoặc mờ dần khi `to` null; không vẽ khi giảm chuyển động.
- Màn thiết bị: MÁY QUÉT DRONE, CỔNG KHU (nhãn lấy từ `objectives[].label` hoặc tên biến; không viết cứng tên thiết bị trong component). Cổng khu vẽ trạng thái `gate`.
- Drone góc: `patrol` bay ngang (CSS), `hover` dừng trên ki-ốt, `locked` đỏ.
- `data-testid="kiosk"`, mỗi ô `data-slot=<tên>` và `data-verdict=<verdict>` cho e2e; vùng `aria-live="polite"` đọc `summarizeKiosk` khi phát xong.
- Trang không cuộn: khung SVG nằm trong `.col > .panel` có sẵn.

## Steps
1. Đọc lại code theo Context; khớp props với hook thật.
2. Viết `kiosk-simulation.tsx` và CSS; nối nhánh trong `level-simulation.tsx`.
3. Kiểm tay trên `npm run dev` (kiểm `lsof -i :5173`, dùng lại server có sẵn), ghi kết quả vào báo cáo phase:
   - Bốn lần chạy của GDD 14 (code gốc, sửa tên, sửa dấu nháy, đúng thứ tự) và lần gõ tay `"AN-5521"` (phản công `LỆCH MẪU`).
   - 360 px: lưới 2×2 vừa khung, chữ cắt `…`, tab Mô phỏng không làm trang cuộn.
   - `prefers-reduced-motion`: chỉ khung cuối, không bóng, dây tĩnh.
   - Kiểm hiệu ứng bằng xem trực tiếp hoặc e2e, **không** bằng ảnh chụp Claude-in-Chrome giữa chừng (sự kiện chuột bỏ qua phần mở đầu).
4. Viết e2e, chạy trên chromium trước.

## Tests
Một e2e (`tests/e2e/level-1-2.spec.ts`, GDD #24), bỏ qua khi offline như spec 1.4:
1. `gotoLevel(page, "1.2")`, `waitForPythonReady`.
2. Bấm CHẠY với code gốc → terminal có `NameError` và `dòng 13`.
3. `replaceEditableCode(page, SOLUTION_3_STAR, 6)` (dòng khóa là 2–5) → CHẠY → chờ hộp kết quả: 3 sao, "Đã thu: Hồ sơ danh tính". Trên mọi `[data-testid=kiosk] [data-slot]` (tab Mô phỏng trên điện thoại): `data-verdict="ok"`.
4. Bấm TIẾP TỤC → URL `#/story/after-1.2`, thấy chữ `outro` của 1.2.

Không viết test component cho `kiosk-simulation.tsx` (logic nằm ở timeline đã có test).

## Validation
```bash
npm run build
npx playwright test tests/e2e/level-1-2.spec.ts --project=chromium
npx playwright test tests/e2e/level-1-2.spec.ts
npx playwright test tests/e2e/level-1-4.spec.ts --project=chromium
```
`webServer` của Playwright tự dựng preview ở :4173; không để tiến trình nào khác giữ cổng này.

## Risks
- Hook của 1.1 có thể chỉ hỗ trợ một dạng scene: dùng generic hoặc truyền scene như `unknown`, không sao chép logic phát lại.
- Chữ dài (`'ĐỖ MINH AN / K-07'`) trên màn thiết bị ở 360 px: cắt `…`, toàn văn trong `<title>`.
- Mobile e2e: hộp kết quả và tab Mô phỏng; theo đúng cách spec 1.4 làm.

## Rollback
Bỏ nhánh `kiosk` trong `level-simulation.tsx` (1.2 về máy quét mặc định); xóa component, CSS `.kiosk-*`, spec.

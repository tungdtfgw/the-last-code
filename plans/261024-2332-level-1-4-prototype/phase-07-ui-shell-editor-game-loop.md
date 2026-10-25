---
phase: 7
title: "Thiết kế UI, editor khóa dòng, vòng chơi"
status: completed
priority: P1
effort: "7h"
dependencies: [4, 5, 6]
---

# Phase 7: Thiết kế UI, editor khóa dòng, vòng chơi

## Goal
Màn chơi hoàn chỉnh, đẹp, nghiêm túc kiểu cyberpunk: cột trái (briefing, mục tiêu, ECHO, gợi ý), giữa (editor + terminal), phải (mô phỏng – khung chờ phase 8); nối runner + chấm điểm + lưu trữ thành một vòng chơi; màn tải, màn lỗi, màn kết quả.

## Bước 0 – BẮT BUỘC trước khi viết UI
1. Gọi Skill `ak-frontend-design` với brief bên dưới; làm theo hướng dẫn của skill (art direction, tránh "AI slop").
2. Nếu cần chốt bảng màu/typography/khoảng cách, gọi thêm `ak-ui-ux-pro-max`.
3. Kết quả bước thiết kế ghi vào `src/styles/tokens.css` (CSS custom properties) và một comment đầu file mô tả hướng nghệ thuật. Không tạo file docs riêng.

**Brief thiết kế:** terminal xâm nhập năm 2089, tối, nghiêm túc, căng thẳng, **không hài hước, không emoji**. Nền gần đen có nhiễu/scanline rất nhẹ; chữ mono cho code và log; font hiển thị có đủ dấu tiếng Việt (tự host bằng `@fontsource/*`, chọn font hỗ trợ subset `vietnamese`). Màu kiểu dữ liệu là ngôn ngữ hình ảnh cốt lõi và **cố định**: `str` vàng, `int` xanh dương, `float` tím, `bool` đỏ; kiểu khác (`NoneType`, `list`, lớp lạ) xám. Vì `bool` đỏ trùng với đỏ báo động: báo động dùng đỏ-cam/nhấp nháy + biểu tượng + chữ, gói `bool` luôn kèm nhãn `bool`; không truyền thông tin chỉ bằng màu. Độ tương phản chữ ≥ 4.5:1. Tôn trọng `prefers-reduced-motion`.

## Files to Create
- `src/styles/tokens.css`, `src/styles/global.css`
- `src/ui/game-screen.tsx` – bố cục 3 cột.
- `src/ui/briefing-panel.tsx`, `src/ui/objectives-panel.tsx` (mục tiêu + kiểu yêu cầu + thanh cảnh báo dạng vạch, hiện "x/8 lệnh · y%").
- `src/ui/echo-panel.tsx` – chân dung ECHO (SVG/CSS: khuôn mặt hình học dạng wireframe; hiệu ứng glitch: lệch kênh RGB, cắt lát `clip-path`, nhiễu ngắn khi nói), khung thoại gõ chữ dần (bỏ qua khi reduced-motion), `aria-live="polite"`.
- `src/ui/hints-panel.tsx` – nút "Giải mã nhật ký gợi ý (mức n/3)", mở theo thứ tự, hiện lại các mức đã mở; xác nhận trước khi mở (một lần bấm nữa).
- `src/ui/code-editor.tsx` + `src/ui/locked-lines-extension.ts` + `src/ui/locked-lines-extension.test.ts`.
- `src/ui/terminal-panel.tsx` – log trong bối cảnh (GDD 4.2) + stdout của người chơi.
- `src/ui/run-controls.tsx` – nút CHẠY, phím tắt, nút "Khôi phục mã gốc", nút tắt/bật tiếng (nút tiếng nối ở phase 9).
- `src/ui/boot-screen.tsx` (tải Pyodide), `src/ui/fatal-screen.tsx` (lỗi tải/trình duyệt không hỗ trợ/level hỏng), `src/ui/results-dialog.tsx`.
- `src/ui/error-boundary.tsx` – bắt lỗi React không lường, hiện `fatal-screen` có nút tải lại (edge case C8).
- `src/ui/terminal-panel.test.tsx` – xác nhận chuỗi người chơi kiểu `<img onerror>` hiện dạng chữ thô (edge case E10).
- `src/game/game-reducer.ts` + `src/game/game-reducer.test.ts` – máy trạng thái vòng chơi (test: CHẠY khi `booting`/`running`/`animating` bị bỏ qua và không tăng `runs`; chuỗi `running → animating → result`; `history` dùng cho `repeated_fail`).
- `src/game/use-game.ts` – hook nối runner, repository, reducer.
- Sửa `src/app.tsx`, `src/main.tsx`.

## Editor khóa dòng (AC 5)
- CodeMirror 6 + `@codemirror/lang-python`, theme tối riêng theo tokens, số dòng, `indentUnit` 4 khoảng trắng, `keymap` gồm `defaultKeymap`, `historyKeymap`, `indentWithTab`. Ghi chú bàn phím trên giao diện: "Esc rồi Tab để rời editor" (hành vi chuẩn của CodeMirror khi bật indentWithTab).
- `lockedLinesField` (StateField): lưu vị trí đầu các dòng khóa dạng `RangeSet`, ánh xạ qua `tr.changes` mỗi transaction.
- `EditorState.transactionFilter`: với transaction có `docChanged` và **không** mang annotation `allowLockedEdit`: tính tài liệu mới, ánh xạ vị trí dòng khóa; nếu một dòng khóa không còn bắt đầu ở đầu dòng hoặc nội dung dòng khác văn bản gốc → **bỏ toàn bộ transaction** (trả `[]`) và phát effect `lockedEditBlocked`. Cách này chặn đồng nhất: gõ, xóa, Backspace ở đầu dòng 5 (nối vào dòng 4), Delete ở cuối dòng 1 (kéo dòng 2 lên), dán đè vùng chọn, cắt, chọn tất cả + xóa, kéo-thả, undo/redo, IME.
- Khi bị chặn: viền dòng khóa nháy, âm "blip từ chối" (phase 9), thông báo `aria-live`: "Dòng dữ liệu chip bị khóa."
- Dòng khóa có nền khác + biểu tượng khóa ở gutter + `aria-readonly` mô tả.
- "Khôi phục mã gốc" dispatch với annotation `allowLockedEdit` và xác nhận trước.
- Lấy số dòng khóa hiện tại (`getLockedLineNumbers(state)`) để gửi `prepareSource`.
- Test (`@vitest-environment jsdom`, dùng `EditorState` thuần, không cần render): chèn ký tự trong dòng 3 → bị chặn; Backspace tại đầu dòng 5 → bị chặn; xóa từ dòng 1 đến dòng 12 → bị chặn; sửa dòng 7 → được; chèn dòng mới trên dòng 2 (ở cuối dòng 1, nhấn Enter) → được và dòng khóa dịch thành 3–5, `getLockedLineNumbers` trả [3,4,5]; undo sau đó khôi phục; reset có annotation → được.

## Khôi phục code nháp
Lúc vào level: nếu `draft` có và chứa đúng các dòng khóa như một khối liên tiếp (so khớp văn bản, lấy vị trí đầu tiên) → nạp draft với vị trí khóa đó; nếu không → dùng starter, ECHO/terminal báo "Bản nháp hỏng, đã khôi phục mã gốc". Draft rỗng hoặc chỉ khoảng trắng vẫn hợp lệ nếu còn khối khóa.

## Vòng chơi (`game-reducer`)
Trạng thái: `booting | ready | running | animating | result | fatal`; dữ liệu: `code`, `outcome`, `history` (key các lần chạy), `progress`, `echoLine`, `hintsOpened`, `runnerStatus`.
1. Khởi động: nạp level (lỗi → fatal "DỮ LIỆU LEVEL HỎNG"), repository, settings; `runner.init()`; hiện boot screen có tiến trình theo `progress.stage` và dòng chữ bối cảnh ("Đang đánh thức lõi Python…"). Editor vẫn sửa được trong lúc tải; nút CHẠY khóa, nhãn "LÕI ĐANG KHỞI ĐỘNG".
2. Bấm CHẠY / `Ctrl+Enter` / `Cmd+Enter`: nếu không `ready` hoặc đang `running`/`animating` → bỏ qua (không đếm lượt). Ngược lại: `runs += 1` (lưu ngay), chụp code, `prepareSource`, `runner.run`.
3. Có kết quả → `classifyRun` → `selectReaction` → phase 8 phát hoạt cảnh → sau hoạt cảnh: cập nhật terminal, ECHO, thanh cảnh báo; `bestStars` lưu; nếu `stars ≥ 1` mở `results-dialog`.
4. Terminal (GDD 4.2), ví dụ lỗi: 
   ```
   > SENTINEL ĐÃ PHÁT HIỆN XÂM NHẬP
   > TRUY VẾT: dòng 7 — TypeError: unsupported operand type(s) for +: 'int' and 'str'
   > MỨC CẢNH BÁO: 15%
   ```
   Sai kiểu: `> MÁY QUÉT TỪ CHỐI: ma_xac_thuc — str (201 ký tự), yêu cầu int`. Phản công: `> CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP` + `> tuoi = "31.0"   cap_do = "7"   chieu_cao = "1.65"`. Timeout: `> TIẾN TRÌNH BỊ CẮT: quá thời gian`. Stdout người chơi trong khối "ĐẦU RA" riêng, có ghi "[đã cắt bớt]" khi bị cắt; văn bản hiển thị bằng text node (không `innerHTML`). Bấm vào số dòng trong truy vết → con trỏ editor nhảy đến dòng đó.
5. `results-dialog` (focus trap, Esc đóng, trả focus về nút CHẠY): sao lần này và sao cao nhất (biểu tượng SVG, không emoji), tiêu chí đạt/trượt từng sao, **số lần chạy, số câu lệnh, mức cảnh báo, số gợi ý đã mở** (AC 11), đoạn truyện outro + `lore_fragment` khi `stars ≥ 1`. **Không** hiện số liệu cộng đồng. Nút "Tối ưu tiếp" (đóng).
6. Gợi ý: mở mức n → `hintsOpened = n`, lưu; ECHO nói nội dung gợi ý.
7. ECHO nói `entry` khi vào level lần đầu trong phiên.
8. Nhãn "CHẾ ĐỘ KHÔNG LƯU" khi `repository.persistent === false`.

## Bố cục & responsive
- ≥ 1200 px: 3 cột (≈ 28% / 44% / 28%). 768–1199 px: 2 cột (trái+mô phỏng xếp chồng bên phải editor hoặc mô phỏng ở trên editor). < 768 px: 1 cột với thanh tab "NHIỆM VỤ / MÃ / MÔ PHỎNG"; sau khi bấm CHẠY tự chuyển sang tab MÔ PHỎNG rồi quay lại khi xong. Không cuộn ngang ở 360 px. Editor font ≥ 14 px.
- Resize: dùng CSS grid + `ResizeObserver` cho canvas/SVG mô phỏng (phase 8); không tính layout bằng JS trừ mô phỏng.

## Bàn phím & a11y
Thứ tự tab hợp lý; mọi nút là `<button>`; focus ring rõ trên nền tối; phím tắt hiển thị trên nút (`Ctrl/⌘ + Enter`); dialog có `role="dialog"` `aria-modal`; vùng kết quả `aria-live`; thanh cảnh báo có `role="meter"`.

## Verification
- `npx vitest run src/ui src/game`
- `npm run typecheck && npm run build`
- Thủ công `npm run dev`: chơi code gốc → 6.6 → 6.7; thử chặn dòng khóa bằng gõ/dán/kéo/chọn tất cả/undo; thu nhỏ cửa sổ 360/768/1280 px; chỉ dùng bàn phím đi hết một lượt.

## Risk
- `transactionFilter` trả `[]` cũng chặn transaction không phải của người dùng (vd. lint) → chỉ áp khi `docChanged`; reset dùng annotation.
- Hiệu ứng glitch nặng → dùng CSS transform/opacity, tắt khi reduced-motion.

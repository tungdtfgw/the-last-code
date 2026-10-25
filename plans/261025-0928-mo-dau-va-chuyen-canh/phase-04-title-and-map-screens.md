---
phase: 4
title: "Màn tiêu đề và Bản đồ Vùng Tối"
status: completed
priority: P1
effort: "5h"
dependencies: [2, 3]
---

# Phase 4: Màn tiêu đề và Bản đồ Vùng Tối

## Goal
Hai màn trình bày thuần (nhận dữ liệu và callback qua props, không tự đọc repository, không tự điều hướng): màn tiêu đề và Bản đồ Vùng Tối. Chưa gắn vào `App`.

## Context
- GDD mục 2 (màn tiêu đề), 5.5 (bản đồ), 7 (bộ nhớ bị chặn, điện thoại, bàn phím).
- Dùng lại từ phase 2: `nodeStates`, `chapterTotals`, `isReturning`. Từ phase 3: `CityMatrix`, `NeuralIdBar`.
- Bố cục: trang không cuộn, từng ô tự cuộn, tiêu đề ô dính (`.col > .panel` trong `global.css`, GDD 4.7).
- **Bước 0:** tiếp tục hướng thiết kế đã chốt ở phase 3 (`ak:frontend-design` nếu cần thêm quyết định cho bản đồ SVG).

## Files
Tạo:
- `src/ui/title-screen.tsx`: props `{ returning: boolean; persistent: boolean; muted: boolean; onStart(): void; onContinue(): void; onMap(): void; onToggleMute(): void }`.
  - Nền `CityMatrix` toàn màn + scanline nhẹ.
  - Dòng nhỏ `THE LAST CODE`; tiêu đề `<h1>` **MÃ CUỐI CÙNG** với lớp nhiễu ký tự chạy một lần mỗi 6–8 s (timer ngẫu nhiên trong khoảng, tắt khi giảm chuyển động); câu *Khi máy làm thay tất cả, tự viết mã là vũ khí cuối cùng.*
  - `returning === false` → nút **BẮT ĐẦU** (`autoFocus`); `true` → **TIẾP TỤC** (`autoFocus`) + nút phụ **BẢN ĐỒ VÙNG TỐI**.
  - Góc dưới: nút tắt/bật tiếng (cùng nhãn và `aria-pressed` như `run-controls.tsx`, để e2e cũ tìm được bằng `/TẮT TIẾNG|BẬT TIẾNG/`); dòng "Tiến độ lưu trên trình duyệt này." hoặc cờ **CHẾ ĐỘ KHÔNG LƯU** (class `storage-flag` có sẵn).
  - Không phát âm thanh; việc mở khóa và phát `pulse` do `App` làm trong `onStart`/`onContinue` (phase 5).
- `src/ui/chapter-map.tsx`: props `{ nodes: NodeState[]; levels: Map<string, LevelDefinition>; totals; seenStories: { id; label }[]; lore: { levelId; text }[]; persistent; onPlay(levelId); onReplay(storyId); onTitle() }`.
  - Desktop/tablet: SVG đường mòn từ **Lô 17** (dưới) lên **Cổng Kiểm Soát** (trên), 7 nút theo thứ tự. Mỗi nút là `<button>` chứa mã, tên level, `location`, hàng sao (`StarRow`).
  - Trạng thái: `cleared` sáng + sao cao nhất; `open` nhịp sáng + nhãn "TIẾP THEO" khi `next`; `locked` mờ, `aria-disabled="true"`, nhãn "Cần 1 sao ở <requires>", bấm không làm gì; `unbuilt` nhiễu ký tự, nhãn "TÍN HIỆU ĐANG GIẢI MÃ", `aria-disabled`, `aria-label` có "chưa dựng"; `broken` nhãn "TÍN HIỆU HỎNG", `aria-disabled`.
  - Cột bên: `NeuralIdBar` (tên các thành phần đã thu), tổng sao "x/y", **Nhật ký Kiến Trúc Sư** (mỗi `lore_fragment` của level đã có sao, nhãn KTS tô sáng như khung lore), **Đoạn truyện** (đoạn đã xem theo thứ tự chương: "Mở đầu", "Sau <id>", "Còn tiếp"; mỗi mục là nút xem lại), nút về màn tiêu đề, cờ CHẾ ĐỘ KHÔNG LƯU khi `!persistent`.
  - Dưới 768 px: bản đồ thành danh sách dọc (cùng các `<button>`) tự cuộn trong ô; cột bên thành ô cuộn riêng hoặc tab. Trang không cuộn.
  - Focus khi mở: nút "TIẾP THEO" nếu có, ngược lại nút đầu tiên dùng được.
- `src/ui/story-labels.ts`: `storyLabel(id)` → "Mở đầu" / "Sau <id>" / "Còn tiếp" (dùng chung cho bản đồ và tiêu đề trang đoạn truyện).

Sửa:
- `src/styles/global.css`: mục Title và Map (dùng token có sẵn; trạng thái nút không chỉ phân biệt bằng màu: luôn kèm nhãn chữ).

## Steps
1. `title-screen.tsx` + CSS.
2. `chapter-map.tsx` (SVG desktop, danh sách mobile) + CSS.
3. Không dựng trang xem thử tạm. Hình được kiểm ở phase 5 khi đã có route (e2e và kiểm tay); phase này chỉ cần typecheck.

## Tests
Không thêm unit test riêng: hai màn chỉ trình bày dữ liệu do `progression.ts` tính (đã có test ở phase 2). Hành vi được phủ bởi e2e `story-flow` ở phase 5 (BẮT ĐẦU/TIẾP TỤC, trạng thái nút 1.4, nhật ký KTS-03, danh sách đoạn truyện).

## Validation
```bash
npm run typecheck
```

## Risks
- SVG bản đồ với nút HTML: dùng `<foreignObject>` dễ lỗi trên Safari. Cách an toàn: SVG chỉ vẽ đường mòn và chấm, các `<button>` định vị tuyệt đối bằng CSS theo cùng hệ tọa độ phần trăm.
- Kiểm `aria-disabled` thay vì `disabled` để nút khóa vẫn được đọc và focus được (giống bài học nút CHẠY trong nhật ký lỗi).

## Rollback
Xóa ba file mới và mục CSS.

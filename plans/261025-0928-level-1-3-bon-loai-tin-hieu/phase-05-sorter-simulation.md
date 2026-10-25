---
phase: 5
title: "Máy phân loại bốn làn"
status: completed
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 5: Máy phân loại bốn làn (`simulation.kind = "sorter"`)

## Goal
Ô mô phỏng của 1.3 là máy phân loại của Ga Ngầm Số 3: gói đi vào làn của **hình dạng thật**, gói sai rơi thùng giữ lại, con dấu khuôn khớp hay lệch thẻ mã phiên, rào sân ga đóng/mở nửa/mở hẳn. Chạy sau khi có kết quả, bỏ qua được, tôn trọng giảm chuyển động, vừa 360 px.

## Context
- GDD 1.3 mục 5 (bố cục, bảng đường đi của gói, phản công, âm thanh, điện thoại, câu tóm tắt), 12 bước 3–9, 13 #29 #30.
- Hợp đồng mục 1: mỗi mô phỏng mới chỉ viết timeline thuần (có test) và phần vẽ; phát lại qua `src/ui/use-timeline-playback.ts` (plan 1.1).
- Đọc lại: `src/ui/scanner-timeline.ts` (mẫu `Frame`, `scene()`, `failureLabel`, `errorStatus`, `summarize`), `src/ui/scanner-simulation.tsx` (sau 1.1: chỉ còn phần vẽ), `src/ui/relay-simulation.tsx` của 1.1 nếu có (mẫu dùng hook), `src/ui/level-simulation.tsx` (điểm chọn mô phỏng), `src/game/terminal-lines.ts` (`gateFor`), `src/ui/type-colors.ts`, `src/game/python-literal.ts`, `src/styles/global.css` (lớp của máy quét để học cách đặt CSS).
- Nhật ký lỗi mục 4: cue có trễ phải qua `play(cue, delayMs)` trên đồng hồ audio; hook của 1.1 đã lo việc này.

## Files
Tạo:
- `src/ui/sorter-timeline.ts` (thuần, không import React):
  - `Lane = "str" | "int" | "float" | "bool"`; `ParcelStage = "belt" | "scan" | "lane" | "slot" | "bin" | "stamp" | "empty"`.
  - `Parcel { name; tone: TypeTone; typeLabel; lane: Lane | null; stage; kind: "parcel" | "stamp"; verdict?; preview }`.
  - `SorterScene { wave; parcels; slots: Record<Lane, string[]> (tên biến được đòi ở làn đó, từ objectives); sessionTone: TypeTone (từ pyTypeOf của mã phiên lượt đó); sessionLabel (formatPyLiteral); stampSlot: { tone } | null; scanner: "idle" | "scanning" | "pass" | "reject" | "alarm"; gate: GateState; status; banner }`.
  - `SorterFrame { scene; hold; cues }` (cùng hình như `Frame` của máy quét để hook dùng chung).
  - `idleSorterScene(level)`, `runningSorterScene(level)`, `buildSorterTimeline(outcome, level): SorterFrame[]`, `summarizeSorter(frames)` → "Máy phân loại: k/n trường vào đúng làn. Rào …".
  - Luật đường đi theo bảng GDD mục 5:
    - đúng hình dạng và giá trị → `slot`, "HỢP LỆ", `scan_pass`;
    - đúng hình dạng, sai giá trị → `slot`, "LỆCH MẪU", `scan_reject`;
    - sai hình dạng thuộc bốn làn → `lane` của hình dạng thật rồi `bin`, "SAI LÀN: <thật> ≠ <đòi>", `scan_reject`;
    - hình dạng ngoài bốn làn (`tuple`, `NoneType`…) → xám, `bin`, "KHÔNG RÕ HÌNH DẠNG", `scan_reject`;
    - mục tiêu `type` có giá trị là kiểu → `kind: "stamp"`, tông theo kiểu nó mang (đọc từ `preview` `<class 'x'>`; ngoài bốn kiểu → `other`), lên khe khuôn; khớp `sessionTone` và đạt → "KHỚP KHUÔN", không → "LỆCH KHUÔN";
    - mục tiêu `type` có giá trị không phải kiểu → như gói thường sai làn ("SAI LÀN: int ≠ type");
    - biến không có → `empty`, "KHÔNG CÓ TÍN HIỆU";
    - lỗi Python/quá thời gian/engine → gói không rời `belt`, `scanner: "alarm"`, status theo `errorStatus` của máy quét ("TRUY VẾT: dòng n"), cue `alarm`.
  - Kết lượt cơ bản: sai → `alarm`; Sentinel bắt → `alarm`, rào đóng; đạt → rào `half`, `gate_open`.
  - Phản công (khi có `counterVars`): banner, thẻ mã phiên đổi tông theo đầu vào phản công, cue `siren`; gói chạy lại nhanh (hold 300 ms), con dấu chạy cuối và giữ lâu hơn; kết: sống sót → `gateFor(outcome)`, `gate_open` (+ `star` khi mở hẳn); không → rào về nửa, `alarm`; treo/sụp ở phản công → như máy quét (giữ nửa).
  - Dùng lại `gateFor`, `toneOf`, `formatPyLiteral`, `pyTypeOf`; nếu `errorStatus`/`failureLabel` của máy quét dùng được nguyên, export và import thay vì chép.
- `src/ui/sorter-timeline.test.ts`.
- `src/ui/sorter-simulation.tsx`: SVG `viewBox 0 0 420 470`:
  - dải trên: thẻ `ma_phien` tô `sessionTone` + khe "KHUÔN";
  - cột trái: băng chuyền xếp gói theo thứ tự mục tiêu (trước khi chạy: khối xám mang tên biến);
  - giữa: cổng quét, nháy đỏ khi `alarm`;
  - phải: bốn làn dọc vàng/xanh dương/tím/đỏ (luôn đủ bốn), khe cuối làn mang tên biến được đòi;
  - đáy: thùng giữ lại có vạch cảnh báo chéo; mép phải: rào sân ga theo `GateState`;
  - con dấu là lục giác viền theo tông kiểu nó mang;
  - phát lại bằng `use-timeline-playback.ts` (bỏ qua bằng nút và `Esc`, giảm chuyển động hiện khung cuối, `onCue`/`onDone`); câu `summarizeSorter` trong vùng `aria-live`/`sr-only` như máy quét;
  - chữ nhãn ≥ 16 đơn vị khung, nhãn dài cắt "…", khung co theo bề rộng ô.
- CSS: thêm khối `.sorter …` trong `src/styles/global.css` (cạnh khối máy quét), dùng token màu có sẵn và `--type-shape`; chuyển động bằng `transform`/`transition`, tắt dưới `prefers-reduced-motion`.

Sửa:
- `src/ui/level-simulation.tsx`: nhánh `kind === "sorter"` → `SorterSimulation`. Chú giải bốn màu (nếu ô có) vẫn hiện, vì bốn làn chính là chú giải; không thêm ô `type`.

## Steps
1. Viết `sorter-timeline.ts` + test (dùng fixture phase 4), cho xanh trước khi vẽ.
2. Viết `sorter-simulation.tsx` và CSS; nối vào `LevelSimulation`.
3. Kiểm tay trên `npm run dev`: chạy code gốc, lời giải 2 sao, 3 sao; bật giảm chuyển động (DevTools → Rendering → `prefers-reduced-motion`); khung 360 px. Kiểm âm thanh bằng tai hoặc `__TLC_AUDIO_PROBE__`, không bằng ảnh chụp giữa hoạt cảnh (ảnh chụp Claude-in-Chrome gửi sự kiện chuột, có thể bỏ qua hoạt cảnh).

## Tests
`sorter-timeline.test.ts`, 4 ca theo GDD 13 #29, đầu vào là kết quả thật qua `gradeFixture(level13, "1.3/…")`:
1. `original`: khung cuối `chieu_cao` là gói xám ở `bin` với "KHÔNG RÕ HÌNH DẠNG"; `tuoi` có `lane: "str"`, `stage: "bin"`, "SAI LÀN: str ≠ int"; `ho_ten` ở `slot` "HỢP LỆ"; rào `closed`; cue cuối `alarm`.
2. Con dấu khuôn: `two-star` → lượt phản công có `siren`, thẻ đổi sang tông `str`, con dấu tông `int` "LỆCH KHUÔN", kết rào `half`, `alarm`; `three-star` → con dấu tông `str` "KHỚP KHUÔN", rào `open`, cue cuối có `star`.
3. Biến thiếu: nguồn nội tuyến qua `runHarness` (xóa dòng `khuon_phien`) → gói `empty` "KHÔNG CÓ TÍN HIỆU".
4. Lỗi Python: `name-error` → mọi gói còn ở `belt`, status "TRUY VẾT: dòng 8", cue `alarm`.

Không test component (vẽ được kiểm tay), không snapshot SVG.

## Validation
```bash
npx vitest run src/ui/sorter-timeline.test.ts src/ui/scanner-timeline.test.ts
npm run typecheck
npm test
npm run build
```

## Risks
- Hook phát lại của 1.1 gắn chặt kiểu `Frame` của máy quét: làm nó generic (`<F extends { hold: number; cues: Cue[] }>`) là một thay đổi nhỏ ở đây; ghi lại.
- Năm gói + bốn làn + dải trên trong 470 đơn vị chật: ưu tiên chữ ≥ 16 đơn vị, rút ngắn nhãn trước khi thu nhỏ chữ.
- StrictMode chạy effect hai lần: hook dùng chung đã xử lý; không phát cue trực tiếp trong component.

## Rollback
Xóa nhánh `sorter` trong `LevelSimulation` (1.3 quay về máy quét), xóa hai file `sorter-*` và khối CSS.

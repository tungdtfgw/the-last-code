---
phase: 4
title: "Timeline ki-ốt (thuần)"
status: completed
priority: P1
effort: "2,5h"
dependencies: [3]
---

# Phase 4: Timeline ki-ốt

## Goal
`buildKioskTimeline(outcome, level): KioskFrame[]` mô tả toàn bộ phần phát lại của GDD 1.2 mục 8 dưới dạng dữ liệu thuần, có test. Chưa vẽ.

## Context
- GDD 1.2 mục 8 (bố cục, 6 bước phát lại, thiếu lịch sử, giảm chuyển động), 14 (lối đi từng lần chạy).
- Mẫu: `src/ui/scanner-timeline.ts` (`Frame { scene; hold; cues }`, `errorStatus`, `summarize`, `gateFor` từ `terminal-lines.ts`). Đọc lại dạng `Frame` mà hook `use-timeline-playback.ts` của 1.1 chờ; khung ki-ốt phải theo đúng dạng đó (thường là `{ scene, hold, cues }`).
- `RunOutcome.history/counterHistory` từ phase 3; `VarHistoryEntry.src`.

## Files
Sở hữu:
- Tạo `src/ui/kiosk-timeline.ts`.
- Tạo `src/ui/kiosk-timeline.test.ts`.
- Sửa `src/ui/scanner-timeline.ts` chỉ để `export` `errorStatus` (nếu 1.1 chưa chuyển nó sang module chung). Không đổi hành vi.

## Thiết kế
```ts
interface BufferCard { name: string; value: string }            // giá trị đầu vào, dạng Python ("ĐỖ MINH AN" có nháy)
type SlotVerdict = "ok" | "wrong" | "missing" | "type" | "mismatch";
interface Slot { name: string; label: string; device: boolean; value: string | null; lit: boolean; wire: string | null; noise: boolean; verdict?: SlotVerdict }
interface Ghost { id: number; value: string; from: string; to: string | null }   // to = ô đang giữ cùng preview, null = tan
type Drone = "patrol" | "hover" | "locked";
interface KioskScene { wave: "base" | "counter"; buffer: BufferCard[]; slots: Slot[]; ghosts: Ghost[]; drone: Drone; gate: GateState; status: string; banner: string | null; shake: boolean }
```
- `slots` theo thứ tự `objectives`; `device = devices.includes(var)`. Phần vẽ tách ô nhớ và thiết bị theo cờ này.
- `idleKioskScene(level)`, `runningKioskScene(level)`: bộ đệm của `tests[0]`, mọi ô trống, `status` "CHỜ TÍN HIỆU" / "ĐANG XỬ LÝ".
- **Nhịp lịch sử** (`hold` 350, cue `terminal_line`): mỗi mục đặt `value = preview`, `lit = true` (chỉ ô vừa ghi), `wire = src` (thiết bị luôn `null`). Nếu ô đã có giá trị khác → thêm `Ghost { value: cũ, from: ô, to: ô khác có value === cũ ?? null }`. Bóng ở lại trong các khung kế tiếp tới khi tổng `hold` từ lúc sinh ≥ 1000 ms. Mục `type: null` (đã `del`) → ô trống.
- **Lỗi biên dịch:** khung đầu rồi khung `status = "TRUY VẾT: dòng N"`, cue `alarm`; không ô nào sáng.
- **Runner timeout/engine_error, không có dữ liệu:** như máy quét (`errorStatus`), ô trống.
- **Lỗi chạy hoặc dừng (`stopStatus`) giữa chừng:** phát lịch sử, rồi khung cuối: ô đích `noise = true`, `status = errorStatus(outcome)`, cue `alarm`. Ô đích = tên bên trái `=` trên dòng traceback cuối (`/^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?=(?!=)/`), chỉ khi tên đó là một ô; không khớp thì không ô nào nhiễu.
- **Không có lịch sử** (`history` undefined): mỗi biến trong `outcome.vars` có mặt thành một nhịp theo thứ tự mục tiêu, không dây, không bóng.
- **Lịch sử bị cắt:** sau mục 40, một khung đặt mọi ô theo `outcome.vars` (giá trị cuối), `status` "LỊCH SỬ BỊ CẮT".
- **Đối chiếu** (khi đã chạy hết): mỗi ô một khung `hold` 300, `verdict` theo `outcome.vars` (`ok` "HỢP LỆ", `wrong` "SAI GIÁ TRỊ", `missing` "KHÔNG CÓ Ô", `type` "KHÔNG PHẢI CHỮ"), cue `scan_pass`/`scan_reject`; có ô sai → khung `alarm`, dừng.
- **Drone:** `alertPercent > 40` → `hover`; `sentinelCaught` → `locked`, khung `alarm`, dừng (không phản công); còn lại `patrol`.
- **Qua cơ bản:** `gate: "half"`, cue `gate_open`.
- **Phản công** (`counterVars` có): khung `banner = level.counter_attack_banner`, bộ đệm đổi sang `counterInputs`, ô xóa trắng, `shake`, cue `siren`, `hold` 1200; phát `counterHistory` nhanh (`hold` 150, không cue); `counterAborted` → `status` "CỔNG SẬP VỀ NỬA · TIẾN TRÌNH BỊ CẮT"; lỗi ở lượt phản công → ô đích nhiễu như trên; ô `!valueOk` → `verdict: "mismatch"` "LỆCH MẪU"; qua hết → `gate: "open"`, cue `gate_open` + `star`; trượt → `gate: "half"`, `status` "CỔNG SẬP VỀ NỬA · LỆCH MẪU", cue `alarm`.
- `summarizeKiosk(frames)`: một câu, ví dụ "Ki-ốt: 6/6 ô hợp lệ. Cổng mở một nửa."
- Giảm chuyển động do hook xử lý (chỉ khung cuối); khung cuối phải tự đủ nghĩa: có `verdict`, `wire`, không có bóng.

## Steps
1. Viết test (dưới đây) với `RunOutcome` dựng bằng một helper nhỏ trong file test (lịch sử lấy đúng từ khẳng định của phase 3, không gọi Python).
2. Cài `kiosk-timeline.ts`.

## Tests (`kiosk-timeline.test.ts`, 4 ca, #22)
1. **Thứ tự và bóng mờ:** lịch sử sai thứ tự (`fix-quote`): sau nhịp `ma_khu` dòng 17, bóng `'K-12'` có `to: null` (không ô nào giữ K-12); màn `the_cong` vẫn `'AN-5521 / K-12'` khi `ma_khu` là `'K-07'`; `khu_cu` có `wire: "goi_4"`. Lịch sử đúng thứ tự: bóng `'K-12'` có `to: "khu_cu"`. `so_hieu = "AN-5521"` gõ tay → `wire: null`.
2. **Lỗi giữa chừng và lỗi biên dịch:** lịch sử 3 mục + `NameError` dòng 13 với dòng traceback `the_quet = ho_ten + " / " + Ma_khu` → khung cuối: 3 ô có giá trị, `the_quet.noise`, `status` "TRUY VẾT: dòng 13", không khung đối chiếu. Lỗi biên dịch → không ô nào có `value`.
3. **Thiếu hoặc cắt lịch sử:** `history` undefined → các ô nhận giá trị cuối theo thứ tự mục tiêu, mọi `wire` null; 40 mục + cờ cắt → khung "LỊCH SỬ BỊ CẮT" mang giá trị cuối.
4. **Phản công mồi:** `wrong_value_counter` với `so_hieu` sai → `so_hieu.verdict: "mismatch"`, `gate: "half"`, cue cuối `alarm`, bộ đệm là hồ sơ LÊ VĂN TỊNH; `three_stars` → `gate: "open"`, cue cuối có `star`.

## Validation
```bash
npx vitest run src/ui/kiosk-timeline.test.ts src/ui/scanner-timeline.test.ts
npm run typecheck
```

## Risks
- Dạng `Frame` của hook 1.1 khác giả định: chỉnh kiểu, giữ nguyên logic khung.
- Bóng so theo preview: hai ô cùng giá trị gõ tay vẫn "bay về" nhau. Đúng ý GDD 8.2 (ô khác giữ đúng giá trị đó).

## Rollback
Xóa hai file mới; hoàn tác `export` trong `scanner-timeline.ts`.

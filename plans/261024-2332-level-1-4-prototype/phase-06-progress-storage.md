---
phase: 6
title: "Module lưu trữ tiến độ"
status: completed
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 6: Module lưu trữ tiến độ

## Goal
Một module duy nhất lưu/đọc tiến độ và cài đặt, có interface async để sau này thay bằng Supabase, chịu được `localStorage` bị chặn, hỏng, đầy hoặc schema cũ (AC 10).

## Files to Create
- `src/storage/progress-repository.ts` – interface + type.
- `src/storage/local-storage-repository.ts` – bản `localStorage`.
- `src/storage/memory-repository.ts` – bản bộ nhớ (fallback, và dùng trong test).
- `src/storage/create-repository.ts` – chọn bản phù hợp lúc khởi động.
- `src/storage/progress-store.test.ts`.

## Interface
```ts
interface LevelProgress { draft: string | null; bestStars: 0|1|2|3; runs: number; hintsOpened: 0|1|2|3; updatedAt: string /* ISO */; }
interface Settings { muted: boolean; }
interface ProgressRepository {
  readonly persistent: boolean;                    // false = chế độ không lưu
  getLevel(levelId: string): Promise<LevelProgress>;            // không có → mặc định
  updateLevel(levelId: string, patch: Partial<LevelProgress>): Promise<LevelProgress>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
}
```
Quy tắc gộp nằm trong `updateLevel` (dùng chung cho mọi bản cài đặt, hàm thuần `mergeLevelProgress`): `bestStars = max(cũ, mới)`, `hintsOpened = max(cũ, mới)`, `runs` chỉ tăng (không giảm), `updatedAt` = thời điểm ghi. Đây cũng là quy tắc "giữ số sao cao hơn" khi gộp với Supabase sau này.

## Lưu trữ
- Key: `the-last-code:progress:v1` → `{ schemaVersion: 1, levels: { "1.4": LevelProgress } }`; `the-last-code:settings:v1` → `{ schemaVersion: 1, muted }`.
- Đọc: `JSON.parse` trong try; sai cấu trúc từng trường → thay trường đó bằng mặc định và kẹp giá trị (`bestStars` ngoài 0–3 → 0, `runs` âm/không phải số nguyên → 0, `draft` không phải chuỗi hoặc > 50 000 ký tự → null). JSON hỏng hoàn toàn → dùng mặc định, ghi đè ở lần lưu sau, `console.warn` một lần.
- `schemaVersion` khác 1: có bảng `migrations: Record<number, (old) => V1>` (hiện rỗng) → không có migration → bỏ dữ liệu cũ, dùng mặc định. Không đọc key có version khác.
- Ghi: `setItem` trong try. `QuotaExceededError`/`SecurityError` → chuyển sang giữ trong bộ nhớ cho phần còn lại của phiên, đặt `persistent=false`, phát sự kiện để UI hiện nhãn nhỏ "KHÔNG LƯU ĐƯỢC TIẾN ĐỘ".
- `createRepository()`: thử `window.localStorage` + ghi/xóa key thăm dò trong try. Ném (Safari private cũ, cookie bị chặn, iframe sandbox) → `MemoryRepository` với `persistent=false`.
- Nhiều tab: không đồng bộ, ghi sau thắng (ghi chú, không xử lý thêm).
- Code nháp: UI gọi `updateLevel({draft})` qua debounce 500 ms và khi `visibilitychange`→hidden / `pagehide`.

## Ràng buộc
Ngoài thư mục `src/storage/`, **không file nào** được gọi `localStorage` trực tiếp. Thêm test tĩnh: `grep -rn "localStorage" src --include=*.ts --include=*.tsx | grep -v "^src/storage/"` phải rỗng (đặt thành bước kiểm trong Verification và trong `progress-store.test.ts` bằng cách đọc file qua `fs`).

## Test
- Vòng đời: mặc định → update → đọc lại qua **repository mới** cùng một `Storage` giả → giữ draft/bestStars/runs/hintsOpened.
- `bestStars` không giảm khi lần sau ít sao hơn.
- JSON hỏng, `schemaVersion: 0`, trường sai kiểu → mặc định, không ném.
- `Storage` giả ném ở `getItem`/`setItem` (SecurityError, QuotaExceededError) → không ném ra ngoài; `persistent` thành false; dữ liệu vẫn đọc lại được trong phiên.
- Settings `muted` lưu/đọc.

## Verification
- `npx vitest run src/storage`
- Lệnh grep ở trên trả rỗng.

# Mã Cuối Cùng – prototype Level 1.4 "Tín hiệu lệch pha"

Game dạy Python chạy hoàn toàn trên trình duyệt: sửa mã trong editor, Python chạy bằng
Pyodide trong Web Worker, gói dữ liệu đi qua máy quét, OMNI phản công, chấm 1–3 sao.
Thiết kế: `Ma_Cuoi_Cung_GDD.md`; quyết định đã chốt: `plans/reports/brainstorm-261024-2316-level-1-4-prototype.md`.

## Chạy

Cần Node 24+, npm 11+, Python 3.13+ (`python3`, chỉ để chạy test chấm điểm).

```bash
npm install
npm run dev                         # http://localhost:5173
npm run build && npm run preview    # bản build tĩnh, http://localhost:4173
```

Lần mở đầu tiên cần mạng tới `cdn.jsdelivr.net` để tải Pyodide (~10 MB); các lần sau lấy từ
cache trình duyệt. Âm thanh chỉ bật sau cú click hoặc phím đầu tiên; phím `M` tắt/bật tiếng.

## Test

```bash
npm run typecheck      # TypeScript
npm test               # Vitest (gồm test chấm điểm gọi harness Python thật bằng python3)
npm run test:py        # unittest cho src/engine/python/harness.py
npm run test:all       # cả ba lệnh trên
npm run test:py:3.14   # cùng bộ test trên Python 3.14 (cần uv), giống Pyodide
npx playwright install chromium firefox && npm run test:e2e   # e2e trên bản build, Pyodide thật
E2E_WEBKIT=1 npm run test:e2e   # thêm WebKit + iPhone (Playwright WebKit không chạy trên macOS 26.0)
npm run test:safari    # Safari thật qua safaridriver (bật "Allow remote automation" trong Safari)
```

## Trình duyệt hỗ trợ

Chrome/Edge 80+, Firefox 114+, Safari 15+ (cần module Web Worker). Khi trình duyệt chặn
`localStorage` (ẩn danh, chặn cookie) game vẫn chơi được ở "CHẾ ĐỘ KHÔNG LƯU".

## Cấu trúc

- `src/levels/*.json` – dữ liệu level; thêm level mới chỉ cần thêm file JSON.
- `src/engine/` – harness Python, worker Pyodide, `PyRunner` (timeout, dựng lại worker).
- `src/game/` – chấm sao, phân loại kết quả, lời ECHO, vòng chơi.
- `src/storage/` – nơi duy nhất đọc/ghi tiến độ (thay bằng Supabase sau này).
- `src/ui/`, `src/audio/`, `src/styles/` – giao diện, mô phỏng máy quét, âm thanh Web Audio.

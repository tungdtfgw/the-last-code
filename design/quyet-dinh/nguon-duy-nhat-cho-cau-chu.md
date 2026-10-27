# Quyết định: câu chữ người chơi đọc chỉ nằm trong file dữ liệu

Ngày: 2026-10-27. Trạng thái: đã chốt; sửa bổ sung ngày 2026-10-27: nguồn câu chữ chuyển sang D1 (xem mục "Sửa bổ sung"); sửa bổ sung lần hai ngày 2026-10-28: D1 là nguồn duy nhất, JSON không còn câu chữ.

## Vấn đề

Các GDD (`design/chuong-1/gdd-1.x-*.md`, `design/gdd-mo-dau.md`) chép nguyên văn briefing, việc cần làm, gợi ý, lời ECHO, đoạn kết và kịch bản mở đầu. Sửa câu trong JSON thì GDD lệch; sửa GDD thì game không đổi. Hai chỗ cùng giữ một câu, không chỗ nào đáng tin.

## Quyết định

1. **Câu chữ người chơi đọc chỉ có một nguồn: file dữ liệu.**
   - Level: `src/levels/level-<id>.json`, các trường `location`, `briefing`, `task_steps`, `objectives[].label`, `hints`, `reactions`, `reaction_variants`, `counter_attack_banner`, `outro`, `lore_fragment`, `component`, `outro_beats`, `knowledge_summary`.
   - Chương: `src/story/chapter-1.json`, các trường `prologue`, `teaser`, `neural_id_slots`.
2. **GDD giữ ý đồ, không giữ câu.** Với mỗi đoạn chữ, GDD ghi: đoạn đó phải làm người chơi hiểu hay cảm thấy điều gì, không được nói gì, giọng của ai, nó dẫn sang đâu, và trỏ tới trường JSON chứa câu thật (ví dụ: "câu ở `hints[0]` trong `level-1-1.json`"). Muốn đổi câu thì sửa JSON; chỉ sửa GDD khi đổi ý đồ.
3. **Phần GDD vẫn giữ nguyên văn** vì đó là đặc tả câu đố hoặc cơ chế, không phải câu chữ: code khởi đầu, đầu ra mong đợi, lời giải tham khảo, giá trị phản công, bảng trường hợp biên, ví dụ terminal (do `terminal-lines.ts` sinh ra, không nằm trong JSON). Nếu chúng lệch với JSON thì JSON thắng, và GDD phải được sửa theo.
4. **Danh sách từ cấm** (`forbidden_terms`) là dữ liệu: GDD nói loại từ nào phải cấm và vì sao, danh sách đầy đủ nằm trong JSON.
5. **Tài liệu trong `design/quyet-dinh/`** là bản ghi lịch sử của từng lần chốt. Câu chữ trích trong đó là câu lúc chốt, không phải câu hiện hành; không cập nhật chúng theo JSON.

## Vì sao không làm cách khác

- **Viết câu trong GDD rồi sinh JSON:** JSON còn chứa test, giá trị mong đợi, cấu hình mô phỏng; tách chúng ra khỏi Markdown dễ vỡ.
- **Giữ cả hai bản và có test so khớp:** câu vẫn nằm hai chỗ, mỗi lần sửa phải sửa hai lần chỉ để test qua.

## Hướng tiếp theo

Một trang quản trị để sửa câu chữ mà không phải mở JSON sẽ được lập kế hoạch riêng. Trang đó sửa đúng các trường ở mục 1, nên quyết định này vẫn đứng.

Đã làm: trang `#/admin` (QĐ-15 trong `docs/quyet-dinh-ky-thuat.md`). Xem mục "Sửa bổ sung" ngay dưới.

## Sửa bổ sung (2026-10-27)

- **Câu chữ người chơi đọc giờ nằm ở D1** (bảng `content_text`), và **D1 thắng**. Game tải câu từ `GET /api/content/text` rồi ghép lên file JSON đóng gói sẵn.
- **Câu trong JSON của repo** làm hai việc: là câu dùng khi D1 chưa có dòng cho level hay chương đó (level mới chạy ngay), và là bản chụp D1 do `npm run content:export` ghi lại, để test, kiểm lộ đáp án và đọc GDD. Sửa câu trong JSON khi D1 đã có dòng thì game không đổi, trừ khi chạy kèm `npm run content:import`.
- **Trang quản lý sửa đúng các trường ở mục 1**, trừ hai chỗ: `neural_id_slots` (là số, thuộc câu đố) và phần `code`, `output`, `mistakes[].code`, `mistakes[].error` của `knowledge_summary` (ví dụ chạy được bằng Python, test tích hợp chạy chúng). Danh sách trường đầy đủ nằm ở `src/content/text-fields.ts`.
- Mục 2–5 vẫn đứng. GDD trỏ tới trường JSON, nghĩa là trỏ tới bản chụp; muốn thấy câu đang chạy thì export trước.

## Sửa bổ sung lần hai (2026-10-28)

- **Nguồn duy nhất của câu chữ là D1.** JSON trong repo không còn trường câu chữ nào; nó chỉ giữ câu đố. Không còn câu dự phòng, không còn bản chụp, không còn `content:export`/`content:import`. Mục "Sửa bổ sung" ở trên thôi áp dụng ở hai ý: câu trong JSON làm câu dự phòng, và GDD trỏ tới bản chụp.
- **Câu ban đầu đi bằng migration.** Câu viết lúc design một level vào D1 qua một file `db/migrations/*_content_*.sql`, sinh bằng `npm run content:migration` từ một tài liệu câu chữ. Câu ban đầu của chương 1 và level 1.1–1.4 nằm trong `db/migrations/0004_content_chapter_1.sql`. Trang quản trị chỉ sửa câu đã có, không tạo tài liệu mới.
- **GDD trỏ tới đường dẫn trường trong tài liệu câu chữ ở D1**, ví dụ "Câu chữ: `hints` (D1, `level:1.1`)". Muốn đọc câu hiện hành thì mở tài liệu đó trên trang quản trị (`#/admin`). Mục 2–5 ở trên vẫn đứng, với "trường JSON" đọc là "trường trong tài liệu câu chữ ở D1".
- Lý do và đánh đổi: QĐ-16 trong `docs/quyet-dinh-ky-thuat.md`.

# Quyết định: câu chữ người chơi đọc chỉ nằm trong file dữ liệu

Ngày: 2026-10-27. Trạng thái: đã chốt.

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

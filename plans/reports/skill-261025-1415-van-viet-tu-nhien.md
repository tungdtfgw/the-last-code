# Skill van-viet-tu-nhien

- Vị trí: `.claude/skills/van-viet-tu-nhien/SKILL.md` (danh mục 21 dấu hiệu, ba giọng, quy trình, checklist) và `references/mau-va-vi-du.md` (bảng từ cần soi, ví dụ trước → sau theo từng giọng, lệnh grep quét nhanh).
- Phạm vi: viết, sửa, rà mọi chữ tiếng Việt người chơi hoặc người đọc thấy: briefing, task_steps, objectives, hints, reactions ECHO, outro, knowledge_summary, docs, báo cáo.
- Ba giọng: truyện (cụt, lạnh, "…" của ECHO), hướng dẫn (rõ, ngắn, "bạn"), tổng kết kỹ thuật (trung tính, thuật ngữ Python đúng, thuật ngữ tiếng Anh giải thích một lần).
- Ràng buộc riêng của dự án: giữ placeholder `{line}`…, không đưa `forbidden_terms` vào phản ứng ECHO, không lộ đáp án, không đổi code, tên, số.
- Quy trình: xác định giọng → quét → liệt kê → viết lại → đọc thành tiếng lần hai → trả kết quả.
- Nguồn: `~/.claude/skills/humanizer/SKILL.md` (cấu trúc, quy trình, mục "khi nào để yên"); `~/.claude/skills/paper-writing/SKILL.md` §5, §6, §11 và `references/anti-exemplars.md` (cấm từ nối rỗng, tính từ tự khen, dịch cú pháp Anh). Dấu hiệu riêng tiếng Việt theo hợp đồng `plans/reports/brainstorm-261025-1415-van-viet-nhiem-vu-ro-tong-ket-kien-thuc.md`.
- Đã chạy thử trên 5 câu của `src/levels/level-1-1.json` (briefing, hints); JSON chưa sửa.

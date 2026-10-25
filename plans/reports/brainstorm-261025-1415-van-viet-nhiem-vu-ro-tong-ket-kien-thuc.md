# Brainstorm: văn thuần Việt, nhiệm vụ dễ hiểu, tổng kết kiến thức sau mỗi màn

Ngày: 2026-10-25. Yêu cầu người dùng: tìm skill chống văn AI cho tiếng Việt để câu chữ thuần Việt hơn; cốt truyện giữ giọng game, nhưng phần diễn giải nhiệm vụ phải dễ hiểu để người chơi biết mình cần làm gì; qua một màn, người chơi xem được tổng kết kiến thức bằng ngôn ngữ kỹ thuật trong sáng, không còn giọng game.

## Skill chống văn AI tiếng Việt

Chưa có skill nào cho tiếng Việt (đã tìm: blader/humanizer chỉ tiếng Anh, có bản tiếng Trung Humanizer-zh). Quyết định: viết skill dự án `.claude/skills/van-viet-tu-nhien/SKILL.md`, lấy cấu trúc của `humanizer` (đã cài ở `~/.claude/skills/humanizer`) và quy tắc tiếng Việt của `paper-writing` §11, thêm dấu hiệu riêng của tiếng Việt: từ nối rỗng ("Hơn nữa", "Bên cạnh đó", "Ngoài ra" mở đoạn), cụm sáo ("đóng vai trò quan trọng", "không chỉ… mà còn…", "một cách + tính từ"), động từ rỗng ("thực hiện việc", "tiến hành"), bị động "được" dịch từ tiếng Anh, Hán-Việt thừa khi có từ thuần Việt, câu dài nhiều mệnh đề, dịch máy cú pháp Anh, câu kết một dòng kiểu khẩu hiệu. Skill có hai chế độ: giọng truyện (giữ chất u tối, cụt, của ECHO) và giọng hướng dẫn (rõ, ngắn, chủ ngữ là "bạn").

## Outcome

1. **Nhiệm vụ dễ hiểu.** Mỗi level có thêm khối **"Việc cần làm"** ngay dưới briefing truyện: 2–4 bước bằng lời thường, chủ ngữ "bạn", nói rõ sửa gì và khi nào là xong (ví dụ 1.1: "Sửa 3 lệnh `print` để terminal in ra đúng 3 dòng ở ô Mục tiêu, từng ký tự."). Không lộ đáp án, không nói cách sửa từng lỗi; chỉ nói mục tiêu và tiêu chí xong. Briefing truyện giữ nguyên giọng game. Nhãn mục tiêu viết lại cho rõ nếu đang khó hiểu.
2. **Tổng kết kiến thức.** Sau khi qua level (≥ 1 sao), bấm TIẾP TỤC sẽ mở màn **"Tổng kết kiến thức"** trước đoạn chuyển cảnh. Màn này dùng giọng kỹ thuật trong sáng, không có ECHO, không có từ ngữ game. Nội dung theo từng level: khái niệm chính (giải thích ngắn), 2–4 ví dụ code nhỏ có kết quả chạy, các lỗi đã gặp trong màn (NameError, nối chuỗi, tuple từ dấu phẩy…) kèm giải thích vì sao, và một dòng "Ở màn sau bạn sẽ cần…". Xem lại được từ Bản đồ (mỗi level đã qua có nút "Kiến thức").
3. **Toàn bộ chữ người chơi đọc** (briefing, việc cần làm, mục tiêu, gợi ý, phản ứng ECHO, nhịp truyện, tổng kết) được rà bằng skill mới; giọng truyện giữ chất game, giọng hướng dẫn và tổng kết rõ ràng.

## Dữ liệu (level JSON, tùy chọn để level cũ vẫn hợp lệ)

- `task_steps: string[]` (2–4 mục, có thể có `code` trong backtick).
- `knowledge_summary: { title: string, sections: [{ heading: string, body: string, code?: string, output?: string }], mistakes: [{ code: string, error: string, explain: string }], next: string }`.
- Validator kiểm hình dạng; test chống lộ đáp án **không** áp cho `knowledge_summary` (màn này dạy thẳng, được nêu tên hàm) nhưng `task_steps` không được chứa giá trị kỳ vọng.

## Constraints

- Không đổi luật chấm, sao, cốt truyện, tên riêng. Chỉ đổi cách diễn đạt và thêm hai khối nội dung.
- Ví dụ trong tổng kết **khác đáp án** của level; output ghi trong tổng kết phải đúng (kiểm bằng Python thật trong test).
- Trang không cuộn; màn tổng kết tự cuộn trong khung; phím Enter/Space để tiếp tục; giảm chuyển động; điện thoại.
- E2E: sửa/viết spec, không chạy.

## Non-goals

- Bài tập thêm trong màn tổng kết; lưu ghi chú; dịch tiếng Anh.

## Acceptance criteria

1. Skill `van-viet-tu-nhien` có trong `.claude/skills/`, mô tả rõ khi nào dùng, có danh sách mẫu và ví dụ trước/sau tiếng Việt.
2. Cả 4 level có `task_steps` và `knowledge_summary`; khối "Việc cần làm" hiện dưới briefing (cả khi ô Nhiệm vụ thu gọn thì vẫn xem được, ví dụ hiện trong ô Mục tiêu hoặc dòng thu gọn).
3. TIẾP TỤC sau khi qua level → màn Tổng kết → đoạn chuyển cảnh như cũ; Bản đồ có nút xem lại.
4. Mọi `code`/`output` trong tổng kết chạy đúng bằng Python thật (test tích hợp).
5. Một lượt rà văn bằng skill mới cho 4 level + mở đầu, ghi danh sách câu đã sửa trong báo cáo.
6. typecheck, `npm test`, `npm run test:py`, build qua.

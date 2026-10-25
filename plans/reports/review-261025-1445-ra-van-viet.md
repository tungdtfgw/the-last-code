# Rà văn Việt toàn bộ chữ người chơi thấy

- Ngày: 2026-10-25 (Asia/Saigon). Skill: `van-viet-tu-nhien`.
- Phạm vi: `src/levels/level-1-{1,2,3,4}.json`, `src/story/chapter-1.json`, chữ hiển thị trong `src/ui/*.tsx`, `src/game/terminal-lines.ts`, `sim-vocabulary.ts`, `src/ui/story-labels.ts`.
- Nguyên tắc: chỉ sửa chỗ có dấu hiệu thật; câu đúng giọng thì để yên. Câu bị e2e so nguyên văn vẫn sửa nếu cần, rồi cập nhật assertion.
- Không đụng dữ liệu chấm, `starter_code`, code/output trong `knowledge_summary`, placeholder, nhịp truyện (số nhịp, kind, cue, backdrop, fx).
- Kiểm chứng: `npm run typecheck` qua; `npm test` 34 tệp, 386 test qua (gồm test từ cấm của ECHO và ví dụ tổng kết chạy bằng python3); `npm run test:py` 78 test qua; `npm run build` qua. Không chạy e2e.

## level-1-1.json (7)

| Trường | Trước | Sau | Dấu hiệu |
|---|---|---|---|
| task_steps[0] | Bấm CHẠY … với code có sẵn. | Bấm CHẠY … với mã có sẵn. | chen tiếng Anh |
| task_steps[2] | dòng 2 phải vẫn đúng sau lần đổi đó | dòng 2 vẫn phải đúng sau lần đổi đó | trật tự từ |
| knowledge · Dấu phẩy | Dấu phẩy ở đây là cú pháp, không được in ra. | Dấu phẩy chỉ là cú pháp, không hiện trong kết quả. | bị động "được" dịch Anh |
| knowledge · nháy cong | … nên không dòng nào được in, kể cả những dòng đúng. | … nên không dòng nào in ra, kể cả những dòng đúng. | bị động "được" dịch Anh |
| reactions.output_missing | … Mạng Mù chỉ nghe thấy im lặng. | … Mạng Mù im lặng. | cụm sáo ("nghe thấy im lặng") |
| reactions.resource_limit | Tôi đã cắt tiến trình để giữ laptop sống. | Tôi cắt tiến trình… để laptop còn sống. | dịch Anh ("keep alive"); thống nhất với 1.2, 1.4 |
| reactions.blocked_import | … Ta chỉ có những gì đang có. | … Ngoài những gì đã có trong máy… không còn gì. | câu kết khẩu hiệu, lặp nghĩa |

## level-1-2.json (2)

| Trường | Trước | Sau | Dấu hiệu |
|---|---|---|---|
| reactions.SyntaxError | … Chưa ô nào được ghi. | … Ki-ốt chưa ghi ô nào. | bị động "được" dịch Anh |
| reactions.NameError | … chưa có ô nào mang cái nhãn được gọi. | … chưa có ô nào mang cái nhãn đó. | bị động "được" dịch Anh |

## level-1-3.json (3)

| Trường | Trước | Sau | Dấu hiệu |
|---|---|---|---|
| reactions.resource_limit | Tôi đã cắt tiến trình để giữ laptop sống. | Tôi cắt tiến trình… để laptop còn sống. | dịch Anh; thống nhất |
| reactions.system_exit | Chương trình tự cắt giữa chừng. | Chương trình tự dừng giữa chừng. | chọn từ sai (trùng "cắt" của ECHO) |
| knowledge · dấu chấm | … nên lỗi dễ bị bỏ sót. | … nên rất dễ bỏ sót. | bị động "bị", lặp "lỗi" |

## level-1-4.json (5)

| Trường | Trước | Sau | Dấu hiệu |
|---|---|---|---|
| briefing (câu 2–4) | Dữ liệu còn đọc được… nhưng toàn bộ nằm dưới dạng chuỗi ký tự. Máy quét chỉ chấp nhận số. Gửi chuỗi vào máy quét sẽ kích hoạt báo động. | Dữ liệu còn đọc được… nhưng toàn là chuỗi ký tự. Máy quét chỉ nhận số. Đưa chuỗi vào là báo động. | dịch Anh ("in the form of", "trigger"), Hán-Việt thừa |
| reactions.NameError | Một cái tên được gọi khi chưa từng tồn tại. | Dòng này gọi một cái tên chưa từng có. | bị động "được" dịch Anh |
| reactions.wrong_value_counter | Nó được viết cho một con chip đã chết. | Nó viết cho một con chip đã chết. | bị động "được"; khớp câu cùng loại ở 1.1 |
| knowledge · round | Số thực được lưu ở hệ nhị phân nên … | Máy tính lưu số thực ở hệ nhị phân nên … | bị động "được" dịch Anh |
| knowledge · mistakes[1] | Mọi giá trị trong phép tính phải được đổi sang số. | Phải đổi mọi giá trị trong phép tính sang số. | bị động "được" dịch Anh |

## chapter-1.json (0)

Đọc hết 23 nhịp mở đầu và 9 nhịp còn tiếp. Không câu nào có dấu hiệu đủ nặng để sửa. Câu cụt, câu không chủ ngữ và bộ ba "đang ở đâu, đang nghĩ gì, sắp làm gì" là nhịp có chủ ý của giọng truyện.

## UI và terminal (6)

| Tệp | Trước | Sau | Dấu hiệu |
|---|---|---|---|
| `src/ui/code-editor.tsx` | Đã sửa phần còn lại. Dòng dữ liệu nạp sẵn được giữ nguyên. | … Dòng dữ liệu nạp sẵn vẫn giữ nguyên. | bị động "được" |
| `src/ui/chapter-map.tsx` | Qua một level để xem lại phần tổng kết kiến thức của nó. | Qua một level để xem lại tổng kết kiến thức của level đó. | "nó" thừa dịch "its" |
| `src/ui/objectives-panel.tsx` (tooltip) | Câu lệnh = mỗi lệnh Python mã của bạn chạy (dòng khóa không tính). | Mỗi lệnh Python mã của bạn chạy tính là một câu lệnh (dòng khóa không tính). | ký hiệu "=" thay câu, khó đọc |
| `src/ui/intro-gate.tsx` | Kai mở laptop offline. | Kai mở chiếc laptop chưa từng nối mạng. | chen tiếng Anh; dùng lại cách nói của phần mở đầu |
| `src/game/terminal-lines.ts` (2 dòng) | Kết quả dữ liệu gốc vẫn được giữ. | Vẫn giữ kết quả với dữ liệu gốc. | bị động "được", ghép danh từ khó hiểu |
| `src/game/sim-vocabulary.ts` | Hồ sơ được nhận, bị ghi nhận | Hồ sơ qua, bị ghi nhận | "được… bị…" chồng nhau; khớp mẫu "Qua cổng, bị ghi nhận" |

Assertion đã cập nhật: `tests/e2e/intro.spec.ts` (4 chỗ: briefing 1.4), `tests/e2e/level-1-4.spec.ts` (thông báo dòng khóa), `src/game/terminal-lines.test.ts`, `src/game/echo-reactions.test.ts`.

## Đã đọc và giữ nguyên

- Briefing 1.1, 1.2, 1.3: câu cụt, đúng giọng, không có từ nối hay bị động dịch.
- `task_steps` 1.2, 1.3, 1.4 và nhãn `objectives` mọi level: một câu một việc, đã có tiêu chí xong. "tương ứng" ở bước 1 của 1.2 giữ vì thay thế làm câu dài hơn.
- Gợi ý ba mức của cả bốn level, kể cả "mảnh tài liệu Python".
- Phần lớn `reactions`/`reaction_variants`: dấu "…" của ECHO, câu không chủ ngữ.
- "…Tôi ghi nhận điều đó." ở `three_stars` 1.1, 1.3, 1.4: hơi cứng, nhưng là câu cửa miệng lặp có chủ ý của ECHO; giữ.
- `outro`, `lore_fragment`, `outro_beats` của cả bốn level ("dòng log" là từ của thế giới game).
- `knowledge_summary`: các mục còn lại đã trung tính, thuật ngữ đúng. "code" trong giọng kỹ thuật giữ vì là từ quen dùng.
- Tagline màn tiêu đề "Khi máy làm thay tất cả, tự viết mã là vũ khí cuối cùng.": khẩu hiệu có chủ ý, là tagline.
- `story-labels.ts`, nhãn nút (TIẾP TỤC, BỎ QUA, CHẠY…), trạng thái mô phỏng trong các `*-timeline.ts` (một số chuỗi trạng thái còn được code so sánh, nên không đụng).
- `game-reducer.ts` "> Kết nối laptop offline… chờ lõi Python.": dòng terminal, nằm trong file logic ngoài phạm vi; giữ.

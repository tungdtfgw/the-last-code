# Nghiệm thu: mở đầu game và Level 1.1–1.3

Ngày: 2026-10-25. Phạm vi: phần mở đầu, chuyển cảnh, Level 1.1, 1.2, 1.3, nối với 1.4 thành một chương prototype.

## Kết quả

Chương 1 chơi liền một mạch: màn tiêu đề → mở đầu (23 nhịp) → 1.1 → chuyển cảnh → 1.2 → chuyển cảnh → 1.3 → chuyển cảnh → 1.4 → chuyển cảnh → "Còn tiếp" → Bản đồ Vùng Tối. Thêm level mới chỉ cần file JSON và id trong `src/story/chapter-1.json`.

| Kiểm tra | Kết quả |
|---|---|
| `npm run typecheck` | sạch |
| `npm test` | 34 file, 385 test qua |
| `npm run test:py` (3.13) và `test:py:3.14` | 78 test qua |
| `npm run build` | qua |
| Chụp màn hình 360 px (giảm chuyển động) và 1280 px: tiêu đề, mở đầu, bản đồ, 4 level | không cuộn ngang, không lỗi JS |
| Chơi tay trên Pyodide thật (Chrome, dev server) | 1.1, 1.2, 1.3 đều tới 3 sao và sang đoạn chuyển cảnh; nhánh 2 sao và phản công đúng GDD |
| E2E | đã viết (`level-1-1/1-2/1-3.spec.ts`, `story-flow.spec.ts` cập nhật), **chưa chạy** theo yêu cầu người dùng |

## Đối chiếu tiêu chí

- **Game mở đầu:** màn tiêu đề im lặng tới cú bấm đầu, đoạn mở đầu giới thiệu thế giới, Nhi (NX-0417), laptop và ECHO; bỏ qua được (Esc), giảm chuyển động hiện bản chép cuộn được, có màn chờ khi mở thẳng liên kết. Lỗi Enter làm mất tiếng nhịp đầu đã sửa (cue gọi trong lúc mở khóa âm thanh được giữ lại và phát khi âm thanh chạy); kiểm trên Chrome thật bằng audio probe: trước cú bấm không có sự kiện nào, sau Enter có `context, unlock, …, pulse`. Thanh Neural-ID trên bản đồ chuyển 2 cột dưới 480 px, tên thành phần đọc được ở 360–375 px.
- **Cốt truyện xuyên suốt:** tên riêng, địa điểm và mảnh nhật ký cố định ở `design/gdd-mo-dau.md` mục 1 và 6; mỗi level tạo một thành phần Neural-ID giả (thanh 6 ô, 4/6 sau 1.4 khớp câu "Bốn thành phần. Còn hai."). ECHO tự giới thiệu đúng một lần; câu `entry` của 1.4 đã đổi. Không lời ECHO nào lộ twist chương 6.
- **Học và ôn Python qua gameplay:** mỗi khái niệm có lý do trong truyện (print là giọng nói duy nhất qua trạm R-17; biến vì một giá trị dùng ở nhiều thiết bị và bị 0xA7 sửa giữa chừng; kiểu vì máy quét chỉ đọc hình dạng; ép kiểu vì chip chỉ còn ký tự). Lỗi cài sẵn dẫn người chơi gặp lỗi Python thật theo thứ tự có chủ đích. Level sau dùng lại kiến thức level trước (1.2 dùng `print`; 1.3 dùng biến và `print(type(...))`; 1.1 gieo trước dòng gán `ma_phien`). OMNI phản công bắt đúng lỗi điển hình của từng khái niệm (chép cứng, gõ tay giá trị, giả định kiểu). ECHO không bao giờ nói cách sửa; test chống lộ đáp án chạy cho mọi level.
- **Tò mò muốn chơi tiếp:** mỗi đoạn chuyển cảnh kết bằng một câu hỏi mở (0xA7 là ai → giá trị cũ của Nhi còn bao lâu → vì sao 0xA7 biết có xác người → 0xA7 không đi qua Mạng Mù, "Đừng tin 0xA7", Nhi trực ca đêm ở Cổng Kiểm Soát). Manh mối ngầm: tuổi 27 và chiều cao 1.72 của danh tính giả trùng chip người chết. Bản đồ hiện 1.5–1.7 "TÍN HIỆU ĐANG GIẢI MÃ", tổng sao /12, nhật ký KTS sưu tầm được.
- **Test có ý nghĩa:** chỉ test chấm điểm, luật sao, rò đáp án, an toàn khi lỗi, luật tiến trình, timeline mô phỏng thuần, mỗi level một e2e.

## Chơi thử mô phỏng và sửa lỗi

Một sub-agent đóng vai sinh viên chưa từng lập trình chơi trọn chương chỉ dựa vào màn hình (`plans/reports/playtest-261025-1300-mo-phong-nguoi-moi.md`): 12/12 sao sau 23 lượt chạy, mở 2 gợi ý; độ tò mò 4–5/5, đoạn kết "CA ĐÊM · NX-0417 … Nhi." là móc câu mạnh nhất. Các vấn đề tìm ra đã sửa (`plans/reports/fix-261025-1310-playtest-findings.md`): ô bị cắt ở 1280×800, chọn hết rồi gõ bị bỏ qua khi dính dòng khóa, hộp kết quả che lời ECHO, ECHO lặp nguyên văn và bỏ sót lỗi "tên biến trong dấu nháy", gợi ý 1.4 quá mơ hồ (thêm phản ứng "chuỗi bị nhân lặp"), thuật ngữ chưa giải thích, lỗi chữ. Quyết định của người dùng: 1.2 giữ chấm theo giá trị (thêm phản ứng `value_overwritten`); 1.4 phản công dùng `chieu_cao = "1.653"` để thiếu `round()` mất sao 3.

## Vòng sửa theo góp ý người dùng (25/10 chiều)

- ECHO và Nhật ký gợi ý chuyển thành khung chat nổi; ô Nhiệm vụ tự thu gọn sau lượt chạy đầu (`plans/reports/cook-261025-1333-echo-chat-popup.md`, `cook-261025-1350-briefing-collapse.md`).
- Skill dự án `van-viet-tu-nhien` (chống văn AI tiếng Việt, ba giọng: truyện, hướng dẫn, tổng kết kỹ thuật); toàn bộ chữ của 1.1–1.4, mở đầu và "Còn tiếp" đã rà bằng skill này (`plans/reports/content-261025-1430-level-1-*.md`).
- Mỗi level có ô **Việc cần làm** (2–4 bước bằng lời thường) và màn **Tổng kết kiến thức** sau khi qua màn (giọng kỹ thuật, ví dụ code chạy thật trong test, lỗi đã gặp, kiến thức cho màn sau), xem lại được từ Bản đồ (`plans/reports/cook-261025-1415-viec-can-lam-va-tong-ket.md`).

## Tài liệu

- Thiết kế: `design/gdd.md` (tổng), `design/gdd-mo-dau.md`, `design/chuong-1/gdd-1.1…1.4-*.md`.
- Brainstorm, hợp đồng engine, plan và báo cáo cook: `plans/reports/*-261025-0928-*.md`, `plans/261025-0928-*/`.

## Còn mở

- Chạy e2e khi người dùng yêu cầu: `npx playwright test tests/e2e/level-1-1.spec.ts tests/e2e/level-1-2.spec.ts tests/e2e/level-1-3.spec.ts tests/e2e/story-flow.spec.ts --project=chromium`, rồi `npm run test:e2e`.
- Chưa có người chơi thật thử nghiệm (độ khó, cảm giác tò mò); nên thử với vài sinh viên trước khi refactor đăng nhập.
- Nhiều câu lệnh nối bằng `;` trên một dòng chỉ tính là một (lỗi cũ, có thể lách thanh cảnh báo).
- Chi phí `var_history` của 1.2 ở trường hợp xấu nhất dùng 92% ngưỡng.
- Chưa kiểm Safari/iOS; lỗi tải Pyodide ở cửa sổ ẩn danh để sau (Chrome thường chạy được).
- Ở 1024×768 cột nhiệm vụ vẫn cuộn bên trong; tooltip không hiện trên màn hình cảm ứng.

# Bảng xếp hạng người chơi

Ngày: 13/11/2026. Yêu cầu của chủ dự án: "Thêm tính năng xếp hạng người chơi (theo level đạt được), cùng level xếp theo sao của level đó." Các lựa chọn bên dưới do chủ dự án chốt ngày 12/11/2026. Quyết định kỹ thuật đi kèm: QĐ-20 trong `docs/quyet-dinh-ky-thuat.md`.

## Ai đứng trên ai

1. **Level đạt được** là level xa nhất theo thứ tự chơi (chương 1 rồi chương 2, theo `levels` của từng file chương) mà nó và mọi level trước nó đều có ít nhất 1 sao. Có sao ở 2.7 nhưng 2.1 chưa có sao thì chỉ tính tới level trước 2.1. Luật này khớp với luật mở khóa: người chơi không nhảy cóc lên hạng bằng cách mở level qua link. Id trong file chương mà không có file level thì bỏ qua, giống luật "đã dựng" ở `progression.ts`. Server không kiểm câu chữ D1, nên một level có file mà câu chữ hỏng ("TÍN HIỆU HỎNG" trong game) vẫn nằm trong chuỗi và chặn mọi người ở trước nó; điều này chỉ xảy ra khi deploy thiếu migration câu chữ, mà `npm test` đã chặn.
2. **Cùng level**: ai nhiều sao hơn ở chính level đó đứng trên.
3. **Cùng level, cùng sao**: ai tới đó trước đứng trên. Lúc "tới đó" là mốc muộn nhất trong hai thứ: lúc mỗi level trong chuỗi có sao lần đầu, và lúc level cuối chuỗi lên số sao hiện tại. Nâng sao ở một level cũ không làm lùi mốc này. Nếu vẫn hòa thì xếp theo tên đăng nhập. Hàng không có mốc xếp sau hàng có mốc.
4. Hạng là số thứ tự 1, 2, 3…, không có đồng hạng.

## Ai có mặt

- Chỉ tài khoản đã kích hoạt và có ít nhất một level trong chuỗi.
- Tài khoản bị admin ẩn thì không có hạng, không chiếm chỗ của ai. Chính người đó thấy mình "chưa có hạng". Admin vẫn thấy họ ở cuối bảng, mờ đi, cột hạng ghi "ẨN".

## Màn `#/rank`

- Mở từ nút "XẾP HẠNG" ở chân màn tiêu đề và trên thanh trên của bản đồ. "QUAY LẠI" về đúng màn đã mở nó, thay chỗ `#/rank` trong lịch sử (tải lại ở `#/rank` thì về màn tiêu đề). Trước lần tải đầu, màn chờ tối đa 2 giây cho các lần ghi tiến độ đang gửi của chính người chơi, để sao vừa giành được hiện ngay.
- Bảng hiện 50 người đầu: hạng, tên đăng nhập, level (`1.4 · <tên level>`), số sao của level đó. Dòng của mình được tô nổi và ghi "(bạn)".
- Mình ngoài 50 người đầu thì sau bảng có dòng "…" rồi dòng của mình. Chưa có hạng (chưa qua level nào, hoặc bị ẩn) thì ghi "Bạn chưa có hạng.". Cuối bảng ghi tổng số người có hạng.
- Đang tải, lỗi mạng (có nút "THỬ LẠI") và bảng rỗng đều có câu riêng.
- Admin có thêm cột "Quản lý" với nút ẨN/HIỆN ở mỗi dòng.
- Chữ trên màn này là chữ giao diện shell, nằm trong code như nút "BẢN ĐỒ", không phải câu chữ D1.

## Ngoài phạm vi

Chấm lại code Python phía server, bảng theo chương hoặc theo tuần, trang hồ sơ người chơi.

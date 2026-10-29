# Mẫu và ví dụ trước → sau

Bổ sung cho `SKILL.md`. Ví dụ chia theo giọng, vì cùng một dấu hiệu sửa khác nhau tùy giọng.

## 1. Từ cần soi

| Hay gặp trong văn AI | Thay bằng (giọng hướng dẫn) | Ghi chú |
|---|---|---|
| Hơn nữa, Bên cạnh đó, Ngoài ra | bỏ; hoặc "Cũng", "Thêm nữa" khi thật sự cộng ý | tối đa một lần mỗi bài |
| Đặc biệt, Đáng chú ý là | bỏ, nói thẳng điều đáng chú ý | |
| Tóm lại, Nhìn chung, Có thể nói | bỏ câu tóm nếu nó lặp lại ý trên | |
| đóng vai trò quan trọng | nói vai trò cụ thể là gì | |
| là chìa khóa để | "giúp", "cần cho" hoặc nói cơ chế | |
| hành trình, khám phá, chinh phục | "học", "thử", "làm" | trong giọng truyện có thể giữ nếu đúng bối cảnh |
| nâng tầm, tối ưu hóa trải nghiệm | bỏ | |
| một cách nhanh chóng / chính xác / hiệu quả | "nhanh", "đúng", hoặc bỏ | |
| thực hiện việc + động từ | động từ đó | |
| tiến hành | bỏ, giữ động từ chính | |
| có thể giúp bạn + động từ | động từ đó | |
| sử dụng | dùng | giữ "sử dụng" trong văn trang trọng nếu cả bài như vậy |
| thực thi | chạy | "thực thi" giữ được trong tổng kết kỹ thuật |
| hiển thị | hiện, in ra | |
| khởi tạo | tạo, gán lần đầu | |
| tương ứng | khớp, ứng với | |
| nhằm mục đích | để | |
| Điều này là bởi vì | Vì | |
| Đây là lý do tại sao | Vì vậy | |
| Nó là cần thiết để | Cần | |
| được + động từ (bị động dịch) | câu chủ động | |
| output, input, fix, check, run | kết quả in ra, đầu vào, sửa, xem, chạy | `input()` là tên hàm thì giữ |

## 2. Giọng truyện (briefing, ECHO, outro)

Giữ ngắn và lạnh. Văn AI ở giọng này lộ ra theo hai hướng ngược nhau: giải thích quá nhiều, cảm thán, triết lý; hoặc cụt như điện tín, bỏ chủ ngữ và hư từ, đặt ẩn dụ thay thuật ngữ (SKILL.md mục F). Dự án này từng mắc hướng thứ hai.

- Trước: "Thật tuyệt vời! Bạn đã thành công gửi đi tín hiệu đầu tiên, một bước tiến quan trọng trên hành trình giải cứu thành phố."
  Sau: "Tín hiệu đầu tiên đã vào Mạng Mù. Trạm R-17 im lặng một lúc… rồi trả về một dòng."
- Trước: "Hãy nhớ rằng, trong thế giới lập trình, mỗi ký tự đều mang ý nghĩa riêng của nó."
  Sau: "Trạm không đoán ý. Sai một ký tự là bỏ cả gói."
- Trước: "ECHO cảm thấy rằng có lẽ bạn nên thử kiểm tra lại dòng số 2 một cách cẩn thận hơn."
  Sau: "Dòng 2… nhìn lại đi."
- Trước: "Đây không đơn thuần là một lỗi, mà là một lời cảnh báo từ hệ thống."
  Sau: "Hệ thống vừa từ chối. Lần sau nó sẽ ghi lại."
- Trước: "Lỗi NameError xảy ra khi Python không thể tìm thấy tên mà bạn đã sử dụng trong mã của bạn."
  Sau (ECHO): "NameError. Python tìm cái tên đó trong bộ nhớ… không thấy."

## 3. Giọng hướng dẫn (task_steps, objectives, cách chơi)

Một câu một việc. "Bạn" hoặc mệnh lệnh ngắn. Nói tiêu chí xong.

- Trước: "Nhiệm vụ của bạn trong màn chơi này là tiến hành chỉnh sửa các dòng lệnh print để có thể tạo ra được kết quả đầu ra phù hợp với yêu cầu."
  Sau: "Sửa các lệnh `print` để terminal in đúng 3 dòng ở ô Mục tiêu."
- Trước: "Sau khi đã hoàn tất việc chỉnh sửa, chúng ta sẽ nhấn vào nút CHẠY để thực thi chương trình."
  Sau: "Sửa xong thì bấm CHẠY."
- Trước: "Lưu ý: Kết quả sẽ được hiển thị ở khu vực terminal phía bên dưới."
  Sau: "Kết quả hiện ở terminal."
- Trước: "Bạn có thể sử dụng gợi ý nếu cảm thấy gặp khó khăn trong quá trình giải."
  Sau: "Kẹt thì mở gợi ý."
- Trước (nhãn mục tiêu): "Dòng 2: Hiển thị chuỗi PHIEN kết hợp với giá trị mã phiên tương ứng"
  Sau: "Dòng 2 · PHIEN, một dấu cách, rồi mã phiên trạm đang cấp"

## 4. Giọng tổng kết kỹ thuật (knowledge_summary, docs)

Trung tính, chính xác. Thuật ngữ đúng. Câu ngắn vừa phải. Không giọng game, không khen.

- Trước: "Hàm print() là một trong những hàm cơ bản và quan trọng nhất trong Python, đóng vai trò then chốt trong việc hiển thị thông tin ra màn hình."
  Sau: "`print()` in giá trị trong ngoặc ra màn hình, mỗi lần gọi là một dòng."
- Trước: "Bên cạnh đó, Python cũng phân biệt chữ hoa và chữ thường một cách nghiêm ngặt."
  Sau: "Python phân biệt chữ hoa và chữ thường: `\"abc\" == \"ABC\"` cho `False`."
- Trước: "Khi một biến chưa được định nghĩa được sử dụng, Python sẽ đưa ra một lỗi NameError."
  Sau: "Dùng một tên chưa gán giá trị thì Python báo `NameError`."
- Trước: "Traceback là một công cụ vô cùng hữu ích giúp bạn có thể debug code hiệu quả hơn."
  Sau: "Traceback là đoạn báo lỗi Python in ra khi chương trình dừng giữa chừng. Dòng cuối cho biết loại lỗi, các dòng trên chỉ chỗ gây lỗi."
- Trước: "Tóm lại, việc nắm vững kiến thức về chuỗi sẽ là bước đệm vững chắc cho những bài học tiếp theo."
  Sau: "Ở màn sau bạn sẽ cần ghép chuỗi với số."

## 5. Báo cáo, tài liệu nội bộ

- Trước: "Chúng tôi đã tiến hành thực hiện việc rà soát một cách toàn diện đối với toàn bộ các file level."
  Sau: "Đã rà 4 file level."
- Trước: "Việc thay đổi này không chỉ giúp cải thiện trải nghiệm người dùng mà còn nâng cao chất lượng mã nguồn."
  Sau: "Thay đổi này tách phần chấm điểm khỏi UI, nên test chạy được mà không cần trình duyệt."
- Trước: "Kết quả cho thấy rằng tất cả các bài kiểm thử đều đã được vượt qua thành công."
  Sau: "Tất cả test đều qua (112/112)."  (chỉ ghi số khi có số thật)

## 6. Lệnh quét nhanh

Chạy trên file văn bản hoặc JSON. Kết quả không phải lúc nào cũng sai; mỗi chỗ trúng cần đọc lại trong ngữ cảnh.

```bash
grep -nE '(^|[.!?"] )(Hơn nữa|Bên cạnh đó|Ngoài ra|Đặc biệt|Tóm lại|Nhìn chung|Có thể nói)' FILE
grep -nE 'đóng vai trò|là chìa khóa|hành trình|khám phá|nâng tầm|trải nghiệm tuyệt vời|không chỉ .* mà còn' FILE
grep -nE 'một cách [[:alpha:]]+|thực hiện việc|tiến hành|có thể giúp bạn|Điều này là bởi vì|Đây là lý do tại sao' FILE
grep -nE 'được (hiển thị|thực thi|sử dụng|khởi tạo)|của [^,.]+ của [^,.]+ của' FILE
grep -nE 'chúng ta|output|fix |check ' FILE
```

# Playtest mô phỏng: sinh viên năm nhất chưa từng lập trình

- Ngày: 2026-10-25, giờ Asia/Saigon.
- Cách chơi: Chromium headless chạy bằng Playwright, profile mới (không có tiến độ lưu), viewport 1280×800, dev server `http://localhost:5173`. Tôi chỉ chơi bằng những gì hiện trên màn hình, không đọc mã nguồn, JSON hay tài liệu thiết kế.
- Ảnh chụp nằm ở `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/playtest/shots/`. Trong báo cáo, tôi gọi ảnh theo tên tệp, ví dụ `10-l11-start.png`.
- Giới hạn của mô phỏng: tôi là AI đóng vai người mới, nên vẫn có thể "đoán" hơi giỏi hơn một sinh viên thật, nhất là ở 1.3 (dùng `1.72` thay cho `1,72`) và 1.4 (dùng `int()` và `float()` như hàm chuyển đổi). Những chỗ đó tôi ghi rõ là một người mới thật nhiều khả năng sẽ kẹt.

## Tóm tắt kết quả

| Màn | Số lượt chạy | Gợi ý đã mở | Sao | Kẹt ở đâu |
|---|---|---|---|---|
| 1.1 Khởi động | 7 | 1/3 | 3 | Không biết cách đưa `ma_phien` vào dòng in; chọn tất cả rồi gõ thì bị chặn mà không có thông báo |
| 1.2 Gán nhãn | 6 | 0/3 | 3 | `khu_cu` phải là mã cũ; qua được bằng `khu_cu = goi_2`, tức là đi đường vòng và không học thứ tự gán |
| 1.3 Bốn loại tín hiệu | 4 | 0/3 | 3 | `khuon_phien`: lần đầu viết `"int"` rồi `int`, sau đó mới tới `type(ma_phien)` |
| 1.4 Tín hiệu lệch pha | 6 | 1/3 khi đang chơi, 3/3 sau khi qua (mở để đánh giá) | 3 | Chưa ai dạy `int()` hay `float()`; bẫy `"31.0"` |

Tổng sao 12/12. Mọi đoạn truyện (mở đầu, sau 1.1 đến sau 1.4, "Còn tiếp", bản đồ) đều chạy hết mà tôi không bỏ qua.

## Mở đầu

**Điều tôi hiểu.** Năm 2089, OMNI kiểm soát mọi thứ, lập trình là tội, tám Kiến Trúc Sư giấu tám mảnh công tắc tắt. Kai sống ở Lô 17 và em gái anh đã bị "tái định hướng". Laptop offline còn Python và ECHO, một trợ lý chỉ "đọc… và hỏi". Mục tiêu là dựng một Neural-ID giả để qua cổng. Phần mở đầu rõ ràng và có không khí. Câu "Bằng một giọng không phải của Nhi" là câu mạnh nhất.

**Điều làm tôi bối rối.**
- "Ba tuần trước, OMNI tái định hướng em gái tôi." Người mới không biết "tái định hướng" là gì. Thẻ "TRẠNG THÁI: ĐÃ TÁI ĐỊNH HƯỚNG · MỨC TUÂN THỦ: 100%" giúp đoán được phần nào. Phải tới bản ghi KTS-05 sau 1.2 thì nghĩa mới rõ, và đó là một cú nối hay.
- Tên "Nhi" xuất hiện lần đầu trong câu "giọng không phải của Nhi" mà trước đó không ai giới thiệu. Tôi phải nghĩ một nhịp mới hiểu đó là em gái.
- Chữ "CẢNH BÁO" nháy lên khi Kai nói "cả khu này sẽ bị quét". Nó đẹp, nhưng tôi không biết là có chuyện gì xảy ra thật hay chỉ là trang trí.
- Phần mở đầu dài khoảng 60 giây. Với tôi như vậy là chấp nhận được, vì mỗi nhịp đều đưa thông tin mới.

**Độ tò mò: 4/5.** Mối liên hệ cá nhân với em gái làm tôi muốn chơi tiếp. Phần về tám mảnh và Kiến Trúc Sư thì còn chung chung.

## Màn 1.1 Khởi động

**Điều tôi hiểu.** Trạm phát lại đúng từng ký tự. Có 3 dòng cần phát. Mã phiên do trạm cấp và có thể đổi.

**Diễn biến các lượt chạy.**
1. Chạy mã gốc: `NameError: name 'PHIEN' is not defined` ở dòng 7. ECHO nói: "Python đi tìm một thứ mang tên đó trong bộ nhớ… không thấy. Đặt dòng này cạnh một dòng đã phát được." Câu này hay: nó gợi tôi so với dòng 6 (có dấu nháy) mà không đọc đáp án.
2. Tôi chọn tất cả (⌘A) rồi dán mã mới. **Không có gì thay đổi.** Editor bỏ qua thao tác này mà không báo gì, có lẽ vì dòng 3 bị khóa nằm trong vùng chọn. Lượt chạy thứ 2 chạy lại đúng mã cũ, nên tôi mất một lượt mà không hiểu tại sao (`12b-selectall.png`).
3. Tôi viết cứng `print("PHIEN K7Q2")`, còn dòng 3 vẫn chữ thường. ECHO: "từng chữ cái đều đúng… nếu bỏ qua cỡ chữ." Câu này rõ và tốt.
4. Sửa sang chữ hoa thì được 2 sao. OMNI đổi mã phiên thành M4X8, và ECHO nói "Nó được viết cho một phiên đã chết." Đây là lời phạt dạy được điều cần dạy, nhưng **hộp kết quả che mất panel ECHO**, nên phải đóng hộp mới đọc được câu đó (`14-l11-r4.png`).
5. Tôi thử `print("PHIEN ma_phien")`, một lỗi rất điển hình của người mới. ECHO chỉ nói "Dòng phát thứ 2 lệch ở ký tự thứ 7. Trạm R-17 không đoán ý." Câu đó đúng nhưng **bỏ lỡ đúng khái niệm cần dạy**: một cái tên đặt trong dấu nháy là chữ, không phải ô nhớ.
6. Tôi thử `print("PHIEN" ma_phien)` và gặp SyntaxError. Terminal ghi "Perhaps you forgot a comma?". Lời đó giúp nhiều hơn ECHO ("Trình dịch không đọc được cấu trúc này").
7. Tôi mở gợi ý 1. Nút gợi ý cần bấm hai lần (lần đầu "Xác nhận: giải mã mức 1"), và trạng thái chờ xác nhận tự hủy sau vài giây. Lần đầu tôi tưởng nút hỏng. Gợi ý 1 ("Hai dòng cùng bắt đầu bằng một lệnh… khác nhau ở đâu") nói về lỗi ban đầu, không phải lỗi tôi đang gặp lúc đó. Sau đó tôi sửa thành `print("PHIEN", ma_phien)` và được 3 sao.

**Tôi có học được không?** Phần lớn là có. Tôi giải thích được rằng có dấu nháy là chữ, không có dấu nháy là tên của một ô nhớ, và viết cứng giá trị thì sẽ vỡ khi dữ liệu đổi. Chưa có gì giải thích vì sao dấu phẩy trong `print` lại sinh ra một dấu cách.

**Lỗi hình ảnh** (`10-l11-start.png`, `11-l11-r1.png`):
- Panel ECHO ở 1280×800 chỉ hiện khoảng hai dòng ("Dòng 7. NameError. Python đi tìm một thứ…"). Phải cuộn bên trong panel mới đọc hết câu của nhân vật dạy chính.
- Panel MỤC TIÊU bị cuộn sẵn, nên tiêu đề dính đè lên mục "Dòng 1 · tiêu đề tín hiệu" và chữ bị cắt nửa.
- Panel NHIỆM VỤ chỉ hiện hai đoạn cuối của bản tin.
- Hai dòng chú thích đầu trong editor bị cắt ngang ("…in ra t").

**Câu chuyện.** Đoạn sau 1.1 có bản ghi KTS-01, tín hiệu 0xA7 và câu "Ít nhất đã có người nghe thấy." Đoạn này gọn và gieo được một bí ẩn. **Độ tò mò: 4/5.**

## Màn 1.2 Gán nhãn

**Điều tôi hiểu.** Phải gán các gói vào những ô có nhãn. Hai thiết bị đọc hồ sơ. Mã khu đổi từ K-12 sang K-07, và nhật ký phải giữ mã cũ.

**Điều làm tôi bối rối.**
- Mỗi mục tiêu có nhãn `str` mà màn này không giải thích. Một người chưa từng lập trình không biết `str` là gì. Phải sang 1.3 mới có "bốn loại".
- Mục tiêu "Máy quét drone đọc: họ tên / mã khu" không nói rõ mã khu cũ hay mới. Tôi chỉ biết là mã mới khi terminal báo `'ĐỖ MINH AN / K-12' không khớp mẫu`.
- Terminal dùng "không khớp mẫu" mà không cho xem mẫu. Ở 1.1 có dòng "cần / nhận" rất dễ hiểu; 1.2 nên có giống vậy.

**Diễn biến các lượt chạy.**
1. Mã gốc gặp NameError vì `Ma_khu`. ECHO nói "Soát từng ký tự." Câu này tốt.
2. Sửa xong thì `so_hieu = "goi_3"` sai. ECHO: "Ô so_hieu đang giữ chữ của một cái nhãn… không phải thứ nằm sau cái nhãn đó." Câu này rất hay vì nó nhắc lại bài học dấu nháy của 1.1.
3. `khu_cu`, `the_quet` và `the_cong` sai. ECHO: "Đọc lại thứ từng thiết bị đã nhận." Câu này quá chung chung.
4. Tôi đưa `ma_khu = goi_4` lên trước. `the_quet` và `the_cong` đúng, nhưng `khu_cu` vẫn là K-07. ECHO lặp lại đúng câu chung chung đó và **không nhắc gì tới thứ tự gán**, trong khi đây chính là khái niệm của màn.
5. Tôi viết cứng `khu_cu = "K-12"` và được 2 sao. OMNI thay bộ đệm, ECHO nói "chúng được gõ sẵn".
6. `khu_cu = goi_2` thì được **3 sao**.

**Tôi có học được không?** Chỉ được một nửa. Tôi học được rằng gán `=` là đặt nhãn cho một giá trị và rằng thứ tự dòng quan trọng (với `the_quet`). Nhưng **tôi qua màn mà không cần học mẫu "chép giá trị cũ trước khi gán lại"** (`khu_cu = ma_khu` đặt trước `ma_khu = goi_4`). Đây đúng là điều mà bản ghi KTS-05 ngay sau đó tôn vinh: "Tái định hướng chỉ là một phép gán lại… Tôi chưa tìm ra cách lấy lại giá trị cũ." Câu chuyện dạy một điều, còn bài tập chấp nhận một đường tắt.

**Câu chuyện.** KTS-05 và "Nhi chưa bị xóa." là cao trào cảm xúc tốt nhất trước 1.4. Lời cuối của ECHO ở lượt 6, "…Nó không tìm ra bàn tay nào.", thì tối nghĩa: tôi không hiểu "bàn tay" là gì (có lẽ là dấu vết người gõ tay?). **Độ tò mò: 5/5.**

## Màn 1.3 Bốn loại tín hiệu

**Điều tôi hiểu.** Mỗi trường phải có đúng "hình dạng": str, int, float hoặc bool. Phần mô phỏng có bốn làn màu và một thùng giữ lại; đây là phần trực quan nhất của cả bốn màn (`30-l13-start.png`).

**Điều làm tôi bối rối.**
- Terminal báo `chieu_cao: tuple, yêu cầu float`. **"tuple" chưa từng xuất hiện.** Mô phỏng ghi "KHÔNG RÕ HÌNH DẠNG", rõ hơn hẳn. Người Việt viết `1,72` là rất tự nhiên, nên đây là cái bẫy hay, nhưng câu ECHO ở lượt 1 ("Mỗi trường được xếp theo hình dạng của nó…") không chỉ ra dấu phẩy thập phân. Một sinh viên thật rất có thể sẽ kẹt ở đây. Tôi đoán ra `1.72` nhờ kiến thức sẵn có.
- Mục tiêu `khuon_phien` mang nhãn `type`. Câu "Khuôn phiên = hình dạng của mã phiên" chỉ dễ hiểu sau khi đã thấy dòng mẫu `print(type(ho_ten))`. Dòng mẫu đó là gợi ý tốt.

**Diễn biến các lượt chạy.** Lượt 1 chạy mã gốc, 4 trường sai. Lượt 2 đặt `da_tiem = "True"` và `khuon_phien = "int"`; ECHO nói "In ra trông giống nhau… với máy quét, đó là hai vật khác nhau." Đây là câu hay nhất của ECHO trong cả buổi. Lượt 3 dùng `True` và `int` (không nháy) thì được 2 sao; OMNI đổi mã phiên thành chuỗi "7351". Lượt 4 dùng `type(ma_phien)` thì được 3 sao.

**Tôi có học được không?** Có. Tôi giải thích được bốn kiểu, sự khác nhau giữa `"True"` và `True`, và rằng `type()` trả về một "khuôn".

**Câu chuyện.** KTS-07, xác người đưa tin và câu "Làm sao nó biết có xác người ở đây?" tạo nghi ngờ với 0xA7 rất khéo. **Độ tò mò: 5/5.**

## Màn 1.4 Tín hiệu lệch pha

**Điều tôi hiểu.** Dữ liệu chip là chuỗi, còn máy quét chỉ nhận số, nên phải tính mã xác thực và chỉ số.

**Điều làm tôi bối rối.**
- **Chưa màn nào dạy `int()` hay `float()` như những hàm chuyển đổi.** Ở 1.3, `int` và `float` chỉ là tên của loại. Người mới thật sẽ không nghĩ ra `int(tuoi)`. Kiến thức này chỉ xuất hiện ở **gợi ý mức 3** ("Mảnh tài liệu Python còn đọc được: int("42") → 42 …"). Gợi ý 1 ("Máy quét không đọc được ý nghĩa…") gần như lặp lại câu mở màn của ECHO, còn gợi ý 2 ("Thứ tự chuyển đổi… quan trọng") quá mơ hồ.
- `str (201 ký tự)` trong terminal khó hiểu với người mới. Mô phỏng hiện `'272727272727…` thì gợi ý tốt hơn, nhưng ECHO không bình luận gì về việc chuỗi nhân 100 thì bị lặp lại.
- Mục tiêu ghi "làm tròn 2 chữ số", nhưng `float(chieu_cao) * 2` không có `round()` vẫn được 3 sao. Mục tiêu nói một đằng mà bộ chấm lại chấp nhận một nẻo.
- Ở lượt 2, hộp kết quả 2 sao có tiêu đề "Qua cổng". Các màn khác dùng "…mở một nửa". Tiêu đề này lệch giọng và dễ khiến người chơi nghĩ mình đã xong.

**Diễn biến các lượt chạy.**
1. Mã gốc: ba trường đều sai kiểu.
2. Viết cứng `27 * 100 + 3` và `1.72 * 2` thì được 2 sao. OMNI đổi chip, ECHO nói "Nó được viết cho một con chip đã chết." Đây là lần thứ tư liên tiếp ngôi sao thứ ba dùng cùng một bài "đừng viết cứng".
3. `int(tuoi * 100 + cap_do)` và `float(chieu_cao * 2)` gây ValueError `'1.721.72'`. Thông báo lỗi này dạy được điều hay (nhân chuỗi là lặp chuỗi), nhưng ECHO chỉ nói "Nội dung bên trong không chuyển được sang hình dạng đó."
4. `int(tuoi) * 100 + int(cap_do)`: phần chấm cơ bản đạt, nhưng ở lượt phản công `"31.0"` thì ValueError. ECHO: "Dữ liệu mới mang hình dạng bạn chưa lường." Câu đó đúng mức, không lộ đáp án.
5. Tôi mở gợi ý 1, nhưng nó không giúp được gì. Tôi thử `float(tuoi) * 100 + …` thì ra float. ECHO: "Con số khớp. Hình dạng thì không." Câu này tốt.
6. `int(float(tuoi) * 100 + int(cap_do))` thì được 3 sao.

**Tôi có học được không?** Có, nhưng với điều kiện tôi đã biết sẵn `int()` và `float()` là hàm chuyển đổi. Một sinh viên chưa từng lập trình gần như chắc chắn cần gợi ý 3 và sẽ mất khoảng 8–10 lượt. Tôi không học `round()`, vì trò chơi không đòi.

**Phần kết, "Còn tiếp" và bản đồ.** Bản ghi KTS-03 ("Đừng tin tín hiệu nào mang mã 0xA7"), ECHO nói 0xA7 đến "từ một tầng mạng mà Vùng Tối không có", 0xA7 nói "Tôi sẽ đợi ở Cổng Kiểm Soát", rồi "CA ĐÊM · NX-0417" và "…Nhi." Đây là cliffhanger rất mạnh, nối lại đúng mã thẻ đã gặp trong phần mở đầu. **Độ tò mò: 5/5.** Màn "CHƯƠNG 1 · CÒN TIẾP" rõ ràng. Bản đồ hiện 12/12 sao, 4/6 thành phần và nhật ký Kiến Trúc Sư, và có thể xem lại từng đoạn truyện. Đây là phần thưởng tốt.

**Lỗi hình ảnh và giọng văn.**
- Thanh trạng thái mô phỏng ghi "Máy quét: CỔNG MỞ HOÀN TOÀN. Cổng mở hoàn toàn.", tức là lặp chữ (`47-l14-r6.png`).
- Trên bản đồ, thẻ 1.1 đè lên nhãn "LÔ 17" ở đáy (`52-map.png`). Ô "Dữ liệu sinh trắc" trong NEURAL-ID GIẢ bị gãy thành 4 dòng.
- Màn chặn vào level nào cũng ghi "Laptop offline đã khởi động. Kênh nhật ký hệ thống đang chờ giải mã." Từ 1.2 trở đi câu này không còn đúng với cảnh truyện.
- Bản tin 1.4 ngắn và khô hơn hẳn 1.1–1.3, không có giọng 0xA7 và không nhắc tên trạm hay nhân vật.

## Các vấn đề cần sửa, xếp theo mức độ

1. **[chặn] 1.4 đòi `int()` và `float()` như hàm chuyển đổi, nhưng không màn nào dạy trước; kiến thức chỉ có ở gợi ý mức 3.** Người mới thật sẽ kẹt sau 3–5 lượt mà không có hướng đi. *Đề xuất:* ở 1.3, cho một dòng mẫu trong mã (giống `print(type(ho_ten))`), ví dụ `print(int("5") + 1)`, hoặc một trường bắt buộc chuyển đổi. Ở 1.4, viết lại gợi ý 1 và 2 sao cho cụ thể dần: mức 1 là "chuỗi nhân 100 thì bị lặp lại, nhìn mô phỏng", mức 2 là "int và float không chỉ là tên loại, chúng còn là lệnh biến đổi". Cho ECHO một phản ứng riêng khi chuỗi bị nhân/lặp (`'1.721.72'`, `str (201 ký tự)`).
2. **[khó chịu] Panel ECHO, MỤC TIÊU và NHIỆM VỤ bị cắt ở 1280×800.** ECHO chỉ hiện khoảng 2 dòng, MỤC TIÊU bị cuộn sẵn với chữ cắt nửa dưới tiêu đề dính, NHIỆM VỤ chỉ hiện phần cuối (`10-l11-start.png`). Đây là màn hình laptop phổ biến nhất của sinh viên. *Đề xuất:* ưu tiên chiều cao cho ECHO (đặt chiều cao tối thiểu cho phần nội dung, hoặc thu gọn NHIỆM VỤ sau khi đọc xong). Cuộn mỗi panel về đầu khi vào màn. Thêm khoảng đệm phía trên để tiêu đề dính không che mục đầu tiên.
3. **[khó chịu] 1.2 cho 3 sao mà không cần mẫu "chép giá trị cũ trước khi gán lại".** `khu_cu = goi_2` qua được cả phần chấm cơ bản lẫn lượt phản công, trong khi KTS-05 ngay sau đó lại xoay quanh đúng ý này. *Đề xuất:* để lượt phản công tách giá trị cũ khỏi `goi_2`, ví dụ ki-ốt đã có sẵn `ma_khu` trong một dòng khóa, hoặc mã khu cũ không nằm trong bộ đệm. Như vậy chỉ `khu_cu = ma_khu` đặt trước phép gán lại mới đúng. Thêm phản ứng ECHO cho trường hợp `khu_cu` bằng giá trị mới ("Bạn chép nhãn sau khi nó đã bị dán đè").
4. **[khó chịu] ECHO bỏ lỡ những lỗi mang đúng khái niệm cần dạy và rơi về câu chung chung.** Ở 1.1, `print("PHIEN ma_phien")` chỉ nhận "lệch ở ký tự thứ 7". Ở 1.2, `khu_cu` sai chỉ nhận "Đọc lại thứ từng thiết bị đã nhận" hai lần liền. *Đề xuất:* thêm khóa phản ứng cho "tên biến nằm trong dấu nháy", tức đầu ra chứa đúng chữ của một tên biến (hiện đã có cho `so_hieu = "goi_3"` ở 1.2, nên mở rộng sang 1.1). Thêm khóa cho "giá trị bằng giá trị sau khi gán lại". Không lặp nguyên văn cùng một câu ở hai lượt liên tiếp.
5. **[khó chịu] Chọn tất cả (⌘A) rồi gõ hoặc dán vào editor bị bỏ qua mà không có phản hồi nào**, vì vùng chọn có dòng khóa (`12b-selectall.png`). Người chơi mất lượt và không hiểu tại sao. *Đề xuất:* khi một thay đổi chạm vào dòng khóa, áp phần thay đổi lên các vùng không khóa, hoặc ít nhất rung hay đổi màu dòng khóa kèm một dòng terminal kiểu "Dòng 3 bị khóa: chỉ sửa được phần còn lại".
6. **[khó chịu] Hộp kết quả che câu phản ứng của ECHO**, đúng câu quan trọng nhất về lượt phản công ("Nó được viết cho một phiên đã chết"). *Đề xuất:* đưa câu ECHO vào chính hộp kết quả, ít nhất khi sao thứ ba "CHƯA", hoặc hiện hộp lệch sang bên để panel ECHO vẫn nhìn thấy.
7. **[nhỏ] Thuật ngữ chưa được giải thích:** `str` ở 1.2 (trước khi 1.3 dạy), `tuple` ở 1.3, `str (201 ký tự)` ở 1.4, "–/4 lệnh" và "40% tàng hình" trên thanh cảnh báo (người mới không biết "lệnh" ở đây là câu lệnh). *Đề xuất:* ở 1.2 ẩn nhãn kiểu hoặc ghi "chữ"; dịch `tuple` thành "nhiều giá trị (dấu phẩy?)"; thêm tooltip một câu cho thanh cảnh báo.
8. **[nhỏ] Lệch nhỏ giữa mục tiêu và bộ chấm, cùng vài chỗ giọng văn:** mục tiêu 1.4 ghi "làm tròn 2 chữ số" nhưng không có `round()` vẫn đạt; tiêu đề 2 sao ở 1.4 là "Qua cổng"; chữ lặp "CỔNG MỞ HOÀN TOÀN. Cổng mở hoàn toàn."; màn chặn level nào cũng ghi "Laptop offline đã khởi động"; câu "…Nó không tìm ra bàn tay nào." tối nghĩa; nút gợi ý xác nhận hai lần nhưng tự hủy sau vài giây. *Đề xuất:* thêm một ca kiểm thử mà kết quả không làm tròn sẽ lệch (ví dụ chiều cao `"1.333"`); đổi tiêu đề thành "Cổng mở một nửa"; bỏ câu lặp; viết câu riêng cho từng màn chặn; giữ trạng thái xác nhận của nút gợi ý cho tới khi người chơi bấm chỗ khác.

Ngoài ra còn một nhận xét thiết kế, không phải lỗi: ngôi sao thứ ba ở cả bốn màn đều là cùng một bài "đừng viết cứng, OMNI sẽ đổi dữ liệu". Đến 1.3 thì tôi đã đoán trước được. Có thể giữ cơ chế này nhưng đổi kiểu phản công cho đa dạng hơn (đổi kiểu dữ liệu, đổi thứ tự, đổi độ dài).

## Câu hỏi còn mở

- Việc 1.2 chấp nhận `khu_cu = goi_2` là chủ ý hay sót? Nếu là chủ ý, nên viết lại KTS-05 cho khớp.
- Việc 1.4 không chấm `round()` là do dung sai float được đặt chủ ý hay là sót trong thiết kế ca kiểm thử?

Status: DONE
Summary: Đã chơi trọn mở đầu, 1.1–1.4, các đoạn chuyển cảnh, "Còn tiếp" và bản đồ, đạt 12/12 sao sau 23 lượt chạy và mở 2 gợi ý trong lúc chơi; phần truyện rất cuốn (độ tò mò 4–5/5). Vấn đề lớn nhất là 1.4 đòi `int()`/`float()` mà chưa màn nào dạy, cùng với các panel ECHO và mục tiêu bị cắt ở 1280×800 và 1.2 cho qua mà không cần học phép gán lại.

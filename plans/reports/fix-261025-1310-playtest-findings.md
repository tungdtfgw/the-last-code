# Sửa lỗi từ playtest mô phỏng người mới

- Ngày: 2026-10-25, giờ Asia/Saigon.
- Nguồn: `plans/reports/playtest-261025-1300-mo-phong-nguoi-moi.md`.
- Phạm vi: mục 1–7 của yêu cầu sửa, cộng hai quyết định người dùng đưa ra giữa chừng: (A) 1.2 giữ cách chấm theo giá trị, chỉ thêm phản ứng ECHO; (B) 1.4 đổi dữ liệu phản công để `round()` được chấm thật.
- Không đụng tới: tải Pyodide từ CDN, cách chấm của 1.2.
- Kiểm chứng: `npm run typecheck`, `npm test` (31 tệp, 334 test), `npm run test:py` (78 test), `npm run build`, cùng ảnh chụp Playwright headless trên dev server :5173 ở 1280×800, 1440×900, 1024×768 và 360×740. Không chạy e2e.

## 1. Panel bị cắt ở 1280×800

**Nguyên nhân** (đo trên dev server trước khi sửa: briefing `scrollTop` 210, mục tiêu 30, ECHO cao 97px trong khi nội dung cần 203px):
- `BriefingPanel` và `ObjectivesPanel` tự cuộn theo chữ trong lúc hiệu ứng mở đầu chạy, nhưng không cuộn lại khi hiệu ứng xong.
- `.col-mission > .objectives` có `flex-shrink: 0.25`. Khi chỉ còn mục tiêu co được, trình duyệt chỉ trừ 25% phần tràn, vì tổng hệ số co nhỏ hơn 1. Ở 1.2, cả cột vì thế tràn 108px và panel gợi ý bị đẩy khỏi màn hình.
- ECHO co ngang briefing, nên chỉ còn khoảng 2 dòng.

**Cách sửa:**
- Khi `intro` chuyển sang `done`, `GameScreen` đưa mọi `.panel` trong cột nhiệm vụ về `scrollTop = 0`. Trong lúc chữ đang gõ, việc tự cuộn vẫn chạy như cũ.
- CSS:
  - Briefing có `flex-shrink: 2` và `min-height: 112px`.
  - Mục tiêu giữ hệ số co mặc định là 1.
  - ECHO có `min-height: 156px`.
  - Khi màn hình cao từ 900px trở xuống, chân dung ECHO còn 72px để câu thoại có thêm chiều ngang.
- Trang vẫn không cuộn, và bố cục tab trên điện thoại giữ nguyên.

**Tệp:** `src/ui/game-screen.tsx`, `src/styles/global.css`.

**Bằng chứng (đo sau khi sửa):**
- 1280×800: cả bốn level có `col.scrollHeight == clientHeight` (700) và mọi panel `scrollTop` 0. Với 1.1: briefing 161px, mục tiêu 239px, ECHO 154px (hiện đủ 4 dòng). Ảnh: `…/scratchpad/fix/after2-1.1-1280x800.png`.
- 360×740: bố cục tab không đổi.
- 1024×768: cột nhiệm vụ vẫn cuộn như trước khi sửa, vì ô chỉ cao 312px, thấp hơn tổng chiều cao tối thiểu của các panel.

## 2. Chọn tất cả rồi gõ hoặc dán bị bỏ qua

**Nguyên nhân:** `lockFilter` trong `locked-lines-extension.ts` từ chối cả giao dịch hễ vùng sửa chạm vào khối khóa. Người chơi chỉ thấy một nhịp nháy.

**Cách sửa:**
- Với giao dịch `input.*` hoặc `delete.*`, hàm `editAroundBlock` viết lại thay đổi để nó áp quanh khối khóa:
  - Phần bị thay ở phía trên khối là `[from, newline trước khối)`, phần phía dưới là `[sau newline cuối khối, to)`.
  - Khối khóa và hai ký tự xuống dòng kề nó giữ nguyên.
  - Nếu đoạn dán có sẵn khối khóa (dán cả chương trình), phần đứng trước bản sao của khối đi lên trên, phần còn lại đi xuống dưới, nên khối không bị nhân đôi.
- Các thao tác vẫn bị chặn như cũ:
  - sửa chỉ nằm trong khối;
  - nối dòng;
  - undo/redo;
  - kéo-thả (`move.drop`);
  - thay đổi do chương trình tạo, không có user event.
- Hiệu ứng mới `lockedEditKept`: dòng khóa nháy và trình đọc màn hình đọc "Đã sửa phần còn lại. Dòng dữ liệu nạp sẵn được giữ nguyên." Không phát tiếng báo lỗi.

**Tệp:** `src/ui/locked-lines-extension.ts`, `src/ui/code-editor.tsx`, `src/ui/locked-lines-extension.test.ts` (7 test mới), `tests/e2e/level-1-4.spec.ts` (đổi tên test, thêm assert; chưa chạy).

**Bằng chứng:**
- Test đơn vị đều qua: dán cả chương trình (không nhân đôi), chọn tất cả rồi gõ, chọn tất cả rồi xóa, cắt từ dòng 1 tới dòng 6, dán bắt đầu từ trong khối, gõ hoặc dán chỉ trong khối (vẫn bị chặn), kéo-thả (bị chặn), undo trả về đúng tài liệu gốc.
- Trên dev server (1.1), ⌘A rồi chèn chương trình mới thì editor ra đúng chương trình mới, dòng 3 vẫn bị khóa.

## 3. Hộp kết quả che câu ECHO

**Nguyên nhân:** câu ECHO chỉ hiện trong panel, mà panel nằm dưới `<dialog>`.

**Cách sửa:** `ResultsDialog` nhận thêm prop `echo` và luôn hiện câu ECHO của lượt chạy, gồm cả câu bổ sung nếu có, trong khối `.results-echo` nằm dưới danh sách tiêu chí.

**Tệp:** `src/ui/results-dialog.tsx`, `src/ui/game-screen.tsx`, `src/styles/global.css`.

**Bằng chứng:** chạy 1.1 với mã phiên viết cứng thì được 2 sao, và hộp kết quả hiện "Trạm R-17 khởi động lại, phiên mới… Nó được viết cho một phiên đã chết." Ảnh: `…/scratchpad/fix/results-dialog.png`.

## 4. ECHO bỏ lỡ lỗi mang khái niệm, và lặp nguyên văn

**(a) Nguyên nhân:** `failureKey` không có khóa nào cho đầu ra chứa nguyên chữ của tên biến (1.1), hay cho ô chép giá trị sau khi nguồn đã bị gán lại (1.2).

**(a) Cách sửa:** thêm ba khóa tùy chọn. Mỗi khóa chỉ bật khi level có câu cho nó (`levelHasLine`), giống `value_is_label`.

| Khóa | Thay cho | Khi nào | Level |
|---|---|---|---|
| `output_is_label` | `output_mismatch` | Dòng sai đầu tiên chứa nguyên từ là tên của một input hoặc biến mục tiêu, mà dòng cần không chứa | 1.1 |
| `value_overwritten` | `wrong_value` | Mọi biến sai giá trị đều đang giữ giá trị hiện tại của một biến mục tiêu khác đã bị gán lại (dựa vào `var_history`) | 1.2, quyết định A |
| `string_repeated` | `ValueError`, `type_mismatch`, `wrong_value` | Một input dạng chữ (từ 2 ký tự trở lên) bị viết liền hai lần trong thông báo `ValueError`, hoặc trong preview của **mọi** biến sai | 1.4 (xem mục 5) |

Ghi chú về `value_overwritten`: 1.2 vẫn chấm theo giá trị, nên `khu_cu = goi_2` vẫn được 3 sao.

**(b) Nguyên nhân:** `selectReaction` chỉ phụ thuộc vào khóa của lượt hiện tại, nên hai lượt liền nhau cùng khóa nhận cùng một câu.

**(b) Cách sửa:**
- Thêm trường JSON tùy chọn `reaction_variants`, đã được validate: khóa phải hợp lệ, giá trị là chuỗi không rỗng, và khóa đó phải có câu chính.
- Lượt thứ chẵn trong một chuỗi cùng khóa dùng câu thay thế. Nếu level không có câu thay thế, ECHO thêm `REPEAT_PREFIX` ("Vẫn vậy. ") vào đầu câu.
- Đã viết câu thay thế cho các khóa hay lặp ở cả bốn level, trong đó có `wrong_value` của 1.2.
- Test chống lộ giờ quét cả `reaction_variants`. Nó đã bắt được hai câu nháp chứa "dấu nháy" và "nháy" (từ cấm của 1.1 và 1.2), và hai câu đó đã được viết lại.

**Tệp:** `src/game/classify-run.ts`, `src/game/level-types.ts`, `src/game/validate-level.ts`, `src/game/echo-reactions.ts`, `src/game/echo-forbidden-terms.test.ts`, `src/game/echo-reactions.test.ts` (3 test về luật không lặp), `src/levels/level-1-{1,2,3,4}.json`, `tests/integration/level-1-1.test.ts`, `tests/integration/level-1-2.test.ts`.

**Bằng chứng (chạy qua harness Python thật):**
- 1.1: `print("PHIEN ma_phien")` và `print("PHIEN", "ma_phien")` đều ra `output_is_label` (dòng 2, cột 7). `PHIEN K7Q3` vẫn là `output_mismatch`.
- 1.2: `ma_khu = goi_4` đặt trước `khu_cu = ma_khu` ra `value_overwritten` với `khu_cu`. Test cũ "quotes fixed, order still wrong" vẫn ra `wrong_value`, vì `the_quet` và `the_cong` sai theo kiểu khác.

## 5. 1.4 chưa dạy int()/float()

**Nguyên nhân:**
- Gợi ý 1 lặp lại câu vào màn.
- Gợi ý 2 ("Thứ tự chuyển đổi… quan trọng") không cho biết Python có sẵn công cụ đổi hình dạng.
- ECHO không có câu nào cho trường hợp chữ bị nhân thành chuỗi lặp.

**Cách sửa:**
- Gợi ý 1 chỉ vào chuỗi bị lặp trong mô phỏng: nhân chữ với 100 thì chữ được chép nối tiếp 100 lần.
- Gợi ý 2 nói Python có sẵn công cụ đổi hình dạng, mỗi công cụ mang tên của hình dạng nó tạo ra (cũng là tên làn), và cần đổi trước rồi mới tính. Gợi ý này không đưa code.
- Thêm phản ứng `string_repeated` cùng câu thay thế. Hai câu không nhắc `int`, `float`, `round` hay đáp án, đã qua test chống lộ.
- Code gốc vẫn nhận câu `type_mismatch` (AC 8), vì `hop_le = "True"` không phải chuỗi lặp.
- Không đổi 1.3.

**Tệp:** `src/levels/level-1-4.json`, `src/game/classify-run.ts`, `tests/integration/grading-pipeline.test.ts`.

**Bằng chứng:** cả ba trường hợp sau đều ra `string_repeated`:
- `int(tuoi * 100 + cap_do)`: kiểu đúng nhưng chữ số bị lặp.
- `float(chieu_cao * 2)`: `ValueError` với `'1.721.72'` ở dòng 10.
- Code gốc đã sửa `hop_le`: hai biến số đều là chuỗi lặp.

## 6. Thuật ngữ chưa giải thích

**Cách sửa:**
- Thêm `src/game/type-gloss.ts`, một bảng nghĩa ngắn cho mỗi tên kiểu, chỉ giải thích nghĩa của từ, không chỉ cách viết giá trị. Ví dụ: `str`: chữ (chuỗi ký tự), `tuple`: nhiều giá trị ghép lại bằng dấu phẩy, `NoneType`.
- Tooltip `title` trên chip kiểu ở ô Mục tiêu (gồm `str` của 1.2) và trên chú giải màu của mô phỏng. Tên kiểu vẫn giữ nguyên.
- Terminal ghi nghĩa cho hình dạng ngoài bốn làn: `chieu_cao: tuple (nhiều giá trị ghép lại bằng dấu phẩy), yêu cầu float`.
- Thanh cảnh báo:
  - Giá trị đổi thành "–/4 câu lệnh".
  - Tooltip ở đầu thanh giải thích câu lệnh là gì, rằng dòng khóa không tính, và vượt 100% thì bị Sentinel bắt.
  - Tooltip ở mốc "40% tàng hình" ghi "Đến N câu lệnh (40%), OMNI chưa nhận ra bạn."

**Tệp:** `src/game/type-gloss.ts`, `src/ui/objectives-panel.tsx`, `src/ui/level-simulation.tsx`, `src/game/terminal-lines.ts`, `src/game/terminal-lines.test.ts`.

## 7. Câu chữ lệch

| Chỗ lệch | Nguyên nhân | Cách sửa | Tệp |
|---|---|---|---|
| "CỔNG MỞ HOÀN TOÀN. Cổng mở hoàn toàn." | `summarize()` (câu cho trình đọc màn hình) luôn nối thêm câu về cổng | Bỏ câu về cổng khi trạng thái đã nói điều đó | `scanner-timeline.ts` và test của nó |
| Tiêu đề 2 sao của 1.4 là "Qua cổng" | Từ vựng của scanner | Đổi thành "Cổng mở một nửa", giống các sim khác | `sim-vocabulary.ts` |
| Màn chặn luôn ghi "Laptop offline đã khởi động" | Chuỗi viết cứng | Đổi sang câu trung tính cho mọi level: "Kai mở laptop offline. Kênh nhật ký hệ thống đang chờ giải mã." (dòng phía trên đã ghi địa điểm của level) | `intro-gate.tsx` |
| "…Nó không tìm ra bàn tay nào." | Câu tối nghĩa | "…OMNI không tìm ra dấu tay nào trên hồ sơ." | `level-1-2.json`, GDD 1.2 |
| Nút gợi ý tự hủy bước xác nhận sau 5 giây | `setTimeout(5000)` | Giữ bước xác nhận tới khi bấm chỗ khác hoặc nhấn Esc; chú thích ghi "bấm chỗ khác để hủy" | `hints-panel.tsx` |

Màn báo lỗi tải Python đã có sẵn nút "Thử lại" (`BootScreen`, `onRetry`), nên không đổi.

## B. 1.4 chấm việc làm tròn (quyết định người dùng)

**Nguyên nhân:**
- Lượt cơ bản: `1.72 × 2 = 3.44` đã tròn.
- Lượt phản công: `1.65 × 2 = 3.3` cũng đã tròn.
- Vì vậy không lượt nào bắt được việc thiếu `round()`.

**Cách sửa:**
- Dữ liệu phản công đổi `chieu_cao` thành `"1.653"`, kỳ vọng `chi_so` là 3.31. Kiểm bằng python3: `float("1.653")*2` cho `3.306`, `round(…, 2)` cho `3.31`.
- Dữ liệu cơ bản giữ nguyên 27 / 1.72 / 3.

**Tệp:**
- `src/levels/level-1-4.json`
- `src/game/terminal-lines.test.ts` và `src/game/classify-run.test.ts` (đầu vào phản công)
- `design/gdd.md` (JSON mẫu)
- `design/chuong-1/gdd-1.4-tin-hieu-lech-pha.md` §7: dữ liệu mới, thêm gạch đầu dòng "Quên làm tròn"; lời giải 3 sao vẫn là `round(float(chieu_cao) * 2, 2)`

Không spec e2e nào assert giá trị phản công cũ.

**Bằng chứng (integration):**
- Bỏ `round()`: `wrong_value_counter`, 2 sao, `vars: chi_so`.
- Giữ `round()`: `three_stars`.

## Tài liệu đã cập nhật

- `design/gdd.md` §4.1: thêm luật không lặp câu.
- `design/chuong-1/gdd-1.1…1.4`: khóa mới, câu thay thế, gợi ý 1.4, câu 3 sao của 1.2, dòng terminal `tuple` của 1.3.
- `docs/nhat-ky-loi-prototype-1-4.md`: thêm 4 dòng ở mục 1 và 4 dòng ở mục 3.

## Còn lại

- Các spec e2e đã sửa (`level-1-4.spec.ts`, test dòng khóa) chưa chạy, theo đúng yêu cầu.
- Tooltip `title` không hiện trên màn hình cảm ứng. Trên điện thoại, nghĩa của tên kiểu chỉ có ở terminal (với hình dạng lạ) và ở gợi ý.
- Ở 1024×768, cột nhiệm vụ vẫn tự cuộn như trước khi sửa, vì ô quá thấp so với tổng chiều cao tối thiểu của các panel.

Status: DONE

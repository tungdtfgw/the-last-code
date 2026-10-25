# Cook report: Level 1.3 "Bốn loại tín hiệu"

Plan: `plans/261025-0928-level-1-3-bon-loai-tin-hieu/plan.md` (phase 1 → 6, chạy tự động `--auto`, bỏ bước journal).
Ngày: 25/10/2026.

## Đã làm

- **Phase 1 – schema, validator.**
  - `level-types.ts`:
    - `BASE_TYPES` (bốn kiểu có màu); `VALUE_TYPES = [...BASE_TYPES, "type"]`;
    - `InputValue = string | number | boolean` cho `TestCase.inputs`, `HarnessTestResult.inputs`, `RunOutcome.counterInputs`;
    - khóa `type_mismatch_unknown_shape`;
    - `SIMULATION_KINDS` thêm `sorter`.
  - `validate-level.ts`:
    - mục tiêu `type` phải kỳ vọng một trong bốn tên kiểu;
    - đầu vào test là chuỗi, số hữu hạn hoặc bool, lỗi nêu `field[i].inputs.<tên>`; có ghi chú về `2.0`;
    - `checkSorter`: tối đa 5 mục tiêu biến, mỗi kiểu một khe (thêm sau review).
- **Phase 2 – harness.** Mục tiêu `type`:
  - `type_ok = type(v) is type`; `value_ok = v is TYPE_MAP[expected]`, với `TYPE_MAP` được chụp trước khi chạy code người chơi;
  - `_preview` của một kiểu cho `<class 'int'>`, lớp của người chơi cho `<class '__main__.X'>`;
  - chuỗi `"int"` hoặc `"<class 'int'>"` được tính là khớp nội dung nhưng sai kiểu;
  - helper `_name_of` đọc tên lớp qua descriptor của `type` và `str.__str__`, nên không bao giờ chạy `__str__`/`__add__` của người chơi. Helper này cũng thay cho ba chỗ cũ (`_describe`, `_VarHistory`, preview `<X>`).
- **Phase 3 – phân loại, terminal, màu.**
  - `classify-run.ts`: thêm `type_mismatch_unknown_shape` khi mọi biến sai kiểu đều mang hình dạng ngoài `int|float|str|bool|type`, chỉ trả khi level có câu cho khóa này (qua `levelHasLine`).
  - Module mới `python-literal.ts` (`formatPyLiteral`, `pyTypeOf`), dùng ở terminal, `inputsLabel` (máy quét, trạm) và bộ đệm ki-ốt.
  - Tông `shape` (`--type-shape`) cho chip mục tiêu `type`.
  - `sim-vocabulary` có thêm mục `sorter` (RÀO SÂN GA, "nhật ký máy phân loại").
- **Phase 4 – dữ liệu.**
  - `src/levels/level-1-3.json` chép từ GDD §14, chỉ đổi hai chỗ theo hợp đồng: `simulation: {kind: "sorter"}` và `forbidden_terms`.
  - Không phải sửa câu chữ nào: kiểm tra rò rỉ qua ngay. 27 và 1.72 giữ nguyên.
  - Test tích hợp `tests/integration/level-1-3.test.ts` chạy harness thật.
- **Phase 5 – máy phân loại.**
  - `sorter-timeline.ts` (thuần), theo bảng đường đi GDD §5:
    - gói sai làn chạy dọc làn của hình dạng thật rồi mới rơi thùng;
    - tuple màu xám, rơi thẳng;
    - con dấu lục giác KHỚP/LỆCH KHUÔN, chạy cuối và giữ 900 ms;
    - thẻ mã phiên đổi tông khi phản công;
    - lỗi Python: gói không rời băng chuyền.
  - `sorter-simulation.tsx`: SVG 420×470, phát lại bằng `use-timeline-playback.ts`. Chữ nhãn dữ liệu 16 đơn vị; nhãn mục dùng `sim-label` 12 px như các mô phỏng khác.
  - Nhánh `sorter` trong `LevelSimulation`; chú giải bốn màu hiện cho cả `sorter`.
- **Phase 6 – e2e, tài liệu.**
  - E2E mới: `tests/e2e/level-1-3.spec.ts`, một test.
  - E2E sửa:
    - `story-flow.spec.ts`: 1.3 khóa sau 1.2, 1.4 khóa sau 1.3, nút "đang giải mã" chuyển sang 1.5, tổng sao `3/12`;
    - `level-1-2.spec.ts`: sau `after-1.2` bấm Esc vào cổng 1.3.
  - Hằng `L13_*` trong `helpers.ts`.
  - Tài liệu: `CLAUDE.md` (Levels are data, danh sách timeline), `README.md` (luồng chơi, bốn level), một dòng về `2.0` trong `docs/nhat-ky-loi-prototype-1-4.md`.
  - Plan và các phase đã đánh dấu `completed`.

## Lệch so với plan (và lý do)

1. **Khóa rơi về được xử lý ở `classify-run.ts` (`levelHasLine`), không qua `REACTION_FALLBACK` ở `echo-reactions.ts`.** Đây là cơ chế 1.2 đã dựng và người dùng yêu cầu dùng lại. Vì vậy ca "1.4 không có khóa → `type_mismatch`" nằm trong `classify-run.test.ts`, không ở `echo-reactions.test.ts`.
2. **Không có thư mục `tests/fixtures/solutions/1.3/`.** Code chơi được dựng ngay trong test từ `starter_code` (thay từng dòng), giống 1.1 và 1.2.
3. **Lượt chạy 2 sao có 6 câu lệnh** (giữ dòng `print(type(ho_ten))`). GDD §7 ghi "5–6"; kỳ vọng `≤ 7` vẫn đúng.
4. **Preview của tuple là `<tuple>`, không phải `(1, 72)`.** Harness không bao giờ gọi `repr` trên kiểu không nguyên thủy; giữ nguyên chính sách an toàn đó.
5. **Preview của một biến giữ một lớp đổi từ `<type>` thành `<class 'X'>` ở mọi level** (reviewer nêu). Đây là cách Python in, nên chấp nhận. Không thay đổi cách chấm của level nào; không test cũ nào phụ thuộc chuỗi cũ.
6. **`LANES` có thứ tự riêng `str, int, float, bool`** (GDD §5: từ trên xuống), khác thứ tự `BASE_TYPES`. Lỗi này được bắt khi kiểm tay.
7. **Ngoài plan:**
   - thêm `checkSorter` vào validator, kèm một ca test (reviewer: bố cục chỉ có 5 hàng, mỗi làn một khe);
   - thêm test "the shipped chapter" trong `progression.test.ts`. Trước đó chưa test nào chạy luật chương trên registry thật, cũng như sự khớp giữa câu teaser "Bốn thành phần. Còn hai." và thanh 6 ô có 4 ô sau 1.4.
8. **Ca 1.1 "a simulation that is not built" đổi `sorter` thành `metro`**, vì `sorter` giờ đã có cảnh. Ý của test giữ nguyên.
9. **Bước simplify của cook bị bỏ qua**, cùng lý do như 1.2: diff so với HEAD lẫn thay đổi chưa commit của các phiên trước.

## Test (số thật)

| Lệnh | Trước (sau 1.2) | Sau |
|---|---|---|
| `npm run typecheck` | sạch | sạch (có phủ `tests/e2e`) |
| `npm test` | 29 file, 294 test | **31 file, 316 test**, qua hết |
| `npm run test:py` | 72 | **78**, OK |
| `npm run test:py:3.14` | 72 | **78**, OK |
| `npm run build` | qua | qua (cảnh báo chunk > 500 kB có từ trước) |
| E2E | | **đã viết, chưa chạy** (theo yêu cầu) |

Test mới:
- `test_harness.py` lớp `TypeObjective`, 6 test:
  - đầu vào số và chuỗi nạp đúng kiểu, `type(ma_phien)` qua cả hai lượt;
  - `int` chép tay trượt phản công;
  - tên kiểu viết thành chuỗi chỉ khớp nội dung;
  - `type`, `type(None)` đúng loại nhưng sai giá trị;
  - `int = 5` và metaclass có `__repr__` treo;
  - lớp người chơi tên `int`, và `__name__` là lớp con của `str`.
- `validate-level.test.ts`: 1.3 hợp lệ, đầu vào bool hợp lệ; từ chối kiểu `"list"`, đầu vào object, đầu vào null, hai mục tiêu cùng một làn.
- `classify-run.test.ts`, 2 test: khóa hình dạng lạ, và 1.4 rơi về `type_mismatch`.
- `terminal-lines.test.ts`, 2 test: năm dòng theo GDD §6; dòng phản công hiện `"7351"`, `4096`, `True`.
- `tests/integration/level-1-3.test.ts`, 6 ca với harness thật:
  - code gốc;
  - chỉ còn tuple → `type_mismatch_unknown_shape`;
  - chỉ còn `"27"`, và khuôn là chuỗi → `type_mismatch_value_match`;
  - 2 sao `wrong_value_counter`;
  - 3 sao.
- `sorter-timeline.test.ts`, 4 ca (GDD §13 #29): gói tuple, con dấu khớp và lệch, biến thiếu, lỗi Python.
- `progression.test.ts`, 2 test: chuỗi chương thật; 4/6 thành phần khớp câu teaser.
- E2E:
  - mới: `level-1-3.spec.ts`;
  - sửa: `story-flow.spec.ts`, `level-1-2.spec.ts`.

`echo-forbidden-terms.test.ts` không phải sửa: nó lặp qua mọi level đã đăng ký nên tự phủ 1.3, gồm `entry` và các nhịp `echo` của `outro_beats`.

## Luồng chương

title → prologue → 1.1 → after-1.1 → 1.2 → after-1.2 → **1.3 → after-1.3** → 1.4 → after-1.4 → teaser → map.

Đã kiểm bằng:
- `progression.test.ts` ("the shipped chapter");
- chơi tay trên dev server :5173 của người dùng (không bật hay tắt server nào): hộp kết quả 3 sao → `#/story/after-1.3` (đúng câu outro) → Esc → cổng "VÀO NHIỆM VỤ" của 1.4.

Bản đồ hiện tổng sao `/12`, ô Neural-ID 3/6 sau 1.3. Sau 1.4 thanh có 4/6 ô, khớp câu "Bốn thành phần. Còn hai."

## Kiểm tay (Chrome, :5173)

- **Code gốc:** đúng GDD §6.
  - `ho_ten` khóa vào làn vàng.
  - `tuoi`, `da_tiem` ghi "SAI LÀN: str ≠ …"; `chieu_cao` "KHÔNG RÕ HÌNH DẠNG"; `khuon_phien` "SAI LÀN: int ≠ type".
  - Terminal có các dòng "MÁY QUÉT TỪ CHỐI"; ĐẦU RA là `<class 'str'>`.
  - ECHO nói câu `type_mismatch`.
- **`khuon_phien = int`:** 2 sao, "Rào mở một nửa". Phản công: thẻ `ma_phien = "7351"` màu vàng, con dấu `int` LỆCH KHUÔN.
- **`type(ma_phien)`:** 3 sao, "Rào mở hoàn toàn", con dấu `str` KHỚP KHUÔN, "Đã thu: Khuôn kiểu".
- Console không có lỗi.

## Review

Đã chạy agent `code-reviewer` (độc lập, chỉ đọc). Không có lỗi Critical hay High; cách chấm của 1.1, 1.2 và 1.4 không đổi. Đã xử lý:
- **Medium:** preview mới có thể chạy `__str__` của người chơi qua `__name__`. Đã sửa bằng `_name_of`, có test.
- **Medium:** validator chưa giới hạn bố cục máy phân loại. Đã thêm `checkSorter`.
- **Low:** lớp người chơi tên `int` trông như `int` thật. Nay hiện là `__main__.int`, con dấu màu xám.
- **Low:** lõi Python sụp khi phản công hiện thành "TIẾN TRÌNH BỊ CẮT". Nay là "LÕI PYTHON KHÔNG PHẢN HỒI".
- **Medium (chấp nhận, không sửa):** preview `<class 'X'>` áp cho mọi level. Xem lệch 5.
- **Low (không thêm):** test timeline cho phản công lỗi, treo, Sentinel. Reviewer đã thử 13 ca qua harness thật và đều đúng. Theo chính sách test tối thiểu, chỉ giữ 4 ca plan yêu cầu.

## Còn mở

- **Chạy e2e** (chưa chạy theo yêu cầu): `npx playwright test tests/e2e/level-1-3.spec.ts tests/e2e/level-1-2.spec.ts tests/e2e/story-flow.spec.ts --project=chromium`, rồi `npm run test:e2e`.
- **Chưa kiểm ở 360 px và với giảm chuyển động (AC 11).** Cửa sổ Chrome không đổi cỡ được, như các phiên trước. Phần thiết kế đã lo:
  - cùng viewBox co theo bề rộng;
  - nhãn cắt bằng "…";
  - chuyển động chỉ dùng `transition`, bị tắt bởi khối giảm chuyển động chung;
  - hook hiện khung cuối ngay.
- **Tiến độ trong trình duyệt của người dùng bị đổi.** Lúc kiểm tay, `localStorage` của `localhost:5173` ghi 1.3: 3 sao, 3 lượt chạy, cùng bản nháp editor 1.3 và `after-1.3` đã xem. Muốn chơi lại thì xóa khóa `the-last-code:progress:v1` hoặc bấm KHÔI PHỤC MÃ GỐC.
- **Có từ trước, không thuộc 1.3:** nhiều câu lệnh nối bằng `;` trên một dòng chỉ tính là một câu lệnh, nên thanh cảnh báo bị lách được. Cần một ticket riêng.

# Cook report: Level 1.2 "Gán nhãn"

Plan: `plans/261025-0928-level-1-2-gan-nhan/plan.md` (phase 1 → 6, chạy tự động `--auto`, bỏ bước journal).
Ngày: 25/10/2026.

## Đã làm

- **Phase 1 – dữ liệu, schema.**
  - `src/levels/level-1-2.json` chép nguyên GDD 1.2 §16, không đổi chữ.
  - `level-types.ts`: thêm khóa `value_is_label`, `SIMULATION_KINDS` thêm `kiosk`, kiểu `{ kind: "kiosk"; devices: string[] }`.
  - `validate-level.ts` có `checkKiosk`: 1–3 thiết bị, không trùng, đều là biến mục tiêu, còn 1–6 ô nhớ. Lỗi nêu tên trường.
  - Kiểm chống lộ (`echo-forbidden-terms.test.ts`) tự phủ 1.2 và qua ngay, kể cả cụm có dấu ("nháy", "hoa thường"). Không phải sửa câu nào.
- **Phase 2 – harness.**
  - Lớp `_VarHistory` trong `harness.py`, chỉ bật khi config có `trace_vars`. Nó ghi `{line, var, type, preview, src}`, so theo `is`, xem trước bằng `_preview` (không gọi `__eq__`/`__repr__` của người chơi), bọc `try` nên không bao giờ ném lỗi ra tracer.
  - Giới hạn `var_history_max = 40` trong `DEFAULT_LIMITS`. Ghi thêm một lần sau `exec`, kể cả khi chương trình lỗi.
  - `harness-types.ts` thêm `VarHistoryEntry`. `build-config.ts` đặt `trace_vars: simulationOf(level).kind === "kiosk"`.
- **Phase 3 – chấm.** `classify-run.ts`:
  - `value_is_label` được kiểm sau nhánh kiểu sai, trước `wrong_value`. `vars` chỉ gồm các biến có giá trị là chữ của một tên.
  - `RunOutcome` thêm `history`, `historyTruncated`, `counterHistory`, `counterHistoryTruncated`.
- **Phase 4 – `kiosk-timeline.ts` (thuần).**
  - Phát lại theo lịch sử: mỗi nhịp 350 ms; phản công 150 ms.
  - Dây nối bộ đệm theo `src`. Bóng mờ bay tới ô giữ cùng preview, sống khoảng 1 s.
  - Lỗi chạy: ô đang ghi (tên bên trái `=` trên dòng traceback cuối) bị nhiễu. Lỗi biên dịch: không ô nào được ghi.
  - Thiếu lịch sử: hiện giá trị cuối. Lịch sử bị cắt: thêm khung "LỊCH SỬ BỊ CẮT".
  - Đối chiếu từng ô; drone `patrol`/`hover`/`locked`; phản công hiện `LỆCH MẪU`.
  - Có `summarizeKiosk` cho trình đọc màn hình.
- **Phase 5 – UI.**
  - `kiosk-simulation.tsx`: SVG dọc gồm dải BỘ ĐỆM 0xA7, lưới 2 cột ô nhớ có thẻ nhãn, màn thiết bị, cổng khu và drone. Dây đi theo "bus" ở khe giữa hai cột. Có `<title>` cho mỗi ô, `data-testid="kiosk"`, `data-slot`/`data-verdict`.
  - Phát lại qua `use-timeline-playback.ts` (hook của 1.1).
  - Thêm nhánh `kiosk` trong `level-simulation.tsx` và mục `kiosk` trong `sim-vocabulary.ts` (terminal "nạp hồ sơ vào ki-ốt", "CỔNG KHU", tiêu đề hộp kết quả).
  - CSS `.kiosk-*` chỉ dùng token sẵn có, có nhánh giảm chuyển động.
- **Phase 6 – tài liệu.**
  - `CLAUDE.md`: thêm dòng, không viết lại. Gồm `var_history`/`trace_vars`, khóa tùy chọn và `levelHasLine`, ki-ốt trong danh sách timeline/component, `kiosk.devices`.
  - `README.md`: luồng chơi có 1.2.
  - GDD 1.2: sửa §15 #10 theo NFC và §13 thêm `src`.
  - Plan và phase đã đánh dấu xong.

### Chỗ đặt logic "chỉ trả khóa khi level định nghĩa" (cho 1.3)

`src/game/classify-run.ts`, hàm `levelHasLine(level, key)`, có chú thích là cửa duy nhất cho mọi khóa tùy chọn. `value_is_label` gọi nó trong `failureKey`. Khi 1.3 thêm `type_mismatch_unknown_shape`, gọi cùng hàm đó trong nhánh `wrongType`; không có dòng thì rơi về `type_mismatch`.

## Lệch so với plan (và lý do)

1. **Không có thư mục fixture `tests/fixtures/solutions/1-2/`.** Test tích hợp 1.2 dựng mã ngay trong file test bằng `withLines`/`withBody`, giống `tests/integration/level-1-1.test.ts` của 1.1. Như vậy dùng chung một cách viết và mã khởi đầu luôn lấy từ JSON thật.
2. **`kiosk-timeline.test.ts` chạy harness thật** (`runHarness`, như `relay-timeline.test.ts` của 1.1) thay vì dựng `RunOutcome` bằng tay. Ca "thiếu lịch sử" dùng bản sao level không phải kiosk để harness không ghi lịch sử. Ít dữ liệu giả hơn.
3. **Cờ `var_history_truncated` chỉ bật khi thật sự có thay đổi thứ 41 bị bỏ**, không bật ngay khi đủ 40 mục. Đúng nghĩa "đã cắt".
4. **Màn thiết bị cắt chữ sau 26 ký tự, ô nhớ sau 14** (GDD nói 14 cho mọi chỗ). Màn thiết bị rộng 300 đơn vị viewBox và giá trị như `'ĐỖ MINH AN / K-07'` dài 19 ký tự; cắt ở 14 sẽ che mất phần mã khu, mà đó chính là bài học. Toàn văn vẫn nằm trong `<title>`.
5. **Tiêu đề màn thiết bị** lấy phần trước dấu `:` của `objectives[].label`, viết hoa ("MÁY QUÉT DRONE ĐỌC", "CỔNG KHU ĐỌC"). Không viết cứng tên thiết bị.
6. **Phản công không có khung đối chiếu từng ô**: verdict gán một lần ở khung cuối, để lượt phản công nhanh như GDD mô tả.
7. **Dây đi theo "bus" ở khe giữa** thay cho đường cong thẳng: khi xem tay, dây cong tới hàng ô dưới cắt ngang các ô hàng trên. Vì vậy `ROW_GAP` tăng lên 100.
8. **Test thêm ngoài plan**: không có. Bỏ ca `forbidden_terms` sai kiểu vì 1.1 đã có ca đó.
9. **Bước "simplify" của cook bị bỏ qua.** Diff so với HEAD lẫn rất nhiều thay đổi chưa commit của người dùng và của các phiên trước, nên đo ngưỡng theo diff không có nghĩa.

## Test (số thật)

| Lệnh | Trước | Sau |
|---|---|---|
| `npm run typecheck` | sạch | sạch (có phủ `tests/e2e`) |
| `npm test` | 27 file, 275 test | **29 file, 294 test**, qua hết |
| `npm run test:py` | 67 | **72**, OK |
| `npm run test:py:3.14` | 67 | **72**, OK |
| `npm run build` | qua | qua (cảnh báo chunk > 500 kB có từ trước) |
| E2E | | **đã viết, chưa chạy** (theo yêu cầu) |

Test mới:
- `validate-level.test.ts`: 1.2 hợp lệ, cộng 5 ca bị từ chối (`devices` rỗng, trùng, không phải mục tiêu, không còn ô nhớ, `kind` lạ).
- `test_harness.py` lớp `VarHistory`, 5 test:
  - dòng khớp editor tới dòng lỗi;
  - `src` theo identity (bộ đệm, gõ tay, gói bị gán đè);
  - giới hạn 40 mục và cờ cắt;
  - không chạy dunder của người chơi, ghi `del`;
  - tắt mặc định ở 1.4, và bật/tắt không đổi `vars`/`line_count`/`status`.
- `tests/integration/level-1-2.test.ts`, 6 test với harness thật:
  - code gốc;
  - sửa tên → `value_is_label`;
  - sửa dấu nháy → `wrong_value`, lịch sử đúng thứ tự (AC 9);
  - 3 sao, 9 câu lệnh, `src` của phản công;
  - hai lời giải gõ tay → 2 sao, `wrong_value_counter`.
- `classify-run.test.ts`, 2 test: GDD #6, #7, và chỉ nêu các biến bị nhầm nhãn.
- `kiosk-timeline.test.ts`, 4 test: thứ tự, dây và bóng; lỗi chạy và lỗi biên dịch; thiếu hoặc cắt lịch sử; phản công mồi và 3 sao.
- E2E:
  - mới: `tests/e2e/level-1-2.spec.ts`;
  - `helpers.ts`: thêm `L12_FROM_LINE`, `L12_SOLUTION_3_STARS`;
  - `story-flow.spec.ts`: 1.2 khóa sau 1.1, 1.4 khóa sau 1.2, 1.3 là nút "đang giải mã", tổng sao `3/9`;
  - `level-1-1.spec.ts`: sau `after-1.1` vào đúng `#/level/1.2`.

Luồng chương (prologue → 1.1 → after-1.1 → 1.2 → after-1.2 → 1.4) đã có test trong `progression.test.ts` (ca "1.1, 1.2 and 1.4 built (1.3 missing)"). Không cần thêm test.

## Chi phí `var_history`

Chi tiết trong `plans/reports/bench-261025-1211-var-history.md`. Trung vị của 7 lần; số đo trên Pyodide 3.14.2 (Chrome, M4 Pro):
- Lời giải: không thấy chênh lệch.
- `while True: ma_khu = goi_4`: **+277 ms** (307 → 584 ms).
- Lịch sử đầy 40 mục: +17 ms.

Trên CPython, ca xấu nhất thêm 26 ms (3.13) và 22 ms (3.14). Kết quả nằm trong ngưỡng (≤ 300 ms, tổng < 2 s) nên không áp bậc lùi, nhưng đã dùng 92% ngưỡng.

## Kiểm tay

Kiểm trên dev server :5173 người dùng đang chạy; không bật hay tắt server nào.
- **Code gốc:** đúng `TRUY VẾT: dòng 13 — NameError`, 4/11 lệnh, 15%. Ba ô đầu có giá trị, có dây cho `ho_ten`/`ma_khu`, không có dây cho `'goi_3'`. Màn máy quét drone nhiễu đỏ.
- **Sửa tên và dấu nháy:** hai màn thiết bị giữ `… / K-12` trong khi `ma_khu` là `'K-07'`. Ô `khu_cu` có `'K-07'` và báo SAI GIÁ TRỊ.
- **Gõ tay `"AN-5521"`:** phản công đổi bộ đệm sang LÊ VĂN TỊNH. `so_hieu` và `the_cong` báo LỆCH MẪU, `so_hieu` không có dây. Cổng sập về nửa, 2 sao, hộp kết quả "Cổng khu mở một nửa", "Đã thu: Hồ sơ danh tính".
- Console không có lỗi.

## Còn mở

- **Chạy e2e** (chưa chạy theo yêu cầu): `npx playwright test tests/e2e/level-1-2.spec.ts tests/e2e/level-1-1.spec.ts tests/e2e/story-flow.spec.ts --project=chromium`, rồi `npm run test:e2e`.
- **Chưa kiểm tay ở 360 px và với giảm chuyển động (AC 11).** Cửa sổ Chrome không đổi cỡ được, như phiên 1.1. Phần thiết kế đã lo:
  - cùng viewBox; ô cắt `…` ở 14 ký tự;
  - khung cuối không có bóng;
  - CSS tắt animation dây, drone, nhiễu khi giảm chuyển động.

  Project `mobile-chromium` sẽ chạy spec 1.2.
- **Tiến độ trong trình duyệt của người dùng bị đổi.** Lúc kiểm tay, `localStorage` của `localhost:5173` đã ghi 1.2: 2 sao, 3 lượt chạy, cùng bản nháp editor 1.2 (lời giải gõ tay). Muốn chơi lại từ đầu thì xóa khóa `the-last-code:progress:v1` hoặc bấm KHÔI PHỤC MÃ GỐC.
- **Ca `while True` của `var_history` đã dùng 92% ngưỡng.** Nếu máy yếu hơn thấy chậm, áp bậc lùi 1 của phase 2.
- **Chưa chạy agent review riêng.** Đã tự soát: thứ tự khóa, lượt phản công không bị `value_is_label`, tracer không ném lỗi, 1.4 không đổi (test cũ xanh, test Python khẳng định không có `var_history`).

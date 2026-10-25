# Cook report: Level 1.1 "Khởi động" và phần engine dùng chung

Plan: `plans/261025-0928-level-1-1-khoi-dong/plan.md` (phase 1 → 5, chạy tự động `--auto`, bỏ bước journal).
Ngày: 25/10/2026.

## Đã làm

- **Phase 1 – schema, validator, từ cấm, dữ liệu.**
  - `level-types.ts`: mục tiêu là hợp `VarObjective | OutputLineObjective`; thêm `varObjectives`, `outputObjectives`, `isOutputObjective`.
  - Thêm `TestCase.expected_output`, `SIMULATION_KINDS = ["scanner", "relay"]`, `simulation`/`simulationOf`, `forbidden_terms` và 4 khóa phản ứng `output_*`.
  - `validate-level.ts` kiểm:
    - dòng đầu ra phải là 1..N;
    - `expected_output` đúng N dòng, không xuống dòng, không khoảng trắng cuối;
    - `simulation` theo `kind`, `relay` bắt buộc có `station` ≤ 12 ký tự;
    - `forbidden_terms`;
    - `outro_beats` theo bộ từ cấm mới.
  - `echo-leaks.ts` viết lại thành `levelLeaks` + `findEchoLeak(text, leaks)`: ranh giới chữ Unicode, cộng dồn từ cấm, coi dòng đầu ra là đáp án, NFC.
  - `src/levels/level-1-1.json` chép từ GDD §14; chỉ đổi `simulation` thành `{ "kind": "relay", "station": "R-17" }`.
- **Phase 2 – harness.**
  - Tham chiếu riêng `_normalize = unicodedata.normalize`; NFC cho biến `str`.
  - stderr có bộ đệm riêng (trả về `stderr`).
  - `_grade_output` không bao giờ ném lỗi; trả `lines[]` (ok/wrong/missing, `col`, `case_only`), `extra_lines` ≤ 3, `extra_count`, `truncated`, `ok`.
  - `_passed` xét cả đầu ra. `harness-types.ts` cập nhật theo.
- **Phase 3 – phân loại, terminal.**
  - `classify-run.ts`: thêm `output`, `counterOutput`, `stderr`. Thứ tự phân loại: lỗi → biến → dòng sai đầu tiên → thừa dòng.
  - Phản công sai đầu ra trả `wrong_value_counter` kèm `out_line`.
  - `output-diff.ts` dựng cặp `cần:`/`nhận:` (`·`, `→`, `▯`, `U+XXXX`).
  - `sim-vocabulary.ts` giữ chữ riêng của `scanner` (nguyên chữ 1.4) và `relay`.
  - `terminal-lines.ts` theo đúng mẫu GDD §5.
- **Phase 4 – UI.**
  - `use-timeline-playback.ts` tách từ máy quét; logic chuyển nguyên, không sửa.
  - Trạm R-17: `relay-timeline.ts` (thuần) và `relay-simulation.tsx` (SVG laptop–dây–ăng-ten–Mạng Mù, danh sách phát có `<mark>`).
  - `level-simulation.tsx` chọn mô phỏng theo `kind`.
  - Ô Mục tiêu vẽ "dòng N"; hộp kết quả lấy tiêu đề và tiêu chí theo loại mô phỏng.
  - Vòng sáng trên CHẠY trước lượt chạy đầu; luồng lỗi stderr hiện dưới nhãn "LUỒNG LỖI (không chấm)".
  - "dữ liệu chip" đổi thành "dữ liệu nạp sẵn".
- **Phase 5 – e2e, tài liệu.**
  - Viết mới `tests/e2e/level-1-1.spec.ts`; sửa assert trong `story-flow.spec.ts`; thêm hằng 1.1 vào `helpers.ts`.
  - Cập nhật `CLAUDE.md` (Project, Run pipeline, Levels are data) và `README.md` (luồng chơi).
- **Review** (agent `code-reviewer`): không có lỗi nghiêm trọng, 1.4 giữ nguyên. Đã sửa cả 5 lỗi mức Medium/Low reviewer nêu:
  - Báo cáo đầu ra hỏng mà không chỉ ra dòng nào từng làm `classifyRun` ném lỗi. Nay trả `generic`, có test hồi quy.
  - Đáp án đứng sau dấu chấm câu (`...PHIEN K7Q2`) không bị bắt. Nay chỉ bỏ qua khi đứng sau "số + dấu chấm".
  - Khi chương trình tự dừng (`input()`, `exit`, hết bộ nhớ), terminal không liệt kê các dòng đã phát.
  - Ký tự sai nằm sau vị trí 80, chỗ bản xem trước bị cắt, bị hiện thành `▯`. Nay hiện `…`.
  - Sau lỗi cú pháp, mục tiêu đầu ra hiện "chưa chạy". Nay là "chưa đạt", giống mục tiêu biến.

## Lệch so với plan (và lý do)

1. **`RelaySlot` không có trạng thái `flying`.** Gói đang bay là `scene.active`, vẽ bằng CSS keyframes trong khung của nó. Ít trạng thái hơn, timeline vẫn thuần.
2. **`output_extra` mang thêm `out_line` = N+1**, để `wrong_value_counter` vẫn điền được `{out_line}` khi phản công chỉ sai vì thừa dòng.
3. **Thêm dòng terminal `> ĐẦU RA BỊ CẮT: quá dài, phiên bị bỏ`.** Không có dòng này, một lượt bị cắt mà các dòng đều đúng sẽ đóng kênh mà không giải thích vì sao.
4. **`sim-vocabulary` có thêm `terminalNote`.** Dòng phụ ô Terminal "nhật ký máy quét" cũng là chữ đặc thù máy quét (hợp đồng §7).
5. **`index.html` đổi tiêu đề thành "Mã Cuối Cùng"** (trước đây là "– 1.4"). Khi mở 1.1, tab trình duyệt vẫn ghi "1.4".
6. **Vòng sáng làm bên trong nút**: nền nhấp nháy + viền trong. `.btn-run` dùng `clip-path` nên mọi bóng hay viền bên ngoài đều bị cắt mất. Giảm chuyển động: viền trong tĩnh.
7. **Khung cuối khi qua phản công bỏ banner OMNI**, cho giống máy quét.
8. **Câu `aria-live` khi lỗi chạy**: "Trạm R-17 phát 1/3 dòng. Lỗi NameError · dòng 7. Kênh đóng."
9. **Hai chữ của 1.4 đổi, trái với AC 8 ("1.4 không đổi một chữ")**: `> KHÔNG CÓ KÊNH NHẬP LIỆU: dữ liệu đã nạp sẵn` và nhãn editor "dòng khóa = dữ liệu nạp sẵn". Lý do: hợp đồng §7 và plan phase 3–4 yêu cầu làm trung tính, và hợp đồng thắng. Không test 1.4 nào khóa hai chữ này, trừ một assert e2e đã sửa theo plan.
10. **Test**: ba ca của test cũ "the leak check catches…" chuyển vào bảng `echo-leaks.test.ts`, giữ nguyên ca. `terminal-panel.test.tsx` kiểm thêm stderr, vì stderr cũng là chữ người chơi kiểm soát. Bỏ một test Python hiển nhiên (test không có `expected_output` thì `output` là `null`).
11. **Kiểm Pyodide không qua e2e.** Tài liệu Pyodide (Context7) không liệt kê `unicodedata` trong các module bị gỡ hay tách riêng. Ngoài ra đã chơi 1.1 trên server dev người dùng đang chạy sẵn ở :5173 (không tự bật server nào), qua Chrome:
    - harness chạy được trên Pyodide 3.14.2;
    - code gốc ra đúng các dòng terminal của GDD §11 bước 2;
    - lời giải 3 sao ra hộp "Kênh mở hoàn toàn", 3 sao, "Đã thu: Tiêu đề tín hiệu".

## Test (số thật)

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | sạch (có phủ `tests/e2e`) |
| `npm test` | 27 file, 275 test qua (trước: 24 file, 226 test) |
| `npm run test:py` | 67 test, OK (trước: 59) |
| `npm run test:py:3.14` | 67 test, OK |
| `npm run build` | qua (cảnh báo chunk > 500 kB đã có từ trước) |
| E2E | **đã viết, chưa chạy** (người dùng chạy khi yêu cầu): `level-1-1.spec.ts` (mới), `story-flow.spec.ts` (sửa assert), `level-1-4.spec.ts` (một assert chữ khóa) |

Test mới:
- `echo-leaks.test.ts`: bảng 15 ca và 1 test bộ từ cấm của level.
- `validate-level.test.ts`: 1.1 hợp lệ, cộng 9 ca bị từ chối.
- `test_harness.py` lớp `OutputGrading`: 8 test.
- `tests/integration/level-1-1.test.ts`: 8 test (9 ca), harness thật.
- `classify-run.test.ts`: 4 ca.
- `terminal-lines.test.ts`: 4 ca 1.1.
- `relay-timeline.test.ts`: 6 test.

## Còn mở

- **Chạy e2e**: `npx playwright test tests/e2e/level-1-1.spec.ts tests/e2e/story-flow.spec.ts tests/e2e/level-1-4.spec.ts tests/e2e/audio.spec.ts`, rồi `npm run test:e2e`. Đây là lưới an toàn cho cue và `onDone` sau khi tách hook phát lại.
- **Chưa xem bằng mắt ở 375 px**: cửa sổ Chrome không đổi cỡ được. CSS đặt SVG 4:3, danh sách cuộn trong ô, chữ 14 px; project `mobile-chromium` chạy spec 1.1.
- **Tiến độ trong trình duyệt bị đổi**: lúc kiểm tay trên `localhost:5173`, profile Chrome của người dùng đã ghi tiến độ 1.1 (3 sao, vài lượt chạy) vào `localStorage`, và lưu bản nháp editor 1.1 với dòng 7–8 đã sửa. Muốn chơi lại từ đầu thì xóa khóa `the-last-code:progress:v1` của origin đó.
- Reviewer ghi thêm hai điểm nhỏ, chưa sửa: `_clip` là bản thứ ba của logic cắt chuỗi trong harness; `casefold` coi `ß`/`SS` là chỉ khác hoa thường. Cả hai vô hại với dữ liệu hiện có.
- Câu hỏi mở 1–7 của plan giữ nguyên quyết định đã tự chốt.

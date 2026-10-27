# Quyết định: hợp đồng engine chung cho Level 1.1–1.3

Ngày: 2026-10-25. Người chốt: main agent, sau khi validate ba brainstorm:
- `design/quyet-dinh/level-1-1-khoi-dong.md` (GDD: `design/chuong-1/gdd-1.1-khoi-dong.md`)
- `design/quyet-dinh/level-1-2-gan-nhan.md` (GDD: `design/chuong-1/gdd-1.2-gan-nhan.md`)
- `design/quyet-dinh/level-1-3-bon-loai-tin-hieu.md` (GDD: `design/chuong-1/gdd-1.3-bon-loai-tin-hieu.md`)

Vỏ game (định tuyến, đoạn truyện, bản đồ, `location`/`component`/`outro_beats`, điểm mở rộng `LevelSimulation`) thuộc `design/gdd-mo-dau.md`. Tài liệu này chỉ chốt những chỗ ba đề xuất level chồng hoặc lệch nhau. Khi một GDD level nói khác tài liệu này, tài liệu này thắng.

## Thứ tự làm

Vỏ game → 1.1 → 1.2 → 1.3, tuần tự. Phần dùng chung (mục 1–4 dưới đây) thuộc plan 1.1 vì 1.1 được làm trước; plan 1.2 và 1.3 coi chúng là đã có.

## 1. Chọn mô phỏng: một object, mặc định là máy quét

```json
"simulation": { "kind": "relay" }
"simulation": { "kind": "kiosk", "devices": ["the_quet", "the_cong"] }
"simulation": { "kind": "sorter" }
```

- `kind` thuộc `"scanner" | "relay" | "kiosk" | "sorter"`. Thiếu trường → `scanner` (1.4 không đổi). Tùy chọn riêng của từng loại nằm cạnh `kind` và được validator kiểm theo `kind`.
- Thay cho đề xuất chuỗi `"simulation": "relay"` của 1.1 và `"sorter"` của 1.3.
- Phần phát lại khung hình (đồng hồ, bỏ qua bằng Esc, giảm chuyển động, gọi `onCue`/`onDone`) tách khỏi `scanner-simulation.tsx` thành một hook dùng chung (`use-timeline-playback.ts`) ở plan 1.1. Mỗi mô phỏng mới chỉ viết timeline thuần (có test) và phần vẽ.

## 2. Từ cấm của ECHO: một trường, cộng dồn

- Tên trường: `forbidden_terms` (mảng chuỗi, tùy chọn). Đề xuất `echo_forbidden_terms` của 1.3 đổi thành tên này.
- Ngữ nghĩa: **cộng thêm** vào danh sách chung `int|float|round` và mọi giá trị `expected` (kể cả `expected_output` của 1.1). Không thay thế. 1.3 vẫn cấm được `int`, `str`… vì đã liệt kê trong danh sách riêng.
- Áp cho mọi `reactions`, và lời ECHO trong `outro_beats`. Không áp cho `hints`.
- So khớp không phân biệt hoa thường, theo ranh giới chữ Unicode (`\p{L}\p{N}_`, cờ `u`), không dùng `\b` của JS vì nó không hiểu chữ tiếng Việt. Từ chỉ gồm dấu câu (`"`, `'`) khớp theo chuỗi con.
- Logic nằm ở một module (`echo-leaks.ts`, plan vỏ game tạo), dùng chung cho test và validator.

## 3. So chuỗi: chuẩn hóa NFC ở mọi nơi

- Harness chuẩn hóa NFC cả hai phía trước khi so giá trị `str` và trước khi so dòng đầu ra. Bỏ ghi chú "không chuẩn hóa Unicode" của 1.2.
- Lý do: người chơi gõ lại "ĐỖ MINH AN" bằng bộ gõ sinh dạng tổ hợp sẽ trượt mà không thấy khác biệt nào trên màn hình. Đây là lỗi vô hình, không dạy được gì.
- Một test harness duy nhất cho NFD == NFC.

## 4. Mục tiêu đầu ra (1.1, dùng lại cho 1.6)

Theo đề xuất 1.1: mục tiêu loại `{"kind": "output_line", "line": n, "label": "…"}` bên cạnh mục tiêu biến; test có `expected_output: string[]`; luật khớp: bỏ khoảng trắng cuối dòng và các dòng rỗng ở cuối, NFC, còn lại tuyệt đối; vẫn so khi chương trình lỗi (để mô phỏng hiện dòng đã phát) nhưng lượt chạy lỗi thì không đạt; đầu ra bị cắt thì không đạt; stderr tách bộ đệm riêng, không chấm. Khóa phản ứng mới: `output_missing`, `output_mismatch`, `output_case_only`, `output_extra`; chỗ giữ `{out_line}`, `{col}`. Sai đầu ra ở lượt phản công dùng lại `wrong_value_counter`.

## 5. Riêng 1.2

- Khóa phản ứng `value_is_label` (biến chuỗi sai giá trị và giá trị đó đúng bằng tên một biến đầu vào hoặc mục tiêu; chỉ trả khi level có khóa này).
- `var_history` trong harness, chỉ bật khi `simulation.kind === "kiosk"` (qua `build-config.ts`), tối đa 40 mục, so theo identity, không chạy code người chơi. Đo chi phí trên Pyodide; nếu đắt, mô phỏng rơi về giá trị cuối (GDD 1.2 mục 8 đã mô tả đường lùi).

## 6. Riêng 1.3

- `ValueType` thêm `"type"` (giá trị kỳ vọng là `"int" | "float" | "str" | "bool"`); chấm bằng `type(v) is type and v is <kiểu>`; chuỗi `"int"`/`"<class 'int'>"` tính là khớp nội dung sai kiểu.
- Giá trị trong `inputs` của test được phép là chuỗi, số hoặc bool (1.4 vẫn chỉ dùng chuỗi). Terminal và mô phỏng hiện đầu vào theo cú pháp Python (`"7351"`, `4096`, `True`).
- Khóa phản ứng `type_mismatch_unknown_shape`, rơi về `type_mismatch` khi level không định nghĩa.

## 7. Chung cho cả ba

- Vòng sáng trên nút CHẠY khi `progress.runs === 0` (đề xuất 1.1) áp cho mọi level, không cần trường mới.
- Chữ đặc thù 1.4 trong `terminal-lines.ts`, `objectives-panel.tsx` và nhãn editor (`neural_id.py`, "dòng khóa = dữ liệu chip") được làm trung tính hoặc lấy từ dữ liệu level ở plan 1.1.
- Chính sách test của người dùng: bỏ test hiển nhiên và test chỉ cho có. Chỉ test chấm điểm, luật sao, rò rỉ đáp án, an toàn khi lỗi, timeline mô phỏng thuần và mỗi level một e2e chơi tới 3 sao.
- Mỗi level phải chơi được từ đoạn chuyển cảnh trước nó tới đoạn chuyển cảnh sau nó; lời giải 2 sao và 3 sao trong GDD chạy qua test tích hợp (harness thật bằng `python3`).

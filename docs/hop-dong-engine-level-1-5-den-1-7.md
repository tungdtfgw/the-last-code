# Quyết định: hợp đồng engine chung cho Level 1.5–1.7

Ngày: 2026-10-28. Chạy tự động, không hỏi được người dùng; các điểm tự chốt nằm ở mục 9.
Brainstorm của từng màn:
- `design/quyet-dinh/level-1-5-nang-luong-toi-thieu.md` (GDD: `design/chuong-1/gdd-1.5-nang-luong-toi-thieu.md`)
- `design/quyet-dinh/level-1-6-doi-thoai-voi-cong.md` (GDD: `design/chuong-1/gdd-1.6-doi-thoai-voi-cong.md`)
- `design/quyet-dinh/level-1-7-boss-cong-kiem-soat.md` (GDD: `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md`)

Tài liệu này chốt những thay đổi dùng chung mà ba màn cần, thứ tự làm và cách chia nhánh. Khi một GDD màn nói khác tài liệu này, tài liệu này thắng. Hợp đồng cũ (`docs/hop-dong-engine-level-1-1-den-1-3.md`) vẫn đứng; tài liệu này chỉ cộng thêm.

## Hiện trạng (đã kiểm trong mã nguồn ngày 28/10/2026)

- `harness.py` thay `input` bằng `_no_input`, ném `_InputUnsupported` → trạng thái `input_unsupported`. Không có kênh nhập nào.
- Harness đã chạy **mọi** test trong `tests` (mỗi test một namespace mới) và mọi test trong `counter_attack_tests`. `classify-run.ts` lấy test sai đầu tiên (`failing ?? first`) để hiện, đếm câu lệnh bằng giá trị lớn nhất của các test. `RunOutcome` chỉ mang một test cơ bản và một test phản công; mô phỏng không biết các test còn lại.
- `buildConfig` truyền nguyên `level.tests` và `level.counter_attack_tests` cho harness, nên một trường mới trong `TestCase` tự đi tới harness.
- `echo-reactions.ts`: khóa không có câu thì rơi thẳng về `generic`. Khóa tùy chọn chỉ được trả khi level có câu (`levelHasLine` trong `classify-run.ts`).
- Khóa `output_is_label` (1.1) đã bắt được dòng in ra chứa nguyên tên một biến đầu vào: `print("DANH TINH: {ho_ten}")` (thiếu `f`) rơi đúng vào khóa này mà không cần sửa gì.
- `componentSlot` lấy chỉ số của level trong `chapter.levels`; 1.7 đứng thứ 7 nên nằm ngoài 6 ô và không có thẻ thành phần.
- `rawStoryEnd`: `after-<id>` dẫn tới level đã dựng kế tiếp, hết level thì tới `teaser`. Khi cả 1.7 đã dựng, `after-1.7` dẫn vào `teaser`.
- `npm run content:migration` đặt tên file theo số lớn nhất trong `db/migrations/` cộng 1. `SqliteDb` và wrangler áp mọi migration chưa có trong `d1_migrations` theo thứ tự tên, không đòi số liền nhau.

## 1. Kênh nhập cho `input()` (1.6, 1.7)

```json
"tests": [{ "inputs": {"ho_ten": "ĐỖ MINH AN", "so_khu": 7}, "stdin": ["4172", "DEM"], "expected": {}, "expected_output": ["…"] }]
```

- `TestCase.stdin?: string[]`: các dòng mà `input()` đọc lần lượt. Mỗi phần tử là một dòng, không chứa `\n` hay `\r`, tối đa 20 dòng, mỗi dòng tối đa 200 ký tự.
- **Tất cả hoặc không có gì:** một level dùng kênh nhập khi mọi test và mọi test phản công đều có `stdin` (mảng rỗng được phép). Lẫn lộn là lỗi validator. Level không có `stdin` (1.1–1.5) giữ nguyên hành vi cũ: `input()` → `input_unsupported`.
- Trong harness, `input(prompt="")` của level có kênh nhập:
  1. ghi `str(prompt)` ra **stdout** như Python thật khi stdin không phải bàn phím (không xuống dòng, không lặp lại chữ đọc được);
  2. trả dòng kế tiếp đúng nguyên văn (không chuẩn hóa, không cắt khoảng trắng);
  3. hết dòng thì ném `EOFError("EOF when reading a line")`, đúng thông báo của CPython; đây là lỗi của người chơi, đi qua nhánh `runtime_error` như mọi lỗi khác.
- Kết quả mỗi test có thêm `stdin_read` (số dòng đã đọc) và `prompts` (các lời nhắc khác rỗng đã ghi, tối đa 20, mỗi cái cắt ở `preview_chars`).
- `input` vẫn là hàm của harness, không thuộc file người chơi, nên không bị đếm câu lệnh. Câu lệnh gọi `input()` được đếm như mọi câu lệnh.
- Dòng khóa và tiêm biến không đổi: biến hồ sơ vẫn nạp vào namespace qua `inputs`; dữ liệu "trạm hỏi" đi qua `stdin`. Một level có thể dùng cả hai (1.6, 1.7).

**Vì sao lời nhắc đi ra stdout và bị chấm.** Đó là hành vi thật của Python khi dữ liệu được nạp sẵn, và trong truyện mọi thứ chương trình in ra đều đi tới trạm (giống luật trạm R-17 ở 1.1). Người chơi viết `input("Ma hoi: ")` sẽ thấy dòng 1 lệch ở vị trí 1 với `nhận: Ma·hoi:·DANH·TINH…`; khóa tùy chọn `output_has_prompt` (mục 3) cho ECHO nói đúng chuyện đó. Phương án tách lời nhắc ra kênh riêng bị loại vì dạy sai mô hình của Python (xem `design/quyet-dinh/level-1-6-doi-thoai-voi-cong.md`, lựa chọn A).

## 2. Nhiều vòng quét (1.7)

- Không thêm cơ chế chấm mới. "Ba vòng quét liên tiếp" là ba phần tử của `tests`; harness đã chạy đủ ba, mỗi vòng một namespace mới và một bộ dữ liệu khác. Lượt cơ bản đạt khi cả ba vòng đạt; số câu lệnh là giá trị lớn nhất của ba vòng (như hiện nay). `compute-stars.ts` không đổi.
- `RunOutcome` có thêm `rounds?: RoundVerdict[]`, chỉ khi level có từ 2 test cơ bản trở lên: `{ index, passed, inputs, stdin?, stdinRead?, output?, vars }` cho từng vòng theo thứ tự. Trường cũ (`vars`, `output`, `stdout`…) vẫn là của vòng hiện ra (vòng sai đầu tiên, hoặc vòng 1).
- `OutcomeDetails.round?` (1-based) là vòng sai đầu tiên; chỗ giữ `{round}` dùng được trong `reactions` (cập nhật chuỗi `PLACEHOLDERS` trong `src/content/text-fields.ts`).
- Terminal in một dòng mở cho mỗi vòng đã tới (`> VÒNG QUÉT 2/3 · kênh nhập: "9035", "1500"`), dừng ở vòng sai đầu tiên. Mô phỏng `checkpoint` vẽ "liên tiếp": vòng sau vòng sai hiện là chưa tới, dù harness đã chạy nó.

## 3. Khóa phản ứng mới (đều tùy chọn)

| Khóa | Khi nào | Không có câu thì |
|---|---|---|
| `EOFError` | Lượt chạy lỗi `EOFError` (đọc nhiều dòng hơn trạm gửi) | `runtime_error` |
| `output_has_prompt` | Dòng sai đầu tiên chứa một lời nhắc trong `prompts` của test đó mà dòng cần không chứa | `output_mismatch` (hoặc khóa đầu ra đang áp) |

Cả hai đi qua `levelHasLine`. `EOFError` không vào `NAMED_ERRORS` theo kiểu trả thẳng, vì level không có câu cho nó phải rơi về `runtime_error` chứ không phải `generic`. Thứ tự trong nhánh đầu ra: `output_has_prompt` đứng trước `output_is_label`.

## 4. Tổng kết kiến thức có dữ liệu nhập

- `knowledge_summary.sections[].stdin?: string` (câu đố, không phải câu chữ; không thêm vào `text-fields.ts`, giống `code` và `output`). Có `stdin` thì phải có `code`.
- `tests/integration/knowledge-summary.test.ts` chạy `code` với `stdin` làm đầu vào chuẩn của `python3` và vẫn đòi in đúng `output`. Không có `stdin` thì đầu vào chuẩn rỗng như hiện nay.
- Màn tổng kết hiện khối "Dữ liệu nhập:" giữa code và "Kết quả:".

## 5. Mô phỏng mới

Mỗi màn có một loại mô phỏng riêng, theo đúng khuôn của 1.1–1.4 (timeline thuần có test + component + một mục trong `sim-vocabulary.ts` + một nhánh trong `level-simulation.tsx` + một giá trị trong `SIMULATION_KINDS`):

| Màn | `simulation` | Ghi chú |
|---|---|---|
| 1.5 | `{ "kind": "fence", "energy": "nang_luong", "cells": "so_pin", "remainder": "phan_le", "capacity": "dung_luong" }` | Ba tên đầu là mục tiêu biến, `capacity` là tên đầu vào; validator kiểm |
| 1.6 | `{ "kind": "interrogation" }` | Màn hình trạm hiện các dòng `stdin` (đã đọc / chưa đọc theo `stdinRead`), cột lời đáp dùng danh sách dòng của relay |
| 1.7 | `{ "kind": "checkpoint" }` | Ba vòng quét đọc `rounds`, thanh Neural-ID 6 ô, buồng kiểm tra tay của NX-0417 ở lượt phản công |

Phần chung làm trước: tách danh sách dòng đầu ra (`SlotRow`, `Segments` và cách dựng ô từ `OutputReport`) khỏi `relay-simulation.tsx` / `relay-timeline.ts` thành một module dùng chung, vì `interrogation` và `checkpoint` đều vẽ danh sách `cần:`/`nhận:`. Relay giữ nguyên hình ảnh (test `relay-timeline.test.ts` không đổi kết quả).

Thêm `kind` vào `SIMULATION_KINDS` là việc của nhánh màn đó, cùng commit với scene, vì validator từ chối loại chưa có scene.

## 6. Kết chương: `teaser` thành đoạn hết chương

- Khi 1.7 đã dựng, `after-1.7` dẫn vào `teaser` (luật hiện có, không sửa `progression.ts`). Đoạn này đổi ý đồ: từ "Còn tiếp" sau 1.4 thành **hết Chương 1**, móc sang Chương 2 (ý đồ từng nhịp: `design/chuong-1/gdd-1.7-boss-cong-kiem-soat.md` mục 13).
- **Giữ nguyên 9 nhịp và `kind` của từng nhịp** (log, echo, log, log, card, echo, log, kai, card). `kind` là khóa neo; giữ nguyên thì migration vá chỉ đổi `text`, câu mới khớp cả JSON cũ lẫn JSON mới, và không có lúc nào chương bị "DỮ LIỆU CHƯƠNG HỎNG". `cue`, `backdrop`, `fx`, `hold_ms` (câu đố) đổi trong `src/story/chapter-1.json` cùng nhánh.
- Câu mới đi bằng migration vá `0008_content_chapter_1_het_chuong.sql`: một `json_set(text, '$.teaser', json('[…]'))`, tăng `revision`, thêm dòng lịch sử (mẫu: `docs/huong-dan-deploy.md` mục 9).
- Nhãn `storyLabel("teaser")` đổi từ "Còn tiếp" thành "Hết chương 1" (chữ giao diện trong code, không ở D1).
- 1.7 không có `component` (ô 7 nằm ngoài 6 ô); hộp kết quả không hiện dòng "Đã thu". Mảnh "Định danh" hiện trong đoạn `after-1.7` (thẻ `card` với `fx: "eight_fragments"`).

## 7. Thứ tự làm và chia nhánh

```
main
 └─ feat/chuong-1-ket            (nhánh tích hợp, chỉ merge vào main khi đủ ba màn)
     ├─ feat/engine-1-5-1-7       (hạ tầng H1–H6, merge trước tiên)
     ├─ feat/level-1-5            (sau H; song song với 1.6)
     ├─ feat/level-1-6            (sau H; song song với 1.5)
     └─ feat/level-1-7            (sau H; viết song song, merge sau cùng vì chứa kết chương)
```

**Hạ tầng (một nhánh, làm tuần tự, merge trước):**

| # | Việc | File chính |
|---|---|---|
| H1 | Kênh nhập trong harness: `stdin`, lời nhắc ra stdout, `EOFError`, `stdin_read`, `prompts`; unittest Python | `src/engine/python/harness.py`, `tests/python/test_harness.py`, `src/engine/harness-types.ts` |
| H2 | Schema: `TestCase.stdin`, luật "tất cả hoặc không", khóa `EOFError`, `output_has_prompt`; validator | `src/game/level-types.ts`, `src/game/validate-level.ts` |
| H3 | Phân loại: `EOFError`, `output_has_prompt`, `rounds`, `details.round`; chỗ giữ `{round}` | `src/game/classify-run.ts`, `src/content/text-fields.ts` |
| H4 | Terminal: dòng kênh nhập của mỗi test, dòng mở mỗi vòng | `src/game/terminal-lines.ts` |
| H5 | `knowledge_summary.sections[].stdin`: kiểu, validator, test tích hợp, màn tổng kết | `src/game/level-types.ts`, `src/game/validate-level.ts`, `tests/integration/knowledge-summary.test.ts`, `src/ui/knowledge-screen.tsx` |
| H6 | Tách danh sách dòng đầu ra dùng chung khỏi relay | `src/ui/relay-simulation.tsx`, `src/ui/relay-timeline.ts`, module mới `src/ui/output-slots.ts(x)` |

Test cho hạ tầng dùng level mẫu trong `tests/fixtures/` (một level giả có `stdin` và ba test cơ bản), không dùng level thật chưa có.

**Theo màn (mỗi nhánh chỉ sửa file của mình, trừ ba chỗ một dòng ở mục 5):**

| Nhánh | File riêng | Chỗ chung (một dòng, xung đột nhỏ, giải khi rebase) |
|---|---|---|
| 1.5 | `src/levels/level-1-5.json`, `src/ui/fence-timeline.ts(+test)`, `src/ui/fence-simulation.tsx`, `tests/fixtures/solutions/1.5/*`, test tích hợp lời giải, `tests/e2e/level-1-5.spec.ts`, `db/migrations/0005_content_level_1_5.sql` | `SIMULATION_KINDS`, nhánh trong `level-simulation.tsx`, mục `fence` trong `sim-vocabulary.ts`, kiểm tùy chọn `fence` trong `validate-level.ts` |
| 1.6 | `src/levels/level-1-6.json`, `src/ui/interrogation-timeline.ts(+test)`, `src/ui/interrogation-simulation.tsx`, lời giải, e2e, `db/migrations/0006_content_level_1_6.sql` | như trên với `interrogation` |
| 1.7 | `src/levels/level-1-7.json`, `src/ui/checkpoint-timeline.ts(+test)`, `src/ui/checkpoint-simulation.tsx`, lời giải, e2e, `db/migrations/0007_content_level_1_7.sql`, `db/migrations/0008_content_chapter_1_het_chuong.sql`, `src/story/chapter-1.json` (chỉ `teaser`), `src/ui/story-labels.ts` | như trên với `checkpoint` |

**Số migration được cấp sẵn:** `0005` = `level:1.5`, `0006` = `level:1.6`, `0007` = `level:1.7`, `0008` = vá `chapter:1` (hết chương). Script `content:migration` tự lấy số lớn nhất + 1, nên trên nhánh 1.6 nó sẽ ghi `0005_…`; người làm đổi tên file thành số được cấp trước khi commit (nội dung không phụ thuộc số). Việc bất ngờ cần migration lấy số trống đầu tiên sau `0008` lúc merge vào nhánh tích hợp. Vì SQL câu chữ là `ON CONFLICT DO NOTHING` và D1 áp theo tên, thứ tự merge không ảnh hưởng kết quả.

**Mỗi nhánh màn phải tự đủ:** JSON câu đố và migration câu chữ trong cùng commit (`server/content/content-migration.test.ts` đòi mọi level trong bundle có dòng D1). Không merge JSON level mà thiếu migration.

**Phát hành:** chỉ deploy khi cả ba màn và đoạn hết chương đã vào nhánh tích hợp. Lý do: deploy riêng 1.5 thì `teaser` vẫn nói "bốn thành phần, còn hai" sau 1.5; deploy 1.7 mà thiếu `0008` thì đoạn sau 1.7 là "Còn tiếp" cũ. Trên D1 thật: áp `0005`–`0008` rồi deploy code ngay (`docs/huong-dan-deploy.md` mục 9).

## 8. Không đổi

`prepare-source.ts`, `compute-stars.ts`, `alert.ts`, worker và giao thức worker (thêm trường trong JSON kết quả không đổi giao thức), `progression.ts`, `build-story.ts`, bộ lưu tiến độ, server.

## 9. Điểm tự chốt (người dùng có thể đổi)

1. Lời nhắc của `input()` ra stdout và bị chấm như Python thật; có khóa `output_has_prompt` để ECHO giải thích.
2. Ba vòng quét của Boss là ba test cơ bản; không thêm cơ chế "vòng" vào harness hay luật sao.
3. Ba loại mô phỏng mới, không dùng lại máy quét/relay cho 1.5–1.7 (đường lùi khi thiếu thời gian: 1.5 dùng `scanner`, 1.6 dùng `relay` với `station: "TTV"`; level vẫn chơi được, mất hình ảnh riêng).
4. `teaser` thành đoạn hết chương, giữ khung 9 nhịp để migration vá không làm hỏng chương lúc chuyển giao.
5. Phát hành ba màn cùng lúc.

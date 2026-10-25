---
phase: 2
title: "Dữ liệu level JSON & bộ nạp"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Dữ liệu level JSON & bộ nạp

## Goal
Level 1.4 được mô tả hoàn toàn bằng một file JSON (GDD 7.1 mở rộng `expected`, `reactions`, `hints`, `lore`), được kiểm hợp lệ khi nạp, và thêm level mới chỉ cần thả file JSON vào `src/levels/` (AC 6).

## Key Insights
- JSON không phân biệt `2703` và `2703.0`. **Kiểu kỳ vọng lấy từ `objectives[].type`**, không suy từ giá trị. Cấu hình được truyền sang Python dưới dạng **chuỗi JSON** rồi `json.loads` (ra `int`/`float`/`bool` thật), không truyền JsProxy.
- `locked_lines` (1-based) chỉ phục vụ hiển thị/khóa. Engine **bơm** biến đầu vào vào namespace và **thay dòng khóa bằng dòng trống** trước khi chạy để giữ nguyên số dòng (traceback khớp editor; dòng khóa không bị đếm lệnh).
- Giá trị đã kiểm bằng `python3`: `len("27"*100+"3") == 201`, `round(float("1.72")*2,2) == 3.44`, `round(float("1.65")*2,2) == 3.3`, `int(float("31.0"))*100+int(float("7")) == 3107`.
- Đăng ký level bằng `import.meta.glob('./*.json', { eager: true })` → thêm file là xong, không sửa code.

## Files to Create
- `src/levels/level-1-4.json`
- `src/game/level-types.ts` – type `LevelDefinition`, `Objective`, `TestCase`, `ReactionKey`.
- `src/game/validate-level.ts` – validator viết tay, trả `{ ok: true, level } | { ok: false, errors: string[] }`.
- `src/game/level-registry.ts` – glob + validate, xuất `getLevel(id)`, `listLevels()`. Level không hợp lệ: bỏ qua + `console.error` danh sách lỗi; trang level đó hiện màn "DỮ LIỆU LEVEL HỎNG" thay vì crash.
- `src/game/validate-level.test.ts`, `src/game/level-registry.test.ts`, `tests/fixtures/levels/level-test-sample.json` (level giả thứ hai chỉ dùng trong test, dùng để chứng minh AC 6 qua hàm `buildRegistry(modules)` nhận map module).

## Schema `level-1-4.json` (nội dung đầy đủ cần viết)

```json
{
  "schema_version": 1,
  "id": "1.4",
  "chapter": 1,
  "title": "Tín hiệu lệch pha",
  "difficulty": "medium",
  "concepts": ["type_conversion"],
  "briefing": "[NHẬT KÝ HỆ THỐNG – CỔNG PHÍA BẮC]\nChip Neural-ID thu hồi từ một người đã chết. Dữ liệu còn đọc được, nhưng đã bị mã hóa thành chuỗi ký tự.\nMáy quét chỉ chấp nhận số. Gửi chuỗi vào máy quét sẽ kích hoạt báo động.",
  "starter_code": "# Dữ liệu đọc từ chip (KHÔNG được sửa 3 dòng này)\ntuoi = \"27\"\nchieu_cao = \"1.72\"\ncap_do = \"3\"\n\n# Mã xác thực = tuổi × 100 + cấp độ\nma_xac_thuc = tuoi * 100 + cap_do\n\n# Chỉ số sinh học = chiều cao × 2, làm tròn 2 chữ số\nchi_so = chieu_cao * 2\n\nhop_le = \"True\"\n",
  "locked_lines": [2, 3, 4],
  "inputs": ["tuoi", "chieu_cao", "cap_do"],
  "objectives": [
    {"var": "ma_xac_thuc", "type": "int", "label": "Mã xác thực = tuổi × 100 + cấp độ"},
    {"var": "chi_so", "type": "float", "label": "Chỉ số sinh học = chiều cao × 2, làm tròn 2 chữ số"},
    {"var": "hop_le", "type": "bool", "label": "Cờ hợp lệ"}
  ],
  "alert_limit_statements": 8,
  "float_abs_tolerance": 1e-9,
  "tests": [
    {"inputs": {"tuoi": "27", "chieu_cao": "1.72", "cap_do": "3"},
     "expected": {"ma_xac_thuc": 2703, "chi_so": 3.44, "hop_le": true}}
  ],
  "counter_attack_tests": [
    {"inputs": {"tuoi": "31.0", "chieu_cao": "1.65", "cap_do": "7"},
     "expected": {"ma_xac_thuc": 3107, "chi_so": 3.3, "hop_le": true}}
  ],
  "counter_attack_banner": "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP",
  "hints": ["…3 mức, xem dưới…"],
  "reactions": {"…": "xem bảng dưới"},
  "outro": "Cổng phía Bắc mở. Trong bộ nhớ chip còn sót một dòng log chưa bị xóa:",
  "lore_fragment": "KTS-03: Nếu ai đọc được dòng này, mảnh đầu tiên nằm dưới Cổng Kiểm Soát. Đừng tin tín hiệu nào mang mã 0xA7."
}
```

`locked_lines` phải trỏ đúng các dòng `tuoi`/`chieu_cao`/`cap_do` trong `starter_code`; validator kiểm: mọi biến trong `inputs` có trong mỗi test; mọi `objectives[].var` có trong `expected` của mỗi test; `type` ∈ {`int`,`float`,`str`,`bool`}; giá trị `expected` khớp kiểu (bool phải là `true/false`, int phải là số nguyên); `locked_lines` nằm trong số dòng của starter; `reactions` có tối thiểu khóa `generic`; `hints` dài 3.

### Gợi ý 3 mức (giọng ECHO, viết lại từ GDD 6.8)
1. "Máy quét không đọc được ý nghĩa. Nó chỉ đọc… hình dạng của dữ liệu."
2. "Dữ liệu cần được chuyển hình dạng trước khi tính toán. Thứ tự chuyển đổi… quan trọng."
3. Tài liệu (được phép nêu tên hàm, ví dụ không trùng đáp án): `int("42")` → `42`; `int(7.9)` → `7` (cắt phần thập phân); `float("2.5")` → `2.5`; `float(3)` → `3.0`; `round(2.71828, 3)` → `2.718`. Không đưa `int(float(...))` và không dùng số của level.

### Bảng `reactions` (lời thoại cuối cùng – cụt, lạnh, có nhiễu "…", không đùa)
Placeholder được phép: `{line}`, `{vars}`, `{error_type}`, `{count}`. **Cấm** chèn thông điệp lỗi gốc (vì `ValueError` của `int()` chứa chữ `int`).

| key | Lời ECHO |
|---|---|
| `entry` | "Kết nối… ổn định. Tôi là ECHO. Mô-đun viết mã của tôi đã cháy. Tôi chỉ còn đọc. Máy quét phía trước chỉ nhận số." |
| `type_mismatch` | "Máy quét từ chối {vars}. Sai hình dạng. Nó không đọc nội dung… chỉ đọc hình dạng." |
| `type_mismatch_value_match` | "Con số của {vars} khớp. Hình dạng thì không. Với máy quét, đó vẫn là vật lạ." |
| `wrong_value` | "Hình dạng đúng. Con số sai. {vars} không khớp mẫu máy quét chờ." |
| `missing_var` | "Sau khi chạy, bộ nhớ không có {vars}. Máy quét không có gì để đọc." |
| `SyntaxError` | "Dòng {line}. Trình dịch không hiểu cấu trúc này. Chưa câu lệnh nào được chạy." |
| `IndentationError` | "Dòng {line}. Lề trái lệch. Với Python, khoảng trắng… là ngữ pháp." |
| `TypeError` | "Dòng {line}. TypeError. Hai thứ khác hình dạng vừa bị ép vào cùng một phép toán." |
| `ValueError` | "Dòng {line}. ValueError. Nội dung bên trong không chuyển được sang hình dạng đó." |
| `NameError` | "Dòng {line}. NameError. Một cái tên được gọi khi chưa từng tồn tại. Soát từng ký tự." |
| `ZeroDivisionError` | "Dòng {line}. Chia cho không. Lõi từ chối." |
| `AttributeError` | "Dòng {line}. AttributeError. Dữ liệu này không mang thứ bạn đang gọi." |
| `runtime_error` | "Dòng {line}. {error_type}. Chương trình dừng giữa chừng. Đọc dòng truy vết." |
| `timeout` | "Mã chạy quá lâu. Tôi cắt kết nối… trước khi OMNI lần ra dấu." |
| `resource_limit` | "Bộ nhớ quá tải. Tôi đã cắt tiến trình để giữ laptop sống." |
| `blocked_import` | "Mô-đun đó bị phong tỏa. Ở Vùng Tối, ta chỉ có những gì đang cầm trong tay." |
| `input_unsupported` | "Không có ai ở đầu kia để trả lời. Dữ liệu đã nằm sẵn trong chip." |
| `system_exit` | "Chương trình tự cắt giữa chừng. Máy quét không nhận được gì." |
| `alert_exceeded` | "Qua máy quét. Nhưng {count} câu lệnh… Sentinel đã ghi nhận tín hiệu. Chạy gọn hơn." |
| `counter_ValueError` | "OMNI đổi định dạng chip. Dòng {line} vỡ: ValueError. Dữ liệu mới mang hình dạng bạn chưa lường." |
| `counter_error` | "OMNI đổi dữ liệu. Dòng {line}: {error_type}. Mã không chịu được." |
| `counter_type_mismatch` | "Dữ liệu mới đi qua mã của bạn… và ra sai hình dạng ở {vars}." |
| `wrong_value_counter` | "OMNI đổi dữ liệu chip. Kết quả của bạn không đổi theo. Nó được viết cho một con chip đã chết." |
| `two_stars` | "Qua cổng. Không để lại dấu vết." (chỉ dùng khi level không có test phản công) |
| `three_stars` | "Cổng mở hoàn toàn. OMNI đổi dữ liệu, mã vẫn đứng vững. …Tôi ghi nhận điều đó." |
| `repeated_fail` | "Cùng một lỗi, lần thứ {count}. Nhật ký gợi ý vẫn ở đây. Tôi chỉ hỏi được… không trả lời thay." |
| `engine_error` | "Lõi Python không phản hồi. Đang khởi động lại…" |
| `generic` | "Có gì đó không khớp. Đọc lại kết quả máy quét." |

Lưu ý giọng: ECHO giúp người tự làm, không bao giờ nói cách sửa (không mâu thuẫn twist chương 6).

## Tasks & Steps
1. Viết `level-types.ts` (dùng union `ReactionKey` liệt kê đúng các key trên; `reactions: Partial<Record<ReactionKey,string>> & { generic: string }`).
2. Viết `level-1-4.json` đúng nội dung trên (hints thật, reactions thật).
3. Viết `validate-level.ts` + test: JSON hợp lệ qua; mỗi lỗi (thiếu `expected`, type lạ, `locked_lines` ngoài phạm vi, bool sai kiểu, thiếu `generic`) → lỗi có thông điệp rõ.
4. Viết `level-registry.ts` với hàm thuần `buildRegistry(modules: Record<string, unknown>)` + export dùng `import.meta.glob`. Test: truyền 2 module (1.4 + fixture) → `listLevels()` có 2 level; module hỏng bị loại, không ném lỗi.

## Verification
- `npx vitest run src/game/validate-level.test.ts src/game/level-registry.test.ts`
- `npm run typecheck`

## Success Criteria
- AC 6 chứng minh bằng test registry. Nội dung JSON khớp GDD 6 + contract.

## Risk
- Sai lệch `locked_lines` ↔ starter khi sửa JSON sau này → validator bắt (so sánh dòng có bắt đầu bằng `<input> =`).

# Cook: Việc cần làm và Tổng kết kiến thức (schema + giao diện)

- Ngày: 2026-10-25, giờ Asia/Saigon.
- Hợp đồng: `plans/reports/brainstorm-261025-1415-van-viet-nhiem-vu-ro-tong-ket-kien-thuc.md`. Kế hoạch: `plans/261025-1415-viec-can-lam-va-tong-ket/plan.md`.
- Phạm vi: chỉ phần engine và giao diện. Chưa sửa `src/levels/*.json` hay `src/story/chapter-1.json`; nội dung do nhóm nội dung viết.
- Kiểm chứng: `npm run typecheck`, `npm test` (34 tệp, 362 test; trước là 33 tệp, 343 test), `npm run test:py` (78 test), `npm run build` đều qua. **E2E: đã viết, chưa chạy.**

## Quyết định trong khuôn hợp đồng

- **Vị trí "Việc cần làm":** là một ô riêng (`.panel.task-steps`) nằm giữa ô Nhiệm vụ và ô Mục tiêu. Ô không co, nên khi gập Nhiệm vụ thì nó vẫn ở nguyên chỗ. Trên điện thoại, ô nằm trong tab Nhiệm vụ. Ô hiện ra khi briefing gõ xong (pha intro `objectives`). Bỏ qua intro hoặc bật giảm chuyển động thì ô hiện ngay.
- **Route:** `#/learn/<id>`.
  - `continueAfterLevel` trả về `learn` khi level có `knowledge_summary`, không có thì giữ luồng cũ.
  - `learnEnd` dẫn sang `after-<id>`, hoặc bỏ qua đoạn này nếu đã xem.
  - `guardRoute` đưa về bản đồ khi level chưa có sao hoặc không có tổng kết.
  - Không lưu trạng thái "đã xem tổng kết".
- **Bản đồ:** cột bên có thêm ô "Kiến thức", mỗi level đã qua và có tổng kết là một nút. Không gắn nút vào nút level vì không được lồng `<button>` trong `<button>`. Mở từ bản đồ thì TIẾP TỤC quay về bản đồ (dùng lại ref `replaying`, giờ ref này lưu hash).
- **Màn tổng kết:**
  - Chữ dùng font hệ thống (`--font-prose`). Màn không có scanline, không có ECHO.
  - Phần thân tự cuộn, trang không cuộn.
  - TIẾP TỤC có sẵn focus. Phím Enter tiếp tục được cả khi focus đã rời nút. Phím giữ lặp từ hộp kết quả bị bỏ qua.

## Định dạng JSON cho người viết nội dung

Thêm hai trường tùy chọn ở cấp gốc của level JSON:

```json
"task_steps": [
  "Sửa 3 lệnh `print` để terminal in ra đúng 3 dòng ở ô Mục tiêu, từng ký tự.",
  "Không sửa các dòng khóa ở đầu file: đó là dữ liệu nạp sẵn.",
  "Bấm CHẠY. Xong khi cả 3 mục tiêu chuyển xanh."
],
"knowledge_summary": {
  "title": "print, chuỗi và tên biến",
  "sections": [
    {
      "heading": "`print` in ra một dòng",
      "body": "Mỗi lần gọi `print(...)` in một dòng ra terminal. Chữ trong dấu nháy là chuỗi và được in nguyên văn.",
      "code": "print(\"Xin chao\")\nprint(\"Lop 10A\")",
      "output": "Xin chao\nLop 10A"
    },
    {
      "heading": "Tên biến không có dấu nháy",
      "body": "Viết tên biến không có dấu nháy thì Python in giá trị của biến.\nViết trong dấu nháy thì Python in đúng chữ đó.",
      "code": "ten = \"Mai\"\nprint(ten)\nprint(\"ten\")",
      "output": "Mai\nten"
    },
    {
      "heading": "Nhiều giá trị trong một lệnh",
      "body": "`print` nhận nhiều giá trị, ngăn bằng dấu phẩy, và in chúng cách nhau một dấu cách.",
      "code": "tuoi = 16\nprint(\"Tuoi\", tuoi)",
      "output": "Tuoi 16"
    }
  ],
  "mistakes": [
    {
      "code": "print(ho_ten)",
      "error": "NameError: name 'ho_ten' is not defined",
      "explain": "Tên biến chưa được gán giá trị nào trước khi dùng. Kiểm tra chính tả, chữ hoa và chữ thường."
    },
    {
      "code": "print(\"Diem: \" + 9)",
      "error": "TypeError: can only concatenate str (not \"int\") to str",
      "explain": "Dấu `+` chỉ nối chuỗi với chuỗi. Dùng dấu phẩy trong `print` để in nhiều giá trị."
    }
  ],
  "next": "Bạn sẽ gán giá trị mới cho biến và thấy giá trị cũ bị thay thế."
}
```

Quy tắc mà validator (`src/game/validate-level.ts`) và test kiểm:

**`task_steps`**
- Gồm 2–4 chuỗi không rỗng. Chữ trong backtick hiện thành code.
- Không được chứa giá trị kỳ vọng hay dòng output kỳ vọng nào của `tests` và `counter_attack_tests`. Việc so khớp tính cả từ, không phân biệt hoa thường, và `true` khớp `True`. Với 1.3 nghĩa là không được viết `int`/`str` như đáp án.
- Danh sách từ cấm của ECHO không áp dụng ở đây, nên được nêu tên hàm như `print`.

**`knowledge_summary`**
- Không kiểm lộ đáp án.
- `title` và `next` là chuỗi không rỗng. `sections` không được rỗng. `mistakes` là mảng và có thể rỗng; khi rỗng thì màn không hiện mục "Lỗi bạn có thể đã gặp".
- Mỗi section cần `heading` và `body`. `code` và `output` tùy chọn, nhưng có `output` thì phải có `code`. Khóa lạ (gõ nhầm như `ouput`) bị từ chối.
- Mỗi mistake cần đủ `code`, `error`, `explain`.
- Trong `body`, `explain` và `next`, ký tự `\n` tách đoạn.
- `next` là câu đứng sau tiêu đề "Ở màn sau". Màn đã tự in tiêu đề này, nên đừng viết lại.

**Code ví dụ** (`tests/integration/knowledge-summary.test.ts`)
- Mọi `code` trong `sections` được chạy bằng `python3 -I -`. Code phải chạy không lỗi (stderr rỗng, exit 0). Nếu có `output` thì stdout phải khớp từng dòng, bỏ khoảng trắng cuối dòng và dòng trống cuối.
- Code cố ý gây lỗi đặt ở `mistakes`; phần này không được chạy.
- Ví dụ phải khác đáp án của level (theo hợp đồng). Test không kiểm điều này.

## Đã làm

**Schema**
- `src/game/level-types.ts`: thêm `task_steps`, `KnowledgeSummary`, `KnowledgeSection` và `KnowledgeMistake`.
- `src/game/validate-level.ts`: thêm hàm kiểm `checkTextObject` và `checkKnowledgeSummary`. Kiểm `task_steps` bằng `findEchoLeak` với tập chỉ chứa đáp án (`levelLeaks().answers`). Tập đáp án giờ tính một lần, dùng chung cho `outro_beats`.

**Luồng**
- `src/story/progression.ts`: thêm route `learn`, `learnEnd` và nhánh mới trong `continueAfterLevel` và `guardRoute`.
- `src/shell/route.ts`: đọc được `#/learn/<id>`.
- `src/app.tsx`: thêm case `learn`, `replaying` lưu theo hash, bản đồ nhận `knowledge` và `onKnowledge`.

**Giao diện**
- Tệp mới: `src/ui/inline-code.tsx`, `src/ui/task-steps-panel.tsx`, `src/ui/knowledge-screen.tsx`.
- `src/ui/game-screen.tsx`: thêm ô Việc cần làm. `src/ui/chapter-map.tsx`: thêm ô Kiến thức.
- CSS: `src/styles/global.css` (cuối tệp) và token `--font-prose` trong `src/styles/tokens.css`.

**Fixture**
- `tests/fixtures/levels/level-test-knowledge.json` (id 9.8) có `task_steps` và `knowledge_summary` giữ chỗ.

**Tài liệu**
- `design/gdd.md`: §4.4 bước 2, §4.7 (thêm ô Việc cần làm, mục Tổng kết kiến thức), §7.1 (định dạng và quy tắc).
- `CLAUDE.md`: mục "Levels are data" và dòng thứ tự intro.

## Test mới

- `src/game/validate-level.test.ts` (+10 test):
  - fixture hợp lệ, và level không có hai trường vẫn hợp lệ;
  - bước được nêu `print` nhưng không được chứa dòng output kỳ vọng của 1.1;
  - 8 trường hợp bị từ chối: 1 bước, bước rỗng, bước chứa giá trị kỳ vọng, `output` thiếu `code`, khóa gõ nhầm, `sections` rỗng, mistake thiếu `explain`, thiếu `next`.
- `src/story/progression.test.ts` (+7 test):
  - TIẾP TỤC luôn vào tổng kết, kể cả khi chơi lại và đã xem đoạn chuyển cảnh;
  - tổng kết dẫn sang đoạn chuyển cảnh, hoặc bỏ qua nó nếu đã xem;
  - level không có tổng kết bỏ qua bước này;
  - 4 trường hợp guard.
- `tests/integration/knowledge-summary.test.ts` (2 test): fixture có ít nhất một ví dụ, và từng ví dụ chạy ra đúng output. Với level thật, test này đang qua khi chưa có gì để kiểm, nhưng sẽ bắt lỗi ngay khi nội dung được thêm.

## E2E (đã viết, chưa chạy)

- `tests/e2e/helpers.ts`: thêm `continueFromResults(page, id)`. Hàm bấm TIẾP TỤC; nếu URL là `#/learn/<id>` thì kiểm nút TIẾP TỤC đang có focus và nhấn Enter.
- `level-1-1/1-2/1-3.spec.ts` và `story-flow.spec.ts` dùng helper này, nên chạy được cả trước lẫn sau khi có nội dung.
- `tests/e2e/knowledge-summary.spec.ts` (mới, dùng level 1.1, tự `test.skip` nếu JSON chưa có trường tương ứng):
  - Từ bản đồ bấm "Kiến thức 1.1" thì vào tổng kết: có tiêu đề, "Ở màn sau", "Kết quả:", "Lỗi bạn có thể đã gặp"; không có ECHO; trang không cuộn; TIẾP TỤC có focus; Enter về bản đồ.
  - Mở thẳng `#/learn/1.1` khi chưa có sao thì về bản đồ.
  - Việc cần làm hiện sau intro và vẫn hiện khi gập Nhiệm vụ. Ở đây dùng phím thay vì bấm chuột, vì trên điện thoại bong bóng ECHO che tiêu đề ô.

## Ảnh chụp (dev server :5173, Chromium headless)

Mẫu nội dung được chèn bằng `page.route` vào `level-1-1.json`. Script: `/private/tmp/claude-501/-Users-tungdt-MyProjects-throwable-the-last-code/38c0fcf2-01cc-46ac-b2f1-8ea7f22809c0/scratchpad/learn/shoot.mjs`. Ảnh nằm cùng thư mục, đặt tên `{map|learn|level}-{1280x800|360x740}[-rm][-bottom|-collapsed|-intro].png`.

| Kích thước | Tổng kết: thân cuộn / cao | Trang cuộn | Focus | Enter | Việc cần làm khi gập |
|---|---|---|---|---|---|
| 1280×800 | 1372 / 583 | không | TIẾP TỤC | về bản đồ | còn hiện |
| 360×740 | 1649 / 552 | không | TIẾP TỤC | về bản đồ | còn hiện |

Giảm chuyển động cho kết quả giống hệt. Khi briefing đang gõ (sau 400 ms), ô Việc cần làm chưa hiện; gõ xong thì ô hiện.

## Còn mở

- Ở 1280×800, ô Việc cần làm (3 bước, khoảng 190 px) lấy chỗ của briefing; trước khi gập, briefing chỉ còn mức tối thiểu 112 px và tự cuộn. Sau lượt chạy đầu, briefing tự gập như cũ.
- E2E chưa chạy. Spec tổng kết sẽ tự bật khi `level-1-1.json` có nội dung.
- Bản đồ chỉ hiện nút Kiến thức cho level đã qua **và** có tổng kết. Hiện chưa level thật nào có tổng kết, nên ô ghi "Qua một level để xem lại…".

Status: DONE

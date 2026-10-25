# Phase 1: lịch sử chat và trạng thái chưa đọc

## Context
`game-reducer.ts` giữ `echo` (câu hiện tại, `id` tăng mỗi câu mới) và đổi nó ở `animation_done`, `hint_opened`, `echo_say`. Gợi ý đã mở lưu ở `progress.hintsOpened` (qua `ProgressRepository`).

## Requirements
- `GameState.chat: ChatMessage[]` (lịch sử phiên, không lưu). `ChatMessage = EchoState & { tag: "entry" | "run" | "hint"; run?: number; hint?: number }`.
- Mọi chỗ đổi `echo` cũng thêm tin vào `chat` (một helper `say`). Câu phản ứng mang `run = progress.runs` (số lượt của lượt vừa xong).
- `progress_loaded`: gợi ý đã mở ở phiên trước được chèn **trước** câu `entry` (tag `hint`), để sau tải lại vẫn thấy chúng trong khung mà bong bóng vẫn là câu `entry`.
- Giới hạn lịch sử (giữ tin mới nhất) để phiên dài không phình.
- Trạng thái UI thuần trong `src/game/echo-chat.ts`: `{ open, seen, bubble }` với action `message(id)`, `open(lastId)`, `close`, `dismiss`; selector `isUnread`, `bubbleVisible`. Không có tin trước khi ECHO thức (intro chưa xong).

## Files
- Sửa: `src/game/game-reducer.ts`, `src/game/game-reducer.test.ts`.
- Tạo: `src/game/echo-chat.ts`, `src/game/echo-chat.test.ts`.

## Tests (chỉ logic đáng giá)
- Thứ tự lịch sử: entry → phản ứng lượt #1 → gợi ý 1 → phản ứng #2; nhãn lượt đúng.
- Gợi ý khôi phục nằm trước entry, entry vẫn là tin cuối.
- Trạng thái chưa đọc: tin mới khi đóng → chưa đọc + bong bóng; mở → đã đọc, không bong bóng; tin mới khi đang mở → không chưa đọc; dismiss bỏ bong bóng nhưng giữ chấm.

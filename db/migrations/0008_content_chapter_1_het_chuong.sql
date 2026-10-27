-- End of chapter 1: the teaser after the last built level becomes the chapter ending.
-- Rewrites the text of the nine teaser beats (same kinds, so the old and the new
-- chapter file both accept it), bumps the revision and keeps the old text in history.

UPDATE content_text
SET text = json_set(text, '$.teaser', json('[{"kind":"log","text":"Cổng Kiểm Soát đóng lại sau lưng Kai. Lần đầu tiên, Kai đứng ngoài Vùng Tối."},{"kind":"echo","text":"Neural-ID giả đủ sáu thành phần. Nó chỉ sống tới lần quét lớn kế tiếp."},{"kind":"log","text":"Một mảnh trong tám đã về tay. Bảy mảnh còn lại nằm ở bảy nơi không ai biết."},{"kind":"log","text":"Phía trước là biên giới thành phố. Trạm Sentinel. Drone tuần tra theo những luật Kai chưa đọc được."},{"kind":"card","text":"TÍN HIỆU · 0xA7\n\"Mảnh thứ hai ở Trạm Sentinel. Tôi sẽ đợi.\""},{"kind":"echo","text":"Đừng đi theo lịch 0xA7 đặt ra."},{"kind":"log","text":"NHẬT KÝ CA TRỰC · CỔNG KIỂM SOÁT\n02:14 · NX-0417 · 1 tín hiệu qua cổng · không bất thường\n02:15 · NX-0417 · tín hiệu đó quen"},{"kind":"kai","text":"Anh sẽ quay lại, Nhi."},{"kind":"card","text":"HẾT CHƯƠNG 1 · VÙNG TỐI\nChương 2: Trạm Sentinel\nTín hiệu đang giải mã."}]')),
    revision = revision + 1, updated_at = '2026-10-28T00:00:00.000Z', updated_by = 'migration'
WHERE doc_id = 'chapter:1';
INSERT INTO content_text_history (doc_id, revision, text, saved_at, saved_by)
SELECT doc_id, revision, text, updated_at, updated_by FROM content_text
WHERE doc_id = 'chapter:1' AND updated_at = '2026-10-28T00:00:00.000Z'
ON CONFLICT(doc_id, revision) DO NOTHING;

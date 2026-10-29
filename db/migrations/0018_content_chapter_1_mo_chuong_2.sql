-- Chapter 2 is out: the last card of the chapter 1 ending no longer says the
-- signal is still being decoded. Only the text of teaser[8] changes (same nine
-- beat kinds), the revision goes up and the new text gets a history row.
-- Without a chapter:1 row nothing happens.

UPDATE content_text
SET text = json_set(text, '$.teaser[8].text', 'HẾT CHƯƠNG 1 · VÙNG TỐI' || char(10) || 'Chương 2: Trạm Sentinel' || char(10) || 'Đường ra biên giới đã mở.'),
    revision = revision + 1, updated_at = '2026-10-30T00:00:00.000Z', updated_by = 'migration'
WHERE doc_id = 'chapter:1';
INSERT INTO content_text_history (doc_id, revision, text, saved_at, saved_by)
SELECT doc_id, revision, text, updated_at, updated_by FROM content_text
WHERE doc_id = 'chapter:1' AND updated_at = '2026-10-30T00:00:00.000Z'
ON CONFLICT(doc_id, revision) DO NOTHING;

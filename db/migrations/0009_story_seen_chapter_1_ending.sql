-- The story "teaser" used to be the "Còn tiếp" scene after 1.4; it is now the end of chapter 1,
-- played after 1.7. A player who saw the old scene must not skip the new one, nor find it on the map early.
DELETE FROM story_seen WHERE story_id = 'teaser';

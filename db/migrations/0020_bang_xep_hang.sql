-- Ranking: when each level got its stars, and accounts an admin keeps off the board.
-- Two times, because raising the stars of an early level later must not push back
-- the moment a player reached a later one:
--   first_star_at: when best_stars first went from 0 to more than 0;
--   stars_at:      when best_stars last rose.
-- Rows written before this migration only have updated_at (drafts move it too), so
-- it stands in for both.
ALTER TABLE level_progress ADD COLUMN first_star_at TEXT;
ALTER TABLE level_progress ADD COLUMN stars_at TEXT;
ALTER TABLE users ADD COLUMN ranking_hidden INTEGER NOT NULL DEFAULT 0;
UPDATE level_progress SET first_star_at = updated_at, stars_at = updated_at WHERE best_stars > 0;

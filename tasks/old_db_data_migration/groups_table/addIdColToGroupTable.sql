ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS id INTEGER,
  DROP CONSTRAINT IF EXISTS groups_id_uniq,
  ADD CONSTRAINT groups_id_uniq UNIQUE (id);
-- BRC Map — optional exact camp geometry for the Sun & Shade tool: a footprint
-- polygon (local metre offsets from the pin) extruded by a height. Its own table,
-- read defensively, so the core camps query never depends on it. Idempotent
-- (the migration runner replays every file).
CREATE TABLE IF NOT EXISTS camp_geometry (
  camp_id    uuid PRIMARY KEY REFERENCES camps(id) ON DELETE CASCADE,
  footprint  jsonb,
  height_ft  double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

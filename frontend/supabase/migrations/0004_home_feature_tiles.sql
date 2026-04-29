ALTER TABLE home_feature_sections
ADD COLUMN IF NOT EXISTS tile_images TEXT[] NOT NULL DEFAULT '{}';

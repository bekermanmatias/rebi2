CREATE TABLE IF NOT EXISTS home_feature_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  image_url TEXT,
  target_link TEXT,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_feature_sections_slug ON home_feature_sections(slug);

ALTER TABLE home_feature_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read home_feature_sections" ON home_feature_sections;
CREATE POLICY "Public read home_feature_sections" ON home_feature_sections
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public write home_feature_sections" ON home_feature_sections;
CREATE POLICY "Public write home_feature_sections" ON home_feature_sections
  FOR ALL
  USING (true)
  WITH CHECK (true);

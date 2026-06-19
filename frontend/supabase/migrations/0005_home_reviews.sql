CREATE TABLE IF NOT EXISTS home_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  stars INT NOT NULL DEFAULT 5 CHECK (stars >= 1 AND stars <= 5),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_reviews_order ON home_reviews(display_order);

ALTER TABLE home_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read home_reviews" ON home_reviews;
CREATE POLICY "Public read home_reviews" ON home_reviews
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public write home_reviews" ON home_reviews;
CREATE POLICY "Public write home_reviews" ON home_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

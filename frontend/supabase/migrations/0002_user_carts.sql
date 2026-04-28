-- Carrito persistente por usuario (vinculado a auth.users)
CREATE TABLE IF NOT EXISTS user_carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_carts_updated_at ON user_carts(updated_at DESC);

ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own cart" ON user_carts;
CREATE POLICY "Users read own cart" ON user_carts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own cart" ON user_carts;
CREATE POLICY "Users insert own cart" ON user_carts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own cart" ON user_carts;
CREATE POLICY "Users update own cart" ON user_carts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own cart" ON user_carts;
CREATE POLICY "Users delete own cart" ON user_carts
  FOR DELETE
  USING (auth.uid() = user_id);

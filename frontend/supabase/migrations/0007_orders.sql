-- Tabla de órdenes (checkout y seguimiento de "Mi cuenta")
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_type TEXT NOT NULL,
  delivery_address TEXT,
  branch_id TEXT,
  vendedor_code TEXT,
  whatsapp_number TEXT,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

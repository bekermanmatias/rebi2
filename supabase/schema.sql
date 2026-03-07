-- Esquema inicial para la Fase 1 del corralón
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12, 2),
  stock_status BOOLEAN NOT NULL DEFAULT true,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status) WHERE stock_status = true;

-- Habilitar RLS (Row Level Security) - opcional para lectura pública
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (solo lectura)
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Datos de ejemplo (opcional)
INSERT INTO categories (name, slug) VALUES
  ('Obra gruesa', 'obra-gruesa'),
  ('Terminaciones', 'terminaciones'),
  ('Herramientas', 'herramientas')
ON CONFLICT (slug) DO NOTHING;

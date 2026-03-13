-- Esquema de la base de datos Rebi Construcciones en Supabase
-- Este archivo es de referencia; las tablas ya existen en la DB.

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de marcas
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  slogan TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12, 2),
  weight_kg NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de imágenes de productos
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de variantes de productos
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  size_name TEXT,
  packaging TEXT,
  price NUMERIC(12, 2),
  weight_kg NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de banners del home
CREATE TABLE IF NOT EXISTS home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  target_link TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_home_banners_order ON home_banners(display_order) WHERE is_active = true;

-- RLS (Row Level Security) - lectura pública
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read product_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public read home_banners" ON home_banners FOR SELECT USING (true);

import { createClient } from '@supabase/supabase-js';
import type { Product, Category, Brand, Banner, PromoCard } from '../types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function normalizeProduct(row: Record<string, unknown>): Product {
  const images = Array.isArray(row.product_images) ? row.product_images as Record<string, unknown>[] : [];
  const sortedImages = [...images].sort(
    (a, b) => ((a.display_order as number) ?? 0) - ((b.display_order as number) ?? 0)
  );
  const primaryImage = sortedImages.find((img) => img.is_primary) ?? sortedImages[0];

  const rawCategory = row.category ?? row.categories;
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;

  const rawBrand = row.brand ?? row.brands;
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand;

  const rawVariants = Array.isArray(row.product_variants) ? row.product_variants : [];

  return {
    ...row,
    category: category as Product['category'],
    brand: brand as Product['brand'],
    product_images: sortedImages as Product['product_images'],
    variants: rawVariants as Product['variants'],
    image_url: (primaryImage?.image_url as string) ?? null,
    images: sortedImages.map((img) => img.image_url as string),
  } as Product;
}

const PRODUCT_SELECT = `
  *,
  category:categories(id, name, slug),
  brand:brands(id, name, slug, logo_url),
  product_images(id, image_url, is_primary, display_order, variant_id),
  product_variants(id, sku, size_name, packaging, price, weight_kg, is_active)
`;

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) {
    console.error('getCategories:', error);
    return [];
  }
  return data ?? [];
}

export async function getBrands(): Promise<Brand[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');
  if (error) {
    console.error('getBrands:', error);
    return [];
  }
  return data ?? [];
}

export async function getProducts(options?: {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  limit?: number;
}): Promise<Product[]> {
  if (!supabase) return [];

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true);

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single();
    if (cat?.id) query = query.eq('category_id', cat.id);
  }

  if (options?.brandSlug) {
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', options.brandSlug)
      .single();
    if (brand?.id) query = query.eq('brand_id', brand.id);
  }

  if (options?.search?.trim()) {
    const q = options.search.trim();
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query.order('name');
  if (error) {
    console.error('getProducts:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => normalizeProduct(row));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return normalizeProduct(data as Record<string, unknown>);
}

export async function getPromoCards(): Promise<PromoCard[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('promo_cards')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) {
    console.error('getPromoCards:', error);
    return [];
  }
  return data ?? [];
}

export async function getBanners(): Promise<Banner[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) {
    console.error('getBanners:', error);
    return [];
  }
  return data ?? [];
}

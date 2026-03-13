import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Category, Brand } from '../types';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) {
    console.error('[adminApi] Supabase env vars missing');
    return null;
  }
  _client = createClient(url, key);
  return _client;
}

// ─── Categories & Brands (read-only helpers) ─────────────────────────
export async function fetchCategories(): Promise<Category[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data, error } = await sb.from('categories').select('*').order('name');
  if (error) { console.error('fetchCategories:', error); return []; }
  return data ?? [];
}

export async function fetchBrands(): Promise<Brand[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data, error } = await sb.from('brands').select('*').order('name');
  if (error) { console.error('fetchBrands:', error); return []; }
  return data ?? [];
}

// ─── Products ─────────────────────────────────────────────────────────
export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  weight_kg: number | null;
  is_active: boolean;
  category_id: string;
  brand_id: string | null;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  product_images?: ImageRow[];
  product_variants?: VariantRow[];
}

export interface VariantRow {
  id?: string;
  product_id?: string;
  sku: string | null;
  size_name: string | null;
  packaging: string | null;
  price: number | null;
  weight_kg: number | null;
  is_active: boolean;
}

export interface ImageRow {
  id?: string;
  product_id?: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  variant_id: string | null;
}

const ADMIN_PRODUCT_SELECT = `
  *,
  category:categories(name),
  brand:brands(name),
  product_images(id, image_url, is_primary, display_order, variant_id),
  product_variants(id, sku, size_name, packaging, price, weight_kg, is_active)
`;

export async function fetchProducts(): Promise<ProductRow[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('products')
    .select(ADMIN_PRODUCT_SELECT)
    .order('name');
  if (error) { console.error('fetchProducts:', error); return []; }
  return (data ?? []) as unknown as ProductRow[];
}

export async function saveProduct(product: {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  weight_kg: number | null;
  is_active: boolean;
  category_id: string;
  brand_id: string | null;
}): Promise<string | null> {
  const sb = getClient();
  if (!sb) return null;
  if (product.id) {
    const { error } = await sb.from('products').update({
      name: product.name,
      slug: product.slug,
      description: product.description,
      weight_kg: product.weight_kg,
      is_active: product.is_active,
      category_id: product.category_id,
      brand_id: product.brand_id || null,
    }).eq('id', product.id);
    if (error) { console.error('updateProduct:', error); return null; }
    return product.id;
  } else {
    const { data, error } = await sb.from('products').insert({
      name: product.name,
      slug: product.slug,
      description: product.description,
      weight_kg: product.weight_kg,
      is_active: product.is_active,
      category_id: product.category_id,
      brand_id: product.brand_id || null,
    }).select('id').single();
    if (error) { console.error('insertProduct:', error); return null; }
    return data?.id ?? null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) { console.error('deleteProduct:', error); return false; }
  return true;
}

// ─── Variants ─────────────────────────────────────────────────────────
export async function saveVariants(productId: string, variants: VariantRow[]): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;

  const existing = variants.filter((v) => v.id);
  const newOnes = variants.filter((v) => !v.id);

  for (const v of existing) {
    const { error } = await sb.from('product_variants').update({
      sku: v.sku,
      size_name: v.size_name,
      packaging: v.packaging,
      price: v.price,
      weight_kg: v.weight_kg,
      is_active: v.is_active,
    }).eq('id', v.id!);
    if (error) { console.error('updateVariant:', error); return false; }
  }

  if (newOnes.length > 0) {
    const { error } = await sb.from('product_variants').insert(
      newOnes.map((v) => ({
        product_id: productId,
        sku: v.sku,
        size_name: v.size_name,
        packaging: v.packaging,
        price: v.price,
        weight_kg: v.weight_kg,
        is_active: v.is_active,
      }))
    );
    if (error) { console.error('insertVariants:', error); return false; }
  }
  return true;
}

export async function deleteVariant(id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('product_variants').delete().eq('id', id);
  if (error) { console.error('deleteVariant:', error); return false; }
  return true;
}

// ─── Images ───────────────────────────────────────────────────────────
export async function saveImages(productId: string, images: ImageRow[]): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;

  const existing = images.filter((img) => img.id);
  const newOnes = images.filter((img) => !img.id);

  for (const img of existing) {
    const { error } = await sb.from('product_images').update({
      image_url: img.image_url,
      is_primary: img.is_primary,
      display_order: img.display_order,
      variant_id: img.variant_id || null,
    }).eq('id', img.id!);
    if (error) { console.error('updateImage:', error); return false; }
  }

  if (newOnes.length > 0) {
    const { error } = await sb.from('product_images').insert(
      newOnes.map((img) => ({
        product_id: productId,
        image_url: img.image_url,
        is_primary: img.is_primary,
        display_order: img.display_order,
        variant_id: img.variant_id || null,
      }))
    );
    if (error) { console.error('insertImages:', error); return false; }
  }
  return true;
}

export async function deleteImage(id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('product_images').delete().eq('id', id);
  if (error) { console.error('deleteImage:', error); return false; }
  return true;
}

// ─── Banners ──────────────────────────────────────────────────────────
export interface BannerRow {
  id?: string;
  title: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  target_link: string | null;
  display_order: number;
  is_active: boolean;
}

export async function fetchBanners(): Promise<BannerRow[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data, error } = await sb.from('home_banners').select('*').order('display_order');
  if (error) { console.error('fetchBanners:', error); return []; }
  return data ?? [];
}

export async function saveBanner(banner: BannerRow): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const payload = {
    title: banner.title,
    desktop_image_url: banner.desktop_image_url,
    mobile_image_url: banner.mobile_image_url,
    target_link: banner.target_link,
    display_order: banner.display_order,
    is_active: banner.is_active,
  };
  if (banner.id) {
    const { error } = await sb.from('home_banners').update(payload).eq('id', banner.id);
    if (error) { console.error('updateBanner:', error); return false; }
  } else {
    const { error } = await sb.from('home_banners').insert(payload);
    if (error) { console.error('insertBanner:', error); return false; }
  }
  return true;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('home_banners').delete().eq('id', id);
  if (error) { console.error('deleteBanner:', error); return false; }
  return true;
}

// ─── Promo Cards ──────────────────────────────────────────────────────
export interface PromoCardRow {
  id?: string;
  title: string;
  image_url: string;
  target_link: string;
  display_order: number;
  is_active: boolean;
}

export async function fetchPromoCards(): Promise<PromoCardRow[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data, error } = await sb.from('promo_cards').select('*').order('display_order');
  if (error) { console.error('fetchPromoCards:', error); return []; }
  return data ?? [];
}

export async function savePromoCard(card: PromoCardRow): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const payload = {
    title: card.title,
    image_url: card.image_url,
    target_link: card.target_link,
    display_order: card.display_order,
    is_active: card.is_active,
  };
  if (card.id) {
    const { error } = await sb.from('promo_cards').update(payload).eq('id', card.id);
    if (error) { console.error('updatePromoCard:', error); return false; }
  } else {
    const { error } = await sb.from('promo_cards').insert(payload);
    if (error) { console.error('insertPromoCard:', error); return false; }
  }
  return true;
}

export async function deletePromoCard(id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from('promo_cards').delete().eq('id', id);
  if (error) { console.error('deletePromoCard:', error); return false; }
  return true;
}

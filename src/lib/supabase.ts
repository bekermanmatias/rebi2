import { createClient } from '@supabase/supabase-js';
import type { Product, Category } from '../types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Obtiene todas las categorías */
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

/** Obtiene todos los productos (con categoría si existe) */
export async function getProducts(options?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
}): Promise<Product[]> {
  if (!supabase) return [];
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('stock_status', true);

  if (options?.categorySlug) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single();
    if (cats?.id) query = query.eq('category_id', cats.id);
  }

  if (options?.search?.trim()) {
    query = query.or(`name.ilike.%${options.search.trim()}%,description.ilike.%${options.search.trim()}%`);
  }

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query.order('name');
  if (error) {
    console.error('getProducts:', error);
    return [];
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    category: Array.isArray(row.category) ? row.category[0] : row.category,
  })) as Product[];
}

/** Obtiene un producto por slug */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    ...row,
    category: Array.isArray(row.category) ? row.category[0] : row.category,
  } as Product;
}

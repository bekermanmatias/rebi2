import {
  supabase,
  getProducts as getProductsFromSupabase,
  getCategories as getCategoriesFromSupabase,
  getProductBySlug as getProductBySlugFromSupabase,
} from './supabase';
import { mockCategories, mockProducts, mockBanners } from './mockData';
import type { Product, Category, Banner } from '../types';

export async function getCategories(): Promise<Category[]> {
  if (supabase) return getCategoriesFromSupabase();
  return mockCategories;
}

export async function getProducts(options?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
}): Promise<Product[]> {
  if (supabase) return getProductsFromSupabase(options);
  let list = [...mockProducts];
  if (options?.categorySlug) {
    const cat = mockCategories.find((c) => c.slug === options.categorySlug);
    if (cat) list = list.filter((p) => p.category_id === cat.id);
  }
  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
    );
  }
  if (options?.limit) list = list.slice(0, options.limit);
  return list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (supabase) return getProductBySlugFromSupabase(slug);
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export async function getBanners(): Promise<Banner[]> {
  return mockBanners;
}

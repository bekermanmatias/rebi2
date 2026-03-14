import {
  supabase,
  getProducts as getProductsFromSupabase,
  getCategories as getCategoriesFromSupabase,
  getProductBySlug as getProductBySlugFromSupabase,
  getBrands as getBrandsFromSupabase,
  getBanners as getBannersFromSupabase,
  getPromoCards as getPromoCardsFromSupabase,
} from './supabase';
import type { Product, Category, Brand, Banner, PromoCard } from '../types';

export async function getCategories(): Promise<Category[]> {
  if (supabase) return getCategoriesFromSupabase();
  return [];
}

export async function getBrands(): Promise<Brand[]> {
  if (supabase) return getBrandsFromSupabase();
  return [];
}

export async function getProducts(options?: {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  limit?: number;
  featured?: boolean;
}): Promise<Product[]> {
  if (supabase) return getProductsFromSupabase(options);
  return [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (supabase) return getProductBySlugFromSupabase(slug);
  return null;
}

export async function getBanners(): Promise<Banner[]> {
  if (supabase) return getBannersFromSupabase();
  return [];
}

export async function getPromoCards(): Promise<PromoCard[]> {
  if (supabase) return getPromoCardsFromSupabase();
  return [];
}

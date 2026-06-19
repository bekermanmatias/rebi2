import {
  supabase,
  getProducts as getProductsFromSupabase,
  getCategories as getCategoriesFromSupabase,
  getProductBySlug as getProductBySlugFromSupabase,
  getBrands as getBrandsFromSupabase,
  getBanners as getBannersFromSupabase,
  getPromoCards as getPromoCardsFromSupabase,
} from './supabase';
import type { Product, Category, Brand, Banner, PromoCard, HomeFeatureSection, HomeReview } from '../types';
import { apiGet } from './apiClient';

function shouldUseBackend(): boolean {
  // Prefer backend when configured. Allows gradual migration without breaking.
  const base = import.meta.env.PUBLIC_API_BASE_URL;
  return typeof base === 'string' && base.trim().length > 0;
}

export async function getCategories(): Promise<Category[]> {
  if (shouldUseBackend()) return apiGet<Category[]>('/categories');
  if (supabase) return getCategoriesFromSupabase();
  return [];
}

export async function getBrands(): Promise<Brand[]> {
  if (shouldUseBackend()) return apiGet<Brand[]>('/brands');
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
  if (shouldUseBackend()) {
    return apiGet<Product[]>('/products', {
      featured: options?.featured,
      limit: options?.limit,
      category: options?.categorySlug,
      brand: options?.brandSlug,
      search: options?.search,
    });
  }
  if (supabase) return getProductsFromSupabase(options);
  return [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (shouldUseBackend()) {
    try {
      return await apiGet<Product>(`/products/${encodeURIComponent(slug)}`);
    } catch {
      return null;
    }
  }
  if (supabase) return getProductBySlugFromSupabase(slug);
  return null;
}

export async function getBanners(): Promise<Banner[]> {
  if (shouldUseBackend()) return apiGet<Banner[]>('/banners');
  if (supabase) return getBannersFromSupabase();
  return [];
}

export async function getPromoCards(): Promise<PromoCard[]> {
  if (shouldUseBackend()) return apiGet<PromoCard[]>('/promo-cards');
  if (supabase) return getPromoCardsFromSupabase();
  return [];
}

export async function getHomeFeatureSection(slug: string): Promise<HomeFeatureSection | null> {
  if (!shouldUseBackend()) return null;
  try {
    return await apiGet<HomeFeatureSection>(`/home-sections/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getHomeReviews(): Promise<HomeReview[]> {
  if (!shouldUseBackend()) return [];
  try {
    return await apiGet<HomeReview[]>('/home-reviews');
  } catch {
    return [];
  }
}

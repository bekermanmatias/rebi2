export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  slogan?: string | null;
  logo_url?: string | null;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  variant_id?: string | null;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  size_name: string | null;
  packaging: string | null;
  price: number | null;
  weight_kg: number | null;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  weight_kg: number | null;
  is_active: boolean;
  is_featured?: boolean;
  category_id: string;
  brand_id: string | null;
  created_at?: string;

  category?: Category;
  brand?: Brand;
  product_images?: ProductImage[];
  variants?: ProductVariant[];

  /** Computed: primary image URL (from product_images) */
  image_url?: string | null;
  /** Computed: all image URLs sorted by display_order */
  images?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  variantImageUrl?: string;
}

export interface PromoCard {
  id: string;
  title: string;
  image_url: string;
  target_link: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Banner {
  id: string;
  title: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  target_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface HomeFeatureSection {
  slug: string;
  title: string | null;
  image_url: string | null;
  target_link: string | null;
  tile_images: string[];
  is_active: boolean;
}

export interface HomeReview {
  id: string;
  author_name: string;
  review_text: string;
  avatar_url?: string | null;
  attachment_url?: string | null;
  stars: number;
  display_order: number;
  is_active: boolean;
}

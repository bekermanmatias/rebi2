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
}

export interface PromoCard {
  id: string;
  discount_badge: string | null;
  title: string;
  subtitle: string | null;
  image_url: string;
  target_link: string;
  layout_type: 'card' | 'banner';
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

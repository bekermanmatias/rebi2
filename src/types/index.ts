export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  stock_status: boolean;
  category_id: string;
  image_url: string | null;
  brand?: string;
  sku?: string;
  unit?: string;
  images?: string[];
  specifications?: Record<string, string>;
  badge?: string;
  category?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Banner {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
}

/**
 * Tipos alineados con el esquema de Supabase.
 * categories: id (UUID), name (string), slug (string)
 * products: id (UUID), name (string), slug (string), description (text), price (numeric, opcional),
 *           stock_status (boolean), category_id (relación), image_url (string)
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
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
  /** Relación expandida (opcional) */
  category?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

import { useEffect } from 'react';
import { useCartStore } from '../../lib/cartStore';
import type { Product } from '../../types';

function addToCartListeners() {
  document.querySelectorAll('.add-to-cart').forEach((btn) => {
    btn.removeEventListener('click', handleAddClick);
    btn.addEventListener('click', handleAddClick);
  });
}

function resolveImageUrl(url: string | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return typeof window !== 'undefined' ? `${window.location.origin}${trimmed}` : trimmed;
  return trimmed;
}

function handleAddClick(e: Event) {
  const target = e.currentTarget as HTMLElement;
  const imageUrl = resolveImageUrl((target as HTMLButtonElement).dataset.productImageUrl);
  const product: Product = {
    id: target.dataset.productId ?? '',
    name: target.dataset.productName ?? '',
    slug: target.dataset.productSlug ?? '',
    description: null,
    price: null,
    is_active: true,
    weight_kg: null,
    category_id: '',
    brand_id: null,
    image_url: imageUrl,
  };
  useCartStore.getState().addItem(product, 1);
}

export default function AddToCartHandler() {
  useEffect(() => {
    addToCartListeners();
    const observer = new MutationObserver(addToCartListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

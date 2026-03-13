import { useState, useEffect, useCallback } from 'react';
import type { ProductImage } from '../types';

interface Props {
  productImages: ProductImage[];
  fallbackUrl?: string | null;
  productName: string;
}

export default function ProductGallery({ productImages, fallbackUrl, productName }: Props) {
  const images = productImages.length > 0
    ? productImages
    : fallbackUrl
      ? [{ id: 'fallback', image_url: fallbackUrl, is_primary: true, display_order: 0, product_id: '' }]
      : [];

  const primaryIndex = Math.max(0, images.findIndex((img) => img.is_primary));
  const [selected, setSelected] = useState(primaryIndex);

  const navigateToVariant = useCallback((e: Event) => {
    const variantId = (e as CustomEvent<string>).detail;
    if (!variantId) return;
    const idx = images.findIndex((img) => img.variant_id === variantId);
    if (idx !== -1) setSelected(idx);
  }, [images]);

  useEffect(() => {
    window.addEventListener('variant-selected', navigateToVariant);
    return () => window.removeEventListener('variant-selected', navigateToVariant);
  }, [navigateToVariant]);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-300">
        <svg className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white">
        <img
          src={images[selected]?.image_url}
          alt={productName}
          className="h-full w-full object-contain p-4"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === selected ? 'border-red-600' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img src={img.image_url} alt={`${productName} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

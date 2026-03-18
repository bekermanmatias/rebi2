import { useEffect } from 'react';
import { useRecentlyViewedStore } from '../lib/recentlyViewedStore';
import type { Product } from '../types';

interface Props {
  product: Product;
}

export default function TrackProductView({ product }: Props) {
  const addProduct = useRecentlyViewedStore((s) => s.addProduct);

  useEffect(() => {
    addProduct(product);
  }, [product.id]);

  return null;
}

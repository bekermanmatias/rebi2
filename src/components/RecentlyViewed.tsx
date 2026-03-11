import { useRecentlyViewedStore } from '../lib/recentlyViewedStore';
import ProductCard from './ProductCard';

export default function RecentlyViewed() {
  const products = useRecentlyViewedStore((s) => s.products);

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold uppercase italic text-gray-900 sm:text-2xl">
            Últimos vistos
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

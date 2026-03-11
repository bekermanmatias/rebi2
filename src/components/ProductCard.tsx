import type { Product } from '../types';

interface Props {
  product: Product;
  showAddToCart?: boolean;
}

const badgeColors: Record<string, string> = {
  'OFERTA SEMANA': 'bg-red-600',
  'ENVÍO GRATIS': 'bg-green-600',
  'HOT SALE': 'bg-orange-500',
  'POPULAR': 'bg-blue-600',
};

export default function ProductCard({ product, showAddToCart = true }: Props) {
  const badgeColor = product.badge ? (badgeColors[product.badge] ?? 'bg-gray-700') : '';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
      {product.badge && (
        <span
          className={`absolute left-3 top-3 z-10 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white ${badgeColor}`}
        >
          {product.badge}
        </span>
      )}

      <a href={`/producto/${product.slug}`} className="block aspect-square overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </a>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="mb-1 text-xs font-bold uppercase tracking-wider text-red-600">
            {product.category.name}
          </span>
        )}

        {product.brand && (
          <span className="mb-1 text-xs font-medium text-gray-500">{product.brand}</span>
        )}

        <h3 className="mb-1 text-sm font-semibold leading-tight text-gray-900 line-clamp-2">
          <a href={`/producto/${product.slug}`} className="transition-colors hover:text-red-600">
            {product.name}
          </a>
        </h3>

        {(product.brand || product.unit) && (
          <p className="mb-3 text-xs text-gray-400">
            {[product.brand && `Marca: ${product.brand}`, product.unit].filter(Boolean).join(' | ')}
          </p>
        )}

        {showAddToCart && (
          <div className="mt-auto">
            <button
              type="button"
              className="add-to-cart flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              data-product-id={product.id}
              data-product-slug={product.slug}
              data-product-name={product.name}
              data-product-price={product.price ?? 0}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Añadir a la cotización
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

import type { Product } from '../types';

interface Props {
  product: Product;
  showAddToCart?: boolean;
}

export default function ProductCard({ product, showAddToCart = true }: Props) {
  const priceFormatted =
    product.price != null
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price)
      : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <a href={`/producto/${product.slug}`} className="block aspect-square bg-stone-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </a>
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-600">
            {product.category.name}
          </span>
        )}
        <h3 className="mb-2 font-semibold text-stone-900 line-clamp-2">
          <a href={`/producto/${product.slug}`} className="hover:text-amber-600">
            {product.name}
          </a>
        </h3>
        {product.description && (
          <p className="mb-3 flex-1 text-sm text-stone-500 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2">
          {priceFormatted ? (
            <span className="text-lg font-bold text-stone-900">{priceFormatted}</span>
          ) : (
            <span className="text-sm text-stone-500">Consultar precio</span>
          )}
          {showAddToCart && (
            <button
              type="button"
              className="add-to-cart rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              data-product-id={product.id}
              data-product-slug={product.slug}
              data-product-name={product.name}
              data-product-price={product.price ?? 0}
            >
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

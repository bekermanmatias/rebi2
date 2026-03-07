import { useState, useMemo } from 'react';
import type { Product, Category } from '../types';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
  categories: Category[];
}

export default function CatalogWithFilters({ products, categories }: Props) {
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('');

  const filtered = useMemo(() => {
    let list = products;
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [products, categories, search, categorySlug]);

  return (
    <div>
      <form
        className="mb-10 flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex-1">
          <label htmlFor="q" className="mb-1 block text-sm font-medium text-stone-700">
            Búsqueda
          </label>
          <input
            type="search"
            id="q"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: cemento, pintura, taladro..."
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-stone-700">
            Categoría
          </label>
          <select
            id="categoria"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setCategorySlug('');
          }}
          className="rounded-lg border border-stone-300 px-5 py-2.5 font-medium text-stone-700 transition-colors hover:bg-stone-50"
        >
          Limpiar
        </button>
      </form>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <p className="text-stone-600">No se encontraron productos con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategorySlug('');
            }}
            className="mt-4 font-medium text-amber-600 hover:text-amber-700"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

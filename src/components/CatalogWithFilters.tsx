import { useState, useMemo } from 'react';
import type { Product, Category } from '../types';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
  categories: Category[];
}

type SortOption = 'relevance' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export default function CatalogWithFilters({ products, categories }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [stockOnly, setStockOnly] = useState(false);

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach((p) => {
      if (p.brand?.name) b.add(p.brand.name);
    });
    return Array.from(b).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;

    if (selectedCategories.length > 0) {
      const catIds = categories
        .filter((c) => selectedCategories.includes(c.slug))
        .map((c) => c.id);
      list = list.filter((p) => catIds.includes(p.category_id));
    }

    if (selectedBrands.length > 0) {
      list = list.filter((p) => p.brand?.name && selectedBrands.includes(p.brand.name));
    }

    if (stockOnly) {
      list = list.filter((p) => p.is_active);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          (p.brand?.name?.toLowerCase().includes(q) ?? false)
      );
    }

    switch (sortBy) {
      case 'name-asc':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
    }

    return list;
  }, [products, categories, search, selectedCategories, selectedBrands, sortBy, stockOnly]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearAll = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSortBy('relevance');
    setStockOnly(false);
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar filters */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Filtrar productos</h3>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-700">Categorías</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-700">Marcas líderes</h4>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <label key={brand} className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Stock filter */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-sm font-bold text-red-800">Envío a obra</span>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={(e) => setStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs text-red-700">Solo con stock inmediato</span>
            </label>
          </div>

          {(selectedCategories.length > 0 || selectedBrands.length > 0 || search || stockOnly) && (
            <button
              type="button"
              onClick={clearAll}
              className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <strong>{filtered.length}</strong> resultado{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Ordenar por:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="relevance">Más relevantes</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
          </div>
        </div>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-4 text-gray-600">No se encontraron productos con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 font-medium text-red-600 hover:text-red-700"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Product, Category, Brand } from '../types';
import ProductCard from './ProductCard';

const PAGE_SIZE = 12;

interface Props {
  products: Product[];
  categories: Category[];
  brandLogos?: Brand[];
}

type SortOption = 'relevance' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export default function CatalogWithFilters({ products, categories, brandLogos }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [stockOnly, setStockOnly] = useState(false);
  const [page, setPage] = useState(1);

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

  const visibleCount = page * PAGE_SIZE;
  const paginated = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, selectedBrands, sortBy, stockOnly]);

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

  const hasActiveFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || stockOnly;

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar filters */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Filtrar productos</h3>
          </div>

          {/* Burbujas de filtros activos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((slug) => {
                const cat = categories.find((c) => c.slug === slug);
                return (
                  <span
                    key={`cat-${slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm"
                  >
                    {cat?.name ?? slug}
                    <button
                      type="button"
                      onClick={() => toggleCategory(slug)}
                      className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                      aria-label="Quitar filtro"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })}
              {selectedBrands.map((brand) => (
                <span
                  key={`brand-${brand}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm"
                >
                  {brand}
                  <button
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    aria-label="Quitar filtro"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {stockOnly && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm">
                  Solo con stock inmediato
                  <button
                    type="button"
                    onClick={() => setStockOnly(false)}
                    className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    aria-label="Quitar filtro"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Categorías - clicable */}
          <div>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">Categorías</h4>
            <div className="space-y-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className="block w-full rounded px-2 py-1 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Marcas líderes - clicable */}
          {brands.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">Marcas líderes</h4>
              <div className="space-y-0.5">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className="block w-full rounded px-2 py-1 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock - clickable */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-sm font-bold text-red-800">Envío a obra</span>
            </div>
            <button
              type="button"
              onClick={() => setStockOnly((prev) => !prev)}
              className="mt-3 block w-full rounded-lg px-3 py-2 text-left text-xs text-red-700 transition-colors hover:bg-red-100"
            >
              Solo con stock inmediato
            </button>
          </div>

          {hasActiveFilters && (
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
        {/* Brand strip (logos): solo visible cuando no hay filtro de marca; al tocar una se aplica el filtro y se oculta */}
        {brandLogos && brandLogos.length > 0 && selectedBrands.length === 0 && (
          <BrandStrip brands={brandLogos} onSelectBrand={toggleBrand} />
        )}

        {/* Top bar */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            {filtered.length === 0 ? (
              'Sin resultados'
            ) : hasMore ? (
              <>
                Mostrando <strong>{paginated.length}</strong> de <strong>{filtered.length}</strong> resultado{filtered.length !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                Mostrando <strong>{filtered.length}</strong> resultado{filtered.length !== 1 ? 's' : ''}
              </>
            )}
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
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Ver más */}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border-2 border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  Ver más productos
                </button>
              </div>
            )}
          </>
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

function BrandStrip({ brands, onSelectBrand }: { brands: Brand[]; onSelectBrand: (brandName: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return;
    const amount = 100;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  }

  if (brands.length === 0) return null;

  return (
    <div className="relative mb-3 -mt-8 mr-auto max-w-[1045px]">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute -left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-hidden px-8 sm:gap-4"
      >
        {brands.map((brand) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => onSelectBrand(brand.name)}
            className="group flex shrink-0 flex-col items-center text-center"
            aria-label={`Filtrar por ${brand.name}`}
          >
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-2 transition-all group-hover:border-red-500 group-hover:shadow-sm sm:h-20 sm:w-20">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" loading="lazy" />
              ) : (
                <span className="text-[9px] font-bold uppercase text-gray-400">{brand.name.slice(0, 3)}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute -right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

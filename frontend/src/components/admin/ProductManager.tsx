import { useState, useEffect, useCallback } from 'react';
import type { Category, Brand } from '../../types';
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
  saveProduct,
  deleteProduct,
  updateProductFeatured,
  saveVariants,
  deleteVariant,
  saveImages,
  deleteImage,
  uploadAdminImage,
  type ProductRow,
  type VariantRow,
  type ImageRow,
} from '../../lib/adminApi';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Main component ──────────────────────────────────────────────────
export default function ProductManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState('');

  const [debugInfo, setDebugInfo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setDebugInfo('Cargando...');
    try {
      const [p, c, b] = await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()]);
      setDebugInfo(`Productos: ${p.length}, Categorías: ${c.length}, Marcas: ${b.length}`);
      setProducts(p);
      setCategories(c);
      setBrands(b);
    } catch (err) {
      setDebugInfo(`Error: ${err}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleNew() {
    setIsNew(true);
    setEditing({
      id: '',
      name: '',
      slug: '',
      description: '',
      weight_kg: null,
      is_active: true,
      is_featured: false,
      category_id: categories[0]?.id ?? '',
      brand_id: null,
      product_variants: [],
      product_images: [],
    });
  }

  function handleEdit(p: ProductRow) {
    setIsNew(false);
    setEditing({ ...p });
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto y todas sus variantes e imágenes?')) return;
    await deleteProduct(id);
    load();
  }

  async function handleToggleFeatured(p: ProductRow) {
    const next = !(p.is_featured === true);
    const ok = await updateProductFeatured(p.id, next);
    if (ok) setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_featured: next } : x)));
  }

  function handleClose() {
    setEditing(null);
    setIsNew(false);
    load();
  }

  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  if (editing) {
    return (
      <ProductForm
        product={editing}
        isNew={isNew}
        categories={categories}
        brands={brands}
        onClose={handleClose}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo producto
        </button>
      </div>

      {debugInfo && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          {debugInfo} | ENV: {import.meta.env.PUBLIC_SUPABASE_URL ? '✓ URL' : '✗ URL'}, {import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? '✓ KEY' : '✗ KEY'}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Producto</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Categoría</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Variantes</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Imágenes</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Destacado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const cat = Array.isArray(p.category) ? p.category[0] : p.category;
                const brand = Array.isArray(p.brand) ? p.brand[0] : p.brand;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{cat?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{brand?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.product_variants?.length ?? 0}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.product_images?.length ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        title={p.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        className={`rounded p-1.5 transition-colors ${p.is_featured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:bg-gray-100 hover:text-amber-400'}`}
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(p)} className="mr-2 text-sm font-medium text-blue-600 hover:text-blue-800">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Eliminar</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No se encontraron productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Product Form ────────────────────────────────────────────────────
function ProductForm({
  product,
  isNew,
  categories,
  brands,
  onClose,
}: {
  product: ProductRow;
  isNew: boolean;
  categories: Category[];
  brands: Brand[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    weight_kg: product.weight_kg?.toString() ?? '',
    is_active: product.is_active,
    is_featured: product.is_featured === true,
    category_id: product.category_id,
    brand_id: product.brand_id ?? '',
  });
  const [variants, setVariants] = useState<VariantRow[]>(product.product_variants ?? []);
  const [images, setImages] = useState<ImageRow[]>(product.product_images ?? []);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'images'>('info');
  const [error, setError] = useState('');

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && (isNew || prev.slug === slugify(prev.name))) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim() || !form.category_id) {
      setError('Nombre, slug y categoría son obligatorios');
      return;
    }
    setError('');
    setSaving(true);

    const productId = await saveProduct({
      id: isNew ? undefined : product.id,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      category_id: form.category_id,
      brand_id: form.brand_id || null,
    });

    if (!productId) {
      setError('Error al guardar el producto');
      setSaving(false);
      return;
    }

    await saveVariants(productId, variants);
    await saveImages(productId, images);

    setSaving(false);
    onClose();
  }

  const tabs = [
    { id: 'info' as const, label: 'Información' },
    { id: 'variants' as const, label: `Variantes (${variants.length})` },
    { id: 'images' as const, label: `Imágenes (${images.length})` },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Nuevo producto' : `Editar: ${product.name}`}
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Info tab */}
        {activeTab === 'info' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Peso (kg)</label>
              <input
                type="number"
                step="0.01"
                value={form.weight_kg}
                onChange={(e) => updateField('weight_kg', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría *</label>
              <select
                value={form.category_id}
                onChange={(e) => updateField('category_id', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Marca</label>
              <select
                value={form.brand_id}
                onChange={(e) => updateField('brand_id', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">Sin marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Producto activo</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => updateField('is_featured', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Destacado (Destacados de la semana)</label>
              </div>
            </div>
          </div>
        )}

        {/* Variants tab */}
        {activeTab === 'variants' && (
          <VariantEditor variants={variants} setVariants={setVariants} productId={product.id} />
        )}

        {/* Images tab */}
        {activeTab === 'images' && (
          <ImageEditor images={images} setImages={setImages} variants={variants} productId={product.id} />
        )}
      </div>

      {/* Actions bar */}
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isNew ? 'Crear producto' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

// ─── Variant Editor ──────────────────────────────────────────────────
function VariantEditor({
  variants,
  setVariants,
  productId,
}: {
  variants: VariantRow[];
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
  productId: string;
}) {
  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { sku: '', size_name: '', packaging: '', price: null, weight_kg: null, is_active: true },
    ]);
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string | boolean | number | null) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  async function removeVariant(index: number) {
    const v = variants[index];
    if (v.id) {
      if (!confirm('¿Eliminar esta variante?')) return;
      await deleteVariant(v.id);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{variants.length} variante(s)</p>
        <button
          onClick={addVariant}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar variante
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No hay variantes. Agregá una para definir tamaños y presentaciones.</p>
      ) : (
        <div className="space-y-4">
          {variants.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Variante {i + 1}</span>
                <button onClick={() => removeVariant(i)} className="text-xs font-medium text-red-600 hover:text-red-800">Eliminar</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tamaño (size_name)</label>
                  <input
                    type="text"
                    value={v.size_name ?? ''}
                    onChange={(e) => updateVariant(i, 'size_name', e.target.value)}
                    placeholder="Ej: 4 oz (1/32 Galón)"
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Presentación (packaging)</label>
                  <input
                    type="text"
                    value={v.packaging ?? ''}
                    onChange={(e) => updateVariant(i, 'packaging', e.target.value)}
                    placeholder="Ej: 50u. x caja / 1 Unidad"
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">SKU</label>
                  <input
                    type="text"
                    value={v.sku ?? ''}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={v.price ?? ''}
                    onChange={(e) => updateVariant(i, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={v.weight_kg ?? ''}
                    onChange={(e) => updateVariant(i, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={v.is_active}
                      onChange={(e) => updateVariant(i, 'is_active', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600"
                    />
                    Activa
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Editor ────────────────────────────────────────────────────
function ImageEditor({
  images,
  setImages,
  variants,
  productId,
}: {
  images: ImageRow[];
  setImages: React.Dispatch<React.SetStateAction<ImageRow[]>>;
  variants: VariantRow[];
  productId: string;
}) {
  const [newUrl, setNewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  function addImage() {
    if (!newUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        image_url: newUrl.trim(),
        is_primary: prev.length === 0,
        display_order: prev.length,
        variant_id: null,
      },
    ]);
    setNewUrl('');
  }

  async function addImageFromFile(file: File) {
    setUploading(true);
    const result = await uploadAdminImage(file, 'products');
    setUploading(false);
    if (!result.publicUrl) {
      alert(result.error || 'No se pudo subir la imagen');
      return;
    }
    setImages((prev) => [
      ...prev,
      {
        image_url: result.publicUrl,
        is_primary: prev.length === 0,
        display_order: prev.length,
        variant_id: null,
      },
    ]);
  }

  function updateImage(index: number, field: keyof ImageRow, value: string | boolean | number | null) {
    setImages((prev) =>
      prev.map((img, i) => {
        if (field === 'is_primary' && value === true) {
          return { ...img, is_primary: i === index };
        }
        return i === index ? { ...img, [field]: value } : img;
      })
    );
  }

  async function removeImage(index: number) {
    const img = images[index];
    if (img.id) {
      if (!confirm('¿Eliminar esta imagen?')) return;
      await deleteImage(img.id);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  const savedVariants = variants.filter((v) => v.id);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <p className="mb-2 text-xs text-gray-500">Tamaño recomendado: 1200×1200 px. Formato cuadrado para mejor consistencia en catálogo.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="URL de la imagen..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addImage()}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={addImage}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {uploading ? 'Subiendo...' : 'Subir desde PC'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  await addImageFromFile(file);
                  input.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {images.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No hay imágenes. Pegá una URL para agregar.</p>
      ) : (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={img.id ?? `new-${i}`} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <img src={img.image_url} alt="" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="text"
                  value={img.image_url}
                  onChange={(e) => updateImage(i, 'image_url', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="radio"
                      name="primary_image"
                      checked={img.is_primary}
                      onChange={() => updateImage(i, 'is_primary', true)}
                      className="text-red-600"
                    />
                    Principal
                  </label>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500">Orden:</label>
                    <input
                      type="number"
                      value={img.display_order}
                      onChange={(e) => updateImage(i, 'display_order', parseInt(e.target.value) || 0)}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500">Variante:</label>
                    <select
                      value={img.variant_id ?? ''}
                      onChange={(e) => updateImage(i, 'variant_id', e.target.value || null)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Ninguna</option>
                      {savedVariants.map((v) => (
                        <option key={v.id} value={v.id}>{v.size_name || v.sku || v.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] text-gray-500">Reemplazo recomendado: 1200×1200 px.</p>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Reemplazar archivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        const result = await uploadAdminImage(file, 'products', img.image_url);
                        setUploading(false);
                        if (!result.publicUrl) {
                          alert(result.error || 'No se pudo reemplazar la imagen');
                        } else {
                          updateImage(i, 'image_url', result.publicUrl);
                        }
                        input.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              <button onClick={() => removeImage(i)} className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

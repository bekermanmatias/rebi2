import { useState, useMemo } from 'react';
import { useCartStore } from '../lib/cartStore';
import type { Product, ProductVariant } from '../types';

interface Props {
  product: Product;
}

function parsePackagingOptions(packaging: string | null): string[] {
  if (!packaging) return [];
  return packaging.split('/').map((s) => s.trim()).filter(Boolean);
}

export default function ProductActions({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
  const hasVariants = activeVariants.length > 0;
  const hasSizes = activeVariants.some((v) => v.size_name);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    activeVariants.length === 1 ? activeVariants[0].id : null
  );
  const [selectedPackaging, setSelectedPackaging] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId);

  const packagingOptions = useMemo(() => {
    if (!selectedVariant) return [];
    return parsePackagingOptions(selectedVariant.packaging);
  }, [selectedVariant]);

  const needsPackagingSelection = packagingOptions.length > 1;

  function handleSelectSize(variant: ProductVariant) {
    setSelectedVariantId(variant.id);
    setSelectedPackaging(null);
    setError('');

    const options = parsePackagingOptions(variant.packaging);
    if (options.length === 1) {
      setSelectedPackaging(options[0]);
    }

    window.dispatchEvent(new CustomEvent('variant-selected', { detail: variant.id }));
  }

  function handleSelectPackaging(pkg: string) {
    setSelectedPackaging(pkg);
    setError('');
  }

  function handleAdd() {
    if (hasVariants && hasSizes && !selectedVariantId) {
      setError('Seleccioná un tamaño para continuar');
      return;
    }
    if (hasVariants && needsPackagingSelection && !selectedPackaging) {
      setError('Seleccioná una presentación para continuar');
      return;
    }

    const sizePart = selectedVariant?.size_name;
    const pkgPart = selectedPackaging ?? (packagingOptions.length === 1 ? packagingOptions[0] : selectedVariant?.packaging);
    const labelParts = [sizePart, pkgPart].filter(Boolean);
    const variantLabel = labelParts.length > 0 ? labelParts.join(' — ') : undefined;
    const variantKey = selectedVariantId
      ? `${selectedVariantId}${selectedPackaging ? `__${selectedPackaging}` : ''}`
      : undefined;

    const variantImage = selectedVariantId
      ? product.product_images?.find((img) => img.variant_id === selectedVariantId)?.image_url
      : undefined;

    addItem(product, quantity, variantKey, variantLabel, variantImage);
    setQuantity(1);
  }

  if (!hasVariants) {
    return (
      <div className="space-y-6">
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        <AddButton onClick={handleAdd} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Size + Packaging stacked */}
      <div className="flex flex-col gap-4">
        {/* Size selector */}
        {hasSizes && (
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Tamaño
            </label>
            <div className="flex flex-wrap gap-2">
              {activeVariants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectSize(v)}
                    className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {v.size_name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Packaging selector */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Presentación
          </label>
          {!selectedVariantId && hasSizes ? (
            <div className="flex h-[42px] items-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4">
              <span className="text-sm text-gray-400">Primero elegí un tamaño</span>
            </div>
          ) : packagingOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {packagingOptions.map((pkg) => {
                const isSelected = selectedPackaging === pkg;
                return (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => handleSelectPackaging(pkg)}
                    className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {pkg}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[42px] items-center rounded-lg border-2 border-gray-200 bg-gray-50 px-4">
              <span className="text-sm text-gray-500">
                {selectedVariant?.packaging ?? 'Presentación única'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}

      {/* Quantity + Add to cart */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        <AddButton onClick={handleAdd} />
      </div>

    </div>
  );
}

function QuantitySelector({
  quantity,
  setQuantity,
}: {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">Cantidad</label>
      <div className="inline-flex items-center rounded-lg border border-gray-300">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-100"
        >
          −
        </button>
        <input
          type="number"
          value={quantity}
          min={1}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-10 w-14 appearance-none border-x border-gray-300 text-center text-sm font-medium text-gray-900 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-red-700 sm:w-auto sm:px-12"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      AÑADIR AL CARRITO
    </button>
  );
}

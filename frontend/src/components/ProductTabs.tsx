import { useState } from 'react';
import type { ProductVariant } from '../types';

interface Props {
  variants?: ProductVariant[];
  description?: string | null;
  weightKg?: number | null;
}

type Tab = 'specs' | 'description' | 'docs';

export default function ProductTabs({ variants, description, weightKg }: Props) {
  const [active, setActive] = useState<Tab>('specs');

  const activeVariants = variants?.filter((v) => v.is_active) ?? [];
  const hasVariants = activeVariants.length > 0;
  const hasSizes = activeVariants.some((v) => v.size_name);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'specs', label: 'Especificaciones' },
    { id: 'description', label: 'Descripción' },
    { id: 'docs', label: 'Fichas Técnicas' },
  ];

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`border-b-2 pb-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                active === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-6">
        {active === 'specs' && (
          <div className="space-y-8">
            {/* Variants table */}
            {hasVariants && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Presentaciones disponibles
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <tbody>
                      {activeVariants.map((v, i) => {
                        const label = hasSizes ? (v.size_name ?? '—') : `Variante ${i + 1}`;
                        const value = [v.packaging, v.sku].filter(Boolean).join(' · ') || '—';
                        return (
                          <tr key={v.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{label}</td>
                            <td className="px-6 py-3.5 text-sm text-gray-600">{value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* General specs */}
            {weightKg != null && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  Detalles del producto
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">Peso</td>
                        <td className="px-6 py-3.5 text-sm text-gray-600">{weightKg} Kg</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!hasVariants && weightKg == null && (
              <p className="text-sm text-gray-500">No hay especificaciones disponibles para este producto.</p>
            )}
          </div>
        )}

        {active === 'description' && (
          <div className="prose max-w-none text-gray-600">
            {description ? (
              <p className="whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="text-sm text-gray-500">No hay descripción disponible.</p>
            )}
          </div>
        )}

        {active === 'docs' && (
          <p className="text-sm text-gray-500">No hay fichas técnicas disponibles para descargar.</p>
        )}
      </div>
    </div>
  );
}

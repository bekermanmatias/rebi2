import { useState } from 'react';

interface Props {
  specifications?: Record<string, string>;
  description?: string | null;
}

type Tab = 'specs' | 'description' | 'docs';

export default function ProductTabs({ specifications, description }: Props) {
  const [active, setActive] = useState<Tab>('specs');

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
        {active === 'specs' && specifications && Object.keys(specifications).length > 0 && (
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Detalles Técnicos
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <tbody>
                  {Object.entries(specifications).map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{key}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active === 'specs' && (!specifications || Object.keys(specifications).length === 0) && (
          <p className="text-sm text-gray-500">No hay especificaciones disponibles para este producto.</p>
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

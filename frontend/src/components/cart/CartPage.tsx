import { useState } from 'react';
import { useCartStore, itemKey } from '../../lib/cartStore';

const WHATSAPP_NUMBER = import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '5491112345678';

const SUCURSALES = [
  {
    id: 'uchuraccay',
    nombre: 'REBI - Av. Mártires de Uchuraccay',
    direccion: 'Av. Mártires de Uchuraccay 2482, MOLLEPAMPA',
  },
  {
    id: 'hoyos_rubio',
    nombre: 'REBI - Av. Hoyos Rubio',
    direccion: 'María de Nararet, Av. Hoyos Rubio 872, Cajamarca',
  },
] as const;

type TipoEntrega = 'envio' | 'retiro_uchuraccay' | 'retiro_hoyos_rubio';

function buildWhatsAppMessage(
  codigoVendedor?: string,
  tipoEntrega?: TipoEntrega,
  direccionEnvio?: string
) {
  const { items } = useCartStore.getState();
  const lines = items.map(
    (i) => `• ${i.product.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} x${i.quantity}`
  );
  const parts = [
    '¡Hola! Me interesa consultar por los siguientes productos:',
    '',
    lines.join('\n'),
  ];
  if (tipoEntrega === 'envio' && direccionEnvio?.trim()) {
    parts.push('', `*Entrega:* Envío a domicilio`, `*Dirección:* ${direccionEnvio.trim()}`);
  } else if (tipoEntrega === 'retiro_uchuraccay') {
    const s = SUCURSALES.find((x) => x.id === 'uchuraccay');
    parts.push('', `*Entrega:* Retiro en sucursal`, `*Sucursal:* ${s?.nombre} — ${s?.direccion}`);
  } else if (tipoEntrega === 'retiro_hoyos_rubio') {
    const s = SUCURSALES.find((x) => x.id === 'hoyos_rubio');
    parts.push('', `*Entrega:* Retiro en sucursal`, `*Sucursal:* ${s?.nombre} — ${s?.direccion}`);
  }
  if (codigoVendedor?.trim()) {
    parts.push('', `Código de vendedor: ${codigoVendedor.trim()}`);
  }
  return encodeURIComponent(parts.join('\n'));
}

function resolveImageSrc(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (typeof window !== 'undefined' && trimmed.startsWith('/')) return `${window.location.origin}${trimmed}`;
  return trimmed;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const [codigoVendedor, setCodigoVendedor] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('envio');
  const [direccionEnvio, setDireccionEnvio] = useState('');

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(codigoVendedor, tipoEntrega, direccionEnvio)}`;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Mi Carrito {totalItems > 0 && `(${totalItems} ${totalItems === 1 ? 'producto' : 'productos'})`}
      </h1>

      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <svg
            className="h-20 w-20 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-5 text-base text-gray-500">Tu carrito está vacío</p>
          <a
            href="/productos"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Ver catálogo
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Contenido principal: lista */}
          <div className="min-w-0 flex-1">
          <ul className="mt-8 space-y-4">
            {items.map((item) => {
              const key = itemKey(item.product.id, item.variantId);
              const displayImage = resolveImageSrc(item.variantImageUrl || item.product.image_url);
              return (
                <li
                  key={key}
                  className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={item.product.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <svg
                          className="h-10 w-10"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/producto/${item.product.slug}`}
                      className="text-base font-semibold leading-tight text-gray-900 hover:text-red-600"
                    >
                      {item.product.name}
                    </a>
                    {item.variantLabel && (
                      <p className="mt-1 text-sm text-gray-500">{item.variantLabel}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 rounded-lg border border-gray-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-base font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(key)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <a
              href="/productos"
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              ← Seguir comprando
            </a>
          </div>
          </div>

          {/* Barra derecha: entrega, código vendedor, botón */}
          <div className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
            <aside className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">Entrega</p>
              <div className="mt-3 space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="tipo-entrega"
                    checked={tipoEntrega === 'envio'}
                    onChange={() => setTipoEntrega('envio')}
                    className="mt-1 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-800">Envío a domicilio</span>
                </label>
                {tipoEntrega === 'envio' && (
                  <div className="w-full">
                    <label htmlFor="direccion-envio" className="mb-1 block text-xs font-medium text-gray-600">
                      Dirección
                    </label>
                    <textarea
                      id="direccion-envio"
                      value={direccionEnvio}
                      onChange={(e) => setDireccionEnvio(e.target.value)}
                      placeholder="Calle, número, localidad..."
                      rows={3}
                      className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                )}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="tipo-entrega"
                    checked={tipoEntrega === 'retiro_uchuraccay'}
                    onChange={() => setTipoEntrega('retiro_uchuraccay')}
                    className="mt-1 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-gray-800">Retiro: </span>
                    <span className="text-gray-800">REBI - Av. Mártires de Uchuraccay</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      Av. Mártires de Uchuraccay 2482, Mollepampa
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="tipo-entrega"
                    checked={tipoEntrega === 'retiro_hoyos_rubio'}
                    onChange={() => setTipoEntrega('retiro_hoyos_rubio')}
                    className="mt-1 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-gray-800">Retiro: </span>
                    <span className="text-gray-800">REBI - Av. Hoyos Rubio</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      María de Nararet, Av. Hoyos Rubio 872, Cajamarca
                    </span>
                  </span>
                </label>
              </div>
            </aside>
            <aside className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <label htmlFor="codigo-vendedor" className="text-sm font-semibold text-gray-700">
                Código de vendedor
              </label>
              <input
                id="codigo-vendedor"
                type="text"
                value={codigoVendedor}
                onChange={(e) => setCodigoVendedor(e.target.value)}
                placeholder="Opcional"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </aside>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Finalizar compra
            </a>
            <p className="text-xs text-gray-500">
              Se abrirá WhatsApp con tu lista, opción de entrega y código de vendedor (si lo ingresaste).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

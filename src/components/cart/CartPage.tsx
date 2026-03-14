import { useCartStore, itemKey } from '../../lib/cartStore';

const WHATSAPP_NUMBER = import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '5491112345678';

function buildWhatsAppMessage() {
  const { items } = useCartStore.getState();
  const lines = items.map(
    (i) => `• ${i.product.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} x${i.quantity}`
  );
  const body = [
    '¡Hola! Me interesa consultar por los siguientes productos:',
    '',
    lines.join('\n'),
  ].join('\n');
  return encodeURIComponent(body);
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`;

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
        <>
          <ul className="mt-8 space-y-4">
            {items.map((item) => {
              const key = itemKey(item.product.id, item.variantId);
              const displayImage = item.variantImageUrl || item.product.image_url;
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

          <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-4 text-base font-bold text-white transition-colors hover:bg-green-700"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Consultar por WhatsApp
            </a>
            <p className="mt-3 text-center text-sm text-gray-500">
              Enviá tu lista por WhatsApp y te respondemos con precios y disponibilidad.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/productos"
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              ← Seguir comprando
            </a>
          </div>
        </>
      )}
    </div>
  );
}

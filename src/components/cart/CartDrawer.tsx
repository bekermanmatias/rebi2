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

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  if (!isOpen) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 cursor-pointer bg-gray-900/50 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">
            Mi Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <svg className="h-20 w-20 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-5 text-base text-gray-500">Tu carrito está vacío</p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-5 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Seguir explorando
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const key = itemKey(item.product.id, item.variantId);
                const displayImage = item.variantImageUrl || item.product.image_url;
                return (
                  <li key={key} className="flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-white border border-gray-100">
                      {displayImage ? (
                        <img src={displayImage} alt={item.product.name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 leading-tight">{item.product.name}</h3>
                      {item.variantLabel && (
                        <p className="mt-1 text-sm text-gray-500">{item.variantLabel}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-base text-gray-600 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-base font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-base text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          className="ml-auto text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
          {items.length > 0 ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-4 text-base font-bold text-white transition-colors hover:bg-red-700"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Consultar por WhatsApp
            </a>
          ) : (
            <p className="text-center text-base text-gray-500">
              Agregá productos a tu carrito
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

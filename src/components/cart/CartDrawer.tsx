import { useCartStore } from '../../lib/cartStore';

const WHATSAPP_NUMBER = import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '5491112345678';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
}

function buildWhatsAppMessage() {
  const { items, getTotalPrice } = useCartStore.getState();
  const total = getTotalPrice();
  const lines = items.map(
    (i) =>
      `• ${i.product.name} x${i.quantity}${i.product.price != null ? ` - ${formatPrice(i.product.price * i.quantity)}` : ''}`
  );
  const body = [
    '¡Hola! Solicito cotización para los siguientes productos:',
    '',
    lines.join('\n'),
    total > 0 ? `\nTotal estimado: ${formatPrice(total)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return encodeURIComponent(body);
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore();
  const total = getTotalPrice();
  const totalItems = getTotalItems();

  if (!isOpen) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de cotización"
      >
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <h2 className="text-lg font-semibold text-stone-900">
            Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Cerrar carrito"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-stone-500">El carrito está vacío</p>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 rounded-lg border border-stone-200 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-stone-100">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-stone-900 truncate">{product.name}</h3>
                    {product.price != null && (
                      <p className="text-sm text-stone-500">{formatPrice(product.price)} c/u</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="h-7 w-7 rounded border border-stone-300 text-stone-600 hover:bg-stone-100"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="h-7 w-7 rounded border border-stone-300 text-stone-600 hover:bg-stone-100"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="ml-auto text-sm text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-stone-200 p-4">
          {total > 0 && (
            <p className="mb-3 text-right text-lg font-bold text-stone-900">
              Total estimado: {formatPrice(total)}
            </p>
          )}
          {items.length > 0 ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Solicitar cotización por WhatsApp
            </a>
          ) : (
            <p className="text-center text-sm text-stone-500">Agregá productos al carrito para solicitar cotización</p>
          )}
        </div>
      </aside>
    </>
  );
}

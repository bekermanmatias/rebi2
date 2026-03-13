import { useEffect, useRef } from 'react';
import { useCartStore } from '../../lib/cartStore';
import type { CartNotification } from '../../lib/cartStore';

export default function CartButton() {
  const { getTotalItems, toggleCart, notification, dismissNotification } = useCartStore();
  const count = getTotalItems();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notification) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismissNotification, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification, dismissNotification]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleCart}
        className="relative flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-red-600"
        aria-label={`Mi Carrito: ${count} productos`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -left-1 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
        <span className="hidden lg:inline">Mi Carrito</span>
      </button>

      {notification && (
        <CartAddedNotification data={notification} onDismiss={dismissNotification} />
      )}
    </div>
  );
}

function CartAddedNotification({
  data,
  onDismiss,
}: {
  data: CartNotification;
  onDismiss: () => void;
}) {
  const details = [data.sizeName, data.packagingName].filter(Boolean).join(' — ');

  return (
    <div className="animate-fade-in-up absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:w-80">
      {/* Arrow */}
      <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-gray-200 bg-white" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-green-700">Agregado al carrito</p>
          <p className="mt-1 text-sm font-medium text-gray-900 truncate">{data.productName}</p>
          {details && (
            <p className="mt-0.5 text-xs text-gray-500">{details}</p>
          )}
          <p className="mt-0.5 text-xs text-gray-500">Cantidad: {data.quantity}</p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          onDismiss();
          useCartStore.getState().openCart();
        }}
        className="mt-3 w-full rounded-lg bg-red-600 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-red-700"
      >
        Ver carrito
      </button>
    </div>
  );
}

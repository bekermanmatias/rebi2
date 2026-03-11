import { useCartStore } from '../../lib/cartStore';

export default function CartButton() {
  const { getTotalItems, toggleCart } = useCartStore();
  const count = getTotalItems();

  return (
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
  );
}

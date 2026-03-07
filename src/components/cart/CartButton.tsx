import { useCartStore } from '../../lib/cartStore';

export default function CartButton() {
  const { getTotalItems, toggleCart } = useCartStore();
  const count = getTotalItems();

  return (
    <button
      type="button"
      onClick={toggleCart}
      className="relative rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
      aria-label={`Carrito: ${count} productos`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

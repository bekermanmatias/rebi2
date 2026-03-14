import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

export interface CartNotification {
  productName: string;
  sizeName?: string;
  packagingName?: string;
  quantity: number;
  timestamp: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  notification: CartNotification | null;
  addItem: (product: Product, quantity?: number, variantId?: string, variantLabel?: string, variantImageUrl?: string) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  dismissNotification: () => void;
  getTotalItems: () => number;
}

function itemKey(productId: string, variantId?: string) {
  return variantId ? `${productId}__${variantId}` : productId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      notification: null,

      addItem: (product, quantity = 1, variantId, variantLabel, variantImageUrl) => {
        const key = itemKey(product.id, variantId);
        set((state) => {
          const existing = state.items.find(
            (i) => itemKey(i.product.id, i.variantId) === key
          );
          const items = existing
            ? state.items.map((i) =>
                itemKey(i.product.id, i.variantId) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            : [...state.items, { product, quantity, variantId, variantLabel, variantImageUrl }];

          const parts = variantLabel?.split(' — ') ?? [];
          return {
            items,
            notification: {
              productName: product.name,
              sizeName: parts[0] || undefined,
              packagingName: parts[1] || undefined,
              quantity,
              timestamp: Date.now(),
            },
          };
        });
      },

      removeItem: (key) => {
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.product.id, i.variantId) !== key
          ),
        }));
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.product.id, i.variantId) === key ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      dismissNotification: () => set({ notification: null }),

      getTotalItems: () =>
        get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    {
      name: 'rebi-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export { itemKey };

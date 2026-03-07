import { create } from 'zustand';
import type { Product, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      const items = existing
        ? state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...state.items, { product, quantity }];
      return { items, isOpen: true };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  getTotalItems: () =>
    get().items.reduce((acc, i) => acc + i.quantity, 0),

  getTotalPrice: () =>
    get().items.reduce((acc, i) => {
      const p = i.product.price;
      return acc + (p != null ? p * i.quantity : 0);
    }, 0),
}));

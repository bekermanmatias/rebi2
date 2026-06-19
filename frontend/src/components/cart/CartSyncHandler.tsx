import { useEffect, useRef } from 'react';
import { useCartStore, itemKey } from '../../lib/cartStore';
import { supabaseAuthClient } from '../../lib/authClient';
import type { CartItem } from '../../types';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function mergeCartItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const it of a) map.set(itemKey(it.product.id, it.variantId), { ...it });
  for (const it of b) {
    const k = itemKey(it.product.id, it.variantId);
    const existing = map.get(k);
    if (existing) {
      // Idempotente: evita duplicar cantidades si la sincronización corre más de una vez.
      map.set(k, { ...existing, quantity: Math.max(existing.quantity, it.quantity) });
    } else {
      map.set(k, { ...it });
    }
  }
  return Array.from(map.values());
}

async function getToken(): Promise<string | null> {
  if (!supabaseAuthClient) return null;
  const { data } = await supabaseAuthClient.auth.getSession();
  return data.session?.access_token ?? null;
}

async function fetchRemoteItems(): Promise<CartItem[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/me/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.items) ? (data.items as CartItem[]) : [];
  } catch {
    return [];
  }
}

async function pushRemote(items: CartItem[]) {
  const token = await getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/me/cart`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
  } catch {
    // Silencioso: si falla la sincro, mantenemos el carrito local.
  }
}

export default function CartSyncHandler() {
  const isLoggedInRef = useRef(false);
  const hasSyncedCurrentSessionRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedRef = useRef<string>('');

  useEffect(() => {
    if (!supabaseAuthClient) return;

    let mounted = true;

    async function syncOnLogin() {
      if (hasSyncedCurrentSessionRef.current) return;
      const localItems = useCartStore.getState().items;
      const remoteItems = await fetchRemoteItems();
      if (!mounted) return;
      const merged = mergeCartItems(localItems, remoteItems);
      useCartStore.setState({ items: merged });
      const serialized = JSON.stringify(merged);
      lastPushedRef.current = serialized;
      hasSyncedCurrentSessionRef.current = true;
      if (JSON.stringify(remoteItems) !== serialized) {
        await pushRemote(merged);
      }
    }

    const unsubStore = useCartStore.subscribe((state, prev) => {
      if (!isLoggedInRef.current) return;
      if (state.items === prev.items) return;
      const serialized = JSON.stringify(state.items);
      if (serialized === lastPushedRef.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        lastPushedRef.current = serialized;
        pushRemote(state.items);
      }, 600);
    });

    supabaseAuthClient.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        isLoggedInRef.current = true;
        hasSyncedCurrentSessionRef.current = false;
        syncOnLogin();
      }
    });

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((event, session) => {
      const wasLogged = isLoggedInRef.current;
      isLoggedInRef.current = !!session;

      if (event === 'SIGNED_IN' && session && !wasLogged) {
        hasSyncedCurrentSessionRef.current = false;
        syncOnLogin();
      } else if (event === 'SIGNED_OUT') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        useCartStore.getState().clearCart();
        lastPushedRef.current = '';
        hasSyncedCurrentSessionRef.current = false;
      }
    });

    return () => {
      mounted = false;
      unsubStore();
      listener.subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return null;
}

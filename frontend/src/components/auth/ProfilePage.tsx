import { useEffect, useMemo, useState } from 'react';
import { supabaseAuthClient } from '../../lib/authClient';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type ProfileState =
  | { status: 'loading' }
  | { status: 'guest' }
  | {
      status: 'auth';
      email: string | null;
      fullName: string | null;
      avatarUrl: string | null;
      createdAt: string | null;
      lastSignIn: string | null;
    };

type OrderItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

type OrderRow = {
  id: string;
  status: string;
  delivery_type: 'envio' | 'retiro_uchuraccay' | 'retiro_hoyos_rubio' | string;
  delivery_address: string | null;
  branch_id: string | null;
  vendedor_code: string | null;
  items: OrderItem[] | null;
  created_at: string;
};

type Section = 'data' | 'orders' | 'addresses';

const SECTIONS: Array<{
  id: Section;
  label: string;
  description: string;
  icon: (active: boolean) => React.ReactNode;
}> = [
  {
    id: 'data',
    label: 'Mis datos',
    description: 'Información de tu cuenta',
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? 'text-red-600' : 'text-gray-400'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Mis pedidos',
    description: 'Historial y estado',
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? 'text-red-600' : 'text-gray-400'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    id: 'addresses',
    label: 'Direcciones',
    description: 'Direcciones de envío',
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? 'text-red-600' : 'text-gray-400'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    pending: { label: 'Pendiente', classes: 'bg-amber-100 text-amber-800' },
    accepted: { label: 'Aceptada', classes: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelada', classes: 'bg-gray-200 text-gray-700' },
  };
  return map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' };
}

function deliveryLabel(o: OrderRow) {
  if (o.delivery_type === 'envio') {
    return `Envío${o.delivery_address ? ` — ${o.delivery_address}` : ''}`;
  }
  if (o.delivery_type === 'retiro_uchuraccay') return 'Retiro — Uchuraccay';
  if (o.delivery_type === 'retiro_hoyos_rubio') return 'Retiro — Hoyos Rubio';
  return o.delivery_type;
}

function readSectionFromHash(): Section {
  if (typeof window === 'undefined') return 'data';
  const hash = window.location.hash.replace('#', '') as Section;
  return SECTIONS.some((s) => s.id === hash) ? hash : 'data';
}

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });
  const [signingOut, setSigningOut] = useState(false);
  const [section, setSection] = useState<Section>('data');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    setSection(readSectionFromHash());
    const onHashChange = () => setSection(readSectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!supabaseAuthClient) {
      setState({ status: 'guest' });
      return;
    }

    let mounted = true;

    async function load() {
      const { data } = await supabaseAuthClient!.auth.getUser();
      if (!mounted) return;
      const user = data.user;
      if (!user) {
        setState({ status: 'guest' });
        return;
      }
      const meta = user.user_metadata ?? {};
      setState({
        status: 'auth',
        email: user.email ?? null,
        fullName: (meta.full_name as string) || (meta.name as string) || null,
        avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
        createdAt: user.created_at ?? null,
        lastSignIn: user.last_sign_in_at ?? null,
      });
    }

    load();

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setState({ status: 'guest' });
        setOrders([]);
      } else {
        load();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state.status !== 'auth' || !supabaseAuthClient) return;

    let cancelled = false;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const { data: sess } = await supabaseAuthClient!.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) {
          if (!cancelled) setOrders([]);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/me/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as OrderRow[];
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled) setOrdersError('No se pudieron cargar tus pedidos.');
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  const initial = useMemo(() => {
    if (state.status !== 'auth') return 'U';
    return (state.fullName || state.email || 'U').trim().charAt(0).toUpperCase();
  }, [state]);

  function changeSection(next: Section) {
    setSection(next);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`);
    }
  }

  async function signOut() {
    if (!supabaseAuthClient) return;
    setSigningOut(true);
    await supabaseAuthClient.auth.signOut();
    window.location.href = '/';
  }

  function openAuth() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:open'));
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        Cargando tu cuenta...
      </div>
    );
  }

  if (state.status === 'guest') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="mt-2 text-sm text-gray-500">Iniciá sesión para ver tu perfil y tus pedidos.</p>
        <button
          onClick={openAuth}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Ingresar
        </button>
      </div>
    );
  }

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[260px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            {state.avatarUrl ? (
              <img
                src={state.avatarUrl}
                alt={state.fullName || state.email || 'avatar'}
                className="h-12 w-12 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {state.fullName || 'Mi Cuenta'}
              </p>
              <p className="truncate text-xs text-gray-500">{state.email ?? '—'}</p>
            </div>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-1">
            {SECTIONS.map((s) => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeSection(s.id)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-red-50 font-semibold text-red-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {s.icon(active)}
                  <span className="flex flex-col leading-tight">
                    <span>{s.label}</span>
                    <span className={`text-xs ${active ? 'text-red-500/80' : 'text-gray-400'}`}>
                      {s.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{current.label}</h1>
            <p className="text-sm text-gray-500">{current.description}</p>
          </div>
        </header>

        {section === 'data' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Nombre" value={state.fullName ?? '—'} />
            <InfoRow label="Email" value={state.email ?? '—'} />
            <InfoRow label="Cuenta creada" value={formatDate(state.createdAt)} />
            <InfoRow label="Último ingreso" value={formatDate(state.lastSignIn)} />
          </div>
        )}

        {section === 'orders' && (
          <OrdersList loading={ordersLoading} error={ordersError} orders={orders} />
        )}

        {section === 'addresses' && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
            <p className="text-sm text-gray-500">
              Todavía no tenés direcciones guardadas.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Próximamente podrás guardar tus direcciones de envío frecuentes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function OrdersList({
  loading,
  error,
  orders,
}: {
  loading: boolean;
  error: string | null;
  orders: OrderRow[];
}) {
  if (loading) {
    return <p className="text-sm text-gray-500">Cargando pedidos...</p>;
  }
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
        <p className="text-sm text-gray-500">Todavía no realizaste ningún pedido.</p>
        <a
          href="/productos"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
        >
          Ver catálogo
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        const totalItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
        const badge = statusBadge(o.status);
        return (
          <li
            key={o.id}
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Pedido #{o.id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
                {badge.label}
              </span>
            </div>
            <div className="mt-3 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
              <p>
                <span className="font-medium text-gray-500">Entrega:</span>{' '}
                {deliveryLabel(o)}
              </p>
              <p className="sm:text-right">
                <span className="font-medium text-gray-500">Items:</span> {totalItems}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm text-gray-800">{value}</p>
    </div>
  );
}

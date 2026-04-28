import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '../../lib/authClient';

type ProfileState =
  | { status: 'loading' }
  | { status: 'guest' }
  | {
      status: 'auth';
      email: string | null;
      fullName: string | null;
      avatarUrl: string | null;
      provider: string | null;
      createdAt: string | null;
      lastSignIn: string | null;
    };

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });
  const [signingOut, setSigningOut] = useState(false);

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
        provider: user.app_metadata?.provider ?? null,
        createdAt: user.created_at ?? null,
        lastSignIn: user.last_sign_in_at ?? null,
      });
    }

    load();

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setState({ status: 'guest' });
      } else {
        load();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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

  const initial = (state.fullName || state.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:gap-5">
          {state.avatarUrl ? (
            <img
              src={state.avatarUrl}
              alt={state.fullName || state.email || 'avatar'}
              className="h-16 w-16 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600">
              {initial}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900">
              {state.fullName || 'Mi Cuenta'}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">{state.email ?? '—'}</p>
            {state.provider && (
              <p className="mt-1 text-xs text-gray-400">
                Cuenta vinculada con{' '}
                <span className="font-medium capitalize text-gray-600">{state.provider}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 pt-6 sm:grid-cols-2">
          <InfoRow label="Email" value={state.email ?? '—'} />
          <InfoRow label="Proveedor" value={state.provider ? state.provider : '—'} capitalize />
          <InfoRow label="Cuenta creada" value={formatDate(state.createdAt)} />
          <InfoRow label="Último ingreso" value={formatDate(state.lastSignIn)} />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href="/carrito"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Ir al carrito
          </a>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 truncate text-sm text-gray-800 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}

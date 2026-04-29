import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '../lib/authClient';

type AuthState = {
  loading: boolean;
  email?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function splitName(fullName?: string | null, firstName?: string | null, lastName?: string | null) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  if (first && last) return { first, last };

  const full = (fullName || '').trim();
  if (!full) return { first: '', last: '' };

  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: full, last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function buildLoginHref() {
  if (typeof window === 'undefined') return '/login';
  const current = window.location.pathname + window.location.search;
  return `/login?redirect=${encodeURIComponent(current || '/')}`;
}

export default function AuthButton() {
  const [state, setState] = useState<AuthState>({ loading: true });
  const [loginHref, setLoginHref] = useState('/login');

  useEffect(() => {
    setLoginHref(buildLoginHref());

    if (!supabaseAuthClient) {
      setState({ loading: false, email: null, displayName: null });
      return;
    }

    let mounted = true;

    supabaseAuthClient.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const user = data.user;
        const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
        const firstName = typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name.trim() : '';
        const lastName = typeof user?.user_metadata?.last_name === 'string' ? user.user_metadata.last_name.trim() : '';
        const displayName = fullName || [firstName, lastName].filter(Boolean).join(' ') || (user?.email ?? null);
        setState({ loading: false, email: user?.email ?? null, displayName, firstName, lastName });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ loading: false, email: null, displayName: null });
      });

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
      const firstName = typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name.trim() : '';
      const lastName = typeof user?.user_metadata?.last_name === 'string' ? user.user_metadata.last_name.trim() : '';
      const displayName = fullName || [firstName, lastName].filter(Boolean).join(' ') || (user?.email ?? null);
      setState({ loading: false, email: user?.email ?? null, displayName, firstName, lastName });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (state.loading) {
    return <span className="text-sm text-gray-400">Cargando...</span>;
  }

  if (state.email) {
    const split = splitName(state.displayName, state.firstName, state.lastName);
    return (
      <a
        href="/mi-cuenta"
        className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-red-600"
        aria-label="Mi Cuenta"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden lg:inline">
          {split.first && split.last ? (
            <span className="flex flex-col leading-tight">
              <span>{split.first}</span>
              <span>{split.last}</span>
            </span>
          ) : (
            split.first || state.displayName || 'Mi Cuenta'
          )}
        </span>
      </a>
    );
  }

  return (
    <a
      href={loginHref}
      className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-red-600"
      aria-label="Ingresar"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span className="hidden lg:inline">Ingresar</span>
    </a>
  );
}

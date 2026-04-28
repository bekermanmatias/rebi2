import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '../lib/authClient';

type AuthState = {
  loading: boolean;
  email?: string | null;
};

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
      setState({ loading: false, email: null });
      return;
    }

    let mounted = true;

    supabaseAuthClient.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setState({ loading: false, email: data.user?.email ?? null });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ loading: false, email: null });
      });

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({ loading: false, email: session?.user?.email ?? null });
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
    return (
      <a
        href="/mi-cuenta"
        className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-red-600"
        aria-label="Mi Cuenta"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden lg:inline">Mi Cuenta</span>
      </a>
    );
  }

  return (
    <a
      href={loginHref}
      className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-red-600"
      aria-label="Ingresar"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

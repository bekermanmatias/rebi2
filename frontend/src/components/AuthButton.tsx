import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '../lib/authClient';

type AuthState = {
  loading: boolean;
  email?: string | null;
};

export default function AuthButton() {
  const [state, setState] = useState<AuthState>({ loading: true });

  useEffect(() => {
    if (!supabaseAuthClient) {
      setState({ loading: false });
      return;
    }
    supabaseAuthClient.auth.getUser().then(({ data }) => {
      setState({ loading: false, email: data.user?.email ?? null });
    }).catch(() => setState({ loading: false }));
  }, []);

  async function signInWithGoogle() {
    if (!supabaseAuthClient) return;
    await supabaseAuthClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    if (!supabaseAuthClient) return;
    await supabaseAuthClient.auth.signOut();
    window.location.reload();
  }

  if (state.loading) {
    return (
      <button className="rounded-full bg-gray-100 px-4 py-1.5 text-xs text-gray-500">
        Cargando...
      </button>
    );
  }

  if (state.email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-gray-700 sm:inline">
          {state.email}
        </span>
        <button
          onClick={signOut}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
    >
      Ingresar
    </button>
  );
}


import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '../../lib/authClient';

type State =
  | { status: 'loading' }
  | { status: 'invalid'; reason: string }
  | { status: 'ready'; email: string }
  | { status: 'success'; email: string };

const LockIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 11v2m6 4H6a2 2 0 01-2-2v-4a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2zM8 9V7a4 4 0 118 0v2"
    />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7a11.7 11.7 0 01-3.17 4.32M6.61 6.61C4.36 8.13 2.7 10.36 2 12c1 3 5 7 10 7 1.66 0 3.22-.39 4.6-1.06"
      />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const ShieldIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 11v3m0-9l8 3v6c0 4-3.4 7.5-8 9-4.6-1.5-8-5-8-9V5l8-3z"
    />
  </svg>
);

const CheckIcon = ({ ok }: { ok: boolean }) => (
  <svg
    className={`h-3.5 w-3.5 ${ok ? 'text-emerald-500' : 'text-gray-300'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.4}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

function readHashError(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const errorDescription = params.get('error_description') || params.get('error') || null;
  return errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : null;
}

export default function CompleteRegistration() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [activateLink, setActivateLink] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseAuthClient) {
      setState({ status: 'invalid', reason: 'La autenticación no está configurada.' });
      return;
    }

    const searchParams = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
    const activate = searchParams?.get('activate');
    if (activate) {
      setActivateLink(activate);
      setState({ status: 'invalid', reason: '' });
      return;
    }

    const hashError = readHashError();
    if (hashError) {
      setState({
        status: 'invalid',
        reason:
          'El enlace ya expiró o no es válido. Pedí uno nuevo desde la pantalla de registro.',
      });
      return;
    }

    let mounted = true;

    async function check() {
      const { data, error: sessionError } = await supabaseAuthClient!.auth.getSession();
      if (!mounted) return;

      if (sessionError) {
        setState({
          status: 'invalid',
          reason: 'No pudimos validar tu enlace. Probá generando uno nuevo.',
        });
        return;
      }

      if (data.session?.user) {
        setState({
          status: 'ready',
          email: data.session.user.email ?? '',
        });
        return;
      }

      // Esperamos un instante: Supabase suele procesar el hash de forma asíncrona.
      setTimeout(async () => {
        if (!mounted) return;
        const second = await supabaseAuthClient!.auth.getSession();
        if (second.data.session?.user) {
          setState({
            status: 'ready',
            email: second.data.session.user.email ?? '',
          });
        } else {
          setState({
            status: 'invalid',
            reason:
              'Este enlace ya no es válido. Pedí uno nuevo desde la pantalla de registro.',
          });
        }
      }, 600);
    }

    check();

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setState((prev) =>
          prev.status === 'success'
            ? prev
            : { status: 'ready', email: session.user.email ?? '' }
        );
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const rules = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirm,
  };
  const allOk = rules.length && rules.letter && rules.number && rules.match;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!supabaseAuthClient) return;
    if (state.status !== 'ready') return;

    if (!allOk) {
      setError('Revisá que la contraseña cumpla los requisitos y coincida.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabaseAuthClient.auth.updateUser({ password });
      if (updateError) throw updateError;

      setState({ status: 'success', email: state.email });
      setTimeout(() => {
        window.location.href = '/mi-cuenta';
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl bg-white p-7 text-center text-sm text-gray-500 shadow-sm ring-1 ring-gray-100 sm:p-8">
          Validando tu enlace...
        </div>
      </div>
    );
  }

  if (state.status === 'invalid') {
    if (activateLink) {
      return (
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-gray-100 sm:p-8">
            <h1 className="text-xl font-bold text-gray-900">Continuar activación</h1>
            <p className="mt-2 text-sm text-gray-500">
              Para evitar que el enlace se consuma por previsualizaciones automáticas,
              confirmá manualmente el inicio de activación.
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = activateLink; }}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Activar mi cuenta
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-gray-100 sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Enlace inválido o vencido</h1>
          <p className="mt-2 text-sm text-gray-500">{state.reason}</p>
          <a
            href="/login"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Volver a iniciar
          </a>
        </div>
      </div>
    );
  }

  if (state.status === 'success') {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-gray-100 sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">¡Cuenta activada!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Tu contraseña fue guardada correctamente. Te estamos llevando a tu cuenta...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Creá tu contraseña</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Estás activando la cuenta de{' '}
            <strong className="text-gray-700">{state.email || 'tu correo'}</strong>
          </p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </label>

          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/15"
            />
          </label>

          <ul className="space-y-1.5 px-1 pt-1 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <CheckIcon ok={rules.length} /> Al menos 8 caracteres
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon ok={rules.letter} /> Incluye una letra
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon ok={rules.number} /> Incluye un número
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon ok={rules.match} /> Las contraseñas coinciden
            </li>
          </ul>

          <button
            type="submit"
            disabled={submitting || !allOk}
            className="mt-2 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldIcon />
        Tu contraseña queda cifrada con SSL y nunca se comparte.
      </p>
    </div>
  );
}

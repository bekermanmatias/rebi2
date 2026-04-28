import { useEffect, useMemo, useState } from 'react';
import { supabaseAuthClient } from '../../lib/authClient';

type Mode = 'login' | 'register' | 'forgot';

function getRedirectPath() {
  if (typeof window === 'undefined') return '/';
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('redirect') || '/';
  return raw.startsWith('/') ? raw : '/';
}

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v2m6 4H6a2 2 0 01-2-2v-4a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2zM8 9V7a4 4 0 118 0v2" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7a11.7 11.7 0 01-3.17 4.32M6.61 6.61C4.36 8.13 2.7 10.36 2 12c1 3 5 7 10 7 1.66 0 3.22-.39 4.6-1.06" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const ShieldIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v3m0-9l8 3v6c0 4-3.4 7.5-8 9-4.6-1.5-8-5-8-9V5l8-3z" />
  </svg>
);

const GoogleLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 34.91 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.094 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const FacebookLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.792-4.682 4.533-4.682 1.313 0 2.686.236 2.686.236v2.97h-1.514c-1.49 0-1.955.93-1.955 1.886v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

type AuthPageProps = {
  onClose?: () => void;
};

export default function AuthPage({ onClose }: AuthPageProps = {}) {
  const isModal = typeof onClose === 'function';
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const redirectPath = useMemo(() => getRedirectPath(), []);

  useEffect(() => {
    if (!supabaseAuthClient) return;

    supabaseAuthClient.auth.getSession().then(({ data }) => {
      if (data.session) {
        if (isModal) onClose?.();
        else window.location.href = redirectPath;
      }
    });

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (isModal) onClose?.();
        else window.location.href = redirectPath;
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [redirectPath, isModal, onClose]);

  function resetMessages() {
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetMessages();

    if (!supabaseAuthClient) {
      setError('La autenticación no está configurada.');
      return;
    }

    if (mode === 'login' && (!email.trim() || !password.trim())) {
      setError('Completá email y contraseña.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: e1 } = await supabaseAuthClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (e1) throw e1;
      } else if (mode === 'register') {
        if (!email.trim()) {
          setError('Ingresá tu email.');
          setLoading(false);
          return;
        }
        const { error: e2 } = await supabaseAuthClient.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
            emailRedirectTo:
              typeof window !== 'undefined'
                ? `${window.location.origin}/login?redirect=${encodeURIComponent(redirectPath)}`
                : undefined,
          },
        });
        if (e2) throw e2;
        setMessage('Te enviamos un enlace a tu correo para acceder a tu cuenta.');
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setError('Ingresá tu email.');
          setLoading(false);
          return;
        }
        const { error: e3 } = await supabaseAuthClient.auth.resetPasswordForEmail(email.trim(), {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/login?redirect=${encodeURIComponent(redirectPath)}`
              : undefined,
        });
        if (e3) throw e3;
        setMessage('Te enviamos un email para restablecer tu contraseña.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithProvider(provider: 'google' | 'facebook') {
    resetMessages();
    if (!supabaseAuthClient) {
      setError('La autenticación no está configurada.');
      return;
    }

    setOauthLoading(provider);
    const { error: oauthError } = await supabaseAuthClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/login?redirect=${encodeURIComponent(redirectPath)}`
            : undefined,
      },
    });
    if (oauthError) {
      setError(`No se pudo iniciar con ${provider}.`);
      setOauthLoading(null);
    }
  }

  const titles: Record<Mode, { title: string; subtitle: string; cta: string }> = {
    login: {
      title: 'Bienvenido de nuevo',
      subtitle: 'Ingresá a tu cuenta para continuar',
      cta: 'Ingresar',
    },
    register: {
      title: 'Registrarse',
      subtitle: 'Solo necesitamos tu correo electrónico',
      cta: 'Registrarse',
    },
    forgot: {
      title: 'Recuperar contraseña',
      subtitle: 'Te enviaremos un enlace a tu email',
      cta: 'Enviar enlace',
    },
  };

  const t = titles[mode];

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100 sm:p-8">
        {isModal && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{t.subtitle}</p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <MailIcon />
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/15"
            />
          </label>

          {mode === 'login' && (
            <label className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contraseña"
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
          )}

          {mode === 'register' && (
            <p className="px-1 pt-1 text-xs leading-relaxed text-gray-500">
              Te enviaremos un enlace a tu correo para acceder a tu cuenta.
              Tus datos se usan para procesar tus pedidos y mejorar tu experiencia.
            </p>
          )}

          {mode === 'forgot' && (
            <p className="px-1 pt-1 text-xs leading-relaxed text-gray-500">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Recordarme
              </label>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('forgot');
                }}
                className="font-semibold text-red-600 hover:text-red-700"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Procesando...' : t.cta}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">O continúa con</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={oauthLoading !== null}
                onClick={() => signInWithProvider('google')}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleLogo />
                <span>{oauthLoading === 'google' ? 'Redirigiendo...' : 'Continuar con Google'}</span>
              </button>
              <button
                type="button"
                disabled={oauthLoading !== null}
                onClick={() => signInWithProvider('facebook')}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FacebookLogo />
                <span>{oauthLoading === 'facebook' ? 'Redirigiendo...' : 'Continuar con Facebook'}</span>
              </button>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          {mode === 'login' && (
            <>
              ¿No tenés una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('register');
                }}
                className="font-semibold text-red-600 hover:text-red-700"
              >
                Registrate aquí
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('login');
                }}
                className="font-semibold text-red-600 hover:text-red-700"
              >
                Iniciá sesión
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setMode('login');
              }}
              className="font-semibold text-red-600 hover:text-red-700"
            >
              Volver a iniciar sesión
            </button>
          )}
        </p>

        {(message || error) && (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldIcon />
        Tus datos están protegidos con cifrado SSL
      </p>
    </div>
  );
}

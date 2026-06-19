import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '../../lib/authClient';
import { getAdminPin, setAdminPin } from '../../lib/adminApi';

export default function AdminGuard() {
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function check() {
      const apiBase = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
      let pin = getAdminPin();
      for (let i = 0; i < 3; i++) {
        const { data: sess } = supabaseAuthClient
          ? await supabaseAuthClient.auth.getSession()
          : { data: { session: null } };
        const token = sess.session?.access_token ?? '';
        const verifyRes = await fetch(`${apiBase}/admin/verify-pin`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-admin-pin': pin,
          },
        });
        if (verifyRes.ok) {
          setAdminPin(pin);
          setChecking(false);
          return;
        }
        const typed = window.prompt('Ingresá PIN de admin');
        if (!typed) {
          window.location.href = '/';
          return;
        }
        pin = typed.trim();
      }
      setError('PIN de admin inválido.');
      window.setTimeout(() => { window.location.href = '/'; }, 1200);
      return;
    }

    check().catch(() => {
      if (!mounted) return;
      setError('No se pudo validar acceso admin.');
      setChecking(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-white/85 backdrop-blur-sm">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
          Verificando acceso admin...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-white/85 backdrop-blur-sm">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  return null;
}


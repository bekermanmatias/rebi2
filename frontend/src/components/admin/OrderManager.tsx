import { useEffect, useMemo, useState } from 'react';
import { supabaseAuthClient } from '../../lib/authClient';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type OrderRow = {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  status: string;
  delivery_type: string;
  delivery_address: string | null;
  branch_id: string | null;
  vendedor_code: string | null;
  whatsapp_number: string | null;
  items: Array<{ productId: string; variantId?: string; quantity: number }> | any;
  created_at: string;
};

async function getToken(): Promise<string | null> {
  if (!supabaseAuthClient) return null;
  const { data } = await supabaseAuthClient.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function OrderManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('pending');

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) {
        setError('Tenés que iniciar sesión (admin) para ver órdenes.');
        setOrders([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OrderRow[];
      setOrders(data);
    } catch (e) {
      setError(`No se pudieron cargar las órdenes. ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function accept(orderId: string) {
    setError('');
    try {
      const token = await getToken();
      if (!token) {
        setError('Tenés que iniciar sesión (admin).');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { order: OrderRow; whatsappUrl: string | null };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      if (data.whatsappUrl) window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(`No se pudo aceptar la orden. ${String(e)}`);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="pending">Pendientes</option>
            <option value="accepted">Aceptadas</option>
            <option value="all">Todas</option>
          </select>
          <button
            onClick={load}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Recargar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Entrega</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Items</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => {
                const itemsCount = Array.isArray(o.items) ? o.items.reduce((acc, it) => acc + (it.quantity ?? 0), 0) : '—';
                const cliente = o.customer_email || (o.user_id ? o.user_id.slice(0, 8) : 'Guest');
                const entrega =
                  o.delivery_type === 'envio'
                    ? `Envío: ${o.delivery_address ?? '—'}`
                    : `Retiro: ${o.branch_id ?? o.delivery_type}`;
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        o.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{cliente}</td>
                    <td className="px-4 py-3 text-gray-700">{entrega}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{itemsCount}</td>
                    <td className="px-4 py-3 text-right">
                      {o.status !== 'accepted' ? (
                        <button
                          onClick={() => accept(o.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Aceptar y WhatsApp
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">Aceptada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No hay órdenes para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


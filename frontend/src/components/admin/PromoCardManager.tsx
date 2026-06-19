import { useState, useEffect, useCallback } from 'react';
import { fetchPromoCards, savePromoCard, deletePromoCard, uploadAdminImage, type PromoCardRow } from '../../lib/adminApi';

const emptyCard: PromoCardRow = {
  title: '',
  image_url: '',
  target_link: '',
  display_order: 0,
  is_active: true,
};

export default function PromoCardManager() {
  const [cards, setCards] = useState<PromoCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PromoCardRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPromoCards();
    setCards(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleNew() {
    setIsNew(true);
    setEditing({ ...emptyCard, display_order: cards.length });
  }

  function handleEdit(c: PromoCardRow) {
    setIsNew(false);
    setEditing({ ...c });
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta promo card?')) return;
    await deletePromoCard(id);
    load();
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.image_url.trim() || !editing.target_link.trim()) {
      setError('Título, imagen y link son obligatorios');
      return;
    }
    setError('');
    setSaving(true);
    const ok = await savePromoCard(editing);
    setSaving(false);
    if (!ok) { setError('Error al guardar'); return; }
    setEditing(null);
    setIsNew(false);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Promo Cards</h1>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva promo card
        </button>
      </div>

      {/* Modal/Form */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold text-gray-900">{isNew ? 'Nueva promo card' : 'Editar promo card'}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Ej: Sanitarios"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">URL de imagen *</label>
                <p className="mb-2 text-xs text-gray-500">Tamaño recomendado: 1200×930 px aprox. Mantener formato vertical corto como las cards del home.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editing.image_url}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    {uploadingImage ? 'Subiendo...' : 'Subir'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        const result = await uploadAdminImage(file, 'promo-cards', editing.image_url || undefined);
                        setUploadingImage(false);
                        if (!result.publicUrl) {
                          setError(result.error || 'No se pudo subir la imagen');
                        } else {
                          setEditing((prev) => (prev ? { ...prev, image_url: result.publicUrl! } : prev));
                        }
                        input.value = '';
                      }}
                    />
                  </label>
                </div>
                {editing.image_url && (
                  <img src={editing.image_url} alt="" className="mt-2 h-24 w-full rounded border object-cover" />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Link destino *</label>
                <input
                  type="text"
                  value={editing.target_link}
                  onChange={(e) => setEditing({ ...editing, target_link: e.target.value })}
                  placeholder="/categoria/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Orden</label>
                  <input
                    type="number"
                    value={editing.display_order}
                    onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.is_active}
                      onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-red-600"
                    />
                    Activa
                  </label>
                </div>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditing(null); setError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Preview</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Título</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Link</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Orden</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cards.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img src={c.image_url} alt="" className="h-12 w-12 rounded border object-cover" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{c.target_link}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.display_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(c)} className="mr-2 text-sm font-medium text-blue-600 hover:text-blue-800">Editar</button>
                    <button onClick={() => handleDelete(c.id!)} className="text-sm font-medium text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay promo cards</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

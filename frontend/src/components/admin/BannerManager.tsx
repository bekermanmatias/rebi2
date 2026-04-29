import { useState, useEffect, useCallback } from 'react';
import { fetchBanners, saveBanner, deleteBanner, uploadAdminImage, type BannerRow } from '../../lib/adminApi';

const emptyBanner: BannerRow = {
  title: '',
  desktop_image_url: '',
  mobile_image_url: '',
  target_link: '',
  display_order: 0,
  is_active: true,
};

export default function BannerManager() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchBanners();
    setBanners(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleNew() {
    setIsNew(true);
    setEditing({ ...emptyBanner, display_order: banners.length });
  }

  function handleEdit(b: BannerRow) {
    setIsNew(false);
    setEditing({ ...b });
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este banner?')) return;
    await deleteBanner(id);
    load();
  }

  async function handleSave() {
    if (!editing) return;
    setError('');
    setSaving(true);
    const ok = await saveBanner(editing);
    setSaving(false);
    if (!ok) { setError('Error al guardar'); return; }
    setEditing(null);
    setIsNew(false);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banners del Home</h1>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo banner
        </button>
      </div>

      {/* Modal/Form */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold text-gray-900">{isNew ? 'Nuevo banner' : 'Editar banner'}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Título (solo para alt text)</label>
                <input
                  type="text"
                  value={editing.title ?? ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Imagen Desktop (1920×400)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editing.desktop_image_url ?? ''}
                    onChange={(e) => setEditing({ ...editing, desktop_image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    {uploadingDesktop ? 'Subiendo...' : 'Subir'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingDesktop}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploadingDesktop(true);
                        const result = await uploadAdminImage(file, 'banners', editing.desktop_image_url || undefined);
                        setUploadingDesktop(false);
                        if (!result.publicUrl) {
                          setError(result.error || 'No se pudo subir la imagen desktop');
                        } else {
                          setEditing((prev) => (prev ? { ...prev, desktop_image_url: result.publicUrl! } : prev));
                        }
                        input.value = '';
                      }}
                    />
                  </label>
                </div>
                {editing.desktop_image_url && (
                  <img src={editing.desktop_image_url} alt="" className="mt-2 h-24 w-full rounded border object-cover" />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Imagen Mobile (1080×1080)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editing.mobile_image_url ?? ''}
                    onChange={(e) => setEditing({ ...editing, mobile_image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    {uploadingMobile ? 'Subiendo...' : 'Subir'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingMobile}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploadingMobile(true);
                        const result = await uploadAdminImage(file, 'banners', editing.mobile_image_url || undefined);
                        setUploadingMobile(false);
                        if (!result.publicUrl) {
                          setError(result.error || 'No se pudo subir la imagen mobile');
                        } else {
                          setEditing((prev) => (prev ? { ...prev, mobile_image_url: result.publicUrl! } : prev));
                        }
                        input.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Link destino</label>
                  <input
                    type="text"
                    value={editing.target_link ?? ''}
                    onChange={(e) => setEditing({ ...editing, target_link: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Orden</label>
                  <input
                    type="number"
                    value={editing.display_order}
                    onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-red-600"
                />
                Activo
              </label>
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
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Orden</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {b.desktop_image_url ? (
                      <img src={b.desktop_image_url} alt="" className="h-12 w-24 rounded border object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.title || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{b.display_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(b)} className="mr-2 text-sm font-medium text-blue-600 hover:text-blue-800">Editar</button>
                    <button onClick={() => handleDelete(b.id!)} className="text-sm font-medium text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay banners</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

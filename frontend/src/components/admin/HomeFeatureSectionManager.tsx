import { useCallback, useEffect, useState } from 'react';
import {
  fetchHomeFeatureSection,
  saveHomeFeatureSection,
  uploadAdminImage,
  fetchHomeReviews,
  saveHomeReviews,
  fetchPromoCards,
  savePromoCard,
  fetchProducts,
  type HomeReviewRow,
  type PromoCardRow,
} from '../../lib/adminApi';

const PROMOS_SECTION_SLUG = 'ceramicos';
const SHIPPING_SECTION_SLUG = 'envios-info';
const TOP_ALERT_SLUG = 'barra-superior';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop';

export default function HomeFeatureSectionManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingShippingIdx, setUploadingShippingIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [okShipping, setOkShipping] = useState('');
  const [promoCards, setPromoCards] = useState<PromoCardRow[]>([]);
  const [savingPromoCards, setSavingPromoCards] = useState(false);
  const [okPromoCards, setOkPromoCards] = useState('');
  const [uploadingPromoIdx, setUploadingPromoIdx] = useState<number | null>(null);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [reviews, setReviews] = useState<HomeReviewRow[]>([]);
  const [savingReviews, setSavingReviews] = useState(false);
  const [okReviews, setOkReviews] = useState('');
  const [uploadingReviewAvatarIdx, setUploadingReviewAvatarIdx] = useState<number | null>(null);
  const [uploadingReviewAttachIdx, setUploadingReviewAttachIdx] = useState<number | null>(null);
  const [savingTopAlert, setSavingTopAlert] = useState(false);
  const [okTopAlert, setOkTopAlert] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [topAlert, setTopAlert] = useState({
    title: '¡Aprovecha nuestros descuentos y promociones! Aboná en hasta 6 pagos con tarjeta',
    is_active: true,
  });
  const [form, setForm] = useState({
    title: 'Ceramicos y porcelanatos',
    image_url: FALLBACK_IMAGE,
    target_link: '/productos?categoria=pisos',
    tile_images: [
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=500&auto=format&fit=crop',
    ] as string[],
    is_active: true,
  });
  const [shippingIcons, setShippingIcons] = useState<string[]>([
    'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
    'https://cdn-icons-png.flaticon.com/512/2920/2920244.png',
    'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
  ]);

  function makeSnapshot(params: {
    topAlert: typeof topAlert;
    form: typeof form;
    shippingIcons: string[];
    promoCards: PromoCardRow[];
    reviews: HomeReviewRow[];
  }) {
    return JSON.stringify({
      topAlert: params.topAlert,
      form: params.form,
      shippingIcons: params.shippingIcons,
      promoCards: params.promoCards.map((c, i) => ({
        title: c.title ?? '',
        image_url: c.image_url ?? '',
        target_link: c.target_link ?? '',
        is_active: c.is_active !== false,
        display_order: i,
      })),
      reviews: params.reviews.map((r, i) => ({
        author_name: r.author_name ?? '',
        review_text: r.review_text ?? '',
        avatar_url: r.avatar_url ?? '',
        attachment_url: r.attachment_url ?? '',
        stars: Number(r.stars ?? 5),
        is_active: r.is_active !== false,
        display_order: i,
      })),
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [topAlertSection, section, shippingSection, loadedReviews, cards, products] = await Promise.all([
      fetchHomeFeatureSection(TOP_ALERT_SLUG),
      fetchHomeFeatureSection(PROMOS_SECTION_SLUG),
      fetchHomeFeatureSection(SHIPPING_SECTION_SLUG),
      fetchHomeReviews(),
      fetchPromoCards(),
      fetchProducts(),
    ]);
    if (topAlertSection) {
      setTopAlert({
        title: topAlertSection.title?.trim()
          || '¡Aprovecha nuestros descuentos y promociones! Aboná en hasta 6 pagos con tarjeta',
        is_active: topAlertSection.is_active !== false,
      });
    }
    setFeaturedCount(products.filter((p) => p.is_featured === true).length);
    setPromoCards((cards ?? []).slice(0, 4));
    if (section) {
      setForm({
        title: section.title || 'Ceramicos y porcelanatos',
        image_url: section.image_url || FALLBACK_IMAGE,
        target_link: section.target_link || '/productos?categoria=pisos',
        tile_images: Array.isArray(section.tile_images) && section.tile_images.length > 0
          ? section.tile_images.slice(0, 4)
          : [
              'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=500&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=500&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=500&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=500&auto=format&fit=crop',
            ],
        is_active: section.is_active,
      });
    }
    if (shippingSection?.tile_images?.length) {
      setShippingIcons(shippingSection.tile_images.slice(0, 4));
    }
    if (loadedReviews.length > 0) {
      setReviews(loadedReviews.slice(0, 20));
    } else {
      setReviews(Array.from({ length: 10 }).map((_, i) => ({
        author_name: `Cliente REBI ${i + 1}`,
        review_text: 'Excelente atención y entrega rápida. Productos de muy buena calidad.',
        avatar_url: null,
        attachment_url: null,
        stars: 5,
        display_order: i,
        is_active: true,
      })));
    }
    const nextTopAlert = topAlertSection
      ? {
          title: topAlertSection.title?.trim()
            || '¡Aprovecha nuestros descuentos y promociones! Aboná en hasta 6 pagos con tarjeta',
          is_active: topAlertSection.is_active !== false,
        }
      : topAlert;
    const nextForm = section
      ? {
          title: section.title || 'Ceramicos y porcelanatos',
          image_url: section.image_url || FALLBACK_IMAGE,
          target_link: section.target_link || '/productos?categoria=pisos',
          tile_images: Array.isArray(section.tile_images) && section.tile_images.length > 0
            ? section.tile_images.slice(0, 4)
            : [
                'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=500&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=500&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=500&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=500&auto=format&fit=crop',
              ],
          is_active: section.is_active,
        }
      : form;
    const nextShippingIcons = shippingSection?.tile_images?.length
      ? shippingSection.tile_images.slice(0, 4)
      : shippingIcons;
    const nextReviews = loadedReviews.length > 0
      ? loadedReviews.slice(0, 20)
      : Array.from({ length: 10 }).map((_, i) => ({
          author_name: `Cliente REBI ${i + 1}`,
          review_text: 'Excelente atención y entrega rápida. Productos de muy buena calidad.',
          avatar_url: null,
          attachment_url: null,
          stars: 5,
          display_order: i,
          is_active: true,
        }));
    const nextCards = (cards ?? []).slice(0, 4);
    setSavedSnapshot(makeSnapshot({
      topAlert: nextTopAlert,
      form: nextForm,
      shippingIcons: nextShippingIcons,
      promoCards: nextCards,
      reviews: nextReviews,
    }));
    setLoading(false);
  }, []);

  async function handleSaveTopAlert() {
    setSavingTopAlert(true);
    setError('');
    setOkTopAlert('');
    const success = await saveHomeFeatureSection(TOP_ALERT_SLUG, {
      title: topAlert.title.trim() || '¡Aprovecha nuestros descuentos y promociones! Aboná en hasta 6 pagos con tarjeta',
      image_url: null,
      target_link: null,
      tile_images: [],
      is_active: topAlert.is_active,
    });
    setSavingTopAlert(false);
    if (!success) {
      setError('No se pudo guardar la barra superior.');
      return;
    }
    setOkTopAlert('Barra superior guardada correctamente.');
    setSavedSnapshot(makeSnapshot({
      topAlert,
      form,
      shippingIcons,
      promoCards,
      reviews,
    }));
  }

  useEffect(() => {
    load();
  }, [load]);

  async function handleImageFile(file: File) {
    setUploading(true);
    const result = await uploadAdminImage(file, 'home-sections', form.image_url || undefined);
    setUploading(false);
    if (!result.publicUrl) {
      setError(result.error || 'No se pudo subir la imagen');
      return;
    }
    setForm((prev) => ({ ...prev, image_url: result.publicUrl! }));
  }

  async function handleTileFile(index: number, file: File) {
    setUploading(true);
    const replaceUrl = form.tile_images[index] || undefined;
    const result = await uploadAdminImage(file, 'home-sections', replaceUrl);
    setUploading(false);
    if (!result.publicUrl) {
      setError(result.error || 'No se pudo subir la imagen del cuadro');
      return;
    }
    setForm((prev) => {
      const next = [...prev.tile_images];
      next[index] = result.publicUrl!;
      return { ...prev, tile_images: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setOk('');
    const success = await saveHomeFeatureSection(PROMOS_SECTION_SLUG, {
      title: form.title || 'Promos del mes',
      image_url: form.image_url || null,
      target_link: form.target_link || null,
      tile_images: form.tile_images.filter(Boolean).slice(0, 4),
      is_active: form.is_active,
    });
    setSaving(false);
    if (!success) {
      setError('No se pudo guardar la sección.');
      return;
    }
    setOk('Sección guardada correctamente.');
    setSavedSnapshot(makeSnapshot({
      topAlert,
      form,
      shippingIcons,
      promoCards,
      reviews,
    }));
  }

  async function handleShippingIconFile(index: number, file: File) {
    setUploadingShippingIdx(index);
    const replaceUrl = shippingIcons[index] || undefined;
    const result = await uploadAdminImage(file, 'home-sections', replaceUrl);
    setUploadingShippingIdx(null);
    if (!result.publicUrl) {
      setError(result.error || 'No se pudo subir el icono');
      return;
    }
    setShippingIcons((prev) => {
      const next = [...prev];
      next[index] = result.publicUrl!;
      return next;
    });
  }

  async function handleSaveShipping() {
    setSavingShipping(true);
    setError('');
    setOkShipping('');
    const success = await saveHomeFeatureSection(SHIPPING_SECTION_SLUG, {
      title: 'Envios a todo el Peru',
      image_url: null,
      target_link: null,
      tile_images: shippingIcons.filter(Boolean).slice(0, 4),
      is_active: true,
    });
    setSavingShipping(false);
    if (!success) {
      setError('No se pudo guardar la sección de envíos.');
      return;
    }
    setOkShipping('Íconos de envíos guardados correctamente.');
    setSavedSnapshot(makeSnapshot({
      topAlert,
      form,
      shippingIcons,
      promoCards,
      reviews,
    }));
  }

  async function handlePromoCardImage(index: number, file: File) {
    setUploadingPromoIdx(index);
    const replaceUrl = promoCards[index]?.image_url || undefined;
    const result = await uploadAdminImage(file, 'promo-cards', replaceUrl);
    setUploadingPromoIdx(null);
    if (!result.publicUrl) {
      setError(result.error || 'No se pudo subir la imagen de la card');
      return;
    }
    setPromoCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, image_url: result.publicUrl! } : c))
    );
  }

  async function handleSavePromoCards() {
    setSavingPromoCards(true);
    setError('');
    setOkPromoCards('');
    const normalized = Array.from({ length: 4 }).map((_, idx) => {
      const c = promoCards[idx] ?? {
        title: `Card ${idx + 1}`,
        image_url: '',
        target_link: '/productos',
        display_order: idx,
        is_active: true,
      };
      return {
        ...c,
        title: (c.title || `Card ${idx + 1}`).trim(),
        image_url: (c.image_url || '').trim(),
        target_link: (c.target_link || '/productos').trim(),
        display_order: idx,
        is_active: c.is_active !== false,
      };
    });
    for (const card of normalized) {
      if (!card.image_url) {
        setSavingPromoCards(false);
        setError('Las 4 cards de categorías deben tener imagen.');
        return;
      }
      const ok = await savePromoCard(card);
      if (!ok) {
        setSavingPromoCards(false);
        setError('No se pudieron guardar las cards de categorías.');
        return;
      }
    }
    setSavingPromoCards(false);
    setOkPromoCards('Cards de categorías guardadas correctamente.');
    setSavedSnapshot(makeSnapshot({
      topAlert,
      form,
      shippingIcons,
      promoCards,
      reviews,
    }));
  }

  async function handleSaveReviews() {
    setSavingReviews(true);
    setError('');
    setOkReviews('');
    const normalized = reviews
      .map((r, i) => ({
        author_name: (r.author_name || '').trim() || `Cliente REBI ${i + 1}`,
        review_text: (r.review_text || '').trim() || 'Excelente atención y entrega rápida. Productos de muy buena calidad.',
        avatar_url: (r.avatar_url || '').trim() || null,
        attachment_url: (r.attachment_url || '').trim() || null,
        stars: Math.min(5, Math.max(1, Number(r.stars || 5))),
        display_order: i,
        is_active: r.is_active !== false,
      }))
      .slice(0, 20);
    const success = await saveHomeReviews(normalized);
    setSavingReviews(false);
    if (!success) {
      setError('No se pudieron guardar las reseñas.');
      return;
    }
    setOkReviews('Reseñas guardadas correctamente.');
    setSavedSnapshot(makeSnapshot({
      topAlert,
      form,
      shippingIcons,
      promoCards,
      reviews,
    }));
  }

  const currentSnapshot = makeSnapshot({
    topAlert,
    form,
    shippingIcons,
    promoCards,
    reviews,
  });
  const hasUnsavedChanges = savedSnapshot.length > 0 && currentSnapshot !== savedSnapshot;
  const isUploadingAny =
    uploading ||
    uploadingShippingIdx !== null ||
    uploadingPromoIdx !== null ||
    uploadingReviewAvatarIdx !== null ||
    uploadingReviewAttachIdx !== null;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) return <div className="py-12 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      {isUploadingAny && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-xl">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
            <p className="text-sm font-medium text-gray-700">Subiendo imagen, por favor esperá...</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Secciones Home (excepto banners)</h1>
        <p className="mt-1 text-sm text-gray-500">Gestioná en orden: barra superior, destacados, cards, marcas, promos del mes, envíos y reseñas.</p>
        {hasUnsavedChanges && (
          <p className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Tenés cambios sin guardar
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">0) Barra superior del sitio</h2>
        <p className="mt-1 text-xs text-gray-500">Se muestra arriba de todo con fondo amarillo. Texto recomendado breve en una sola línea.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Texto de la barra</label>
            <input
              type="text"
              value={topAlert.title}
              onChange={(e) => setTopAlert((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="¡Aprovecha nuestros descuentos y promociones! Aboná en hasta 6 pagos con tarjeta"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <label className="mt-3 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={topAlert.is_active}
                onChange={(e) => setTopAlert((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              Barra activa
            </label>
          </div>
          <button
            onClick={handleSaveTopAlert}
            disabled={savingTopAlert}
            className="rounded-xl bg-gray-900 px-8 py-3 text-base font-extrabold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {savingTopAlert ? 'Guardando...' : 'Guardar barra superior'}
          </button>
        </div>
        {okTopAlert && <p className="mt-3 text-sm font-medium text-green-600">{okTopAlert}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">1) Destacados de la semana</h2>
        <p className="mt-1 text-sm text-gray-500">
          Productos destacados actuales: <span className="font-semibold text-gray-800">{featuredCount}</span>. Se gestionan desde Productos marcando "Destacado".
        </p>
        <div className="mt-3">
          <a href="/admin/productos" className="inline-flex rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Ir a gestionar destacados
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">2) Cards de categorías (4)</h2>
        <p className="mt-1 text-xs text-gray-500">Tamaño recomendado por card: 1200×700 px aprox. Formato rectangular horizontal.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => {
            const card = promoCards[idx] ?? {
              title: `Card ${idx + 1}`,
              image_url: '',
              target_link: '/productos',
              display_order: idx,
              is_active: true,
            };
            return (
              <div key={`promo-card-${idx}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-500">Card {idx + 1}</p>
                <div className="mb-2 overflow-hidden rounded border border-gray-200 bg-white">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.title} className="h-24 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-gray-400">Sin imagen</div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) =>
                      setPromoCards((prev) => {
                        const next = [...prev];
                        next[idx] = { ...card, title: e.target.value, display_order: idx };
                        return next;
                      })
                    }
                    placeholder="Título"
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={card.image_url}
                    onChange={(e) =>
                      setPromoCards((prev) => {
                        const next = [...prev];
                        next[idx] = { ...card, image_url: e.target.value, display_order: idx };
                        return next;
                      })
                    }
                    placeholder="URL imagen"
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={card.target_link}
                    onChange={(e) =>
                      setPromoCards((prev) => {
                        const next = [...prev];
                        next[idx] = { ...card, target_link: e.target.value, display_order: idx };
                        return next;
                      })
                    }
                    placeholder="/productos?categoria=..."
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                  />
                  <label className="inline-flex w-full cursor-pointer items-center justify-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    {uploadingPromoIdx === idx ? 'Subiendo...' : 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPromoIdx !== null}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        await handlePromoCardImage(idx, file);
                        input.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        {okPromoCards && <p className="mt-3 text-sm font-medium text-green-600">{okPromoCards}</p>}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSavePromoCards}
            disabled={savingPromoCards}
            className="rounded-xl bg-gray-900 px-8 py-3 text-base font-extrabold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {savingPromoCards ? 'Guardando...' : 'Guardar cards de categorías'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">3) Nuestras marcas</h2>
        <p className="mt-1 text-sm text-gray-500">Esta sección toma automáticamente las marcas cargadas en la base de datos.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">4) Promos del mes</h2>
        <p className="mt-1 text-sm text-gray-500">Imagen rectangular + 4 cuadros debajo.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Titulo interno (opcional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Imagen principal</label>
            <p className="mb-2 text-xs text-gray-500">Tamaño recomendado: 1600×420 px aprox. Formato rectangular horizontal.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {uploading ? 'Subiendo...' : 'Subir'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await handleImageFile(file);
                    input.value = '';
                  }}
                />
              </label>
            </div>
            {form.image_url && (
              <img src={form.image_url} alt="" className="mt-3 h-36 w-full rounded-xl border border-gray-200 object-cover" />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Link al hacer click</label>
            <input
              type="text"
              value={form.target_link}
              onChange={(e) => setForm((prev) => ({ ...prev, target_link: e.target.value }))}
              placeholder="/productos?categoria=pisos"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              Sección activa
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Cuadros inferiores (4)</h2>
        <p className="mt-1 text-xs text-gray-500">Tamaño recomendado para cada cuadro: 1000×1000 px. Formato cuadrado.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="space-y-2">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {form.tile_images[idx] ? (
                  <img src={form.tile_images[idx]} alt={`Cuadro ${idx + 1}`} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-xs text-gray-400">Sin imagen</div>
                )}
              </div>
              <input
                type="text"
                value={form.tile_images[idx] || ''}
                onChange={(e) =>
                  setForm((prev) => {
                    const next = [...prev.tile_images];
                    next[idx] = e.target.value;
                    return { ...prev, tile_images: next };
                  })
                }
                placeholder={`URL cuadro ${idx + 1}`}
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none"
              />
              <label className="inline-flex w-full cursor-pointer items-center justify-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {uploading ? 'Subiendo...' : 'Subir archivo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await handleTileFile(idx, file);
                    input.value = '';
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {ok && <p className="text-sm font-medium text-green-600">{ok}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-red-600 px-8 py-3 text-base font-extrabold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar sección'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">5) Sección Envíos (4 iconos circulares)</h2>
        <p className="mt-1 text-sm text-gray-500">Estos 4 iconos reemplazan la sección de Baño en el home.</p>
        <p className="mt-1 text-xs text-gray-500">Tamaño recomendado por icono: 512×512 px, idealmente PNG con fondo transparente.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-3">
                {shippingIcons[idx] ? (
                  <img src={shippingIcons[idx]} alt={`Icono ${idx + 1}`} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Sin icono</span>
                )}
              </div>
              <input
                type="text"
                value={shippingIcons[idx] || ''}
                onChange={(e) =>
                  setShippingIcons((prev) => {
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  })
                }
                placeholder={`URL icono ${idx + 1}`}
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none"
              />
              <label className="inline-flex w-full cursor-pointer items-center justify-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {uploadingShippingIdx === idx ? 'Subiendo...' : 'Subir icono'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingShippingIdx !== null}
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await handleShippingIconFile(idx, file);
                    input.value = '';
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        {okShipping && <p className="mt-4 text-sm font-medium text-green-600">{okShipping}</p>}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSaveShipping}
            disabled={savingShipping}
            className="rounded-xl bg-gray-900 px-8 py-3 text-base font-extrabold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {savingShipping ? 'Guardando...' : 'Guardar iconos de envíos'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">6) Reseñas del home (loop infinito)</h2>
            <p className="mt-1 text-sm text-gray-500">Editá al menos 10 reseñas. Se muestran en carrusel continuo.</p>
          </div>
          <button
            onClick={() =>
              setReviews((prev) => (prev.length >= 20
                ? prev
                : [...prev, {
                    author_name: `Cliente REBI ${prev.length + 1}`,
                    review_text: 'Excelente atención y entrega rápida. Productos de muy buena calidad.',
                    avatar_url: null,
                    attachment_url: null,
                    stars: 5,
                    display_order: prev.length,
                    is_active: true,
                  }]))
            }
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            + Agregar reseña
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {reviews.map((review, idx) => (
            <div key={`review-${idx}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500">Reseña {idx + 1}</p>
                <button
                  onClick={() => setReviews((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-12">
                <input
                  type="text"
                  value={review.author_name}
                  onChange={(e) =>
                    setReviews((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, author_name: e.target.value } : r))
                    )
                  }
                  placeholder="Nombre cliente"
                  className="md:col-span-3 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                />
                <textarea
                  value={review.review_text}
                  onChange={(e) =>
                    setReviews((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, review_text: e.target.value } : r))
                    )
                  }
                  rows={2}
                  placeholder="Texto de la reseña"
                  className="md:col-span-7 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                />
                <div className="md:col-span-2 flex items-center gap-2">
                  <select
                    value={String(review.stars)}
                    onChange={(e) =>
                      setReviews((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, stars: Number(e.target.value) } : r))
                      )
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                  >
                    <option value="5">5★</option>
                    <option value="4">4★</option>
                    <option value="3">3★</option>
                    <option value="2">2★</option>
                    <option value="1">1★</option>
                  </select>
                  <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={review.is_active}
                      onChange={(e) =>
                        setReviews((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, is_active: e.target.checked } : r))
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300 text-red-600"
                    />
                    Activa
                  </label>
                </div>
                <div className="md:col-span-6">
                  <p className="mb-1 text-[11px] text-gray-500">Foto de perfil (recomendada: 400×400 px, formato cuadrado)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={review.avatar_url || ''}
                      onChange={(e) =>
                        setReviews((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, avatar_url: e.target.value } : r))
                        )
                      }
                      placeholder="URL foto perfil"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                    />
                    <label className="inline-flex cursor-pointer items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {uploadingReviewAvatarIdx === idx ? 'Subiendo...' : 'Subir'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingReviewAvatarIdx !== null}
                        onChange={async (e) => {
                          const input = e.currentTarget;
                          const file = input.files?.[0];
                          if (!file) return;
                          setUploadingReviewAvatarIdx(idx);
                          const result = await uploadAdminImage(file, 'home-sections', review.avatar_url || undefined);
                          setUploadingReviewAvatarIdx(null);
                          if (!result.publicUrl) {
                            setError(result.error || 'No se pudo subir la foto de perfil');
                          } else {
                            setReviews((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, avatar_url: result.publicUrl! } : r))
                            );
                          }
                          input.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <p className="mb-1 text-[11px] text-gray-500">Foto adjunta de reseña (recomendada: 1200×700 px aprox.)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={review.attachment_url || ''}
                      onChange={(e) =>
                        setReviews((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, attachment_url: e.target.value } : r))
                        )
                      }
                      placeholder="URL foto adjunta"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                    />
                    <label className="inline-flex cursor-pointer items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {uploadingReviewAttachIdx === idx ? 'Subiendo...' : 'Subir'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingReviewAttachIdx !== null}
                        onChange={async (e) => {
                          const input = e.currentTarget;
                          const file = input.files?.[0];
                          if (!file) return;
                          setUploadingReviewAttachIdx(idx);
                          const result = await uploadAdminImage(file, 'home-sections', review.attachment_url || undefined);
                          setUploadingReviewAttachIdx(null);
                          if (!result.publicUrl) {
                            setError(result.error || 'No se pudo subir la foto adjunta');
                          } else {
                            setReviews((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, attachment_url: result.publicUrl! } : r))
                            );
                          }
                          input.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {okReviews && <p className="mt-4 text-sm font-medium text-green-600">{okReviews}</p>}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSaveReviews}
            disabled={savingReviews || reviews.length < 10}
            className="rounded-xl bg-gray-900 px-8 py-3 text-base font-extrabold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {savingReviews ? 'Guardando...' : 'Guardar reseñas'}
          </button>
        </div>
        {reviews.length < 10 && (
          <p className="mt-2 text-xs text-amber-600">Necesitás al menos 10 reseñas para guardar.</p>
        )}
      </div>
    </div>
  );
}

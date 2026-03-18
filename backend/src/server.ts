import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 4000);

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';

const fastify = Fastify({
  logger: true,
});

fastify.register(cors, {
  origin: '*',
});

// Cache simple para GET públicos (mejora TTFB y reduce carga a Supabase)
fastify.addHook('onSend', async (request, reply, payload) => {
  if (request.method !== 'GET') return payload;
  // 60s para listados, 300s para detalle
  const maxAge = request.url.startsWith('/products/') ? 300 : 60;
  reply.header('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  return payload;
});

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const PRODUCT_SELECT = `
  *,
  category:categories(id, name, slug),
  brand:brands(id, name, slug, logo_url),
  product_images(id, image_url, is_primary, display_order, variant_id),
  product_variants(id, sku, size_name, packaging, price, weight_kg, is_active)
`;

function normalizeProduct(row: any) {
  const images = Array.isArray(row?.product_images) ? row.product_images : [];
  const sortedImages = [...images].sort(
    (a, b) => (Number(a?.display_order ?? 0)) - (Number(b?.display_order ?? 0))
  );
  const primaryImage = sortedImages.find((img) => img?.is_primary) ?? sortedImages[0];

  const rawVariants = Array.isArray(row?.product_variants) ? row.product_variants : [];

  return {
    ...row,
    product_images: sortedImages,
    variants: rawVariants,
    image_url: primaryImage?.image_url ?? null,
    images: sortedImages.map((img) => img?.image_url).filter(Boolean),
    is_featured: row?.is_featured === true,
  };
}

fastify.get('/categories', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) {
    request.log.error({ error }, 'Error fetching categories');
    reply.code(500);
    return { error: 'Error fetching categories' };
  }
  return data ?? [];
});

fastify.get('/brands', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const { data, error } = await supabase.from('brands').select('*').order('name');
  if (error) {
    request.log.error({ error }, 'Error fetching brands');
    reply.code(500);
    return { error: 'Error fetching brands' };
  }
  return data ?? [];
});

fastify.get('/banners', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) {
    request.log.error({ error }, 'Error fetching banners');
    reply.code(500);
    return { error: 'Error fetching banners' };
  }
  return data ?? [];
});

fastify.get('/promo-cards', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const { data, error } = await supabase
    .from('promo_cards')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) {
    request.log.error({ error }, 'Error fetching promo cards');
    reply.code(500);
    return { error: 'Error fetching promo cards' };
  }
  return data ?? [];
});

fastify.get('/products', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }

  const querySchema = z.object({
    featured: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    search: z.string().optional(),
  });
  const parsed = querySchema.safeParse(request.query);
  if (!parsed.success) {
    reply.code(400);
    return { error: 'Invalid query params' };
  }
  const q = parsed.data;

  const isFeatured = q.featured === 'true';
  const limit = q.limit ?? 20;

  let sbQuery = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('name');

  if (isFeatured) {
    sbQuery = sbQuery.eq('is_featured', true);
  }

  if (q.search?.trim()) {
    const s = q.search.trim();
    sbQuery = sbQuery.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
  }

  // Note: para category/brand por slug, resolvemos id (2 queries máximo).
  if (q.category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', q.category).single();
    if (cat?.id) sbQuery = sbQuery.eq('category_id', cat.id);
  }
  if (q.brand) {
    const { data: br } = await supabase.from('brands').select('id').eq('slug', q.brand).single();
    if (br?.id) sbQuery = sbQuery.eq('brand_id', br.id);
  }

  sbQuery = sbQuery.limit(limit);

  const { data, error } = await sbQuery;
  if (error) {
    request.log.error({ error }, 'Error fetching products');
    reply.code(500);
    return { error: 'Error fetching products' };
  }

  const products = (data ?? [])
    .map((p: any) => normalizeProduct(p))
    .filter((p: any) => p?.image_url);
  return products;
});

fastify.get('/products/:slug', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const paramsSchema = z.object({ slug: z.string().min(1) });
  const parsed = paramsSchema.safeParse(request.params);
  if (!parsed.success) {
    reply.code(400);
    return { error: 'Invalid slug' };
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', parsed.data.slug)
    .single();

  if (error || !data) {
    reply.code(404);
    return { error: 'Not found' };
  }
  return normalizeProduct(data);
});

async function start() {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Backend listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();


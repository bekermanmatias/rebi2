import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 4000);

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';
const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

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

type AuthUser = {
  id: string;
  email?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    userToken?: string;
  }
}

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

// ─── Auth middleware (valida JWT de Supabase) ────────────────────────
async function authenticate(request: any, reply: any) {
  if (!supabase) {
    reply.code(500);
    throw new Error('Supabase not configured');
  }

  const authHeader = request.headers['authorization'] as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    reply.code(401);
    throw new Error('Missing Authorization header');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    reply.code(401);
    throw new Error('Invalid token');
  }

  request.userToken = token;
  request.user = {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

async function requireAdmin(request: any, reply: any) {
  await authenticate(request, reply);
  const email = request.user?.email?.toLowerCase();
  if (!email || adminEmails.length === 0 || !adminEmails.includes(email)) {
    reply.code(403);
    throw new Error('Forbidden');
  }
}

async function maybeAuthenticate(request: any) {
  if (!supabase) return;
  const authHeader = request.headers['authorization'] as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return;
  request.userToken = token;
  request.user = {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

function buildOrderWhatsAppMessage(order: any) {
  const lines = (order.items ?? []).map((i: any) => {
    const variant = i.variantId ? ` (variante: ${i.variantId})` : '';
    return `• ${i.productId}${variant} x${i.quantity}`;
  });
  const parts: string[] = [
    `Hola, soy REBI. Sobre tu pedido ${order.id}:`,
    '',
    'Items:',
    lines.join('\n'),
  ];
  parts.push('', `Entrega: ${order.delivery_type}`);
  if (order.delivery_address) parts.push(`Dirección: ${order.delivery_address}`);
  if (order.branch_id) parts.push(`Sucursal: ${order.branch_id}`);
  if (order.vendedor_code) parts.push(`Código vendedor: ${order.vendedor_code}`);
  if (order.customer_email) parts.push(`Email: ${order.customer_email}`);
  return encodeURIComponent(parts.join('\n'));
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

// Crear orden (checkout) - permite guest (sin auth) pero si hay JWT lo asocia al usuario
fastify.post('/orders', async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  await maybeAuthenticate(request);

  const bodySchema = z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().min(1),
    })).min(1),
    delivery: z.object({
      type: z.enum(['envio', 'retiro_uchuraccay', 'retiro_hoyos_rubio']),
      address: z.string().optional(),
      branchId: z.string().optional(),
    }),
    vendedorCode: z.string().optional(),
    whatsappNumber: z.string().optional(),
  });

  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: 'Invalid payload' };
  }

  const { items, delivery, vendedorCode, whatsappNumber } = parsed.data;

  // TODO: validar stock real cuando tengamos inventario

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: request.user?.id ?? null,
      customer_email: request.user?.email ?? null,
      status: 'pending',
      delivery_type: delivery.type,
      delivery_address: delivery.address ?? null,
      branch_id: delivery.branchId ?? null,
      vendedor_code: vendedorCode ?? null,
      whatsapp_number: whatsappNumber ?? null,
      items,
    })
    .select('id, status, created_at')
    .single();

  if (error || !data) {
    request.log.error({ error }, 'Error creating order');
    reply.code(500);
    return { error: 'Error creating order' };
  }

  return {
    id: data.id,
    status: data.status,
    created_at: data.created_at,
  };
});

// Admin: listar órdenes
fastify.get('/admin/orders', { preHandler: requireAdmin }, async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    request.log.error({ error }, 'Error fetching orders');
    reply.code(500);
    return { error: 'Error fetching orders' };
  }
  return data ?? [];
});

// Admin: aceptar orden + devolver link de WhatsApp listo
fastify.post('/admin/orders/:id/accept', { preHandler: requireAdmin }, async (request, reply) => {
  if (!supabase) {
    reply.code(500);
    return { error: 'Supabase not configured' };
  }
  const paramsSchema = z.object({ id: z.string().uuid() });
  const parsed = paramsSchema.safeParse(request.params);
  if (!parsed.success) {
    reply.code(400);
    return { error: 'Invalid order id' };
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'accepted' })
    .eq('id', parsed.data.id)
    .select('*')
    .single();

  if (error || !data) {
    request.log.error({ error }, 'Error accepting order');
    reply.code(500);
    return { error: 'Error accepting order' };
  }

  const message = buildOrderWhatsAppMessage(data);
  const phone = (data.whatsapp_number as string) || '';
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : null;
  return { order: data, whatsappUrl };
});

// Ejemplo de endpoint protegido: devuelve el perfil básico del usuario autenticado.
fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
  if (!request.user) {
    reply.code(401);
    return { error: 'Unauthorized' };
  }
  return {
    id: request.user.id,
    email: request.user.email ?? null,
  };
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


import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 4000);

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'public';
const adminPanelPin = process.env.ADMIN_PANEL_PIN || '';
const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
const supabaseStorage = supabaseUrl && (supabaseServiceRoleKey || supabaseKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseKey)
  : null;

type AuthUser = {
  id: string;
  email?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      userToken?: string;
    }
  }
}

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '12mb' }));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    const isPrivate = req.path.startsWith('/me') || req.path.startsWith('/admin');
    if (isPrivate) {
      res.setHeader('Cache-Control', 'private, no-store');
    } else {
      const maxAge = req.path.startsWith('/products/') ? 300 : 60;
      res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
    }
  }
  next();
});

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
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
    images: sortedImages.map((img: any) => img?.image_url).filter(Boolean),
    is_featured: row?.is_featured === true,
  };
}

// ─── Auth middlewares (valida JWT de Supabase) ────────────────────────
const authenticate = asyncHandler(async (req, res, next) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const authHeader = req.headers['authorization'];
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.userToken = token;
  req.user = {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
  next();
});

const requireAdmin = asyncHandler(async (req, res, next) => {
  await new Promise<void>((resolve, reject) => {
    authenticate(req, res, (err?: unknown) => (err ? reject(err) : resolve()));
  });
  if (res.headersSent) return;

  const email = req.user?.email?.toLowerCase();
  if (!email || adminEmails.length === 0 || !adminEmails.includes(email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
});

const requireAdminPin = (req: Request, res: Response, next: NextFunction) => {
  if (!adminPanelPin) {
    next();
    return;
  }
  const pin = req.headers['x-admin-pin'];
  if (typeof pin !== 'string' || pin !== adminPanelPin) {
    res.status(403).json({ error: 'Invalid admin PIN' });
    return;
  }
  next();
};

function userSupabase(req: Request) {
  if (!supabaseUrl || !supabaseKey || !req.userToken) return null;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: `Bearer ${req.userToken}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function maybeAuthenticate(req: Request) {
  if (!supabase) return;
  const authHeader = req.headers['authorization'];
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;
  if (!token) return;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return;
  req.userToken = token;
  req.user = {
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

function storagePathFromPublicUrl(url: string): string | null {
  if (!url || !supabaseUrl) return null;
  try {
    const u = new URL(url);
    const marker = `/storage/v1/object/public/${storageBucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx < 0) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'image';
}

app.get('/categories', asyncHandler(async (_req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) {
    console.error('Error fetching categories', error);
    res.status(500).json({ error: 'Error fetching categories' });
    return;
  }
  res.json(data ?? []);
}));

app.get('/brands', asyncHandler(async (_req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const { data, error } = await supabase.from('brands').select('*').order('name');
  if (error) {
    console.error('Error fetching brands', error);
    res.status(500).json({ error: 'Error fetching brands' });
    return;
  }
  res.json(data ?? []);
}));

app.get('/banners', asyncHandler(async (_req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) {
    console.error('Error fetching banners', error);
    res.status(500).json({ error: 'Error fetching banners' });
    return;
  }
  res.json(data ?? []);
}));

app.get('/promo-cards', asyncHandler(async (_req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const { data, error } = await supabase
    .from('promo_cards')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) {
    console.error('Error fetching promo cards', error);
    res.status(500).json({ error: 'Error fetching promo cards' });
    return;
  }
  res.json(data ?? []);
}));

app.get('/products', asyncHandler(async (req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const querySchema = z.object({
    featured: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    search: z.string().optional(),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query params' });
    return;
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
    console.error('Error fetching products', error);
    res.status(500).json({ error: 'Error fetching products' });
    return;
  }

  const products = (data ?? [])
    .map((p: any) => normalizeProduct(p))
    .filter((p: any) => p?.image_url);
  res.json(products);
}));

app.get('/products/:slug', asyncHandler(async (req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const paramsSchema = z.object({ slug: z.string().min(1) });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', parsed.data.slug)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(normalizeProduct(data));
}));

// Crear orden (checkout) - permite guest (sin auth) pero si hay JWT lo asocia al usuario
app.post('/orders', asyncHandler(async (req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  await maybeAuthenticate(req);

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

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const { items, delivery, vendedorCode, whatsappNumber } = parsed.data;

  // TODO: validar stock real cuando tengamos inventario

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: req.user?.id ?? null,
      customer_email: req.user?.email ?? null,
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
    console.error('Error creating order', error);
    res.status(500).json({ error: 'Error creating order' });
    return;
  }

  res.json({
    id: data.id,
    status: data.status,
    created_at: data.created_at,
  });
}));

// Admin: listar órdenes
app.get('/admin/orders', requireAdmin, asyncHandler(async (_req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('Error fetching orders', error);
    res.status(500).json({ error: 'Error fetching orders' });
    return;
  }
  res.json(data ?? []);
}));

// Admin: aceptar orden + devolver link de WhatsApp listo
app.post('/admin/orders/:id/accept', requireAdmin, asyncHandler(async (req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  const paramsSchema = z.object({ id: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid order id' });
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'accepted' })
    .eq('id', parsed.data.id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error accepting order', error);
    res.status(500).json({ error: 'Error accepting order' });
    return;
  }

  const message = buildOrderWhatsAppMessage(data);
  const phone = (data.whatsapp_number as string) || '';
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : null;
  res.json({ order: data, whatsappUrl });
}));

// Admin: validar PIN del panel
app.post('/admin/verify-pin', requireAdminPin, asyncHandler(async (_req, res) => {
  if (!adminPanelPin) {
    res.json({ ok: true });
    return;
  }
  res.json({ ok: true });
}));

// Admin: subir/reemplazar imágenes en Supabase Storage
app.post('/admin/upload-image', requireAdminPin, asyncHandler(async (req, res) => {
  if (!supabaseStorage || !supabaseUrl) {
    res.status(500).json({ error: 'Supabase storage not configured' });
    return;
  }

  const bodySchema = z.object({
    section: z.enum(['products', 'banners', 'promo-cards']),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    base64: z.string().min(1),
    replaceUrl: z.string().url().optional(),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const { section, filename, mimeType, base64, replaceUrl } = parsed.data;
  const safeName = sanitizeFilename(filename);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
  const path = `${section}/${uniqueName}`;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    res.status(400).json({ error: 'Invalid base64 data' });
    return;
  }

  const { error: uploadError } = await supabaseStorage.storage
    .from(storageBucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });
  if (uploadError) {
    console.error('Error uploading image', uploadError);
    const raw = uploadError.message ?? '';
    let detail = raw;
    if (/bucket not found/i.test(raw)) {
      detail =
        `Bucket de Storage "${storageBucket}" no existe. En Supabase: Storage → New bucket (mismo nombre que ` +
        `SUPABASE_STORAGE_BUCKET en backend/.env), o cambiá esa variable al nombre de un bucket que ya tengas. ` +
        `Para URLs públicas, activá "Public bucket".`;
    }
    res.status(500).json({ error: `Error uploading image: ${detail}` });
    return;
  }

  if (replaceUrl) {
    const oldPath = storagePathFromPublicUrl(replaceUrl);
    if (oldPath && oldPath !== path) {
      await supabaseStorage.storage.from(storageBucket).remove([oldPath]);
    }
  }

  const { data } = supabaseStorage.storage.from(storageBucket).getPublicUrl(path);
  res.json({ path, publicUrl: data.publicUrl });
}));

// Ejemplo de endpoint protegido: devuelve el perfil básico del usuario autenticado.
app.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({
    id: req.user.id,
    email: req.user.email ?? null,
  });
});

// Carrito persistente del usuario autenticado
app.get('/me/cart', authenticate, asyncHandler(async (req, res) => {
  const sb = userSupabase(req);
  if (!sb || !req.user) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const { data, error } = await sb
    .from('user_carts')
    .select('items, updated_at')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user cart', error);
    res.status(500).json({ error: 'Error fetching cart' });
    return;
  }

  res.json({
    items: Array.isArray(data?.items) ? data?.items : [],
    updated_at: data?.updated_at ?? null,
  });
}));

app.put('/me/cart', authenticate, asyncHandler(async (req, res) => {
  const sb = userSupabase(req);
  if (!sb || !req.user) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const bodySchema = z.object({
    items: z.array(z.unknown()).max(200),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const { error } = await sb
    .from('user_carts')
    .upsert(
      {
        user_id: req.user.id,
        items: parsed.data.items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error saving user cart', error);
    res.status(500).json({ error: 'Error saving cart' });
    return;
  }

  res.json({ ok: true });
}));

// Pedidos del usuario autenticado
app.get('/me/orders', authenticate, asyncHandler(async (req, res) => {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, status, delivery_type, delivery_address, branch_id, vendedor_code, items, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching user orders', error);
    res.status(500).json({ error: 'Error fetching orders' });
    return;
  }

  res.json(data ?? []);
}));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.info(`Backend listening on http://localhost:${PORT}`);
});

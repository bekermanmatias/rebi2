# Corralón - Vidriera Digital

Plataforma web para un comercio de materiales de construcción. Fase 1: Landing Page, catálogo de productos y sistema de cotización vía WhatsApp.

## Stack

- **Frontend:** Astro + React (islas) + Tailwind CSS + TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Estado del carrito:** Zustand

## Estructura

```
src/
├── components/       # Componentes reutilizables
│   ├── cart/        # Carrito (CartButton, CartDrawer, AddToCartHandler)
│   ├── ui/          # Button, etc.
│   ├── ProductCard.astro | ProductCard.tsx
│   └── CatalogWithFilters.tsx
├── layouts/
│   └── Layout.astro
├── lib/
│   ├── supabase.ts  # Cliente y queries a Supabase
│   ├── data.ts      # Capa de datos (Supabase o mock)
│   ├── cartStore.ts # Estado global del carrito (Zustand)
│   └── mockData.ts  # Datos de desarrollo
├── pages/
│   ├── index.astro           # Landing
│   ├── productos/index.astro # Catálogo con filtros
│   └── producto/[slug].astro # Detalle de producto
├── styles/
│   └── global.css
└── types/
    └── index.ts     # Product, Category, CartItem
```

## Comandos

| Comando        | Acción                          |
|----------------|----------------------------------|
| `npm run dev`  | Servidor de desarrollo (puerto 4321) |
| `npm run build`| Build de producción              |
| `npm run preview` | Vista previa del build       |

## Configuración

1. Copiar `.env.example` a `.env`
2. Crear proyecto en [Supabase](https://supabase.com) y ejecutar `supabase/schema.sql`
3. Configurar `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`
4. Opcional: `PUBLIC_WHATSAPP_NUMBER` para el botón de cotización (ej: 5491112345678)

Sin Supabase configurado, la app usa datos mock y funciona igual.

## Funcionalidades (Fase 1)

- **Landing:** Hero, categorías, productos destacados
- **Catálogo:** Listado con filtros por categoría y búsqueda
- **Detalle:** Página dinámica por slug
- **Carrito:** Drawer lateral, agregar/quitar, solicitar cotización por WhatsApp

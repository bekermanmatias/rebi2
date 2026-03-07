/**
 * Datos mock para desarrollo cuando Supabase no está configurado.
 * Coinciden con el esquema de la base de datos.
 */
import type { Category, Product } from '../types';

export const mockCategories: Category[] = [
  { id: '1', name: 'Obra gruesa', slug: 'obra-gruesa' },
  { id: '2', name: 'Terminaciones', slug: 'terminaciones' },
  { id: '3', name: 'Herramientas', slug: 'herramientas' },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Cemento Portland 50kg',
    slug: 'cemento-portland-50kg',
    description: 'Cemento Portland de alta resistencia para hormigón y morteros.',
    price: 12500,
    stock_status: true,
    category_id: '1',
    image_url: null,
    category: mockCategories[0],
  },
  {
    id: '2',
    name: 'Ladrillo común x1000',
    slug: 'ladrillo-comun-x1000',
    description: 'Ladrillo cerámico común para mampostería.',
    price: 45000,
    stock_status: true,
    category_id: '1',
    image_url: null,
    category: mockCategories[0],
  },
  {
    id: '3',
    name: 'Cal hidratada 25kg',
    slug: 'cal-hidratada-25kg',
    description: 'Cal hidratada para revoques y pinturas.',
    price: 3200,
    stock_status: true,
    category_id: '1',
    image_url: null,
    category: mockCategories[0],
  },
  {
    id: '4',
    name: 'Pintura látex interior 20L',
    slug: 'pintura-latex-interior-20l',
    description: 'Pintura látex lavable para interiores.',
    price: 18500,
    stock_status: true,
    category_id: '2',
    image_url: null,
    category: mockCategories[1],
  },
  {
    id: '5',
    name: 'Cerámica 45x45 cm',
    slug: 'ceramica-45x45-cm',
    description: 'Piso cerámico esmaltado 45x45 cm.',
    price: 8500,
    stock_status: true,
    category_id: '2',
    image_url: null,
    category: mockCategories[1],
  },
  {
    id: '6',
    name: 'Taladro inalámbrico 18V',
    slug: 'taladro-inalambrico-18v',
    description: 'Taladro percutor con batería recargable.',
    price: 42000,
    stock_status: true,
    category_id: '3',
    image_url: null,
    category: mockCategories[2],
  },
  {
    id: '7',
    name: 'Amoladora angular 4½"',
    slug: 'amoladora-angular-4-1-2',
    description: 'Amoladora angular 115mm, 850W.',
    price: 28000,
    stock_status: true,
    category_id: '3',
    image_url: null,
    category: mockCategories[2],
  },
];

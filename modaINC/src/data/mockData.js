export const initialUsers = [
  {
    id: 'u-admin-root',
    name: 'Administrador Principal',
    email: 'admin',
    password: 'admin123',
    role: 'admin',
    active: true,
    isPrincipal: true,
  },
  {
    id: 'u-fab-ana',
    name: 'Ana Costuras',
    email: 'ana@modainc.com',
    password: '123456',
    role: 'fabricante',
    active: true,
    isPrincipal: false,
  },
  {
    id: 'u-fab-carlos',
    name: 'Carlos Atelier',
    email: 'carlos@modainc.com',
    password: '123456',
    role: 'fabricante',
    active: true,
    isPrincipal: false,
  },
  {
    id: 'u-cli-lucia',
    name: 'Lucía Méndez',
    email: 'lucia@modainc.com',
    password: '123456',
    role: 'cliente',
    active: true,
    isPrincipal: false,
    measures: {
      pecho: 90,
      cintura: 74,
      cadera: 96,
      largo: 110,
    },
    preferences: {
      garmentTypes: ['Vestido'],
      styles: ['Elegante'],
    },
  },
]

export const initialShowcases = [
  {
    id: 's-ana',
    manufacturerId: 'u-fab-ana',
    businessName: 'Ana Costuras',
    specialty: 'Vestidos de gala y disfraces teatrales',
    location: 'San José',
    styles: ['Elegante', 'Fantasía', 'Teatral'],
    description:
      'Confección artesanal con ajuste premium para eventos, graduaciones y cosplay.',
    services: ['Vestidos de gala', 'Disfraces de fantasía', 'Ajustes express'],
    gallery: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
    ],
    published: true,
    designs: [
      {
        id: 'd-ana-1',
        name: 'Vestido Aurora',
        type: 'Vestido',
        basePrice: 120,
        image:
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
        modifications: [
          {
            id: 'm-ana-1',
            name: 'Tejido Satén Premium',
            image:
              'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=500&q=80',
            extraCost: 25,
          },
          {
            id: 'm-ana-2',
            name: 'Estilo Sirena',
            image: '',
            extraCost: 18,
          },
          {
            id: 'm-ana-3',
            name: 'Botones Forrados Artesanales',
            image: '',
            extraCost: 8,
          },
        ],
      },
      {
        id: 'd-ana-2',
        name: 'Disfraz Lunar',
        type: 'Disfraz',
        basePrice: 95,
        image:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
        modifications: [
          {
            id: 'm-ana-4',
            name: 'Tejido Elástico Confort',
            image:
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=500&q=80',
            extraCost: 15,
          },
          {
            id: 'm-ana-5',
            name: 'Acabado Brillante',
            image: '',
            extraCost: 10,
          },
        ],
      },
    ],
  },
  {
    id: 's-carlos',
    manufacturerId: 'u-fab-carlos',
    businessName: 'Carlos Atelier',
    specialty: 'Trajes formales y vestuario corporativo',
    location: 'Cartago',
    styles: ['Formal', 'Clásico', 'Ejecutivo'],
    description:
      'Patrones modernos para traje de negocios, bodas y eventos empresariales.',
    services: ['Trajes a medida', 'Camisas premium', 'Uniformes elegantes'],
    gallery: [
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80',
    ],
    published: true,
    designs: [
      {
        id: 'd-carlos-1',
        name: 'Traje Ejecutivo 3P',
        type: 'Traje',
        basePrice: 180,
        image:
          'https://images.unsplash.com/photo-1593032465175-481ac7f401f0?auto=format&fit=crop&w=900&q=80',
        modifications: [
          {
            id: 'm-carlos-1',
            name: 'Tejido Mezcla Lana',
            image:
              'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=500&q=80',
            extraCost: 32,
          },
          {
            id: 'm-carlos-2',
            name: 'Corte Slim Fit',
            image: '',
            extraCost: 20,
          },
          {
            id: 'm-carlos-3',
            name: 'Botonadura Cruzada',
            image: '',
            extraCost: 14,
          },
        ],
      },
      {
        id: 'd-carlos-2',
        name: 'Smoking Nocturno',
        type: 'Traje',
        basePrice: 210,
        image:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
        modifications: [
          {
            id: 'm-carlos-4',
            name: 'Solapa Pico Satinada',
            image: '',
            extraCost: 28,
          },
          {
            id: 'm-carlos-5',
            name: 'Forro Interno Personalizado',
            image: '',
            extraCost: 17,
          },
        ],
      },
    ],
  },
]

export const roleOptions = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fabricante', label: 'Fabricante' },
  { value: 'admin', label: 'Administrador' },
]

// HU-08: campos de medidas corporales que el cliente registra en su perfil.
export const measureFields = [
  { key: 'pecho', label: 'Pecho' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'cadera', label: 'Cadera' },
  { key: 'largo', label: 'Largo' },
  { key: 'hombros', label: 'Hombros' },
  { key: 'manga', label: 'Largo de manga' },
]

// HU-06 / HU-07: catálogos de estilos y ubicaciones disponibles para filtrar y
// para que el cliente exprese sus preferencias.
export const styleCatalog = [
  'Elegante',
  'Fantasía',
  'Teatral',
  'Formal',
  'Clásico',
  'Ejecutivo',
  'Casual',
]

export const locationCatalog = [
  'San José',
  'Cartago',
  'Alajuela',
  'Heredia',
  'Guanacaste',
]

// HU-07: tipos de prenda disponibles para que el cliente marque sus
// preferencias (coinciden con los tipos usados en los diseños del catálogo).
export const garmentTypeCatalog = ['Vestido', 'Disfraz', 'Traje', 'Camisa', 'Uniforme']

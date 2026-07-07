// Árbol de categorías del sistema, organizado por RUBRO de negocio.
// Fuente única de verdad: la usan tanto el seed (prisma/seed.ts) como la
// sincronización automática al arrancar el server (server.ts → sincronizarCategorias).
//
// Estructura: cada categoría RAÍZ lleva un `rubro` (ej "indumentaria"). Los descendientes
// lo heredan implícitamente (por su raíz). El árbol soporta N niveles (hijos → hijos → ...).
// Indumentaria usa 3 niveles: Género → Categoría → Tipo (ej: Mujer → Pantalones → Jogger).
// Los demás rubros usan 2 niveles.
import { PrismaClient } from '@prisma/client';

// Nodo recursivo: un nodo puede tener hijos, y esos hijos a su vez hijos.
export interface NodoCategoria {
  nombre: string;
  slug: string;
  rubro?: string; // solo se setea en las raíces
  hijos?: NodoCategoria[];
}

// ─────────────────────────────────────────────────────────────────────────────
// INDUMENTARIA — taxonomía de 3 niveles (Género → Categoría → Tipo)
// Cada género es una rama separada. Para evitar repetir manualmente cientos de
// nodos, generamos las ramas con helpers. Los slugs se prefijan con el género
// para no colisionar (slug es @unique): mujer-pantalones-jogger vs hombre-...
// ─────────────────────────────────────────────────────────────────────────────

// Definición de categoría (nivel 2 dentro de un género) con sus tipos (nivel 3).
interface DefCategoria {
  nombre: string;
  slugBase: string; // sin prefijo de género
  tipos: { nombre: string; slugBase: string }[];
}

// Catálogo de categorías de prendas reutilizable por género.
const CAT: Record<string, DefCategoria> = {
  pantalones: {
    nombre: 'Pantalones', slugBase: 'pantalones',
    tipos: [
      { nombre: 'Jean', slugBase: 'jean' },
      { nombre: 'Jogger', slugBase: 'jogger' },
      { nombre: 'Cargo', slugBase: 'cargo' },
      { nombre: 'Chino', slugBase: 'chino' },
      { nombre: 'De vestir', slugBase: 'de-vestir' },
      { nombre: 'Calza', slugBase: 'calza' },
      { nombre: 'Babucha', slugBase: 'babucha' },
    ],
  },
  remeras: {
    nombre: 'Remeras', slugBase: 'remeras',
    tipos: [
      { nombre: 'Manga corta', slugBase: 'manga-corta' },
      { nombre: 'Manga larga', slugBase: 'manga-larga' },
      { nombre: 'Musculosa', slugBase: 'musculosa' },
      { nombre: 'Oversize', slugBase: 'oversize' },
      { nombre: 'Deportiva', slugBase: 'deportiva' },
    ],
  },
  camisas: {
    nombre: 'Camisas y blusas', slugBase: 'camisas',
    tipos: [
      { nombre: 'Lisa', slugBase: 'lisa' },
      { nombre: 'A cuadros', slugBase: 'a-cuadros' },
      { nombre: 'Lino', slugBase: 'lino' },
      { nombre: 'De vestir', slugBase: 'de-vestir' },
    ],
  },
  buzos: {
    nombre: 'Buzos y hoodies', slugBase: 'buzos',
    tipos: [
      { nombre: 'Con capucha', slugBase: 'con-capucha' },
      { nombre: 'Sin capucha', slugBase: 'sin-capucha' },
      { nombre: 'Canguro', slugBase: 'canguro' },
      { nombre: 'Media estación', slugBase: 'media-estacion' },
    ],
  },
  abrigos: {
    nombre: 'Abrigos', slugBase: 'abrigos',
    tipos: [
      { nombre: 'Campera', slugBase: 'campera' },
      { nombre: 'Tapado', slugBase: 'tapado' },
      { nombre: 'Piloto', slugBase: 'piloto' },
      { nombre: 'Chaleco', slugBase: 'chaleco' },
      { nombre: 'Sweater / Cardigan', slugBase: 'sweater-cardigan' },
    ],
  },
  vestidos: {
    nombre: 'Vestidos', slugBase: 'vestidos',
    tipos: [
      { nombre: 'Casual', slugBase: 'casual' },
      { nombre: 'De fiesta', slugBase: 'de-fiesta' },
      { nombre: 'Largo', slugBase: 'largo' },
      { nombre: 'Corto', slugBase: 'corto' },
    ],
  },
  polleras: {
    nombre: 'Polleras', slugBase: 'polleras',
    tipos: [
      { nombre: 'Corta', slugBase: 'corta' },
      { nombre: 'Larga', slugBase: 'larga' },
      { nombre: 'Tableada', slugBase: 'tableada' },
    ],
  },
  shorts: {
    nombre: 'Shorts y bermudas', slugBase: 'shorts',
    tipos: [
      { nombre: 'Deportivo', slugBase: 'deportivo' },
      { nombre: 'De jean', slugBase: 'de-jean' },
      { nombre: 'Bermuda', slugBase: 'bermuda' },
    ],
  },
  interior: {
    nombre: 'Ropa interior', slugBase: 'ropa-interior',
    tipos: [
      { nombre: 'Ropa interior', slugBase: 'basica' },
      { nombre: 'Medias', slugBase: 'medias' },
      { nombre: 'Pijamas', slugBase: 'pijamas' },
    ],
  },
  bano: {
    nombre: 'Ropa de baño', slugBase: 'ropa-bano',
    tipos: [
      { nombre: 'Malla', slugBase: 'malla' },
      { nombre: 'Bikini', slugBase: 'bikini' },
      { nombre: 'Short de baño', slugBase: 'short-bano' },
    ],
  },
  calzado: {
    nombre: 'Calzado', slugBase: 'calzado',
    tipos: [
      { nombre: 'Zapatillas', slugBase: 'zapatillas' },
      { nombre: 'Botas', slugBase: 'botas' },
      { nombre: 'Zapatos', slugBase: 'zapatos' },
      { nombre: 'Sandalias y ojotas', slugBase: 'sandalias-ojotas' },
    ],
  },
  accesorios: {
    nombre: 'Accesorios', slugBase: 'accesorios',
    tipos: [
      { nombre: 'Gorras', slugBase: 'gorras' },
      { nombre: 'Cinturones', slugBase: 'cinturones' },
      { nombre: 'Carteras y bolsos', slugBase: 'carteras-bolsos' },
      { nombre: 'Bufandas y gorros', slugBase: 'bufandas-gorros' },
      { nombre: 'Lentes', slugBase: 'lentes' },
    ],
  },
};

// Categorías especiales de bebés (nivel 2 → 3).
const CAT_BEBES: DefCategoria[] = [
  { nombre: 'Bodies', slugBase: 'bodies', tipos: [{ nombre: 'Manga corta', slugBase: 'manga-corta' }, { nombre: 'Manga larga', slugBase: 'manga-larga' }] },
  { nombre: 'Enteritos', slugBase: 'enteritos', tipos: [{ nombre: 'Algodón', slugBase: 'algodon' }, { nombre: 'Plush', slugBase: 'plush' }] },
  { nombre: 'Ajuares', slugBase: 'ajuares', tipos: [{ nombre: 'Recién nacido', slugBase: 'recien-nacido' }, { nombre: 'Primavera-verano', slugBase: 'primavera-verano' }] },
  { nombre: 'Accesorios de bebé', slugBase: 'accesorios-bebe', tipos: [{ nombre: 'Baberos', slugBase: 'baberos' }, { nombre: 'Escarpines', slugBase: 'escarpines' }, { nombre: 'Gorros', slugBase: 'gorros' }] },
];

// Construye la rama de un género a partir de una lista de claves de CAT.
function generoBranch(nombre: string, slugGenero: string, cats: DefCategoria[]): NodoCategoria {
  return {
    nombre,
    slug: `indumentaria-${slugGenero}`,
    hijos: cats.map((c) => ({
      nombre: c.nombre,
      slug: `${slugGenero}-${c.slugBase}`,
      hijos: c.tipos.map((t) => ({
        nombre: t.nombre,
        slug: `${slugGenero}-${c.slugBase}-${t.slugBase}`,
      })),
    })),
  };
}

// Sets de categorías por género (aplicando juicio: no todo va en todos).
const catsMujer = [CAT.pantalones, CAT.remeras, CAT.camisas, CAT.buzos, CAT.abrigos, CAT.vestidos, CAT.polleras, CAT.shorts, CAT.interior, CAT.bano, CAT.calzado, CAT.accesorios];
const catsHombre = [CAT.pantalones, CAT.remeras, CAT.camisas, CAT.buzos, CAT.abrigos, CAT.shorts, CAT.interior, CAT.bano, CAT.calzado, CAT.accesorios];
const catsNinos = [CAT.pantalones, CAT.remeras, CAT.buzos, CAT.abrigos, CAT.vestidos, CAT.shorts, CAT.calzado, CAT.accesorios];
const catsUnisex = [CAT.remeras, CAT.buzos, CAT.abrigos, CAT.accesorios];

// Nodo raíz de Indumentaria con sus 5 géneros.
const INDUMENTARIA: NodoCategoria = {
  nombre: 'Indumentaria',
  slug: 'indumentaria',
  rubro: 'indumentaria',
  hijos: [
    generoBranch('Mujer', 'mujer', catsMujer),
    generoBranch('Hombre', 'hombre', catsHombre),
    generoBranch('Niños', 'ninos', catsNinos),
    { nombre: 'Bebés', slug: 'indumentaria-bebes', hijos: CAT_BEBES.map((c) => ({
      nombre: c.nombre,
      slug: `bebes-${c.slugBase}`,
      hijos: c.tipos.map((t) => ({ nombre: t.nombre, slug: `bebes-${c.slugBase}-${t.slugBase}` })),
    })) },
    generoBranch('Unisex', 'unisex', catsUnisex),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ÁRBOL COMPLETO — Indumentaria (3 niveles) + demás rubros (2 niveles).
// Cada raíz lleva su `rubro`.
// ─────────────────────────────────────────────────────────────────────────────
export const ARBOL_CATEGORIAS: NodoCategoria[] = [
  INDUMENTARIA,
  { nombre: 'Tecnología y Electrónica', slug: 'tecnologia-electronica', rubro: 'tecnologia', hijos: [
    { nombre: 'Celulares y smartphones', slug: 'celulares-smartphones' },
    { nombre: 'Computadoras y laptops', slug: 'computadoras-laptops' },
    { nombre: 'Tablets', slug: 'tablets' },
    { nombre: 'Televisores', slug: 'televisores' },
    { nombre: 'Audio y auriculares', slug: 'audio-auriculares' },
    { nombre: 'Accesorios tech', slug: 'accesorios-tech' },
    { nombre: 'Gaming y videojuegos', slug: 'gaming-videojuegos' },
    { nombre: 'Fotografía y cámaras', slug: 'fotografia-camaras' },
    { nombre: 'Smartwatches y wearables', slug: 'smartwatches-wearables' },
    { nombre: 'Impresoras y escáneres', slug: 'impresoras-escaneres' },
    { nombre: 'Componentes de PC', slug: 'componentes-pc' },
  ]},
  { nombre: 'Hogar y Decoración', slug: 'hogar-decoracion', rubro: 'hogar', hijos: [
    { nombre: 'Muebles', slug: 'muebles' },
    { nombre: 'Decoración', slug: 'decoracion' },
    { nombre: 'Iluminación', slug: 'iluminacion' },
    { nombre: 'Textiles del hogar', slug: 'textiles-hogar' },
    { nombre: 'Organización y almacenamiento', slug: 'organizacion-almacenamiento' },
    { nombre: 'Arte y cuadros', slug: 'arte-cuadros' },
    { nombre: 'Espejos', slug: 'espejos' },
    { nombre: 'Alfombras y pisos', slug: 'alfombras-pisos' },
    { nombre: 'Cortinas y persianas', slug: 'cortinas-persianas' },
    { nombre: 'Relojes de pared', slug: 'relojes-pared' },
  ]},
  { nombre: 'Electrodomésticos', slug: 'electrodomesticos', rubro: 'electrodomesticos', hijos: [
    { nombre: 'Cocina grande', slug: 'cocina-grande' },
    { nombre: 'Lavarropas y secarropas', slug: 'lavarropas-secarropas' },
    { nombre: 'Pequeños electrodomésticos', slug: 'pequenos-electrodomesticos' },
    { nombre: 'Climatización', slug: 'climatizacion' },
    { nombre: 'Aspiradoras y limpieza', slug: 'aspiradoras-limpieza' },
    { nombre: 'Planchas y cuidado de ropa', slug: 'planchas-cuidado-ropa' },
  ]},
  { nombre: 'Alimentos y Bebidas', slug: 'alimentos-bebidas', rubro: 'alimentos', hijos: [
    { nombre: 'Almacén y despensa', slug: 'almacen-despensa' },
    { nombre: 'Bebidas', slug: 'bebidas' },
    { nombre: 'Snacks y golosinas', slug: 'snacks-golosinas' },
    { nombre: 'Alimentos saludables', slug: 'alimentos-saludables' },
    { nombre: 'Orgánicos y naturales', slug: 'organicos-naturales' },
    { nombre: 'Congelados', slug: 'congelados' },
    { nombre: 'Lácteos y huevos', slug: 'lacteos-huevos' },
    { nombre: 'Carnes y embutidos', slug: 'carnes-embutidos' },
    { nombre: 'Panadería y repostería', slug: 'panaderia-reposteria' },
    { nombre: 'Aceites, salsas y condimentos', slug: 'aceites-salsas-condimentos' },
    { nombre: 'Sin TACC / Celíacos', slug: 'sin-tacc-celiacos' },
    { nombre: 'Vegano y vegetariano', slug: 'vegano-vegetariano' },
  ]},
  { nombre: 'Belleza y Cuidado Personal', slug: 'belleza-cuidado-personal', rubro: 'belleza', hijos: [
    { nombre: 'Maquillaje', slug: 'maquillaje' },
    { nombre: 'Skincare y cuidado facial', slug: 'skincare-cuidado-facial' },
    { nombre: 'Cuidado del cabello', slug: 'cuidado-cabello' },
    { nombre: 'Perfumes y fragancias', slug: 'perfumes-fragancias' },
    { nombre: 'Cuidado corporal', slug: 'cuidado-corporal' },
    { nombre: 'Higiene personal', slug: 'higiene-personal' },
    { nombre: 'Depilación y afeitado', slug: 'depilacion-afeitado' },
    { nombre: 'Uñas y nail art', slug: 'unas-nail-art' },
    { nombre: 'Cuidado personal hombre', slug: 'cuidado-personal-hombre' },
    { nombre: 'Salud íntima', slug: 'salud-intima' },
  ]},
  { nombre: 'Salud y Bienestar', slug: 'salud-bienestar', rubro: 'salud', hijos: [
    { nombre: 'Suplementos y vitaminas', slug: 'suplementos-vitaminas' },
    { nombre: 'Medicamentos de venta libre', slug: 'medicamentos-venta-libre' },
    { nombre: 'Ortopedia y movilidad', slug: 'ortopedia-movilidad' },
    { nombre: 'Fitness y equipamiento', slug: 'fitness-equipamiento' },
    { nombre: 'Salud sexual', slug: 'salud-sexual' },
    { nombre: 'Audición y visión', slug: 'audicion-vision' },
    { nombre: 'Primeros auxilios', slug: 'primeros-auxilios' },
    { nombre: 'Relajación y bienestar', slug: 'relajacion-bienestar' },
  ]},
  { nombre: 'Deportes y Aventura', slug: 'deportes-aventura', rubro: 'deportes', hijos: [
    { nombre: 'Fútbol', slug: 'futbol' },
    { nombre: 'Running y atletismo', slug: 'running-atletismo' },
    { nombre: 'Ciclismo', slug: 'ciclismo' },
    { nombre: 'Natación', slug: 'natacion' },
    { nombre: 'Gimnasio y fitness', slug: 'gimnasio-fitness' },
    { nombre: 'Deportes de raqueta', slug: 'deportes-raqueta' },
    { nombre: 'Camping y outdoor', slug: 'camping-outdoor' },
    { nombre: 'Montañismo y trekking', slug: 'montanismo-trekking' },
    { nombre: 'Deportes acuáticos', slug: 'deportes-acuaticos' },
    { nombre: 'Nutrición deportiva', slug: 'nutricion-deportiva' },
  ]},
  { nombre: 'Juguetes y Juegos', slug: 'juguetes-juegos', rubro: 'juguetes', hijos: [
    { nombre: 'Juguetes para bebés', slug: 'juguetes-bebes' },
    { nombre: 'Muñecas y accesorios', slug: 'munecas-accesorios' },
    { nombre: 'Figuras y coleccionables', slug: 'figuras-coleccionables' },
    { nombre: 'Juegos de mesa', slug: 'juegos-mesa' },
    { nombre: 'Rompecabezas', slug: 'rompecabezas' },
    { nombre: 'Vehículos y radiocontrol', slug: 'vehiculos-radiocontrol' },
    { nombre: 'Construcción (Lego, bloques)', slug: 'construccion-lego-bloques' },
    { nombre: 'Juguetes educativos', slug: 'juguetes-educativos' },
    { nombre: 'Juegos al aire libre', slug: 'juegos-aire-libre' },
    { nombre: 'Disfraces y fantasía', slug: 'disfraces-fantasia' },
  ]},
  { nombre: 'Libros, Música y Entretenimiento', slug: 'libros-musica-entretenimiento', rubro: 'libros', hijos: [
    { nombre: 'Libros', slug: 'libros' },
    { nombre: 'Revistas', slug: 'revistas' },
    { nombre: 'Música (CDs y vinilos)', slug: 'musica-cds-vinilos' },
    { nombre: 'Películas y series', slug: 'peliculas-series' },
    { nombre: 'Instrumentos musicales', slug: 'instrumentos-musicales' },
    { nombre: 'Material educativo', slug: 'material-educativo' },
    { nombre: 'Papelería y librería', slug: 'papeleria-libreria' },
  ]},
  { nombre: 'Automotor y Motos', slug: 'automotor-motos', rubro: 'automotor', hijos: [
    { nombre: 'Repuestos de autos', slug: 'repuestos-autos' },
    { nombre: 'Accesorios para autos', slug: 'accesorios-autos' },
    { nombre: 'Audio y GPS vehicular', slug: 'audio-gps-vehicular' },
    { nombre: 'Limpieza y detailing', slug: 'limpieza-detailing' },
    { nombre: 'Repuestos de motos', slug: 'repuestos-motos' },
    { nombre: 'Accesorios para motos', slug: 'accesorios-motos' },
    { nombre: 'Neumáticos y llantas', slug: 'neumaticos-llantas' },
    { nombre: 'Herramientas automotrices', slug: 'herramientas-automotrices' },
  ]},
  { nombre: 'Herramientas y Construcción', slug: 'herramientas-construccion', rubro: 'herramientas', hijos: [
    { nombre: 'Herramientas eléctricas', slug: 'herramientas-electricas' },
    { nombre: 'Herramientas manuales', slug: 'herramientas-manuales' },
    { nombre: 'Materiales de construcción', slug: 'materiales-construccion' },
    { nombre: 'Pintura y acabados', slug: 'pintura-acabados' },
    { nombre: 'Plomería y sanitarios', slug: 'plomeria-sanitarios' },
    { nombre: 'Electricidad técnica', slug: 'electricidad-tecnica' },
    { nombre: 'Seguridad industrial', slug: 'seguridad-industrial' },
    { nombre: 'Jardinería y paisajismo', slug: 'jardineria-paisajismo' },
  ]},
  { nombre: 'Mascotas', slug: 'mascotas', rubro: 'mascotas', hijos: [
    { nombre: 'Perros', slug: 'mascotas-perros' },
    { nombre: 'Gatos', slug: 'mascotas-gatos' },
    { nombre: 'Aves', slug: 'mascotas-aves' },
    { nombre: 'Peces y acuarios', slug: 'peces-acuarios' },
    { nombre: 'Roedores', slug: 'roedores' },
    { nombre: 'Reptiles', slug: 'reptiles' },
    { nombre: 'Alimentos para mascotas', slug: 'alimentos-mascotas' },
    { nombre: 'Salud veterinaria', slug: 'salud-veterinaria' },
    { nombre: 'Accesorios y juguetes', slug: 'accesorios-juguetes-mascotas' },
  ]},
  { nombre: 'Bebés y Maternidad', slug: 'bebes-maternidad', rubro: 'bebes', hijos: [
    { nombre: 'Ropa de bebé', slug: 'ropa-bebe' },
    { nombre: 'Coches y sillas de auto', slug: 'coches-sillas-auto' },
    { nombre: 'Alimentación infantil', slug: 'alimentacion-infantil' },
    { nombre: 'Cunas y dormitorio bebé', slug: 'cunas-dormitorio-bebe' },
    { nombre: 'Juguetes para bebés', slug: 'juguetes-para-bebes' },
    { nombre: 'Cuidado e higiene bebé', slug: 'cuidado-higiene-bebe' },
    { nombre: 'Ropa y accesorios maternidad', slug: 'ropa-accesorios-maternidad' },
    { nombre: 'Lactancia', slug: 'lactancia' },
  ]},
  { nombre: 'Arte, Diseño y Manualidades', slug: 'arte-diseno-manualidades', rubro: 'arte', hijos: [
    { nombre: 'Pinturas y pinceles', slug: 'pinturas-pinceles' },
    { nombre: 'Dibujo y boceto', slug: 'dibujo-boceto' },
    { nombre: 'Escultura y modelado', slug: 'escultura-modelado' },
    { nombre: 'Costura y tejido', slug: 'costura-tejido' },
    { nombre: 'Scrapbooking', slug: 'scrapbooking' },
    { nombre: 'Encuadernación', slug: 'encuadernacion' },
    { nombre: 'Arte digital', slug: 'arte-digital' },
    { nombre: 'Fotografía artística', slug: 'fotografia-artistica' },
  ]},
  { nombre: 'Oficina y Trabajo', slug: 'oficina-trabajo', rubro: 'oficina', hijos: [
    { nombre: 'Mobiliario de oficina', slug: 'mobiliario-oficina' },
    { nombre: 'Insumos y papelería', slug: 'insumos-papeleria' },
    { nombre: 'Tecnología de oficina', slug: 'tecnologia-oficina' },
    { nombre: 'Comunicación y telefonía', slug: 'comunicacion-telefonia' },
    { nombre: 'Organización de escritorio', slug: 'organizacion-escritorio' },
    { nombre: 'Equipos de presentación', slug: 'equipos-presentacion' },
  ]},
  { nombre: 'Jardín y Exteriores', slug: 'jardin-exteriores', rubro: 'jardin', hijos: [
    { nombre: 'Plantas y semillas', slug: 'plantas-semillas' },
    { nombre: 'Macetas y jardín vertical', slug: 'macetas-jardin-vertical' },
    { nombre: 'Herramientas de jardín', slug: 'herramientas-jardin' },
    { nombre: 'Riego', slug: 'riego' },
    { nombre: 'Muebles de exterior', slug: 'muebles-exterior' },
    { nombre: 'Parrillas y asadores', slug: 'parrillas-asadores' },
    { nombre: 'Piletas y accesorios', slug: 'piletas-accesorios' },
    { nombre: 'Iluminación exterior', slug: 'iluminacion-exterior' },
  ]},
  { nombre: 'Viajes y Turismo', slug: 'viajes-turismo', rubro: 'viajes', hijos: [
    { nombre: 'Equipaje y valijas', slug: 'equipaje-valijas' },
    { nombre: 'Accesorios de viaje', slug: 'accesorios-viaje' },
    { nombre: 'Camping y outdoor (viaje)', slug: 'camping-outdoor-viaje' },
    { nombre: 'Guías de viaje', slug: 'guias-viaje' },
    { nombre: 'Seguros de viaje', slug: 'seguros-viaje' },
    { nombre: 'Ropa de viaje', slug: 'ropa-viaje' },
  ]},
  { nombre: 'Servicios Digitales y Cursos', slug: 'servicios-digitales-cursos', rubro: 'servicios', hijos: [
    { nombre: 'Cursos online', slug: 'cursos-online' },
    { nombre: 'Software y licencias', slug: 'software-licencias' },
    { nombre: 'Templates y diseño digital', slug: 'templates-diseno-digital' },
    { nombre: 'Fotografía y video digital', slug: 'fotografia-video-digital' },
    { nombre: 'Consultoría y asesorías', slug: 'consultoria-asesorias' },
    { nombre: 'E-books y recursos digitales', slug: 'ebooks-recursos-digitales' },
  ]},
  { nombre: 'Coleccionables y Antigüedades', slug: 'coleccionables-antiguedades', rubro: 'coleccionables', hijos: [
    { nombre: 'Monedas y billetes', slug: 'monedas-billetes' },
    { nombre: 'Estampillas', slug: 'estampillas' },
    { nombre: 'Figuras y estatuillas', slug: 'figuras-estatuillas' },
    { nombre: 'Antigüedades', slug: 'antiguedades' },
    { nombre: 'Libros raros y de colección', slug: 'libros-raros-coleccion' },
    { nombre: 'Tarjetas coleccionables', slug: 'tarjetas-coleccionables' },
    { nombre: 'Arte y obras originales', slug: 'arte-obras-originales' },
  ]},
];

// Metadata de rubros para el onboarding (label visible + emoji). El `id` coincide
// con `Categoria.rubro` de la raíz correspondiente.
export const RUBROS: { id: string; label: string; emoji: string }[] = [
  { id: 'indumentaria', label: 'Indumentaria y Moda', emoji: '👕' },
  { id: 'tecnologia', label: 'Tecnología y Electrónica', emoji: '📱' },
  { id: 'hogar', label: 'Hogar y Decoración', emoji: '🛋️' },
  { id: 'electrodomesticos', label: 'Electrodomésticos', emoji: '🔌' },
  { id: 'alimentos', label: 'Alimentos y Bebidas', emoji: '🍎' },
  { id: 'belleza', label: 'Belleza y Cuidado Personal', emoji: '💄' },
  { id: 'salud', label: 'Salud y Bienestar', emoji: '💊' },
  { id: 'deportes', label: 'Deportes y Aventura', emoji: '⚽' },
  { id: 'juguetes', label: 'Juguetes y Juegos', emoji: '🧸' },
  { id: 'libros', label: 'Libros, Música y Entretenimiento', emoji: '📚' },
  { id: 'automotor', label: 'Automotor y Motos', emoji: '🚗' },
  { id: 'herramientas', label: 'Herramientas y Construcción', emoji: '🔧' },
  { id: 'mascotas', label: 'Mascotas', emoji: '🐾' },
  { id: 'bebes', label: 'Bebés y Maternidad', emoji: '🍼' },
  { id: 'arte', label: 'Arte, Diseño y Manualidades', emoji: '🎨' },
  { id: 'oficina', label: 'Oficina y Trabajo', emoji: '🗂️' },
  { id: 'jardin', label: 'Jardín y Exteriores', emoji: '🌱' },
  { id: 'viajes', label: 'Viajes y Turismo', emoji: '🧳' },
  { id: 'servicios', label: 'Servicios Digitales y Cursos', emoji: '💻' },
  { id: 'coleccionables', label: 'Coleccionables y Antigüedades', emoji: '🏺' },
];

// Sincroniza el árbol completo (N niveles) de forma idempotente por slug.
// - upsert por slug: si existe no duplica; reasigna padreId y (en raíces) el rubro.
// - recursivo: crea hijos → nietos → etc.
// Devuelve cuántos nodos se verificaron/crearon.
export async function sincronizarCategorias(prisma: PrismaClient): Promise<number> {
  let n = 0;

  async function upsertNodo(nodo: NodoCategoria, padreId: number | null): Promise<void> {
    const esRaiz = padreId === null;
    const cat = await prisma.categoria.upsert({
      where: { slug: nodo.slug },
      update: {
        padreId,
        nombre: nodo.nombre,
        ...(esRaiz && nodo.rubro ? { rubro: nodo.rubro } : {}),
      },
      create: {
        nombre: nodo.nombre,
        slug: nodo.slug,
        padreId,
        activa: true,
        ...(esRaiz && nodo.rubro ? { rubro: nodo.rubro } : {}),
      },
    });
    n++;
    for (const hijo of nodo.hijos ?? []) {
      await upsertNodo(hijo, cat.id);
    }
  }

  for (const raiz of ARBOL_CATEGORIAS) {
    await upsertNodo(raiz, null);
  }
  return n;
}

// DTOs y schemas de validación para el módulo de tiendas.
// import { BorderRadius, CardStyle, HeroLayout, NavbarStyle } from '@prisma/client';
import { z } from 'zod';

// Validador de color hexadecimal (#RRGGBB)
const colorHex = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un hexadecimal válido (#RRGGBB)')
  .optional();

// ─────────────────────────────────────────────
// CREAR TIENDA
// ─────────────────────────────────────────────

export const CrearTiendaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la tienda es requerido' })
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150)
    .trim(),

  titulo: z.string().max(200).trim().optional(),
  descripcion: z.string().max(2000).trim().optional(),
  plantillaId: z.number().int().positive().optional(),
  whatsapp: z.string().max(30).trim().optional(),
  instagram: z.string().max(100).trim().optional(),
  facebook: z.string().max(100).trim().optional(),
  slug: z
    .string()
    .trim()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(60, 'El slug no puede tener más de 60 caracteres')
    .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos')
    .optional(),
  sitioWeb: z.string().url('El sitio web debe ser una URL válida').optional(),
  pais: z.string().max(80).trim().optional(),
  provincia: z.string().max(80).trim().optional(),
  ciudad: z.string().max(80).trim().optional(),
});

export type CrearTiendaDto = z.infer<typeof CrearTiendaSchema>;

// ─────────────────────────────────────────────
// ACTUALIZAR TIENDA
// ─────────────────────────────────────────────

export const ActualizarTiendaSchema = CrearTiendaSchema.partial().extend({
  activa: z.boolean().optional(),
  publica: z.boolean().optional(),
});

export type ActualizarTiendaDto = z.infer<typeof ActualizarTiendaSchema>;

// ─────────────────────────────────────────────
// TEMA / APARIENCIA
// ─────────────────────────────────────────────

const SeccionesVisiblesSchema = z
  .object({
    navbar: z.boolean(),
    hero: z.boolean(),
    carrusel: z.boolean(),
    galeria: z.boolean(),
    productos: z.boolean(),
    sobreNosotros: z.boolean(),
    contacto: z.boolean(),
    footer: z.boolean(),
  })
  .partial(); // Todos opcionales para poder actualizar solo algunos

export const ActualizarTemaSchema = z.object({
  colorAcento: colorHex,
  modoOscuro: z.boolean().optional(),
  navbarStyle: z.string().optional(),
  heroTitulo: z.string().max(200).optional(),
  heroSubtitulo: z.string().max(300).optional(),
  heroCtaTexto: z.string().max(100).optional(),
  cardMostrarPrecio: z.boolean().optional(),
  cardMostrarBadge: z.boolean().optional(),
  seccionesVisibles: SeccionesVisiblesSchema.optional(),
});

export type ActualizarTemaDto = z.infer<typeof ActualizarTemaSchema>;

//Metodos de pago y entrega
export const AgregarMetodoPagoSchema = z.object({
  metodoPagoId: z.number().int().positive('El ID del método de pago es requerido'),
  detalle: z.string().max(255).trim().optional(),
});

export type AgregarMetodoPagoDto = z.infer<typeof AgregarMetodoPagoSchema>;

export const AgregarMetodoEntregaSchema = z.object({
  metodoEntregaId: z.number().int().positive('El ID del método de entrega es requerido'),
  zonaCobertura: z.string().max(255).trim().optional(),
  detalle: z.string().max(255).trim().optional(),
});

export type AgregarMetodoEntregaDto = z.infer<typeof AgregarMetodoEntregaSchema>;

//Carrusel de imágenes
export const AgregarImagenCarruselSchema = z.object({
  url: z.string().url('La URL de la imagen no es válida').max(500).optional(), // Optional si se suben archivos
  titulo: z.string().max(200).trim().optional(),
  subtitulo: z.string().max(300).trim().optional(),
  linkUrl: z.string().url().max(500).optional().or(z.literal('')), // Permite string vacío desde form-data
  orden: z.coerce.number().int().min(0).default(0), // Convierte string "0" a número
});

export type AgregarImagenCarruselDto = z.infer<typeof AgregarImagenCarruselSchema>;

//Filtros para listar tiendas en el endpoint público, con paginación, búsqueda por nombre y ubicación, y ordenamiento
export const FiltrosTiendasSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  busqueda: z.string().trim().optional(),
  ciudad: z.string().trim().optional(),
  provincia: z.string().trim().optional(),
  orden: z.enum(['nombre', 'vistas', 'creadoEn']).default('creadoEn'),
  direccion: z.enum(['asc', 'desc']).default('desc'),
});

export type FiltrosTiendasDto = z.infer<typeof FiltrosTiendasSchema>;

//Sobre nosotros
export const ActualizarAboutUsSchema = z.object({
  titulo: z.string().max(200).trim().optional(),
  descripcion: z.string().max(5000).trim().optional(),
  direccion: z.string().max(300).trim().optional(),
  imagenUrl: z.string().url().max(500).optional(),
});

export type ActualizarAboutUsDto = z.infer<typeof ActualizarAboutUsSchema>;

//Slider que puede mostrar marcas frases etc
export const MarqueeItemSchema = z.object({
  texto: z.string().min(1).max(100).trim(),
  orden: z.number().int().min(0).default(0),
});

export const ActualizarMarqueeSchema = z.object({
  items: z.array(MarqueeItemSchema),
});

export type ActualizarMarqueeDto = z.infer<typeof ActualizarMarqueeSchema>;

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
  navbarVariante: z.enum(['CLASICO', 'PILL']).optional(),
  footerVariante: z.enum(['CENTRADO', 'COLUMNAS']).optional(),
  heroTitulo: z.string().max(200).optional(),
  heroSubtitulo: z.string().max(300).optional(),
  heroCtaTexto: z.string().max(100).optional(),
  cardMostrarPrecio: z.boolean().optional(),
  cardMostrarBadge: z.boolean().optional(),
  seccionesVisibles: SeccionesVisiblesSchema.optional(),
  tipoSeccionHero: z.enum(['CARRUSEL', 'BANNER', 'HERO_FIJO', 'VIDEO', 'GALERIA']).optional(),
  intervaloCarrusel: z.number().int().min(1000).max(30000).optional(),
  // Banner promocional (entre destacados y productos)
  bannerPromoActivo: z.boolean().optional(),
  bannerPromoTitulo: z.string().max(200).optional().nullable(),
  bannerPromoSubtitulo: z.string().max(300).optional().nullable(),
  bannerPromoImagenUrl: z.string().max(500).optional().nullable(),
  bannerPromoLinkUrl: z.string().max(500).optional().nullable(),
  bannerPromoCtaTexto: z.string().max(100).optional().nullable(),
});

export type ActualizarTemaDto = z.infer<typeof ActualizarTemaSchema>;

//Metodos de pago y entrega

// Un único schema con todos los campos posibles de configExtra (MP + transferencia).
// Antes era un z.union de schemas con todos los campos opcionales, lo que hacía que
// Zod matcheara el primer schema (MP) y descartara los campos de transferencia
// (cbu/alias/banco/titular), guardando configExtra vacío.
const ConfigExtraPagoSchema = z.object({
  // Mercado Pago
  mpAccessToken: z.string().max(500).optional(),
  mpPublicKey:   z.string().max(500).optional(),
  // Transferencia
  cbu:     z.string().max(22).optional(),
  alias:   z.string().max(50).optional(),
  banco:   z.string().max(80).optional(),
  titular: z.string().max(100).optional(),
});

export const AgregarMetodoPagoSchema = z.object({
  metodoPagoId: z.number().int().positive('El ID del método de pago es requerido'),
  detalle:      z.string().max(255).trim().optional(),
  configExtra:  ConfigExtraPagoSchema.optional(),
});

export const ActualizarMetodoPagoSchema = z.object({
  detalle:     z.string().max(255).trim().optional(),
  configExtra: ConfigExtraPagoSchema.optional(),
});

export type AgregarMetodoPagoDto    = z.infer<typeof AgregarMetodoPagoSchema>;
export type ActualizarMetodoPagoDto = z.infer<typeof ActualizarMetodoPagoSchema>;

export const AgregarMetodoEntregaSchema = z.object({
  metodoEntregaId: z.number().int().positive('El ID del método de entrega es requerido'),
  zonaCobertura:   z.string().max(255).trim().optional(),
  detalle:         z.string().max(255).trim().optional(),
  costo:           z.coerce.number().min(0).optional(),
  costoGratis:     z.coerce.number().min(0).optional(),
  tiempoEstimado:  z.string().max(100).trim().optional(),
});

export const ActualizarMetodoEntregaSchema = z.object({
  zonaCobertura:  z.string().max(255).trim().optional(),
  detalle:        z.string().max(255).trim().optional(),
  costo:          z.coerce.number().min(0).nullable().optional(),
  costoGratis:    z.coerce.number().min(0).nullable().optional(),
  tiempoEstimado: z.string().max(100).trim().optional(),
});

export type AgregarMetodoEntregaDto    = z.infer<typeof AgregarMetodoEntregaSchema>;
export type ActualizarMetodoEntregaDto = z.infer<typeof ActualizarMetodoEntregaSchema>;

//Carrusel de imágenes
export const AgregarImagenCarruselSchema = z.object({
  url: z.string().url('La URL de la imagen no es válida').max(500).optional(),
  titulo: z.string().max(200).trim().optional(),
  subtitulo: z.string().max(300).trim().optional(),
  linkUrl: z.string().url().max(500).optional().or(z.literal('')),
  orden: z.coerce.number().int().min(0).default(0),
  tipo: z.enum(['CARRUSEL', 'BANNER', 'HERO_FIJO', 'VIDEO']).default('CARRUSEL'),
  etiqueta: z.string().max(100).trim().optional(),
  fechaDesde: z.coerce.date().optional().nullable(),
  fechaHasta: z.coerce.date().optional().nullable(),
});

export type AgregarImagenCarruselDto = z.infer<typeof AgregarImagenCarruselSchema>;

export const ActualizarImagenCarruselSchema = z.object({
  titulo: z.string().max(200).trim().optional(),
  subtitulo: z.string().max(300).trim().optional(),
  linkUrl: z.string().url().max(500).optional().or(z.literal('')),
  orden: z.coerce.number().int().min(0).optional(),
  activa: z.boolean().optional(),
  tipo: z.enum(['CARRUSEL', 'BANNER', 'HERO_FIJO', 'VIDEO']).optional(),
  etiqueta: z.string().max(100).trim().optional(),
  fechaDesde: z.coerce.date().optional().nullable(),
  fechaHasta: z.coerce.date().optional().nullable(),
});

export type ActualizarImagenCarruselDto = z.infer<typeof ActualizarImagenCarruselSchema>;

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

// ─────────────────────────────────────────────
// CAMBIAR SLUG
// ─────────────────────────────────────────────

export const CambiarSlugSchema = z.object({
  slug: z
    .string({ required_error: 'El slug es requerido' })
    .trim()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(60, 'El slug no puede tener más de 60 caracteres')
    .regex(/^[a-z0-9]+(?:[-][a-z0-9]+)*$/, 'Solo letras minúsculas, números y guiones'),
});

export type CambiarSlugDto = z.infer<typeof CambiarSlugSchema>;

export const GuardarDominioSchema = z.object({
  dominio: z
    .string({ required_error: 'El dominio es requerido' })
    .trim()
    .toLowerCase()
    .min(4, 'El dominio es demasiado corto')
    .max(255, 'El dominio es demasiado largo')
    // Valida un dominio tipo "mitienda.com" o "www.mitienda.com" (sin http:// ni rutas).
    .regex(
      /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/,
      'Ingresá un dominio válido, ej: www.mitienda.com (sin http:// ni barras)'
    ),
});

export type GuardarDominioDto = z.infer<typeof GuardarDominioSchema>;

// ─────────────────────────────────────────────
// CONFIG DE EMAIL MARKETING (proveedor propio del dueño)
// Cada tienda usa su propio servicio para enviar campañas:
//  - "brevo": basta la API key (host/port no aplican).
//  - "gmail" / "smtp": requieren host, puerto, usuario y password (app password en Gmail).
// La credencial (API key o password) viaja en "credencial" y se cifra antes de guardar.
// ─────────────────────────────────────────────

export const GuardarConfigEmailSchema = z
  .object({
    proveedor: z.enum(['brevo', 'gmail', 'smtp'], {
      required_error: 'Elegí un proveedor de email',
      invalid_type_error: 'Proveedor inválido',
    }),
    remitente: z
      .string({ required_error: 'El email del remitente es requerido' })
      .trim()
      .toLowerCase()
      .email('Ingresá un email de remitente válido')
      .max(180),
    remitenteNombre: z.string().trim().max(120).optional(),
    // Credencial: API key (brevo) o password/app-password (gmail/smtp).
    // Opcional al editar: si no se manda, se conserva la credencial ya guardada.
    credencial: z.string().trim().min(1, 'La credencial no puede estar vacía').max(500).optional(),
    host: z.string().trim().max(180).optional(),
    port: z.coerce.number().int().positive().max(65535).optional(),
    usuario: z.string().trim().max(180).optional(),
  })
  .superRefine((data, ctx) => {
    // Para SMTP/Gmail necesitamos los datos de conexión.
    if (data.proveedor === 'smtp' || data.proveedor === 'gmail') {
      if (!data.host) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['host'], message: 'El host SMTP es requerido' });
      }
      if (!data.usuario) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['usuario'], message: 'El usuario SMTP es requerido' });
      }
    }
  });

export type GuardarConfigEmailDto = z.infer<typeof GuardarConfigEmailSchema>;

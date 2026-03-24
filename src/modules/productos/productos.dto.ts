// DTOs y schemas de validación para productos.
import { z } from 'zod';

// ─────────────────────────────────────────────
// VARIANTE (usada dentro de crear/actualizar producto)
// ─────────────────────────────────────────────

const VarianteSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la variante es requerido' })
    .min(1)
    .max(150)
    .trim(),
  sku: z.string().max(100).trim().optional(),
  // precioExtra puede ser 0 (sin costo adicional) o positivo
  precioExtra: z.coerce.number().min(0).default(0),
  imagenUrl: z.string().url('URL de imagen inválida').optional(),
  disponible: z.coerce.boolean().default(true),
});

// ─────────────────────────────────────────────
// CREAR PRODUCTO
// ─────────────────────────────────────────────

// Schema base sin refine para poder hacer .omit() y .partial()
const ProductoBaseSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del producto es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200)
    .trim(),

  descripcion: z.string().max(5000).trim().optional(),

  precio: z.coerce
    .number({ required_error: 'El precio es requerido' })
    .positive('El precio debe ser mayor a 0')
    .multipleOf(0.01, 'El precio debe tener máximo 2 decimales'),

  precioOferta: z.coerce
    .number()
    .positive('El precio de oferta debe ser mayor a 0')
    .multipleOf(0.01)
    .optional()
    .or(z.literal('')), // Permite string vacío de FormData

  moneda: z
    .string()
    .length(3, 'La moneda debe ser un código de 3 letras (ej: ARS, USD)')
    .toUpperCase()
    .default('ARS'),

  imagenPrincipalUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),

  categoriaId: z.coerce.number().int().positive().optional(),

  disponible: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean().default(true)),
  destacado: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean().default(false)),

  // Al usar FormData, tags puede venir como una sola string separada por comas or multiple fields.
  // Pero aquí el backend lo espera como array. Multer no lo parsea a array automáticamente si no se envía repetido.
  tags: z.preprocess(
    (val) => {
      if (typeof val === 'string')
        return val
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      return val;
    },
    z.array(z.string().max(80).trim()).max(10, 'Máximo 10 tags por producto').default([])
  ),

  variantes: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(VarianteSchema).default([])),
});

// Aplicamos refine DESPUÉS para validación cruzada precio/precioOferta
export const CrearProductoSchema = ProductoBaseSchema.refine(
  (data) => !data.precioOferta || data.precioOferta < data.precio,
  {
    message: 'El precio de oferta debe ser menor al precio original',
    path: ['precioOferta'],
  }
);

export type CrearProductoDto = z.infer<typeof CrearProductoSchema>;

// Para actualizar usamos el schema base (sin refine) con todos los campos opcionales
export const ActualizarProductoSchema = ProductoBaseSchema.omit({
  variantes: true,
  tags: true,
}).partial();

export type ActualizarProductoDto = z.infer<typeof ActualizarProductoSchema>;

// ─────────────────────────────────────────────
// CREAR / ACTUALIZAR VARIANTE
// ─────────────────────────────────────────────

export const CrearVarianteSchema = VarianteSchema;
export type CrearVarianteDto = z.infer<typeof CrearVarianteSchema>;

export const ActualizarVarianteSchema = VarianteSchema.partial();
export type ActualizarVarianteDto = z.infer<typeof ActualizarVarianteSchema>;

// ─────────────────────────────────────────────
// AGREGAR IMAGEN (URL o archivo via multer)
// ─────────────────────────────────────────────

export const AgregarImagenSchema = z.object({
  url: z.string().url('URL de imagen inválida').max(500).optional(),
  orden: z.coerce.number().int().min(0).default(0),
});

export type AgregarImagenDto = z.infer<typeof AgregarImagenSchema>;

// ─────────────────────────────────────────────
// FILTROS DE PRODUCTOS
// ─────────────────────────────────────────────

export const FiltrosProductosSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
  busqueda: z.string().trim().optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  disponible: z.coerce.boolean().optional(),
  destacado: z.coerce.boolean().optional(),
  tags: z.string().optional(), // Tags separados por coma: "ropa,verano"
  precioMin: z.coerce.number().min(0).optional(),
  precioMax: z.coerce.number().min(0).optional(),
  orden: z.enum(['nombre', 'precio', 'vistas', 'creadoEn', 'destacado']).default('creadoEn'),
  direccion: z.enum(['asc', 'desc']).default('desc'),
});

export type FiltrosProductosDto = z.infer<typeof FiltrosProductosSchema>;

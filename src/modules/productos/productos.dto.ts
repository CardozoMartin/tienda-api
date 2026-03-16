// DTOs y schemas de validación para productos.
import { z } from "zod";

// ─────────────────────────────────────────────
// VARIANTE (usada dentro de crear/actualizar producto)
// ─────────────────────────────────────────────

const VarianteSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre de la variante es requerido" })
    .min(1)
    .max(150)
    .trim(),
  sku: z.string().max(100).trim().optional(),
  // precioExtra puede ser 0 (sin costo adicional) o positivo
  precioExtra: z.coerce.number().min(0).default(0),
  imagenUrl: z.string().url("URL de imagen inválida").optional(),
  disponible: z.boolean().default(true),
});

// ─────────────────────────────────────────────
// CREAR PRODUCTO
// ─────────────────────────────────────────────

// Schema base sin refine para poder hacer .omit() y .partial()
const ProductoBaseSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del producto es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200)
    .trim(),

  descripcion: z.string().max(5000).trim().optional(),

  precio: z.coerce
    .number({ required_error: "El precio es requerido" })
    .positive("El precio debe ser mayor a 0")
    .multipleOf(0.01, "El precio debe tener máximo 2 decimales"),

  precioOferta: z.coerce
    .number()
    .positive("El precio de oferta debe ser mayor a 0")
    .multipleOf(0.01)
    .optional(),

  moneda: z
    .string()
    .length(3, "La moneda debe ser un código de 3 letras (ej: ARS, USD)")
    .toUpperCase()
    .default("ARS"),

  imagenPrincipalUrl: z.string().url("URL de imagen inválida").optional(),

  categoriaId: z.number().int().positive().optional(),

  disponible: z.boolean().default(true),
  destacado: z.boolean().default(false),

  tags: z.array(z.string().max(80).trim()).max(10, "Máximo 10 tags por producto").default([]),

  variantes: z.array(VarianteSchema).default([]),
});

// Aplicamos refine DESPUÉS para validación cruzada precio/precioOferta
export const CrearProductoSchema = ProductoBaseSchema.refine(
  (data) => !data.precioOferta || data.precioOferta < data.precio,
  {
    message: "El precio de oferta debe ser menor al precio original",
    path: ["precioOferta"],
  }
);

export type CrearProductoDto = z.infer<typeof CrearProductoSchema>;

// Para actualizar usamos el schema base (sin refine) con todos los campos opcionales
export const ActualizarProductoSchema = ProductoBaseSchema
  .omit({ variantes: true, tags: true })
  .partial();

export type ActualizarProductoDto = z.infer<typeof ActualizarProductoSchema>;

// ─────────────────────────────────────────────
// CREAR / ACTUALIZAR VARIANTE
// ─────────────────────────────────────────────

export const CrearVarianteSchema = VarianteSchema;
export type CrearVarianteDto = z.infer<typeof CrearVarianteSchema>;

export const ActualizarVarianteSchema = VarianteSchema.partial();
export type ActualizarVarianteDto = z.infer<typeof ActualizarVarianteSchema>;

// ─────────────────────────────────────────────
// AGREGAR IMAGEN
// ─────────────────────────────────────────────

export const AgregarImagenSchema = z.object({
  url: z.string().url("URL de imagen inválida").max(500),
  orden: z.number().int().min(0).default(0),
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
  orden: z.enum(["nombre", "precio", "vistas", "creadoEn", "destacado"]).default("creadoEn"),
  direccion: z.enum(["asc", "desc"]).default("desc"),
});

export type FiltrosProductosDto = z.infer<typeof FiltrosProductosSchema>;

import { z } from 'zod';

export const CrearPopupSchema = z.object({
  tipo: z.enum(['OFERTA', 'NEWSLETTER', 'INFO', 'IMAGEN_CTA']).default('INFO'),
  activo: z.boolean().default(false),
  titulo: z.string().min(1).max(200),
  mensaje: z.string().max(1000).optional(),
  ctaTexto: z.string().max(100).optional(),
  ctaUrl: z.string().url().max(500).optional().or(z.literal('')),
  colorFondo: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  delay: z.coerce.number().int().min(0).max(60).default(2),
  frecuencia: z.enum(['SIEMPRE', 'UNA_VEZ_SESION', 'UNA_VEZ_DIA']).default('UNA_VEZ_SESION'),
  codigoDesc: z.string().max(50).optional(),
  porcentajeDesc: z.coerce.number().int().min(1).max(100).optional(),
});

export const ActualizarPopupSchema = CrearPopupSchema.partial();

export type CrearPopupDto = z.infer<typeof CrearPopupSchema>;
export type ActualizarPopupDto = z.infer<typeof ActualizarPopupSchema>;

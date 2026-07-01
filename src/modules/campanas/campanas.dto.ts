import { z } from 'zod';

// Crear/guardar una campaña (borrador). El cuerpo llega como HTML desde el
// compositor del front; la imagen es opcional y ya viene subida (URL).
export const CrearCampanaSchema = z.object({
  asunto: z
    .string({ required_error: 'El asunto es requerido' })
    .trim()
    .min(3, 'El asunto debe tener al menos 3 caracteres')
    .max(200),
  cuerpoHtml: z
    .string({ required_error: 'El contenido del email es requerido' })
    .trim()
    .min(1, 'El contenido no puede estar vacío'),
  imagenUrl: z.string().url('La imagen debe ser una URL válida').max(500).optional(),
  segmento: z.enum(['CLIENTES_REGISTRADOS', 'COMPRADORES', 'AMBOS'], {
    required_error: 'Elegí a quién enviar la campaña',
    invalid_type_error: 'Segmento inválido',
  }),
});

export type CrearCampanaDto = z.infer<typeof CrearCampanaSchema>;

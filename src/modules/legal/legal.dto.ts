import { z } from 'zod';

export const TIPOS_LEGALES = ['TERMINOS', 'PRIVACIDAD', 'CAMBIOS'] as const;

export const GuardarPaginaLegalSchema = z.object({
  titulo: z.string().min(2, 'El título es requerido').max(150).trim(),
  contenido: z.string().min(1, 'El contenido no puede estar vacío').max(50000),
  activa: z.coerce.boolean().default(true),
});

export type GuardarPaginaLegalDto = z.infer<typeof GuardarPaginaLegalSchema>;

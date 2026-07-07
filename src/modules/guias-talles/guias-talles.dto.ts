import { z } from 'zod';

// Una columna es un encabezado (ej: "Talle", "Pecho"). Cada fila es un array
// de celdas alineado a las columnas (ej: ["S", "48", "68"]).
export const GuiaTallesSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre es requerido')
    .max(120)
    .trim(),
  columnas: z
    .array(z.string().max(60).trim())
    .min(1, 'Debe haber al menos una columna')
    .max(8, 'Máximo 8 columnas'),
  filas: z
    .array(z.array(z.string().max(120).trim()))
    .max(60, 'Máximo 60 filas')
    .default([]),
  nota: z.string().max(500).trim().optional().or(z.literal('')),
});

export type GuiaTallesDto = z.infer<typeof GuiaTallesSchema>;

export const ActualizarGuiaTallesSchema = GuiaTallesSchema.partial();
export type ActualizarGuiaTallesDto = z.infer<typeof ActualizarGuiaTallesSchema>;

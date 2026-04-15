import { z } from "zod";

export const CrearResenaSchema = z.object({
  calificacion: z
    .number({ required_error: "La calificación es requerida" })
    .int()
    .min(1, "La calificación mínima es 1")
    .max(5, "La calificación máxima es 5"),
  comentario: z.string().max(2000).trim().optional(),
});

export type CrearResenaDto = z.infer<typeof CrearResenaSchema>;

export const ResponderResenaSchema = z.object({
  respuesta: z
    .string({ required_error: "La respuesta es requerida" })
    .min(5, "La respuesta debe tener al menos 5 caracteres")
    .max(2000)
    .trim(),
});

export type ResponderResenaDto = z.infer<typeof ResponderResenaSchema>;

export const FiltrosResenasSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(10),
  soloAprobadas: z.coerce.boolean().default(true),
  calificacionMin: z.coerce.number().int().min(1).max(5).optional(),
  orden: z.enum(["creadoEn", "calificacion"]).default("creadoEn"),
  direccion: z.enum(["asc", "desc"]).default("desc"),
});

export type FiltrosResenasDto = z.infer<typeof FiltrosResenasSchema>;

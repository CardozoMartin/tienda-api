import { z } from 'zod';

// Solicitud pública (desde la tienda, sin login). Datos mínimos para identificar al consumidor.
export const CrearRevocacionSchema = z.object({
  nombre: z.string({ required_error: 'El nombre es requerido' }).min(2, 'Ingresá tu nombre').max(150).trim(),
  email: z.string({ required_error: 'El email es requerido' }).email('Email inválido').max(180).trim(),
  telefono: z.string().max(30).trim().optional().or(z.literal('')),
  nroPedidoTexto: z.string().max(50).trim().optional().or(z.literal('')),
  motivo: z.string().max(2000).trim().optional().or(z.literal('')),
});

export type CrearRevocacionDto = z.infer<typeof CrearRevocacionSchema>;

// Actualización por el owner (gestión interna).
export const ActualizarRevocacionSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA']).optional(),
  respuestaOwner: z.string().max(2000).trim().optional().or(z.literal('')),
});

export type ActualizarRevocacionDto = z.infer<typeof ActualizarRevocacionSchema>;

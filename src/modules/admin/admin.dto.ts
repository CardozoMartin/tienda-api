import { z } from "zod";
import { RolUsuario } from "@prisma/client";

export const CrearCategoriaSchema = z.object({
  nombre: z.string().min(2).max(100).trim(),
  padreId: z.number().int().positive().optional(),
  iconoUrl: z.string().url().optional(),
  activa: z.boolean().default(true),
});

export const CrearMetodoPagoSchema = z.object({
  nombre: z.string().min(2).max(80).trim(),
  icono: z.string().max(50).trim().optional(),
  descripcion: z.string().max(255).trim().optional(),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0).default(0),
});

export const CrearMetodoEntregaSchema = z.object({
  nombre: z.string().min(2).max(80).trim(),
  icono: z.string().max(50).trim().optional(),
  descripcion: z.string().max(255).trim().optional(),
  permiteZona: z.boolean().default(false),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0).default(0),
});

export const CrearPlantillaSchema = z.object({
  nombre: z.string().min(2).max(80).trim(),
  descripcion: z.string().max(500).trim().optional(),
  previewUrl: z.string().url().optional(),
  defaultConfig: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
});

export const ActualizarRolSchema = z.object({
  rol: z.nativeEnum(RolUsuario),
});

export const ActualizarActivoSchema = z.object({
  activo: z.boolean(),
});

export const CrearTagSchema = z.object({
  nombre: z.string().min(2).max(80).trim(),
});
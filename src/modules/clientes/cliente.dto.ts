import { z } from "zod";

// ─────────────────────────────────────────────
// REGISTRO DE CLIENTE
// ─────────────────────────────────────────────
export const RegistroClienteSchema = z
  .object({
    tiendaId: z.number().int().positive().describe("ID de la tienda"),
    email: z
      .string()
      .min(1, "Email es requerido")
      .email("Email inválido")
      .toLowerCase()
      .trim(),
    nombre: z
      .string()
      .min(2, "Nombre debe tener mínimo 2 caracteres")
      .max(100, "Nombre muy largo"),
    apellido: z
      .string()
      .min(2, "Apellido debe tener mínimo 2 caracteres")
      .max(100, "Apellido muy largo"),
    telefono: z.string().min(8, "Teléfono inválido").max(30),
    password: z
      .string()
      .min(8, "Contraseña mínimo 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener mayúscula, minúscula y número"
      ),
  })
  .strict();

export type RegistroClienteInput = z.infer<typeof RegistroClienteSchema>;

// ─────────────────────────────────────────────
// LOGIN DE CLIENTE
// ─────────────────────────────────────────────
export const LoginClienteSchema = z
  .object({
    tiendaId: z.number().int().positive(),
    email: z
      .string()
      .min(1, "Email es requerido")
      .email("Email inválido")
      .toLowerCase()
      .trim(),
    password: z.string().min(1, "Contraseña es requerida"),
  })
  .strict();

export type LoginClienteInput = z.infer<typeof LoginClienteSchema>;

// ─────────────────────────────────────────────
// ACTUALIZAR PERFIL
// ─────────────────────────────────────────────
export const ActualizarClienteSchema = z
  .object({
    nombre: z.string().min(2).max(100).optional(),
    apellido: z.string().min(2).max(100).optional(),
    telefono: z.string().min(8).max(30).optional(),
  })
  .strict();

export type ActualizarClienteInput = z.infer<typeof ActualizarClienteSchema>;

// ─────────────────────────────────────────────
// CAMBIAR CONTRASEÑA
// ─────────────────────────────────────────────
export const CambiarPasswordClienteSchema = z
  .object({
    passwordActual: z.string().min(1, "Contraseña actual requerida"),
    passwordNueva: z
      .string()
      .min(8, "Contraseña mínimo 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener mayúscula, minúscula y número"
      ),
    passwordConfirmar: z.string(),
  })
  .refine((data) => data.passwordNueva === data.passwordConfirmar, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirmar"],
  });

export type CambiarPasswordClienteInput = z.infer<
  typeof CambiarPasswordClienteSchema
>;

// ─────────────────────────────────────────────
// RESPUESTA DE LOGIN
// ─────────────────────────────────────────────
export interface LoginResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  emailVerificado: boolean;
  token: string;
}

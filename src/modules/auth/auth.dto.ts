import { z } from "zod";

// REGISTRO
export const RegistrarseSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),

  apellido: z
    .string({ required_error: "El apellido es requerido" })
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100)
    .trim(),

  email: z
    .string({ required_error: "El email es requerido" })
    .email("El email no tiene un formato válido")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "La contraseña es requerida" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede superar 100 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),

  telefono: z
    .string()
    .max(30)
    .trim()
    .optional(),
  activo: z.boolean().optional()
});

export type RegistrarseDto = z.infer<typeof RegistrarseSchema>;


// LOGIN
export const LoginSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Email inválido")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "La contraseña es requerida" })
    .min(1, "La contraseña es requerida"),
});

export type LoginDto = z.infer<typeof LoginSchema>;


// REFRESH TOKEN
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "El refresh token es requerido" })
    .min(1),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;


// CAMBIAR CONTRASEÑA
export const CambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "La contraseña actual es requerida"),
    passwordNueva: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
      ),
    confirmarPassword: z.string(),
  })
  .refine((data) => data.passwordNueva === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

export type CambiarPasswordDto = z.infer<typeof CambiarPasswordSchema>;


// SOLICITAR RESET DE CONTRASEÑA
export const SolicitarResetSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
});

export type SolicitarResetDto = z.infer<typeof SolicitarResetSchema>;


// CONFIRMAR RESET DE CONTRASEÑA
export const ConfirmarResetSchema = z
  .object({
    token: z.string().min(1, "El token es requerido"),
    passwordNueva: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    confirmarPassword: z.string(),
  })
  .refine((data) => data.passwordNueva === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

export type ConfirmarResetDto = z.infer<typeof ConfirmarResetSchema>;

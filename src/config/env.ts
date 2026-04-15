// Centraliza y valida todas las variables de entorno usando Zod.
// Si falta una variable crítica o el formato es inválido, el servidor fallará al arrancar.
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Entorno de ejecución
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default("/api/v1"),

  // Base de datos
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),

  // JWT
  JWT_SECRET: z.string().min(8, "JWT_SECRET debe tener al menos 8 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z.string().min(8, "JWT_REFRESH_SECRET debe tener al menos 8 caracteres"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Email SMTP
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.string().transform((val) => val === "true").default("false"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z.string().email().optional().default("noreply@tienda.local"),

  // Frontend & Cloudinary
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  CLOUD_NAME: z.string().optional().default(""),
  CLOUD_API_KEY: z.string().optional().default(""),
  CLOUD_API_SECRET: z.string().optional().default(""),

  // Sentry
  SENTRY_DSN: z.string().optional().default(""),
});


// Validamos el objeto process.env contra el esquema
const resultado = envSchema.safeParse(process.env);

if (!resultado.success) {
  console.error("❌ Error de configuración en variables de entorno:");
  console.error(resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...resultado.data,
  esDevelopment: resultado.data.NODE_ENV === "development",
  esProduccion: resultado.data.NODE_ENV === "production",
  esTest: resultado.data.NODE_ENV === "test",
} as const;

export type Env = z.infer<typeof envSchema>;


// Centraliza y valida todas las variables de entorno.
// Si falta una variable crítica, el servidor falla en el arranque (fail-fast).
import "dotenv/config";

/**
 * Obtiene una variable de entorno requerida.
 * Lanza un error si no está definida, evitando errores silenciosos en runtime.
 */
function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Variable de entorno requerida no encontrada: ${nombre}`);
  }
  return valor;
}

/**
 * Obtiene una variable de entorno opcional con valor por defecto.
 */
function opcional(nombre: string, porDefecto: string): string {
  return process.env[nombre] ?? porDefecto;
}

export const env = {
  // Entorno de ejecución
  NODE_ENV: opcional("NODE_ENV", "development"),
  PORT: parseInt(opcional("PORT", "3000"), 10),
  API_PREFIX: opcional("API_PREFIX", "/api/v1"),

  // Base de datos
  DATABASE_URL: requerida("DATABASE_URL"),

  // JWT - Tokens de acceso (corta duración)
  JWT_SECRET: requerida("JWT_SECRET"),
  JWT_EXPIRES_IN: opcional("JWT_EXPIRES_IN", "7d"),

  // JWT - Tokens de refresco (larga duración)
  JWT_REFRESH_SECRET: requerida("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: opcional("JWT_REFRESH_EXPIRES_IN", "30d"),

  // CORS
  CORS_ORIGIN: opcional("CORS_ORIGIN", "http://localhost:5173"),

  // Rate limiting: 100 requests por 15 minutos por defecto
  RATE_LIMIT_WINDOW_MS: parseInt(opcional("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  RATE_LIMIT_MAX: parseInt(opcional("RATE_LIMIT_MAX", "100"), 10),

  // Email SMTP (opcional - si no se configura, se usa modo desarrollo/test)
  SMTP_HOST: opcional("SMTP_HOST", ""),
  SMTP_PORT: opcional("SMTP_PORT", "587"),
  SMTP_SECURE: opcional("SMTP_SECURE", "false"),
  SMTP_USER: opcional("SMTP_USER", ""),
  SMTP_PASS: opcional("SMTP_PASS", ""),
  MAIL_FROM: opcional("MAIL_FROM", "noreply@tienda.local"),

  // Frontend URL para redirecciones
  FRONTEND_URL: opcional("FRONTEND_URL", "http://localhost:5173"),

  // Helpers de entorno
  esDevelopment: opcional("NODE_ENV", "development") === "development",
  esProduccion: opcional("NODE_ENV", "development") === "production",
} as const;

// Exportamos también una función que retorna true si el entorno es válido
// para usarla en chequeos puntuales
export function esEntornoValido(): boolean {
  try {
    requerida("DATABASE_URL");
    requerida("JWT_SECRET");
    requerida("JWT_REFRESH_SECRET");
    return true;
  } catch {
    return false;
  }
};

// Utilidades compartidas por toda la aplicación.
import { Response } from "express";
import slugify from "slugify";
import { RespuestaApi, ResultadoPaginado, ParametrosPaginacion } from "../types";

// ─────────────────────────────────────────────
// RESPUESTAS HTTP ESTANDARIZADAS
// ─────────────────────────────────────────────

/**
 * Envía una respuesta exitosa con formato estándar.
 */
export function responderOk<T>(
  res: Response,
  datos: T,
  mensaje: string = "Operación exitosa",
  codigoHttp: number = 200
): void {
  const respuesta: RespuestaApi<T> = {
    ok: true,
    mensaje,
    datos,
  };
  res.status(codigoHttp).json(respuesta);
}

/**
 * Envía una respuesta de error con formato estándar.
 */
export function responderError(
  res: Response,
  mensaje: string,
  codigoHttp: number = 500,
  errores?: string[]
): void {
  const respuesta: RespuestaApi = {
    ok: false,
    mensaje,
    errores,
  };
  res.status(codigoHttp).json(respuesta);
}

/**
 * Envía una respuesta paginada con metadatos de paginación.
 */
export function responderPaginado<T>(
  res: Response,
  resultado: ResultadoPaginado<T>,
  mensaje: string = "Consulta exitosa"
): void {
  res.status(200).json({
    ok: true,
    mensaje,
    datos: resultado.datos,
    paginacion: {
      total: resultado.total,
      pagina: resultado.pagina,
      limite: resultado.limite,
      totalPaginas: resultado.totalPaginas,
    },
  });
}

// ─────────────────────────────────────────────
// PAGINACIÓN
// ─────────────────────────────────────────────

/**
 * Extrae y normaliza parámetros de paginación de la query string.
 * Aplica límites para evitar consultas excesivamente grandes.
 */
export function extraerPaginacion(query: Record<string, unknown>): ParametrosPaginacion {
  const pagina = Math.max(1, parseInt(String(query["pagina"] ?? "1"), 10) || 1);
  // Límite máximo de 100 registros por página para evitar sobrecarga
  const limite = Math.min(100, Math.max(1, parseInt(String(query["limite"] ?? "20"), 10) || 20));
  const orden = typeof query["orden"] === "string" ? query["orden"] : "creadoEn";
  const direccion = query["direccion"] === "asc" ? "asc" : "desc";

  return { pagina, limite, orden, direccion };
}

/**
 * Calcula el offset de Prisma a partir de los parámetros de paginación.
 */
export function calcularSkip(pagina: number, limite: number): number {
  return (pagina - 1) * limite;
}

/**
 * Construye el objeto ResultadoPaginado a partir de datos y conteo total.
 */
export function construirPaginacion<T>(
  datos: T[],
  total: number,
  pagina: number,
  limite: number
): ResultadoPaginado<T> {
  return {
    datos,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}

// ─────────────────────────────────────────────
// SLUGS
// ─────────────────────────────────────────────

/**
 * Genera un slug URL-friendly a partir de un texto.
 * Ejemplo: "Mi Tienda de Ropa" → "mi-tienda-de-ropa"
 */
export function generarSlug(texto: string): string {
  return slugify(texto, {
    lower: true,
    strict: true,     // Elimina caracteres especiales
    locale: "es",     // Maneja caracteres españoles como ñ, á, etc.
    trim: true,
  });
}

/**
 * Genera un slug único agregando un sufijo numérico aleatorio.
 * Se usa cuando el slug base ya existe en la DB.
 */
export function generarSlugUnico(texto: string): string {
  const base = generarSlug(texto);
  const sufijo = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
  return `${base}-${sufijo}`;
}

// ─────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────

/**
 * Verifica si una cadena es un color hexadecimal válido (#RRGGBB).
 */
export function esColorHexValido(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Verifica si un número es un entero positivo.
 */
export function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor > 0;
}

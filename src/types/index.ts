// Tipos y interfaces compartidas por toda la aplicación.
// Centralizar aquí evita duplicación y facilita cambios globales.
import { Request } from "express";
import { RolUsuario } from "@prisma/client";

// ─────────────────────────────────────────────
// PAYLOAD DEL JWT
// ─────────────────────────────────────────────

export interface JwtPayload {
  sub: number;        // ID del usuario (subject estándar de JWT)
  email: string;
  rol: RolUsuario;
  iat?: number;       // Issued at (lo agrega jsonwebtoken automáticamente)
  exp?: number;       // Expiration
}

// ─────────────────────────────────────────────
// REQUEST AUTENTICADO
// Extiende el Request de Express con el usuario decodificado del token
// ─────────────────────────────────────────────

export interface RequestAutenticado extends Request {
  usuario: JwtPayload;
}

// ─────────────────────────────────────────────
// RESPUESTA ESTÁNDAR DE LA API
// Todas las respuestas siguen este formato para consistencia
// ─────────────────────────────────────────────

export interface RespuestaApi<T = unknown> {
  ok: boolean;
  mensaje: string;
  datos?: T;
  errores?: string[];
}

// ─────────────────────────────────────────────
// PAGINACIÓN
// ─────────────────────────────────────────────

export interface ParametrosPaginacion {
  pagina: number;       // Página actual (base 1)
  limite: number;       // Resultados por página
  orden?: string;       // Campo por el cual ordenar
  direccion?: "asc" | "desc";
}

export interface ResultadoPaginado<T> {
  datos: T[];
  total: number;        // Total de registros sin paginar
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ─────────────────────────────────────────────
// ERROR DE APLICACIÓN
// Clase personalizada para errores con código HTTP
// ─────────────────────────────────────────────

// types/index.ts
export class ErrorApi extends Error {
  constructor(
    message: string,
    public codigoHttp: number = 500,
    public errores?: string[]  
  ) {
    super(message);
    this.name = 'ErrorApi';
  }
}

// ─────────────────────────────────────────────
// SECCIONES VISIBLES DE LA TIENDA
// Tipado del JSON que controla qué secciones muestra cada plantilla
// ─────────────────────────────────────────────

export interface SeccionesVisibles {
  navbar: boolean;
  hero: boolean;
  carrusel: boolean;
  galeria: boolean;
  productos: boolean;
  sobreNosotros: boolean;
  contacto: boolean;
  footer: boolean;
}

export const SECCIONES_VISIBLES_DEFAULT: SeccionesVisibles = {
  navbar: true,
  hero: true,
  carrusel: false,
  galeria: false,
  productos: true,
  sobreNosotros: false,
  contacto: true,
  footer: true,
};

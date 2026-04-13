import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ErrorApi } from "../types";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export function manejadorErrores(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction 
): void {
  // Log del error con detalles útiles para debugging
  if (err instanceof ZodError) {
    // Si es un ZodError, normalmente es un 400 Bad Request, nivel warn
    logger.warn(`[ZOD ERROR] ${req.method} ${req.path}`);
  } else if (err instanceof ErrorApi) {
    // Errores controlados de negocio
    logger.warn(`[API ERROR] ${err.codigoHttp} - ${req.method} ${req.path}: ${err.message}`);
  } else {
    // Errores inesperados, nivel error
    logger.error(`[UNHANDLED ERROR] ${req.method} ${req.path}`, err);
  }

  // Se produce cuando los datos del request no pasan la validación del schema
  if (err instanceof ZodError) {
    const errores = err.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    res.status(400).json({
      ok: false,
      mensaje: "Datos inválidos en la solicitud",
      errores,
    });
    return;
  }

 
  // Se produce cuando lanzamos ErrorApi desde services o controllers
  if (err instanceof ErrorApi) {
    res.status(err.codigoHttp).json({
      ok: false,
      mensaje: err.message,
      errores: err.errores,
    });
    return;
  }

  // ── Errores de Prisma ──
  // Detectamos errores de Prisma por su estructura en lugar de instanceof,
  // ya que el cliente puede no estar generado al momento de compilar.
  if (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const prismaErr = err as { code: string; meta?: Record<string, unknown> };

    // P2002: Violación de restricción UNIQUE
    if (prismaErr.code === "P2002") {
      const target = prismaErr.meta?.["target"];
      const campo = Array.isArray(target) ? target.join(", ") : "campo";
      res.status(409).json({ ok: false, mensaje: `Ya existe un registro con ese ${campo}` });
      return;
    }
    // P2025: Registro no encontrado
    if (prismaErr.code === "P2025") {
      res.status(404).json({ ok: false, mensaje: "Registro no encontrado" });
      return;
    }
    // P2003: Violación de clave foránea
    if (prismaErr.code === "P2003") {
      res.status(400).json({ ok: false, mensaje: "Referencia inválida: el registro relacionado no existe" });
      return;
    }
    // P2014: Restricción de relación (onDelete: Restrict)
    if (prismaErr.code === "P2014") {
      res.status(409).json({ ok: false, mensaje: "No se puede eliminar porque otros registros dependen de este" });
      return;
    }
  }

  // ── Error genérico de JavaScript ──
  // En desarrollo enviamos el stack trace para facilitar debugging
  if (err instanceof Error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
      ...(env.esDevelopment && { detalle: err.message, stack: err.stack }),
    });
    return;
  }

  // ── Fallback para errores desconocidos ──
  res.status(500).json({
    ok: false,
    mensaje: "Error interno del servidor",
  });
}

// Middleware para manejar rutas no encontradas (404)
export function noEncontrado(req: Request, res: Response): void {
  logger.warn(`[404] Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    ok: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
}


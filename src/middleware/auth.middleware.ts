// Middlewares de autenticación y autorización.
// Se usan en las rutas que requieren que el usuario esté logueado o tenga cierto rol.
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload, RequestAutenticado, ErrorApi } from "../types";
import { RolUsuario } from "@prisma/client";

/**
 * Verifica que el request tenga un JWT válido en el header Authorization.
 * Si es válido, adjunta el payload decodificado en req.usuario.
 *
 * Uso: router.get("/ruta-protegida", autenticar, controller)
 */
export function autenticar(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Extraemos el token del header "Authorization: Bearer <token>"
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ErrorApi("Token de autenticación no proporcionado", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ErrorApi("Token de autenticación mal formado", 401);
    }

    // Verificamos y decodificamos el token
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;

    // Adjuntamos el payload al request para que los siguientes middlewares lo usen
    (req as RequestAutenticado).usuario = payload;

    next();
  } catch (error) {
    // Convertimos errores específicos de JWT a mensajes descriptivos
    if (error instanceof jwt.TokenExpiredError) {
      next(new ErrorApi("El token ha expirado", 401));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ErrorApi("Token inválido", 401));
      return;
    }
    next(error);
  }
}

/**
 * Verifica si el request tiene un JWT válido en el header Authorization.
 * Si es válido, adjunta el payload decodificado en req.usuario.
 * A diferencia de autenticar, no lanza error si no hay token o es inválido,
 * permitiendo usuarios invitados.
 */
export function autenticarOpcional(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    (req as RequestAutenticado).usuario = payload;

    next();
  } catch (error) {
    // Silently ignore auth errors for optional endpoints
    next();
  }
}

/**
 * Fábrica de middleware de autorización por rol.
 * Verifica que el usuario autenticado tenga al menos uno de los roles permitidos.
 *
 * Uso: router.delete("/admin/ruta", autenticar, autorizar(RolUsuario.ADMIN), controller)
 *
 * @param rolesPermitidos - Uno o más roles que pueden acceder al recurso
 */
export function autorizar(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const usuario = (req as RequestAutenticado).usuario;

    // Este middleware debe usarse DESPUÉS de autenticar()
    if (!usuario) {
      next(new ErrorApi("No autenticado", 401));
      return;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      next(
        new ErrorApi(
          `Acceso denegado. Roles requeridos: ${rolesPermitidos.join(", ")}`,
          403
        )
      );
      return;
    }

    next();
  };
}

/**
 * Verifica que el usuario autenticado sea el dueño de un recurso.
 * El ID del propietario se pasa como argumento (obtenido del recurso en la DB).
 *
 * Uso: dentro de un controller, después de obtener el recurso de la DB.
 *
 * @param usuarioId - ID del propietario del recurso
 * @param rolExcepcion - Rol que puede bypasear la verificación (ej: ADMIN)
 */
export function verificarPropietario(
  req: Request,
  usuarioId: number,
  rolExcepcion: RolUsuario = RolUsuario.ADMIN
): boolean {
  const usuario = (req as RequestAutenticado).usuario;
  return usuario.sub === usuarioId || usuario.rol === rolExcepcion;
}

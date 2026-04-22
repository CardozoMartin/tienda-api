import { RolUsuario } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ErrorApi, RequestAutenticado } from '../types';


export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Extraemos el token del header "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ErrorApi('Token de autenticación no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ErrorApi('Token de autenticación mal formado', 401);
    }

    // Verificamos y decodificamos el token
    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    // Normalizamos el payload para clientes
    if (payload.tipo === 'cliente') {
      payload.sub = payload.id;
      payload.rol = 'CLIENT';
    }

    // Adjuntamos el payload al request para que los siguientes middlewares lo usen
    (req as RequestAutenticado).usuario = payload;

    next();
  } catch (error) {
    // Convertimos errores específicos de JWT a mensajes descriptivos
    if (error instanceof jwt.TokenExpiredError) {
      next(new ErrorApi('El token ha expirado', 401));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ErrorApi('Token inválido', 401));
      return;
    }
    next(error);
  }
}

export function autenticarCliente(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ErrorApi('Token de autenticación no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ErrorApi('Token de autenticación mal formado', 401);
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    // Validar que sea un token de cliente
    if (payload.tipo !== 'cliente') {
      throw new ErrorApi('Token no válido para este endpoint', 403);
    }

    (req as any).clienteAutenticado = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ErrorApi('El token ha expirado', 401));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ErrorApi('Token inválido', 401));
      return;
    }
    next(error);
  }
}

export function autenticarOpcional(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (payload.tipo === 'cliente') {
      payload.sub = payload.id;
      payload.rol = 'CLIENT';
    }

    (req as RequestAutenticado).usuario = payload;

    next();
  } catch (error) {
    // Ignoramos errores para permitir invitados, pero limpiamos req.usuario si el token era inválido
    (req as any).usuario = undefined;
    next();
  }
}

export function autorizar(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const usuario = (req as RequestAutenticado).usuario;

    // Este middleware debe usarse DESPUÉS de autenticar()
    if (!usuario) {
      next(new ErrorApi('No autenticado', 401));
      return;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      next(new ErrorApi(`Acceso denegado. Roles requeridos: ${rolesPermitidos.join(', ')}`, 403));
      return;
    }

    next();
  };
}

export function verificarPropietario(
  req: Request,
  usuarioId: number,
  rolExcepcion: RolUsuario = RolUsuario.ADMIN
): boolean {
  const usuario = (req as RequestAutenticado).usuario;
  return usuario.sub === usuarioId || usuario.rol === rolExcepcion;
}

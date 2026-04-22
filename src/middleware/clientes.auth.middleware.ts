
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorApi } from '../types';

export interface ClienteAuthPayload {
  id: number;
  email: string;
  tiendaId: number;
  tipo: 'cliente';
}

// Extendemos el tipo Request para adjuntar el cliente autenticado
export interface RequestConCliente extends Request {
  clienteAuth?: ClienteAuthPayload;
}


export function autenticarCliente(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ErrorApi('Debés iniciar sesión para dejar una reseña', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ErrorApi('Token de autenticación mal formado', 401);
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const payload = jwt.verify(token, secret) as unknown as ClienteAuthPayload;

    // Validamos que sea un token de cliente (no de owner/admin)
    if (payload.tipo !== 'cliente') {
      throw new ErrorApi('Solo los clientes pueden dejar reseñas', 403);
    }

    (req as RequestConCliente).clienteAuth = payload;
    next();
  } catch (error) {
    if (error instanceof ErrorApi) {
      next(error);
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new ErrorApi('Tu sesión expiró. Volvé a iniciar sesión', 401));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ErrorApi('Token inválido', 401));
      return;
    }
    next(error);
  }
}

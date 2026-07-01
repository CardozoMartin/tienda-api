import { Request, Response, NextFunction } from 'express';
import { CuponesService } from './cupones.service';
import { responderOk } from '../../utils/helpers';
import { RequestAutenticado } from '../../types';

const service = new CuponesService();

export class CuponesController {
  // ── Owner ──
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const cupones = await service.listar(usuarioId);
      responderOk(res, cupones, 'Cupones obtenidos');
    } catch (e) { next(e); }
  };

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const cupon = await service.crear(usuarioId, req.body);
      responderOk(res, cupon, 'Cupón creado', 201);
    } catch (e) { next(e); }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const cuponId = parseInt(req.params['cuponId'] as string, 10);
      const cupon = await service.actualizar(usuarioId, cuponId, req.body);
      responderOk(res, cupon, 'Cupón actualizado');
    } catch (e) { next(e); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const cuponId = parseInt(req.params['cuponId'] as string, 10);
      await service.eliminar(usuarioId, cuponId);
      responderOk(res, null, 'Cupón eliminado');
    } catch (e) { next(e); }
  };

  // ── Público: validar código ──
  validar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const { codigo, subtotal } = req.body as { codigo: string; subtotal: number };
      if (!codigo) throw new Error('Falta el código del cupón');
      const resultado = await service.validar(tiendaId, codigo, Number(subtotal) || 0);
      responderOk(res, resultado, 'Cupón válido');
    } catch (e) { next(e); }
  };
}

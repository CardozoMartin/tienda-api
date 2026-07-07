import { Request, Response, NextFunction } from 'express';
import { PromocionesService } from './promociones.service';
import { responderOk } from '../../utils/helpers';
import { RequestAutenticado } from '../../types';

const service = new PromocionesService();

export class PromocionesController {
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const promos = await service.listar(usuarioId);
      responderOk(res, promos, 'Promociones obtenidas');
    } catch (e) { next(e); }
  };

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const promo = await service.crear(usuarioId, req.body);
      responderOk(res, promo, 'Promoción creada', 201);
    } catch (e) { next(e); }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const promocionId = parseInt(req.params['promocionId'] as string, 10);
      const promo = await service.actualizar(usuarioId, promocionId, req.body);
      responderOk(res, promo, 'Promoción actualizada');
    } catch (e) { next(e); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const promocionId = parseInt(req.params['promocionId'] as string, 10);
      await service.eliminar(usuarioId, promocionId);
      responderOk(res, null, 'Promoción eliminada');
    } catch (e) { next(e); }
  };

  // ── Público (storefront) ──
  listarNav = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const promos = await service.listarPublicasNav(tiendaId);
      responderOk(res, promos, 'Promociones activas');
    } catch (e) { next(e); }
  };

  obtenerPorSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const slug = req.params['slug'] as string;
      const promo = await service.obtenerPublicaPorSlug(tiendaId, slug);
      responderOk(res, promo, 'Promoción obtenida');
    } catch (e) { next(e); }
  };
}

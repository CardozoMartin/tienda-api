import { NextFunction, Request, Response } from 'express';
import { responderOk } from '../../utils/helpers';
import { RequestAutenticado } from '../../types';
import { GuiasTallesService } from './guias-talles.service';

const service = new GuiasTallesService();

export class GuiasTallesController {
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const guias = await service.listar(usuarioId);
      responderOk(res, guias, 'Guías de talles obtenidas');
    } catch (e) { next(e); }
  };

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const guia = await service.crear(usuarioId, req.body);
      responderOk(res, guia, 'Guía de talles creada', 201);
    } catch (e) { next(e); }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const guiaId = parseInt(req.params['guiaId'] as string, 10);
      const guia = await service.actualizar(usuarioId, guiaId, req.body);
      responderOk(res, guia, 'Guía de talles actualizada');
    } catch (e) { next(e); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const guiaId = parseInt(req.params['guiaId'] as string, 10);
      await service.eliminar(usuarioId, guiaId);
      responderOk(res, null, 'Guía de talles eliminada');
    } catch (e) { next(e); }
  };
}

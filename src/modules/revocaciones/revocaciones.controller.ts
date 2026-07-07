import { NextFunction, Request, Response } from 'express';
import { responderOk } from '../../utils/helpers';
import { RequestAutenticado } from '../../types';
import { RevocacionesService } from './revocaciones.service';

const service = new RevocacionesService();

export class RevocacionesController {
  // ── Público: crear solicitud desde la tienda (sin login) ──
  crearPublica = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const constancia = await service.crearPublica(tiendaId, req.body);
      responderOk(
        res,
        constancia,
        'Solicitud registrada. Guardá tu código de constancia.',
        201
      );
    } catch (e) { next(e); }
  };

  // ── Owner: gestión ──
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const solicitudes = await service.listar(usuarioId);
      responderOk(res, solicitudes, 'Solicitudes obtenidas');
    } catch (e) { next(e); }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const id = parseInt(req.params['id'] as string, 10);
      const solicitud = await service.actualizar(usuarioId, id, req.body);
      responderOk(res, solicitud, 'Solicitud actualizada');
    } catch (e) { next(e); }
  };
}

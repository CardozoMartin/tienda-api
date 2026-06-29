import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { responderOk } from '../../utils/helpers';
import { RequestAutenticado } from '../../types';

const service = new AnalyticsService();

export class AnalyticsController {
  resumen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const dias = Math.min(365, Math.max(7, Number(req.query.dias) || 30));
      const data = await service.resumen(usuarioId, dias);
      responderOk(res, data, 'Estadísticas obtenidas');
    } catch (error) {
      next(error);
    }
  };
}

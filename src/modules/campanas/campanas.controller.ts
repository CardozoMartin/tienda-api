import { NextFunction, Request, Response } from 'express';
import { RequestAutenticado } from '../../types';
import { responderOk } from '../../utils/helpers';
import { CampanasService } from './campanas.service';
import { CrearCampanaDto } from './campanas.dto';

export class CampanasController {
  private service = new CampanasService();

  // GET /campanas/destinatarios — conteo por segmento (para el compositor)
  destinatarios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const data = await this.service.previewDestinatarios(usuarioId);
      responderOk(res, data, 'Conteo de destinatarios obtenido');
    } catch (error) {
      next(error);
    }
  };

  // GET /campanas — lista de campañas de la tienda
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const data = await this.service.listar(usuarioId);
      responderOk(res, data, 'Campañas obtenidas');
    } catch (error) {
      next(error);
    }
  };

  // GET /campanas/:id — detalle de una campaña
  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const id = parseInt(req.params['id'] as string, 10);
      const data = await this.service.obtener(usuarioId, id);
      responderOk(res, data, 'Campaña obtenida');
    } catch (error) {
      next(error);
    }
  };

  // POST /campanas — crear campaña (borrador)
  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const data = await this.service.crear(usuarioId, req.body as CrearCampanaDto);
      responderOk(res, data, 'Campaña creada', 201);
    } catch (error) {
      next(error);
    }
  };

  // POST /campanas/:id/enviar — encola el envío
  enviar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const id = parseInt(req.params['id'] as string, 10);
      const data = await this.service.enviar(usuarioId, id);
      responderOk(res, data, 'Campaña encolada');
    } catch (error) {
      next(error);
    }
  };
}

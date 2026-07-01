import { NextFunction, Request, Response } from 'express';
import { RequestAutenticado } from '../../types';
import { responderOk } from '../../utils/helpers';
import { PopupsService } from './popups.service';
import { CrearPopupDto, ActualizarPopupDto } from './popups.dto';

export class PopupsController {
  private service = new PopupsService();

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const popups = await this.service.listar(usuarioId);
      responderOk(res, popups);
    } catch (e) { next(e); }
  };

  // Público: devuelve el popup activo de una tienda para el storefront
  obtenerActivo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = Number(req.params.tiendaId);
      const popup = await this.service.obtenerActivo(tiendaId);
      responderOk(res, popup ?? null);
    } catch (e) { next(e); }
  };

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const popup = await this.service.crear(usuarioId, req.body as CrearPopupDto);
      responderOk(res, popup, 'Popup creado', 201);
    } catch (e) { next(e); }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const popupId = Number(req.params.popupId);
      const popup = await this.service.actualizar(usuarioId, popupId, req.body as ActualizarPopupDto);
      responderOk(res, popup);
    } catch (e) { next(e); }
  };

  subirImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const popupId = Number(req.params.popupId);
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw new Error('No se recibió ningún archivo');
      const popup = await this.service.subirImagen(usuarioId, popupId, file);
      responderOk(res, popup);
    } catch (e) { next(e); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const popupId = Number(req.params.popupId);
      await this.service.eliminar(usuarioId, popupId);
      responderOk(res, null, 'Popup eliminado');
    } catch (e) { next(e); }
  };
}

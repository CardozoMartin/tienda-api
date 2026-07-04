import { NextFunction, Request, Response } from 'express';
import { TipoPaginaLegal } from '@prisma/client';
import { responderOk } from '../../utils/helpers';
import { ErrorApi, RequestAutenticado } from '../../types';
import { LegalService } from './legal.service';

const service = new LegalService();

const TIPOS_VALIDOS: TipoPaginaLegal[] = ['TERMINOS', 'PRIVACIDAD', 'CAMBIOS'];

function parseTipo(raw: string): TipoPaginaLegal {
  const tipo = raw?.toUpperCase() as TipoPaginaLegal;
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ErrorApi('Tipo de página legal inválido', 400);
  }
  return tipo;
}

export class LegalController {
  // ── Owner ──
  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tipo = parseTipo(req.params['tipo'] as string);
      const pagina = await service.obtenerParaOwner(usuarioId, tipo);
      responderOk(res, pagina, 'Página legal obtenida');
    } catch (e) { next(e); }
  };

  guardar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tipo = parseTipo(req.params['tipo'] as string);
      const pagina = await service.guardar(usuarioId, tipo, req.body);
      responderOk(res, pagina, 'Página legal guardada');
    } catch (e) { next(e); }
  };

  // ── Público ──
  obtenerPublica = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const tipo = parseTipo(req.params['tipo'] as string);
      const pagina = await service.obtenerPublica(tiendaId, tipo);
      responderOk(res, pagina, 'Página legal obtenida');
    } catch (e) { next(e); }
  };

  listarActivasPublicas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const paginas = await service.listarActivasPublicas(tiendaId);
      responderOk(res, paginas, 'Páginas legales obtenidas');
    } catch (e) { next(e); }
  };
}

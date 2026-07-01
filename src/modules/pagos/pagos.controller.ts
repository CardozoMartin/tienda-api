import { NextFunction, Request, Response } from 'express';
import { responderOk } from '../../utils/helpers';
import { RequestAutenticado } from '../../types';
import { PagosService } from './pagos.service';

export class PagosController {
  private service = new PagosService();

  crearPreferencia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pedidoId = Number(req.params['pedidoId']);
      const tiendaId = Number(req.params['tiendaId']);
      const resultado = await this.service.crearPreferencia(pedidoId, tiendaId);
      responderOk(res, resultado, 'Preferencia creada');
    } catch (e) { next(e); }
  };

  webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.service.procesarWebhook(req.body, req.query);
      res.status(200).json({ ok: true, ...resultado });
    } catch (e) { next(e); }
  };

  // ── Dashboard: test de conexión con las credenciales guardadas ──
  testConexion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await import('../../config/prisma').then(m =>
        m.prisma.tienda.findUnique({ where: { usuarioId }, select: { id: true } })
      );
      if (!tienda) { res.status(404).json({ ok: false, error: 'Tienda no encontrada' }); return; }
      const resultado = await this.service.testConexionMp(tienda.id);
      responderOk(res, resultado, resultado.ok ? 'Conexión exitosa' : 'Error de conexión');
    } catch (e) { next(e); }
  };

  // ── Dashboard: desconectar / borrar credenciales MP ──
  desconectarMp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await import('../../config/prisma').then(m =>
        m.prisma.tienda.findUnique({ where: { usuarioId }, select: { id: true } })
      );
      if (!tienda) { res.status(404).json({ ok: false, error: 'Tienda no encontrada' }); return; }
      const resultado = await this.service.desconectarMp(tienda.id);
      responderOk(res, resultado, 'Mercado Pago desconectado');
    } catch (e) { next(e); }
  };

  // ── Dashboard: resumen del estado de configuración MP ──
  resumenMp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await import('../../config/prisma').then(m =>
        m.prisma.tienda.findUnique({ where: { usuarioId }, select: { id: true } })
      );
      if (!tienda) { res.status(404).json({ ok: false, error: 'Tienda no encontrada' }); return; }
      const resultado = await this.service.getResumenMp(tienda.id);
      responderOk(res, resultado, 'Resumen MP obtenido');
    } catch (e) { next(e); }
  };
}

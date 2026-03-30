import { NextFunction, Request, Response } from 'express';
import { PedidosService } from './pedidos.service';
import { responderOk, responderPaginado } from '../../utils/helpers';
import { CrearPedidoDto, ActualizarEstadoPedidoDto, FiltrosPedidosDto } from './pedidos.dto';

export class PedidosController {
  private service: PedidosService;

  constructor() {
    this.service = new PedidosService();
  }

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tiendaId } = req.params as { tiendaId: string };
      const sessionId = req.headers['x-session-id'] as string;
      const clienteId = (req as any).usuario?.sub; // Si está autenticado
      
      if (!sessionId) {
        throw new Error('El header x-session-id es requerido');
      }

      const pedido = await this.service.crear(
        parseInt(tiendaId, 10),
        sessionId,
        req.body as CrearPedidoDto,
        clienteId ? parseInt(clienteId, 10) : undefined
      );

      responderOk(res, pedido, 'Pedido creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  obtenerPorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const pedido = await this.service.obtenerPorId(parseInt(id, 10));
      responderOk(res, pedido, 'Pedido obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filtros = req.query as unknown as FiltrosPedidosDto;
      const resultado = await this.service.listar(filtros);
      
      const { datos, total } = resultado;
      const pagina = Number(filtros.pagina || 1);
      const limite = Number(filtros.limite || 10);
      const totalPaginas = Math.ceil(total / limite);

      responderPaginado(res, {
        datos,
        total,
        pagina,
        limite,
        totalPaginas
      } as any, 'Pedidos listados exitosamente');
    } catch (error) {
      next(error);
    }
  };

  actualizarEstado = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const pedido = await this.service.actualizarEstado(parseInt(id, 10), req.body as ActualizarEstadoPedidoDto);
      responderOk(res, pedido, 'Estado del pedido actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  };
}

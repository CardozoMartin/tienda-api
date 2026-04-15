import { NextFunction, Request, Response } from "express";
import { ResenasService } from "./resenas.service";
import { CrearResenaDto, CrearResenaSchema, FiltrosResenasDto, ResponderResenaDto } from "./resentas.dto";
import { responderOk, responderPaginado } from "@/utils/helpers";
import { RequestConCliente } from "@/middleware/clientes.auth.middleware";
import { ErrorApi } from "@/types";

export class ResenasController {
  private service: ResenasService;

  constructor() {
    this.service = new ResenasService();
  }

  //controlador para listar las reseñas de una tienda con filtros y paginación. No requiere autenticación, pero solo muestra reseñas aprobadas
  listarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const filtros = req.query as unknown as FiltrosResenasDto;
      const resultado = await this.service.listarResenasTienda(tiendaId, filtros);
      responderPaginado(res, resultado);
    } catch (e) {
      next(e);
    }
  };

  //controlador para obtener las estadísticas de reseñas de una tienda (promedio, total y distribución). No requiere autenticación
  estadisticasTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const stats = await this.service.estadisticasTienda(tiendaId);
      responderOk(res, stats);
    } catch (e) {
      next(e);
    }
  };

  // Solo clientes autenticados pueden crear reseñas de tienda
  crearTienda = async (req: RequestConCliente, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const cliente = req.clienteAuth!;
      const autorNombre = `${req.body.autorNombre || 'Cliente'}`;
      const resena = await this.service.crearResenaTienda(
        tiendaId,
        req.body as CrearResenaDto,
        cliente.id,
        autorNombre
      );
      responderOk(res, resena, 'Reseña enviada. Será publicada una vez aprobada.', 201);
    } catch (e) {
      next(e);
    }
  };

  //controladores para listar, aprobar, rechazar, responder y eliminar reseñas de tienda. Solo el owner de la tienda puede acceder a estos controladores

  pendientesTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const pendientes = await this.service.pendientesTienda(tiendaId);
      responderOk(res, pendientes);
    } catch (e) {
      next(e);
    }
  };

  aprobarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.aprobarResenaTienda(parseInt(req.params['resenaId'] as string, 10));
      responderOk(res, null, 'Reseña aprobada');
    } catch (e) {
      next(e);
    }
  };

  rechazarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.rechazarResenaTienda(parseInt(req.params['resenaId'] as string, 10));
      responderOk(res, null, 'Reseña rechazada');
    } catch (e) {
      next(e);
    }
  };

  responderTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resenaId = parseInt(req.params['resenaId'] as string, 10);
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const { respuesta } = req.body as ResponderResenaDto;
      await this.service.responderResenaTienda(resenaId, respuesta, tiendaId);
      responderOk(res, null, 'Respuesta publicada');
    } catch (e) {
      next(e);
    }
  };

  eliminarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarResenaTienda(parseInt(req.params['resenaId'] as string, 10));
      responderOk(res, null, 'Reseña eliminada');
    } catch (e) {
      next(e);
    }
  };

  //controladores para listar, crear, aprobar, rechazar, responder y eliminar reseñas de productos. Solo el owner de la tienda puede aprobar, rechazar, responder y eliminar reseñas de productos. Cualquier cliente puede listar las reseñas aprobadas y crear una reseña si esta autenticado (con imagen opcional)

  listarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const filtros = req.query as unknown as FiltrosResenasDto;
      const resultado = await this.service.listarResenasProducto(productoId, filtros);
      responderPaginado(res, resultado);
    } catch (e) {
      next(e);
    }
  };

  estadisticasProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const stats = await this.service.estadisticasProducto(productoId);
      responderOk(res, stats);
    } catch (e) {
      next(e);
    }
  };

  // Solo clientes autenticados pueden crear reseñas de producto (con imagen opcional)
  crearProducto = async (req: RequestConCliente, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const cliente = req.clienteAuth!;

      // Parseamos calificacion del body (puede venir como string en multipart)
      const calificacion = parseInt(req.body.calificacion as string, 10);
      const comentario = req.body.comentario as string | undefined;

      const dto: CrearResenaDto = { calificacion, comentario };

      // Validamos manualmente el DTO
      const parsed = CrearResenaSchema.safeParse(dto);
      if (!parsed.success) {
        throw new ErrorApi(parsed.error.errors.map((e) => e.message).join(', '), 400);
      }

      const archivo = (req as any).file as Express.Multer.File | undefined;
      const autorNombre = cliente.email.split('@')[0]; // Usamos parte del email como nombre

      const resena = await this.service.crearResenaProducto(
        productoId,
        parsed.data,
        cliente.id,
        autorNombre,
        archivo?.buffer,
        archivo?.mimetype
      );
      responderOk(res, resena, 'Reseña enviada. Será publicada una vez aprobada.', 201);
    } catch (e) {
      next(e);
    }
  };

  //controlador para listar las reseñas pendientes de aprobación de los productos de una tienda. Solo el owner de la tienda puede acceder a este controlador

  pendientesProductos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const pendientes = await this.service.pendientesProductos(tiendaId);
      responderOk(res, pendientes);
    } catch (e) {
      next(e);
    }
  };

  aprobarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.aprobarResenaProducto(parseInt(req.params['resenaId'] as string, 10));
      responderOk(res, null, 'Reseña aprobada');
    } catch (e) {
      next(e);
    }
  };

  rechazarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.rechazarResenaProducto(parseInt(req.params['resenaId'] as string, 10));
      responderOk(res, null, 'Reseña rechazada');
    } catch (e) {
      next(e);
    }
  };

  responderProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resenaId = parseInt(req.params['resenaId'] as string, 10);
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const { respuesta } = req.body as ResponderResenaDto;
      await this.service.responderResenaProducto(resenaId, respuesta, productoId);
      responderOk(res, null, 'Respuesta publicada');
    } catch (e) {
      next(e);
    }
  };

  eliminarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarResenaProducto(parseInt(req.params['resenaId'] as string, 10));
      responderOk(res, null, 'Reseña eliminada');
    } catch (e) {
      next(e);
    }
  };
}

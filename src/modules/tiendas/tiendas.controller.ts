// Controller de tiendas.
import { Request, Response, NextFunction } from "express";
import { TiendasService } from "./tiendas.service";
import { responderOk, responderPaginado } from "../../utils/helpers";
import { RequestAutenticado } from "../../types";
import {
  CrearTiendaDto,
  ActualizarTiendaDto,
  ActualizarTemaDto,
  AgregarMetodoPagoDto,
  AgregarMetodoEntregaDto,
  AgregarImagenCarruselDto,
  FiltrosTiendasDto,
} from "./tiendas.dto";

export class TiendasController {
  private service: TiendasService;

  constructor() {
    this.service = new TiendasService();
  }

  /**
   * GET /tiendas
   * Lista tiendas públicas con filtros y paginación.
   */
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filtros = req.query as unknown as FiltrosTiendasDto;
      const resultado = await this.service.listar(filtros);
      responderPaginado(res, resultado, "Tiendas obtenidas exitosamente");
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /tiendas/:slug
   * Vista pública de una tienda por su slug.
   */
  obtenerPorSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params as { slug: string };
      const tienda = await this.service.obtenerPorSlug(slug);
      responderOk(res, tienda, "Tienda obtenida exitosamente");
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /tiendas/mi-tienda
   * Obtiene la tienda del usuario autenticado (panel owner).
   */
  obtenerMiTienda = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await this.service.obtenerMiTienda(usuarioId);
      responderOk(res, tienda, "Tienda obtenida exitosamente");
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /tiendas
   * Crea una nueva tienda para el usuario autenticado.
   */
  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await this.service.crear(usuarioId, req.body as CrearTiendaDto);
      responderOk(res, tienda, "Tienda creada exitosamente", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /tiendas/mi-tienda
   * Actualiza los datos de la tienda del usuario autenticado.
   */
  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await this.service.actualizar(usuarioId, req.body as ActualizarTiendaDto);
      responderOk(res, tienda, "Tienda actualizada exitosamente");
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /tiendas/mi-tienda/tema
   * Actualiza la apariencia visual de la tienda.
   */
  actualizarTema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tema = await this.service.actualizarTema(usuarioId, req.body as ActualizarTemaDto);
      responderOk(res, tema, "Tema actualizado exitosamente");
    } catch (error) {
      next(error);
    }
  };

  // ── Métodos de pago ──

  /**
   * POST /tiendas/mi-tienda/metodos-pago
   */
  agregarMetodoPago = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.agregarMetodoPago(usuarioId, req.body as AgregarMetodoPagoDto);
      responderOk(res, resultado, "Método de pago agregado", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /tiendas/mi-tienda/metodos-pago/:metodoPagoId
   */
  eliminarMetodoPago = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const metodoPagoId = parseInt(req.params["metodoPagoId"] as string, 10);
      await this.service.eliminarMetodoPago(usuarioId, metodoPagoId);
      responderOk(res, null, "Método de pago eliminado");
    } catch (error) {
      next(error);
    }
  };

  // ── Métodos de entrega ──

  /**
   * POST /tiendas/mi-tienda/metodos-entrega
   */
  agregarMetodoEntrega = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.agregarMetodoEntrega(usuarioId, req.body as AgregarMetodoEntregaDto);
      responderOk(res, resultado, "Método de entrega agregado", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /tiendas/mi-tienda/metodos-entrega/:metodoEntregaId
   */
  eliminarMetodoEntrega = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const metodoEntregaId = parseInt(req.params["metodoEntregaId"] as string, 10);
      await this.service.eliminarMetodoEntrega(usuarioId, metodoEntregaId);
      responderOk(res, null, "Método de entrega eliminado");
    } catch (error) {
      next(error);
    }
  };

  // ── Carrusel ──

  /**
   * POST /tiendas/mi-tienda/carrusel
   */
  agregarImagenCarrusel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const imagen = await this.service.agregarImagenCarrusel(usuarioId, req.body as AgregarImagenCarruselDto);
      responderOk(res, imagen, "Imagen agregada al carrusel", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /tiendas/mi-tienda/carrusel/:imagenId
   */
  eliminarImagenCarrusel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const imagenId = parseInt(req.params["imagenId"] as string, 10);
      await this.service.eliminarImagenCarrusel(usuarioId, imagenId);
      responderOk(res, null, "Imagen eliminada del carrusel");
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /tiendas/mi-tienda/carrusel/reordenar
   * Body: [{ id: 1, orden: 0 }, { id: 2, orden: 1 }]
   */
  reordenarCarrusel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const orden = req.body as Array<{ id: number; orden: number }>;
      await this.service.reordenarCarrusel(usuarioId, orden);
      responderOk(res, null, "Orden del carrusel actualizado");
    } catch (error) {
      next(error);
    }
  };
}

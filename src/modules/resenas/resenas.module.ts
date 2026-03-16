// ═══════════════════════════════════════════════════
// MÓDULO DE RESEÑAS COMPLETO
// Maneja reseñas tanto de tiendas como de productos.
// ═══════════════════════════════════════════════════

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { ErrorApi, RequestAutenticado } from "../../types";
import { autenticar, autorizar } from "../../middleware/auth.middleware";
import { validar } from "../../middleware/validar.middleware";
import { RolUsuario } from "@prisma/client";
import { responderOk, responderPaginado, calcularSkip, construirPaginacion } from "../../utils/helpers";

// ─────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────

export const CrearResenaSchema = z.object({
  calificacion: z
    .number({ required_error: "La calificación es requerida" })
    .int()
    .min(1, "La calificación mínima es 1")
    .max(5, "La calificación máxima es 5"),
  comentario: z.string().max(2000).trim().optional(),
  // Nombre del autor para reseñas anónimas (cuando no hay sesión)
  autorNombre: z.string().max(100).trim().optional(),
});

export type CrearResenaDto = z.infer<typeof CrearResenaSchema>;

export const ResponderResenaSchema = z.object({
  respuesta: z
    .string({ required_error: "La respuesta es requerida" })
    .min(5, "La respuesta debe tener al menos 5 caracteres")
    .max(2000)
    .trim(),
});

export type ResponderResenaDto = z.infer<typeof ResponderResenaSchema>;

export const FiltrosResenasSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(10),
  soloAprobadas: z.coerce.boolean().default(true),
  calificacionMin: z.coerce.number().int().min(1).max(5).optional(),
  orden: z.enum(["creadoEn", "calificacion"]).default("creadoEn"),
  direccion: z.enum(["asc", "desc"]).default("desc"),
});

export type FiltrosResenasDto = z.infer<typeof FiltrosResenasSchema>;

// ─────────────────────────────────────────────
// REPOSITORY
// ─────────────────────────────────────────────

class ResenasRepository {
  // ── Reseñas de Tienda ──

  async crearResenaTienda(datos: {
    tiendaId: number;
    usuarioId?: number;
    autorNombre?: string;
    calificacion: number;
    comentario?: string;
  }) {
    return prisma.resenaTienda.create({ data: datos });
  }

  async listarResenasTienda(
    tiendaId: number,
    filtros: FiltrosResenasDto
  ) {
    const where: Prisma.ResenaTiendaWhereInput = {
      tiendaId,
      eliminada: false,
      ...(filtros.soloAprobadas && { aprobada: true }),
      ...(filtros.calificacionMin && { calificacion: { gte: filtros.calificacionMin } }),
    };

    const [datos, total] = await prisma.$transaction([
      prisma.resenaTienda.findMany({
        where,
        skip: calcularSkip(filtros.pagina, filtros.limite),
        take: filtros.limite,
        orderBy: { [filtros.orden]: filtros.direccion },
        include: {
          usuario: { select: { id: true, nombre: true, avatarUrl: true } },
        },
      }),
      prisma.resenaTienda.count({ where }),
    ]);

    return { datos, total };
  }

  async obtenerEstadisticasTienda(tiendaId: number) {
    // Obtenemos el promedio y conteo de reseñas aprobadas en una sola query
    const resultado = await prisma.resenaTienda.aggregate({
      where: { tiendaId, aprobada: true, eliminada: false },
      _avg: { calificacion: true },
      _count: { calificacion: true },
    });

    // Distribución por calificación (cuántas 1★, 2★, etc.)
    const distribucion = await prisma.resenaTienda.groupBy({
      by: ["calificacion"],
      where: { tiendaId, aprobada: true, eliminada: false },
      _count: { calificacion: true },
      orderBy: { calificacion: "asc" },
    });

    return {
      promedio: resultado._avg.calificacion
        ? parseFloat(resultado._avg.calificacion.toFixed(1))
        : 0,
      total: resultado._count.calificacion,
      distribucion: distribucion.map((d) => ({
        calificacion: d.calificacion,
        cantidad: d._count.calificacion,
      })),
    };
  }

  async aprobarResenaTienda(resenaId: number): Promise<void> {
    await prisma.resenaTienda.update({
      where: { id: resenaId },
      data: { aprobada: true, eliminada: false },
    });
  }

  async rechazarResenaTienda(resenaId: number): Promise<void> {
    await prisma.resenaTienda.update({
      where: { id: resenaId },
      data: { eliminada: true, aprobada: false },
    });
  }

  async responderResenaTienda(
    resenaId: number,
    respuesta: string,
    tiendaId: number
  ): Promise<void> {
    // Verificamos que la reseña pertenezca a la tienda antes de responder
    await prisma.resenaTienda.updateMany({
      where: { id: resenaId, tiendaId },
      data: { respuesta, respuestaEn: new Date() },
    });
  }

  async eliminarResenaTienda(resenaId: number): Promise<void> {
    // Soft delete: marcamos como eliminada, no borramos de la DB
    await prisma.resenaTienda.update({
      where: { id: resenaId },
      data: { eliminada: true },
    });
  }

  async listarPendientesTienda(tiendaId: number) {
    return prisma.resenaTienda.findMany({
      where: { tiendaId, aprobada: false, eliminada: false },
      orderBy: { creadoEn: "asc" },
      include: {
        usuario: { select: { id: true, nombre: true, avatarUrl: true } },
      },
    });
  }

  // ── Reseñas de Producto ──

  async crearResenaProducto(datos: {
    productoId: number;
    usuarioId?: number;
    autorNombre?: string;
    calificacion: number;
    comentario?: string;
  }) {
    return prisma.resenaProducto.create({ data: datos });
  }

  async listarResenasProducto(
    productoId: number,
    filtros: FiltrosResenasDto
  ) {
    const where: Prisma.ResenaProductoWhereInput = {
      productoId,
      eliminada: false,
      ...(filtros.soloAprobadas && { aprobada: true }),
      ...(filtros.calificacionMin && { calificacion: { gte: filtros.calificacionMin } }),
    };

    const [datos, total] = await prisma.$transaction([
      prisma.resenaProducto.findMany({
        where,
        skip: calcularSkip(filtros.pagina, filtros.limite),
        take: filtros.limite,
        orderBy: { [filtros.orden]: filtros.direccion },
        include: {
          usuario: { select: { id: true, nombre: true, avatarUrl: true } },
        },
      }),
      prisma.resenaProducto.count({ where }),
    ]);

    return { datos, total };
  }

  async obtenerEstadisticasProducto(productoId: number) {
    const resultado = await prisma.resenaProducto.aggregate({
      where: { productoId, aprobada: true, eliminada: false },
      _avg: { calificacion: true },
      _count: { calificacion: true },
    });

    const distribucion = await prisma.resenaProducto.groupBy({
      by: ["calificacion"],
      where: { productoId, aprobada: true, eliminada: false },
      _count: { calificacion: true },
      orderBy: { calificacion: "asc" },
    });

    return {
      promedio: resultado._avg.calificacion
        ? parseFloat(resultado._avg.calificacion.toFixed(1))
        : 0,
      total: resultado._count.calificacion,
      distribucion: distribucion.map((d) => ({
        calificacion: d.calificacion,
        cantidad: d._count.calificacion,
      })),
    };
  }

  async aprobarResenaProducto(resenaId: number): Promise<void> {
    await prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { aprobada: true, eliminada: false },
    });
  }

  async rechazarResenaProducto(resenaId: number): Promise<void> {
    await prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { eliminada: true, aprobada: false },
    });
  }

  async responderResenaProducto(
    resenaId: number,
    respuesta: string,
    productoId: number
  ): Promise<void> {
    await prisma.resenaProducto.updateMany({
      where: { id: resenaId, productoId },
      data: { respuesta, respuestaEn: new Date() },
    });
  }

  async eliminarResenaProducto(resenaId: number): Promise<void> {
    await prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { eliminada: true },
    });
  }

  async listarPendientesProductos(tiendaId: number) {
    // Buscamos reseñas pendientes de todos los productos de la tienda
    return prisma.resenaProducto.findMany({
      where: {
        aprobada: false,
        eliminada: false,
        producto: { tiendaId },
      },
      orderBy: { creadoEn: "asc" },
      include: {
        producto: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true, avatarUrl: true } },
      },
    });
  }
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

class ResenasService {
  private repository: ResenasRepository;

  constructor() {
    this.repository = new ResenasRepository();
  }

  // ── Tienda ──

  async crearResenaTienda(
    tiendaId: number,
    datos: CrearResenaDto,
    usuarioId?: number
  ) {
    // Si no hay usuario autenticado, el autorNombre es requerido
    if (!usuarioId && !datos.autorNombre) {
      throw new ErrorApi(
        "El nombre del autor es requerido para reseñas anónimas",
        400
      );
    }
    return this.repository.crearResenaTienda({
      tiendaId,
      usuarioId,
      autorNombre: datos.autorNombre,
      calificacion: datos.calificacion,
      comentario: datos.comentario,
    });
  }

  async listarResenasTienda(tiendaId: number, filtros: FiltrosResenasDto) {
    const { datos, total } = await this.repository.listarResenasTienda(tiendaId, filtros);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  async estadisticasTienda(tiendaId: number) {
    return this.repository.obtenerEstadisticasTienda(tiendaId);
  }

  async pendientesTienda(tiendaId: number) {
    return this.repository.listarPendientesTienda(tiendaId);
  }

  async aprobarResenaTienda(resenaId: number) {
    await this.repository.aprobarResenaTienda(resenaId);
  }

  async rechazarResenaTienda(resenaId: number) {
    await this.repository.rechazarResenaTienda(resenaId);
  }

  async responderResenaTienda(
    resenaId: number,
    respuesta: string,
    tiendaId: number
  ) {
    await this.repository.responderResenaTienda(resenaId, respuesta, tiendaId);
  }

  async eliminarResenaTienda(resenaId: number) {
    await this.repository.eliminarResenaTienda(resenaId);
  }

  // ── Producto ──

  async crearResenaProducto(
    productoId: number,
    datos: CrearResenaDto,
    usuarioId?: number
  ) {
    if (!usuarioId && !datos.autorNombre) {
      throw new ErrorApi(
        "El nombre del autor es requerido para reseñas anónimas",
        400
      );
    }
    return this.repository.crearResenaProducto({
      productoId,
      usuarioId,
      autorNombre: datos.autorNombre,
      calificacion: datos.calificacion,
      comentario: datos.comentario,
    });
  }

  async listarResenasProducto(productoId: number, filtros: FiltrosResenasDto) {
    const { datos, total } = await this.repository.listarResenasProducto(productoId, filtros);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  async estadisticasProducto(productoId: number) {
    return this.repository.obtenerEstadisticasProducto(productoId);
  }

  async pendientesProductos(tiendaId: number) {
    return this.repository.listarPendientesProductos(tiendaId);
  }

  async aprobarResenaProducto(resenaId: number) {
    await this.repository.aprobarResenaProducto(resenaId);
  }

  async rechazarResenaProducto(resenaId: number) {
    await this.repository.rechazarResenaProducto(resenaId);
  }

  async responderResenaProducto(
    resenaId: number,
    respuesta: string,
    productoId: number
  ) {
    await this.repository.responderResenaProducto(resenaId, respuesta, productoId);
  }

  async eliminarResenaProducto(resenaId: number) {
    await this.repository.eliminarResenaProducto(resenaId);
  }
}

// ─────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────

class ResenasController {
  private service: ResenasService;

  constructor() {
    this.service = new ResenasService();
  }

  // ── Tienda - Público ──

  listarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const filtros = req.query as unknown as FiltrosResenasDto;
      const resultado = await this.service.listarResenasTienda(tiendaId, filtros);
      responderPaginado(res, resultado);
    } catch (e) { next(e); }
  };

  estadisticasTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const stats = await this.service.estadisticasTienda(tiendaId);
      responderOk(res, stats);
    } catch (e) { next(e); }
  };

  crearTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      // El usuarioId es opcional (permite reseñas anónimas)
      const usuarioId = (req as RequestAutenticado).usuario?.sub;
      const resena = await this.service.crearResenaTienda(tiendaId, req.body as CrearResenaDto, usuarioId);
      responderOk(res, resena, "Reseña enviada. Será publicada una vez aprobada.", 201);
    } catch (e) { next(e); }
  };

  // ── Tienda - Owner ──

  pendientesTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const pendientes = await this.service.pendientesTienda(tiendaId);
      responderOk(res, pendientes);
    } catch (e) { next(e); }
  };

  aprobarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.aprobarResenaTienda(parseInt(req.params["resenaId"] as string, 10));
      responderOk(res, null, "Reseña aprobada");
    } catch (e) { next(e); }
  };

  rechazarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.rechazarResenaTienda(parseInt(req.params["resenaId"] as string, 10));
      responderOk(res, null, "Reseña rechazada");
    } catch (e) { next(e); }
  };

  responderTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resenaId = parseInt(req.params["resenaId"] as string, 10);
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const { respuesta } = req.body as ResponderResenaDto;
      await this.service.responderResenaTienda(resenaId, respuesta, tiendaId);
      responderOk(res, null, "Respuesta publicada");
    } catch (e) { next(e); }
  };

  eliminarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarResenaTienda(parseInt(req.params["resenaId"] as string, 10));
      responderOk(res, null, "Reseña eliminada");
    } catch (e) { next(e); }
  };

  // ── Producto - Público ──

  listarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const filtros = req.query as unknown as FiltrosResenasDto;
      const resultado = await this.service.listarResenasProducto(productoId, filtros);
      responderPaginado(res, resultado);
    } catch (e) { next(e); }
  };

  estadisticasProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const stats = await this.service.estadisticasProducto(productoId);
      responderOk(res, stats);
    } catch (e) { next(e); }
  };

  crearProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const usuarioId = (req as RequestAutenticado).usuario?.sub;
      const resena = await this.service.crearResenaProducto(productoId, req.body as CrearResenaDto, usuarioId);
      responderOk(res, resena, "Reseña enviada. Será publicada una vez aprobada.", 201);
    } catch (e) { next(e); }
  };

  // ── Producto - Owner ──

  pendientesProductos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const pendientes = await this.service.pendientesProductos(tiendaId);
      responderOk(res, pendientes);
    } catch (e) { next(e); }
  };

  aprobarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.aprobarResenaProducto(parseInt(req.params["resenaId"] as string, 10));
      responderOk(res, null, "Reseña aprobada");
    } catch (e) { next(e); }
  };

  rechazarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.rechazarResenaProducto(parseInt(req.params["resenaId"] as string, 10));
      responderOk(res, null, "Reseña rechazada");
    } catch (e) { next(e); }
  };

  responderProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resenaId = parseInt(req.params["resenaId"] as string, 10);
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const { respuesta } = req.body as ResponderResenaDto;
      await this.service.responderResenaProducto(resenaId, respuesta, productoId);
      responderOk(res, null, "Respuesta publicada");
    } catch (e) { next(e); }
  };

  eliminarProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarResenaProducto(parseInt(req.params["resenaId"] as string, 10));
      responderOk(res, null, "Reseña eliminada");
    } catch (e) { next(e); }
  };
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

const controller = new ResenasController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// Router montado en /tiendas/:tiendaId/resenas
export const resenasTiendaRouter = Router({ mergeParams: true });

resenasTiendaRouter.get("/", validar(FiltrosResenasSchema, "query"), controller.listarTienda);
resenasTiendaRouter.get("/estadisticas", controller.estadisticasTienda);
resenasTiendaRouter.post("/", validar(CrearResenaSchema), controller.crearTienda);
// Panel owner
resenasTiendaRouter.get("/pendientes", ...soloOwner, controller.pendientesTienda);
resenasTiendaRouter.patch("/:resenaId/aprobar", ...soloOwner, controller.aprobarTienda);
resenasTiendaRouter.patch("/:resenaId/rechazar", ...soloOwner, controller.rechazarTienda);
resenasTiendaRouter.post("/:resenaId/responder", ...soloOwner, validar(ResponderResenaSchema), controller.responderTienda);
resenasTiendaRouter.delete("/:resenaId", ...soloOwner, controller.eliminarTienda);

// Router montado en /mis-productos/:productoId/resenas
export const resenasProductoRouter = Router({ mergeParams: true });

resenasProductoRouter.get("/", validar(FiltrosResenasSchema, "query"), controller.listarProducto);
resenasProductoRouter.get("/estadisticas", controller.estadisticasProducto);
resenasProductoRouter.post("/", validar(CrearResenaSchema), controller.crearProducto);
// Panel owner
resenasProductoRouter.get("/pendientes/:tiendaId", ...soloOwner, controller.pendientesProductos);
resenasProductoRouter.patch("/:resenaId/aprobar", ...soloOwner, controller.aprobarProducto);
resenasProductoRouter.patch("/:resenaId/rechazar", ...soloOwner, controller.rechazarProducto);
resenasProductoRouter.post("/:resenaId/responder", ...soloOwner, validar(ResponderResenaSchema), controller.responderProducto);
resenasProductoRouter.delete("/:resenaId", ...soloOwner, controller.eliminarProducto);

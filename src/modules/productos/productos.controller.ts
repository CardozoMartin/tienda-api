// Controller de productos.
import { Request, Response, NextFunction } from "express";
import { ProductosService } from "./productos.service";
import { responderOk, responderPaginado } from "../../utils/helpers";
import { RequestAutenticado } from "../../types";
import {
  CrearProductoDto,
  ActualizarProductoDto,
  CrearVarianteDto,
  ActualizarVarianteDto,
  AgregarImagenDto,
  FiltrosProductosDto,
} from "./productos.dto";

export class ProductosController {
  private service: ProductosService;

  constructor() {
    this.service = new ProductosService();
  }

  // ── Rutas públicas ──

  listarPublicos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const filtros = req.query as unknown as FiltrosProductosDto;
      const resultado = await this.service.listarPublicos(tiendaId, filtros);
      responderPaginado(res, resultado, "Productos obtenidos exitosamente");
    } catch (error) { next(error); }
  };

  obtenerPublico = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params["tiendaId"] as string, 10);
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const producto = await this.service.obtenerPublico(tiendaId, productoId);
      responderOk(res, producto, "Producto obtenido exitosamente");
    } catch (error) { next(error); }
  };

  // ── Rutas del owner ──

  listarMisProductos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const filtros = req.query as unknown as FiltrosProductosDto;
      const resultado = await this.service.listarMisProductos(usuarioId, filtros);
      responderPaginado(res, resultado, "Productos obtenidos exitosamente");
    } catch (error) { next(error); }
  };

  obtenerMiProducto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const producto = await this.service.obtenerMiProducto(usuarioId, productoId);
      responderOk(res, producto, "Producto obtenido exitosamente");
    } catch (error) { next(error); }
  };

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const producto = await this.service.crear(usuarioId, req.body as CrearProductoDto);
      responderOk(res, producto, "Producto creado exitosamente", 201);
    } catch (error) { next(error); }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const producto = await this.service.actualizar(usuarioId, productoId, req.body as ActualizarProductoDto);
      responderOk(res, producto, "Producto actualizado exitosamente");
    } catch (error) { next(error); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      await this.service.eliminar(usuarioId, productoId);
      responderOk(res, null, "Producto eliminado exitosamente");
    } catch (error) { next(error); }
  };

  actualizarTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const { tags } = req.body as { tags: string[] };
      await this.service.actualizarTags(usuarioId, productoId, tags);
      responderOk(res, null, "Tags actualizados exitosamente");
    } catch (error) { next(error); }
  };

  // ── Imágenes ──

  agregarImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const imagen = await this.service.agregarImagen(usuarioId, productoId, req.body as AgregarImagenDto);
      responderOk(res, imagen, "Imagen agregada exitosamente", 201);
    } catch (error) { next(error); }
  };

  eliminarImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const imagenId = parseInt(req.params["imagenId"] as string, 10);
      await this.service.eliminarImagen(usuarioId, productoId, imagenId);
      responderOk(res, null, "Imagen eliminada exitosamente");
    } catch (error) { next(error); }
  };

  // ── Variantes ──

  crearVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const variante = await this.service.crearVariante(usuarioId, productoId, req.body as CrearVarianteDto);
      responderOk(res, variante, "Variante creada exitosamente", 201);
    } catch (error) { next(error); }
  };

  actualizarVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const varianteId = parseInt(req.params["varianteId"] as string, 10);
      const variante = await this.service.actualizarVariante(usuarioId, productoId, varianteId, req.body as ActualizarVarianteDto);
      responderOk(res, variante, "Variante actualizada exitosamente");
    } catch (error) { next(error); }
  };

  eliminarVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params["productoId"] as string, 10);
      const varianteId = parseInt(req.params["varianteId"] as string, 10);
      await this.service.eliminarVariante(usuarioId, productoId, varianteId);
      responderOk(res, null, "Variante eliminada exitosamente");
    } catch (error) { next(error); }
  };
}

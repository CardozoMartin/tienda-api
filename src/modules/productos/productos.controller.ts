// Controller de productos.
import { NextFunction, Request, Response } from 'express';
import { RequestAutenticado } from '../../types';
import { responderOk, responderPaginado } from '../../utils/helpers';
import {
  ActualizarProductoDto,
  ActualizarVarianteDto,
  AgregarImagenDto,
  CrearProductoDto,
  CrearVarianteDto,
  FiltrosProductosDto,
} from './productos.dto';
import { ProductosService } from './productos.service';

export class ProductosController {
  private service: ProductosService;

  constructor() {
    this.service = new ProductosService();
  }

  // ── Rutas públicas ──

  listarPublicos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tiendaId } = req.params;
      const filtros = req.query as any;
      const resultado = await this.service.listarPublicos(Number(tiendaId), filtros);
      responderOk(res, resultado, 'Productos obtenidos');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene la lista de productos destacados para una tienda (público).
   */
  listarDestacados = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tiendaId } = req.params;
      const filtros = req.query as any;
      const resultado = await this.service.listarDestacados(Number(tiendaId), filtros);
      responderOk(res, resultado, 'Productos destacados obtenidos');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene la lista de productos normales (no destacados) para una tienda (público).
   */
  listarNormales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tiendaId } = req.params;
      const filtros = req.query as any;
      const resultado = await this.service.listarNormales(Number(tiendaId), filtros);
      responderOk(res, resultado, 'Productos normales obtenidos');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene los detalles de un producto de forma pública.
   */
  obtenerPublico = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const producto = await this.service.obtenerPublico(tiendaId, productoId);
      responderOk(res, producto, 'Producto obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  };

  // ── Rutas del owner ──

  listarMisProductos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const filtros = req.query as unknown as FiltrosProductosDto;
      const resultado = await this.service.listarMisProductos(usuarioId, filtros);
      responderPaginado(res, resultado, 'Productos obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  };

  obtenerMiProducto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const producto = await this.service.obtenerMiProducto(usuarioId, productoId);
      responderOk(res, producto, 'Producto obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  };

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const file = (req as any).file as Express.Multer.File | undefined;

      // Sanitizamos precioOferta: si es "" lo pasamos como undefined
      const body = { ...req.body };
      if (body.precioOferta === '') delete body.precioOferta;
      if (body.categoriaId === '') delete body.categoriaId;

      const producto = await this.service.crear(usuarioId, body as CrearProductoDto, file);
      responderOk(res, producto, 'Producto creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);

      const body = { ...req.body };
      if (body.precioOferta === '') delete body.precioOferta;
      if (body.categoriaId === '') delete body.categoriaId;

      const producto = await this.service.actualizar(
        usuarioId,
        productoId,
        body as ActualizarProductoDto
      );
      responderOk(res, producto, 'Producto actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      await this.service.eliminar(usuarioId, productoId);
      responderOk(res, null, 'Producto eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  actualizarTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const { tags } = req.body as { tags: string[] };
      await this.service.actualizarTags(usuarioId, productoId, tags);
      responderOk(res, null, 'Tags actualizados exitosamente');
    } catch (error) {
      next(error);
    }
  };

  // ── Imágenes ──

  agregarImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const file = (req as any).file as Express.Multer.File | undefined;
      const imagen = await this.service.agregarImagen(
        usuarioId,
        productoId,
        req.body as AgregarImagenDto,
        file
      );
      responderOk(res, imagen, 'Imagen agregada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  eliminarImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const imagenId = parseInt(req.params['imagenId'] as string, 10);
      await this.service.eliminarImagen(usuarioId, productoId, imagenId);
      responderOk(res, null, 'Imagen eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  // ── Variantes ──

  crearVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const variante = await this.service.crearVariante(
        usuarioId,
        productoId,
        req.body as CrearVarianteDto
      );
      responderOk(res, variante, 'Variante creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  actualizarVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const varianteId = parseInt(req.params['varianteId'] as string, 10);
      const variante = await this.service.actualizarVariante(
        usuarioId,
        productoId,
        varianteId,
        req.body as ActualizarVarianteDto
      );
      responderOk(res, variante, 'Variante actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  eliminarVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const varianteId = parseInt(req.params['varianteId'] as string, 10);
      await this.service.eliminarVariante(usuarioId, productoId, varianteId);
      responderOk(res, null, 'Variante eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  subirImagenVariante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const productoId = parseInt(req.params['productoId'] as string, 10);
      const varianteId = parseInt(req.params['varianteId'] as string, 10);
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) throw new Error('No se recibió ningún archivo');

      const variante = await this.service.subirImagenVariante(usuarioId, productoId, varianteId, file);
      responderOk(res, variante, 'Imagen de variante subida exitosamente');
    } catch (error) {
      next(error);
    }
  };

  // ── Categorías (Para Owners) ──

  listarCategorias = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      responderOk(res, await this.service.listarCategorias(), 'Categorías obtenidas');
    } catch (error) {
      next(error);
    }
  };

  listarCategoriasPublicas = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tiendaId = parseInt(req.params['tiendaId'] as string, 10);
      responderOk(
        res,
        await this.service.listarCategoriasPorTienda(tiendaId),
        'Categorías de la tienda obtenidas'
      );
    } catch (error) {
      next(error);
    }
  };

  // ── Excel ──

  exportar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const buffer = await this.service.exportarAExcel(usuarioId);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  importar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) throw new Error('No se recibió ningún archivo');

      const resultado = await this.service.importarDesdeExcel(usuarioId, file.buffer);
      responderOk(res, resultado, 'Importación completada');
    } catch (error) {
      next(error);
    }
  };
}

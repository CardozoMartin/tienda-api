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

//Controlador para obtener la lista de productos públicos de una tienda, con soporte para filtros de búsqueda, paginación y ordenamiento. No requiere autenticación.
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

  //Controlador para obtener la lista de productos del owner autenticado, con soporte para filtros de búsqueda, paginación y ordenamiento. Requiere autenticación.
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

  //Controlador para obtener la lista de productos normales (no destacados) de una tienda, con soporte para filtros de búsqueda, paginación y ordenamiento. No requiere autenticación.
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

  //Controlador para obtener los detalles de un producto público de una tienda. No requiere autenticación.
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


 //controlador para obtener los detalles de un producto del owner autenticado. Requiere autenticación.
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

  //Controlador para obtener los detalles de un producto del owner autenticado. Requiere autenticación.
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

  //Controlador para crear un nuevo producto. Requiere autenticación. El owner autenticado solo puede crear productos para SU tienda.
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

  //Controlador para actualizar un producto existente. Requiere autenticación. El owner autenticado solo puede actualizar productos de SU tienda.
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

  //Controlador para eliminar un producto. Requiere autenticación. El owner autenticado solo puede eliminar productos de SU tienda.
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

  //Controlador para actualizar las tags de un producto. Requiere autenticación. El owner autenticado solo puede actualizar productos de SU tienda.
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



  //Controlador para agregar una imagen a un producto. Requiere autenticación. El owner autenticado solo puede agregar imágenes a productos de SU tienda.
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

  // Controlador para eliminar una imagen de un producto. Requiere autenticación. El owner autenticado solo puede eliminar imágenes de productos de SU tienda.
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

  //Controlador para crear una variante de un producto. Requiere autenticación. El owner autenticado solo puede crear variantes para productos de SU tienda.
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

  //Controlador para actualizar una variante de un producto. Requiere autenticación. El owner autenticado solo puede actualizar variantes de productos de SU tienda.
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

  //Controlador para eliminar una variante de un producto. Requiere autenticación. El owner autenticado solo puede eliminar variantes de productos de SU tienda.
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

  //Controlador para subir una imagen a una variante de un producto. Requiere autenticación. El owner autenticado solo puede subir imágenes a variantes de productos de SU tienda.
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

  //Controlador para listar todas las categorías disponibles. Requiere autenticación.
  listarCategorias = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      responderOk(res, await this.service.listarCategorias(), 'Categorías obtenidas');
    } catch (error) {
      next(error);
    }
  };


  //Controlador para listar las categorías de una tienda específica. No requiere autenticación.
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
  //REVISARRR!!!!!
  //TODO: Hay que testear estas rutas porque no estan funcionando como deberian devuelven un 200 pero no ejecutan las consultas como deberian

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
  //el exportar funciona algo pero el importar no funciona, no se si es un error del controller o del service, hay que testearlo bien para ver donde esta el error
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

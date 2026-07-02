// Controller de tiendas.
import { NextFunction, Request, Response } from 'express';
import { ErrorApi, RequestAutenticado } from '../../types';
import { responderOk, responderPaginado } from '../../utils/helpers';
import {
  ActualizarTemaDto,
  ActualizarTiendaDto,
  AgregarImagenCarruselDto,
  ActualizarImagenCarruselDto,
  AgregarCategoriaDestacadaDto,
  ActualizarCategoriaDestacadaDto,
  AgregarMetodoEntregaDto,
  AgregarMetodoPagoDto,
  CrearTiendaDto,
  FiltrosTiendasDto,
  ActualizarAboutUsDto,
  ActualizarMarqueeDto,
  CambiarSlugDto,
  GuardarConfigEmailDto,
} from './tiendas.dto';
import { TiendasService } from './tiendas.service';

export class TiendasController {
  private service: TiendasService;

  constructor() {
    this.service = new TiendasService();
  }

  //controlador para listar tiendas con filtros de búsqueda, paginación y ordenamiento
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filtros = req.query as unknown as FiltrosTiendasDto;
      const resultado = await this.service.listar(filtros);
      responderPaginado(res, resultado, 'Tiendas obtenidas exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //controlador para obtener una tienda por su slug (URL amigable)
  obtenerPorSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params as { slug: string };
      const tienda = await this.service.obtenerPorSlug(slug);
      responderOk(res, tienda, 'Tienda obtenida exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //controlador para obtener una tienda por su dominio propio (storefront servido en dominio del cliente)
  obtenerPorDominio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const host = (req.query['host'] as string) ?? '';
      if (!host) {
        throw new ErrorApi('Falta el parámetro host', 400);
      }
      const tienda = await this.service.obtenerPorDominio(host);
      responderOk(res, tienda, 'Tienda obtenida exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //controlador para que el dueño cargue/cambie el dominio propio de su tienda
  guardarDominio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const { dominio } = req.body as { dominio: string };
      const resultado = await this.service.guardarDominio(usuarioId, dominio);
      responderOk(res, resultado, 'Dominio guardado. Configurá el registro TXT para verificarlo.');
    } catch (error) {
      next(error);
    }
  };

  //controlador para verificar la propiedad del dominio (consulta el DNS real)
  verificarDominio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.verificarDominio(usuarioId);
      responderOk(res, resultado, 'Verificación de dominio completada');
    } catch (error) {
      next(error);
    }
  };

  //controlador para obtener el estado del dominio del dueño (para el panel)
  obtenerEstadoDominio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.obtenerEstadoDominio(usuarioId);
      responderOk(res, resultado, 'Estado del dominio obtenido');
    } catch (error) {
      next(error);
    }
  };

  // ── Config de email marketing (proveedor propio del dueño) ──

  //controlador para guardar/actualizar la config del proveedor de email del dueño
  guardarConfigEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.guardarConfigEmail(usuarioId, req.body as GuardarConfigEmailDto);
      responderOk(res, resultado, 'Configuración de email guardada. Verificá la conexión para empezar a enviar.');
    } catch (error) {
      next(error);
    }
  };

  //controlador para obtener el estado de la config de email (para el panel)
  obtenerConfigEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.obtenerConfigEmail(usuarioId);
      responderOk(res, resultado, 'Configuración de email obtenida');
    } catch (error) {
      next(error);
    }
  };

  //controlador para verificar la conexión con el proveedor de email del dueño
  verificarConfigEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.verificarConfigEmail(usuarioId);
      responderOk(res, resultado, 'Conexión de email verificada');
    } catch (error) {
      next(error);
    }
  };

  //controlador para eliminar la configuración de email del dueño
  eliminarConfigEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.eliminarConfigEmail(usuarioId);
      responderOk(res, resultado, 'Configuración de email eliminada');
    } catch (error) {
      next(error);
    }
  };

  //controlador para obtener la tienda del usuario autenticado
  obtenerMiTienda = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await this.service.obtenerMiTienda(usuarioId);
      responderOk(res, tienda, 'Tienda obtenida exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //controlador para crear una tienda, solo para usuarios autenticados que no tengan tienda aún
  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await this.service.crear(usuarioId, req.body as CrearTiendaDto);
      responderOk(res, tienda, 'Tienda creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  //controlador para actualizar la información de la tienda del usuario autenticado
  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tienda = await this.service.actualizar(usuarioId, req.body as ActualizarTiendaDto);
      responderOk(res, tienda, 'Tienda actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //controlador para actualizar el tema visual de la tienda del usuario autenticado
  actualizarTema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const tema = await this.service.actualizarTema(usuarioId, req.body as ActualizarTemaDto);
      responderOk(res, tema, 'Tema actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  // ── Catálogo de métodos ──

  listarMetodosPago = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metodos = await this.service.listarMetodosPagoCatalogo();
      responderOk(res, metodos, 'Catálogo de métodos de pago obtenido');
    } catch (error) {
      next(error);
    }
  };

  listarMetodosEntrega = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metodos = await this.service.listarMetodosEntregaCatalogo();
      responderOk(res, metodos, 'Catálogo de métodos de entrega obtenido');
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
      const resultado = await this.service.agregarMetodoPago(
        usuarioId,
        req.body as AgregarMetodoPagoDto
      );
      responderOk(res, resultado, 'Método de pago agregado', 201);
    } catch (error) {
      next(error);
    }
  };

  actualizarMetodoPago = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const metodoPagoId = parseInt(req.params['metodoPagoId'] as string, 10);
      const resultado = await this.service.actualizarMetodoPago(usuarioId, metodoPagoId, req.body);
      responderOk(res, resultado);
    } catch (error) { next(error); }
  };

  eliminarMetodoPago = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const metodoPagoId = parseInt(req.params['metodoPagoId'] as string, 10);
      await this.service.eliminarMetodoPago(usuarioId, metodoPagoId);
      responderOk(res, null, 'Método de pago eliminado');
    } catch (error) { next(error); }
  };

  // ── Métodos de entrega ──

  agregarMetodoEntrega = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.agregarMetodoEntrega(usuarioId, req.body as AgregarMetodoEntregaDto);
      responderOk(res, resultado, 'Método de entrega agregado', 201);
    } catch (error) { next(error); }
  };

  actualizarMetodoEntrega = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const metodoEntregaId = parseInt(req.params['metodoEntregaId'] as string, 10);
      const resultado = await this.service.actualizarMetodoEntrega(usuarioId, metodoEntregaId, req.body);
      responderOk(res, resultado);
    } catch (error) { next(error); }
  };

  eliminarMetodoEntrega = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const metodoEntregaId = parseInt(req.params['metodoEntregaId'] as string, 10);
      await this.service.eliminarMetodoEntrega(usuarioId, metodoEntregaId);
      responderOk(res, null, 'Método de entrega eliminado');
    } catch (error) { next(error); }
  };

  // ── Carrusel ──

  /**
   * GET /tiendas/mi-tienda/carrusel
   * Lista todas las secciones (incluyendo inactivas y programadas) para el panel admin
   */
  listarCarruselAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const secciones = await this.service.listarCarruselAdmin(usuarioId);
      responderOk(res, secciones, 'Secciones hero obtenidas');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /tiendas/mi-tienda/carrusel
   * Puede recibir archivos (form-data) o URL en JSON body
   */
  agregarImagenCarrusel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const photoBuffers = (req.files as Express.Multer.File[]) || [];
      const imagenes = await this.service.agregarImagenCarrusel(
        usuarioId,
        req.body as AgregarImagenCarruselDto,
        photoBuffers
      );
      responderOk(res, imagenes, 'Imagen(nes) agregada(s) al carrusel', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /tiendas/mi-tienda/carrusel/:imagenId
   */
  eliminarImagenCarrusel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const imagenId = parseInt(req.params['imagenId'] as string, 10);
      await this.service.eliminarImagenCarrusel(usuarioId, imagenId);
      responderOk(res, null, 'Imagen eliminada del carrusel');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /tiendas/mi-tienda/carrusel/:imagenId
   * Edita metadatos de una sección (título, tipo, fechas, activa, etiqueta)
   */
  actualizarImagenCarrusel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const imagenId = parseInt(req.params['imagenId'] as string, 10);
      const datos = req.body as ActualizarImagenCarruselDto;
      const secciones = await this.service.actualizarImagenCarrusel(usuarioId, imagenId, datos);
      responderOk(res, secciones, 'Sección actualizada');
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
      responderOk(res, null, 'Orden del carrusel actualizado');
    } catch (error) {
      next(error);
    }
  };

  // ── Categorías destacadas ──

  /** GET /tiendas/mi-tienda/categorias-destacadas */
  listarCategoriasDestacadas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const categorias = await this.service.listarCategoriasDestacadas(usuarioId);
      responderOk(res, categorias, 'Categorías destacadas obtenidas');
    } catch (error) {
      next(error);
    }
  };

  /** POST /tiendas/mi-tienda/categorias-destacadas (form-data con imagen o imagenUrl en body) */
  agregarCategoriaDestacada = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const file = req.file as Express.Multer.File | undefined;
      const categoria = await this.service.agregarCategoriaDestacada(
        usuarioId,
        req.body as AgregarCategoriaDestacadaDto,
        file
      );
      responderOk(res, categoria, 'Categoría destacada agregada', 201);
    } catch (error) {
      next(error);
    }
  };

  /** PUT /tiendas/mi-tienda/categorias-destacadas/:categoriaId */
  actualizarCategoriaDestacada = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const id = parseInt(req.params['categoriaId'] as string, 10);
      const file = req.file as Express.Multer.File | undefined;
      const categorias = await this.service.actualizarCategoriaDestacada(
        usuarioId,
        id,
        req.body as ActualizarCategoriaDestacadaDto,
        file
      );
      responderOk(res, categorias, 'Categoría destacada actualizada');
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /tiendas/mi-tienda/categorias-destacadas/:categoriaId */
  eliminarCategoriaDestacada = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const id = parseInt(req.params['categoriaId'] as string, 10);
      await this.service.eliminarCategoriaDestacada(usuarioId, id);
      responderOk(res, null, 'Categoría destacada eliminada');
    } catch (error) {
      next(error);
    }
  };

  /** PUT /tiendas/mi-tienda/categorias-destacadas/reordenar */
  reordenarCategoriasDestacadas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const { orden } = req.body as { orden: Array<{ id: number; orden: number }> };
      await this.service.reordenarCategoriasDestacadas(usuarioId, orden);
      responderOk(res, null, 'Orden de categorías destacadas actualizado');
    } catch (error) {
      next(error);
    }
  };

  // ── About Us ──

  /**
   * GET /tiendas/mi-tienda/about-us
   */
  obtenerAboutUs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const aboutUs = await this.service.obtenerAboutUs(usuarioId);
      responderOk(res, aboutUs, 'Información "Sobre Nosotros" obtenida');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /tiendas/mi-tienda/about-us
   */
  actualizarAboutUs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const datos = req.body as ActualizarAboutUsDto;
      const resultado = await this.service.actualizarAboutUs(usuarioId, datos);
      responderOk(res, resultado, 'Información "Sobre Nosotros" actualizada');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /tiendas/mi-tienda/about-us/imagen
   */
  subirImagenAboutUs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const file = req.file as Express.Multer.File;
      if (!file) throw new ErrorApi('No se subió ninguna imagen', 400);

      const resultado = await this.service.subirImagenAboutUs(usuarioId, file);
      responderOk(res, resultado, 'Imagen de "Sobre Nosotros" actualizada');
    } catch (error) {
      next(error);
    }
  };

  subirImagenBannerPromo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const file = req.file as Express.Multer.File;
      if (!file) throw new ErrorApi('No se subió ninguna imagen', 400);
      const resultado = await this.service.subirImagenBannerPromo(usuarioId, file);
      responderOk(res, resultado, 'Imagen del banner promocional actualizada');
    } catch (error) {
      next(error);
    }
  };

  // ── Marquee ──

  /**
   * GET /tiendas/mi-tienda/marquee
   */
  obtenerMarquee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const marquee = await this.service.obtenerMarquee(usuarioId);
      responderOk(res, marquee, 'Items del carrusel de marcas obtenidos');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /tiendas/mi-tienda/marquee
   */
  actualizarMarquee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const datos = req.body as ActualizarMarqueeDto;
      const resultado = await this.service.actualizarMarquee(usuarioId, datos);
      responderOk(res, resultado, 'Items del carrusel de marcas actualizados');
    } catch (error) {
      next(error);
    }
  };

  // ── Logo ──

  /**
   * POST /tiendas/mi-tienda/logo
   */
  subirLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const file = req.file as Express.Multer.File;
      if (!file) throw new ErrorApi('No se subió ninguna imagen', 400);
      const resultado = await this.service.subirLogo(usuarioId, file);
      responderOk(res, resultado, 'Logo actualizado');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /tiendas/mi-tienda/logo
   */
  eliminarLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.eliminarLogo(usuarioId);
      responderOk(res, resultado, 'Logo eliminado');
    } catch (error) {
      next(error);
    }
  };

  // ── Slug ──

  /**
   * PATCH /tiendas/mi-tienda/slug
   */
  cambiarSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const datos = req.body as CambiarSlugDto;
      const resultado = await this.service.cambiarSlug(usuarioId, datos);
      responderOk(res, resultado, 'Slug actualizado');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /tiendas/mi-tienda/slug/verificar?slug=...
   */
  verificarSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const { slug } = req.query as { slug: string };
      if (!slug) throw new ErrorApi('El slug es requerido', 400);
      const resultado = await this.service.verificarSlug(slug, usuarioId);
      responderOk(res, resultado, resultado.disponible ? 'Slug disponible' : 'Slug no disponible');
    } catch (error) {
      next(error);
    }
  };
}

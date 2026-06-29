// Service de tiendas.
// Lógica de negocio: validaciones, generación de slugs únicos, control de permisos.
import { TiendasRepository } from "./tiendas.repository";
import { ErrorApi } from "../../types";
import { generarSlug, generarSlugUnico, construirPaginacion } from "../../utils/helpers";
import {
  CrearTiendaDto,
  ActualizarTiendaDto,
  ActualizarTemaDto,
  AgregarMetodoPagoDto,
  ActualizarMetodoPagoDto,
  AgregarMetodoEntregaDto,
  ActualizarMetodoEntregaDto,
  AgregarImagenCarruselDto,
  ActualizarImagenCarruselDto,
  FiltrosTiendasDto,
  ActualizarAboutUsDto,
  ActualizarMarqueeDto,
  CambiarSlugDto,
} from "./tiendas.dto";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { cacheService } from "../../utils/cache";
import { logger } from "../../utils/logger";

export class TiendasService {
  private repository: TiendasRepository;

  constructor() {
    this.repository = new TiendasRepository();
  }

  //Servicio para crear una tienda para un usuario autenticado, con validación de que no tenga ya una tienda, generación de slug único, y manejo de errores.
  async crear(usuarioId: number, datos: CrearTiendaDto) {
    // Verificamos que el usuario no tenga ya una tienda
    const tiendaExistente = await this.repository.buscarPorUsuarioId(usuarioId);
    if (tiendaExistente) {
      throw new ErrorApi("Ya tenés una tienda creada. Solo se permite una por cuenta.", 409);
    }

    // Si el usuario eligió un slug, lo usamos; si no, lo generamos desde el nombre
    let slug = datos.slug ? generarSlug(datos.slug) : generarSlug(datos.nombre);

    // Si el slug fue ingresado manualmente, lo validamos y rechazamos si ya existe
    const slugOcupado = await this.repository.existeSlug(slug);
    if (slugOcupado) {
      if (datos.slug) {
        throw new ErrorApi(`El slug "${slug}" no está disponible`, 409);
      }
      slug = generarSlugUnico(datos.nombre);
    }

    const tienda = await this.repository.crear({
      usuarioId,
      slug,
      nombre: datos.nombre,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      plantillaId: datos.plantillaId,
      whatsapp: datos.whatsapp,
      instagram: datos.instagram,
      facebook: datos.facebook,
      sitioWeb: datos.sitioWeb,
      pais: datos.pais,
      provincia: datos.provincia,
      ciudad: datos.ciudad,
    });

    return tienda;
  }

  //Servicio para obtener la tienda de un usuario autenticado. Si no tiene tienda, devuelve error 404.
  async obtenerMiTienda(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada todavía", 404);
    }
    return tienda;
  }

  //Servicio para obtener una tienda por su slug, solo si está activa y pública. Si no se encuentra, devuelve error 404.
  async obtenerPorSlug(slug: string) {
    const cacheKey = `tienda_slug_${slug}`;
    let tienda: any = cacheService.get(cacheKey);

    if (!tienda) {
      tienda = await this.repository.buscarPorSlug(slug);
      if (!tienda || !tienda.activa || !tienda.publica) {
        throw new ErrorApi("Tienda no encontrada", 404);
      }
      cacheService.set(cacheKey, tienda);
    }

    // Incrementamos las vistas de forma asíncrona, sin bloquear la respuesta
    this.repository.incrementarVistas(tienda.id).catch((err) =>
      logger.error("[TIENDAS] Error al incrementar vistas:", err)
    );

    return this.sanitizarTiendaPublica(tienda);
  }

  /**
   * Limpia datos sensibles antes de exponer la tienda públicamente.
   * Del configExtra de cada método de pago solo dejamos los datos que el
   * comprador necesita ver (transferencia: cbu/alias/banco/titular) y
   * eliminamos cualquier credencial (tokens de Mercado Pago, etc.).
   */
  private sanitizarTiendaPublica(tienda: any) {
    if (!tienda?.metodosPago) return tienda;

    const CAMPOS_PUBLICOS = ['cbu', 'alias', 'banco', 'titular'];

    const metodosPago = tienda.metodosPago
      // Mercado Pago solo se ofrece al cliente si la conexión está verificada (estadoMp === 'activo').
      .filter((mp: any) => {
        const esMp = (mp.metodoPago?.nombre ?? '').toLowerCase().includes('mercado');
        if (!esMp) return true;
        const config = (mp.configExtra ?? {}) as Record<string, any>;
        return config.estadoMp === 'activo' && !!config.mpAccessToken;
      })
      .map((mp: any) => {
        const config = (mp.configExtra ?? {}) as Record<string, any>;
        const configPublico: Record<string, any> = {};
        for (const campo of CAMPOS_PUBLICOS) {
          if (config[campo]) configPublico[campo] = config[campo];
        }
        return { ...mp, configExtra: configPublico };
      });

    return { ...tienda, metodosPago };
  }

  //Servicio para actualizar la tienda de un usuario autenticado, con validación de que tenga una tienda, generación de slug único si cambia el nombre, y manejo de errores.
  async actualizar(usuarioId: number, datos: ActualizarTiendaDto) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }

    // Si se quiere cambiar el nombre, regeneramos el slug
    let datosActualizacion: typeof datos & { slug?: string } = { ...datos };

    if (datos.nombre && datos.nombre !== tienda.nombre) {
      let nuevoSlug = generarSlug(datos.nombre);
      const slugOcupado = await this.repository.existeSlug(nuevoSlug, tienda.id);
      if (slugOcupado) {
        nuevoSlug = generarSlugUnico(datos.nombre);
      }
      datosActualizacion = { ...datosActualizacion, slug: nuevoSlug };
    }

    const resultado = await this.repository.actualizar(tienda.id, datosActualizacion);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  //servicio para ctualizar el tema de una tienda
  //Falta Agregar alguna forma para que no cambie el tema cada que quiera porque se llena de peticiones de cambios de temas por un solo usuario agregar alguna validacion para que se cambien por algun tiempo !!! A TESTEAR
  async actualizarTema(usuarioId: number, datos: ActualizarTemaDto) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    const resultado = await this.repository.actualizarTema(tienda.id, datos);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  //Servicio para listar las tiendas con filtros de búsqueda, paginación y ordenamiento, devolviendo los datos y el total para construir la paginación en el frontend.
  async listar(filtros: FiltrosTiendasDto) {
    const { datos, total } = await this.repository.listar(filtros);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  // Catálogo de métodos

  async listarMetodosPagoCatalogo() {
    return this.repository.listarCatalogoMetodosPago();
  }

  async listarMetodosEntregaCatalogo() {
    return this.repository.listarCatalogoMetodosEntrega();
  }

  // Métodos de pago (tienda)

  async agregarMetodoPago(usuarioId: number, datos: AgregarMetodoPagoDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const result = await this.repository.agregarMetodoPago(tienda.id, datos.metodoPagoId, datos.detalle, datos.configExtra);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async actualizarMetodoPago(usuarioId: number, metodoPagoId: number, datos: ActualizarMetodoPagoDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const result = await this.repository.actualizarMetodoPago(tienda.id, metodoPagoId, datos);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async eliminarMetodoPago(usuarioId: number, metodoPagoId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarMetodoPago(tienda.id, metodoPagoId);
    this.invalidarCacheTienda(tienda.slug);
  }

  //Métodos de entrega

  async agregarMetodoEntrega(usuarioId: number, datos: AgregarMetodoEntregaDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const { metodoEntregaId, ...resto } = datos;
    const result = await this.repository.agregarMetodoEntrega(tienda.id, metodoEntregaId, resto);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async actualizarMetodoEntrega(usuarioId: number, metodoEntregaId: number, datos: ActualizarMetodoEntregaDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const result = await this.repository.actualizarMetodoEntrega(tienda.id, metodoEntregaId, datos);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async eliminarMetodoEntrega(usuarioId: number, metodoEntregaId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarMetodoEntrega(tienda.id, metodoEntregaId);
    this.invalidarCacheTienda(tienda.slug);
  }

  // Carrusel

  async listarCarruselAdmin(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarCarruselAdmin(tienda.id);
  }

  async agregarImagenCarrusel(
    usuarioId: number,
    datos: AgregarImagenCarruselDto,
    buffers: Express.Multer.File[] = []
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const imagenesCreadas = [];
    const camposExtra = {
      tipo: datos.tipo,
      etiqueta: datos.etiqueta,
      fechaDesde: datos.fechaDesde ?? null,
      fechaHasta: datos.fechaHasta ?? null,
    };

    if (buffers && buffers.length > 0) {
      for (const file of buffers) {
        const url = await uploadImageToCloudinary(file.buffer);
        const resultado = await this.repository.agregarImagenCarrusel(tienda.id, {
          url,
          titulo: datos.titulo,
          subtitulo: datos.subtitulo,
          linkUrl: datos.linkUrl,
          orden: datos.orden,
          ...camposExtra,
        });
        imagenesCreadas.push(resultado);
      }
    } else if (datos.url) {
      const resultado = await this.repository.agregarImagenCarrusel(tienda.id, {
        url: datos.url,
        titulo: datos.titulo,
        subtitulo: datos.subtitulo,
        linkUrl: datos.linkUrl,
        orden: datos.orden,
        ...camposExtra,
      });
      imagenesCreadas.push(resultado);
    }

    this.invalidarCacheTienda(tienda.slug);
    return imagenesCreadas;
  }

  async actualizarImagenCarrusel(usuarioId: number, imagenId: number, datos: ActualizarImagenCarruselDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.actualizarImagenCarrusel(imagenId, tienda.id, datos);
    this.invalidarCacheTienda(tienda.slug);
    return this.repository.listarCarruselAdmin(tienda.id);
  }

  async eliminarImagenCarrusel(usuarioId: number, imagenId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarImagenCarrusel(imagenId, tienda.id);
    this.invalidarCacheTienda(tienda.slug);
  }

  async reordenarCarrusel(
    usuarioId: number,
    orden: Array<{ id: number; orden: number }>
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.reordenarCarrusel(tienda.id, orden);
    this.invalidarCacheTienda(tienda.slug);
  }

  // Métodos privados

  private async obtenerTiendaOFallar(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    return tienda;
  }

  private invalidarCacheTienda(slug: string) {
    cacheService.del(`tienda_slug_${slug}`);
    // También podríamos purgar los productos con flushPrefix(`productos_tienda_${id}`)
  }

  // About Us

  async obtenerAboutUs(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.buscarAboutUs(tienda.id);
  }

  async actualizarAboutUs(usuarioId: number, datos: ActualizarAboutUsDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const resultado = await this.repository.actualizarAboutUs(tienda.id, datos);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  async subirImagenAboutUs(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    const resultado = await this.repository.actualizarAboutUs(tienda.id, { imagenUrl: url });
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  async subirImagenBannerPromo(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    await this.repository.actualizarTema(tienda.id, { bannerPromoImagenUrl: url } as any);
    this.invalidarCacheTienda(tienda.slug);
    return { bannerPromoImagenUrl: url };
  }

  //Marquee

  async obtenerMarquee(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarMarquee(tienda.id);
  }

  async actualizarMarquee(usuarioId: number, datos: ActualizarMarqueeDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const resultado = await this.repository.actualizarMarquee(tienda.id, datos.items);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  // ── Logo ──

  async subirLogo(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    const resultado = await this.repository.actualizar(tienda.id, { logoUrl: url });
    this.invalidarCacheTienda(tienda.slug);
    return { logoUrl: url, tienda: resultado };
  }

  async eliminarLogo(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const resultado = await this.repository.actualizar(tienda.id, { logoUrl: null });
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  // ── Slug ──

  async cambiarSlug(usuarioId: number, datos: CambiarSlugDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const nuevoSlug = generarSlug(datos.slug);
    const ocupado = await this.repository.existeSlug(nuevoSlug, tienda.id);
    if (ocupado) {
      throw new ErrorApi(`El slug "${nuevoSlug}" ya está en uso`, 409);
    }
    const slugAnterior = tienda.slug;
    const resultado = await this.repository.actualizar(tienda.id, { slug: nuevoSlug });
    this.invalidarCacheTienda(slugAnterior);
    return resultado;
  }

  async verificarSlug(slug: string, usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const normalizado = generarSlug(slug);
    const ocupado = await this.repository.existeSlug(normalizado, tienda.id);
    return { slug: normalizado, disponible: !ocupado };
  }
}

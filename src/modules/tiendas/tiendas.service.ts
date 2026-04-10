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
  AgregarMetodoEntregaDto,
  AgregarImagenCarruselDto,
  FiltrosTiendasDto,
  ActualizarAboutUsDto,
  ActualizarMarqueeDto,
} from "./tiendas.dto";
import { uploadImageToCloudinary } from "@/utils/cloudinary";

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

    // Generamos el slug a partir del nombre
    let slug = generarSlug(datos.nombre);

    // Si el slug ya existe, agregamos un sufijo numérico único
    const slugOcupado = await this.repository.existeSlug(slug);
    if (slugOcupado) {
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
    const tienda: any = await this.repository.buscarPorSlug(slug);
    if (!tienda || !tienda.activa || !tienda.publica) {
      throw new ErrorApi("Tienda no encontrada", 404);
    }

    // Incrementamos las vistas de forma asíncrona, sin bloquear la respuesta
    this.repository.incrementarVistas(tienda.id).catch((err) =>
      console.error("[TIENDAS] Error al incrementar vistas:", err)
    );

    return tienda;
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

    return this.repository.actualizar(tienda.id, datosActualizacion);
  }

  //servicio para ctualizar el tema de una tienda
  //Falta Agregar alguna forma para que no cambie el tema cada que quiera porque se llena de peticiones de cambios de temas por un solo usuario agregar alguna validacion para que se cambien por algun tiempo !!! A TESTEAR
  async actualizarTema(usuarioId: number, datos: ActualizarTemaDto) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    return this.repository.actualizarTema(tienda.id, datos);
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
    return this.repository.agregarMetodoPago(
      tienda.id,
      datos.metodoPagoId,
      datos.detalle
    );
  }

  async eliminarMetodoPago(usuarioId: number, metodoPagoId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarMetodoPago(tienda.id, metodoPagoId);
  }

  //Métodos de entrega

  async agregarMetodoEntrega(usuarioId: number, datos: AgregarMetodoEntregaDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.agregarMetodoEntrega(
      tienda.id,
      datos.metodoEntregaId,
      datos.zonaCobertura,
      datos.detalle
    );
  }

  async eliminarMetodoEntrega(usuarioId: number, metodoEntregaId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarMetodoEntrega(tienda.id, metodoEntregaId);
  }

  // Carrusel

  async agregarImagenCarrusel(
    usuarioId: number,
    datos: AgregarImagenCarruselDto,
    buffers: Express.Multer.File[] = []
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const imagenesCreadas = [];

    // Si hay archivos subidos, crear un registro por cada uno
    if (buffers && buffers.length > 0) {
      for (const file of buffers) {
        const url = await uploadImageToCloudinary(file.buffer);
        const resultado = await this.repository.agregarImagenCarrusel(tienda.id, {
          url,
          titulo: datos.titulo,
          subtitulo: datos.subtitulo,
          linkUrl: datos.linkUrl,
          orden: datos.orden,
        });
        imagenesCreadas.push(resultado);
      }
    } else if (datos.url) {
      // Si no hay archivos pero sí URL en el body, agregar una imagen
      const resultado = await this.repository.agregarImagenCarrusel(tienda.id, {
        url: datos.url,
        titulo: datos.titulo,
        subtitulo: datos.subtitulo,
        linkUrl: datos.linkUrl,
        orden: datos.orden,
      });
      imagenesCreadas.push(resultado);
    }

    return imagenesCreadas;
  }

  async eliminarImagenCarrusel(usuarioId: number, imagenId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarImagenCarrusel(imagenId, tienda.id);
  }

  async reordenarCarrusel(
    usuarioId: number,
    orden: Array<{ id: number; orden: number }>
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.reordenarCarrusel(tienda.id, orden);
  }

  // Métodos privados

  private async obtenerTiendaOFallar(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    return tienda;
  }

  // About Us

  async obtenerAboutUs(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.buscarAboutUs(tienda.id);
  }

  async actualizarAboutUs(usuarioId: number, datos: ActualizarAboutUsDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.actualizarAboutUs(tienda.id, datos);
  }

  async subirImagenAboutUs(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    return this.repository.actualizarAboutUs(tienda.id, { imagenUrl: url });
  }

  //Marquee

  async obtenerMarquee(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarMarquee(tienda.id);
  }

  async actualizarMarquee(usuarioId: number, datos: ActualizarMarqueeDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.actualizarMarquee(tienda.id, datos.items);
  }
}

import { construirPaginacion } from '@/utils/helpers';
import { CrearResenaDto, FiltrosResenasDto } from './resentas.dto';
import cloudinary from '@/config/cloudinary.config';

export class ResenasService {
  private repository: ResenasRepository;

  constructor() {
    this.repository = new ResenasRepository();
  }

  //Servicio para crear una reseña de tienda. Solo cuando el cliente esta logueado
  async crearResenaTienda(
    tiendaId: number,
    datos: CrearResenaDto,
    clienteId: number,
    autorNombre: string
  ) {
    return this.repository.crearResenaTienda({
      tiendaId,
      clienteId,
      autorNombre,
      calificacion: datos.calificacion,
      comentario: datos.comentario,
    });
  }

  //Servicio para listar las reseñas de una tienda con filtros y paginación
  async listarResenasTienda(tiendaId: number, filtros: FiltrosResenasDto) {
    const { datos, total } = await this.repository.listarResenasTienda(tiendaId, filtros);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  //servicio para obtener las estadísticas de reseñas de una tienda (promedio, total y distribución)
  async estadisticasTienda(tiendaId: number) {
    return this.repository.obtenerEstadisticasTienda(tiendaId);
  }

  //servicio para listar las reseñas pendientes de aprobación de una tienda. Solo el owner de la tienda puede acceder a este servicio
  async pendientesTienda(tiendaId: number) {
    return this.repository.listarPendientesTienda(tiendaId);
  }

  //servicio para aprobar una reseña de tienda. Solo el owner de la tienda puede acceder a este servicio
  async aprobarResenaTienda(resenaId: number) {
    await this.repository.aprobarResenaTienda(resenaId);
  }

  //servicio para rechazar una reseña de tienda. Solo el owner de la tienda puede acceder a este servicio
  async rechazarResenaTienda(resenaId: number) {
    await this.repository.rechazarResenaTienda(resenaId);
  }

  //servicio para responder una reseña de tienda. Solo el owner de la tienda puede acceder a este servicio
  async responderResenaTienda(resenaId: number, respuesta: string, tiendaId: number) {
    await this.repository.responderResenaTienda(resenaId, respuesta, tiendaId);
  }

  //servicio para eliminar una reseña de tienda. Solo el owner de la tienda puede acceder a este servicio
  async eliminarResenaTienda(resenaId: number) {
    await this.repository.eliminarResenaTienda(resenaId);
  }

  // Servicios para crear las reseñas comentarios sobre los productos

  async crearResenaProducto(
    productoId: number,
    datos: CrearResenaDto,
    clienteId: number,
    autorNombre: string,
    imagenBuffer?: Buffer,
    imagenMimetype?: string
  ) {
    let imagenUrl: string | undefined;

    // Si se envió imagen, la subimos a Cloudinary
    if (imagenBuffer && imagenMimetype) {
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'resenas-productos', resource_type: 'image' },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error('Upload failed'));
            resolve(result as { secure_url: string });
          }
        );
        stream.end(imagenBuffer);
      });
      imagenUrl = uploadResult.secure_url;
    }

    return this.repository.crearResenaProducto({
      productoId,
      clienteId,
      autorNombre,
      calificacion: datos.calificacion,
      comentario: datos.comentario,
      imagenUrl,
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

  async responderResenaProducto(resenaId: number, respuesta: string, productoId: number) {
    await this.repository.responderResenaProducto(resenaId, respuesta, productoId);
  }

  async eliminarResenaProducto(resenaId: number) {
    await this.repository.eliminarResenaProducto(resenaId);
  }
}

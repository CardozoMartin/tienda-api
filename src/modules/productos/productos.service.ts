// Service de productos.
import { ProductosRepository } from "./productos.repository";
import { TiendasRepository } from "../tiendas/tiendas.repository";
import { ErrorApi } from "../../types";
import { construirPaginacion } from "../../utils/helpers";
import {
  CrearProductoDto,
  ActualizarProductoDto,
  CrearVarianteDto,
  ActualizarVarianteDto,
  AgregarImagenDto,
  FiltrosProductosDto,
} from "./productos.dto";

export class ProductosService {
  private repository: ProductosRepository;
  private tiendasRepository: TiendasRepository;

  constructor() {
    this.repository = new ProductosRepository();
    this.tiendasRepository = new TiendasRepository();
  }

  /**
   * Lista los productos de una tienda pública.
   * Solo muestra productos disponibles.
   */
  async listarPublicos(tiendaId: number, filtros: FiltrosProductosDto) {
    const { datos, total } = await this.repository.listar(tiendaId, filtros, true);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  /**
   * Lista todos los productos de la tienda del owner (incluye no disponibles).
   */
  async listarMisProductos(usuarioId: number, filtros: FiltrosProductosDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const { datos, total } = await this.repository.listar(tienda.id, filtros, false);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  /**
   * Obtiene un producto por ID para vista pública.
   */
  async obtenerPublico(tiendaId: number, productoId: number) {
    const producto = await this.repository.buscarPorId(productoId, tiendaId);
    if (!producto || !producto.disponible) {
      throw new ErrorApi("Producto no encontrado", 404);
    }

    // Incrementamos vistas de forma asíncrona
    this.repository.incrementarVistas(productoId).catch(console.error);

    return producto;
  }

  /**
   * Obtiene un producto del owner (puede estar no disponible).
   */
  async obtenerMiProducto(usuarioId: number, productoId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const producto = await this.repository.buscarPorId(productoId, tienda.id);
    if (!producto) {
      throw new ErrorApi("Producto no encontrado", 404);
    }
    return producto;
  }

  /**
   * Crea un nuevo producto en la tienda del usuario autenticado.
   */
  async crear(usuarioId: number, datos: CrearProductoDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);

    // Validamos que precioOferta < precio (doble validación, también está en Zod)
    if (datos.precioOferta && datos.precioOferta >= datos.precio) {
      throw new ErrorApi("El precio de oferta debe ser menor al precio original", 400);
    }

    return this.repository.crear({
      tiendaId: tienda.id,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio: datos.precio,
      precioOferta: datos.precioOferta,
      moneda: datos.moneda,
      imagenPrincipalUrl: datos.imagenPrincipalUrl,
      categoriaId: datos.categoriaId,
      disponible: datos.disponible,
      destacado: datos.destacado,
      tags: datos.tags,
      variantes: datos.variantes,
    });
  }

  /**
   * Actualiza un producto verificando que pertenezca a la tienda del owner.
   */
  async actualizar(
    usuarioId: number,
    productoId: number,
    datos: ActualizarProductoDto
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);

    if (datos.precioOferta && datos.precio && datos.precioOferta >= datos.precio) {
      throw new ErrorApi("El precio de oferta debe ser menor al precio original", 400);
    }

    return this.repository.actualizar(productoId, datos);
  }

  /**
   * Elimina un producto verificando que pertenezca a la tienda del owner.
   */
  async eliminar(usuarioId: number, productoId: number): Promise<void> {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.eliminar(productoId);
  }

  /**
   * Sincroniza los tags de un producto (reemplaza todos los existentes).
   */
  async actualizarTags(usuarioId: number, productoId: number, tags: string[]) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.sincronizarTags(productoId, tags);
  }

  // ── Imágenes ──

  async agregarImagen(usuarioId: number, productoId: number, datos: AgregarImagenDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    return this.repository.agregarImagen(productoId, datos.url, datos.orden);
  }

  async eliminarImagen(usuarioId: number, productoId: number, imagenId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.eliminarImagen(imagenId, productoId);
  }

  // ── Variantes ──

  async crearVariante(usuarioId: number, productoId: number, datos: CrearVarianteDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    return this.repository.crearVariante(productoId, datos);
  }

  async actualizarVariante(
    usuarioId: number,
    productoId: number,
    varianteId: number,
    datos: ActualizarVarianteDto
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    return this.repository.actualizarVariante(varianteId, productoId, datos);
  }

  async eliminarVariante(usuarioId: number, productoId: number, varianteId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.eliminarVariante(varianteId, productoId);
  }

  // ── Helpers privados ──

  private async obtenerTiendaOFallar(usuarioId: number) {
    const tienda = await this.tiendasRepository.buscarPorUsuarioId(usuarioId);
    if (!tienda) throw new ErrorApi("No tenés ninguna tienda creada", 404);
    return tienda;
  }

  private async verificarProductoOFallar(productoId: number, tiendaId: number) {
    const producto = await this.repository.buscarPorId(productoId, tiendaId);
    if (!producto) throw new ErrorApi("Producto no encontrado", 404);
    return producto;
  }
}

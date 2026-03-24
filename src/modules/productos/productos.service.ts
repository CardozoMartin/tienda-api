import * as XLSX from "xlsx";
import { ProductosRepository } from "./productos.repository";
import { TiendasRepository } from "../tiendas/tiendas.repository";
import { ErrorApi } from "../../types";
import { construirPaginacion } from "../../utils/helpers";
import { prisma } from "../../config/prisma";
import {
  CrearProductoDto,
  ActualizarProductoDto,
  CrearVarianteDto,
  ActualizarVarianteDto,
  AgregarImagenDto,
  FiltrosProductosDto,
} from "./productos.dto";
import { uploadImageToCloudinary } from "@/utils/cloudinary";

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
   * Puede recibir la imagen principal como archivo (multer) o como URL
   */
  async crear(usuarioId: number, datos: CrearProductoDto, imagenFile?: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);

    // Validamos que precioOferta < precio (doble validación, también está en Zod)
    if (datos.precioOferta && datos.precioOferta >= datos.precio) {
      throw new ErrorApi("El precio de oferta debe ser menor al precio original", 400);
    }

    // Si hay archivo de imagen, lo subimos a Cloudinary
    let imagenPrincipalUrl = datos.imagenPrincipalUrl;
    if (imagenFile) {
      imagenPrincipalUrl = await uploadImageToCloudinary(imagenFile.buffer);
    }

    return this.repository.crear({
      tiendaId: tienda.id,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio: datos.precio,
      precioOferta: (datos.precioOferta as any) === "" ? undefined : (datos.precioOferta as number | undefined),
      moneda: datos.moneda,
      imagenPrincipalUrl,
      categoriaId: (datos.categoriaId as any) === "" ? undefined : datos.categoriaId,
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

    const sanitizedData = { ...datos } as any;
    if (sanitizedData.precioOferta === "") sanitizedData.precioOferta = undefined;
    if (sanitizedData.categoriaId === "") sanitizedData.categoriaId = undefined;

    return this.repository.actualizar(productoId, sanitizedData);
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

  /**
   * Agrega imagen a un producto desde URL o archivo multipart
   */
  async agregarImagen(
    usuarioId: number,
    productoId: number,
    datos: AgregarImagenDto,
    file?: Express.Multer.File
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);

    // Debe haber URL o archivo
    if (!datos.url && !file) {
      throw new ErrorApi("Debes proporcionar una URL o subir un archivo de imagen", 400);
    }

    let imagenUrl = datos.url || "";

    // Si hay archivo cargado, subirlo a Cloudinary
    if (file) {
      imagenUrl = await uploadImageToCloudinary(file.buffer);
    }

    return this.repository.agregarImagen(productoId, imagenUrl, datos.orden);
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



  /**
   * Lista solo productos destacados de una tienda (público).
   */
  async listarDestacados(tiendaId: number, filtros: FiltrosProductosDto) {
    const { datos, total } = await this.repository.listar(
      tiendaId,
      { ...filtros, destacado: true },
      true
    );
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  /**
   * Lista solo productos normales (no destacados) de una tienda (público).
   */
  async listarNormales(tiendaId: number, filtros: FiltrosProductosDto) {
    const { datos, total } = await this.repository.listar(
      tiendaId,
      { ...filtros, destacado: false },
      true
    );
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  // ── Categorías ──

  async listarCategorias() {
    return this.repository.listarCategorias();
  }

  async listarCategoriasPorTienda(tiendaId: number) {
    return prisma.categoria.findMany({
      where: {
        activa: true,
        productos: {
          some: {
            tiendaId,
            disponible: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  // ── Excel ──

  async exportarAExcel(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    
    const productos = await prisma.producto.findMany({
      where: { tiendaId: tienda.id },
      include: {
        categoria: true,
        tags: true,
      },
      orderBy: { nombre: 'asc' }
    });

    const data = productos.map((p: any) => ({
      Nombre: p.nombre,
      Descripción: p.descripcion || "",
      Precio: Number(p.precio),
      "Precio Oferta": p.precioOferta ? Number(p.precioOferta) : "",
      Moneda: p.moneda,
      Categoría: (p as any).categoria?.nombre || "",
      Tags: (p as any).tags.map((t: any) => t.nombre).join(", "),
      Disponible: p.disponible ? "SÍ" : "NO",
      Destacado: p.destacado ? "SÍ" : "NO",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  async importarDesdeExcel(usuarioId: number, buffer: Buffer) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    let creados = 0;
    let actualizados = 0;

    // Obtenemos categorías existentes para mapear por nombre
    const categorias = await this.repository.listarCategorias();

    for (const row of data) {
      const nombre = row.Nombre?.toString().trim();
      if (!nombre) continue;

      const categoriaNombre = row.Categoría?.toString().trim();
      const categoria = categorias.find((c: any) => c.nombre.toLowerCase() === categoriaNombre?.toLowerCase());

      const rowTags = row.Tags?.toString().split(",").map((t: string) => t.trim()).filter(Boolean) || [];

      const payload = {
        nombre,
        descripcion: row.Descripción?.toString() || "",
        precio: Number(row.Precio) || 0,
        precioOferta: row["Precio Oferta"] && row["Precio Oferta"] !== "" ? Number(row["Precio Oferta"]) : undefined,
        moneda: row.Moneda?.toString() || "ARS",
        categoriaId: categoria?.id,
        disponible: row.Disponible?.toString().toUpperCase() === "SÍ" || row.Disponible === true,
        destacado: row.Destacado?.toString().toUpperCase() === "SÍ" || row.Destacado === true,
      };

      const existe = await this.repository.buscarPorNombre(nombre, tienda.id);

      if (existe) {
        await this.repository.actualizar(existe.id, {
            ...payload,
        } as any);
        await this.repository.sincronizarTags(existe.id, rowTags);
        actualizados++;
      } else {
        await this.repository.crear({
            tiendaId: tienda.id,
            ...payload as any,
            tags: rowTags,
            variantes: []
        });
        creados++;
      }
    }

    return { creados, actualizados, total: data.length };
  }
}

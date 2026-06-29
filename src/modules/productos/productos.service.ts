import { uploadImageToCloudinary } from '@/utils/cloudinary';
import * as XLSX from 'xlsx';
import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { construirPaginacion } from '../../utils/helpers';
import { TiendasRepository } from '../tiendas/tiendas.repository';
import {
  ActualizarProductoDto,
  ActualizarVarianteDto,
  AgregarImagenDto,
  CrearProductoDto,
  CrearVarianteDto,
  FiltrosProductosDto,
} from './productos.dto';
import { ProductosRepository } from './productos.repository';
import { cacheService } from '../../utils/cache';

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
    const cacheKey = `productos_tienda_${tiendaId}_publicos_${JSON.stringify(filtros)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const { datos, total } = await this.repository.listar(tiendaId, filtros, true);
    const resultado = construirPaginacion(datos, total, filtros.pagina, filtros.limite);
    
    cacheService.set(cacheKey, resultado);
    return resultado;
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
    const cacheKey = `productos_tienda_${tiendaId}_detalle_${productoId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      // Incrementamos vistas de forma asíncrona
      this.repository.incrementarVistas(productoId).catch(console.error);
      return cached;
    }

    const producto = await this.repository.buscarPorId(productoId, tiendaId);
    if (!producto || !producto.disponible) {
      throw new ErrorApi('Producto no encontrado', 404);
    }

    // Incrementamos vistas de forma asíncrona
    this.repository.incrementarVistas(productoId).catch(console.error);

    cacheService.set(cacheKey, producto);
    return producto;
  }

  /**
   * Obtiene un producto del owner (puede estar no disponible).
   */
  async obtenerMiProducto(usuarioId: number, productoId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const producto = await this.repository.buscarPorId(productoId, tienda.id);
    if (!producto) {
      throw new ErrorApi('Producto no encontrado', 404);
    }
    return producto;
  }

  /**
   * Crea un nuevo producto en la tienda del usuario autenticado.
   * Puede recibir la imagen principal como archivo (multer) o como URL
   */
  async crear(usuarioId: number, datos: CrearProductoDto, imagenFile?: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const nombreNormalizado = datos.nombre.trim();

    // Validamos que no exista un producto con el mismo nombre en la tienda.
    const productoExistente = await this.repository.buscarPorNombre(nombreNormalizado, tienda.id);
    if (productoExistente) {
      throw new ErrorApi(`Ya existe un producto con el nombre "${nombreNormalizado}"`, 409);
    }

    // Validamos que precioOferta < precio (doble validación, también está en Zod)
    if (datos.precioOferta && datos.precioOferta >= datos.precio) {
      throw new ErrorApi('El precio de oferta debe ser menor al precio original', 400);
    }

    // Si hay archivo de imagen, lo subimos a Cloudinary
    let imagenPrincipalUrl = datos.imagenPrincipalUrl;
    if (imagenFile) {
      imagenPrincipalUrl = await uploadImageToCloudinary(imagenFile.buffer);
    }

    const stock = Number(datos.stock ?? 0);
    if (Number.isNaN(stock) || stock < 0) {
      throw new ErrorApi('El stock debe ser un número entero mayor o igual a 0', 400);
    }

    const tags = Array.from(
      new Set(
        (datos.tags || [])
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );

    const variantes = (datos.variantes || []).map((variante) => ({
      nombre: variante.nombre.trim(),
      sku: variante.sku?.trim() || undefined,
      precioExtra: Number(variante.precioExtra ?? 0),
      imagenUrl: variante.imagenUrl?.trim() || undefined,
      stock: Number(variante.stock ?? 0),
      disponible: Boolean(variante.disponible),
    }));

    // Si el producto tiene variantes, el stock del producto es la suma de sus variantes
    const stockFinal = variantes.length > 0
      ? variantes.reduce((acc, v) => acc + v.stock, 0)
      : stock;

    const nuevoProducto = await this.repository.crear({
      tiendaId: tienda.id,
      nombre: nombreNormalizado,
      descripcion: datos.descripcion?.trim(),
      precio: Number(datos.precio),
      precioOferta:
        (datos.precioOferta as any) === '' ? undefined : Number(datos.precioOferta),
      moneda: datos.moneda.trim(),
      imagenPrincipalUrl,
      categoriaId: (datos.categoriaId as any) === '' ? undefined : Number(datos.categoriaId),
      disponible: Boolean(datos.disponible),
      destacado: Boolean(datos.destacado),
      stock: stockFinal,
      tags,
      variantes,
    });
    this.invalidarCacheProductos(tienda.id);
    return nuevoProducto;
  }

  /**
   * Actualiza un producto verificando que pertenezca a la tienda del owner.
   */
  async actualizar(usuarioId: number, productoId: number, datos: ActualizarProductoDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const productoActual = await this.verificarProductoOFallar(productoId, tienda.id);

    const sanitizedData = { ...datos } as any;

    if (sanitizedData.nombre) {
      sanitizedData.nombre = sanitizedData.nombre.trim();
      const productoExistente = await this.repository.buscarPorNombre(
        sanitizedData.nombre,
        tienda.id,
        productoId
      );
      if (productoExistente) {
        throw new ErrorApi(`Ya existe un producto con el nombre "${sanitizedData.nombre}"`, 409);
      }
    }

    if (sanitizedData.precioOferta === '') sanitizedData.precioOferta = null;
    if (sanitizedData.categoriaId === '') sanitizedData.categoriaId = undefined;

    if (sanitizedData.stock !== undefined) {
      sanitizedData.stock = Number(sanitizedData.stock);
      if (Number.isNaN(sanitizedData.stock) || sanitizedData.stock < 0) {
        throw new ErrorApi('El stock debe ser un número entero mayor o igual a 0', 400);
      }
    }

    if (sanitizedData.precio !== undefined) {
      sanitizedData.precio = Number(sanitizedData.precio);

      // Histórico de precio: si el nuevo precio BAJA respecto al actual,
      // guardamos el precio viejo en precioAnterior (para mostrar el tachado + %).
      // Si sube o queda igual, limpiamos precioAnterior.
      const precioActual = Number(productoActual.precio);
      if (sanitizedData.precio < precioActual) {
        sanitizedData.precioAnterior = precioActual;
      } else {
        sanitizedData.precioAnterior = null;
      }
    }
    if (sanitizedData.precioOferta !== undefined && sanitizedData.precioOferta !== null) {
      sanitizedData.precioOferta = Number(sanitizedData.precioOferta);
    }
    if (sanitizedData.categoriaId !== undefined) {
      sanitizedData.categoriaId = Number(sanitizedData.categoriaId);
    }

    const actualizado = await this.repository.actualizar(productoId, sanitizedData);
    this.invalidarCacheProductos(tienda.id);
    return actualizado;
  }

  /**
   * Elimina un producto verificando que pertenezca a la tienda del owner.
   */
  async eliminar(usuarioId: number, productoId: number): Promise<void> {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);

    // Verificamos si el producto tiene pedidos asociados para no romper la integridad de datos
    const tienePedidos = await prisma.pedidoItem.count({
      where: { productoId },
    });

    if (tienePedidos > 0) {
      throw new ErrorApi(
        'No se puede eliminar este producto porque ya tiene pedidos asociados. Podes "Ocultarlo" para que deje de estar disponible en la tienda.',
        400
      );
    }

    await this.repository.eliminar(productoId);
    this.invalidarCacheProductos(tienda.id);
  }

  /**
   * Sincroniza los tags de un producto (reemplaza todos los existentes).
   */
  async actualizarTags(usuarioId: number, productoId: number, tags: string[]) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.sincronizarTags(productoId, tags);
    this.invalidarCacheProductos(tienda.id);
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
      throw new ErrorApi('Debes proporcionar una URL o subir un archivo de imagen', 400);
    }

    let imagenUrl = datos.url || '';

    // Si hay archivo cargado, subirlo a Cloudinary
    if (file) {
      imagenUrl = await uploadImageToCloudinary(file.buffer);
    }

    const agregada = await this.repository.agregarImagen(productoId, imagenUrl, datos.orden);
    this.invalidarCacheProductos(tienda.id);
    return agregada;
  }

  async eliminarImagen(usuarioId: number, productoId: number, imagenId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.eliminarImagen(imagenId, productoId);
    this.invalidarCacheProductos(tienda.id);
  }

  // ── Variantes ──

  async crearVariante(usuarioId: number, productoId: number, datos: CrearVarianteDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);

    if (datos.sku) {
      const skuExistente = await this.repository.buscarVariantePorSku(datos.sku.trim(), tienda.id);
      if (skuExistente) {
        throw new ErrorApi(`Ya existe una variante con el SKU "${datos.sku.trim()}"`, 409);
      }
    }

    const variante = await this.repository.crearVariante(productoId, {
      ...datos,
      sku: datos.sku?.trim() || undefined,
      stock: Number(datos.stock || 0),
    });
    await this.sincronizarStockDesdeVariantes(productoId);
    this.invalidarCacheProductos(tienda.id);
    return variante;
  }

  async actualizarVariante(
    usuarioId: number,
    productoId: number,
    varianteId: number,
    datos: ActualizarVarianteDto
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);

    if (datos.sku) {
      const skuExistente = await this.repository.buscarVariantePorSku(
        datos.sku.trim(),
        tienda.id,
        varianteId
      );
      if (skuExistente) {
        throw new ErrorApi(`Ya existe una variante con el SKU "${datos.sku.trim()}"`, 409);
      }
    }

    const variante = await this.repository.actualizarVariante(varianteId, productoId, {
      ...datos,
      sku: datos.sku?.trim() || undefined,
    });
    await this.sincronizarStockDesdeVariantes(productoId);
    this.invalidarCacheProductos(tienda.id);
    return variante;
  }

  async eliminarVariante(usuarioId: number, productoId: number, varianteId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    await this.repository.eliminarVariante(varianteId, productoId);
    await this.sincronizarStockDesdeVariantes(productoId);
    this.invalidarCacheProductos(tienda.id);
  }

  async subirImagenVariante(usuarioId: number, productoId: number, varianteId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.verificarProductoOFallar(productoId, tienda.id);
    
    // Subir a cloudinary
    const imagenUrl = await uploadImageToCloudinary(file.buffer);
    
    // Actualizar la variante
    const variante = await this.repository.actualizarVariante(varianteId, productoId, { imagenUrl });
    this.invalidarCacheProductos(tienda.id);
    return variante;
  }

  private async sincronizarStockDesdeVariantes(productoId: number) {
    const variantes = await prisma.productoVariante.findMany({
      where: { productoId },
      select: { stock: true },
    });
    if (variantes.length === 0) return;
    const stockTotal = variantes.reduce((acc: number, v: { stock: number }) => acc + v.stock, 0);
    await prisma.producto.update({ where: { id: productoId }, data: { stock: stockTotal } });
  }

  // ── Helpers privados ──

  private async obtenerTiendaOFallar(usuarioId: number) {
    const tienda = await this.tiendasRepository.buscarPorUsuarioId(usuarioId);
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda creada', 404);
    return tienda;
  }

  private async verificarProductoOFallar(productoId: number, tiendaId: number) {
    const producto = await this.repository.buscarPorId(productoId, tiendaId);
    if (!producto) throw new ErrorApi('Producto no encontrado', 404);
    return producto;
  }

  private invalidarCacheProductos(tiendaId: number) {
    cacheService.flushPrefix(`productos_tienda_${tiendaId}`);
  }

  /**
   * Lista solo productos destacados de una tienda (público).
   */
  async listarDestacados(tiendaId: number, filtros: FiltrosProductosDto) {
    const cacheKey = `productos_tienda_${tiendaId}_destacados_${JSON.stringify(filtros)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const { datos, total } = await this.repository.listar(
      tiendaId,
      { ...filtros, destacado: true },
      true
    );
    const resultado = construirPaginacion(datos, total, filtros.pagina, filtros.limite);
    cacheService.set(cacheKey, resultado);
    return resultado;
  }

  /**
   * Lista solo productos normales (no destacados) de una tienda (público).
   */
  async listarNormales(tiendaId: number, filtros: FiltrosProductosDto) {
    const cacheKey = `productos_tienda_${tiendaId}_normales_${JSON.stringify(filtros)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const { datos, total } = await this.repository.listar(
      tiendaId,
      { ...filtros, destacado: false },
      true
    );
    const resultado = construirPaginacion(datos, total, filtros.pagina, filtros.limite);
    cacheService.set(cacheKey, resultado);
    return resultado;
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
            disponible: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // ── Excel ──

  async exportarAExcel(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);

    const productos = await prisma.producto.findMany({
      where: { tiendaId: tienda.id },
      include: { categoria: true, tags: true },
      orderBy: { nombre: 'asc' },
    });

    const data = productos.map((p: any) => ({
      Nombre: p.nombre,
      Descripción: p.descripcion || '',
      Precio: Number(p.precio),
      'Precio Oferta': p.precioOferta ? Number(p.precioOferta) : '',
      Moneda: p.moneda,
      Stock: p.stock ?? 0,
      Categoría: p.categoria?.nombre || '',
      Tags: p.tags.map((t: any) => t.nombre).join(', '),
      Disponible: p.disponible ? 'SÍ' : 'NO',
      Destacado: p.destacado ? 'SÍ' : 'NO',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importarDesdeExcel(usuarioId: number, buffer: Buffer) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    if (!data.length) throw new ErrorApi('El archivo Excel está vacío o no tiene el formato correcto', 400);

    let creados = 0;
    let actualizados = 0;
    const errores: string[] = [];

    const categorias = await this.repository.listarCategorias();

    for (const [i, row] of data.entries()) {
      const fila = i + 2; // Excel empieza en fila 2 (fila 1 = headers)
      const nombre = row.Nombre?.toString().trim();
      if (!nombre) { errores.push(`Fila ${fila}: nombre vacío, se omitió`); continue; }

      const precio = Number(row.Precio);
      if (!precio || precio <= 0) { errores.push(`Fila ${fila}: precio inválido para "${nombre}", se omitió`); continue; }

      const categoriaNombre = row.Categoría?.toString().trim();
      const categoria = categorias.find(
        (c: any) => c.nombre.toLowerCase() === categoriaNombre?.toLowerCase()
      );

      const rowTags: string[] = row.Tags
        ? row.Tags.toString().split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      const precioOfertaRaw = row['Precio Oferta'];
      const precioOferta = precioOfertaRaw !== '' && precioOfertaRaw != null
        ? Number(precioOfertaRaw)
        : undefined;

      const payload = {
        nombre,
        descripcion: row.Descripción?.toString().trim() || '',
        precio,
        precioOferta: precioOferta && precioOferta < precio ? precioOferta : undefined,
        moneda: row.Moneda?.toString().toUpperCase() || 'ARS',
        stock: Number(row.Stock ?? 0),
        categoriaId: categoria?.id,
        disponible: row.Disponible?.toString().toUpperCase() === 'SÍ' || row.Disponible === true,
        destacado: row.Destacado?.toString().toUpperCase() === 'SÍ' || row.Destacado === true,
      };

      try {
        const existe = await this.repository.buscarPorNombre(nombre, tienda.id);
        if (existe) {
          await this.repository.actualizar(existe.id, payload as any);
          await this.repository.sincronizarTags(existe.id, rowTags);
          actualizados++;
        } else {
          await this.repository.crear({
            tiendaId: tienda.id,
            ...(payload as any),
            tags: rowTags,
            variantes: [],
          });
          creados++;
        }
      } catch (e: any) {
        errores.push(`Fila ${fila} "${nombre}": ${e.message}`);
      }
    }

    this.invalidarCacheProductos(tienda.id);
    return { creados, actualizados, total: data.length, errores };
  }
}

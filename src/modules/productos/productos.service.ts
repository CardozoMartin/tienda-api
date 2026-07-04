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
      color: variante.color?.trim() || undefined,
      talle: variante.talle?.trim() || undefined,
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

    const guiaTallesId = await this.resolverGuiaTalles(tienda.id, datos.guiaTallesId);

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
      guiaTallesId,
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

    // Guía de talles: '' / null → desasociar; número → validar pertenencia
    if ('guiaTallesId' in sanitizedData) {
      sanitizedData.guiaTallesId = await this.resolverGuiaTalles(
        tienda.id,
        sanitizedData.guiaTallesId
      );
    }

    if (sanitizedData.stock !== undefined) {
      // Si el producto tiene variantes, el stock se calcula desde ellas: ignoramos el valor manual
      if ((productoActual as any).variantes?.length > 0) {
        delete sanitizedData.stock;
      } else {
        sanitizedData.stock = Number(sanitizedData.stock);
        if (Number.isNaN(sanitizedData.stock) || sanitizedData.stock < 0) {
          throw new ErrorApi('El stock debe ser un número entero mayor o igual a 0', 400);
        }
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

    // Si la variante tiene color, la foto es "del color": la propagamos a todas
    // las variantes del mismo color (ej: la foto de la camisa negra aplica a Negro/S, Negro/M, Negro/L)
    if (variante.color) {
      await prisma.productoVariante.updateMany({
        where: { productoId, color: variante.color, NOT: { id: varianteId } },
        data: { imagenUrl },
      });
    }

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

  /**
   * Resuelve el guiaTallesId de un payload:
   * - '' / null / undefined → null (sin guía)
   * - número → valida que la guía pertenezca a la tienda; si no, error
   */
  private async resolverGuiaTalles(
    tiendaId: number,
    valor: number | '' | null | undefined
  ): Promise<number | null> {
    if (valor === '' || valor === null || valor === undefined) return null;
    const id = Number(valor);
    const guia = await prisma.guiaTalles.findFirst({
      where: { id, tiendaId },
      select: { id: true },
    });
    if (!guia) throw new ErrorApi('La guía de talles seleccionada no existe', 400);
    return id;
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
      include: { categoria: true, tags: true, variantes: true },
      orderBy: { nombre: 'asc' },
    });

    // Hoja 1: Productos. El stock de los que tienen variantes se calcula desde ellas,
    // por eso mostramos "(según variantes)" en vez de un número editable.
    const dataProductos = productos.map((p: any) => ({
      Nombre: p.nombre,
      Descripción: p.descripcion || '',
      Precio: Number(p.precio),
      'Precio Oferta': p.precioOferta ? Number(p.precioOferta) : '',
      Moneda: p.moneda,
      Stock: p.variantes.length > 0 ? '(según variantes)' : (p.stock ?? 0),
      Categoría: p.categoria?.nombre || '',
      Tags: p.tags.map((t: any) => t.nombre).join(', '),
      Disponible: p.disponible ? 'SÍ' : 'NO',
      Destacado: p.destacado ? 'SÍ' : 'NO',
    }));

    // Hoja 2: Variantes (una fila por combinación, asociada al producto por su nombre)
    const dataVariantes: any[] = [];
    for (const p of productos as any[]) {
      for (const v of p.variantes) {
        dataVariantes.push({
          Producto: p.nombre,
          Color: v.color || '',
          Talle: v.talle || '',
          Nombre: v.nombre, // por si es una variante sin color/talle estructurado
          Stock: v.stock ?? 0,
          'Extra $': Number(v.precioExtra ?? 0),
          SKU: v.sku || '',
          Disponible: v.disponible ? 'SÍ' : 'NO',
        });
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dataProductos), 'Productos');
    // Si no hay variantes, igual dejamos la hoja con los encabezados como guía
    const hojaVariantes = dataVariantes.length
      ? XLSX.utils.json_to_sheet(dataVariantes)
      : XLSX.utils.json_to_sheet([
          { Producto: '', Color: '', Talle: '', Nombre: '', Stock: '', 'Extra $': '', SKU: '', Disponible: '' },
        ]);
    XLSX.utils.book_append_sheet(workbook, hojaVariantes, 'Variantes');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importarDesdeExcel(usuarioId: number, buffer: Buffer) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    if (!data.length) throw new ErrorApi('El archivo Excel está vacío o no tiene el formato correcto', 400);

    // Hoja "Variantes" (opcional): agrupamos por nombre de producto (case-insensitive)
    const variantesPorProducto = this.leerVariantesDelExcel(workbook);

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
        // El texto "(según variantes)" que exportamos no es un número: lo tomamos como 0.
        // Si el producto tiene variantes, el stock se recalcula al reemplazarlas.
        stock: Number.isFinite(Number(row.Stock)) ? Number(row.Stock) : 0,
        categoriaId: categoria?.id,
        disponible: row.Disponible?.toString().toUpperCase() === 'SÍ' || row.Disponible === true,
        destacado: row.Destacado?.toString().toUpperCase() === 'SÍ' || row.Destacado === true,
      };

      // Variantes de este producto en la hoja "Variantes" (si las hay)
      const variantesRow = variantesPorProducto.get(nombre.toLowerCase()) ?? [];

      try {
        let productoId: number;
        const existe = await this.repository.buscarPorNombre(nombre, tienda.id);
        if (existe) {
          await this.repository.actualizar(existe.id, payload as any);
          await this.repository.sincronizarTags(existe.id, rowTags);
          productoId = existe.id;
          actualizados++;
        } else {
          const nuevo = await this.repository.crear({
            tiendaId: tienda.id,
            ...(payload as any),
            tags: rowTags,
            variantes: [],
          });
          productoId = (nuevo as any).id;
          creados++;
        }

        // El Excel es la fuente de verdad: reemplazamos las variantes del producto
        // (solo si vinieron variantes para él en la hoja).
        if (variantesRow.length > 0) {
          await this.repository.reemplazarVariantes(productoId, variantesRow);
        }
      } catch (e: any) {
        errores.push(`Fila ${fila} "${nombre}": ${e.message}`);
      }
    }

    this.invalidarCacheProductos(tienda.id);
    return { creados, actualizados, total: data.length, errores };
  }

  // Lee la hoja "Variantes" del workbook y las agrupa por nombre de producto (minúsculas).
  private leerVariantesDelExcel(workbook: XLSX.WorkBook) {
    const mapa = new Map<
      string,
      Array<{ nombre: string; color?: string; talle?: string; sku?: string; precioExtra: number; stock: number; disponible: boolean }>
    >();

    // Buscamos la hoja llamada "Variantes" (case-insensitive)
    const hojaNombre = workbook.SheetNames.find((n) => n.trim().toLowerCase() === 'variantes');
    if (!hojaNombre) return mapa;

    const filas = XLSX.utils.sheet_to_json<any>(workbook.Sheets[hojaNombre]);
    for (const row of filas) {
      const producto = row.Producto?.toString().trim();
      if (!producto) continue;

      const color = row.Color?.toString().trim() || undefined;
      const talle = row.Talle?.toString().trim() || undefined;
      // Nombre legible: usa la columna Nombre si vino, si no arma "Color / Talle"
      const nombreExplicito = row.Nombre?.toString().trim();
      const nombre =
        nombreExplicito ||
        [color, talle].filter(Boolean).join(' / ') ||
        'Único';

      const stock = Number(row.Stock ?? 0);
      const precioExtra = Number(row['Extra $'] ?? row.Extra ?? 0);

      const clave = producto.toLowerCase();
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push({
        nombre,
        color,
        talle,
        sku: row.SKU?.toString().trim() || undefined,
        precioExtra: Number.isFinite(precioExtra) && precioExtra > 0 ? precioExtra : 0,
        stock: Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 0,
        disponible:
          row.Disponible === undefined ||
          row.Disponible?.toString().toUpperCase() === 'SÍ' ||
          row.Disponible?.toString().toUpperCase() === 'SI' ||
          row.Disponible === true,
      });
    }
    return mapa;
  }
}

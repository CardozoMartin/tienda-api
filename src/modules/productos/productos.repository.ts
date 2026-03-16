// Repository de productos.
// Solo acceso a datos, sin lógica de negocio.
import { prisma } from "../../config/prisma";
import { calcularSkip } from "../../utils/helpers";
import { FiltrosProductosDto } from "./productos.dto";

// Usamos el tipo de retorno inferido de Prisma para no depender del cliente generado.
// Una vez que se ejecuta `prisma generate`, estos tipos se vuelven completamente seguros.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WhereInput = Record<string, any>;

const INCLUDE_PRODUCTO = {
  categoria: true,
  imagenes: { orderBy: { orden: "asc" as const } },
  variantes: true,
  tags: true,
  _count: { select: { resenas: true } },
} as const;

export class ProductosRepository {
  /**
   * Busca un producto por ID verificando que pertenezca a la tienda indicada.
   * La verificación de tienda evita que un owner acceda a productos de otra tienda.
   */
  async buscarPorId(productoId: number, tiendaId?: number) {
    return prisma.producto.findFirst({
      where: {
        id: productoId,
        ...(tiendaId && { tiendaId }),
      },
      include: INCLUDE_PRODUCTO,
    });
  }

  /**
   * Lista productos de una tienda con filtros y paginación.
   */
  async listar(
    tiendaId: number,
    filtros: FiltrosProductosDto,
    soloPublicos: boolean = true
  ): Promise<{ datos: unknown[]; total: number }> {
    // Construimos el where dinámicamente según los filtros recibidos
    const where: WhereInput = {
      tiendaId,
      ...(soloPublicos && { disponible: true }),
      // Filtro de disponible solo aplica para el owner (soloPublicos = false)
      ...(filtros.disponible !== undefined && !soloPublicos && { disponible: filtros.disponible }),
      ...(filtros.destacado !== undefined && { destacado: filtros.destacado }),
      ...(filtros.categoriaId && { categoriaId: filtros.categoriaId }),
      // Búsqueda por nombre o descripción
      ...(filtros.busqueda && {
        OR: [
          { nombre: { contains: filtros.busqueda } },
          { descripcion: { contains: filtros.busqueda } },
        ],
      }),
      // Filtro por rango de precio
      ...(filtros.precioMin !== undefined || filtros.precioMax !== undefined
        ? {
            precio: {
              ...(filtros.precioMin !== undefined && { gte: filtros.precioMin }),
              ...(filtros.precioMax !== undefined && { lte: filtros.precioMax }),
            },
          }
        : {}),
      // Filtro por tags (cualquier coincidencia)
      ...(filtros.tags && {
        tags: {
          some: { nombre: { in: filtros.tags.split(",").map((t) => t.trim()) } },
        },
      }),
    };

    const [datos, total] = await prisma.$transaction([
      prisma.producto.findMany({
        where,
        skip: calcularSkip(filtros.pagina, filtros.limite),
        take: filtros.limite,
        orderBy: { [filtros.orden]: filtros.direccion },
        include: INCLUDE_PRODUCTO,
      }),
      prisma.producto.count({ where }),
    ]);

    return { datos, total };
  }

  /**
   * Crea un producto con sus variantes y tags.
   * Los tags se crean si no existen (connectOrCreate).
   */
  async crear(datos: {
    tiendaId: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    precioOferta?: number;
    moneda: string;
    imagenPrincipalUrl?: string;
    categoriaId?: number;
    disponible: boolean;
    destacado: boolean;
    tags: string[];
    variantes: Array<{
      nombre: string;
      sku?: string;
      precioExtra: number;
      imagenUrl?: string;
      disponible: boolean;
    }>;
  }) {
    const { tags, variantes, ...datosPrincipales } = datos;

    return prisma.producto.create({
      data: {
        ...datosPrincipales,
        // Creamos las variantes en la misma operación
        variantes: { create: variantes },
        // connectOrCreate: crea el tag si no existe, o lo conecta si ya existe
        tags: {
          connectOrCreate: tags.map((nombre) => ({
            where: { nombre },
            create: { nombre },
          })),
        },
      },
      include: INCLUDE_PRODUCTO,
    });
  }

  /**
   * Actualiza los campos de un producto.
   */
  async actualizar(productoId: number, datos: WhereInput) {
    return prisma.producto.update({
      where: { id: productoId },
      data: datos,
      include: INCLUDE_PRODUCTO,
    });
  }

  /**
   * Elimina un producto (en cascada sus imágenes, variantes y relaciones de tags).
   */
  async eliminar(productoId: number): Promise<void> {
    await prisma.producto.delete({ where: { id: productoId } });
  }

  /**
   * Sincroniza los tags de un producto:
   * Desconecta todos los actuales y conecta los nuevos.
   */
  async sincronizarTags(productoId: number, tags: string[]): Promise<void> {
    await prisma.producto.update({
      where: { id: productoId },
      data: {
        tags: {
          // set: [] desconecta todos los tags actuales
          set: [],
          connectOrCreate: tags.map((nombre) => ({
            where: { nombre },
            create: { nombre },
          })),
        },
      },
    });
  }

  /**
   * Incrementa el contador de vistas de un producto.
   */
  async incrementarVistas(productoId: number): Promise<void> {
    await prisma.producto.update({
      where: { id: productoId },
      data: { vistas: { increment: 1 } },
    });
  }

  // ── Imágenes ──

  async agregarImagen(productoId: number, url: string, orden: number) {
    return prisma.productoImagen.create({ data: { productoId, url, orden } });
  }

  async eliminarImagen(imagenId: number, productoId: number): Promise<void> {
    await prisma.productoImagen.deleteMany({ where: { id: imagenId, productoId } });
  }

  // ── Variantes ──

  async crearVariante(
    productoId: number,
    datos: {
      nombre: string;
      sku?: string;
      precioExtra: number;
      imagenUrl?: string;
      disponible: boolean;
    }
  ) {
    return prisma.productoVariante.create({ data: { productoId, ...datos } });
  }

  async actualizarVariante(varianteId: number, productoId: number, datos: WhereInput) {
    return prisma.productoVariante.updateMany({
      where: { id: varianteId, productoId },
      data: datos,
    });
  }

  async eliminarVariante(varianteId: number, productoId: number): Promise<void> {
    await prisma.productoVariante.deleteMany({ where: { id: varianteId, productoId } });
  }
}

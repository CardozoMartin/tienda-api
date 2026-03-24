import { prisma } from '../../config/prisma';
import { calcularSkip } from '../../utils/helpers';
import { FiltrosProductosDto } from './productos.dto';

type WhereInput = Record<string, any>;

const INCLUDE_PRODUCTO = {
  categoria: true,
  imagenes: { orderBy: { orden: 'asc' as const } },
  variantes: true,
  tags: true,
  _count: { select: { resenas: true } },
} as const;

export class ProductosRepository {
  /// Busca un producto por ID, opcionalmente filtrando por tiendaId para asegurar que pertenece a la tienda.
  async buscarPorId(productoId: number, tiendaId?: number) {
    return prisma.producto.findFirst({
      where: {
        id: productoId,
        ...(tiendaId && { tiendaId }),
      },
      include: INCLUDE_PRODUCTO,
    });
  }

  // Busca un producto por su nombre exacto dentro de una tienda (para evitar duplicados al crear/actualizar)
  async buscarPorNombre(nombre: string, tiendaId: number) {
    return prisma.producto.findFirst({
      where: { nombre, tiendaId },
      include: { id: true } as any,
    });
  }

  // ── Operaciones principales ──
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
          some: { nombre: { in: filtros.tags.split(',').map((t) => t.trim()) } },
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

  // Crea un nuevo producto junto con sus variantes y tags en una sola operación atómica.
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

  // Actualiza un producto y opcionalmente sus variantes. No actualiza tags ni imágenes (se manejan con métodos específicos).
  async actualizar(productoId: number, datos: WhereInput) {
    return prisma.producto.update({
      where: { id: productoId },
      data: datos,
      include: INCLUDE_PRODUCTO,
    });
  }

  // Elimina un producto por ID. Las relaciones con variantes, imágenes y tags se eliminan automáticamente si están configuradas con onDelete: "cascade" en el esquema de Prisma.
  async eliminar(productoId: number): Promise<void> {
    await prisma.producto.delete({ where: { id: productoId } });
  }

  // Sincroniza los tags de un producto: elimina los actuales y conecta/crea los nuevos según el array recibido.
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

  // Incrementa el contador de vistas de un producto (se llama cada vez que se obtiene un producto público).
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

  // ── Categorías (Globales) ──

  async listarCategorias() {
    return prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        slug: true,
        padreId: true,
      },
    });
  }
}

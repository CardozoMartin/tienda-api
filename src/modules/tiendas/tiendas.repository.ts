// Repository de tiendas.
// Solo acceso a datos, sin lógica de negocio.
import { prisma } from '../../config/prisma';
import { calcularSkip } from '../../utils/helpers';
import { ActualizarTemaDto, FiltrosTiendasDto } from './tiendas.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WhereInput = Record<string, any>;

export class TiendasRepository {
  /**
   * Busca una tienda por su slug (identificador único en la URL).
   * Incluye todas las relaciones para mostrar la tienda completa al público.
   */
  async buscarPorSlug(slug: string): Promise<unknown> {
    return prisma.tienda.findUnique({
      where: { slug },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, avatarUrl: true } },
        plantilla: true,
        temaConfig: true,
        metodosPago: { include: { metodoPago: true } },
        metodosEntrega: { include: { metodoEntrega: true } },
        carrusel: { where: { activa: true }, orderBy: { orden: 'asc' } },
        _count: { select: { productos: true, resenas: true } },
      },
    });
  }

  /**
   * Busca la tienda de un usuario por su ID de usuario.
   * Un usuario solo puede tener una tienda (relación @unique).
   */
  async buscarPorUsuarioId(usuarioId: number): Promise<any> {
    return prisma.tienda.findUnique({
      where: { usuarioId },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, avatarUrl: true } },
        plantilla: true,
        temaConfig: true,
        metodosPago: { include: { metodoPago: true } },
        metodosEntrega: { include: { metodoEntrega: true } },
        carrusel: { where: { activa: true }, orderBy: { orden: 'asc' } },
        _count: { select: { productos: true, resenas: true } },
      },
    });
  }

  /**
   * Busca una tienda por su ID.
   */
  async buscarPorId(id: number): Promise<any> {
    return prisma.tienda.findUnique({ where: { id } });
  }

  /**
   * Verifica si un slug ya está en uso. Útil para validar unicidad antes de crear.
   */
  async existeSlug(slug: string, excluirId?: number): Promise<boolean> {
    const tienda = await prisma.tienda.findFirst({
      where: {
        slug,
        // Si excluirId está presente, excluimos esa tienda de la búsqueda (para updates)
        ...(excluirId && { id: { not: excluirId } }),
      },
      select: { id: true },
    });
    return tienda !== null;
  }

  /**
   * Crea una nueva tienda con su configuración de tema inicial.
   * Usamos una transacción para garantizar que ambas operaciones se completen juntas.
   */
  async crear(datos: {
    usuarioId: number;
    slug: string;
    nombre: string;
    titulo?: string;
    descripcion?: string;
    plantillaId?: number;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    sitioWeb?: string;
    pais?: string;
    provincia?: string;
    ciudad?: string;
  }): Promise<unknown> {
    return prisma.$transaction(async (tx: any) => {
      // EXPLICACIÓN: tx es un cliente de Prisma transaccional
      // El tipo 'any' se usa porque Prisma no exporta un tipo específico para tx
      // Creamos la tienda
      const tienda = await tx.tienda.create({ data: datos });

      // Creamos la configuración de tema por defecto
      await tx.tiendaTemaConfig.create({
        data: {
          tiendaId: tienda.id,
          seccionesVisibles: {
            navbar: true,
            hero: true,
            carrusel: false,
            galeria: false,
            productos: true,
            sobreNosotros: false,
            contacto: true,
            footer: true,
          },
        },
      });

      // Retornamos la tienda completa con todas sus relaciones
      return tx.tienda.findUniqueOrThrow({
        where: { id: tienda.id },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, avatarUrl: true } },
          plantilla: true,
          temaConfig: true,
          metodosPago: { include: { metodoPago: true } },
          metodosEntrega: { include: { metodoEntrega: true } },
          carrusel: { where: { activa: true }, orderBy: { orden: 'asc' } },
          _count: { select: { productos: true, resenas: true } },
        },
      });
    });
  }

  /**
   * Actualiza los datos básicos de una tienda.
   */
  async actualizar(id: number, datos: WhereInput): Promise<unknown> {
    return prisma.tienda.update({
      where: { id },
      data: datos,
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, avatarUrl: true } },
        plantilla: true,
        temaConfig: true,
        metodosPago: { include: { metodoPago: true } },
        metodosEntrega: { include: { metodoEntrega: true } },
        carrusel: { where: { activa: true }, orderBy: { orden: 'asc' } },
        _count: { select: { productos: true, resenas: true } },
      },
    });
  }

  /**
   * Actualiza la configuración de tema de una tienda.
   * Usa upsert porque la config puede no existir aún.
   */
  async actualizarTema(tiendaId: number, datos: ActualizarTemaDto) {
    return prisma.tiendaTemaConfig.upsert({
      where: { tiendaId },
      update: datos,
      create: { tiendaId, ...datos },
    });
  }

  /**
   * Lista tiendas públicas con filtros y paginación.
   */
  async listar(filtros: FiltrosTiendasDto): Promise<{ datos: unknown[]; total: number }> {
    const where: WhereInput = {
      activa: true,
      publica: true,
      // Filtro de búsqueda por nombre o descripción
      ...(filtros.busqueda && {
        OR: [
          { nombre: { contains: filtros.busqueda } },
          { descripcion: { contains: filtros.busqueda } },
          { ciudad: { contains: filtros.busqueda } },
        ],
      }),
      ...(filtros.ciudad && { ciudad: { contains: filtros.ciudad } }),
      ...(filtros.provincia && { provincia: { contains: filtros.provincia } }),
    };

    const [datos, total] = await prisma.$transaction([
      prisma.tienda.findMany({
        where,
        skip: calcularSkip(filtros.pagina, filtros.limite),
        take: filtros.limite,
        orderBy: { [filtros.orden]: filtros.direccion },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, avatarUrl: true } },
          plantilla: true,
          temaConfig: true,
          metodosPago: { include: { metodoPago: true } },
          metodosEntrega: { include: { metodoEntrega: true } },
          carrusel: { where: { activa: true }, orderBy: { orden: 'asc' } },
          _count: { select: { productos: true, resenas: true } },
        },
      }),
      prisma.tienda.count({ where }),
    ]);

    return { datos, total };
  }

  /**
   * Incrementa el contador de vistas de una tienda.
   * Operación atómica para evitar race conditions.
   */
  async incrementarVistas(id: number): Promise<void> {
    await prisma.tienda.update({
      where: { id },
      data: { vistas: { increment: 1 } },
    });
  }

  // ── Métodos de pago ──

  async agregarMetodoPago(tiendaId: number, metodoPagoId: number, detalle?: string) {
    return prisma.metodoPagoTienda.create({
      data: { tiendaId, metodoPagoId, detalle },
      include: { metodoPago: true },
    });
  }

  async eliminarMetodoPago(tiendaId: number, metodoPagoId: number): Promise<void> {
    await prisma.metodoPagoTienda.delete({
      where: { tiendaId_metodoPagoId: { tiendaId, metodoPagoId } },
    });
  }

  // ── Métodos de entrega ──

  async agregarMetodoEntrega(
    tiendaId: number,
    metodoEntregaId: number,
    zonaCobertura?: string,
    detalle?: string
  ) {
    return prisma.metodoEntregaTienda.create({
      data: { tiendaId, metodoEntregaId, zonaCobertura, detalle },
      include: { metodoEntrega: true },
    });
  }

  async eliminarMetodoEntrega(tiendaId: number, metodoEntregaId: number): Promise<void> {
    await prisma.metodoEntregaTienda.delete({
      where: { tiendaId_metodoEntregaId: { tiendaId, metodoEntregaId } },
    });
  }

  // ── Carrusel ──

  async agregarImagenCarrusel(
    tiendaId: number,
    datos: { url: string; titulo?: string; subtitulo?: string; linkUrl?: string; orden: number }
  ) {
    return prisma.carruselImagen.create({ data: { tiendaId, ...datos } });
  }

  async eliminarImagenCarrusel(imagenId: number, tiendaId: number): Promise<void> {
    await prisma.carruselImagen.deleteMany({
      where: { id: imagenId, tiendaId }, // Verificamos que pertenezca a la tienda
    });
  }

  async reordenarCarrusel(
    tiendaId: number,
    orden: Array<{ id: number; orden: number }>
  ): Promise<void> {
    // Actualizamos el orden de cada imagen en paralelo dentro de una transacción
    await prisma.$transaction(
      orden.map(({ id, orden: nuevoOrden }) =>
        prisma.carruselImagen.updateMany({
          where: { id, tiendaId },
          data: { orden: nuevoOrden },
        })
      )
    );
  }
}

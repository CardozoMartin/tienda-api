import { prisma } from '@/config/prisma';
import { calcularSkip } from '@/utils/helpers';
import { Prisma } from '@prisma/client';
import { FiltrosResenasDto } from './resentas.dto';

export class ResenasRepository {
  //Query para las reseñas de la cientas

  async crearResenaTienda(datos: {
    tiendaId: number;
    clienteId?: number;
    autorNombre?: string;
    calificacion: number;
    comentario?: string;
  }) {
    return prisma.resenaTienda.create({ data: datos });
  }

  async listarResenasTienda(tiendaId: number, filtros: FiltrosResenasDto) {
    const where: Prisma.ResenaTiendaWhereInput = {
      tiendaId,
      eliminada: false,
      ...(filtros.soloAprobadas && { aprobada: true }),
      ...(filtros.calificacionMin && { calificacion: { gte: filtros.calificacionMin } }),
    };

    const [datos, total] = await prisma.$transaction([
      prisma.resenaTienda.findMany({
        where,
        skip: calcularSkip(filtros.pagina, filtros.limite),
        take: filtros.limite,
        orderBy: { [filtros.orden]: filtros.direccion },
        include: {
          cliente: { select: { id: true, nombre: true, email: true } },
        },
      }),
      prisma.resenaTienda.count({ where }),
    ]);

    return { datos, total };
  }

  async obtenerEstadisticasTienda(tiendaId: number) {
    const resultado = await prisma.resenaTienda.aggregate({
      where: { tiendaId, aprobada: true, eliminada: false },
      _avg: { calificacion: true },
      _count: { calificacion: true },
    });

    const distribucion = await prisma.resenaTienda.groupBy({
      by: ['calificacion'],
      where: { tiendaId, aprobada: true, eliminada: false },
      _count: { calificacion: true },
      orderBy: { calificacion: 'asc' },
    });

    return {
      promedio: resultado._avg.calificacion
        ? parseFloat(resultado._avg.calificacion.toFixed(1))
        : 0,
      total: resultado._count.calificacion,
      distribucion: distribucion.map((d: any) => ({
        calificacion: d.calificacion,
        cantidad: d._count.calificacion,
      })),
    };
  }

  async aprobarResenaTienda(resenaId: number): Promise<void> {
    await prisma.resenaTienda.update({
      where: { id: resenaId },
      data: { aprobada: true, eliminada: false },
    });
  }

  async rechazarResenaTienda(resenaId: number): Promise<void> {
    await prisma.resenaTienda.update({
      where: { id: resenaId },
      data: { eliminada: true, aprobada: false },
    });
  }

  async responderResenaTienda(
    resenaId: number,
    respuesta: string,
    tiendaId: number
  ): Promise<void> {
    await prisma.resenaTienda.updateMany({
      where: { id: resenaId, tiendaId },
      data: { respuesta, respuestaEn: new Date() },
    });
  }

  async eliminarResenaTienda(resenaId: number): Promise<void> {
    await prisma.resenaTienda.update({
      where: { id: resenaId },
      data: { eliminada: true },
    });
  }

  async listarPendientesTienda(tiendaId: number) {
    return prisma.resenaTienda.findMany({
      where: { tiendaId, aprobada: false, eliminada: false },
      orderBy: { creadoEn: 'asc' },
      include: {
        cliente: { select: { id: true, nombre: true, email: true } },
      },
    });
  }

  // Query para las reseñas de los comentarios de los productos

  async crearResenaProducto(datos: {
    productoId: number;
    clienteId?: number;
    autorNombre?: string;
    calificacion: number;
    comentario?: string;
    imagenUrl?: string;
  }) {
    return prisma.resenaProducto.create({ data: datos });
  }

  async actualizarImagenResenaProducto(resenaId: number, imagenUrl: string) {
    return prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { imagenUrl },
    });
  }

  async listarResenasProducto(productoId: number, filtros: FiltrosResenasDto) {
    const where: Prisma.ResenaProductoWhereInput = {
      productoId,
      eliminada: false,
      ...(filtros.soloAprobadas && { aprobada: true }),
      ...(filtros.calificacionMin && { calificacion: { gte: filtros.calificacionMin } }),
    };

    const [datos, total] = await prisma.$transaction([
      prisma.resenaProducto.findMany({
        where,
        skip: calcularSkip(filtros.pagina, filtros.limite),
        take: filtros.limite,
        orderBy: { [filtros.orden]: filtros.direccion },
        include: {
          cliente: { select: { id: true, nombre: true, email: true } },
        },
      }),
      prisma.resenaProducto.count({ where }),
    ]);

    return { datos, total };
  }

  async obtenerEstadisticasProducto(productoId: number) {
    const resultado = await prisma.resenaProducto.aggregate({
      where: { productoId, aprobada: true, eliminada: false },
      _avg: { calificacion: true },
      _count: { calificacion: true },
    });

    const distribucion = await prisma.resenaProducto.groupBy({
      by: ['calificacion'],
      where: { productoId, aprobada: true, eliminada: false },
      _count: { calificacion: true },
      orderBy: { calificacion: 'asc' },
    });

    return {
      promedio: resultado._avg.calificacion
        ? parseFloat(resultado._avg.calificacion.toFixed(1))
        : 0,
      total: resultado._count.calificacion,
      distribucion: distribucion.map((d: any) => ({
        calificacion: d.calificacion,
        cantidad: d._count.calificacion,
      })),
    };
  }

  async aprobarResenaProducto(resenaId: number): Promise<void> {
    await prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { aprobada: true, eliminada: false },
    });
  }

  async rechazarResenaProducto(resenaId: number): Promise<void> {
    await prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { eliminada: true, aprobada: false },
    });
  }

  async responderResenaProducto(
    resenaId: number,
    respuesta: string,
    productoId: number
  ): Promise<void> {
    await prisma.resenaProducto.updateMany({
      where: { id: resenaId, productoId },
      data: { respuesta, respuestaEn: new Date() },
    });
  }

  async eliminarResenaProducto(resenaId: number): Promise<void> {
    await prisma.resenaProducto.update({
      where: { id: resenaId },
      data: { eliminada: true },
    });
  }

  async listarPendientesProductos(tiendaId: number) {
    return prisma.resenaProducto.findMany({
      where: {
        aprobada: false,
        eliminada: false,
        producto: { tiendaId },
      },
      orderBy: { creadoEn: 'asc' },
      include: {
        producto: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, nombre: true, email: true } },
      },
    });
  }
}

import { prisma } from '../../config/prisma';
import { EstadoPedido } from '@prisma/client';
import { calcularSkip } from '../../utils/helpers';

export class PedidosRepository {
  async crear(datos: any) {
    const { items, ...pedidoData } = datos;

    return prisma.$transaction(async (tx: any) => {
      const pedido = await tx.pedido.create({
        data: {
          ...pedidoData,
          items: {
            create: items.map((item: any) => ({
              productoId: item.productoId,
              varianteId: item.varianteId,
              nombreProd: item.nombreProd,
              nombreVar: item.nombreVar,
              imagenUrl: item.imagenUrl,
              cantidad: item.cantidad,
              precioUnit: item.precioUnit,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
          metodoEntrega: true,
          metodoPago: true,
        },
      });

      return pedido;
    });
  }

  async buscarPorId(id: number) {
    return prisma.pedido.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: true,
            variante: true,
          },
        },
        metodoEntrega: true,
        metodoPago: true,
        tienda: true,
      },
    });
  }

  async listar(filtros: any) {
    let { tiendaId, clienteId, estado, pagina = 1, limite = 10 } = filtros;
    
    // Asegurar tipos numéricos para Prisma
    pagina = Number(pagina);
    limite = Number(limite);

    const where: any = {};
    if (tiendaId) where.tiendaId = Number(tiendaId);
    if (clienteId) where.clienteId = Number(clienteId);
    if (estado) where.estado = estado;

    const [datos, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where,
        skip: calcularSkip(pagina, limite),
        take: limite,
        orderBy: { creadoEn: 'desc' },
        include: {
          _count: { select: { items: true } },
          metodoEntrega: true,
          metodoPago: true,
        },
      }),
      prisma.pedido.count({ where }),
    ]);

    return { datos, total };
  }

  async actualizarEstado(id: number, estado: EstadoPedido, notasOwner?: string) {
    return prisma.pedido.update({
      where: { id },
      data: {
        estado,
        ...(notasOwner !== undefined && { notasOwner }),
      },
    });
  }
}

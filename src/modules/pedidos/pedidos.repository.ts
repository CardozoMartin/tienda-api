import { prisma } from '../../config/prisma';
import { EstadoPedido } from '@prisma/client';
import { calcularSkip } from '../../utils/helpers';

export class PedidosRepository {
  async crear(datos: any) {
    const { items, ...pedidoData } = datos;

    return prisma.$transaction(async (tx: any) => {
      // 1. Validar y descontar stock para cada item
      for (const item of items) {
        if (item.varianteId) {
          const varExistente = await tx.productoVariante.findUnique({
            where: { id: item.varianteId },
            select: { stock: true, nombre: true }
          });
          
          if (!varExistente || varExistente.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para la variante: ${varExistente?.nombre || 'desconocida'}`);
          }

          await tx.productoVariante.update({
            where: { id: item.varianteId },
            data: { stock: { decrement: item.cantidad } }
          });
        } else {
          const prodExistente = await tx.producto.findUnique({
            where: { id: item.productoId },
            select: { stock: true, nombre: true }
          });

          if (!prodExistente || prodExistente.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para el producto: ${prodExistente?.nombre || 'desconocido'}`);
          }

          await tx.producto.update({
            where: { id: item.productoId },
            data: { stock: { decrement: item.cantidad } }
          });
        }
      }

      // 2. Crear el pedido
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
          // 3. Crear el primer log
          logs: {
            create: {
              estadoNuevo: 'PENDIENTE',
              notas: 'Pedido creado exitosamente',
              clienteId: pedidoData.clienteId || null
            }
          }
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
        tienda: {
          include: {
            usuario: true,
          },
        },
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

  async actualizarEstado(id: number, estado: EstadoPedido, notasOwner?: string, usuarioId?: number, nroSeguimiento?: string, urlSeguimiento?: string) {
    return prisma.$transaction(async (tx: any) => {
      const pedidoActual = await tx.pedido.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!pedidoActual) throw new Error('Pedido no encontrado');
      
      const estadoAnterior = pedidoActual.estado;

      // 1. Si el pedido pasa a CANCELADO y no estaba ya cancelado, devolvemos stock
      if (estado === 'CANCELADO' && estadoAnterior !== 'CANCELADO') {
        for (const item of pedidoActual.items) {
          if (item.varianteId) {
            await tx.productoVariante.update({
              where: { id: item.varianteId },
              data: { stock: { increment: item.cantidad } }
            });
          } else {
            await tx.producto.update({
              where: { id: item.productoId },
              data: { stock: { increment: item.cantidad } }
            });
          }
        }
      }

      // 2. Actualizar el pedido
      const pedidoActualizado = await tx.pedido.update({
        where: { id },
        data: {
          estado,
          ...(notasOwner !== undefined && { notasOwner }),
          ...(nroSeguimiento !== undefined && { nroSeguimiento }),
          ...(urlSeguimiento !== undefined && { urlSeguimiento }),
        },
      });

      // 3. Crear log de auditoría
      await tx.logPedido.create({
        data: {
          pedidoId: id,
          estadoAnterior,
          estadoNuevo: estado,
          notas: notasOwner || `Estado actualizado a ${estado}`,
          usuarioId: usuarioId || null
        }
      });

      return pedidoActualizado;
    });
  }
}

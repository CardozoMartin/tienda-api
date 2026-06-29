import { prisma } from '../../config/prisma';

export class ClienteRepository {
  /**
   * Buscar cliente por email en una tienda específica
   */
  async buscarPorEmailEnTienda(email: string, tiendaId: number) {
    return prisma.clienteTienda.findUnique({
      where: {
        tiendaId_email: {
          tiendaId,
          email,
        },
      },
    });
  }

  /**
   * Buscar cliente por ID
   */
  async buscarPorId(id: number) {
    return prisma.clienteTienda.findUnique({
      where: { id },
      select: {
        id: true,
        tiendaId: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        emailVerificado: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });
  }

  /**
   * Crear nuevo cliente
   */
  async crear(datos: {
    tiendaId: number;
    email: string;
    nombre: string;
    apellido: string;
    telefono: string;
    passwordHash: string;
    tokenVerif: string;
    tokenVerifVenc: Date;
  }) {
    return prisma.clienteTienda.create({
      data: datos,
      select: {
        id: true,
        tiendaId: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        emailVerificado: true,
        activo: true,
      },
    });
  }

  /**
   * Actualizar cliente
   */
  async actualizar(
    id: number,
    datos: {
      nombre?: string;
      apellido?: string;
      telefono?: string;
    }
  ) {
    return prisma.clienteTienda.update({
      where: { id },
      data: datos,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        emailVerificado: true,
        activo: true,
      },
    });
  }

  /**
   * Cambiar contraseña
   */
  async cambiarPassword(id: number, nuevoHashPassword: string) {
    return prisma.clienteTienda.update({
      where: { id },
      data: { passwordHash: nuevoHashPassword },
    });
  }

  /**
   * Verificar email del cliente
   */
  async verificarEmail(id: number) {
    return prisma.clienteTienda.update({
      where: { id },
      data: {
        emailVerificado: true,
        tokenVerif: null,
        tokenVerifVenc: null,
      },
    });
  }

  /**
   * Guardar token de verificación
   */
  async guardarTokenVerificacion(id: number, tokenVerif: string, vencimiento: Date) {
    return prisma.clienteTienda.update({
      where: { id },
      data: {
        tokenVerif,
        tokenVerifVenc: vencimiento,
      },
    });
  }

  /**
   * Buscar cliente por token de verificación
   */
  async buscarPorTokenVerificacion(tokenVerif: string) {
    return prisma.clienteTienda.findFirst({
      where: {
        tokenVerif,
        tokenVerifVenc: { gt: new Date() },
      },
    });
  }

  /**
   * Guardar token de reset de contraseña
   */
  async guardarTokenReset(id: number, tokenResetPass: string, vencimiento: Date) {
    return prisma.clienteTienda.update({
      where: { id },
      data: {
        tokenResetPass,
        tokenVencReset: vencimiento,
      },
    });
  }

  /**
   * Buscar cliente por token de reset
   */
  async buscarPorTokenReset(tokenResetPass: string) {
    return prisma.clienteTienda.findFirst({
      where: {
        tokenResetPass,
        tokenVencReset: { gt: new Date() },
      },
    });
  }

  /**
   * Listar clientes de una tienda con estadísticas de consumo
   */
  async listarPorTienda(
    tiendaId: number,
    filtros: { busqueda?: string; pagina: number; limite: number }
  ) {
    const where: any = {
      tiendaId,
      ...(filtros.busqueda && {
        OR: [
          { nombre:   { contains: filtros.busqueda } },
          { apellido: { contains: filtros.busqueda } },
          { email:    { contains: filtros.busqueda } },
          { telefono: { contains: filtros.busqueda } },
        ],
      }),
    };

    const skip = (filtros.pagina - 1) * filtros.limite;

    const [clientes, total] = await prisma.$transaction([
      prisma.clienteTienda.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          emailVerificado: true,
          activo: true,
          creadoEn: true,
          pedidos: {
            where: { tiendaId },
            select: {
              id: true,
              total: true,
              estado: true,
              creadoEn: true,
            },
            orderBy: { creadoEn: 'desc' },
          },
        },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: filtros.limite,
      }),
      prisma.clienteTienda.count({ where }),
    ]);

    // Calculamos estadísticas por cliente
    const datos = clientes.map((c: any) => {
      const pedidos = c.pedidos ?? [];
      const totalGastado = pedidos.reduce((sum: number, p: any) => sum + Number(p.total ?? 0), 0);
      const ultimoPedido = pedidos[0] ?? null;
      return {
        id: c.id,
        email: c.email,
        nombre: c.nombre,
        apellido: c.apellido,
        telefono: c.telefono,
        emailVerificado: c.emailVerificado,
        activo: c.activo,
        creadoEn: c.creadoEn,
        stats: {
          totalPedidos: pedidos.length,
          totalGastado,
          ultimoPedido: ultimoPedido ? { id: ultimoPedido.id, estado: ultimoPedido.estado, fecha: ultimoPedido.creadoEn } : null,
        },
      };
    });

    return { datos, total };
  }

  /**
   * Detalle de un cliente con historial completo de pedidos
   */
  async obtenerDetalleOwner(clienteId: number, tiendaId: number) {
    return prisma.clienteTienda.findFirst({
      where: { id: clienteId, tiendaId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        emailVerificado: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
        pedidos: {
          where: { tiendaId },
          select: {
            id: true,
            total: true,
            estado: true,
            estadoPago: true,
            compradorNombre: true,
            compradorEmail: true,
            compradorTel: true,
            direccionCalle: true,
            direccionCiudad: true,
            direccionProv: true,
            metodoPago: { select: { nombre: true } },
            metodoEntrega: { select: { nombre: true } },
            items: {
              select: {
                nombreProd: true,
                nombreVar: true,
                cantidad: true,
                precioUnit: true,
                subtotal: true,
                imagenUrl: true,
              },
            },
            creadoEn: true,
          },
          orderBy: { creadoEn: 'desc' },
        },
      },
    });
  }

  /**
   * Desactivar cliente
   */
  async desactivar(id: number) {
    return prisma.clienteTienda.update({
      where: { id },
      data: { activo: false },
    });
  }
}

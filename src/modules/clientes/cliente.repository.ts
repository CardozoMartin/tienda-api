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
   * Listar clientes de una tienda
   */
  async listarPorTienda(tiendaId: number) {
    return prisma.clienteTienda.findMany({
      where: {
        tiendaId,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        emailVerificado: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
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

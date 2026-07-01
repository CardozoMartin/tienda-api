import { prisma } from '../../config/prisma';

export class PopupsRepository {
  async listarPorTienda(tiendaId: number) {
    return prisma.tiendaPopup.findMany({
      where: { tiendaId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerActivo(tiendaId: number) {
    return prisma.tiendaPopup.findFirst({
      where: { tiendaId, activo: true },
    });
  }

  async buscarPorId(id: number, tiendaId: number) {
    return prisma.tiendaPopup.findFirst({ where: { id, tiendaId } });
  }

  async crear(tiendaId: number, datos: any) {
    return prisma.tiendaPopup.create({ data: { tiendaId, ...datos } });
  }

  async actualizar(id: number, tiendaId: number, datos: any) {
    return prisma.tiendaPopup.update({ where: { id, tiendaId }, data: datos });
  }

  async eliminar(id: number, tiendaId: number) {
    await prisma.tiendaPopup.deleteMany({ where: { id, tiendaId } });
  }

  async subirImagen(id: number, tiendaId: number, imagenUrl: string) {
    return prisma.tiendaPopup.update({ where: { id, tiendaId }, data: { imagenUrl } });
  }
}

import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { cacheService } from '../../utils/cache';
import { ActualizarGuiaTallesDto, GuiaTallesDto } from './guias-talles.dto';

export class GuiasTallesService {
  private async tiendaDeUsuario(usuarioId: number) {
    const tienda = await prisma.tienda.findFirst({ where: { usuarioId }, select: { id: true } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda', 404);
    return tienda;
  }

  // Normaliza filas para que todas tengan exactamente tantas celdas como columnas
  private alinearFilas(columnas: string[], filas: string[][]): string[][] {
    return filas.map((fila) => {
      const copia = columnas.map((_, i) => fila[i] ?? '');
      return copia;
    });
  }

  async listar(usuarioId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    return prisma.guiaTalles.findMany({
      where: { tiendaId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async crear(usuarioId: number, datos: GuiaTallesDto) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const filas = this.alinearFilas(datos.columnas, datos.filas ?? []);

    const guia = await prisma.guiaTalles.create({
      data: {
        tiendaId,
        nombre: datos.nombre.trim(),
        columnas: datos.columnas,
        filas,
        nota: datos.nota?.trim() || null,
      },
    });
    cacheService.flushPrefix(`productos_tienda_${tiendaId}`);
    return guia;
  }

  async actualizar(usuarioId: number, guiaId: number, datos: ActualizarGuiaTallesDto) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const actual = await prisma.guiaTalles.findFirst({ where: { id: guiaId, tiendaId } });
    if (!actual) throw new ErrorApi('Guía de talles no encontrada', 404);

    // Si cambian columnas o filas, realineamos con las columnas finales
    const columnas = datos.columnas ?? (actual.columnas as string[]);
    const filasRaw = datos.filas ?? (actual.filas as string[][]);

    const guia = await prisma.guiaTalles.update({
      where: { id: guiaId },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
        ...(datos.columnas !== undefined && { columnas }),
        ...(datos.columnas !== undefined || datos.filas !== undefined
          ? { filas: this.alinearFilas(columnas, filasRaw) }
          : {}),
        ...(datos.nota !== undefined && { nota: datos.nota?.trim() || null }),
      },
    });
    cacheService.flushPrefix(`productos_tienda_${tiendaId}`);
    return guia;
  }

  async eliminar(usuarioId: number, guiaId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const actual = await prisma.guiaTalles.findFirst({ where: { id: guiaId, tiendaId } });
    if (!actual) throw new ErrorApi('Guía de talles no encontrada', 404);

    // Al borrar, los productos que la usaban quedan con guiaTallesId = null (onDelete: SetNull)
    await prisma.guiaTalles.delete({ where: { id: guiaId } });
    cacheService.flushPrefix(`productos_tienda_${tiendaId}`);
  }
}

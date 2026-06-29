import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';

export class AnalyticsService {
  /** Obtiene la tienda del owner autenticado o falla. */
  private async tiendaDeUsuario(usuarioId: number) {
    const tienda = await prisma.tienda.findFirst({ where: { usuarioId }, select: { id: true } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda', 404);
    return tienda;
  }

  /**
   * Resumen general del dashboard:
   *  - totales (visitas, pedidos, ingresos, productos)
   *  - serie de visitas por día (últimos N días)
   *  - ventas por semana y por mes
   *  - productos más vistos
   */
  async resumen(usuarioId: number, dias = 30) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);

    const desde = new Date();
    desde.setDate(desde.getDate() - dias + 1);
    desde.setHours(0, 0, 0, 0);

    const [tienda, totalPedidos, ingresos, totalProductos, visitas, pedidosPeriodo, masVistos] =
      await Promise.all([
        prisma.tienda.findUnique({ where: { id: tiendaId }, select: { vistas: true } }),
        // Solo pedidos pagados (estadoPago APROBADO)
        prisma.pedido.count({ where: { tiendaId, estadoPago: 'APROBADO' } }),
        prisma.pedido.aggregate({
          where: { tiendaId, estadoPago: 'APROBADO' },
          _sum: { total: true },
        }),
        prisma.producto.count({ where: { tiendaId } }),
        prisma.visitaTienda.findMany({
          where: { tiendaId, creadoEn: { gte: desde } },
          select: { creadoEn: true },
        }),
        prisma.pedido.findMany({
          where: { tiendaId, estadoPago: 'APROBADO', creadoEn: { gte: desde } },
          select: { creadoEn: true, total: true },
        }),
        prisma.producto.findMany({
          where: { tiendaId },
          orderBy: { vistas: 'desc' },
          take: 8,
          select: { id: true, nombre: true, vistas: true, imagenPrincipalUrl: true },
        }),
      ]);

    // ── Serie de visitas por día ──
    const visitasPorDia = this.serieVacia(desde, dias);
    for (const v of visitas) {
      const key = this.claveDia(v.creadoEn);
      if (visitasPorDia[key] !== undefined) visitasPorDia[key]++;
    }

    // ── Ventas por semana y por mes ──
    const ventasSemana: Record<string, { ingresos: number; pedidos: number }> = {};
    const ventasMes: Record<string, { ingresos: number; pedidos: number }> = {};
    for (const p of pedidosPeriodo) {
      const monto = Number(p.total);
      const semKey = this.claveSemana(p.creadoEn);
      const mesKey = this.claveMes(p.creadoEn);
      (ventasSemana[semKey] ??= { ingresos: 0, pedidos: 0 });
      ventasSemana[semKey].ingresos += monto;
      ventasSemana[semKey].pedidos += 1;
      (ventasMes[mesKey] ??= { ingresos: 0, pedidos: 0 });
      ventasMes[mesKey].ingresos += monto;
      ventasMes[mesKey].pedidos += 1;
    }

    return {
      totales: {
        visitasTotales: tienda?.vistas ?? 0,
        visitasPeriodo: visitas.length,
        pedidos: totalPedidos,
        ingresos: Number(ingresos._sum.total ?? 0),
        productos: totalProductos,
      },
      visitasPorDia: Object.entries(visitasPorDia).map(([fecha, cantidad]) => ({ fecha, cantidad })),
      ventasSemana: Object.entries(ventasSemana)
        .map(([periodo, d]) => ({ periodo, ...d }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo)),
      ventasMes: Object.entries(ventasMes)
        .map(([periodo, d]) => ({ periodo, ...d }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo)),
      productosMasVistos: masVistos,
    };
  }

  // ── Helpers de fechas ──
  private claveDia(d: Date): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private claveMes(d: Date): string {
    return d.toISOString().slice(0, 7); // YYYY-MM
  }

  private claveSemana(d: Date): string {
    // ISO week: año + número de semana
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-S${String(week).padStart(2, '0')}`;
  }

  private serieVacia(desde: Date, dias: number): Record<string, number> {
    const serie: Record<string, number> = {};
    for (let i = 0; i < dias; i++) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      serie[this.claveDia(d)] = 0;
    }
    return serie;
  }
}

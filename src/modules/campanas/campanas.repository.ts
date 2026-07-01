import { prisma } from '../../config/prisma';
import { EstadoCampana, SegmentoCampana, EstadoEnvio, Prisma } from '@prisma/client';

// Un destinatario resuelto: email + nombre (para personalizar el saludo).
export interface Destinatario {
  email: string;
  nombre: string | null;
}

export class CampanasRepository {
  // ── Destinatarios por segmento ──────────────────────────────────────────
  // Devuelve la lista de emails únicos según el segmento elegido, scoped a la tienda.

  private async clientesRegistrados(tiendaId: number): Promise<Destinatario[]> {
    const clientes = await prisma.clienteTienda.findMany({
      where: { tiendaId, emailVerificado: true, activo: true },
      select: { email: true, nombre: true },
    });
    return clientes.map((c: { email: string; nombre: string }) => ({ email: c.email, nombre: c.nombre }));
  }

  private async compradores(tiendaId: number): Promise<Destinatario[]> {
    // Emails distintos que hicieron al menos un pedido en la tienda.
    const pedidos = await prisma.pedido.findMany({
      where: { tiendaId },
      select: { compradorEmail: true, compradorNombre: true },
      distinct: ['compradorEmail'],
    });
    return pedidos.map((p: { compradorEmail: string; compradorNombre: string }) => ({
      email: p.compradorEmail,
      nombre: p.compradorNombre,
    }));
  }

  // Resuelve y deduplica destinatarios según el segmento. La deduplicación
  // se hace por email (case-insensitive), conservando el primer nombre visto.
  async resolverDestinatarios(tiendaId: number, segmento: SegmentoCampana): Promise<Destinatario[]> {
    const listas: Destinatario[][] = [];
    if (segmento === 'CLIENTES_REGISTRADOS' || segmento === 'AMBOS') {
      listas.push(await this.clientesRegistrados(tiendaId));
    }
    if (segmento === 'COMPRADORES' || segmento === 'AMBOS') {
      listas.push(await this.compradores(tiendaId));
    }

    const porEmail = new Map<string, Destinatario>();
    for (const lista of listas) {
      for (const d of lista) {
        const key = d.email.trim().toLowerCase();
        if (!key) continue;
        if (!porEmail.has(key)) porEmail.set(key, { email: key, nombre: d.nombre });
      }
    }
    return [...porEmail.values()];
  }

  // ── CRUD Campaña ─────────────────────────────────────────────────────────

  async crear(data: Prisma.CampanaUncheckedCreateInput) {
    return prisma.campana.create({ data });
  }

  async buscarPorId(id: number) {
    return prisma.campana.findUnique({ where: { id } });
  }

  async listarPorTienda(tiendaId: number) {
    return prisma.campana.findMany({
      where: { tiendaId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async actualizar(id: number, data: Prisma.CampanaUncheckedUpdateInput) {
    return prisma.campana.update({ where: { id }, data });
  }

  // Crea los registros de envío (uno por destinatario) en un solo insert.
  async crearEnvios(campanaId: number, destinatarios: Destinatario[]) {
    if (destinatarios.length === 0) return { count: 0 };
    return prisma.campanaEnvio.createMany({
      data: destinatarios.map((d) => ({ campanaId, email: d.email, nombre: d.nombre })),
    });
  }

  // ── Worker: procesamiento de la cola ──────────────────────────────────────

  // Trae una tanda de envíos pendientes de una campaña (para el rate-limit por lotes).
  async tomarPendientes(campanaId: number, limite: number) {
    return prisma.campanaEnvio.findMany({
      where: { campanaId, estado: EstadoEnvio.PENDIENTE },
      take: limite,
      orderBy: { id: 'asc' },
    });
  }

  async marcarEnvio(id: number, estado: EstadoEnvio, error?: string) {
    return prisma.campanaEnvio.update({
      where: { id },
      data: {
        estado,
        error: error ?? null,
        intentos: { increment: 1 },
        enviadoEn: estado === EstadoEnvio.ENVIADO ? new Date() : null,
      },
    });
  }

  // Campañas encoladas que el worker debe procesar (al arrancar o en cada tick).
  async campanasPendientesDeProcesar() {
    return prisma.campana.findMany({
      where: { estado: { in: [EstadoCampana.ENCOLADA, EstadoCampana.ENVIANDO] } },
      orderBy: { encoladaEn: 'asc' },
    });
  }

  async contarPendientes(campanaId: number) {
    return prisma.campanaEnvio.count({
      where: { campanaId, estado: EstadoEnvio.PENDIENTE },
    });
  }
}

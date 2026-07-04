import { randomBytes } from 'crypto';
import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { enviarEmail } from '../../utils/emails';
import { ActualizarRevocacionDto, CrearRevocacionDto } from './revocaciones.dto';

export class RevocacionesService {
  // Código de constancia legible, ej: ARR-7F3K9Q (evita 0/O/1/I para no confundir).
  private generarCodigo(): string {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    let s = '';
    for (let i = 0; i < 6; i++) s += abc[bytes[i] % abc.length];
    return `ARR-${s}`;
  }

  private async tiendaDeUsuario(usuarioId: number) {
    const tienda = await prisma.tienda.findFirst({ where: { usuarioId }, select: { id: true } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda', 404);
    return tienda;
  }

  /**
   * Crea una solicitud pública (Botón de arrepentimiento). Sin login.
   * Devuelve el código de constancia inmediato (obligación de la Res. 424/2020).
   */
  async crearPublica(tiendaId: number, datos: CrearRevocacionDto) {
    const tienda = await prisma.tienda.findUnique({
      where: { id: tiendaId },
      select: { id: true, nombre: true, usuario: { select: { email: true } } },
    });
    if (!tienda) throw new ErrorApi('Tienda no encontrada', 404);

    // Intentar vincular a un pedido por el número que escribió el cliente
    let pedidoId: number | undefined;
    const nro = datos.nroPedidoTexto?.trim();
    if (nro && /^\d+$/.test(nro)) {
      const pedido = await prisma.pedido.findFirst({
        where: { id: Number(nro), tiendaId },
        select: { id: true },
      });
      if (pedido) pedidoId = pedido.id;
    }

    // Generar un código único (reintenta ante colisión, muy improbable)
    let codigo = this.generarCodigo();
    for (let intento = 0; intento < 5; intento++) {
      const existe = await prisma.solicitudRevocacion.findUnique({ where: { codigo } });
      if (!existe) break;
      codigo = this.generarCodigo();
    }

    const solicitud = await prisma.solicitudRevocacion.create({
      data: {
        tiendaId,
        codigo,
        pedidoId,
        nroPedidoTexto: nro || null,
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        telefono: datos.telefono?.trim() || null,
        motivo: datos.motivo?.trim() || null,
      },
    });

    // Notificar al owner (best-effort: no bloquea la constancia si el mail falla)
    const ownerEmail = tienda.usuario?.email;
    if (ownerEmail) {
      enviarEmail({
        para: ownerEmail,
        asunto: `Nueva solicitud de arrepentimiento (${codigo}) — ${tienda.nombre}`,
        html: `
          <h2>Solicitud de arrepentimiento / revocación de compra</h2>
          <p>Un cliente inició una solicitud a través del Botón de arrepentimiento.</p>
          <ul>
            <li><strong>Constancia:</strong> ${codigo}</li>
            <li><strong>Nombre:</strong> ${datos.nombre}</li>
            <li><strong>Email:</strong> ${datos.email}</li>
            ${datos.telefono ? `<li><strong>Teléfono:</strong> ${datos.telefono}</li>` : ''}
            ${nro ? `<li><strong>N° de pedido indicado:</strong> ${nro}</li>` : ''}
            ${datos.motivo ? `<li><strong>Motivo:</strong> ${datos.motivo}</li>` : ''}
          </ul>
          <p>Recordá que el consumidor tiene derecho a revocar la compra dentro de los 10 días
          corridos (art. 34, Ley 24.240) y que el costo de devolución corre por tu cuenta.</p>
        `,
      }).catch((e) => console.error('[REVOCACION] Error al notificar al owner:', e));
    }

    // Solo devolvemos lo necesario para la constancia
    return {
      codigo: solicitud.codigo,
      creadoEn: solicitud.creadoEn,
      nombre: solicitud.nombre,
      email: solicitud.email,
    };
  }

  // ── Owner: gestión ──
  async listar(usuarioId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    return prisma.solicitudRevocacion.findMany({
      where: { tiendaId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async actualizar(usuarioId: number, id: number, datos: ActualizarRevocacionDto) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const actual = await prisma.solicitudRevocacion.findFirst({ where: { id, tiendaId } });
    if (!actual) throw new ErrorApi('Solicitud no encontrada', 404);

    return prisma.solicitudRevocacion.update({
      where: { id },
      data: {
        ...(datos.estado !== undefined && { estado: datos.estado }),
        ...(datos.respuestaOwner !== undefined && {
          respuestaOwner: datos.respuestaOwner?.trim() || null,
        }),
      },
    });
  }
}

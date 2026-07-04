import { TipoPaginaLegal } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { cacheService } from '../../utils/cache';
import { GuardarPaginaLegalDto } from './legal.dto';
import { plantillaCambios, plantillaPrivacidad, plantillaTerminos } from './legal.plantillas';

export class LegalService {
  private async tiendaDeUsuario(usuarioId: number) {
    const tienda = await prisma.tienda.findFirst({
      where: { usuarioId },
      select: {
        id: true, nombre: true, provincia: true, ciudad: true,
        razonSocial: true, cuit: true, domicilioLegal: true,
        usuario: { select: { email: true } },
      },
    });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda', 404);
    return tienda;
  }

  private plantilla(
    tipo: TipoPaginaLegal,
    datos: {
      nombre: string;
      email?: string | null;
      provincia?: string | null;
      ciudad?: string | null;
      razonSocial?: string | null;
      cuit?: string | null;
      domicilioLegal?: string | null;
    }
  ) {
    if (tipo === 'PRIVACIDAD') return plantillaPrivacidad(datos);
    if (tipo === 'CAMBIOS') return plantillaCambios(datos);
    return plantillaTerminos(datos);
  }

  // ── Owner: obtener (con plantilla si no existe todavía) ──
  async obtenerParaOwner(usuarioId: number, tipo: TipoPaginaLegal) {
    const tienda = await this.tiendaDeUsuario(usuarioId);
    const existente = await prisma.paginaLegal.findUnique({
      where: { tiendaId_tipo: { tiendaId: tienda.id, tipo } },
    });
    if (existente) return existente;

    // No existe: devolvemos la plantilla precargada (sin guardar aún)
    const base = this.plantilla(tipo, {
      nombre: tienda.nombre,
      email: tienda.usuario?.email,
      provincia: tienda.provincia,
      ciudad: tienda.ciudad,
      razonSocial: tienda.razonSocial,
      cuit: tienda.cuit,
      domicilioLegal: tienda.domicilioLegal,
    });
    return {
      id: null,
      tiendaId: tienda.id,
      tipo,
      titulo: base.titulo,
      contenido: base.contenido,
      activa: true,
      esPlantilla: true, // marca que aún no fue guardada
    };
  }

  // ── Owner: crear o actualizar (upsert por tipo) ──
  async guardar(usuarioId: number, tipo: TipoPaginaLegal, datos: GuardarPaginaLegalDto) {
    const tienda = await this.tiendaDeUsuario(usuarioId);
    const pagina = await prisma.paginaLegal.upsert({
      where: { tiendaId_tipo: { tiendaId: tienda.id, tipo } },
      create: {
        tiendaId: tienda.id,
        tipo,
        titulo: datos.titulo.trim(),
        contenido: datos.contenido,
        activa: datos.activa,
      },
      update: {
        titulo: datos.titulo.trim(),
        contenido: datos.contenido,
        activa: datos.activa,
      },
    });
    cacheService.flushPrefix(`legal_tienda_${tienda.id}`);
    return pagina;
  }

  // ── Público: obtener una página activa de una tienda ──
  async obtenerPublica(tiendaId: number, tipo: TipoPaginaLegal) {
    const cacheKey = `legal_tienda_${tiendaId}_${tipo}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const pagina = await prisma.paginaLegal.findUnique({
      where: { tiendaId_tipo: { tiendaId, tipo } },
      select: { titulo: true, contenido: true, activa: true, actualizadoEn: true },
    });
    if (!pagina || !pagina.activa) throw new ErrorApi('Página no encontrada', 404);

    cacheService.set(cacheKey, pagina);
    return pagina;
  }

  // ── Público: qué páginas legales activas tiene la tienda (para el footer) ──
  async listarActivasPublicas(tiendaId: number) {
    const cacheKey = `legal_tienda_${tiendaId}_activas`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const paginas = await prisma.paginaLegal.findMany({
      where: { tiendaId, activa: true },
      select: { tipo: true, titulo: true },
    });
    cacheService.set(cacheKey, paginas);
    return paginas;
  }
}

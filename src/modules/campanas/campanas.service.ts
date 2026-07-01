import { EstadoCampana, SegmentoCampana } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { CampanasRepository } from './campanas.repository';
import { CrearCampanaDto } from './campanas.dto';
import { dispararProcesamiento } from './campanas.worker';

export class CampanasService {
  private repository = new CampanasRepository();

  // Busca la tienda del usuario o lanza 404. Devuelve solo lo necesario.
  private async tiendaDe(usuarioId: number) {
    const tienda = await prisma.tienda.findUnique({ where: { usuarioId } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda creada', 404);
    return tienda;
  }

  // Cuántos destinatarios tiene cada segmento (para mostrar en el compositor).
  async previewDestinatarios(usuarioId: number) {
    const tienda = await this.tiendaDe(usuarioId);
    const [registrados, compradores, ambos] = await Promise.all([
      this.repository.resolverDestinatarios(tienda.id, 'CLIENTES_REGISTRADOS'),
      this.repository.resolverDestinatarios(tienda.id, 'COMPRADORES'),
      this.repository.resolverDestinatarios(tienda.id, 'AMBOS'),
    ]);
    return {
      CLIENTES_REGISTRADOS: registrados.length,
      COMPRADORES: compradores.length,
      AMBOS: ambos.length,
    };
  }

  async listar(usuarioId: number) {
    const tienda = await this.tiendaDe(usuarioId);
    return this.repository.listarPorTienda(tienda.id);
  }

  async obtener(usuarioId: number, campanaId: number) {
    const tienda = await this.tiendaDe(usuarioId);
    const campana = await this.repository.buscarPorId(campanaId);
    if (!campana || campana.tiendaId !== tienda.id) {
      throw new ErrorApi('Campaña no encontrada', 404);
    }
    return campana;
  }

  // Crea la campaña como BORRADOR.
  async crear(usuarioId: number, datos: CrearCampanaDto) {
    const tienda = await this.tiendaDe(usuarioId);
    return this.repository.crear({
      tiendaId: tienda.id,
      asunto: datos.asunto,
      cuerpoHtml: datos.cuerpoHtml,
      imagenUrl: datos.imagenUrl ?? null,
      segmento: datos.segmento as SegmentoCampana,
    });
  }

  // Envía una campaña: valida config de email, resuelve destinatarios, crea los
  // registros de envío, la encola y dispara el worker en background.
  async enviar(usuarioId: number, campanaId: number) {
    const tienda = await this.tiendaDe(usuarioId);

    // La config de email debe estar verificada (lo dejamos listo en el Paso 1).
    if (!tienda.emailProveedor || !tienda.emailVerificadoConfig) {
      throw new ErrorApi(
        'Primero configurá y verificá tu servicio de email antes de enviar campañas.',
        400
      );
    }

    const campana = await this.repository.buscarPorId(campanaId);
    if (!campana || campana.tiendaId !== tienda.id) {
      throw new ErrorApi('Campaña no encontrada', 404);
    }
    if (campana.estado !== EstadoCampana.BORRADOR && campana.estado !== EstadoCampana.FALLIDA) {
      throw new ErrorApi('Esta campaña ya fue enviada o está en proceso', 409);
    }

    const destinatarios = await this.repository.resolverDestinatarios(tienda.id, campana.segmento);
    if (destinatarios.length === 0) {
      throw new ErrorApi('No hay destinatarios para el segmento elegido', 422);
    }

    await this.repository.crearEnvios(campanaId, destinatarios);
    await this.repository.actualizar(campanaId, {
      estado: EstadoCampana.ENCOLADA,
      totalDestinatarios: destinatarios.length,
      enviados: 0,
      fallidos: 0,
      encoladaEn: new Date(),
      finalizadaEn: null,
    });

    // Arranca el procesamiento en background (no bloquea la respuesta HTTP).
    dispararProcesamiento();

    return {
      encolada: true,
      totalDestinatarios: destinatarios.length,
      mensaje: `Campaña encolada. Se enviará a ${destinatarios.length} destinatario(s).`,
    };
  }
}

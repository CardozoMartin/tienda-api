// Worker en proceso que procesa la cola de envíos de campañas.
// No usa Redis/BullMQ: toma envíos PENDIENTES de la BD en lotes y los manda
// respetando un rate-limit. Si el server reinicia, retoma desde la BD porque
// el estado vive en las tablas campanas / campana_envios.
import { EstadoCampana, EstadoEnvio } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { CampanasRepository } from './campanas.repository';
import { crearSender, type ConfigEnvio } from './emailSender';
import { descifrar } from '../../utils/cifrado';

// Parámetros de rate-limit: cuántos por lote y cuánto esperar entre lotes.
const LOTE = 20;
const DELAY_ENTRE_LOTES_MS = 1500;

const repo = new CampanasRepository();

let procesando = false;

// Punto de entrada: pide procesar la cola. Es idempotente — si ya hay un ciclo
// corriendo, no arranca otro (evita envíos duplicados por dobles triggers).
export function dispararProcesamiento(): void {
  if (procesando) return;
  procesando = true;
  procesarCola()
    .catch((err) => logger.error('[CAMPANAS] Error en el worker:', err))
    .finally(() => {
      procesando = false;
    });
}

async function procesarCola(): Promise<void> {
  const campanas = await repo.campanasPendientesDeProcesar();
  for (const campana of campanas) {
    await procesarCampana(campana.id, campana.tiendaId);
  }
}

async function procesarCampana(campanaId: number, tiendaId: number): Promise<void> {
  // Cargamos la config de email de la tienda y la validamos.
  const tienda = await prisma.tienda.findUnique({ where: { id: tiendaId } });
  if (!tienda?.emailProveedor || !tienda.emailCredencial || !tienda.emailVerificadoConfig) {
    logger.warn(`[CAMPANAS] Campaña ${campanaId}: config de email inválida, se marca FALLIDA`);
    await repo.actualizar(campanaId, { estado: EstadoCampana.FALLIDA, finalizadaEn: new Date() });
    return;
  }

  const config: ConfigEnvio = {
    proveedor: tienda.emailProveedor,
    remitente: tienda.emailRemitente ?? '',
    remitenteNombre: tienda.emailRemitenteNombre,
    host: tienda.emailHost,
    port: tienda.emailPort,
    usuario: tienda.emailUsuario,
    credencial: descifrar(tienda.emailCredencial),
  };

  const campana = await repo.buscarPorId(campanaId);
  if (!campana) return;

  await repo.actualizar(campanaId, { estado: EstadoCampana.ENVIANDO });

  let sender;
  try {
    sender = crearSender(config);
  } catch (err) {
    logger.error(`[CAMPANAS] No se pudo crear el sender de la campaña ${campanaId}:`, err);
    await repo.actualizar(campanaId, { estado: EstadoCampana.FALLIDA, finalizadaEn: new Date() });
    return;
  }

  try {
    // Procesamos en lotes hasta que no queden pendientes.
    for (;;) {
      const pendientes = await repo.tomarPendientes(campanaId, LOTE);
      if (pendientes.length === 0) break;

      for (const envio of pendientes) {
        try {
          await sender.enviar({
            para: envio.email,
            nombre: envio.nombre,
            asunto: campana.asunto,
            html: campana.cuerpoHtml,
          });
          await repo.marcarEnvio(envio.id, EstadoEnvio.ENVIADO);
          await repo.actualizar(campanaId, { enviados: { increment: 1 } });
        } catch (err: any) {
          await repo.marcarEnvio(envio.id, EstadoEnvio.FALLIDO, String(err?.message ?? err).slice(0, 500));
          await repo.actualizar(campanaId, { fallidos: { increment: 1 } });
        }
      }

      // Rate-limit entre lotes para no saturar el proveedor.
      if (await repo.contarPendientes(campanaId) > 0) {
        await new Promise((r) => setTimeout(r, DELAY_ENTRE_LOTES_MS));
      }
    }
  } finally {
    sender.cerrar();
  }

  await repo.actualizar(campanaId, { estado: EstadoCampana.ENVIADA, finalizadaEn: new Date() });
  logger.info(`[CAMPANAS] Campaña ${campanaId} finalizada.`);
}

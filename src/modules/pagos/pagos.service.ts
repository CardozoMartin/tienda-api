import axios from 'axios';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ErrorApi } from '../../types';
import { cifrar, descifrar, estacifrado } from '../../utils/cifrado';

const MP_API = 'https://api.mercadopago.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getConfigMpTienda(tiendaId: number) {
  const registro = await prisma.metodoPagoTienda.findFirst({
    where: {
      tiendaId,
      metodoPago: {
        nombre: { contains: 'mercado' },
      },
    },
    include: { metodoPago: true },
  });

  if (!registro) {
    throw new ErrorApi('Esta tienda no tiene Mercado Pago configurado', 503);
  }

  const config = registro.configExtra as Record<string, string> | null;
  const tokenRaw = config?.mpAccessToken;

  if (!tokenRaw) {
    throw new ErrorApi('Falta el Access Token de Mercado Pago en la configuración', 503);
  }

  // Si el token está cifrado lo desciframos; si no (legacy texto plano), lo usamos directo
  const accessToken = estacifrado(tokenRaw) ? descifrar(tokenRaw) : tokenRaw;

  return { accessToken, config, registro };
}

function buildMpClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken });
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export class PagosService {

  // ── Guardar/actualizar el access token cifrado ──
  async guardarCredencialesMp(tiendaId: number, mpAccessToken: string, mpPublicKey?: string) {
    const registro = await prisma.metodoPagoTienda.findFirst({
      where: {
        tiendaId,
        metodoPago: { nombre: { contains: 'mercado' } },
      },
    });

    if (!registro) {
      throw new ErrorApi('Primero activá Mercado Pago como método de pago', 400);
    }

    const tokenCifrado = cifrar(mpAccessToken);
    const configExtraActual = (registro.configExtra as Record<string, any>) ?? {};

    await prisma.metodoPagoTienda.update({
      where: { tiendaId_metodoPagoId: { tiendaId: registro.tiendaId, metodoPagoId: registro.metodoPagoId } },
      data: {
        configExtra: {
          ...configExtraActual,
          mpAccessToken: tokenCifrado,
          ...(mpPublicKey && { mpPublicKey }),
          estadoMp: 'pendiente',
          ultimoErrorMp: null,
        },
      },
    });

    return { ok: true };
  }

  // ── Borrar credenciales / desconectar Mercado Pago ──
  async desconectarMp(tiendaId: number) {
    const registro = await prisma.metodoPagoTienda.findFirst({
      where: { tiendaId, metodoPago: { nombre: { contains: 'mercado' } } },
    });
    if (!registro) throw new ErrorApi('No hay Mercado Pago configurado', 404);

    // Limpiamos todo el configExtra (token, public key, estado, etc.)
    await prisma.metodoPagoTienda.update({
      where: { tiendaId_metodoPagoId: { tiendaId: registro.tiendaId, metodoPagoId: registro.metodoPagoId } },
      data: { configExtra: {} },
    });

    return { ok: true };
  }

  // ── Test de conexión ──
  async testConexionMp(tiendaId: number) {
    const { accessToken, registro } = await getConfigMpTienda(tiendaId);

    try {
      const { data: user } = await axios.get<{ id: number; nickname?: string; email?: string }>(
        `${MP_API}/users/me`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      await prisma.metodoPagoTienda.update({
        where: { tiendaId_metodoPagoId: { tiendaId: registro.tiendaId, metodoPagoId: registro.metodoPagoId } },
        data: {
          configExtra: {
            ...(registro.configExtra as object),
            estadoMp: 'activo',
            ultimoTestMp: new Date().toISOString(),
            ultimoErrorMp: null,
            mpUserId: String(user.id),
            mpNickname: user.nickname ?? user.email ?? '',
          },
        },
      });

      return {
        ok: true,
        estado: 'activo' as const,
        mpUser: user.nickname ?? user.email ?? String(user.id),
      };
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';

      await prisma.metodoPagoTienda.update({
        where: { tiendaId_metodoPagoId: { tiendaId: registro.tiendaId, metodoPagoId: registro.metodoPagoId } },
        data: {
          configExtra: {
            ...(registro.configExtra as object),
            estadoMp: 'error',
            ultimoTestMp: new Date().toISOString(),
            ultimoErrorMp: mensaje,
          },
        },
      });

      return { ok: false, estado: 'error' as const, error: mensaje };
    }
  }

  // ── Resumen de config MP para el dashboard ──
  async getResumenMp(tiendaId: number) {
    const registro = await prisma.metodoPagoTienda.findFirst({
      where: {
        tiendaId,
        metodoPago: { nombre: { contains: 'mercado' } },
      },
      include: { metodoPago: true },
    });

    if (!registro) return { configurado: false };

    const config = (registro.configExtra as Record<string, any>) ?? {};

    return {
      configurado: !!config.mpAccessToken,
      estado: config.estadoMp ?? 'pendiente',
      mpUser: config.mpNickname ?? null,
      ultimoTest: config.ultimoTestMp ?? null,
      ultimoError: config.ultimoErrorMp ?? null,
      tienePublicKey: !!config.mpPublicKey,
    };
  }

  // ── Crear preferencia de pago ──
  async crearPreferencia(pedidoId: number, tiendaId: number) {
    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, tiendaId },
      include: { items: true, tienda: true },
    });
    if (!pedido) throw new ErrorApi('Pedido no encontrado', 404);

    const { accessToken } = await getConfigMpTienda(tiendaId);
    const client = buildMpClient(accessToken);
    const preference = new Preference(client);

    // Construimos la URL base del backend (para el webhook)
    const backendUrl = process.env['PUBLIC_BACKEND_URL']
      ?? env.FRONTEND_URL.replace('5173', '3000');

    // URL de la tienda pública (storefront) para las back_urls.
    // Usamos STORE_URL si está; si no, derivamos de FRONTEND_URL (dashboard) cambiando el puerto.
    const storeBase = process.env['STORE_URL'] ?? env.FRONTEND_URL.replace('5173', '5175');
    const slug = pedido.tienda.slug;
    const retornoBase = `${storeBase}/${slug}/pedido/${pedido.id}`;

    // MP rechaza auto_return si las back_urls son de localhost.
    // El notification_url (webhook) sí puede ser una URL pública (ngrok) aunque las back_urls sean localhost.
    const backUrlsLocal = /localhost|127\.0\.0\.1/.test(retornoBase);
    const webhookPublico = !/localhost|127\.0\.0\.1/.test(backendUrl);

    const body: any = {
      items: (pedido.items as any[]).map((item) => ({
        id: String(item.productoId),
        title: item.nombreVar ? `${item.nombreProd} - ${item.nombreVar}` : item.nombreProd,
        quantity: item.cantidad,
        unit_price: Number(item.precioUnit),
        currency_id: pedido.moneda,
        picture_url: item.imagenUrl ?? undefined,
      })),
      payer: {
        name: pedido.compradorNombre,
        email: pedido.compradorEmail,
      },
      external_reference: String(pedido.id),
      back_urls: {
        success: `${retornoBase}/gracias`,
        failure: `${retornoBase}/error`,
        pending: `${retornoBase}/pendiente`,
      },
      shipments: {
        cost: Number(pedido.costoEnvio),
        mode: 'not_specified' as const,
      },
    };

    // auto_return solo si las back_urls NO son localhost (MP lo exige)
    if (!backUrlsLocal) {
      body.auto_return = 'approved';
    }
    // notification_url si el backend es público (ngrok/producción) → el webhook funcionará
    if (webhookPublico) {
      body.notification_url = `${backendUrl}/api/v1/pagos/webhook`;
    }

    const result = await preference.create({ body });

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { mpPreferenciaId: result.id },
    });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  // ── Webhook de MP ──
  async procesarWebhook(body: any, query: any = {}) {
    // MP puede mandar el tipo/id en el body o en la query string
    const tipo = body?.type ?? body?.topic ?? query?.type ?? query?.topic;
    const paymentId = body?.data?.id ?? query?.['data.id'] ?? query?.id;

    console.log('[MP WEBHOOK] tipo:', tipo, '| paymentId:', paymentId);

    if (tipo !== 'payment' || !paymentId) {
      console.log('[MP WEBHOOK] ignorado (no es payment o falta id)');
      return { procesado: false };
    }

    // El webhook NO trae el external_reference ni a qué tienda pertenece.
    // Probamos con los tokens de todas las tiendas que tienen MP configurado
    // hasta que uno pueda leer el payment.
    const tiendasMp = await prisma.metodoPagoTienda.findMany({
      where: { metodoPago: { nombre: { contains: 'mercado' } } },
      select: { tiendaId: true, configExtra: true },
    });

    let payment: any = null;
    for (const t of tiendasMp) {
      const cfg = (t.configExtra ?? {}) as Record<string, string>;
      const tokenRaw = cfg.mpAccessToken;
      if (!tokenRaw) continue;
      try {
        const token = estacifrado(tokenRaw) ? descifrar(tokenRaw) : tokenRaw;
        const client = buildMpClient(token);
        const paymentApi = new Payment(client);
        payment = await paymentApi.get({ id: paymentId });
        if (payment) break; // este token sirvió
      } catch {
        // token de otra tienda; probamos el siguiente
      }
    }

    // Fallback: token global del env si existe
    if (!payment && env.MP_ACCESS_TOKEN) {
      try {
        const client = buildMpClient(env.MP_ACCESS_TOKEN);
        payment = await new Payment(client).get({ id: paymentId });
      } catch { /* nada */ }
    }

    if (!payment) {
      console.log('[MP WEBHOOK] no se pudo leer el payment con ningún token');
      return { procesado: false };
    }

    const pedidoId = Number(payment.external_reference);
    if (!pedidoId) {
      console.log('[MP WEBHOOK] el payment no tiene external_reference');
      return { procesado: false };
    }

    const estadoPago = this.mapearEstado(payment.status ?? '');
    await this.actualizarPedidoPorPago(pedidoId, String(paymentId), estadoPago);
    console.log(`[MP WEBHOOK] pedido #${pedidoId} → pago ${estadoPago}`);

    return { procesado: true, pedidoId, estadoPago };
  }

  private async actualizarPedidoPorPago(
    pedidoId: number,
    paymentId: string,
    estadoPago: string
  ) {
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        mpPaymentId: paymentId,
        estadoPago: estadoPago as any,
        ...(estadoPago === 'APROBADO' && { estado: 'CONFIRMADO' }),
      },
    });
  }

  private mapearEstado(mpStatus: string): string {
    const mapa: Record<string, string> = {
      approved:    'APROBADO',
      rejected:    'RECHAZADO',
      pending:     'PENDIENTE',
      in_process:  'EN_PROCESO',
      refunded:    'DEVUELTO',
      cancelled:   'CANCELADO',
      charged_back: 'DEVUELTO',
    };
    return mapa[mpStatus] ?? 'PENDIENTE';
  }
}


import { env } from '../config/env';
import { transporter } from '../config/mailer';

interface OpcionesEmail {
  para: string;
  asunto: string;
  html: string;
}


// BASE SENDER


export async function enviarEmail(opciones: OpcionesEmail): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to: opciones.para,
      subject: opciones.asunto,
      html: opciones.html,
    });

    console.log(`✅ [EMAIL] Enviado a ${opciones.para} - ID: ${info.messageId}`);

    if (env.esDevelopment && info) {
      try {
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) console.log(`📧 [EMAIL] Preview: ${previewUrl}`);
      } catch { /* No es Ethereal, ignorar */ }
    }

    return true;
  } catch (error) {
    console.error(`❌ [EMAIL] Error enviando a ${opciones.para}:`, error);
    return false;
  }
}

// HELPERS DE LAYOUT

function bloqueContacto(tienda: any): string {
  const whatsapp = tienda?.whatsapp;
  const telefono = tienda?.usuario?.telefono;
  if (!whatsapp && !telefono) return '';

  const items: string[] = [];
  if (whatsapp) {
    const numLimpio = whatsapp.replace(/\D/g, '');
    items.push(`
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #4a5568;">
          📱 <strong>WhatsApp:</strong>
          <a href="https://wa.me/${numLimpio}" style="color: #25D366; text-decoration: none; font-weight: bold;">
            ${whatsapp}
          </a>
        </td>
      </tr>`);
  }
  if (telefono) {
    items.push(`
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #4a5568;">
          ☎️ <strong>Teléfono:</strong> ${telefono}
        </td>
      </tr>`);
  }

  return `
    <div style="background-color: #f7fafc; border-radius: 8px; padding: 16px 20px; margin-top: 24px;">
      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase;
                 letter-spacing: 0.05em; color: #a0aec0;">¿Dudas sobre tu pedido?</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>${items.join('')}</tbody>
      </table>
    </div>`;
}

function mensajeEntregaConfirmado(pedido: any): string {
  const nombre = (pedido.metodoEntrega?.nombre ?? '').toLowerCase();

  if (nombre.includes('retiro') || nombre.includes('local') || nombre.includes('sucursal')) {
    const dir = pedido.tienda?.aboutUs?.direccion ?? 'la dirección del local';
    return `
      <div style="background-color: #ebf8ff; border-left: 4px solid #3182ce;
                  border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
          🏪 <strong>Retiro en local:</strong> Podés pasar a retirar tu pedido
          <strong>a partir de las 18:00 hs</strong> por <strong>${dir}</strong>.
          Ante cualquier duda, te contactamos por WhatsApp.
        </p>
      </div>`;
  }

  if (nombre.includes('uber') || nombre.includes('rappi') || nombre.includes('glovo') || nombre.includes('mensajería') || nombre.includes('mensajeria')) {
    const wsp = pedido.tienda?.whatsapp;
    const numLimpio = wsp ? wsp.replace(/\D/g, '') : '';
    return `
      <div style="background-color: #fffbeb; border-left: 4px solid #d69e2e;
                  border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #744210;">
          🚗 <strong>Envío por aplicación:</strong> Nos contactaremos con vos
          <strong>por WhatsApp</strong> para coordinar el retiro y entrega del pedido.
          ${wsp ? `(<a href="https://wa.me/${numLimpio}" style="color: #d69e2e;">${wsp}</a>)` : ''}
        </p>
      </div>`;
  }

  if (nombre.includes('cadet') || nombre.includes('moto') || nombre.includes('propi')) {
    const wsp = pedido.tienda?.whatsapp;
    const numLimpio = wsp ? wsp.replace(/\D/g, '') : '';
    return `
      <div style="background-color: #f0fff4; border-left: 4px solid #38a169;
                  border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #276749;">
          🏍️ <strong>Cadete propio:</strong> Nuestro cadete se estará comunicando
          con vos para coordinar la entrega en tu domicilio.
          ${wsp ? `(<a href="https://wa.me/${numLimpio}" style="color: #38a169;">${wsp}</a>)` : ''}
        </p>
      </div>`;
  }

  // Fallback genérico
  return `
    <div style="background-color: #f7fafc; border-left: 4px solid #a0aec0;
                border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #4a5568;">
        📦 <strong>Método de entrega:</strong> ${pedido.metodoEntrega?.nombre ?? 'A confirmar'}.
        Nos pondremos en contacto para coordinar la entrega.
      </p>
    </div>`;
}


function bloqueSeguimiento(pedido: any): string {
  if (!pedido.nroSeguimiento) return '';

  const url = pedido.urlSeguimiento;
  const boton = url
    ? `<div style="text-align: center; margin-top: 14px;">
         <a href="${url}" target="_blank"
            style="display: inline-block; background-color: #2d3748; color: white;
                   padding: 10px 24px; border-radius: 8px; text-decoration: none;
                   font-size: 13px; font-weight: bold;">
           🔗 Seguir mi paquete
         </a>
       </div>`
    : '';

  return `
    <div style="background-color: #faf5ff; border: 1px solid #e9d8fd;
                border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;
                 letter-spacing: 0.05em; color: #805ad5;">Seguimiento del Envío</p>
      <p style="margin: 0; font-size: 15px; font-weight: bold; color: #2d3748; letter-spacing: 0.03em;">
        📬 N° de seguimiento: <span style="font-family: monospace; color: #553c9a;">${pedido.nroSeguimiento}</span>
      </p>
      ${boton}
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAILS ADMIN (verificación, reset de contraseña)
// ─────────────────────────────────────────────────────────────────────────────

export async function enviarEmailVerificacion(
  email: string,
  nombre: string,
  tokenVerificacion: string
): Promise<boolean> {
  const urlVerificacion = `${env.FRONTEND_URL}/verify-email?token=${tokenVerificacion}`;
  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>¡Bienvenido, ${nombre}!</h2>
          <p>Para completar tu registro como administrador, necesitás verificar tu email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacion}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verificar Email
            </a>
          </div>
          <p>Este enlace expira en 24 horas.</p>
        </div>
      </body>
    </html>
  `;
  return enviarEmail({ para: email, asunto: 'Verificá tu email para completar tu registro', html });
}

export async function enviarEmailResetPassword(
  email: string,
  nombre: string,
  tokenReset: string,
  nombreTienda: string = 'Tienda'
): Promise<boolean> {
  const urlReset = `${env.FRONTEND_URL}/reset-password?token=${tokenReset}`;
  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Restablecer Contraseña</h2>
          <p>Hola ${nombre},</p>
          <p>Solicitaste restablecer tu contraseña en <strong>${nombreTienda}</strong>. Haz clic en el botón de abajo para crear una nueva:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlReset}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Este enlace expira en 1 hora.</p>
        </div>
      </body>
    </html>
  `;
  return enviarEmail({ para: email, asunto: `Restablecer tu contraseña en ${nombreTienda}`, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAILS CLIENTES DE TIENDA
// ─────────────────────────────────────────────────────────────────────────────

export async function enviarEmailVerificacionAlCliente(
  email: string,
  nombre: string,
  tokenVerificacion: string,
  nombreTienda: string
): Promise<boolean> {
  const urlVerificacion = `${env.FRONTEND_URL}/verify-email?token=${tokenVerificacion}`;
  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>¡Bienvenido a ${nombreTienda}, ${nombre}!</h2>
          <p>Para completar tu registro, necesitás verificar tu email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacion}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verificar Email
            </a>
          </div>
          <p>Este enlace expira en 24 horas.</p>
        </div>
      </body>
    </html>
  `;
  return enviarEmail({ para: email, asunto: 'Verificá tu email para completar tu registro', html });
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAILS DE PEDIDOS
// ─────────────────────────────────────────────────────────────────────────────

export async function enviarEmailNuevoPedidoAlCliente(
  email: string,
  nombre: string,
  pedido: any,
  nombreTienda: string
): Promise<boolean> {
  const itemsHtml = pedido.items
    .map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.nombreProd} ${item.nombreVar ? `(${item.nombreVar})` : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.precioUnit).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2D3748; text-align: center;">¡Gracias por tu compra, ${nombre}!</h2>
          <p>Tu pedido <strong>#${pedido.id}</strong> en <strong>${nombreTienda}</strong> ha sido recibido correctamente y está a la espera de confirmación.</p>

          <h3 style="border-bottom: 2px solid #edf2f7; padding-bottom: 10px; margin-top: 30px;">Resumen del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f7fafc;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #E53E3E; font-size: 1.2em;">$${Number(pedido.total).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; font-size: 0.9em;"><strong>Método de Entrega:</strong> ${pedido.metodoEntrega?.nombre || 'Consultar'}</p>
            <p style="margin: 5px 0 0; font-size: 0.9em;"><strong>Dirección:</strong> ${pedido.direccionCalle} ${pedido.direccionNumero || ''}, ${pedido.direccionCiudad}</p>
          </div>

          ${bloqueContacto(pedido.tienda)}

          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 30px 0;">
          <p style="font-size: 0.8em; color: #A0AEC0; text-align: center;">Gracias por confiar en ${nombreTienda}.</p>
        </div>
      </body>
    </html>
  `;

  return enviarEmail({
    para: email,
    asunto: `Confirmación de pedido #${pedido.id} - ${nombreTienda}`,
    html,
  });
}

export async function enviarEmailNuevoPedidoAlOwner(
  emailOwner: string,
  nombreOwner: string,
  pedido: any,
  nombreTienda: string
): Promise<boolean> {
  const urlDashboard = `${env.FRONTEND_URL}/dashboard/pedidos`;
  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2D3748;">¡Nuevo pedido recibido! 🚀</h2>
          <p>Hola ${nombreOwner}, has recibido un nuevo pedido en <strong>${nombreTienda}</strong>.</p>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0;"><strong>Pedido:</strong> #${pedido.id}</p>
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${pedido.compradorNombre}</p>
            <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${pedido.compradorTel}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${Number(pedido.total).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Método de entrega:</strong> ${pedido.metodoEntrega?.nombre || 'No especificado'}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlDashboard}"
               style="background-color: #2D3748; color: white; padding: 14px 35px;
                      text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Gestionar Pedido en Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 30px 0;">
          <p style="color: #A0AEC0; font-size: 0.8em; text-align: center;">
            Este es un aviso automático de tu sistema de ventas.
          </p>
        </div>
      </body>
    </html>
  `;

  return enviarEmail({
    para: emailOwner,
    asunto: `🚀 ¡Nuevo pedido #${pedido.id} en ${nombreTienda}!`,
    html,
  });
}

export async function enviarEmailEstadoPedidoActualizado(
  email: string,
  nombre: string,
  pedido: any,
  nuevoEstado: string,
  nombreTienda: string
): Promise<boolean> {
  const estados: Record<string, { label: string; color: string; msg: string; emoji: string }> = {
    CONFIRMADO: {
      label: 'Confirmado',
      color: '#3182CE',
      msg: 'Tu pedido ha sido confirmado. ¡Ya estamos preparándolo!',
      emoji: '✅',
    },
    EN_CAMINO: {
      label: 'En Camino',
      color: '#805AD5',
      msg: '¡Buenas noticias! Tu pedido ya está en camino.',
      emoji: '🚚',
    },
    ENTREGADO: {
      label: 'Entregado',
      color: '#38A169',
      msg: 'Tu pedido ha sido marcado como entregado. ¡Que lo disfrutes!',
      emoji: '🎉',
    },
    CANCELADO: {
      label: 'Cancelado',
      color: '#E53E3E',
      msg: 'Lamentablemente tu pedido ha sido cancelado. Contactanos si tenés dudas.',
      emoji: '❌',
    },
  };

  const info = estados[nuevoEstado] || {
    label: nuevoEstado,
    color: '#4A5568',
    msg: 'El estado de tu pedido ha cambiado.',
    emoji: '📋',
  };

  // Bloques condicionales
  const bloqueEntrega = nuevoEstado === 'CONFIRMADO' ? mensajeEntregaConfirmado(pedido) : '';
  const bloqueSeg = nuevoEstado === 'EN_CAMINO' ? bloqueSeguimiento(pedido) : '';

  // Si se marcó ENTREGADO, enviamos la factura después de este email
  if (nuevoEstado === 'ENTREGADO') {
    // No esperamos, disparamos en paralelo
    enviarFactura(email, nombre, pedido, nombreTienda).catch(() => {});
  }

  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">

          <h2 style="color: ${info.color};">${info.emoji} Actualización de tu pedido #${pedido.id ?? pedido}</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>${info.msg}</p>

          <div style="text-align: center; margin: 24px 0; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
            <span style="font-size: 0.85em; color: #718096; text-transform: uppercase; letter-spacing: 1px;">Nuevo Estado:</span><br>
            <strong style="font-size: 1.5em; color: ${info.color};">${info.label}</strong>
          </div>

          ${bloqueEntrega}
          ${bloqueSeg}

          ${bloqueContacto(pedido.tienda)}

          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 30px 0;">
          <p style="color: #A0AEC0; font-size: 0.8em; text-align: center;">
            Gracias por confiar en ${nombreTienda}.
          </p>
        </div>
      </body>
    </html>
  `;

  return enviarEmail({
    para: email,
    asunto: `${info.emoji} Actualización de pedido #${pedido.id ?? pedido} - ${nombreTienda}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTURA / COMPROBANTE DE COMPRA
// ─────────────────────────────────────────────────────────────────────────────

export async function enviarFactura(
  email: string,
  nombre: string,
  pedido: any,
  nombreTienda: string
): Promise<boolean> {
  // Número de comprobante formateado
  const nroComprobante = `FC-${String(pedido.id).padStart(6, '0')}`;
  const compradorNombre = nombre || pedido.compradorNombre;
  const fechaEmision = new Date(pedido.actualizadoEn || pedido.creadoEn).toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Items de la factura
  const itemsHtml = (pedido.items ?? []).map((item: any) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; font-size: 13px; color: #2d3748;">
        <strong>${item.nombreProd}</strong>
        ${item.nombreVar ? `<br><span style="font-size: 11px; color: #718096;">${item.nombreVar}</span>` : ''}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 13px; color: #4a5568;">
        ${item.cantidad}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 13px; color: #4a5568;">
        $${Number(item.precioUnit).toLocaleString('es-AR')}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 13px; font-weight: 600; color: #2d3748;">
        $${Number(item.subtotal).toLocaleString('es-AR')}
      </td>
    </tr>
  `).join('');

  const subtotal = Number(pedido.subtotal ?? pedido.total);
  const costoEnvio = Number(pedido.costoEnvio ?? 0);
  const total = Number(pedido.total);

  // Datos tienda
  const wsp = pedido.tienda?.whatsapp;
  const wspNumLimpio = wsp ? wsp.replace(/\D/g, '') : '';
  const sitioWeb = pedido.tienda?.sitioWeb ?? '';
  const instagram = pedido.tienda?.instagram ?? '';

  const html = `
  <!DOCTYPE html>
  <html dir="ltr" lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, sans-serif;">
    <div style="max-width: 640px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <div style="background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); padding: 32px 40px; text-align: center;">
        <p style="margin: 0 0 4px; font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 2px;">Comprobante de Compra</p>
        <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">${nombreTienda}</h1>
        <p style="margin: 12px 0 0; font-size: 13px; color: #68d391; font-weight: 700;">✓ Pedido Entregado Exitosamente</p>
      </div>

      <!-- NRO COMPROBANTE + FECHA -->
      <div style="background: #f7fafc; padding: 20px 40px; display: flex; border-bottom: 1px solid #edf2f7;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px;">Comprobante N°</td>
            <td style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Fecha de Emisión</td>
          </tr>
          <tr>
            <td style="font-size: 20px; font-weight: 800; color: #2d3748; padding-top: 4px;">${nroComprobante}</td>
            <td style="font-size: 14px; font-weight: 600; color: #4a5568; text-align: right; padding-top: 4px;">${fechaEmision}</td>
          </tr>
        </table>
      </div>

      <!-- DATOS DEL CLIENTE -->
      <div style="padding: 24px 40px; border-bottom: 1px solid #edf2f7;">
        <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a0aec0;">Datos del Comprador</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #2d3748;"><strong>Nombre:</strong> ${compradorNombre}</td>
            <td style="padding: 4px 0; font-size: 13px; color: #2d3748; text-align: right;"><strong>Email:</strong> ${pedido.compradorEmail}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #4a5568;" colspan="2">
              <strong>Dirección:</strong> ${pedido.direccionCalle} ${pedido.direccionNumero ?? ''}, ${pedido.direccionCiudad}, ${pedido.direccionProv}
            </td>
          </tr>
        </table>
      </div>

      <!-- TABLA DE PRODUCTOS -->
      <div style="padding: 24px 40px;">
        <p style="margin: 0 0 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a0aec0;">Detalle de Productos</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #2d3748;">
              <th style="padding: 10px 8px; text-align: left; font-size: 11px; color: #e2e8f0; text-transform: uppercase; letter-spacing: 1px;">Producto</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: #e2e8f0; text-transform: uppercase; letter-spacing: 1px;">Cant.</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; color: #e2e8f0; text-transform: uppercase; letter-spacing: 1px;">Precio Unit.</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; color: #e2e8f0; text-transform: uppercase; letter-spacing: 1px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <!-- TOTALES -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; text-align: right; font-size: 13px; color: #718096;">Subtotal productos:</td>
            <td style="padding: 8px; text-align: right; font-size: 13px; color: #4a5568; font-weight: 600; width: 120px;">$${subtotal.toLocaleString('es-AR')}</td>
          </tr>
          ${costoEnvio > 0 ? `
          <tr>
            <td style="padding: 8px; text-align: right; font-size: 13px; color: #718096;">Costo de envío:</td>
            <td style="padding: 8px; text-align: right; font-size: 13px; color: #4a5568; font-weight: 600; width: 120px;">$${costoEnvio.toLocaleString('es-AR')}</td>
          </tr>` : '<tr><td style="padding: 8px; text-align: right; font-size: 12px; color: #a0aec0;">Envío:</td><td style="padding: 8px; text-align: right; font-size: 12px; color: #68d391; font-weight: 700; width: 120px;">GRATIS</td></tr>'}
          <tr style="background-color: #2d3748; border-radius: 8px;">
            <td style="padding: 14px 8px; text-align: right; font-size: 14px; color: #e2e8f0; font-weight: 700; border-radius: 6px 0 0 6px;">TOTAL ABONADO:</td>
            <td style="padding: 14px 8px; text-align: right; font-size: 18px; color: #68d391; font-weight: 900; width: 120px; border-radius: 0 6px 6px 0;">$${total.toLocaleString('es-AR')}</td>
          </tr>
        </table>
      </div>

      <!-- INFO DE PAGO Y ENTREGA -->
      <div style="padding: 0 40px 24px; border-bottom: 1px solid #edf2f7;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 12px 16px; background: #f7fafc; border-radius: 8px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px;">Método de Pago</p>
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #2d3748;">${pedido.metodoPago?.nombre ?? 'No especificado'}</p>
            </td>
            <td style="width: 4px;"></td>
            <td style="width: 50%; padding: 12px 16px; background: #f7fafc; border-radius: 8px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px;">Método de Entrega</p>
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #2d3748;">${pedido.metodoEntrega?.nombre ?? 'No especificado'}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- FOOTER -->
      <div style="padding: 24px 40px; text-align: center; background: #f7fafc;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #4a5568;">¡Gracias por tu compra en <strong>${nombreTienda}</strong>! 🎉</p>
        <p style="margin: 0 0 16px; font-size: 12px; color: #a0aec0;">Guardá este email como comprobante de tu compra.</p>
        <div style="display: inline-flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          ${wsp ? `<a href="https://wa.me/${wspNumLimpio}" style="font-size: 12px; color: #25D366; text-decoration: none; font-weight: 600;">💬 WhatsApp</a>` : ''}
          ${instagram ? `<a href="https://instagram.com/${instagram.replace('@','')}" style="font-size: 12px; color: #e1306c; text-decoration: none; font-weight: 600;">📸 Instagram</a>` : ''}
          ${sitioWeb ? `<a href="${sitioWeb}" style="font-size: 12px; color: #3182ce; text-decoration: none; font-weight: 600;">🌐 Sitio Web</a>` : ''}
        </div>
        <p style="margin: 20px 0 0; font-size: 11px; color: #cbd5e0;">Este es un comprobante automático · ${nombreTienda}</p>
      </div>

    </div>
  </body>
  </html>
  `;

  return enviarEmail({
    para: email,
    asunto: `🧾 Tu comprobante de compra en ${nombreTienda} — ${nroComprobante}`,
    html,
  });
}

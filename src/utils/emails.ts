import { env } from '../config/env';
import { transporter } from '../config/mailer';

interface OpcionesEmail {
  para: string;
  asunto: string;
  html: string;
}

// ─── Design Tokens (sincronizados con el frontend) ────────────────────────────
const T = {
  bg:          '#f7f4ef',   // fondo warm off-white
  surface:     '#ffffff',
  dark:        '#15110e',   // texto principal
  darkMid:     '#2c241f',
  muted:       '#64584f',   // texto secundario
  mutedLight:  '#b0a49c',
  accent:      '#ff6b3d',   // naranja principal
  purple:      '#7c6bff',   // acento púrpura
  purpleLight: '#cbb7ff',
  green:       '#25D366',
  border:      'rgba(23,18,15,0.10)',
  borderLight: 'rgba(23,18,15,0.06)',
};

// ─── Layout base de todos los emails ─────────────────────────────────────────
function layout(contenido: string, nombreTienda: string = 'TiendiZi'): string {
  return `<!DOCTYPE html>
<html dir="ltr" lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${nombreTienda}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${T.bg};font-family:'Georgia',serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${T.bg};min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background-color:${T.surface};border-radius:16px;
                      overflow:hidden;border:1px solid ${T.border};
                      box-shadow:0 8px 40px rgba(23,18,15,0.08);">

          <!-- Header con marca -->
          <tr>
            <td style="background-color:${T.dark};padding:32px 40px 28px;text-align:center;">

              <!-- Logo wordmark con acento naranja -->
              <div style="display:inline-block;margin-bottom:6px;">
                <span style="font-family:'Georgia',serif;font-size:28px;font-weight:900;
                             letter-spacing:-0.04em;color:#ffffff;">
                  Tiendi<span style="color:${T.accent};">Zi</span>
                </span>
              </div>

              <!-- Línea decorativa naranja / púrpura -->
              <div style="margin:10px auto 0;width:64px;height:3px;
                          background:linear-gradient(90deg,${T.accent},${T.purple});
                          border-radius:99px;"></div>

              <p style="margin:12px 0 0;font-size:11px;color:${T.mutedLight};
                         text-transform:uppercase;letter-spacing:0.14em;">
                ${nombreTienda}
              </p>
            </td>
          </tr>

          <!-- Contenido dinámico -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${contenido}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:${T.bg};border-top:1px solid ${T.borderLight};text-align:center;">
              <p style="margin:0;font-size:11px;color:${T.mutedLight};letter-spacing:0.04em;">
                © ${new Date().getFullYear()} ${nombreTienda} · Powered by
                <span style="color:${T.accent};font-weight:700;">TiendiZi</span>
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:${T.mutedLight};">
                Este es un mensaje automático, por favor no respondas este email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helpers de UI reutilizables ──────────────────────────────────────────────

function badge(texto: string, color: string = T.accent): string {
  return `<span style="display:inline-block;padding:3px 12px;border-radius:99px;
                       background-color:${color}22;color:${color};font-size:11px;
                       font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
    ${texto}
  </span>`;
}

function botonPrimario(texto: string, url: string, color: string = T.dark): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
      <tr>
        <td style="background-color:${color};border-radius:12px;
                   box-shadow:0 6px 20px rgba(23,18,15,0.18);">
          <a href="${url}" target="_blank"
             style="display:inline-block;padding:14px 36px;font-family:Arial,sans-serif;
                    font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;
                    text-transform:uppercase;letter-spacing:0.12em;">
            ${texto}
          </a>
        </td>
      </tr>
    </table>`;
}

function divider(): string {
  return `<div style="margin:28px 0;border:none;border-top:1px solid ${T.borderLight};"></div>`;
}

function infoBox(contenido: string, colorBorde: string = T.accent): string {
  return `
    <div style="border-left:3px solid ${colorBorde};background-color:${T.bg};
                border-radius:0 10px 10px 0;padding:16px 20px;margin:20px 0;">
      ${contenido}
    </div>`;
}

function h1(texto: string): string {
  return `<h1 style="margin:0 0 12px;font-family:'Georgia',serif;font-size:26px;
                     font-weight:900;color:${T.dark};letter-spacing:-0.03em;
                     line-height:1.15;">${texto}</h1>`;
}

function p(texto: string, estilos: string = ''): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${T.muted};
                    line-height:1.7;${estilos}">${texto}</p>`;
}

// ─── Bloque contacto tienda ───────────────────────────────────────────────────
function bloqueContacto(tienda: any): string {
  const whatsapp = tienda?.whatsapp;
  const telefono = tienda?.usuario?.telefono;
  if (!whatsapp && !telefono) return '';

  const items: string[] = [];
  if (whatsapp) {
    const n = whatsapp.replace(/\D/g, '');
    items.push(`
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${T.muted};">
          <span style="font-size:16px;">📱</span>&nbsp;
          <strong style="color:${T.dark};">WhatsApp:</strong>&nbsp;
          <a href="https://wa.me/${n}"
             style="color:${T.green};text-decoration:none;font-weight:700;">${whatsapp}</a>
        </td>
      </tr>`);
  }
  if (telefono) {
    items.push(`
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${T.muted};">
          <span style="font-size:16px;">☎️</span>&nbsp;
          <strong style="color:${T.dark};">Teléfono:</strong>&nbsp;${telefono}
        </td>
      </tr>`);
  }

  return `
    ${divider()}
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;
               letter-spacing:0.1em;color:${T.mutedLight};">¿Dudas sobre tu pedido?</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>${items.join('')}</tbody>
    </table>`;
}

// ─── Bloque método de entrega ─────────────────────────────────────────────────
function mensajeEntregaConfirmado(pedido: any): string {
  const nombre = (pedido.metodoEntrega?.nombre ?? '').toLowerCase();

  if (nombre.includes('retiro') || nombre.includes('local') || nombre.includes('sucursal')) {
    const dir = pedido.tienda?.aboutUs?.direccion ?? 'la dirección del local';
    return infoBox(`
      <p style="margin:0;font-size:14px;color:${T.dark};">
        <strong>🏪 Retiro en local</strong><br>
        <span style="color:${T.muted};">Podés pasar a retirar <strong>a partir de las 18:00 hs</strong>
        en <strong>${dir}</strong>. Te avisamos por WhatsApp si hay cambios.</span>
      </p>`, '#3182CE');
  }
  if (['uber','rappi','glovo','mensajer'].some(k => nombre.includes(k))) {
    const wsp = pedido.tienda?.whatsapp;
    const n = wsp ? wsp.replace(/\D/g,'') : '';
    return infoBox(`
      <p style="margin:0;font-size:14px;color:${T.dark};">
        <strong>🚗 Envío por aplicación</strong><br>
        <span style="color:${T.muted};">Nos contactaremos <strong>por WhatsApp</strong>
        para coordinar la entrega.
        ${wsp ? `(<a href="https://wa.me/${n}" style="color:${T.accent};">${wsp}</a>)` : ''}</span>
      </p>`, '#d69e2e');
  }
  if (['cadet','moto','propi'].some(k => nombre.includes(k))) {
    const wsp = pedido.tienda?.whatsapp;
    const n = wsp ? wsp.replace(/\D/g,'') : '';
    return infoBox(`
      <p style="margin:0;font-size:14px;color:${T.dark};">
        <strong>🏍️ Cadete propio</strong><br>
        <span style="color:${T.muted};">Nuestro cadete se comunicará con vos para coordinar la entrega.
        ${wsp ? `(<a href="https://wa.me/${n}" style="color:${T.accent};">${wsp}</a>)` : ''}</span>
      </p>`, '#38a169');
  }
  return infoBox(`
    <p style="margin:0;font-size:14px;color:${T.dark};">
      <strong>📦 ${pedido.metodoEntrega?.nombre ?? 'Entrega'}</strong><br>
      <span style="color:${T.muted};">Nos pondremos en contacto para coordinar la entrega.</span>
    </p>`);
}

function bloqueSeguimiento(pedido: any): string {
  if (!pedido.nroSeguimiento) return '';
  const url = pedido.urlSeguimiento;
  return infoBox(`
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;
               letter-spacing:0.1em;color:${T.purple};">Seguimiento del envío</p>
    <p style="margin:0 0 ${url ? '14px' : '0'};font-size:15px;font-weight:700;color:${T.dark};">
      📬 N° <span style="font-family:monospace;color:${T.purple};">${pedido.nroSeguimiento}</span>
    </p>
    ${url ? botonPrimario('Seguir mi paquete →', url, T.purple) : ''}
  `, T.purple);
}

// ─── BASE SENDER ─────────────────────────────────────────────────────────────

export async function enviarEmail(opciones: OpcionesEmail): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to: opciones.para,
      subject: opciones.asunto,
      html: opciones.html,
    });
    console.log(`✅ [EMAIL] Enviado a ${opciones.para} — ID: ${info.messageId}`);
    if (env.esDevelopment && info) {
      try {
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) console.log(`📧 [EMAIL] Preview: ${previewUrl}`);
      } catch { /* no es Ethereal */ }
    }
    return true;
  } catch (error) {
    console.error(`❌ [EMAIL] Error enviando a ${opciones.para}:`, error);
    return false;
  }
}

// ─── EMAILS ADMIN ─────────────────────────────────────────────────────────────

export async function enviarEmailVerificacion(
  email: string, nombre: string, tokenVerificacion: string
): Promise<boolean> {
  const url = `${env.FRONTEND_URL}/verify-email?token=${tokenVerificacion}`;
  const contenido = `
    ${badge('Verificación de cuenta')}
    <div style="margin-top:24px;">
      ${h1(`¡Bienvenido, ${nombre}! 👋`)}
      ${p(`Para empezar a usar <strong style="color:${T.dark};">TiendiZi</strong> y gestionar tu tienda, necesitás confirmar tu email.`)}
      ${p(`Este enlace <strong>expira en 24 horas</strong>.`)}
      ${botonPrimario('Verificar mi email →', url)}
    </div>
    ${divider()}
    <p style="margin:0;font-size:12px;color:${T.mutedLight};text-align:center;">
      Si no creaste una cuenta en TiendiZi, podés ignorar este mensaje.
    </p>`;
  return enviarEmail({
    para: email,
    asunto: '✉️ Verificá tu email — TiendiZi',
    html: layout(contenido, 'TiendiZi'),
  });
}

export async function enviarEmailResetPassword(
  email: string, nombre: string, tokenReset: string, nombreTienda: string = 'TiendiZi'
): Promise<boolean> {
  const url = `${env.FRONTEND_URL}/reset-password?token=${tokenReset}`;
  const contenido = `
    ${badge('Seguridad de cuenta', T.purple)}
    <div style="margin-top:24px;">
      ${h1('Restablecer contraseña 🔐')}
      ${p(`Hola <strong style="color:${T.dark};">${nombre}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta en <strong>${nombreTienda}</strong>.`)}
      ${p(`Si fuiste vos, hacé clic en el botón. Si no solicitaste esto, ignorá este email — tu contraseña no cambiará.`)}
      ${p(`Este enlace <strong>expira en 1 hora</strong>.`)}
      ${botonPrimario('Cambiar contraseña →', url, T.purple)}
    </div>`;
  return enviarEmail({
    para: email,
    asunto: `🔐 Restablecer contraseña — ${nombreTienda}`,
    html: layout(contenido, nombreTienda),
  });
}

// ─── EMAILS CLIENTES ──────────────────────────────────────────────────────────

export async function enviarEmailVerificacionAlCliente(
  email: string, nombre: string, tokenVerificacion: string, nombreTienda: string
): Promise<boolean> {
  const url = `${env.FRONTEND_URL}/verify-email?token=${tokenVerificacion}`;
  const contenido = `
    ${badge('Bienvenida')}
    <div style="margin-top:24px;">
      ${h1(`¡Bienvenido/a a ${nombreTienda}! 🎉`)}
      ${p(`Hola <strong style="color:${T.dark};">${nombre}</strong>, ya casi estás listo/a. Solo falta confirmar tu email para completar el registro.`)}
      ${p(`Este enlace <strong>expira en 24 horas</strong>.`)}
      ${botonPrimario('Confirmar mi email →', url)}
    </div>
    ${divider()}
    <p style="margin:0;font-size:12px;color:${T.mutedLight};text-align:center;">
      Si no te registraste en ${nombreTienda}, ignorá este mensaje.
    </p>`;
  return enviarEmail({
    para: email,
    asunto: `✉️ Confirmá tu email — ${nombreTienda}`,
    html: layout(contenido, nombreTienda),
  });
}

// ─── EMAILS PEDIDOS ───────────────────────────────────────────────────────────

export async function enviarEmailNuevoPedidoAlCliente(
  email: string, nombre: string, pedido: any, nombreTienda: string
): Promise<boolean> {
  const itemsHtml = pedido.items.map((item: any) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 font-size:13px;color:${T.dark};">
        <strong>${item.nombreProd}</strong>
        ${item.nombreVar ? `<br><span style="font-size:11px;color:${T.mutedLight};">${item.nombreVar}</span>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 text-align:center;font-size:13px;color:${T.muted};">${item.cantidad}</td>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 text-align:right;font-size:13px;color:${T.muted};">
        $${Number(item.precioUnit).toLocaleString('es-AR')}
      </td>
    </tr>`).join('');

  const contenido = `
    ${badge('Pedido recibido ✓')}
    <div style="margin-top:24px;">
      ${h1(`¡Gracias por tu compra, ${nombre}!`)}
      ${p(`Tu pedido <strong style="color:${T.dark};">#${pedido.id}</strong> en <strong>${nombreTienda}</strong> fue recibido correctamente y está en espera de confirmación. Te avisaremos cuando esté listo.`)}
    </div>

    <!-- Resumen -->
    <p style="margin:24px 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;
               letter-spacing:0.1em;color:${T.mutedLight};">Resumen del pedido</p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid ${T.borderLight};border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background-color:${T.dark};">
          <th style="padding:10px 8px;text-align:left;font-size:11px;color:rgba(255,255,255,0.7);
                     text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Producto</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;color:rgba(255,255,255,0.7);
                     text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Cant.</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;color:rgba(255,255,255,0.7);
                     text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Precio</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:14px 8px;text-align:right;font-size:13px;
                                  font-weight:700;color:${T.dark};">Total:</td>
          <td style="padding:14px 8px;text-align:right;font-size:18px;font-weight:900;
                     color:${T.accent};">$${Number(pedido.total).toLocaleString('es-AR')}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Info entrega -->
    ${infoBox(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;
                 letter-spacing:0.08em;color:${T.mutedLight};">Entrega</p>
      <p style="margin:0;font-size:13px;color:${T.dark};">
        <strong>${pedido.metodoEntrega?.nombre || 'A confirmar'}</strong><br>
        <span style="color:${T.muted};">${pedido.direccionCalle} ${pedido.direccionNumero || ''}, ${pedido.direccionCiudad}</span>
      </p>`)}

    ${bloqueContacto(pedido.tienda)}`;

  return enviarEmail({
    para: email,
    asunto: `✅ Pedido #${pedido.id} recibido — ${nombreTienda}`,
    html: layout(contenido, nombreTienda),
  });
}

export async function enviarEmailNuevoPedidoAlOwner(
  emailOwner: string, nombreOwner: string, pedido: any, nombreTienda: string
): Promise<boolean> {
  const urlDashboard = `${env.FRONTEND_URL}/dashboard/pedidos`;
  const contenido = `
    ${badge('Nuevo pedido 🚀', T.accent)}
    <div style="margin-top:24px;">
      ${h1('¡Nuevo pedido recibido!')}
      ${p(`Hola <strong style="color:${T.dark};">${nombreOwner}</strong>, acaba de entrar un nuevo pedido en <strong>${nombreTienda}</strong>.`)}
    </div>

    <!-- Datos del pedido -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:${T.bg};border-radius:12px;overflow:hidden;margin:20px 0;">
      <tbody>
        ${[
          ['Pedido', `#${pedido.id}`],
          ['Cliente', pedido.compradorNombre],
          ['Teléfono', pedido.compradorTel],
          ['Total', `$${Number(pedido.total).toLocaleString('es-AR')}`],
          ['Entrega', pedido.metodoEntrega?.nombre || 'No especificado'],
        ].map(([k, v], i) => `
        <tr style="${i % 2 === 0 ? `background:${T.borderLight};` : ''}">
          <td style="padding:11px 16px;font-size:12px;color:${T.mutedLight};
                     font-weight:700;text-transform:uppercase;letter-spacing:0.08em;width:40%;">${k}</td>
          <td style="padding:11px 16px;font-size:13px;color:${T.dark};font-weight:600;">${v}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    ${botonPrimario('Ver pedido en el dashboard →', urlDashboard)}`;

  return enviarEmail({
    para: emailOwner,
    asunto: `🚀 Nuevo pedido #${pedido.id} — ${nombreTienda}`,
    html: layout(contenido, nombreTienda),
  });
}

export async function enviarEmailEstadoPedidoActualizado(
  email: string, nombre: string, pedido: any, nuevoEstado: string, nombreTienda: string
): Promise<boolean> {
  const estados: Record<string, { label: string; color: string; msg: string; emoji: string }> = {
    CONFIRMADO: {
      label: 'Confirmado',  color: '#3182CE',
      msg: 'Tu pedido fue confirmado. ¡Ya estamos preparándolo con cuidado!', emoji: '✅',
    },
    EN_CAMINO: {
      label: 'En camino',   color: T.purple,
      msg: '¡Buenas noticias! Tu pedido ya está en camino hacia vos.', emoji: '🚚',
    },
    ENTREGADO: {
      label: 'Entregado',   color: '#38A169',
      msg: 'Tu pedido fue entregado exitosamente. ¡Que lo disfrutes!', emoji: '🎉',
    },
    CANCELADO: {
      label: 'Cancelado',   color: '#E53E3E',
      msg: 'Lamentablemente tu pedido fue cancelado. Contactanos si tenés dudas.', emoji: '❌',
    },
  };

  const info = estados[nuevoEstado] ?? {
    label: nuevoEstado, color: T.muted,
    msg: 'El estado de tu pedido fue actualizado.', emoji: '📋',
  };

  if (nuevoEstado === 'ENTREGADO') {
    enviarFactura(email, nombre, pedido, nombreTienda).catch(() => {});
  }

  const contenido = `
    ${badge(`${info.emoji} ${info.label}`, info.color)}
    <div style="margin-top:24px;">
      ${h1(`Actualización de pedido #${pedido.id ?? pedido}`)}
      ${p(`Hola <strong style="color:${T.dark};">${nombre}</strong>, ${info.msg}`)}
    </div>

    <!-- Estado visual -->
    <div style="text-align:center;margin:24px 0;padding:24px 20px;
                background:${T.bg};border-radius:12px;border:1px solid ${T.borderLight};">
      <p style="margin:0 0 6px;font-size:11px;color:${T.mutedLight};
                 text-transform:uppercase;letter-spacing:0.1em;">Estado actual</p>
      <p style="margin:0;font-size:30px;font-weight:900;color:${info.color};
                 font-family:'Georgia',serif;letter-spacing:-0.02em;">${info.label}</p>
    </div>

    ${nuevoEstado === 'CONFIRMADO' ? mensajeEntregaConfirmado(pedido) : ''}
    ${nuevoEstado === 'EN_CAMINO'  ? bloqueSeguimiento(pedido) : ''}
    ${bloqueContacto(pedido.tienda)}`;

  return enviarEmail({
    para: email,
    asunto: `${info.emoji} Tu pedido #${pedido.id ?? pedido} está ${info.label} — ${nombreTienda}`,
    html: layout(contenido, nombreTienda),
  });
}

// ─── FACTURA / COMPROBANTE ────────────────────────────────────────────────────

export async function enviarFactura(
  email: string, nombre: string, pedido: any, nombreTienda: string
): Promise<boolean> {
  const nroComprobante = `FC-${String(pedido.id).padStart(6, '0')}`;
  const compradorNombre = nombre || pedido.compradorNombre;
  const fechaEmision = new Date(pedido.actualizadoEn || pedido.creadoEn)
    .toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' });

  const itemsHtml = (pedido.items ?? []).map((item: any) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 font-size:13px;color:${T.dark};">
        <strong>${item.nombreProd}</strong>
        ${item.nombreVar ? `<br><span style="font-size:11px;color:${T.mutedLight};">${item.nombreVar}</span>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 text-align:center;font-size:13px;color:${T.muted};">${item.cantidad}</td>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 text-align:right;font-size:13px;color:${T.muted};">
        $${Number(item.precioUnit).toLocaleString('es-AR')}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid ${T.borderLight};
                 text-align:right;font-size:13px;font-weight:700;color:${T.dark};">
        $${Number(item.subtotal).toLocaleString('es-AR')}
      </td>
    </tr>`).join('');

  const subtotal   = Number(pedido.subtotal ?? pedido.total);
  const costoEnvio = Number(pedido.costoEnvio ?? 0);
  const total      = Number(pedido.total);
  const wsp        = pedido.tienda?.whatsapp;
  const wspN       = wsp ? wsp.replace(/\D/g,'') : '';
  const instagram  = pedido.tienda?.instagram ?? '';
  const sitioWeb   = pedido.tienda?.sitioWeb ?? '';

  // El comprobante tiene su propio layout especial (sin card genérica)
  const html = `<!DOCTYPE html>
<html dir="ltr" lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${T.bg};font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${T.bg};min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background:${T.surface};border-radius:16px;
                      overflow:hidden;border:1px solid ${T.border};
                      box-shadow:0 8px 40px rgba(23,18,15,0.08);">

          <!-- HEADER FACTURA -->
          <tr>
            <td style="background:${T.dark};padding:32px 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.45);
                               text-transform:uppercase;letter-spacing:0.16em;">Comprobante de Compra</p>
                    <span style="font-family:'Georgia',serif;font-size:26px;font-weight:900;
                                 letter-spacing:-0.04em;color:#fff;">
                      Tiendi<span style="color:${T.accent};">Zi</span>
                    </span>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">${nombreTienda}</p>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <span style="display:inline-block;padding:5px 14px;border-radius:99px;
                                 background:#38a16922;color:#68d391;font-size:12px;font-weight:700;">
                      ✓ Entregado
                    </span>
                  </td>
                </tr>
              </table>
              <!-- Franja naranja decorativa -->
              <div style="margin-top:20px;height:3px;border-radius:99px;
                          background:linear-gradient(90deg,${T.accent},${T.purple});"></div>
            </td>
          </tr>

          <!-- NRO + FECHA -->
          <tr>
            <td style="padding:20px 40px;background:${T.bg};border-bottom:1px solid ${T.borderLight};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 3px;font-size:10px;color:${T.mutedLight};
                               text-transform:uppercase;letter-spacing:0.1em;">Comprobante N°</p>
                    <p style="margin:0;font-size:22px;font-weight:900;color:${T.dark};
                               letter-spacing:-0.02em;">${nroComprobante}</p>
                  </td>
                  <td style="text-align:right;">
                    <p style="margin:0 0 3px;font-size:10px;color:${T.mutedLight};
                               text-transform:uppercase;letter-spacing:0.1em;">Fecha de emisión</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:${T.muted};">${fechaEmision}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DATOS COMPRADOR -->
          <tr>
            <td style="padding:24px 40px;border-bottom:1px solid ${T.borderLight};">
              <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;
                         letter-spacing:0.1em;color:${T.mutedLight};">Datos del comprador</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:${T.dark};padding:3px 0;">
                    <strong>Nombre:</strong> ${compradorNombre}
                  </td>
                  <td style="font-size:13px;color:${T.dark};text-align:right;padding:3px 0;">
                    <strong>Email:</strong> ${pedido.compradorEmail}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="font-size:13px;color:${T.muted};padding:3px 0;">
                    <strong>Dirección:</strong>
                    ${pedido.direccionCalle} ${pedido.direccionNumero ?? ''},
                    ${pedido.direccionCiudad}, ${pedido.direccionProv}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TABLA PRODUCTOS -->
          <tr>
            <td style="padding:24px 40px;">
              <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;
                         letter-spacing:0.1em;color:${T.mutedLight};">Detalle de productos</p>
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid ${T.borderLight};border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:${T.dark};">
                    <th style="padding:10px 8px;text-align:left;font-size:10px;color:rgba(255,255,255,0.65);
                               text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Producto</th>
                    <th style="padding:10px 8px;text-align:center;font-size:10px;color:rgba(255,255,255,0.65);
                               text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Cant.</th>
                    <th style="padding:10px 8px;text-align:right;font-size:10px;color:rgba(255,255,255,0.65);
                               text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">P. Unit.</th>
                    <th style="padding:10px 8px;text-align:right;font-size:10px;color:rgba(255,255,255,0.65);
                               text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>

              <!-- Totales -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:7px;text-align:right;font-size:12px;color:${T.mutedLight};">
                    Subtotal productos:
                  </td>
                  <td style="padding:7px;text-align:right;font-size:13px;color:${T.muted};
                             font-weight:600;width:130px;">
                    $${subtotal.toLocaleString('es-AR')}
                  </td>
                </tr>
                <tr>
                  <td style="padding:7px;text-align:right;font-size:12px;color:${T.mutedLight};">Envío:</td>
                  <td style="padding:7px;text-align:right;font-size:13px;width:130px;
                             ${costoEnvio > 0 ? `color:${T.muted};font-weight:600;` : `color:#38a169;font-weight:700;`}">
                    ${costoEnvio > 0 ? `$${costoEnvio.toLocaleString('es-AR')}` : 'GRATIS'}
                  </td>
                </tr>
                <tr style="background:${T.dark};border-radius:8px;">
                  <td style="padding:14px 8px;text-align:right;font-size:13px;
                             color:rgba(255,255,255,0.75);font-weight:700;">
                    TOTAL ABONADO:
                  </td>
                  <td style="padding:14px 8px;text-align:right;font-size:20px;font-weight:900;
                             color:${T.accent};width:130px;">
                    $${total.toLocaleString('es-AR')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PAGO Y ENTREGA -->
          <tr>
            <td style="padding:0 40px 28px;border-bottom:1px solid ${T.borderLight};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:48%;padding:14px 16px;background:${T.bg};border-radius:10px;
                             vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:10px;color:${T.mutedLight};
                               text-transform:uppercase;letter-spacing:0.1em;">Método de pago</p>
                    <p style="margin:0;font-size:13px;font-weight:700;color:${T.dark};">
                      ${pedido.metodoPago?.nombre ?? 'No especificado'}
                    </p>
                  </td>
                  <td style="width:4%;"></td>
                  <td style="width:48%;padding:14px 16px;background:${T.bg};border-radius:10px;
                             vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:10px;color:${T.mutedLight};
                               text-transform:uppercase;letter-spacing:0.1em;">Método de entrega</p>
                    <p style="margin:0;font-size:13px;font-weight:700;color:${T.dark};">
                      ${pedido.metodoEntrega?.nombre ?? 'No especificado'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 40px;background:${T.bg};text-align:center;">
              <p style="margin:0 0 6px;font-size:14px;color:${T.dark};font-weight:700;">
                ¡Gracias por tu compra en ${nombreTienda}! 🎉
              </p>
              <p style="margin:0 0 18px;font-size:12px;color:${T.mutedLight};">
                Guardá este email como comprobante de tu compra.
              </p>
              <div>
                ${wsp        ? `<a href="https://wa.me/${wspN}" style="margin:0 8px;font-size:12px;color:${T.green};text-decoration:none;font-weight:700;">💬 WhatsApp</a>` : ''}
                ${instagram  ? `<a href="https://instagram.com/${instagram.replace('@','')}" style="margin:0 8px;font-size:12px;color:#e1306c;text-decoration:none;font-weight:700;">📸 Instagram</a>` : ''}
                ${sitioWeb   ? `<a href="${sitioWeb}" style="margin:0 8px;font-size:12px;color:${T.purple};text-decoration:none;font-weight:700;">🌐 Sitio Web</a>` : ''}
              </div>
              <div style="margin-top:16px;height:2px;border-radius:99px;
                          background:linear-gradient(90deg,${T.accent},${T.purple});
                          opacity:0.3;"></div>
              <p style="margin:14px 0 0;font-size:10px;color:${T.mutedLight};">
                Comprobante automático · ${nombreTienda} · Powered by
                <strong style="color:${T.accent};">TiendiZi</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return enviarEmail({
    para: email,
    asunto: `🧾 Comprobante de compra — ${nroComprobante} · ${nombreTienda}`,
    html,
  });
}
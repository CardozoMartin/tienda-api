// Servicio de envío de emails.
// Centraliza todas las plantillas y lógica de envío de emails.
import { env } from '../config/env';
import { transporter } from '../config/mailer';

interface OpcionesEmail {
  para: string;
  asunto: string;
  html: string;
}

//emails para enviar al dueño de la tienda
export async function enviarEmail(opciones: OpcionesEmail): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to: opciones.para,
      subject: opciones.asunto,
      html: opciones.html,
    });

    console.log(`✅ [EMAIL] Enviado a ${opciones.para} - ID: ${info.messageId}`);

    // En desarrollo con Ethereal, mostrar la URL de preview
    if (env.esDevelopment && info) {
      try {
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`📧 [EMAIL] Preview: ${previewUrl}`);
        }
      } catch {
        // No es Ethereal, ignorar
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ [EMAIL] Error enviando a ${opciones.para}:`, error);
    return false;
  }
}
export async function enviarEmailVerificacion(
  email: string,
  nombre: string,
  tokenVerificacion: string
): Promise<boolean> {
  const urlVerificacion = `http://localhost:3000${env.API_PREFIX}/auth/verificar-email/${tokenVerificacion}`;

  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Bienvenido a Tienda, ${nombre}!</h2>

          <p>Para completar tu registro, necesitás verificar tu email.</p>

          <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacion}"
               style="background-color: #4CAF50; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verificar Email
            </a>
          </div>

          <p>O copiar este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">
            <code>${urlVerificacion}</code>
          </p>

          <p style="color: #999; font-size: 12px;">
            Este enlace expira en 24 horas.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px;">
            Si no creaste esta cuenta, ignorá este email.
          </p>
        </div>
      </body>
    </html>
  `;

  return enviarEmail({
    para: email,
    asunto: 'Verificá tu email para completar tu registro',
    html,
  });
}
export async function enviarEmailResetPassword(
  email: string,
  nombre: string,
  tokenReset: string
): Promise<boolean> {
  const urlReset = `${env.FRONTEND_URL}/change-password?token=${tokenReset}`;

  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Restablecer Contraseña</h2>

          <p>Hola ${nombre},</p>

          <p>Solicitaste restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlReset}"
               style="background-color: #2196F3; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>

          <p>O copiar este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">
            <code>${urlReset}</code>
          </p>

          <p style="color: #999; font-size: 12px;">
            Este enlace expira en 1 hora.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px;">
            Si no solicitaste un reset, ignorá este email. Tu contraseña seguirá siendo la misma.
          </p>
        </div>
      </body>
    </html>
  `;

  return enviarEmail({
    para: email,
    asunto: 'Restablecer tu contraseña',
    html,
  });
}

//emails para enviar al cliente

export async function enviarEmailVerificacionAlCliente(
  email: string,
  nombre: string,
  tokenVerificacion: string,
  nombreTienda: string
): Promise<boolean> {
  const urlVerificacion = `http://localhost:3000${env.API_PREFIX}/clientes/verificar-email/${tokenVerificacion}`;

  const html = `
    <html dir="ltr">
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Bienvenido a ${nombreTienda}, ${nombre}!</h2>

          <p>Para completar tu registro, necesitás verificar tu email.</p>

          <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacion}"
               style="background-color: #4CAF50; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verificar Email
            </a>
          </div>

          <p>O copiar este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">
            <code>${urlVerificacion}</code>
          </p>

          <p style="color: #999; font-size: 12px;">
            Este enlace expira en 24 horas.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px;">
            Si no creaste esta cuenta, ignorá este email.
          </p>
        </div>
      </body>
    </html>
  `;

  return enviarEmail({
    para: email,
    asunto: 'Verificá tu email para completar tu registro',
    html,
  });
}

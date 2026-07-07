// Motor de envío de campañas. Abstrae el proveedor propio del dueño:
//  - "brevo": API transaccional de Brevo (POST /v3/smtp/email).
//  - "gmail" / "smtp": nodemailer con las credenciales SMTP del dueño.
// La credencial llega YA descifrada desde el service.
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from '../../utils/logger';

export interface ConfigEnvio {
  proveedor: string;          // 'brevo' | 'gmail' | 'smtp'
  remitente: string;          // email del from
  remitenteNombre: string | null;
  host: string | null;
  port: number | null;
  usuario: string | null;
  credencial: string;         // descifrada (API key o password)
}

export interface EmailAEnviar {
  para: string;
  nombre: string | null;
  asunto: string;
  html: string;
}

// Un "sender" listo para mandar N emails con la misma config (reutiliza el transport).
export interface Sender {
  enviar(email: EmailAEnviar): Promise<void>;
  cerrar(): void;
}

// Construye el sender adecuado según el proveedor.
export function crearSender(config: ConfigEnvio): Sender {
  if (config.proveedor === 'brevo') return new BrevoSender(config);
  return new SmtpSender(config);
}

class SmtpSender implements Sender {
  private transporter: Transporter;
  private from: string;

  constructor(config: ConfigEnvio) {
    if (!config.host) throw new Error('Falta el host SMTP en la configuración de email');
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port ?? 587,
      secure: (config.port ?? 587) === 465,
      auth: { user: config.usuario ?? config.remitente, pass: config.credencial },
    });
    this.from = config.remitenteNombre
      ? `"${config.remitenteNombre}" <${config.remitente}>`
      : config.remitente;
  }

  async enviar(email: EmailAEnviar): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: email.para,
      subject: email.asunto,
      html: email.html,
    });
  }

  cerrar(): void {
    this.transporter.close();
  }
}

class BrevoSender implements Sender {
  constructor(private config: ConfigEnvio) {}

  async enviar(email: EmailAEnviar): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.config.credencial,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: this.config.remitente,
          name: this.config.remitenteNombre ?? undefined,
        },
        to: [{ email: email.para, name: email.nombre ?? undefined }],
        subject: email.asunto,
        htmlContent: email.html,
      }),
    });
    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      logger.warn(`[BREVO] Envío rechazado (${res.status}) para ${email.para}: ${detalle}`);
      throw new Error(`Brevo respondió ${res.status}`);
    }
  }

  cerrar(): void {
    /* la API no mantiene conexión abierta */
  }
}

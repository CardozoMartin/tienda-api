// Configuración de Nodemailer para envío de emails.
// Soporta tanto desarrollo (ethereal) como producción (SMTP personalizado).
import nodemailer from "nodemailer";
import { env } from "./env";

// En desarrollo usamos Ethereal Email (sandbox gratuito)
// En producción usamos SMTP real
export let transporter: nodemailer.Transporter;

export async function inicializarMailer() {
  // Si tiene credenciales SMTP configuradas, usar esas
  // Si no, en desarrollo usar Ethereal, en producción fallar
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || "587", 10),
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    console.log(`[MAILER] Usando SMTP = ${env.SMTP_HOST}`);
  } else if (env.esDevelopment) {
    // Crear cuenta de prueba en desarrollo solo si no hay SMTP real
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("[MAILER] Usando Ethereal Email (sandbox)");
  } else {
    throw new Error(
      "[MAILER] Error: En producción necesitás configurar SMTP_HOST, SMTP_USER y SMTP_PASS en .env"
    );
  }
}
//
/**
 * Prueba la conexión del mailer.
 * Útil para verificar que los credenciales SMTP sean correctos.
 */
export async function verificarMailer(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("[MAILER] Conexión verificada exitosamente ✅");
    return true;
  } catch (error) {
    console.error("[MAILER] Error verificando conexión:", error);
    return false;
  }
}

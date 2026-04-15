import "dotenv/config";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "./config/env";

// Inicializar Sentry lo más temprano posible (solo si hay DSN)
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    environment: env.NODE_ENV,
  });
}

import { crearApp } from "./app";
import { prisma } from "./config/prisma";
import { inicializarMailer, verificarMailer } from "./config/mailer";
import { logger } from "./utils/logger";


async function iniciar(): Promise<void> {
  try {
    logger.info("Iniciando servicios...");

    // Verificamos la conexión a la base de datos antes de levantar el servidor
    await prisma.$connect();
    logger.info("✅ Conexión a la base de datos exitosa");

    // Inicializamos el servicio de email
    await inicializarMailer();
    
    // Verificamos que el SMTP esté funcionando
    const mailOk = await verificarMailer();
    if (!mailOk) {
      logger.warn("⚠️  Email SMTP no está disponible - algunos emails no se enviarán");
    }

    const app = crearApp();

    const servidor = app.listen(env.PORT, () => {
      logger.info(`🚀 Servidor iniciado en modo ${env.NODE_ENV}`);
      logger.info(`   Puerto:   ${env.PORT}`);
      logger.info(`   API:      http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`   Health:   http://localhost:${env.PORT}/health`);
    });

    // ─────────────────────────────────────────────
    // GRACEFUL SHUTDOWN
    // Cuando el proceso recibe SIGTERM o SIGINT (Ctrl+C),
    // cerramos el servidor y la conexión a la DB limpiamente.
    // ─────────────────────────────────────────────

    const cerrarLimpiamente = async (señal: string): Promise<void> => {
      logger.info(`\n${señal} recibido. Cerrando servidor...`);

      servidor.close(async () => {
        logger.info("Servidor HTTP cerrado");

        await prisma.$disconnect();
        logger.info("Conexión a DB cerrada");

        process.exit(0);
      });

      // Si el cierre tarda más de 10 segundos, forzamos la salida
      setTimeout(() => {
        logger.error("Cierre forzado después de 10 segundos");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => cerrarLimpiamente("SIGTERM"));
    process.on("SIGINT", () => cerrarLimpiamente("SIGINT"));

    // Capturamos errores no manejados para evitar que el proceso muera silenciosamente
    process.on("unhandledRejection", (razon) => {
      logger.error("Promise rechazada no manejada:", razon);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Excepción no capturada:", error);
      process.exit(1);
    });
  } catch (error) {
    logger.error("❌ Error fatality al iniciar el servidor:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

iniciar();


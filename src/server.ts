// Entry point del servidor.
// Importa la app configurada y la levanta en el puerto definido.
import "dotenv/config";
import { crearApp } from "./app";
import { prisma } from "./config/prisma";
import { env } from "./config/env";
import { inicializarMailer, verificarMailer } from "./config/mailer";

async function iniciar(): Promise<void> {
  try {
    // Verificamos la conexión a la base de datos antes de levantar el servidor
    await prisma.$connect();
    console.log("✅ Conexión a la base de datos exitosa");

    // Inicializamos el servicio de email
    await inicializarMailer();
    
    // Verificamos que el SMTP esté funcionando
    const mailOk = await verificarMailer();
    if (!mailOk) {
      console.warn("⚠️  Email SMTP no está disponible - algunos emails no se enviarán");
    }

    const app = crearApp();

    const servidor = app.listen(env.PORT, () => {
      console.log(`
🚀 Servidor iniciado
   Entorno:  ${env.NODE_ENV}
   Puerto:   ${env.PORT}
   API:      http://localhost:${env.PORT}${env.API_PREFIX}
   Health:   http://localhost:${env.PORT}/health
      `);
    });

    // ─────────────────────────────────────────────
    // GRACEFUL SHUTDOWN
    // Cuando el proceso recibe SIGTERM o SIGINT (Ctrl+C),
    // cerramos el servidor y la conexión a la DB limpiamente.
    // Esto evita pérdida de datos en requests en curso.
    // ─────────────────────────────────────────────

    const cerrarLimpiamente = async (señal: string): Promise<void> => {
      console.log(`\n${señal} recibido. Cerrando servidor...`);

      servidor.close(async () => {
        console.log("Servidor HTTP cerrado");

        await prisma.$disconnect();
        console.log("Conexión a DB cerrada");

        process.exit(0);
      });

      // Si el cierre tarda más de 10 segundos, forzamos la salida
      setTimeout(() => {
        console.error("Cierre forzado después de 10 segundos");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => cerrarLimpiamente("SIGTERM"));
    process.on("SIGINT", () => cerrarLimpiamente("SIGINT"));

    // Capturamos errores no manejados para evitar que el proceso muera silenciosamente
    process.on("unhandledRejection", (razon) => {
      console.error("Promise rechazada no manejada:", razon);
    });

    process.on("uncaughtException", (error) => {
      console.error("Excepción no capturada:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

iniciar();

// Configuración de la aplicación Express.
// Separamos la app del server.ts para facilitar el testing.
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { manejadorErrores, noEncontrado } from './middleware/errores.middleware';
import router from './router';

/**
 * Crea y configura la aplicación Express con todos sus middlewares.
 * Exportar la app por separado del server permite usarla en tests.
 */
export function crearApp(): Application {
  const app = express();

  // ─────────────────────────────────────────────
  // SEGURIDAD
  // ─────────────────────────────────────────────

  // Helmet agrega headers HTTP de seguridad (XSS, clickjacking, etc.)
  app.use(helmet());

  // CORS: solo permitimos el origen configurado en .env
  app.use(
    cors({
      origin: [env.CORS_ORIGIN, 'http://localhost:5174'],
      credentials: true, // Permite cookies y headers de auth
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate limiting: protege contra abuso y ataques de fuerza bruta
  // const limiter = rateLimit({
  //   windowMs: env.RATE_LIMIT_WINDOW_MS,
  //   max: env.RATE_LIMIT_MAX,
  //   message: {
  //     ok: false,
  //     mensaje: "Demasiadas solicitudes. Por favor intentá más tarde.",
  //   },
  //   standardHeaders: true,   // Agrega headers RateLimit-* estándar
  //   legacyHeaders: false,     // Desactiva X-RateLimit-* deprecated
  // });

  // app.use(limiter);

  // ─────────────────────────────────────────────
  // PARSING Y LOGGING
  // ─────────────────────────────────────────────

  // Parseamos JSON con límite de 10mb para permitir imágenes en base64 si fuera necesario
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Morgan: logging de requests HTTP
  // En desarrollo: formato colorido con detalles
  // En producción: formato 'combined' estándar para herramientas de análisis
  app.use(morgan(env.esDevelopment ? 'dev' : 'combined'));

  // ─────────────────────────────────────────────
  // HEALTH CHECK
  // Ruta simple para verificar que el servidor está funcionando.
  // Útil para load balancers y monitoreo.
  // ─────────────────────────────────────────────

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      mensaje: 'API funcionando',
      entorno: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ─────────────────────────────────────────────
  // RUTAS
  // ─────────────────────────────────────────────

  app.use(env.API_PREFIX, router);

  // ─────────────────────────────────────────────
  // MANEJO DE ERRORES
  // Siempre van al final, después de las rutas.
  // ─────────────────────────────────────────────

  // 404: captura cualquier ruta no definida
  app.use(noEncontrado);

  // Manejador global de errores (4 parámetros = Express lo reconoce como error handler)
  app.use(manejadorErrores);

  return app;
}

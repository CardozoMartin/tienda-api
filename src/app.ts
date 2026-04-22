import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { manejadorErrores, noEncontrado } from './middleware/errores.middleware';
import router from './router';
import { logStream } from './utils/logger';

export function crearApp(): Application {
  const app = express();


  // SEGURIDAD


  // Helmet agrega headers HTTP de seguridad (XSS, clickjacking, etc.)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // CORS: solo permitimos el origen configurado en .env
  app.use(
    cors({
      origin: env.esProduccion ? env.CORS_ORIGIN : [env.CORS_ORIGIN, 'http://localhost:5174', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
    })
  );

  // Rate limiting: protege contra abuso y ataques de fuerza bruta
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: {
      ok: false,
      mensaje: "Demasiadas solicitudes. Por favor intentá más tarde.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);



  // Parseamos JSON con límite de 10mb para permitir imágenes en base64 si fuera necesario
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Morgan: logging de requests HTTP pasando por Winston
  app.use(morgan(env.esDevelopment ? 'dev' : 'combined', { stream: logStream }));



  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      mensaje: 'API funcionando',
      entorno: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });


  // RUTAS

  app.use(env.API_PREFIX, router);


  // MANEJO DE ERRORES
  // Sentry Error Handler (debe ir ANTES de cualquier otro manejador de errores, pero DESPUÉS de las rutas)
  if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // 404: captura cualquier ruta no definida
  app.use(noEncontrado);

  // Manejador global de errores (4 parámetros = Express lo reconoce como error handler)
  app.use(manejadorErrores);

  return app;
}



import winston from 'winston';
import path from 'path';
import { env } from '../config/env';

// Definición de colores para la consola
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato personalizado para la consola (legible)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Formato JSON para archivos (fácil de procesar por herramientas de monitoreo)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Configuración de los transportes (donde se guardan los logs)
const transports = [
  // Consola: siempre activa, nivel debug en desarrollo
  new winston.transports.Console({
    format: consoleFormat,
    level: env.esDevelopment ? 'debug' : 'info',
  }),
  
  // Archivo de errores: solo errores críticos
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: fileFormat,
  }),
  
  // Archivo combinado: todos los logs
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: fileFormat,
  }),
];

/**
 * Logger centralizado de la aplicación.
 * Uso: logger.info('mensaje'), logger.error('mensaje', error)
 */
export const logger = winston.createLogger({
  level: env.esDevelopment ? 'debug' : 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  transports,
});

// Stream para morgan (permite que los logs de HTTP pasen por Winston)
export const logStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

import { Response } from 'express';
import slugify from 'slugify';
import { ParametrosPaginacion, RespuestaApi, ResultadoPaginado } from '../types';
import { htmlExitoVerificacion } from './html';


// Utilidades compartidas por toda la aplicación.
// RESPUESTAS HTTP ESTANDARIZADAS


// Envía una respuesta de éxito con formato estándar.
export function responderOk<T>(
  res: Response,
  datos: T,
  mensaje: string = 'Operación exitosa',
  codigoHttp: number = 200
): void {
  const respuesta: RespuestaApi<T> = {
    ok: true,
    mensaje,
    datos,
  };
  res.status(codigoHttp).json(respuesta);
}

// Envía una respuesta de error con formato estándar.
export function responderError(
  res: Response,
  mensaje: string,
  codigoHttp: number = 500,
  errores?: string[]
): void {
  const respuesta: RespuestaApi = {
    ok: false,
    mensaje,
    errores,
  };
  res.status(codigoHttp).json(respuesta);
}

// Responde con un resultado paginado, incluyendo metadatos de paginación.
export function responderPaginado<T>(
  res: Response,
  resultado: ResultadoPaginado<T>,
  mensaje: string = 'Consulta exitosa'
): void {
  res.status(200).json({
    ok: true,
    mensaje,
    datos: resultado.datos,
    paginacion: {
      total: resultado.total,
      pagina: resultado.pagina,
      limite: resultado.limite,
      totalPaginas: resultado.totalPaginas,
    },
  });
}


// PAGINACIÓN


// Extrae los parámetros de paginación de la query string, con valores por defecto y validación básica.
export function extraerPaginacion(query: Record<string, unknown>): ParametrosPaginacion {
  const pagina = Math.max(1, parseInt(String(query['pagina'] ?? '1'), 10) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(String(query['limite'] ?? '20'), 10) || 20));
  const orden = typeof query['orden'] === 'string' ? query['orden'] : 'creadoEn';
  const direccion = query['direccion'] === 'asc' ? 'asc' : 'desc';

  return { pagina, limite, orden, direccion };
}

// Calcula el número de registros a saltar para la paginación (skip).
export function calcularSkip(pagina: number, limite: number): number {
  return (pagina - 1) * limite;
}

// Construye un resultado paginado a partir de los datos, total y parámetros de paginación.
export function construirPaginacion<T>(
  datos: T[],
  total: number,
  pagina: number,
  limite: number
): ResultadoPaginado<T> {
  return {
    datos,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}


// SLUGS


// Genera un slug a partir de un texto, usando la librería slugify.
export function generarSlug(texto: string): string {
  return slugify(texto, {
    lower: true,
    strict: true, 
    locale: 'es', 
    trim: true,
  });
}

/// Genera un slug único agregando un sufijo aleatorio de 4 dígitos.
export function generarSlugUnico(texto: string): string {
  const base = generarSlug(texto);
  const sufijo = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
  return `${base}-${sufijo}`;
}


// VALIDACIONES


/// Verifica si un string es un color hexadecimal válido (ejemplo: #A1B2C3).
export function esColorHexValido(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Verifica si un valor es un entero positivo (ejemplo: 1, 2, 3, etc.).
export function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}


// HTML RESPONSES

// Genera HTML de éxito en la verificación de email.
export function generarHtmlVerificacionExitosa(): string {
  return htmlExitoVerificacion;
}

// Genera HTML de error en la verificación de email, con un mensaje personalizado.
export function generarHtmlVerificacionError(
  mensaje: string = 'El token no es válido o ha expirado'
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error en Verificación</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          animation: slideIn 0.6s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
          animation: errorAnimation 0.8s ease-out 0.3s both;
        }
        @keyframes errorAnimation {
          from {
            transform: scale(0) rotateZ(0deg);
          }
          to {
            transform: scale(1) rotateZ(0deg);
          }
        }
        .error-icon {
          color: white;
          font-size: 45px;
          font-weight: bold;
        }
        h1 {
          color: #333;
          font-size: 32px;
          margin-bottom: 15px;
        }
        .message {
          color: #666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 12px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(245, 87, 108, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <span class="error-icon">✕</span>
        </div>
        <h1>Error en Verificación</h1>
        <p class="message">${mensaje}</p>
        <a href="/" class="button">Volver al login</a>
      </div>
    </body>
    </html>
  `;
}

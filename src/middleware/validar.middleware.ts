// Middleware genérico de validación con Zod.
// Recibe un schema de Zod y valida body, params o query del request.
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type FuenteValidacion = "body" | "params" | "query";

/**
 * Fábrica de middleware de validación.
 * Valida la fuente especificada del request contra el schema de Zod.
 * Si la validación falla, llama a next(error) con un ZodError que el
 * manejador global convierte en una respuesta 400 descriptiva.
 *
 * Uso: router.post("/", validar(CrearTiendaDto), controller)
 *
 * @param schema - Schema de Zod que define la forma esperada de los datos
 * @param fuente - De dónde extraer los datos: body, params o query
 */
export function validar(
  schema: ZodSchema,
  fuente: FuenteValidacion = "body"
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // parse() lanza ZodError si los datos no son válidos
      // También transforma los datos (coerce, default, etc.) y los devuelve tipados
      const datosValidados = schema.parse(req[fuente]);

      // Reemplazamos la fuente con los datos ya validados y transformados
      // Esto es importante para que los controllers reciban datos limpios
      req[fuente] = datosValidados;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pasamos el ZodError al manejador global que lo convierte en 400
        next(error);
        return;
      }
      next(error);
    }
  };
}

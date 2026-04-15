import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type FuenteValidacion = "body" | "params" | "query";


export function validar(schema: ZodSchema, fuente: FuenteValidacion = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Fusionamos params + body para rutas que tienen token en la URL
      const datos = fuente === 'body' ? { ...req.params, ...req.body } : req[fuente];

      const datosValidados = schema.parse(datos);

      req[fuente] = datosValidados;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
        return;
      }
      next(error);
    }
  };
}

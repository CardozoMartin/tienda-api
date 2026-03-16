import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { responderOk } from "../../utils/helpers";
import { z } from "zod";
import {
  CrearCategoriaSchema,
  CrearMetodoPagoSchema,
  CrearMetodoEntregaSchema,
  CrearPlantillaSchema,
  ActualizarRolSchema,
  ActualizarActivoSchema,
  CrearTagSchema,
} from "./admin.dto";

export class AdminController {
  private service: AdminService;

  constructor() {
    this.service = new AdminService();
  }

  dashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.dashboard());
    } catch (e) { next(e); }
  };

  // Categorías
  listarCategorias = async (_req: Request, res: Response, next: NextFunction) => {
    try { responderOk(res, await this.service.listarCategorias()); } catch (e) { next(e); }
  };

  crearCategoria = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cat = await this.service.crearCategoria(req.body as z.infer<typeof CrearCategoriaSchema>);
      responderOk(res, cat, "Categoría creada", 201);
    } catch (e) { next(e); }
  };

  actualizarCategoria = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params["id"] as string, 10);
      responderOk(res, await this.service.actualizarCategoria(id, req.body));
    } catch (e) { next(e); }
  };

  eliminarCategoria = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarCategoria(parseInt(req.params["id"] as string, 10));
      responderOk(res, null, "Categoría eliminada");
    } catch (e) { next(e); }
  };

  // Métodos de pago
  listarMetodosPago = async (_req: Request, res: Response, next: NextFunction) => {
    try { responderOk(res, await this.service.listarMetodosPago()); } catch (e) { next(e); }
  };

  crearMetodoPago = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.crearMetodoPago(req.body as z.infer<typeof CrearMetodoPagoSchema>), "Creado", 201);
    } catch (e) { next(e); }
  };

  actualizarMetodoPago = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.actualizarMetodoPago(parseInt(req.params["id"] as string, 10), req.body));
    } catch (e) { next(e); }
  };

  // Métodos de entrega
  listarMetodosEntrega = async (_req: Request, res: Response, next: NextFunction) => {
    try { responderOk(res, await this.service.listarMetodosEntrega()); } catch (e) { next(e); }
  };

  crearMetodoEntrega = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.crearMetodoEntrega(req.body as z.infer<typeof CrearMetodoEntregaSchema>), "Creado", 201);
    } catch (e) { next(e); }
  };

  actualizarMetodoEntrega = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.actualizarMetodoEntrega(parseInt(req.params["id"] as string, 10), req.body));
    } catch (e) { next(e); }
  };

  // Plantillas
  listarPlantillas = async (_req: Request, res: Response, next: NextFunction) => {
    try { responderOk(res, await this.service.listarPlantillas()); } catch (e) { next(e); }
  };

  crearPlantilla = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.crearPlantilla(req.body as z.infer<typeof CrearPlantillaSchema>), "Creada", 201);
    } catch (e) { next(e); }
  };

  actualizarPlantilla = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.actualizarPlantilla(parseInt(req.params["id"] as string, 10), req.body));
    } catch (e) { next(e); }
  };

  // Usuarios
  listarUsuarios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagina = parseInt(String(req.query["pagina"] ?? "1"), 10);
      const limite = parseInt(String(req.query["limite"] ?? "20"), 10);
      const { datos, total } = await this.service.listarUsuarios(pagina, limite);
      res.json({ ok: true, datos, total });
    } catch (e) { next(e); }
  };

  cambiarRol = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params["id"] as string, 10);
      const { rol } = req.body as z.infer<typeof ActualizarRolSchema>;
      responderOk(res, await this.service.cambiarRol(id, rol));
    } catch (e) { next(e); }
  };

  cambiarActivo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params["id"] as string, 10);
      const { activo } = req.body as z.infer<typeof ActualizarActivoSchema>;
      responderOk(res, await this.service.cambiarActivo(id, activo));
    } catch (e) { next(e); }
  };

  // Tags
  listarTags = async (_req: Request, res: Response, next: NextFunction) => {
    try { responderOk(res, await this.service.listarTags()); } catch (e) { next(e); }
  };

  crearTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      responderOk(res, await this.service.crearTag(req.body as z.infer<typeof CrearTagSchema>), "Tag creado", 201);
    } catch (e) { next(e); }
  };

  actualizarTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params["id"] as string, 10);
      responderOk(res, await this.service.actualizarTag(id, req.body));
    } catch (e) { next(e); }
  };

  eliminarTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarTag(parseInt(req.params["id"] as string, 10));
      responderOk(res, null, "Tag eliminado");
    } catch (e) { next(e); }
  };

  eliminarMetodoPago = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarMetodoPago(parseInt(req.params["id"] as string, 10));
      responderOk(res, null, "Método de pago eliminado");
    } catch (e) { next(e); }
  };

  eliminarMetodoEntrega = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarMetodoEntrega(parseInt(req.params["id"] as string, 10));
      responderOk(res, null, "Método de entrega eliminado");
    } catch (e) { next(e); }
  };

  eliminarPlantilla = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.eliminarPlantilla(parseInt(req.params["id"] as string, 10));
      responderOk(res, null, "Plantilla eliminada");
    } catch (e) { next(e); }
  };
}
import { Request, Response, NextFunction } from "express";
import { CarritoService } from "./carrito.service";
import { CarritoRepository } from "./carrito.repository";
import { ProductosRepository } from "../productos/productos.repository";
import { responderOk } from "../../utils/helpers";
import { ErrorApi, RequestAutenticado } from "../../types";

const carritoService = new CarritoService(new CarritoRepository(), new ProductosRepository());

export class CarritoController {

  //controlador para obtener el carrito de compras de un usuario
  obtenerCarrito = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = Number(req.params.tiendaId);
      let sessionId = (req.headers["x-session-id"] as string) || (req.query.sessionId as string);

      if (!tiendaId) throw new ErrorApi("Falta tiendaId", 400);
      if (!sessionId) {
        sessionId = "invitado-" + Date.now();
      }

      const carrito = await carritoService.obtenerCarrito(tiendaId, sessionId);
      responderOk(res, carrito);
    } catch (error) {
      next(error);
    }
  };

  //controlador para agregar un item al carrito de compras, con validación de datos y manejo de sesión
  agregarItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = Number(req.body.tiendaId);
      const sessionId = (req.headers["x-session-id"] as string) || req.body.sessionId;
      const clienteId = (req as RequestAutenticado).usuario?.sub || null;
      const { productoId, varianteId, cantidad } = req.body;

      if (!tiendaId || !sessionId || !productoId || !cantidad) {
        throw new ErrorApi("Faltan datos requeridos (tiendaId, sessionId, productoId, cantidad)", 400);
      }

      const carrito = await carritoService.agregarItem({
        tiendaId,
        sessionId,
        clienteId,
        productoId,
        varianteId,
        cantidad,
      });

      responderOk(res, carrito, "Item agregado exitosamente", 201);
    } catch (error) {
      next(error);
    }
  };

  //controlador para actualizar la cantidad de un item en el carrito de compras, con validación de datos
  actualizarCantidad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = Number(req.body.tiendaId);
      const sessionId = (req.headers["x-session-id"] as string) || req.body.sessionId;
      const { itemId, cantidad } = req.body;

      if (!tiendaId || !sessionId || !itemId || !cantidad) {
        throw new ErrorApi("Faltan datos requeridos (tiendaId, sessionId, itemId, cantidad)", 400);
      }

      const carrito = await carritoService.actualizarCantidad({
        tiendaId,
        sessionId,
        itemId,
        cantidad,
      });

      responderOk(res, carrito, "Cantidad actualizada exitosamente");
    } catch (error) {
      next(error);
    }
  };

  //controlador para eliminar un item del carrito de compras, con validación de datos
  eliminarItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = Number(req.query.tiendaId || req.body.tiendaId);
      const sessionId = (req.headers["x-session-id"] as string) || (req.query.sessionId as string);
      const itemId = Number(req.params.itemId);

      if (!tiendaId || !sessionId || !itemId) {
        throw new ErrorApi("Faltan datos requeridos (tiendaId, sessionId, itemId)", 400);
      }

      const carrito = await carritoService.eliminarItem({
        tiendaId,
        sessionId,
        itemId,
      });

      responderOk(res, carrito, "Item eliminado exitosamente");
    } catch (error) {
      next(error);
    }
  };

  //controlador para vaciar el carrito de compras, con validación de datos
  vaciarCarrito = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiendaId = Number(req.params.tiendaId);
      const sessionId = String(req.params.sessionId);

      if (!tiendaId || !sessionId) {
        throw new ErrorApi("Faltan datos requeridos (tiendaId, sessionId)", 400);
      }

      const carrito = await carritoService.vaciarCarrito(tiendaId, sessionId);
      responderOk(res, carrito, "Carrito vaciado exitosamente");
    } catch (error) {
      next(error);
    }
  };
}

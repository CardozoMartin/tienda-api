import { Router } from "express";
import { CarritoController } from "./carrito.controller";
import { autenticarOpcional } from "../../middleware/auth.middleware";

const router = Router();
const controller = new CarritoController();

// Extraemos el token opcional para asociar clienteId si el usuario está logueado
router.get("/:tiendaId/:sessionId", autenticarOpcional, controller.obtenerCarrito);
router.post("/items", autenticarOpcional, controller.agregarItem);
router.put("/items", autenticarOpcional, controller.actualizarCantidad);
router.delete("/items/:itemId", autenticarOpcional, controller.eliminarItem);
router.delete("/:tiendaId/:sessionId", autenticarOpcional, controller.vaciarCarrito);

export default router;
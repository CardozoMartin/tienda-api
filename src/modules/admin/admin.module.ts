// ═══════════════════════════════════════════════════
// MÓDULO DE ADMINISTRACIÓN COMPLETO
// Gestión de: categorías, tags, métodos de pago/entrega, plantillas, usuarios.
// Solo accesible con rol ADMIN.
// ═══════════════════════════════════════════════════

import { Router } from "express";
import { AdminController } from "./admin.controller";
import { autenticar, autorizar } from "../../middleware/auth.middleware";
import { validar } from "../../middleware/validar.middleware";
import { RolUsuario } from "@prisma/client";
import {
  CrearCategoriaSchema,
  CrearMetodoPagoSchema,
  CrearMetodoEntregaSchema,
  CrearPlantillaSchema,
  ActualizarRolSchema,
  ActualizarActivoSchema,
  CrearTagSchema,
} from "./admin.dto";

// ─────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────

export const adminRouter = Router();
const ctrl = new AdminController();
const soloAdmin = [autenticar, autorizar(RolUsuario.ADMIN)];

adminRouter.use(...soloAdmin); // Todos los endpoints requieren ADMIN

adminRouter.get("/dashboard", ctrl.dashboard);

// Categorías
adminRouter.get("/categorias", ctrl.listarCategorias);
adminRouter.post("/categorias", validar(CrearCategoriaSchema), ctrl.crearCategoria);
adminRouter.put("/categorias/:id", validar(CrearCategoriaSchema.partial()), ctrl.actualizarCategoria);
adminRouter.delete("/categorias/:id", ctrl.eliminarCategoria);

// Métodos de pago
adminRouter.get("/metodos-pago", ctrl.listarMetodosPago);
adminRouter.post("/metodos-pago", validar(CrearMetodoPagoSchema), ctrl.crearMetodoPago);
adminRouter.put("/metodos-pago/:id", validar(CrearMetodoPagoSchema.partial()), ctrl.actualizarMetodoPago);
adminRouter.delete("/metodos-pago/:id", ctrl.eliminarMetodoPago);

// Métodos de entrega
adminRouter.get("/metodos-entrega", ctrl.listarMetodosEntrega);
adminRouter.post("/metodos-entrega", validar(CrearMetodoEntregaSchema), ctrl.crearMetodoEntrega);
adminRouter.put("/metodos-entrega/:id", validar(CrearMetodoEntregaSchema.partial()), ctrl.actualizarMetodoEntrega);
adminRouter.delete("/metodos-entrega/:id", ctrl.eliminarMetodoEntrega);

// Plantillas
adminRouter.get("/plantillas", ctrl.listarPlantillas);
adminRouter.post("/plantillas", validar(CrearPlantillaSchema), ctrl.crearPlantilla);
adminRouter.put("/plantillas/:id", validar(CrearPlantillaSchema.partial()), ctrl.actualizarPlantilla);
adminRouter.delete("/plantillas/:id", ctrl.eliminarPlantilla);

// Tags
adminRouter.get("/tags", ctrl.listarTags);
adminRouter.post("/tags", validar(CrearTagSchema), ctrl.crearTag);
adminRouter.put("/tags/:id", validar(CrearTagSchema.partial()), ctrl.actualizarTag);
adminRouter.delete("/tags/:id", ctrl.eliminarTag);

// Usuarios
adminRouter.get("/usuarios", ctrl.listarUsuarios);
adminRouter.patch("/usuarios/:id/rol", validar(ActualizarRolSchema), ctrl.cambiarRol);
adminRouter.patch("/usuarios/:id/activo", validar(ActualizarActivoSchema), ctrl.cambiarActivo);


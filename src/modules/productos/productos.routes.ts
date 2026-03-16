// Rutas de productos.
// Hay dos contextos:
//   1. Rutas públicas: montadas bajo /tiendas/:tiendaId/productos
//   2. Rutas del owner: montadas bajo /mis-productos
import { Router } from "express";
import { ProductosController } from "./productos.controller";
import { validar } from "../../middleware/validar.middleware";
import { autenticar, autorizar } from "../../middleware/auth.middleware";
import { RolUsuario } from "@prisma/client";
import {
  CrearProductoSchema,
  ActualizarProductoSchema,
  CrearVarianteSchema,
  ActualizarVarianteSchema,
  AgregarImagenSchema,
  FiltrosProductosSchema,
} from "./productos.dto";
import { z } from "zod";

const controller = new ProductosController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// ─────────────────────────────────────────────
// ROUTER PÚBLICO: se monta en /tiendas/:tiendaId/productos
// ─────────────────────────────────────────────

export const productosPublicosRouter = Router({ mergeParams: true });

productosPublicosRouter.get(
  "/",
  validar(FiltrosProductosSchema, "query"),
  controller.listarPublicos
);
productosPublicosRouter.get("/:productoId", controller.obtenerPublico);

// ─────────────────────────────────────────────
// ROUTER DEL OWNER: se monta en /mis-productos
// ─────────────────────────────────────────────

export const misProductosRouter = Router();

// CRUD de productos
misProductosRouter.get(
  "/",
  ...soloOwner,
  validar(FiltrosProductosSchema, "query"),
  controller.listarMisProductos
);
misProductosRouter.post("/", ...soloOwner, validar(CrearProductoSchema), controller.crear);
misProductosRouter.get("/:productoId", ...soloOwner, controller.obtenerMiProducto);
misProductosRouter.put("/:productoId", ...soloOwner, validar(ActualizarProductoSchema), controller.actualizar);
misProductosRouter.delete("/:productoId", ...soloOwner, controller.eliminar);

// Tags
misProductosRouter.put(
  "/:productoId/tags",
  ...soloOwner,
  validar(z.object({ tags: z.array(z.string().max(80)).max(10) })),
  controller.actualizarTags
);

// Imágenes
misProductosRouter.post("/:productoId/imagenes", ...soloOwner, validar(AgregarImagenSchema), controller.agregarImagen);
misProductosRouter.delete("/:productoId/imagenes/:imagenId", ...soloOwner, controller.eliminarImagen);

// Variantes
misProductosRouter.post("/:productoId/variantes", ...soloOwner, validar(CrearVarianteSchema), controller.crearVariante);
misProductosRouter.put("/:productoId/variantes/:varianteId", ...soloOwner, validar(ActualizarVarianteSchema), controller.actualizarVariante);
misProductosRouter.delete("/:productoId/variantes/:varianteId", ...soloOwner, controller.eliminarVariante);

// Router principal de la API.
// Registra todos los routers de cada módulo bajo el prefijo /api/v1.
import { Router } from "express";

import authRouter from "./modules/auth/auth.routes";
import tiendasRouter from "./modules/tiendas/tiendas.routes";
import { productosPublicosRouter, misProductosRouter } from "./modules/productos/productos.routes";
import { resenasTiendaRouter, resenasProductoRouter } from "./modules/resenas/resenas.module";
import { adminRouter } from "./modules/admin/admin.module";
import clientesRouter from "./modules/clientes/cliente.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/clientes", clientesRouter);
router.use("/tiendas", tiendasRouter);
router.use("/tiendas/:tiendaId/productos", productosPublicosRouter);
router.use("/mis-productos", misProductosRouter);
router.use("/tiendas/:tiendaId/resenas", resenasTiendaRouter);
router.use("/mis-productos/:productoId/resenas", resenasProductoRouter);
router.use("/admin", adminRouter);

export default router;

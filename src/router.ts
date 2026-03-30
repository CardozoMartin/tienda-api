// Router principal de la API.
// Registra todos los routers de cada módulo bajo el prefijo /api/v1.
import { Router } from 'express';

import { adminRouter } from './modules/admin/admin.module';
import authRouter from './modules/auth/auth.routes';
import clientesRouter from './modules/clientes/cliente.routes';
import { misProductosRouter, productosPublicosRouter } from './modules/productos/productos.routes';
import { resenasProductoRouter, resenasTiendaRouter } from './modules/resenas/resenas.module';
import tiendasRouter from './modules/tiendas/tiendas.routes';
import carritoRouter from './modules/carrito/carrito.routes';
import pedidosRouter from './modules/pedidos/pedidos.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/clientes', clientesRouter);
router.use('/tiendas', tiendasRouter);
router.use('/tiendas/:tiendaId/productos', productosPublicosRouter);
router.use('/mis-productos', misProductosRouter);
router.use('/tiendas/:tiendaId/resenas', resenasTiendaRouter);
router.use('/mis-productos/:productoId/resenas', resenasProductoRouter);
router.use('/admin', adminRouter);
router.use('/carrito', carritoRouter);
router.use('/tiendas/:tiendaId/pedidos', pedidosRouter);
router.use('/pedidos', pedidosRouter); // Para listar todos o por filtros desde el dashboard

export default router;

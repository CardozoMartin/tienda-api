// Router principal de la API.
// Registra todos los routers de cada módulo bajo el prefijo /api/v1.
import { Router } from 'express';

import { adminRouter } from './modules/admin/admin.module';
import aiRouter from './modules/ai/ai.routes';
import authRouter from './modules/auth/auth.routes';
import carritoRouter from './modules/carrito/carrito.routes';
import clientesRouter from './modules/clientes/cliente.routes';
import pedidosRouter from './modules/pedidos/pedidos.routes';
import { misProductosRouter, productosPublicosRouter } from './modules/productos/productos.routes';
import { resenasProductoRouter, resenasProductoPublicoRouter, resenasTiendaRouter } from './modules/resenas/resena.route';
import tiendasRouter from './modules/tiendas/tiendas.routes';
import popupsRouter from './modules/popups/popups.routes';
import pagosRouter, { webhookRouter, mpDashboardRouter } from './modules/pagos/pagos.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import { cuponesOwnerRouter, cuponesPublicoRouter } from './modules/cupones/cupones.routes';
import campanasRouter from './modules/campanas/campanas.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/clientes', clientesRouter);
router.use('/tiendas', tiendasRouter);
router.use('/tiendas/:tiendaId/productos', productosPublicosRouter);
router.use('/mis-productos', misProductosRouter);
router.use('/tiendas/:tiendaId/resenas', resenasTiendaRouter);
router.use('/tiendas/:tiendaId/productos/:productoId/resenas', resenasProductoPublicoRouter);
router.use('/mis-productos/:productoId/resenas', resenasProductoRouter);
router.use('/admin', adminRouter);
router.use('/analytics', analyticsRouter);
router.use('/cupones', cuponesOwnerRouter);
router.use('/tiendas/:tiendaId/cupones', cuponesPublicoRouter);
router.use('/carrito', carritoRouter);
router.use('/campanas', campanasRouter);
router.use('/tiendas/:tiendaId/pedidos', pedidosRouter);
router.use('/tiendas/:tiendaId/pedidos/:pedidoId', pagosRouter);
router.use('/pedidos', pedidosRouter);
router.use('/pagos', webhookRouter);
router.use('/tiendas', mpDashboardRouter);
router.use('/', popupsRouter);
router.use('/ai', aiRouter);

// Ruta de prueba para verificar la integración con Sentry
router.get('/debug-sentry', function mainHandler() {
  throw new Error('My first Sentry error!');
});

export default router;

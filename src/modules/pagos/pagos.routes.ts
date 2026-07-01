import { Router } from 'express';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { RolUsuario } from '@prisma/client';
import { PagosController } from './pagos.controller';

const controller = new PagosController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// ── Rutas del pedido (público desde la tienda) ──
// Montadas en /tiendas/:tiendaId/pedidos/:pedidoId
const router = Router({ mergeParams: true });
router.post('/pagar', controller.crearPreferencia);

// ── Rutas del dashboard (owner autenticado) ──
export const mpDashboardRouter = Router();
mpDashboardRouter.get('/mi-tienda/mp/estado',  ...soloOwner, controller.resumenMp);
mpDashboardRouter.post('/mi-tienda/mp/test',   ...soloOwner, controller.testConexion);
mpDashboardRouter.delete('/mi-tienda/mp',      ...soloOwner, controller.desconectarMp);

// ── Webhook (sin autenticación, llamado por MP) ──
export const webhookRouter = Router();
webhookRouter.post('/webhook', controller.webhook);

export default router;

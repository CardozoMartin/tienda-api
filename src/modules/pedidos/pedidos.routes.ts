import { Router } from 'express';
import { PedidosController } from './pedidos.controller';
import { autenticar, autenticarOpcional } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });
const controller = new PedidosController();

// Rutas Públicas para la tienda (Checkout)
// Nota: 'tiendaId' viene del router principal si se usa con /tiendas/:tiendaId/pedidos
router.post('/', autenticarOpcional, controller.crear);

// Rutas Protegidas (Dashboard / Admin)
router.get('/', autenticar, controller.listar);
router.get('/:id', autenticar, controller.obtenerPorId);
router.patch('/:id/estado', autenticar, controller.actualizarEstado);

export default router;

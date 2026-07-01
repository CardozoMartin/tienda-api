import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { CuponesController } from './cupones.controller';

const controller = new CuponesController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// ── Dashboard del owner: /cupones ──
export const cuponesOwnerRouter = Router();
cuponesOwnerRouter.get('/', ...soloOwner, controller.listar);
cuponesOwnerRouter.post('/', ...soloOwner, controller.crear);
cuponesOwnerRouter.put('/:cuponId', ...soloOwner, controller.actualizar);
cuponesOwnerRouter.delete('/:cuponId', ...soloOwner, controller.eliminar);

// ── Público (storefront): validar un código ──
// Montado en /tiendas/:tiendaId/cupones
export const cuponesPublicoRouter = Router({ mergeParams: true });
cuponesPublicoRouter.post('/validar', controller.validar);

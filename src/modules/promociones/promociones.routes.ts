import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { PromocionesController } from './promociones.controller';

const controller = new PromocionesController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// ── Dashboard del owner: /promociones ──
export const promocionesOwnerRouter = Router();
promocionesOwnerRouter.get('/', ...soloOwner, controller.listar);
promocionesOwnerRouter.post('/', ...soloOwner, controller.crear);
promocionesOwnerRouter.put('/:promocionId', ...soloOwner, controller.actualizar);
promocionesOwnerRouter.delete('/:promocionId', ...soloOwner, controller.eliminar);

// ── Público (storefront): montado en /tiendas/:tiendaId/promociones ──
export const promocionesPublicoRouter = Router({ mergeParams: true });
promocionesPublicoRouter.get('/', controller.listarNav); // links del navbar
promocionesPublicoRouter.get('/:slug', controller.obtenerPorSlug); // landing de la promo

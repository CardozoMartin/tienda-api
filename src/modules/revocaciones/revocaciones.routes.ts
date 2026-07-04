import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { RevocacionesController } from './revocaciones.controller';
import { ActualizarRevocacionSchema, CrearRevocacionSchema } from './revocaciones.dto';

const controller = new RevocacionesController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// ── Público (storefront): crear solicitud ──
// Montado en /tiendas/:tiendaId/revocaciones
export const revocacionesPublicoRouter = Router({ mergeParams: true });
revocacionesPublicoRouter.post('/', validar(CrearRevocacionSchema), controller.crearPublica);

// ── Owner: gestión ──
export const revocacionesOwnerRouter = Router();
revocacionesOwnerRouter.get('/', ...soloOwner, controller.listar);
revocacionesOwnerRouter.put('/:id', ...soloOwner, validar(ActualizarRevocacionSchema), controller.actualizar);

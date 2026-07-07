import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { LegalController } from './legal.controller';
import { GuardarPaginaLegalSchema } from './legal.dto';

const controller = new LegalController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// ── Owner: /legal/:tipo ──
export const legalOwnerRouter = Router();
legalOwnerRouter.get('/:tipo', ...soloOwner, controller.obtener);
legalOwnerRouter.put('/:tipo', ...soloOwner, validar(GuardarPaginaLegalSchema), controller.guardar);

// ── Público: /tiendas/:tiendaId/legal ──
export const legalPublicoRouter = Router({ mergeParams: true });
legalPublicoRouter.get('/', controller.listarActivasPublicas);
legalPublicoRouter.get('/:tipo', controller.obtenerPublica);

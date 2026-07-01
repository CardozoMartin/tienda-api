import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { AnalyticsController } from './analytics.controller';

const router = Router();
const controller = new AnalyticsController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// GET /analytics/resumen?dias=30  (owner autenticado)
router.get('/resumen', ...soloOwner, controller.resumen);

export default router;

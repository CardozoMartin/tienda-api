import { Router } from 'express';
import { AiController } from './ai.controller';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { RolUsuario } from '@prisma/client';

const router = Router();
const controller = new AiController();

router.post(
  '/generate-post',
  autenticar,
  autorizar(RolUsuario.OWNER, RolUsuario.ADMIN),
  controller.generatePost
);

export default router;

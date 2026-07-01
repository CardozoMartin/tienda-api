import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AiController } from './ai.controller';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { RolUsuario } from '@prisma/client';

const router = Router();
const controller = new AiController();

// 10 generaciones por usuario cada 15 minutos
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req: any) => String(req.usuario?.sub ?? req.ip),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes. Podes generar hasta 10 kits cada 15 minutos.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/generate-post',
  autenticar,
  autorizar(RolUsuario.OWNER, RolUsuario.ADMIN),
  aiRateLimit,
  controller.generatePost
);

export default router;

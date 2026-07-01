import { RolUsuario } from '@prisma/client';
import { Router } from 'express';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { CampanasController } from './campanas.controller';
import { CrearCampanaSchema } from './campanas.dto';

const router = Router();
const controller = new CampanasController();

// Todas las rutas de campañas son del dueño de la tienda.
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

router.get('/destinatarios', ...soloOwner, controller.destinatarios);
router.get('/', ...soloOwner, controller.listar);
router.get('/:id', ...soloOwner, controller.obtener);
router.post('/', ...soloOwner, validar(CrearCampanaSchema), controller.crear);
router.post('/:id/enviar', ...soloOwner, controller.enviar);

export default router;

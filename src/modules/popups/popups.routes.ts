import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { uploadSingle } from '../../config/multer.config';
import { PopupsController } from './popups.controller';
import { CrearPopupSchema, ActualizarPopupSchema } from './popups.dto';

const router = Router();
const controller = new PopupsController();

const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// Protegidas (dashboard)
router.get('/mi-tienda/popups', ...soloOwner, controller.listar);
router.post('/mi-tienda/popups', ...soloOwner, validar(CrearPopupSchema), controller.crear);
router.put('/mi-tienda/popups/:popupId', ...soloOwner, validar(ActualizarPopupSchema), controller.actualizar);
router.post('/mi-tienda/popups/:popupId/imagen', ...soloOwner, uploadSingle, controller.subirImagen);
router.delete('/mi-tienda/popups/:popupId', ...soloOwner, controller.eliminar);

// Pública (storefront)
router.get('/tiendas/:tiendaId/popup', controller.obtenerActivo);

export default router;

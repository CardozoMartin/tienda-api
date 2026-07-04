import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { GuiasTallesController } from './guias-talles.controller';
import { ActualizarGuiaTallesSchema, GuiaTallesSchema } from './guias-talles.dto';

const controller = new GuiasTallesController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// Dashboard del owner: /guias-talles
export const guiasTallesRouter = Router();
guiasTallesRouter.get('/', ...soloOwner, controller.listar);
guiasTallesRouter.post('/', ...soloOwner, validar(GuiaTallesSchema), controller.crear);
guiasTallesRouter.put('/:guiaId', ...soloOwner, validar(ActualizarGuiaTallesSchema), controller.actualizar);
guiasTallesRouter.delete('/:guiaId', ...soloOwner, controller.eliminar);

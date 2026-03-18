// Rutas del módulo de autenticación.
import { Router } from 'express';
import { autenticar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { AuthController } from './auth.controller';
import {
  CambiarPasswordSchema,
  ConfirmarResetSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegistrarseSchema,
  SolicitarResetSchema,
} from './auth.dto';

const router = Router();
const controller = new AuthController();

// Rutas públicas (no requieren token)
router.post('/registro', validar(RegistrarseSchema), controller.registrarse);
router.post('/login', validar(LoginSchema), controller.login);
router.post('/refresh', validar(RefreshTokenSchema), controller.refrescarToken);
router.get('/verificar-email/:token', controller.verificarEmail);
router.post('/solicitar-reset', validar(SolicitarResetSchema), controller.solicitarReset);
router.post('/confirmar-reset/:token', validar(ConfirmarResetSchema), controller.confirmarReset);

// Rutas protegidas (requieren token válido)
router.put(
  '/cambiar-password',
  autenticar,
  validar(CambiarPasswordSchema),
  controller.cambiarPassword
);

export default router;

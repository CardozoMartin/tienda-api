import { Router } from 'express';
import { autenticar, autenticarCliente } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';

import {
  ActualizarClienteSchema,
  CambiarPasswordClienteSchema,
  LoginClienteSchema,
  RegistroClienteSchema,
  SolicitarResetPasswordClienteSchema,
  ConfirmarResetPasswordClienteSchema,
} from './cliente.dto';
import { ClienteController } from './cliente.controller';

const router = Router();
const controllerCliente = new ClienteController();

//Rutas Publicas
router.post('/registro', validar(RegistroClienteSchema), controllerCliente.registro);
router.post('/login', validar(LoginClienteSchema), controllerCliente.login);
router.get('/verificar-email/:token', controllerCliente.verificarEmail);
router.post(
  '/olvide-password',
  validar(SolicitarResetPasswordClienteSchema),
  controllerCliente.solicitarResetPassword
);
router.post(
  '/reset-password',
  validar(ConfirmarResetPasswordClienteSchema),
  controllerCliente.confirmarResetPassword
);

//Rutas Protegidas (perfil — usa autenticar genérico)
router.get('/perfil', autenticar, controllerCliente.obtenerPerfil);
router.put(
  '/perfil',
  autenticar,
  validar(ActualizarClienteSchema),
  controllerCliente.actualizarPerfil
);
router.post(
  '/cambiar-password',
  autenticar,
  validar(CambiarPasswordClienteSchema),
  controllerCliente.cambiarPassword
);

// Ruta protegida exclusiva para clientes: ver sus propios pedidos
router.get('/mis-pedidos', autenticarCliente, controllerCliente.obtenerMisPedidos);

export default router;

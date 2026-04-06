import { Router } from 'express';
import { autenticar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import {
  actualizarPerfilCliente,
  cambiarPasswordCliente,
  loginCliente,
  obtenerPerfilCliente,
  registroCliente,
  verificarEmailCliente,
  solicitarResetPasswordCliente,
  confirmarResetPasswordCliente,
} from './cliente.controller';
import {
  ActualizarClienteSchema,
  CambiarPasswordClienteSchema,
  LoginClienteSchema,
  RegistroClienteSchema,
  SolicitarResetPasswordClienteSchema,
  ConfirmarResetPasswordClienteSchema,
} from './cliente.dto';

const router = Router();

// ─────────────────────────────────────────────
// RUTAS PÚBLICAS (sin autenticación)
// ─────────────────────────────────────────────

/**
 * POST /api/v1/clientes/registro
 * Registrar nuevo cliente
 */
router.post('/registro', validar(RegistroClienteSchema), registroCliente);

/**
 * POST /api/v1/clientes/login
 * Autenticar cliente
 */
router.post('/login', validar(LoginClienteSchema), loginCliente);

/**
 * GET /api/v1/clientes/verificar-email/:token
 * Verificar email con token
 */
router.get('/verificar-email/:token', verificarEmailCliente);

/**
 * POST /api/v1/clientes/olvide-password
 * Solicitar reset de contraseña
 */
router.post('/olvide-password', validar(SolicitarResetPasswordClienteSchema), solicitarResetPasswordCliente);

/**
 * POST /api/v1/clientes/reset-password
 * Confirmar reset de contraseña
 */
router.post('/reset-password', validar(ConfirmarResetPasswordClienteSchema), confirmarResetPasswordCliente);

// ─────────────────────────────────────────────
// RUTAS PROTEGIDAS (requieren autenticación)
// ─────────────────────────────────────────────

/**
 * GET /api/v1/clientes/perfil
 * Obtener perfil del cliente autenticado
 */
router.get('/perfil', autenticar, obtenerPerfilCliente);

/**
 * PUT /api/v1/clientes/perfil
 * Actualizar perfil del cliente
 */
router.put('/perfil', autenticar, validar(ActualizarClienteSchema), actualizarPerfilCliente);

/**
 * POST /api/v1/clientes/cambiar-password
 * Cambiar contraseña
 */
router.post(
  '/cambiar-password',
  autenticar,
  validar(CambiarPasswordClienteSchema),
  cambiarPasswordCliente
);

export default router;

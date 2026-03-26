import { Request, Response } from 'express';
import { responderOk } from '../../utils/helpers';
import { ClienteService } from './cliente.service';

const clienteService = new ClienteService();

/**
 * POST /registro
 * Registrar nuevo cliente en una tienda
 */
export async function registroCliente(req: Request, res: Response, next: any) {
  try {
    const resultado = await clienteService.registro(req.body);
    responderOk(res, resultado, 'Cliente registrado correctamente', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /login
 * Autenticar cliente y obtener JWT
 */
export async function loginCliente(req: Request, res: Response, next: any) {
  try {
    const resultado = await clienteService.login(req.body);
    responderOk(res, resultado, 'Login exitoso', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /verificar-email/:token
 * Verificar email del cliente
 */
export async function verificarEmailCliente(req: Request, res: Response, next: any) {
  try {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const resultado = await clienteService.verificarEmail(token);
    responderOk(res, resultado, 'Email verificado', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /perfil
 * Obtener perfil del cliente autenticado
 */
export async function obtenerPerfilCliente(req: Request, res: Response, next: any) {
  try {
    const clienteId = (req as any).usuario?.id;
    const resultado = await clienteService.obtenerPerfil(clienteId);
    responderOk(res, resultado, 'Perfil obtenido', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /perfil
 * Actualizar perfil del cliente
 */
export async function actualizarPerfilCliente(req: Request, res: Response, next: any) {
  try {
    const clienteId = (req as any).usuario?.id;
    const resultado = await clienteService.actualizarPerfil(clienteId, req.body);
    responderOk(res, resultado, 'Perfil actualizado', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /cambiar-password
 * Cambiar contraseña del cliente autenticado
 */
export async function cambiarPasswordCliente(req: Request, res: Response, next: any) {
  try {
    const clienteId = (req as any).usuario?.id;
    const resultado = await clienteService.cambiarPassword(clienteId, req.body);
    responderOk(res, resultado, 'Contraseña cambiada', 200);
  } catch (error) {
    next(error);
  }
}

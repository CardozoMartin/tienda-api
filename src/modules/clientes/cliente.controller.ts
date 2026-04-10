import { Request, Response } from 'express';
import { responderOk } from '../../utils/helpers';
import { ClienteService } from './cliente.service';

export class ClienteController {
  private service: ClienteService;

  constructor() {
    this.service = new ClienteService();
  }

  //controlador para regsitrar un nuevo cliente
  registro = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const resultado = await this.service.registro(req.body);
      responderOk(res, resultado, 'Cliente registrado correctamente', 201);
    } catch (error) {
      next(error);
    }
  };
  //controlador para iniciar sesión de cliente
  login = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const resultado = await this.service.login(req.body);
      responderOk(res, resultado, 'Login exitoso', 200);
    } catch (error) {
      next(error);
    }
  };
  //controlador para verificar email de cliente
  verificarEmail = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      const resultado = await this.service.verificarEmail(token);
      responderOk(res, resultado, 'Email verificado', 200);
    } catch (error) {
      next(error);
    }
  };

  //controlador para obtener perfil de cliente autenticado
  obtenerPerfil = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const clienteId = (req as any).usuario?.id;
      const resultado = await this.service.obtenerPerfil(clienteId);
      responderOk(res, resultado, 'Perfil obtenido', 200);
    } catch (error) {
      next(error);
    }
  };

  //controlador para actualizar perfil de cliente autenticado
  actualizarPerfil = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const clienteId = (req as any).usuario?.id;
      const resultado = await this.service.actualizarPerfil(clienteId, req.body);
      responderOk(res, resultado, 'Perfil actualizado', 200);
    } catch (error) {
      next(error);
    }
  };

  //controlador para cambiar contraseña de cliente autenticado
  cambiarPassword = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const clienteId = (req as any).usuario?.id;
      const resultado = await this.service.cambiarPassword(clienteId, req.body);
      responderOk(res, resultado, 'Contraseña cambiada', 200);
    } catch (error) {
      next(error);
    }
  };

  //controlador para solicitar reset de contraseña de cliente
  solicitarResetPassword = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const resultado = await this.service.solicitarResetPassword(req.body);
      responderOk(res, resultado, 'Instrucciones enviadas', 200);
    } catch (error) {
      next(error);
    }
  };

  //controlador para confirmar reset de contraseña de cliente con token
  confirmarResetPassword = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const resultado = await this.service.confirmarResetPassword(req.body);
      responderOk(res, resultado, 'Contraseña restablecida', 200);
    } catch (error) {
      next(error);
    }
  };
}

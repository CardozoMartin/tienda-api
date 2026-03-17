// Controller de autenticación.
// Responsabilidad: recibir el request, llamar al service, y enviar la respuesta.
// No contiene lógica de negocio, solo orquestación HTTP.
import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { ErrorApi, RequestAutenticado } from '../../types';
import {
  generarHtmlVerificacionError,
  generarHtmlVerificacionExitosa,
  responderOk,
} from '../../utils/helpers';
import {
  CambiarPasswordDto,
  ConfirmarResetDto,
  LoginDto,
  RefreshTokenDto,
  RegistrarseDto,
  SolicitarResetDto,
} from './auth.dto';
import { AuthService } from './auth.service';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  //registro de usuario, con validación de email único, hashing de contraseña y envío de email de verificación
  registrarse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.service.registrarse(req.body as RegistrarseDto);
      responderOk(res, resultado, resultado.mensaje, 201);
    } catch (error) {
      next(error);
    }
  };

  //login de usuario, devuelve access token y refresh token
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.service.login(req.body as LoginDto);
      responderOk(res, resultado, 'Sesión iniciada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //renueva el access token usando el refresh token
  refrescarToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenDto;
      const resultado = await this.service.refrescarToken(refreshToken);
      responderOk(res, resultado, 'Token renovado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  //verifica el email del usuario usando el token de verificación, y devuelve una página HTML con el resultado
  verificarEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as { token: string };
      await this.service.verificarEmail(token);

      // Devuelve HTML lindo con redirección al login
      const urlLogin = `${env.FRONTEND_URL}/login`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(generarHtmlVerificacionExitosa(urlLogin));
    } catch (error) {
      // Si hay error, devuelve HTML de error
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      const urlLogin = `${env.FRONTEND_URL}/login`;

      const mensaje =
        error instanceof ErrorApi ? error.mensaje : 'Ocurrió un error al verificar tu email';

      res.status(400).send(generarHtmlVerificacionError(mensaje, urlLogin));
    }
  };

  // Cambia la contraseña del usuario autenticado.
  cambiarPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;
      const resultado = await this.service.cambiarPassword(
        usuarioId,
        req.body as CambiarPasswordDto
      );
      responderOk(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  };

  // Solicita el reset de contraseña, generando un token y enviándolo por email.
  solicitarReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.service.solicitarResetPassword(req.body as SolicitarResetDto);
      responderOk(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  };

  // Confirma el reset de contraseña usando el token enviado por email, y actualiza la contraseña.
  confirmarReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await this.service.confirmarResetPassword({
        ...req.body,
        token: req.params.token, // ← Agregar esto
      } as ConfirmarResetDto);
      responderOk(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  };
}

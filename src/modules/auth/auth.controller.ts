// Controller de autenticación.
// Responsabilidad: recibir el request, llamar al service, y enviar la respuesta.
// No contiene lógica de negocio, solo orquestación HTTP.
import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { responderOk } from "../../utils/helpers";
import { RequestAutenticado } from "../../types";
import {
  LoginDto,
  RegistrarseDto,
  CambiarPasswordDto,
  RefreshTokenDto,
  SolicitarResetDto,
  ConfirmarResetDto,
} from "./auth.dto";

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  /**
   * POST /auth/registro
   * Registra un nuevo usuario en el sistema.
   */
  registrarse = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resultado = await this.service.registrarse(req.body as RegistrarseDto);
      responderOk(res, resultado, resultado.mensaje, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/login
   * Autentica al usuario y retorna los tokens.
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resultado = await this.service.login(req.body as LoginDto);
      responderOk(res, resultado, "Sesión iniciada exitosamente");
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh
   * Genera un nuevo access token usando el refresh token.
   */
  refrescarToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenDto;
      const resultado = await this.service.refrescarToken(refreshToken);
      responderOk(res, resultado, "Token renovado exitosamente");
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /auth/verificar-email/:token
   * Verifica el email del usuario usando el token recibido por correo.
   */
  verificarEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params as { token: string };
      const resultado = await this.service.verificarEmail(token);
      responderOk(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /auth/cambiar-password
   * Cambia la contraseña del usuario autenticado.
   * Requiere autenticación.
   */
  cambiarPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

  /**
   * POST /auth/solicitar-reset
   * Inicia el proceso de reset de contraseña.
   */
  solicitarReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resultado = await this.service.solicitarResetPassword(
        req.body as SolicitarResetDto
      );
      responderOk(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/confirmar-reset
   * Confirma el reset de contraseña con el token recibido por email.
   */
  confirmarReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resultado = await this.service.confirmarResetPassword(
        req.body as ConfirmarResetDto
      );
      responderOk(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  };
}

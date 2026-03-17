// Service de autenticación.
// Contiene toda la lógica de negocio: hashing de passwords, generación de tokens,
// validación de expiración, etc. Depende del repository para acceso a datos.
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { ErrorApi, JwtPayload } from '../../types';
import { AuthRepository } from './auth.repository';
import { enviarEmailVerificacion, enviarEmailResetPassword } from '../../utils/emails';
import {
  LoginDto,
  RegistrarseDto,
  CambiarPasswordDto,
  SolicitarResetDto,
  ConfirmarResetDto,
} from './auth.dto';

// Costo del hashing de bcrypt. 12 es un buen balance entre seguridad y velocidad.
const BCRYPT_ROUNDS = 12;

// Duración del token de reset: 1 hora en milisegundos
const DURACION_TOKEN_RESET_MS = 60 * 60 * 1000;

// Duración del token de verificación de email: 24 horas
const DURACION_TOKEN_VERIFICACION_MS = 24 * 60 * 60 * 1000;

export interface TokensAutenticacion {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    avatarUrl: string | null;
    emailVerificado: boolean;
  };
}

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  //servicio para registrar un usuario nuevo, con validación de email único, hashing de contraseña y envío de email de verificación
  async registrarse(datos: RegistrarseDto): Promise<{ mensaje: string }> {
    // Verificamos que el email no esté ya registrado
    const usuarioExistente = await this.repository.buscarPorEmail(datos.email);
    if (usuarioExistente) {
      throw new ErrorApi('Ya existe una cuenta registrada con ese email', 409);
    }

    // Hasheamos la contraseña ANTES de guardarla
    const passwordHash = await bcrypt.hash(datos.password, BCRYPT_ROUNDS);

    // Generamos un token aleatorio para verificación de email
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const tokenVencVerificacion = new Date(Date.now() + DURACION_TOKEN_VERIFICACION_MS);

    await this.repository.crear({
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      passwordHash,
      telefono: datos.telefono,
      tokenVerificacion,
      tokenVencVerificacion,
    });

    // Enviamos el email de verificación
    await enviarEmailVerificacion(datos.email, datos.nombre, tokenVerificacion);

    return {
      mensaje: 'Cuenta creada exitosamente. Revisá tu email para verificar tu cuenta.',
    };
  }

  //servicio para iniciar sesión, con validación de email y contraseña, generación de tokens JWT y verificación de cuenta activa
  async login(datos: LoginDto): Promise<TokensAutenticacion> {
    // Buscamos el usuario - usamos mensaje genérico para no revelar si el email existe
    const usuario = await this.repository.buscarPorEmail(datos.email);
    if (!usuario) {
      throw new ErrorApi('Email o contraseña incorrectos', 401);
    }

    // Verificamos que la cuenta esté activa
    if (!usuario.activo) {
      throw new ErrorApi('Esta cuenta ha sido desactivada', 403);
    }

    // Comparamos la contraseña con el hash almacenado
    const passwordValida = await bcrypt.compare(datos.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new ErrorApi('Email o contraseña incorrectos', 401);
    }

    // Generamos los tokens
    const tokens = this.generarTokens(usuario.id, usuario.email, usuario.rol);

    return {
      ...tokens,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        avatarUrl: usuario.avatarUrl,
        emailVerificado: usuario.emailVerificado,
      },
    };
  }

  //servicio para renovar el access token usando el refresh token, con validación del refresh token y generación de un nuevo access token
  async refrescarToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verificamos el refresh token con su secreto específico
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as unknown as JwtPayload;

      // Verificamos que el usuario todavía exista y esté activo
      const usuario = await this.repository.buscarPorId(payload.sub);
      if (!usuario || !usuario.activo) {
        throw new ErrorApi('Usuario no encontrado o inactivo', 401);
      }

      // Generamos solo un nuevo access token (el refresh token sigue siendo válido)
      const opcionesAccess: SignOptions = {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
      };
      const accessToken = jwt.sign(
        { sub: usuario.id, email: usuario.email, rol: usuario.rol },
        env.JWT_SECRET,
        opcionesAccess
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof ErrorApi) throw error;
      throw new ErrorApi('Refresh token inválido o expirado', 401);
    }
  }

  //servicio para verificar el email del usuario usando el token de verificación, y activar su cuenta
  async verificarEmail(token: string): Promise<{ mensaje: string }> {
    const usuario = await this.repository.buscarPorTokenVerificacion(token);
    if (!usuario) {
      throw new ErrorApi('Token de verificación inválido', 400);
    }

    // Verificamos que el token no haya expirado
    if (usuario.tokenVencVerificacion && usuario.tokenVencVerificacion < new Date()) {
      throw new ErrorApi('El token de verificación ha expirado. Solicitá uno nuevo.', 400);
    }

    await this.repository.verificarEmail(usuario.id);

    return { mensaje: 'Email verificado exitosamente' };
  }

  //servicio para cambiar la contraseña del usuario autenticado, con validación de la contraseña actual y hashing de la nueva contraseña
  async cambiarPassword(
    usuarioId: number,
    datos: CambiarPasswordDto
  ): Promise<{ mensaje: string }> {
    const usuario = await this.repository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new ErrorApi('Usuario no encontrado', 404);
    }

    // Verificamos la contraseña actual antes de permitir el cambio
    const passwordValida = await bcrypt.compare(datos.passwordActual, usuario.passwordHash);
    if (!passwordValida) {
      throw new ErrorApi('La contraseña actual es incorrecta', 400);
    }

    const nuevoHash = await bcrypt.hash(datos.passwordNueva, BCRYPT_ROUNDS);
    await this.repository.actualizarPassword(usuarioId, nuevoHash);

    return { mensaje: 'Contraseña actualizada exitosamente' };
  }

  //servicio para solicitar un reset de contraseña, generando un token de reset y enviándolo por email al usuario
  async solicitarResetPassword(datos: SolicitarResetDto): Promise<{ mensaje: string }> {
    const usuario = await this.repository.buscarPorEmail(datos.email);

    // Respondemos siempre con éxito para no revelar si el email existe (seguridad)
    const mensajeGenerico =
      'Si existe una cuenta con ese email, recibirás las instrucciones para restablecer tu contraseña.';

    if (!usuario || !usuario.activo) {
      return { mensaje: mensajeGenerico };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const vencimiento = new Date(Date.now() + DURACION_TOKEN_RESET_MS);

    await this.repository.guardarTokenReset(usuario.id, token, vencimiento);

    // Enviamos el email con el token
    await enviarEmailResetPassword(usuario.email, usuario.nombre, token);

    return { mensaje: mensajeGenerico };
  }

  //servicio para confirmar el reset de contraseña, validando el token de reset y actualizando la contraseña del usuario
  async confirmarResetPassword(datos: ConfirmarResetDto): Promise<{ mensaje: string }> {
    const usuario = await this.repository.buscarPorTokenReset(datos.token);
    if (!usuario) {
      throw new ErrorApi('Token de reset inválido o ya utilizado', 400);
    }

    if (usuario.tokenVencReset && usuario.tokenVencReset < new Date()) {
      throw new ErrorApi('El token de reset ha expirado. Solicitá uno nuevo.', 400);
    }

    const nuevoHash = await bcrypt.hash(datos.passwordNueva, BCRYPT_ROUNDS);
    await this.repository.actualizarPassword(usuario.id, nuevoHash);

    return { mensaje: 'Contraseña restablecida exitosamente. Ya podés iniciar sesión.' };
  }

  // MÉTODOS PRIVADOS

  //metodo privado para generar access y refresh tokens JWT, con payload de usuario y expiraciones configurables
  private generarTokens(
    usuarioId: number,
    email: string,
    rol: string
  ): { accessToken: string; refreshToken: string } {
    const payload = { sub: usuarioId, email, rol };

    const opcionesAccess: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };
    const opcionesRefresh: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, opcionesAccess);
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, opcionesRefresh);

    return { accessToken, refreshToken };
  }
}

import { RolUsuario } from '@prisma/client';
import { prisma } from '../../config/prisma';

// Definimos el tipo Usuario localmente para no depender del cliente generado.
// Cuando Prisma genera el cliente, este tipo coincide exactamente.
interface UsuarioModel {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  telefono: string | null;
  avatarUrl: string | null;
  emailVerificado: boolean;
  tokenVerificacion: string | null;
  tokenVencVerificacion: Date | null;
  tokenResetPass: string | null;
  tokenVencReset: Date | null;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export class AuthRepository {
  // Busca un usuario por su email.
  async buscarPorEmail(email: string): Promise<UsuarioModel | null> {
    return prisma.usuario.findUnique({
      where: { email },
    });
  }

  // Busca un usuario por su ID.
  async buscarPorId(id: number): Promise<UsuarioModel | null> {
    return prisma.usuario.findUnique({
      where: { id },
    });
  }

  // Crea un nuevo usuario con los datos proporcionados.
  async crear(datos: {
    nombre: string;
    apellido: string;
    email: string;
    passwordHash: string;
    rol?: RolUsuario;
    telefono?: string;
    tokenVerificacion: string;
    tokenVencVerificacion: Date;
  }): Promise<UsuarioModel> {
    return prisma.usuario.create({
      data: datos,
    });
  }

 // Verifica el email de un usuario, activando su cuenta y limpiando los tokens de verificación.
  async verificarEmail(usuarioId: number): Promise<UsuarioModel> {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        emailVerificado: true,
        activo: true,
        tokenVerificacion: null,
        tokenVencVerificacion: null,
      },
    });
  }

  // Busca un usuario por su token de verificación de email.
  async buscarPorTokenVerificacion(token: string): Promise<UsuarioModel | null> {
    return prisma.usuario.findFirst({
      where: { tokenVerificacion: token },
    });
  }

  // Guarda un token de reset de contraseña para un usuario, con su fecha de vencimiento.
  async guardarTokenReset(usuarioId: number, token: string, vencimiento: Date): Promise<void> {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        tokenResetPass: token,
        tokenVencReset: vencimiento,
      },
    });
  }

  // Busca un usuario por su token de reset de contraseña.
  async buscarPorTokenReset(token: string): Promise<UsuarioModel | null> {
    return prisma.usuario.findFirst({
      where: { tokenResetPass: token },
    });
  }

  // Actualiza la contraseña de un usuario, limpiando los tokens de reset.
  async actualizarPassword(usuarioId: number, nuevoHash: string): Promise<void> {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        passwordHash: nuevoHash,
        tokenResetPass: null,
        tokenVencReset: null,
      },
    });
  }
}

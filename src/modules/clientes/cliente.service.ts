import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { enviarEmailVerificacionAlCliente } from '../../utils/emails';
import {
  ActualizarClienteInput,
  CambiarPasswordClienteInput,
  LoginClienteInput,
  LoginResponse,
  RegistroClienteInput,
} from './cliente.dto';
import { ClienteRepository } from './cliente.repository';
import { TiendasRepository } from '../tiendas/tiendas.repository';

export class ClienteService {
  private repo: ClienteRepository;
  private tiendarepo: TiendasRepository

  constructor() {
    this.repo = new ClienteRepository();
    this.tiendarepo = new TiendasRepository();
  }

  //servicio para registrar un nuevo cliente
  async registro(input: RegistroClienteInput) {
    // Verificar si email ya existe en esta tienda
    const clienteExistente = await this.repo.buscarPorEmailEnTienda(input.email, input.tiendaId);

    if (clienteExistente) {
      throw new ErrorApi('Este email ya está registrado en esta tienda', 409);
    }

    // Hashear password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Generar token de verificación
    const tokenVerif = crypto.randomBytes(32).toString('hex');
    const tokenVerifVenc = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Crear cliente
    const cliente = await this.repo.crear({
      tiendaId: input.tiendaId,
      email: input.email,
      nombre: input.nombre,
      apellido: input.apellido,
      telefono: input.telefono,
      passwordHash,
      tokenVerif,
      tokenVerifVenc,
    });
    //ahora buscamos la tienda para obtener su nombre y poder incluirlo en el email
    const tienda = await this.tiendarepo.buscarPorId(input.tiendaId);
    console.log('Tienda encontrada para email de verificación:', tienda);
    // Enviar email de verificación (sin await para no bloquear)
    enviarEmailVerificacionAlCliente(input.email, input.nombre, tokenVerif, tienda.nombre).catch((err: Error) =>
      console.error('Error enviando email verificación:', err)
    );

 

    return {
      id: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      mensaje: 'Registro exitoso. Por favor verifica tu email.',
    };
  }

  //servicio para iniciar sesión de un cliente
  async login(input: LoginClienteInput): Promise<LoginResponse> {
    // Buscar cliente
    const cliente = await this.repo.buscarPorEmailEnTienda(input.email, input.tiendaId);

    if (!cliente) {
      throw new ErrorApi('Email o contraseña incorrectos', 401);
    }

    // Verificar que cliente está activo
    if (!cliente.activo) {
      throw new ErrorApi('Esta cuenta ha sido desactivada', 403);
    }
    //verificamos que el email este activo
    if (!cliente.emailVerificado) {
      throw new ErrorApi('Por favor verifica tu email antes de iniciar sesión', 403);
    }

    // Comparar contraseña
    const passwordValida = await bcrypt.compare(input.password, cliente.passwordHash);

    if (!passwordValida) {
      throw new ErrorApi('Email o contraseña incorrectos', 401);
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: cliente.id,
        email: cliente.email,
        tiendaId: cliente.tiendaId,
        tipo: 'cliente',
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return {
      id: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      emailVerificado: cliente.emailVerificado,
      token,
    };
  }

  /**
   * VERIFICAR EMAIL: Confirmar email del cliente
   */
  async verificarEmail(tokenVerif: string) {
    // Buscar cliente por token
    const cliente = await prisma.clienteTienda.findFirst({
      where: {
        tokenVerif,
        tokenVerifVenc: { gt: new Date() }, // Token no vencido
      },
    });

    if (!cliente) {
      throw new ErrorApi('Token inválido o expirado', 400);
    }

    // Marcar como verificado
    await this.repo.verificarEmail(cliente.id);

    return {
      mensaje: 'Email verificado correctamente',
    };
  }

  /**
   * OBTENER PERFIL: Obtener datos del cliente autenticado
   */
  async obtenerPerfil(clienteId: number) {
    const cliente = await this.repo.buscarPorId(clienteId);

    if (!cliente) {
      throw new ErrorApi('Cliente no encontrado', 404);
    }

    return cliente;
  }

  /**
   * ACTUALIZAR PERFIL: Modificar datos del cliente
   */
  async actualizarPerfil(clienteId: number, input: ActualizarClienteInput) {
    const cliente = await this.repo.actualizar(clienteId, input);

    return {
      id: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      mensaje: 'Perfil actualizado correctamente',
    };
  }

  /**
   * CAMBIAR CONTRASEÑA
   */
  async cambiarPassword(clienteId: number, input: CambiarPasswordClienteInput) {
    // Obtener cliente
    const cliente = await this.repo.buscarPorId(clienteId);

    if (!cliente) {
      throw new ErrorApi('Cliente no encontrado', 404);
    }

    // Verificar contraseña actual (buscar con passwordHash)
    const clienteConPassword = await prisma.clienteTienda.findUnique({
      where: { id: clienteId },
      select: { passwordHash: true },
    });

    const passwordValida = await bcrypt.compare(
      input.passwordActual,
      clienteConPassword!.passwordHash
    );

    if (!passwordValida) {
      throw new ErrorApi('Contraseña actual incorrecta', 401);
    }

    // Hashear nueva contraseña
    const nuevoHash = await bcrypt.hash(input.passwordNueva, 12);

    await this.repo.cambiarPassword(clienteId, nuevoHash);

    return {
      mensaje: 'Contraseña cambiada correctamente',
    };
  }
}

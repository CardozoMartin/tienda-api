// IMPORTANTE: El jest-setup-mocks.js ya ha configurado global.PRISMA_MOCK
// Aquí simplemente usamos ese mock global que está disponible
import jwt from 'jsonwebtoken';
// Mock de emails para no enviar emails reales en tests
jest.mock('../../../utils/emails', () => ({
  enviarEmailVerificacion: jest.fn().mockResolvedValue(undefined),
  enviarEmailResetPassword: jest.fn().mockResolvedValue(undefined),
}));

import { AuthService } from '../auth.service';
import { prisma } from '../../../config/prisma';
import bcrypt from 'bcryptjs';

// Obtener referencia al mock global de Prisma que fue configurado en jest-setup-mocks.js
const prismaMock = (global as any).PRISMA_MOCK || prisma;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    // EXPLICACIÓN: Los jest.fn() se resetean completamente en cada test
    // Esto es más confiable que mockClear() + mockResolvedValue() porque:
    // 1. jest.clearAllMocks() borra COMPLETAMENTE los mocks (historial + configuración)
    // 2. Luego reconfigurados explícitamente para cada test

    // Limpiar historial y configuración de TODOS los mocks
    jest.clearAllMocks();

    // Re-configura los mocks a su estado inicial (sin resolver nada específico)
    // Cada test individual configurará lo que necesite
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.usuario.findFirst.mockResolvedValue(null);
    prismaMock.usuario.create.mockResolvedValue({} as any);
    prismaMock.usuario.update.mockResolvedValue({} as any);

    // EXPLICACIÓN: Creamos una nueva instancia del servicio para cada test
    // Esto asegura que no hay estado compartido entre tests
    service = new AuthService();
  });

  // ─── REGISTRO ────────────────────────────────────────────

  describe('registrarse', () => {
    it('debe registrar un usuario nuevo correctamente', async () => {
      // EXPLICACIÓN: Este test simula el registro de un usuario NUEVO
      // Paso 1: Configuramos el mock para que findUnique retorne NULL
      // Esto significa "este email no existe en la base de datos todavía"
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      // Paso 2: Configuramos el mock para que create retorne un usuario creado
      // Cuando el servicio cree un usuario, queremos simular que la BD retorna el usuario creado
      prismaMock.usuario.create.mockResolvedValue({
        id: 1,
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@test.com',
        passwordHash: 'hash',
        rol: 'CLIENT',
        telefono: null,
        avatarUrl: null,
        emailVerificado: false,
        tokenVerificacion: 'token123',
        tokenVencVerificacion: new Date(),
        tokenResetPass: null,
        tokenVencReset: null,
        activo: false,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      });

      // Paso 3: Llamamos al método registrarse con datos de prueba
      const resultado = await service.registrarse({
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@test.com',
        password: 'Password1',
      });

      // VALIDACIÓN: Esperamos que el error NO ocurra y que retorne el mensaje de éxito
      expect(resultado.mensaje).toBe(
        'Cuenta creada exitosamente. Revisá tu email para verificar tu cuenta.'
      );
      // VALIDACIÓN: Verificamos que create fue llamado exactamente 1 vez
      expect(prismaMock.usuario.create).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error si el email ya existe', async () => {
      // EXPLICACIÓN: Este test simula el registro de un usuario con email DUPLICADO
      // Configuramos el mock para que findUnique retorne un usuario existente
      // Esto significa "este email ya existe en la base de datos"
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'juan@test.com',
      } as any);

      // VALIDACIÓN: Esperamos que lance un error específico
      await expect(
        service.registrarse({
          nombre: 'Juan',
          apellido: 'Perez',
          email: 'juan@test.com',
          password: 'Password1',
        })
      ).rejects.toThrow('Ya existe una cuenta registrada con ese email');
    });
  });

  // ─── LOGIN ────────────────────────────────────────────

  describe('login', () => {
    it('debe retornar tokens si las credenciales son correctas', async () => {
      const passwordHash = await bcrypt.hash('Password1', 12);

      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@test.com',
        passwordHash,
        rol: 'CLIENT',
        activo: true,
        avatarUrl: null,
        emailVerificado: true,
        tokenVerificacion: null,
        tokenVencVerificacion: null,
        tokenResetPass: null,
        tokenVencReset: null,
        telefono: null,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      });

      const resultado = await service.login({
        email: 'juan@test.com',
        password: 'Password1',
      });

      expect(resultado.accessToken).toBeDefined();
      expect(resultado.refreshToken).toBeDefined();
      expect(resultado.usuario.email).toBe('juan@test.com');
    });

    it('debe lanzar error si el email no existe', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'Password1' })
      ).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('debe lanzar error si la contraseña es incorrecta', async () => {
      const passwordHash = await bcrypt.hash('Password1', 12);

      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'juan@test.com',
        passwordHash,
        activo: true,
        rol: 'CLIENT',
      } as any);

      await expect(
        service.login({ email: 'juan@test.com', password: 'WrongPass1' })
      ).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('debe lanzar error si la cuenta está inactiva', async () => {
      // EXPLICACIÓN: Este test valida que un usuario NO puede loguearse si su cuenta está desactivada
      // Paso 1: Creamos un hash bcrypt válido de la contraseña
      const passwordHash = await bcrypt.hash('Password1', 12);

      // Paso 2: Configuramos el mock para simular un usuario en la BD
      // IMPORTANTE: activo: false significa que la cuenta está DESACTIVADA
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'juan@test.com',
        passwordHash, // Hash bcrypt válido para que la validación pase
        activo: false, // LA CUENTA ESTÁ INACTIVA - esto debería causar un error
        rol: 'CLIENT',
      } as any);

      // VALIDACIÓN: Esperamos que lance un error porque la cuenta está inactiva
      // Aunque las credenciales sean correctas, no puede loguearse si activo === false
      await expect(
        service.login({ email: 'juan@test.com', password: 'Password1' })
      ).rejects.toThrow('Esta cuenta ha sido desactivada');
    });
  });

  // ─── RESET PASSWORD ────────────────────────────────────────────

  describe('confirmarResetPassword', () => {
    it('debe actualizar la contraseña con token válido', async () => {
      // EXPLICACIÓN: Este test simula un usuario que solicita cambiar su contraseña con un token válido
      // Paso 1: Configuramos el mock de findFirst para retornar un usuario con token válido
      // buscarPorTokenReset() internamente usa findFirst para buscar el usuario por su token
      prismaMock.usuario.findFirst.mockResolvedValue({
        id: 1,
        tokenResetPass: 'token-valido', // Token que se valida en la BD
        tokenVencReset: new Date(Date.now() + 60 * 60 * 1000), // Token expira en 1 hora (futuro = válido)
      } as any);

      // Paso 2: Configuramos el mock de update para simular la actualización de la contraseña
      prismaMock.usuario.update.mockResolvedValue({} as any);

      // Paso 3: Llamamos al método de confirmar reset password
      const resultado = await service.confirmarResetPassword({
        token: 'token-valido',
        passwordNueva: 'NuevoPass1',
        confirmarPassword: 'NuevoPass1',
      });

      // VALIDACIÓN: Esperamos que retorne un mensaje de éxito
      expect(resultado.mensaje).toBe(
        'Contraseña restablecida exitosamente. Ya podés iniciar sesión.'
      );
      // VALIDACIÓN: Verificamos que update fue llamado exactamente 1 vez
      expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error si el token es inválido', async () => {
      // EXPLICACIÓN: Este test valida que si el token NO existe, lance error
      // Configuramos el mock de findFirst para que retorne NULL
      // Esto significa "no existe usuario con este token de reset"
      prismaMock.usuario.findFirst.mockResolvedValue(null);

      // VALIDACIÓN: Esperamos que lance error porque el token es inválido/inexistente
      await expect(
        service.confirmarResetPassword({
          token: 'token-invalido',
          passwordNueva: 'NuevoPass1',
          confirmarPassword: 'NuevoPass1',
        })
      ).rejects.toThrow('Token de reset inválido o ya utilizado');
    });

    it('debe lanzar error si el token está expirado', async () => {
      // EXPLICACIÓN: Este test valida que si el token EXPIRÓ, lance error específico
      // Paso 1: Configuramos el mock para retornar un usuario con token EXPIRADO
      prismaMock.usuario.findFirst.mockResolvedValue({
        id: 1,
        tokenResetPass: 'token-expirado',
        tokenVencReset: new Date(Date.now() - 1000), // Token expiró hace 1 segundo (pasado = expirado)
      } as any);

      // VALIDACIÓN: Esperamos que lance error específico de token expirado
      // Nota: Esta debe ser una excepción DIFERENTE a la de token inválido
      await expect(
        service.confirmarResetPassword({
          token: 'token-expirado',
          passwordNueva: 'NuevoPass1',
          confirmarPassword: 'NuevoPass1',
        })
      ).rejects.toThrow('El token de reset ha expirado. Solicitá uno nuevo.');
    });
  });

  // ─── SOLICITAR RESET PASSWORD ─────────────────────────────

  describe('solicitarResetPassword', () => {
    it('debe retornar mensaje genérico si el email no existe', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      const resultado = await service.solicitarResetPassword({ email: 'noexiste@test.com' });

      expect(resultado.mensaje).toContain('Si existe una cuenta');
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('debe retornar mensaje genérico si la cuenta está inactiva', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, activo: false } as any);

      const resultado = await service.solicitarResetPassword({ email: 'juan@test.com' });

      expect(resultado.mensaje).toContain('Si existe una cuenta');
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('debe guardar token y enviar email si el usuario existe y está activo', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Juan',
        email: 'juan@test.com',
        activo: true,
      } as any);
      prismaMock.usuario.update.mockResolvedValue({} as any);

      const resultado = await service.solicitarResetPassword({ email: 'juan@test.com' });

      expect(resultado.mensaje).toContain('Si existe una cuenta');
      expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── VERIFICAR EMAIL ──────────────────────────────────────

  describe('verificarEmail', () => {
    it('debe verificar el email con token válido', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        id: 1,
        emailVerificado: false,
        tokenVerificacion: 'token-valido',
        tokenVencVerificacion: new Date(Date.now() + 60 * 60 * 1000),
      } as any);
      prismaMock.usuario.update.mockResolvedValue({} as any);

      const resultado = await service.verificarEmail('token-valido');

      expect(resultado.mensaje).toBe('Email verificado exitosamente');
      expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error si el token no existe', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);

      await expect(service.verificarEmail('token-falso')).rejects.toThrow(
        'Token de verificación inválido'
      );
    });

    it('debe lanzar error si el token expiró', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        id: 1,
        tokenVerificacion: 'token-expirado',
        tokenVencVerificacion: new Date(Date.now() - 1000),
      } as any);

      await expect(service.verificarEmail('token-expirado')).rejects.toThrow(
        'El token de verificación ha expirado'
      );
    });
  });

  // ─── CAMBIAR PASSWORD ─────────────────────────────────────

  describe('cambiarPassword', () => {
    it('debe cambiar la contraseña correctamente', async () => {
      const passwordHash = await bcrypt.hash('Password1', 12);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, passwordHash } as any);
      prismaMock.usuario.update.mockResolvedValue({} as any);

      const resultado = await service.cambiarPassword(1, {
        passwordActual: 'Password1',
        passwordNueva: 'NuevoPass1',
        confirmarPassword: 'NuevoPass1',
      });

      expect(resultado.mensaje).toBe('Contraseña actualizada exitosamente');
      expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error si la contraseña actual es incorrecta', async () => {
      const passwordHash = await bcrypt.hash('Password1', 12);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, passwordHash } as any);

      await expect(
        service.cambiarPassword(1, {
          passwordActual: 'WrongPass1',
          passwordNueva: 'NuevoPass1',
          confirmarPassword: 'NuevoPass1',
        })
      ).rejects.toThrow('La contraseña actual es incorrecta');
    });

    it('debe lanzar error si el usuario no existe', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.cambiarPassword(999, {
          passwordActual: 'Password1',
          passwordNueva: 'NuevoPass1',
          confirmarPassword: 'NuevoPass1',
        })
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  // ─── REFRESCAR TOKEN ──────────────────────────────────────

  describe('refrescarToken', () => {
    it('debe retornar nuevo accessToken con refresh token válido', async () => {
      // Generamos un refresh token real para el test
      const refreshToken = jwt.sign(
        { sub: 1, email: 'juan@test.com', rol: 'CLIENT' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
        { expiresIn: '7d' }
      );

      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'juan@test.com',
        rol: 'CLIENT',
        activo: true,
      } as any);

      const resultado = await service.refrescarToken(refreshToken);

      expect(resultado.accessToken).toBeDefined();
    });

    it('debe lanzar error con refresh token inválido', async () => {
      await expect(service.refrescarToken('token-basura')).rejects.toThrow(
        'Refresh token inválido o expirado'
      );
    });

    it('debe lanzar error si el usuario está inactivo', async () => {
      const refreshToken = jwt.sign(
        { sub: 1, email: 'juan@test.com', rol: 'CLIENT' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
        { expiresIn: '7d' }
      );

      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        activo: false,
      } as any);

      await expect(service.refrescarToken(refreshToken)).rejects.toThrow(
        'Usuario no encontrado o inactivo'
      );
    });
  });
});

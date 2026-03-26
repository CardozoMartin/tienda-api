import { ClienteService } from '../cliente.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock de emails
jest.mock('../../../utils/emails', () => ({
  enviarEmailVerificacion: jest.fn().mockResolvedValue(true),
}));

describe('ClienteService', () => {
  let service: ClienteService;
  const prismaMock = (global as any).PRISMA_MOCK;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.clienteTienda.findUnique.mockResolvedValue(null);
    prismaMock.clienteTienda.findFirst.mockResolvedValue(null);
    prismaMock.clienteTienda.create.mockResolvedValue({});
    prismaMock.clienteTienda.update.mockResolvedValue({});
    service = new ClienteService();
  });

  // ─────────────────────────────────────────────
  // TESTS: REGISTRO
  // ─────────────────────────────────────────────

  describe('registro()', () => {
    it('debe crear un cliente nuevo exitosamente', async () => {
      // CONFIGURE
      const input = {
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        password: 'Password123',
      };

      prismaMock.clienteTienda.findUnique.mockResolvedValue(null); // No existe

      prismaMock.clienteTienda.create.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        emailVerificado: false,
        activo: true,
      });

      // EXECUTE
      const resultado = await service.registro(input);

      // VALIDATE
      expect(resultado.id).toBe(1);
      expect(resultado.email).toBe('juan@example.com');
      expect(resultado.mensaje).toContain('Registro exitoso');
      expect(prismaMock.clienteTienda.create).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si el email ya existe en la tienda', async () => {
      // CONFIGURE
      prismaMock.clienteTienda.findUnique.mockResolvedValue({
        id: 1,
        email: 'juan@example.com',
        tiendaId: 1,
      });

      const input = {
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        password: 'Password123',
      };

      // EXECUTE & VALIDATE
      await expect(service.registro(input)).rejects.toThrow(
        'Este email ya está registrado en esta tienda'
      );
      expect(prismaMock.clienteTienda.create).not.toHaveBeenCalled();
    });

    it('debe aceptar el mismo email en diferentes tiendas', async () => {
      // CONFIGURE
      prismaMock.clienteTienda.findUnique.mockResolvedValue(null); // No existe en tienda 1

      prismaMock.clienteTienda.create.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
      });

      const input = {
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        password: 'Password123',
      };

      // EXECUTE
      const resultado = await service.registro(input);

      // VALIDATE
      expect(resultado.id).toBe(1);
      expect(prismaMock.clienteTienda.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: LOGIN
  // ─────────────────────────────────────────────

  describe('login()', () => {
    it('debe autenticar cliente y retornar JWT', async () => {
      // CONFIGURE
      const passwordHasheada = await bcrypt.hash('Password123', 12);

      prismaMock.clienteTienda.findUnique.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        passwordHash: passwordHasheada,
        emailVerificado: true,
        activo: true,
      });

      const input = {
        tiendaId: 1,
        email: 'juan@example.com',
        password: 'Password123',
      };

      // EXECUTE
      const resultado = await service.login(input);

      // VALIDATE
      expect(resultado.id).toBe(1);
      expect(resultado.email).toBe('juan@example.com');
      expect(resultado.token).toBeDefined();
      expect(resultado.nombre).toBe('Juan');

      // Verificar que el JWT es válido
      const decoded = jwt.verify(resultado.token, process.env.JWT_SECRET || 'secret') as any;
      expect(decoded.id).toBe(1);
      expect(decoded.tipo).toBe('cliente');
    });

    it('debe rechazar si el email no existe', async () => {
      // CONFIGURE
      prismaMock.clienteTienda.findUnique.mockResolvedValue(null);

      // EXECUTE & VALIDATE
      await expect(
        service.login({
          tiendaId: 1,
          email: 'noexiste@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('debe rechazar si la contraseña es incorrecta', async () => {
      // CONFIGURE
      const passwordHasheada = await bcrypt.hash('Password123', 12);

      prismaMock.clienteTienda.findUnique.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        passwordHash: passwordHasheada,
        activo: true,
        emailVerificado: false,
      });

      // EXECUTE & VALIDATE
      await expect(
        service.login({
          tiendaId: 1,
          email: 'juan@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('debe rechazar si la cuenta está desactivada', async () => {
      // CONFIGURE
      const passwordHasheada = await bcrypt.hash('Password123', 12);

      prismaMock.clienteTienda.findUnique.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        passwordHash: passwordHasheada,
        activo: false,
        emailVerificado: true,
      });

      // EXECUTE & VALIDATE
      await expect(
        service.login({
          tiendaId: 1,
          email: 'juan@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Esta cuenta ha sido desactivada');
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: VERIFICAR EMAIL
  // ─────────────────────────────────────────────

  describe('verificarEmail()', () => {
    it('debe verificar email con token válido', async () => {
      // CONFIGURE
      const token = 'valid-token-123';
      const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prismaMock.clienteTienda.findFirst.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        tokenVerif: token,
        tokenVerifVenc: futuro,
      });

      prismaMock.clienteTienda.update.mockResolvedValue({
        id: 1,
        emailVerificado: true,
        tokenVerif: null,
      });

      // EXECUTE
      const resultado = await service.verificarEmail(token);

      // VALIDATE
      expect(resultado.mensaje).toContain('Email verificado');
      expect(prismaMock.clienteTienda.update).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si el token es inválido', async () => {
      // CONFIGURE
      prismaMock.clienteTienda.findFirst.mockResolvedValue(null);

      // EXECUTE & VALIDATE
      await expect(service.verificarEmail('invalid-token')).rejects.toThrow(
        'Token inválido o expirado'
      );
    });

    it('debe rechazar si el token está vencido', async () => {
      // CONFIGURE
      const token = 'expired-token';

      // findFirst NO encuentra porque el token está vencido (gt: new Date())
      prismaMock.clienteTienda.findFirst.mockResolvedValue(null);

      // EXECUTE & VALIDATE
      await expect(service.verificarEmail(token)).rejects.toThrow(
        'Token inválido o expirado'
      );
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: OBTENER PERFIL
  // ─────────────────────────────────────────────

  describe('obtenerPerfil()', () => {
    it('debe retornar perfil del cliente autenticado', async () => {
      // CONFIGURE
      prismaMock.clienteTienda.findUnique.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        emailVerificado: true,
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      });

      // EXECUTE
      const resultado = await service.obtenerPerfil(1);

      // VALIDATE
      expect(resultado.email).toBe('juan@example.com');
      expect(resultado.nombre).toBe('Juan');
      expect(prismaMock.clienteTienda.findUnique).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error si el cliente no existe', async () => {
      // CONFIGURE
      prismaMock.clienteTienda.findUnique.mockResolvedValue(null);

      // EXECUTE & VALIDATE
      await expect(service.obtenerPerfil(999)).rejects.toThrow('Cliente no encontrado');
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: CAMBIAR CONTRASEÑA
  // ─────────────────────────────────────────────

  describe('cambiarPassword()', () => {
    it('debe cambiar la contraseña exitosamente', async () => {
      // CONFIGURE
      const passwordActualHash = await bcrypt.hash('OldPassword1', 12);

      // Primera llamada: obtener cliente
      prismaMock.clienteTienda.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'juan@example.com',
        tiendaId: 1,
      });

      // Segunda llamada: obtener passwordHash para validar
      prismaMock.clienteTienda.findUnique.mockResolvedValueOnce({
        id: 1,
        passwordHash: passwordActualHash,
      });

      // Tercera llamada: update password
      prismaMock.clienteTienda.update.mockResolvedValueOnce({
        id: 1,
        passwordHash: 'new-hash',
      });

      const input = {
        passwordActual: 'OldPassword1',
        passwordNueva: 'NewPassword1',
        passwordConfirmar: 'NewPassword1',
      };

      // EXECUTE
      const resultado = await service.cambiarPassword(1, input);

      // VALIDATE
      expect(resultado.mensaje).toContain('Contraseña cambiada');
      expect(prismaMock.clienteTienda.update).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si la contraseña actual es incorrecta', async () => {
      // CONFIGURE
      const passwordActualHash = await bcrypt.hash('OldPassword1', 12);

      // Primera llamada: obtener cliente
      prismaMock.clienteTienda.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'juan@example.com',
      });

      // Segunda llamada: obtener passwordHash para validar
      prismaMock.clienteTienda.findUnique.mockResolvedValueOnce({
        id: 1,
        passwordHash: passwordActualHash,
      });

      // EXECUTE & VALIDATE
      await expect(
        service.cambiarPassword(1, {
          passwordActual: 'WrongPassword',
          passwordNueva: 'NewPassword1',
          passwordConfirmar: 'NewPassword1',
        })
      ).rejects.toThrow('Contraseña actual incorrecta');
    });
  });
});

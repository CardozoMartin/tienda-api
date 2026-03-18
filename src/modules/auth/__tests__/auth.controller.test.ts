import { crearApp } from '@/app';
import request from 'supertest';
import { Application } from 'express';

// Al inicio del describe en auth.controller.test.ts
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
jest.mock('../auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    registrarse: jest.fn().mockResolvedValue({
      mensaje: 'Cuenta creada exitosamente. Revisá tu email para verificar tu cuenta.',
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token',
      usuario: {
        id: 1,
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@test.com',
        rol: 'usuario',
        avatarUrl: null,
        emailVerificado: true,
      },
    }),
    solicitarResetPassword: jest.fn().mockResolvedValue({
      mensaje:
        'Si existe una cuenta con ese email, recibirás las instrucciones para restablecer tu contraseña.',
    }),
    confirmarResetPassword: jest.fn().mockResolvedValue({
      mensaje: 'Contraseña restablecida exitosamente. Ya podés iniciar sesión.',
    }),
    verificarEmail: jest.fn().mockResolvedValue({
      mensaje: 'Email verificado exitosamente',
    }),
  })),
}));

describe('AuthController', () => {
  let app: Application;

  // ✅ FIX CRÍTICO: crear la app UNA sola vez, no en cada request
  beforeAll(() => {
    app = crearApp();
  });

  // ✅ Cerrar handles abiertos para evitar el warning del worker
  afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
  });

  // ─── REGISTRO ────────────────────────────────────────────

  describe('POST /api/v1/auth/registro', () => {
    it('debe registrar un usuario y retornar 201', async () => {
      // ✅ Ahora usamos `app` en lugar de `crearApp`
      const res = await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@test.com',
        password: 'Password1',
      });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.mensaje).toContain('Cuenta creada exitosamente');
    });

    it('debe retornar 400 si faltan campos requeridos', async () => {
      const res = await request(app).post('/api/v1/auth/registro').send({
        email: 'juan@test.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 400 si el email es inválido', async () => {
      const res = await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'no-es-un-email',
        password: 'Password1',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ─── LOGIN ────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('debe retornar tokens con credenciales válidas', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'juan@test.com',
        password: 'Password1',
      });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.accessToken).toBeDefined();
      expect(res.body.datos.refreshToken).toBeDefined();
      expect(res.body.datos.usuario.email).toBe('juan@test.com');
    });

    it('debe retornar 400 si faltan credenciales', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'juan@test.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ─── SOLICITAR RESET ────────────────────────────────────────────

  describe('POST /api/v1/auth/solicitar-reset', () => {
    it('debe retornar 200 con email válido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/solicitar-reset')
        .send({ email: 'juan@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.mensaje).toContain('Si existe una cuenta');
    });

    it('debe retornar 400 con email inválido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/solicitar-reset')
        .send({ email: 'no-es-email' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ─── CONFIRMAR RESET ────────────────────────────────────────────

  describe('POST /api/v1/auth/confirmar-reset/:token', () => {
    it('debe retornar 200 con token y passwords válidos', async () => {
      const res = await request(app).post('/api/v1/auth/confirmar-reset/token-valido-123').send({
        passwordNueva: 'NuevoPass1',
        confirmarPassword: 'NuevoPass1',
      });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.mensaje).toContain('Contraseña restablecida');
    });

    it('debe retornar 400 si las passwords no coinciden', async () => {
      const res = await request(app).post('/api/v1/auth/confirmar-reset/token-valido-123').send({
        passwordNueva: 'NuevoPass1',
        confirmarPassword: 'OtroPass1',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 400 si la password es muy corta', async () => {
      const res = await request(app).post('/api/v1/auth/confirmar-reset/token-valido-123').send({
        passwordNueva: '123',
        confirmarPassword: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ─── VERIFICAR EMAIL ────────────────────────────────────────────

  describe('GET /api/v1/auth/verificar-email/:token', () => {
    it('debe retornar HTML con token válido', async () => {
      const res = await request(app).get('/api/v1/auth/verificar-email/token-valido-123');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });
  });


});


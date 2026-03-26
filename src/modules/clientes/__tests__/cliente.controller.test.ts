import request from 'supertest';
import { crearApp } from '../../../app';
import { ClienteService } from '../cliente.service';
import jwt from 'jsonwebtoken';

// Mock del service
jest.mock('../cliente.service', () => ({
  ClienteService: jest.fn().mockImplementation(() => ({
    registro: jest.fn(),
    login: jest.fn(),
    verificarEmail: jest.fn(),
    obtenerPerfil: jest.fn(),
    actualizarPerfil: jest.fn(),
    cambiarPassword: jest.fn(),
  })),
}));

describe('ClienteController', () => {
  let app: any;
  let mockService: any;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    app = crearApp();
    mockService = new ClienteService() as any;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────────
  // TESTS: POST /registro
  // ─────────────────────────────────────────────

  describe('POST /api/v1/clientes/registro', () => {
    it('debe retornar 400 si email es inválido', async () => {
      const res = await request(app).post('/api/v1/clientes/registro').send({
        tiendaId: 1,
        email: 'not-an-email',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 400 si password es débil', async () => {
      const res = await request(app).post('/api/v1/clientes/registro').send({
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        password: 'weak',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 400 si nombre muy corto', async () => {
      const res = await request(app).post('/api/v1/clientes/registro').send({
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'J',
        apellido: 'Pérez',
        telefono: '555123456',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: POST /login
  // ─────────────────────────────────────────────

  describe('POST /api/v1/clientes/login', () => {
    it('debe retornar 400 si email inválido', async () => {
      const res = await request(app).post('/api/v1/clientes/login').send({
        tiendaId: 1,
        email: 'not-email',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 400 si password falta', async () => {
      const res = await request(app).post('/api/v1/clientes/login').send({
        tiendaId: 1,
        email: 'juan@example.com',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: GET /verificar-email/:token
  // ─────────────────────────────────────────────

  describe('GET /api/v1/clientes/verificar-email/:token', () => {
    it('debe aceptar GET con token válido', async () => {
      mockService.verificarEmail.mockResolvedValue({
        mensaje: 'Email verificado correctamente',
      });

      const res = await request(app).get(
        '/api/v1/clientes/verificar-email/valid-token-123'
      );

      expect(res.status).toBe(200);
  });
  });

  // ─────────────────────────────────────────────
  // TESTS: GET /perfil (protegido)
  // ─────────────────────────────────────────────

  describe('GET /api/v1/clientes/perfil (protegido)', () => {
    it('debe rechazar sin token (401)', async () => {
      const res = await request(app).get('/api/v1/clientes/perfil');
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('debe rechazar con token inválido (401)', async () => {
      const res = await request(app)
        .get('/api/v1/clientes/perfil')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 200 con token válido', async () => {
      const token = jwt.sign(
        { id: 1, email: 'juan@example.com', tipo: 'cliente' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      mockService.obtenerPerfil.mockResolvedValue({
        id: 1,
        tiendaId: 1,
        email: 'juan@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '555123456',
        emailVerificado: true,
        activo: true,
      });

      const res = await request(app)
        .get('/api/v1/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: PUT /perfil (protegido)
  // ─────────────────────────────────────────────

  describe('PUT /api/v1/clientes/perfil (protegido)', () => {
    it('debe rechazar sin token (401)', async () => {
      const res = await request(app).put('/api/v1/clientes/perfil').send({
        nombre: 'NewName',
      });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 200 con token válido', async () => {
      const token = jwt.sign(
        { id: 1, email: 'juan@example.com', tipo: 'cliente' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      mockService.actualizarPerfil.mockResolvedValue({
        id: 1,
        email: 'juan@example.com',
        nombre: 'Juan Nuevo',
        apellido: 'García',
        telefono: '555789123',
        mensaje: 'Perfil actualizado correctamente',
      });

      const res = await request(app)
        .put('/api/v1/clientes/perfil')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan Nuevo',
          apellido: 'García',
          telefono: '555789123',
        });

      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────
  // TESTS: POST /cambiar-password (protegido)
  // ─────────────────────────────────────────────

  describe('POST /api/v1/clientes/cambiar-password (protegido)', () => {
    it('debe rechazar sin token (401)', async () => {
      const res = await request(app).post('/api/v1/clientes/cambiar-password').send({
        passwordActual: 'OldPassword1',
        passwordNueva: 'NewPassword1',
        passwordConfirmar: 'NewPassword1',
      });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('debe rechazar si passwords no coinciden (400)', async () => {
      const token = jwt.sign(
        { id: 1, email: 'juan@example.com', tipo: 'cliente' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .post('/api/v1/clientes/cambiar-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordActual: 'OldPassword1',
          passwordNueva: 'NewPassword1',
          passwordConfirmar: 'DifferentPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe retornar 200 con token válido', async () => {
      const token = jwt.sign(
        { id: 1, email: 'juan@example.com', tipo: 'cliente' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      mockService.cambiarPassword.mockResolvedValue({
        mensaje: 'Contraseña cambiada correctamente',
      });

      const res = await request(app)
        .post('/api/v1/clientes/cambiar-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordActual: 'OldPassword1',
          passwordNueva: 'NewPassword1',
          passwordConfirmar: 'NewPassword1',
        });

      expect(res.status).toBe(200);
    });
  });
});

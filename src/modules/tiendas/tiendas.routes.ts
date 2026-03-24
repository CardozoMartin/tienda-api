// Rutas del módulo de tiendas.
// Separamos rutas públicas de las protegidas (owner).
import { RolUsuario } from '@prisma/client';
import { Router } from 'express';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { TiendasController } from './tiendas.controller';
import {
  ActualizarTemaSchema,
  ActualizarTiendaSchema,
  AgregarImagenCarruselSchema,
  AgregarMetodoEntregaSchema,
  AgregarMetodoPagoSchema,
  CrearTiendaSchema,
  FiltrosTiendasSchema,
} from './tiendas.dto';
import { uploadMultiple } from '@/config/multer.config';


const router = Router();
const controller = new TiendasController();

// ─────────────────────────────────────────────
// RUTAS PÚBLICAS
// ─────────────────────────────────────────────

// Directorio de tiendas
router.get('/', validar(FiltrosTiendasSchema, 'query'), controller.listar);

// Catálogo de métodos (Público/Owner)
router.get('/metodos-pago', controller.listarMetodosPago);
router.get('/metodos-entrega', controller.listarMetodosEntrega);

// ─────────────────────────────────────────────
// RUTAS PROTEGIDAS - OWNER
// Requieren autenticación + rol OWNER o ADMIN
// IMPORTANTE: Deben ir ANTES de /:slug para no ser capturadas como slug
// ─────────────────────────────────────────────

const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// Panel de la tienda propia
router.get('/mi-tienda', ...soloOwner, controller.obtenerMiTienda);
router.post('/', ...soloOwner, validar(CrearTiendaSchema), controller.crear);
router.put('/mi-tienda', ...soloOwner, validar(ActualizarTiendaSchema), controller.actualizar);
router.put(
  '/mi-tienda/tema',
  ...soloOwner,
  validar(ActualizarTemaSchema),
  controller.actualizarTema
);

// Métodos de pago
router.post(
  '/mi-tienda/metodos-pago',
  ...soloOwner,
  validar(AgregarMetodoPagoSchema),
  controller.agregarMetodoPago
);
router.delete('/mi-tienda/metodos-pago/:metodoPagoId', ...soloOwner, controller.eliminarMetodoPago);

// Métodos de entrega
router.post(
  '/mi-tienda/metodos-entrega',
  ...soloOwner,
  validar(AgregarMetodoEntregaSchema),
  controller.agregarMetodoEntrega
);
router.delete(
  '/mi-tienda/metodos-entrega/:metodoEntregaId',
  ...soloOwner,
  controller.eliminarMetodoEntrega
);

// Carrusel de imágenes
router.post(
  '/mi-tienda/carrusel',
  ...soloOwner,uploadMultiple,
  validar(AgregarImagenCarruselSchema),
  controller.agregarImagenCarrusel
);
router.delete('/mi-tienda/carrusel/:imagenId', ...soloOwner, controller.eliminarImagenCarrusel);
router.put('/mi-tienda/carrusel/reordenar', ...soloOwner, controller.reordenarCarrusel);

// Vista pública de una tienda
// IMPORTANTE: Esta ruta debe ir DESPUÉS de /mi-tienda para no capturarla como slug
router.get('/:slug', controller.obtenerPorSlug);

export default router;

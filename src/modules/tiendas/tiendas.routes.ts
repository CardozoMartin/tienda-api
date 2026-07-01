
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
  ActualizarMetodoEntregaSchema,
  AgregarMetodoPagoSchema,
  ActualizarMetodoPagoSchema,
  CrearTiendaSchema,
  FiltrosTiendasSchema,
  ActualizarAboutUsSchema,
  ActualizarMarqueeSchema,
  CambiarSlugSchema,
  ActualizarImagenCarruselSchema,
  GuardarDominioSchema,
  GuardarConfigEmailSchema,
} from './tiendas.dto';
import { uploadMultiple, uploadSingle } from '../../config/multer.config';


const router = Router();
const controller = new TiendasController();


// RUTAS PÚBLICAS


// Directorio de tiendas
router.get('/', validar(FiltrosTiendasSchema, 'query'), controller.listar);

// Catálogo de métodos (Público/Owner)
router.get('/metodos-pago', controller.listarMetodosPago);
router.get('/metodos-entrega', controller.listarMetodosEntrega);

// Resolver tienda por dominio propio (ej: ?host=www.mitienda.com).
// IMPORTANTE: debe ir ANTES de /:slug para no ser capturada como si "por-dominio" fuera un slug.
router.get('/por-dominio', controller.obtenerPorDominio);


// RUTAS PROTEGIDAS - OWNER
// Requieren autenticación + rol OWNER o ADMIN
// IMPORTANTE: Deben ir ANTES de /:slug para no ser capturadas como slug


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
router.post('/mi-tienda/metodos-pago', ...soloOwner, validar(AgregarMetodoPagoSchema), controller.agregarMetodoPago);
router.put('/mi-tienda/metodos-pago/:metodoPagoId', ...soloOwner, validar(ActualizarMetodoPagoSchema), controller.actualizarMetodoPago);
router.delete('/mi-tienda/metodos-pago/:metodoPagoId', ...soloOwner, controller.eliminarMetodoPago);

// Métodos de entrega
router.post('/mi-tienda/metodos-entrega', ...soloOwner, validar(AgregarMetodoEntregaSchema), controller.agregarMetodoEntrega);
router.put('/mi-tienda/metodos-entrega/:metodoEntregaId', ...soloOwner, validar(ActualizarMetodoEntregaSchema), controller.actualizarMetodoEntrega);
router.delete('/mi-tienda/metodos-entrega/:metodoEntregaId', ...soloOwner, controller.eliminarMetodoEntrega);

// Secciones Hero / Carrusel
router.get('/mi-tienda/carrusel', ...soloOwner, controller.listarCarruselAdmin);
router.post(
  '/mi-tienda/carrusel',
  ...soloOwner, uploadMultiple,
  validar(AgregarImagenCarruselSchema),
  controller.agregarImagenCarrusel
);
router.put(
  '/mi-tienda/carrusel/reordenar',
  ...soloOwner,
  controller.reordenarCarrusel
);
router.put(
  '/mi-tienda/carrusel/:imagenId',
  ...soloOwner,
  validar(ActualizarImagenCarruselSchema),
  controller.actualizarImagenCarrusel
);
router.delete('/mi-tienda/carrusel/:imagenId', ...soloOwner, controller.eliminarImagenCarrusel);

// Logo
router.post('/mi-tienda/logo', ...soloOwner, uploadSingle, controller.subirLogo);
router.delete('/mi-tienda/logo', ...soloOwner, controller.eliminarLogo);

// Config de email marketing (proveedor propio del dueño)
router.get('/mi-tienda/email-config', ...soloOwner, controller.obtenerConfigEmail);
router.put('/mi-tienda/email-config', ...soloOwner, validar(GuardarConfigEmailSchema), controller.guardarConfigEmail);
router.post('/mi-tienda/email-config/verificar', ...soloOwner, controller.verificarConfigEmail);

// Dominio propio
router.get('/mi-tienda/dominio', ...soloOwner, controller.obtenerEstadoDominio);
router.patch('/mi-tienda/dominio', ...soloOwner, validar(GuardarDominioSchema), controller.guardarDominio);
router.post('/mi-tienda/dominio/verificar', ...soloOwner, controller.verificarDominio);

// Slug
router.patch('/mi-tienda/slug', ...soloOwner, validar(CambiarSlugSchema), controller.cambiarSlug);
router.get('/mi-tienda/slug/verificar', ...soloOwner, controller.verificarSlug);

// About Us
router.get('/mi-tienda/about-us', ...soloOwner, controller.obtenerAboutUs);
router.put(
  '/mi-tienda/about-us',
  ...soloOwner,
  validar(ActualizarAboutUsSchema),
  controller.actualizarAboutUs
);
router.post('/mi-tienda/about-us/imagen', ...soloOwner, uploadSingle, controller.subirImagenAboutUs);
router.post('/mi-tienda/banner-promo/imagen', ...soloOwner, uploadSingle, controller.subirImagenBannerPromo);

// Marquee
router.get('/mi-tienda/marquee', ...soloOwner, controller.obtenerMarquee);
router.put(
  '/mi-tienda/marquee',
  ...soloOwner,
  validar(ActualizarMarqueeSchema),
  controller.actualizarMarquee
);

// Vista pública de una tienda
// IMPORTANTE: Esta ruta debe ir DESPUÉS de /mi-tienda para no capturarla como slug
router.get('/:slug', controller.obtenerPorSlug);

export default router;

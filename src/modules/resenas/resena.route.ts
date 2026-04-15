import { RolUsuario } from '@prisma/client';
import { Router } from 'express';
import upload from '../../config/multer.config';
import { autenticar, autorizar } from '../../middleware/auth.middleware';
import { autenticarCliente } from '../../middleware/clientes.auth.middleware';
import { validar } from '../../middleware/validar.middleware';
import { ResenasController } from './resenas.controller';
import { CrearResenaSchema, FiltrosResenasSchema, ResponderResenaSchema } from './resentas.dto';

const controller = new ResenasController();
const soloOwner = [autenticar, autorizar(RolUsuario.OWNER, RolUsuario.ADMIN)];

// Router montado en /tiendas/:tiendaId/resenas
export const resenasTiendaRouter = Router({ mergeParams: true });

resenasTiendaRouter.get('/', validar(FiltrosResenasSchema, 'query'), controller.listarTienda);
resenasTiendaRouter.get('/estadisticas', controller.estadisticasTienda);

// Solo clientes logueados pueden crear reseñas de tienda (solo texto)
resenasTiendaRouter.post(
  '/',
  autenticarCliente,
  validar(CrearResenaSchema),
  controller.crearTienda
);

// Panel owner
resenasTiendaRouter.get('/pendientes', ...soloOwner, controller.pendientesTienda);
resenasTiendaRouter.get('/productos/pendientes', ...soloOwner, controller.pendientesProductos);
resenasTiendaRouter.patch('/:resenaId/aprobar', ...soloOwner, controller.aprobarTienda);
resenasTiendaRouter.patch('/:resenaId/rechazar', ...soloOwner, controller.rechazarTienda);
resenasTiendaRouter.post(
  '/:resenaId/responder',
  ...soloOwner,
  validar(ResponderResenaSchema),
  controller.responderTienda
);
resenasTiendaRouter.delete('/:resenaId', ...soloOwner, controller.eliminarTienda);

// Router montado en /mis-productos/:productoId/resenas
export const resenasProductoRouter = Router({ mergeParams: true });

resenasProductoRouter.get('/', validar(FiltrosResenasSchema, 'query'), controller.listarProducto);
resenasProductoRouter.get('/estadisticas', controller.estadisticasProducto);

// Solo clientes logueados, acepta imagen (multipart/form-data)
resenasProductoRouter.post(
  '/',
  autenticarCliente,
  upload.single('imagen'),
  controller.crearProducto
);

// Panel owner
resenasProductoRouter.patch('/:resenaId/aprobar', ...soloOwner, controller.aprobarProducto);
resenasProductoRouter.patch('/:resenaId/rechazar', ...soloOwner, controller.rechazarProducto);
resenasProductoRouter.post(
  '/:resenaId/responder',
  ...soloOwner,
  validar(ResponderResenaSchema),
  controller.responderProducto
);
resenasProductoRouter.delete('/:resenaId', ...soloOwner, controller.eliminarProducto);

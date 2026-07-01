import { PedidosRepository } from './pedidos.repository';
import { CarritoRepository } from '../carrito/carrito.repository';
import { CuponesService } from '../cupones/cupones.service';
import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';
import { CrearPedidoDto, ActualizarEstadoPedidoDto, FiltrosPedidosDto } from './pedidos.dto';
import { 
  enviarEmailNuevoPedidoAlCliente, 
  enviarEmailNuevoPedidoAlOwner, 
  enviarEmailEstadoPedidoActualizado 
} from '../../utils/emails';


export class PedidosService {
  private repository: PedidosRepository;
  private carritoRepository: CarritoRepository;
  private cuponesService: CuponesService;

  constructor() {
    this.repository = new PedidosRepository();
    this.carritoRepository = new CarritoRepository();
    this.cuponesService = new CuponesService();
  }

  async crear(tiendaId: number, sessionId: string, datos: CrearPedidoDto, clienteId?: number) {
    // 1. Obtener carrito
    const carrito: any = await this.carritoRepository.obtenerCarrito(tiendaId, sessionId);
    if (!carrito || !carrito.items || carrito.items.length === 0) {
      throw new ErrorApi('El carrito está vacío', 400);
    }

    // 2. Calcular totales y preparar snapshots
    let subtotal = 0;
    const items = carrito.items.map((item: any) => {
      const itemSubtotal = Number(item.precioUnit) * item.cantidad;
      subtotal += itemSubtotal;
      
      return {
        productoId: item.productoId,
        varianteId: item.varianteId,
        nombreProd: item.producto.nombre,
        nombreVar: item.variante ? item.variante.nombre : null,
        imagenUrl: item.producto.imagenPrincipalUrl || (item.producto.imagenes && item.producto.imagenes[0]?.url) || null,
        cantidad: item.cantidad,
        precioUnit: item.precioUnit,
        subtotal: itemSubtotal,
      };
    });

    // 2b. Aplicar cupón si vino un código
    let descuento = 0;
    let cuponId: number | null = null;
    let cuponCodigo: string | null = null;
    if (datos.cuponCodigo && datos.cuponCodigo.trim()) {
      // Valida (existe, activo, vigente, no superó usos, cumple mínimo) y calcula el descuento
      const valido = await this.cuponesService.validar(tiendaId, datos.cuponCodigo, subtotal);
      descuento = valido.descuento;
      cuponId = valido.id;
      cuponCodigo = valido.codigo;
    }

    const costoEnvio = Number(datos.costoEnvio || 0);
    const total = Math.max(0, subtotal - descuento + costoEnvio);

    // 3. Crear pedido
    const { cuponCodigo: _drop, ...datosSinCupon } = datos;
    const pedido = await this.repository.crear({
      tiendaId,
      clienteId,
      ...datosSinCupon,
      subtotal,
      costoEnvio,
      descuento,
      cuponId,
      cuponCodigo,
      total,
      items,
    });

    // 3b. Incrementar el uso del cupón
    if (cuponId) {
      await prisma.cupon.update({
        where: { id: cuponId },
        data: { usoActual: { increment: 1 } },
      });
    }

    // 4. Vaciar carrito tras éxito (eliminamos el carrito completo)
    await this.carritoRepository.eliminarCarrito(carrito.id);

    // 5. Enviar emails de notificación (no bloqueamos el retorno)
    this.enviarNotificacionesNuevoPedido(pedido.id).catch(err => 
      console.error('Error enviando notificaciones de nuevo pedido:', err)
    );

    return pedido;
  }

  private async enviarNotificacionesNuevoPedido(pedidoId: number) {
    const pedidoCompleto = await this.repository.buscarPorId(pedidoId);
    if (!pedidoCompleto) return;

    const tienda = pedidoCompleto.tienda;
    const owner = tienda?.usuario;

    // Email al cliente
    await enviarEmailNuevoPedidoAlCliente(
      pedidoCompleto.compradorEmail,
      pedidoCompleto.compradorNombre,
      pedidoCompleto,
      tienda.nombre
    );

    // Email al owner
    if (owner?.email) {
      await enviarEmailNuevoPedidoAlOwner(
        owner.email,
        owner.nombre,
        pedidoCompleto,
        tienda.nombre
      );
    }
  }

  async obtenerPorId(id: number) {
    const pedido = await this.repository.buscarPorId(id);
    if (!pedido) {
      throw new ErrorApi('Pedido no encontrado', 404);
    }
    return pedido;
  }

  async listar(filtros: FiltrosPedidosDto) {
    return this.repository.listar(filtros);
  }

  async actualizarEstado(id: number, datos: ActualizarEstadoPedidoDto, usuarioId?: number) {
    const pedidoActualizado = await this.repository.actualizarEstado(
      id,
      datos.estado,
      datos.notasOwner,
      usuarioId,
      datos.nroSeguimiento,
      datos.urlSeguimiento,
    );
    
    // Enviar email de actualización al cliente (no bloqueamos)
    this.enviarNotificacionCambioEstado(id, datos.estado).catch(err => 
      console.error('Error enviando notificación de cambio de estado:', err)
    );

    return pedidoActualizado;
  }

  async actualizarEstadoPago(id: number, estadoPago: string) {
    const VALIDOS = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_PROCESO', 'DEVUELTO', 'CANCELADO'];
    if (!VALIDOS.includes(estadoPago)) {
      throw new ErrorApi('Estado de pago inválido', 400);
    }
    return this.repository.actualizarEstadoPago(id, estadoPago);
  }

  private async enviarNotificacionCambioEstado(pedidoId: number, nuevoEstado: any) {
    const pedido = await this.repository.buscarPorId(pedidoId);
    if (!pedido) return;

    await enviarEmailEstadoPedidoActualizado(
      pedido.compradorEmail,
      pedido.compradorNombre,
      pedido,
      nuevoEstado,
      pedido.tienda.nombre
    );
  }
}


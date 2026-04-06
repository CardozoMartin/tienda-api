import { PedidosRepository } from './pedidos.repository';
import { CarritoRepository } from '../carrito/carrito.repository';
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

  constructor() {
    this.repository = new PedidosRepository();
    this.carritoRepository = new CarritoRepository();
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

    // 3. Crear pedido
    const pedido = await this.repository.crear({
      tiendaId,
      clienteId,
      ...datos,
      subtotal,
      costoEnvio: datos.costoEnvio || 0,
      total: subtotal + Number(datos.costoEnvio || 0),
      items,
    });

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


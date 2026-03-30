import { PedidosRepository } from './pedidos.repository';
import { CarritoRepository } from '../carrito/carrito.repository';
import { ErrorApi } from '../../types';
import { CrearPedidoDto, ActualizarEstadoPedidoDto, FiltrosPedidosDto } from './pedidos.dto';

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
      total: subtotal, // Por ahora igual al subtotal, después se pueden sumar costos de envío
      items,
    });

    // 4. Vaciar carrito tras éxito (eliminamos el carrito completo)
    await this.carritoRepository.eliminarCarrito(carrito.id);

    return pedido;
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

  async actualizarEstado(id: number, datos: ActualizarEstadoPedidoDto) {
    return this.repository.actualizarEstado(id, datos.estado, datos.notasOwner);
  }
}

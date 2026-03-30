import { Decimal } from "@prisma/client/runtime/library";
import { ErrorApi } from "../../types";
import { CarritoRepository } from "./carrito.repository";
import { ProductosRepository } from "../productos/productos.repository";

// ── TIPOS ─────────────────────────────────────────────────────

interface AgregarItemDto {
  tiendaId: number;
  sessionId: string;       // UUID del browser (localStorage)
  clienteId: number | null; // null = invitado
  productoId: number;
  varianteId?: number | null;
  cantidad: number;
}

interface ActualizarCantidadDto {
  tiendaId: number;
  sessionId: string;
  itemId: number;
  cantidad: number;
}

interface EliminarItemDto {
  tiendaId: number;
  sessionId: string;
  itemId: number;
}

// ── SERVICE ───────────────────────────────────────────────────

export class CarritoService {
  constructor(
    // Inyección de dependencias — más fácil de testear y mantener
    private readonly repository: CarritoRepository,
    private readonly productosRepository: ProductosRepository,
  ) {}

  // ── OBTENER CARRITO ─────────────────────────────────────────
  async obtenerCarrito(tiendaId: number, sessionId: string) {
    const carrito = await this.repository.obtenerCarrito(tiendaId, sessionId);

    // Si no existe devolvemos un carrito vacío en lugar de null
    // para simplificar el manejo en el frontend
    if (!carrito) {
      return { items: [], total: new Decimal(0), cantidad: 0 };
    }

    return this.formatearCarrito(carrito);
  }

  // ── AGREGAR ITEM ────────────────────────────────────────────
  async agregarItem(dto: AgregarItemDto) {
    const { tiendaId, sessionId, clienteId, productoId, varianteId = null, cantidad } = dto;

    // 1. Validar cantidad
    if (cantidad < 1) throw new ErrorApi("La cantidad mínima es 1", 400);

    // 2. Verificar que el producto existe, pertenece a la tienda y está disponible
    const producto = await this.productosRepository.buscarPorId(productoId);
    if (!producto) throw new ErrorApi("Producto no encontrado", 404);
    if (producto.tiendaId !== tiendaId) throw new ErrorApi("Producto no pertenece a esta tienda", 403);
    if (!producto.disponible) throw new ErrorApi("Producto no disponible", 400);

    // 3. Validar variante si fue seleccionada
    if (varianteId) {
      const variante = producto.variantes.find((v: any) => v.id === varianteId);
      if (!variante) throw new ErrorApi("Variante no encontrada", 404);
      if (!variante.disponible) throw new ErrorApi("Variante no disponible", 400);
    }

    // 4. Snapshot del precio — se guarda el precio actual para que
    //    no cambie si el owner modifica el precio antes de confirmar
    const precioBase = producto.precioOferta ?? producto.precio;
    const precioExtra = varianteId
      ? (producto.variantes.find((v: any) => v.id === varianteId)?.precioExtra ?? new Decimal(0))
      : new Decimal(0);
    const precioUnit = new Decimal(precioBase).add(precioExtra);

    // 5. Buscar carrito existente para esta sesión en esta tienda
    const carritoExistente = await this.repository.obtenerCarrito(tiendaId, sessionId);

    if (!carritoExistente) {
      // No hay carrito — creamos uno nuevo con el primer item
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 días
      const carrito = await this.repository.crearCarrito(
        tiendaId,
        sessionId,
        clienteId,
        productoId,
        varianteId,
        cantidad,
        precioUnit,
        expiresAt,
      );
      return this.formatearCarrito(carrito);
    }

    // Ya existe el carrito — agregamos o sumamos el item
    await this.repository.upsertItem(
      carritoExistente.id,
      productoId,
      varianteId,
      cantidad,
      precioUnit,
    );

    // Devolvemos el carrito actualizado
    const carritoActualizado = await this.repository.obtenerCarrito(tiendaId, sessionId);
    return this.formatearCarrito(carritoActualizado!);
  }

  // ── ACTUALIZAR CANTIDAD ─────────────────────────────────────
  async actualizarCantidad(dto: ActualizarCantidadDto) {
    const { tiendaId, sessionId, itemId, cantidad } = dto;

    if (cantidad < 1) throw new ErrorApi("La cantidad mínima es 1", 400);

    // Verificar que el carrito existe y le pertenece a esta sesión
    const carrito = await this.repository.obtenerCarrito(tiendaId, sessionId);
    if (!carrito) throw new ErrorApi("Carrito no encontrado", 404);

    // Verificar que el item pertenece a este carrito
    const itemValido = carrito.items.some((i: any) => i.id === itemId);
    if (!itemValido) throw new ErrorApi("Item no encontrado en el carrito", 404);

    await this.repository.actualizarCantidad(itemId, cantidad);

    const carritoActualizado = await this.repository.obtenerCarrito(tiendaId, sessionId);
    return this.formatearCarrito(carritoActualizado!);
  }

  // ── ELIMINAR ITEM ───────────────────────────────────────────
  async eliminarItem(dto: EliminarItemDto) {
    const { tiendaId, sessionId, itemId } = dto;

    const carrito = await this.repository.obtenerCarrito(tiendaId, sessionId);
    if (!carrito) throw new ErrorApi("Carrito no encontrado", 404);

    const itemValido = carrito.items.some((i: any) => i.id === itemId);
    if (!itemValido) throw new ErrorApi("Item no encontrado en el carrito", 404);

    await this.repository.eliminarItem(itemId);

    const carritoActualizado = await this.repository.obtenerCarrito(tiendaId, sessionId);
    return this.formatearCarrito(carritoActualizado!);
  }

  // ── VACIAR CARRITO ──────────────────────────────────────────
  async vaciarCarrito(tiendaId: number, sessionId: string) {
    const carrito = await this.repository.obtenerCarrito(tiendaId, sessionId);
    if (!carrito) throw new ErrorApi("Carrito no encontrado", 404);

    await this.repository.vaciarCarrito(carrito.id);
    return { items: [], total: new Decimal(0), cantidad: 0 };
  }

  // ── ASOCIAR CLIENTE AL LOGUEAR ──────────────────────────────
  // Se llama cuando un invitado inicia sesión para que no pierda
  // los productos que había agregado antes de loguearse
  async asociarClienteAlLoguear(
    tiendaId: number,
    sessionId: string,
    clienteId: number,
  ) {
    const carrito = await this.repository.obtenerCarrito(tiendaId, sessionId);

    // Si no hay carrito de invitado simplemente no hacemos nada
    if (!carrito) return null;

    return await this.repository.asociarCliente(carrito.id, clienteId);
  }

  // ── HELPER PRIVADO ──────────────────────────────────────────
  // Formatea el carrito calculando totales para devolver al frontend
  private formatearCarrito(carrito: NonNullable<Awaited<ReturnType<CarritoRepository["obtenerCarrito"]>>>) {
    const total = carrito.items.reduce((acc: any, item: any) => {
      return acc.add(new Decimal(item.precioUnit).mul(item.cantidad));
    }, new Decimal(0));

    const cantidad = carrito.items.reduce((acc: number, item: any) => acc + item.cantidad, 0);

    return {
      id: carrito.id,
      sessionId: carrito.sessionId,
      clienteId: carrito.clienteId,
      items: carrito.items.map((item: any) => ({
        id: item.id,
        cantidad: item.cantidad,
        precioUnit: item.precioUnit,
        subtotal: new Decimal(item.precioUnit).mul(item.cantidad),
        producto: item.producto,
        variante: item.variante ?? null,
      })),
      total,
      cantidad,
    };
  }
}
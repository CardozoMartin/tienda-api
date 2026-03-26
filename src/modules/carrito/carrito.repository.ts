import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../config/prisma";

// ── INCLUDE REUTILIZABLE ──────────────────────────────────────
// Se usa en todas las queries que devuelven items del carrito
// para no repetir el mismo bloque de includes en cada método

const INCLUDE_ITEMS = {
  items: {
    include: {
      producto: {
        include: {
          categoria: true,
          imagenes: { orderBy: { orden: "asc" as const } },
          variantes: true,
          tags: true,
          _count: { select: { resenas: true } },
        },
      },
      // Incluimos la variante del item si tiene una seleccionada
      variante: true,
    },
  },
} as const;

export class CarritoRepository {
  // ── OBTENER CARRITO ─────────────────────────────────────────
  // Busca el carrito activo por tiendaId + sessionId
  // El sessionId es un UUID generado en el frontend y guardado en localStorage
  // Aplica tanto para invitados como para clientes logueados
  async obtenerCarrito(tiendaId: number, sessionId: string) {
    return await prisma.carrito.findUnique({
      where: {
        // Usamos el @@unique([tiendaId, sessionId]) definido en el schema
        tiendaId_sessionId: { tiendaId, sessionId },
      },
      include: INCLUDE_ITEMS,
    });
  }

  // ── CREAR CARRITO ───────────────────────────────────────────
  // Crea un carrito nuevo con su primer item incluido.
  // precioUnit viene del service (snapshot del precio actual del producto)
  async crearCarrito(
    tiendaId: number,
    sessionId: string,
    clienteId: number | null,
    productoId: number,
    varianteId: number | null,
    cantidad: number,
    precioUnit: Decimal,
    expiresAt: Date,
  ) {
    return await prisma.carrito.create({
      data: {
        tiendaId,
        sessionId,
        expiresAt,
        // clienteId es null si el comprador es invitado
        ...(clienteId ? { clienteId } : {}),
        items: {
          create: {
            productoId,
            cantidad,
            precioUnit,
            // varianteId es null si el producto no tiene variante seleccionada
            ...(varianteId ? { varianteId } : {}),
          },
        },
      },
      include: INCLUDE_ITEMS,
    });
  }

  // ── UPSERT ITEM ─────────────────────────────────────────────
  // Agrega un producto al carrito existente.
  // Si el producto+variante ya está en el carrito, suma la cantidad.
  // Si no existe, crea el item nuevo.
  // Nota: el @@unique([carritoId, productoId, varianteId]) no funciona
  // bien con varianteId nullable en MySQL, por eso lo manejamos acá manualmente.
  async upsertItem(
    carritoId: number,
    productoId: number,
    varianteId: number | null,
    cantidad: number,
    precioUnit: Decimal,
  ) {
    const itemExistente = await prisma.carritoItem.findFirst({
      where: {
        carritoId,
        productoId,
        // Si varianteId es null buscamos items sin variante,
        // si tiene valor buscamos esa variante específica
        varianteId: varianteId ?? null,
      },
    });

    if (itemExistente) {
      // El producto ya está en el carrito — sumamos la cantidad nueva
      return await prisma.carritoItem.update({
        where: { id: itemExistente.id },
        data: { cantidad: itemExistente.cantidad + cantidad },
        include: {
          producto: {
            include: {
              categoria: true,
              imagenes: { orderBy: { orden: "asc" as const } },
              variantes: true,
              tags: true,
              _count: { select: { resenas: true } },
            },
          },
          variante: true,
        },
      });
    }

    // El producto no estaba — lo agregamos como item nuevo
    return await prisma.carritoItem.create({
      data: {
        carritoId,
        productoId,
        cantidad,
        precioUnit,
        ...(varianteId ? { varianteId } : {}),
      },
      include: {
        producto: {
          include: {
            categoria: true,
            imagenes: { orderBy: { orden: "asc" as const } },
            variantes: true,
            tags: true,
            _count: { select: { resenas: true } },
          },
        },
        variante: true,
      },
    });
  }

  // ── ACTUALIZAR CANTIDAD ─────────────────────────────────────
  // Cambia la cantidad de un item específico por su id.
  // El controller/service valida que el item pertenezca al carrito correcto.
  async actualizarCantidad(itemId: number, cantidad: number) {
    return await prisma.carritoItem.update({
      where: { id: itemId },
      data: { cantidad },
    });
  }

  // ── ELIMINAR ITEM ───────────────────────────────────────────
  // Elimina un item del carrito por su id.
  async eliminarItem(itemId: number) {
    return await prisma.carritoItem.delete({
      where: { id: itemId },
    });
  }

  // ── VACIAR CARRITO ──────────────────────────────────────────
  // Elimina todos los items del carrito (no el carrito en sí).
  async vaciarCarrito(carritoId: number) {
    return await prisma.carritoItem.deleteMany({
      where: { carritoId },
    });
  }

  // ── ELIMINAR CARRITO ────────────────────────────────────────
  // Elimina el carrito completo (cascade elimina los items).
  // Se llama después de crear el pedido para limpiar el carrito.
  async eliminarCarrito(carritoId: number) {
    return await prisma.carrito.delete({
      where: { id: carritoId },
    });
  }

  // ── ASOCIAR CLIENTE ─────────────────────────────────────────
  // Cuando un invitado se loguea, asociamos su carrito existente
  // (identificado por sessionId) al clienteId para que no pierda
  // los productos que ya había agregado antes de loguearse.
  async asociarCliente(carritoId: number, clienteId: number) {
    return await prisma.carrito.update({
      where: { id: carritoId },
      data: { clienteId },
    });
  }
}
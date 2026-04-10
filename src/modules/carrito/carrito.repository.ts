import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../config/prisma";

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
      variante: true,
    },
  },
} as const;

export class CarritoRepository {

  //Query para obtener el carrito de compras de un usuario por tiendaId y sessionId.
  async obtenerCarrito(tiendaId: number, sessionId: string) {
    return await prisma.carrito.findUnique({
      where: {
        // Usamos el @@unique([tiendaId, sessionId]) definido en el schema
        tiendaId_sessionId: { tiendaId, sessionId },
      },
      include: INCLUDE_ITEMS,
    });
  }

 //Query para crear un carrito nuevo con un item inicial, como invitado o cliente
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
        ...(clienteId ? { clienteId } : {}),
        items: {
          create: {
            productoId,
            cantidad,
            precioUnit,
            ...(varianteId ? { varianteId } : {}),
          },
        },
      },
      include: INCLUDE_ITEMS,
    });
  }

  //Query para agregar o actualizar un item en el carrito, dependiendo si ya existe o no
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

  //Query para actualizar la cantidad de un item en el carrito, por su id de item
  async actualizarCantidad(itemId: number, cantidad: number) {
    return await prisma.carritoItem.update({
      where: { id: itemId },
      data: { cantidad },
    });
  }


  // Elimina un item del carrito por su id.
  async eliminarItem(itemId: number) {
    return await prisma.carritoItem.delete({
      where: { id: itemId },
    });
  }


  // Elimina todos los items del carrito (no el carrito en sí).
  async vaciarCarrito(carritoId: number) {
    return await prisma.carritoItem.deleteMany({
      where: { carritoId },
    });
  }

  //Query para eliminar un carrito completo por su id . Tambien para hacer limpieza de carrtitos expritados
  async eliminarCarrito(carritoId: number) {
    return await prisma.carrito.delete({
      where: { id: carritoId },
    });
  }

  //Query para asociar un carrito creado como invitado a un cliente registrado, actualizando su clienteId
  async asociarCliente(carritoId: number, clienteId: number) {
    return await prisma.carrito.update({
      where: { id: carritoId },
      data: { clienteId },
    });
  }
}

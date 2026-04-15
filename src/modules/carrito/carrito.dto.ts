export interface AgregarAlCarritoInput {
  clienteId: number;
  productoId: number;
  cantidad: number;
}

export interface EliminarDelCarritoInput {
  clienteId: number;
  productoId: number;
}

export interface ObtenerCarritoInput {
  clienteId: number;
}

export interface CarritoItem {
  productoId: number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Carrito {
  items: CarritoItem[];
  total: number;
}
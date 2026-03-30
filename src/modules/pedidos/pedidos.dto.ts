import { EstadoPedido } from '@prisma/client';

export interface CrearPedidoDto {
  compradorNombre: string;
  compradorEmail: string;
  compradorTel: string;
  metodoEntregaId: number;
  direccionCalle: string;
  direccionNumero?: string;
  direccionPiso?: string;
  direccionCiudad: string;
  direccionProv: string;
  direccionCP?: string;
  direccionNotas?: string;
  metodoPagoId: number;
  notasCliente?: string;
}

export interface ActualizarEstadoPedidoDto {
  estado: EstadoPedido;
  notasOwner?: string;
}

export interface FiltrosPedidosDto {
  tiendaId?: number;
  clienteId?: number;
  estado?: EstadoPedido;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}

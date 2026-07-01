import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';

interface DatosCupon {
  codigo: string;
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
  minCompra?: number | null;
  validoDesde?: string | null;
  validoHasta?: string | null;
  usoMaximo?: number | null;
  activo?: boolean;
}

export class CuponesService {
  private async tiendaDeUsuario(usuarioId: number) {
    const tienda = await prisma.tienda.findFirst({ where: { usuarioId }, select: { id: true } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda', 404);
    return tienda;
  }

  // ── Owner: CRUD ──
  async listar(usuarioId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    return prisma.cupon.findMany({ where: { tiendaId }, orderBy: { creadoEn: 'desc' } });
  }

  async crear(usuarioId: number, datos: DatosCupon) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const codigo = datos.codigo.trim().toUpperCase();

    const existe = await prisma.cupon.findUnique({
      where: { tiendaId_codigo: { tiendaId, codigo } },
    });
    if (existe) throw new ErrorApi(`Ya existe un cupón con el código "${codigo}"`, 409);

    this.validarValor(datos);

    return prisma.cupon.create({
      data: {
        tiendaId,
        codigo,
        tipoDescuento: datos.tipoDescuento,
        valor: datos.valor,
        minCompra: datos.minCompra ?? null,
        validoDesde: datos.validoDesde ? new Date(datos.validoDesde) : null,
        validoHasta: datos.validoHasta ? new Date(datos.validoHasta) : null,
        usoMaximo: datos.usoMaximo ?? null,
        activo: datos.activo ?? true,
      },
    });
  }

  async actualizar(usuarioId: number, cuponId: number, datos: Partial<DatosCupon>) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const cupon = await prisma.cupon.findFirst({ where: { id: cuponId, tiendaId } });
    if (!cupon) throw new ErrorApi('Cupón no encontrado', 404);

    if (datos.codigo) {
      const codigo = datos.codigo.trim().toUpperCase();
      const otro = await prisma.cupon.findUnique({ where: { tiendaId_codigo: { tiendaId, codigo } } });
      if (otro && otro.id !== cuponId) throw new ErrorApi(`Ya existe un cupón con el código "${codigo}"`, 409);
      datos.codigo = codigo;
    }
    if (datos.valor !== undefined || datos.tipoDescuento) {
      this.validarValor({ ...cupon, ...datos } as DatosCupon);
    }

    return prisma.cupon.update({
      where: { id: cuponId },
      data: {
        ...(datos.codigo && { codigo: datos.codigo }),
        ...(datos.tipoDescuento && { tipoDescuento: datos.tipoDescuento }),
        ...(datos.valor !== undefined && { valor: datos.valor }),
        ...(datos.minCompra !== undefined && { minCompra: datos.minCompra }),
        ...(datos.validoDesde !== undefined && { validoDesde: datos.validoDesde ? new Date(datos.validoDesde) : null }),
        ...(datos.validoHasta !== undefined && { validoHasta: datos.validoHasta ? new Date(datos.validoHasta) : null }),
        ...(datos.usoMaximo !== undefined && { usoMaximo: datos.usoMaximo }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
    });
  }

  async eliminar(usuarioId: number, cuponId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const cupon = await prisma.cupon.findFirst({ where: { id: cuponId, tiendaId } });
    if (!cupon) throw new ErrorApi('Cupón no encontrado', 404);
    await prisma.cupon.delete({ where: { id: cuponId } });
  }

  // ── Público: validar un código contra un subtotal ──
  async validar(tiendaId: number, codigo: string, subtotal: number) {
    const cup = await prisma.cupon.findUnique({
      where: { tiendaId_codigo: { tiendaId, codigo: codigo.trim().toUpperCase() } },
    });
    if (!cup) throw new ErrorApi('El cupón no existe', 404);
    if (!cup.activo) throw new ErrorApi('El cupón no está activo', 400);

    const ahora = new Date();
    if (cup.validoDesde && ahora < cup.validoDesde) throw new ErrorApi('El cupón todavía no está vigente', 400);
    if (cup.validoHasta && ahora > cup.validoHasta) throw new ErrorApi('El cupón ya venció', 400);
    if (cup.usoMaximo != null && cup.usoActual >= cup.usoMaximo) throw new ErrorApi('El cupón alcanzó su límite de usos', 400);
    if (cup.minCompra != null && subtotal < Number(cup.minCompra)) {
      throw new ErrorApi(`El cupón requiere una compra mínima de $${Number(cup.minCompra).toLocaleString('es-AR')}`, 400);
    }

    const descuento = this.calcularDescuento(cup, subtotal);
    return {
      id: cup.id,
      codigo: cup.codigo,
      tipoDescuento: cup.tipoDescuento,
      valor: Number(cup.valor),
      descuento,
    };
  }

  // Calcula el descuento (sin pasar del subtotal)
  calcularDescuento(cupon: { tipoDescuento: string; valor: any }, subtotal: number): number {
    let desc = cupon.tipoDescuento === 'PORCENTAJE'
      ? (subtotal * Number(cupon.valor)) / 100
      : Number(cupon.valor);
    desc = Math.min(desc, subtotal); // nunca más que el subtotal
    return Math.round(desc * 100) / 100;
  }

  private validarValor(datos: DatosCupon) {
    if (datos.valor <= 0) throw new ErrorApi('El valor del descuento debe ser mayor a 0', 400);
    if (datos.tipoDescuento === 'PORCENTAJE' && datos.valor > 100) {
      throw new ErrorApi('El porcentaje no puede ser mayor a 100', 400);
    }
  }
}

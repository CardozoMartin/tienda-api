import { prisma } from '../../config/prisma';
import { ErrorApi } from '../../types';

type TipoDesc = 'PORCENTAJE' | 'MONTO_FIJO';

// Un producto dentro de la promo puede traer su propio descuento (opcional).
interface ProductoEnPromo {
  productoId: number;
  tipoDescuento?: TipoDesc | null;
  valor?: number | null;
}

interface DatosPromocion {
  nombre: string;
  // Descuento global opcional (se aplica a los productos que no tengan uno propio).
  tipoDescuento?: TipoDesc | null;
  valor?: number | null;
  validoDesde?: string | null;
  validoHasta?: string | null;
  activa?: boolean;
  bannerTitulo?: string | null;
  bannerImagenUrl?: string | null;
  // Productos asociados (selección manual). Cada uno puede traer descuento propio.
  productos?: ProductoEnPromo[];
}

export class PromocionesService {
  private async tiendaDeUsuario(usuarioId: number) {
    const tienda = await prisma.tienda.findFirst({ where: { usuarioId }, select: { id: true } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda', 404);
    return tienda;
  }

  // ── Owner: CRUD ──
  async listar(usuarioId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    return prisma.promocion.findMany({
      where: { tiendaId },
      orderBy: { creadoEn: 'desc' },
      include: {
        productos: {
          include: {
            producto: { select: { id: true, nombre: true, precio: true, imagenPrincipalUrl: true } },
          },
        },
      },
    });
  }

  async crear(usuarioId: number, datos: DatosPromocion) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    if (!datos.nombre?.trim()) throw new ErrorApi('La promoción necesita un nombre', 400);
    this.validarDescuentoGlobal(datos);

    const productos = await this.validarProductosDeTienda(tiendaId, datos.productos ?? []);
    const slug = await this.slugUnico(tiendaId, datos.nombre);

    return prisma.promocion.create({
      data: {
        tiendaId,
        nombre: datos.nombre.trim(),
        slug,
        tipoDescuento: datos.tipoDescuento ?? null,
        valor: datos.valor ?? null,
        validoDesde: datos.validoDesde ? new Date(datos.validoDesde) : null,
        validoHasta: datos.validoHasta ? new Date(datos.validoHasta) : null,
        activa: datos.activa ?? true,
        bannerTitulo: datos.bannerTitulo ?? null,
        bannerImagenUrl: datos.bannerImagenUrl ?? null,
        productos: { create: productos },
      },
      include: { productos: true },
    });
  }

  async actualizar(usuarioId: number, promocionId: number, datos: Partial<DatosPromocion>) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const promo = await prisma.promocion.findFirst({ where: { id: promocionId, tiendaId } });
    if (!promo) throw new ErrorApi('Promoción no encontrada', 404);

    if (datos.valor !== undefined || datos.tipoDescuento !== undefined) {
      this.validarDescuentoGlobal({ ...promo, ...datos } as DatosPromocion);
    }

    // Si vienen productos, reemplazamos el set completo de asociaciones (con su descuento propio).
    let reemplazoProductos: { productoId: number; tipoDescuento: TipoDesc | null; valor: number | null }[] | null = null;
    if (datos.productos !== undefined) {
      reemplazoProductos = await this.validarProductosDeTienda(tiendaId, datos.productos);
    }

    // Si cambia el nombre, regeneramos el slug (único por tienda, excluyendo esta promo).
    const nuevoSlug =
      datos.nombre && datos.nombre.trim() !== promo.nombre
        ? await this.slugUnico(tiendaId, datos.nombre, promocionId)
        : undefined;

    return prisma.promocion.update({
      where: { id: promocionId },
      data: {
        ...(datos.nombre && { nombre: datos.nombre.trim() }),
        ...(nuevoSlug && { slug: nuevoSlug }),
        ...(datos.tipoDescuento !== undefined && { tipoDescuento: datos.tipoDescuento }),
        ...(datos.valor !== undefined && { valor: datos.valor }),
        ...(datos.validoDesde !== undefined && { validoDesde: datos.validoDesde ? new Date(datos.validoDesde) : null }),
        ...(datos.validoHasta !== undefined && { validoHasta: datos.validoHasta ? new Date(datos.validoHasta) : null }),
        ...(datos.activa !== undefined && { activa: datos.activa }),
        ...(datos.bannerTitulo !== undefined && { bannerTitulo: datos.bannerTitulo }),
        ...(datos.bannerImagenUrl !== undefined && { bannerImagenUrl: datos.bannerImagenUrl }),
        ...(reemplazoProductos !== null && {
          productos: {
            deleteMany: {},
            create: reemplazoProductos,
          },
        }),
      },
      include: { productos: true },
    });
  }

  // ── Público (storefront) ──
  // Promos activas y vigentes de una tienda, para armar los links del navbar.
  async listarPublicasNav(tiendaId: number, ahora = new Date()) {
    return prisma.promocion.findMany({
      where: {
        tiendaId,
        activa: true,
        AND: [
          { OR: [{ validoDesde: null }, { validoDesde: { lte: ahora } }] },
          { OR: [{ validoHasta: null }, { validoHasta: { gte: ahora } }] },
        ],
      },
      orderBy: { creadoEn: 'desc' },
      select: { id: true, nombre: true, slug: true },
    });
  }

  // Landing de una promo por slug: sus datos + productos con precio efectivo ya calculado.
  async obtenerPublicaPorSlug(tiendaId: number, slug: string, ahora = new Date()) {
    const promo = await prisma.promocion.findFirst({
      where: { tiendaId, slug, activa: true },
      include: {
        productos: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                precioOferta: true,
                imagenPrincipalUrl: true,
                disponible: true,
                stock: true,
                imagenes: { select: { url: true }, orderBy: { orden: 'asc' } },
                variantes: {
                  select: { id: true, color: true, talle: true, stock: true, disponible: true, precioExtra: true },
                },
              },
            },
          },
        },
      },
    });
    if (!promo) throw new ErrorApi('Promoción no encontrada', 404);

    const vigente =
      (!promo.validoDesde || ahora >= promo.validoDesde) && (!promo.validoHasta || ahora <= promo.validoHasta);

    const productos = promo.productos.map((item: (typeof promo.productos)[number]) => {
      const desc = vigente ? PromocionesService.descuentoEfectivo(item, promo) : null;
      const precioEfectivo = PromocionesService.precioEfectivo(item.producto, desc);
      return {
        ...item.producto,
        precio: Number(item.producto.precio),
        precioEfectivo,
        enOferta: precioEfectivo < Number(item.producto.precio),
        descuento: desc,
      };
    });

    return {
      id: promo.id,
      nombre: promo.nombre,
      slug: promo.slug,
      bannerTitulo: promo.bannerTitulo,
      bannerImagenUrl: promo.bannerImagenUrl,
      vigente,
      productos,
    };
  }

  async eliminar(usuarioId: number, promocionId: number) {
    const { id: tiendaId } = await this.tiendaDeUsuario(usuarioId);
    const promo = await prisma.promocion.findFirst({ where: { id: promocionId, tiendaId } });
    if (!promo) throw new ErrorApi('Promoción no encontrada', 404);
    await prisma.promocion.delete({ where: { id: promocionId } });
  }

  // Descuento efectivo de un producto dentro de una promo:
  // gana el descuento propio del producto; si no tiene, el global de la promo; si ninguno, null.
  static descuentoEfectivo(
    itemProducto: { tipoDescuento?: TipoDesc | null; valor?: any },
    promo: { tipoDescuento?: TipoDesc | null; valor?: any },
  ): { tipoDescuento: TipoDesc; valor: number } | null {
    if (itemProducto.tipoDescuento && itemProducto.valor != null) {
      return { tipoDescuento: itemProducto.tipoDescuento, valor: Number(itemProducto.valor) };
    }
    if (promo.tipoDescuento && promo.valor != null) {
      return { tipoDescuento: promo.tipoDescuento, valor: Number(promo.valor) };
    }
    return null;
  }

  // ── Cálculo de precio efectivo ──
  // Dado un producto (precio/precioOferta) y el descuento aplicable (ya resuelto), devuelve
  // el precio efectivo. Una promo vigente PISA el precioOferta manual.
  static precioEfectivo(
    producto: { precio: any; precioOferta?: any },
    descuento: { tipoDescuento: TipoDesc; valor: number } | null,
  ): number {
    const precio = Number(producto.precio);
    if (descuento) {
      const conDesc =
        descuento.tipoDescuento === 'PORCENTAJE' ? precio * (1 - descuento.valor / 100) : precio - descuento.valor;
      return Math.max(0, Math.round(conDesc * 100) / 100);
    }
    return producto.precioOferta != null ? Number(producto.precioOferta) : precio;
  }

  // Devuelve, para una tienda, un mapa productoId -> descuento vigente ya resuelto
  // (propio del producto o el global de su promo). Si un producto está en varias promos,
  // gana la más reciente. Úsalo en el storefront y al armar el pedido para precios reales.
  async descuentosVigentesPorProducto(tiendaId: number, ahora = new Date()) {
    const promos = await prisma.promocion.findMany({
      where: {
        tiendaId,
        activa: true,
        AND: [
          { OR: [{ validoDesde: null }, { validoDesde: { lte: ahora } }] },
          { OR: [{ validoHasta: null }, { validoHasta: { gte: ahora } }] },
        ],
      },
      orderBy: { creadoEn: 'desc' },
      include: { productos: true },
    });

    const mapa = new Map<number, { tipoDescuento: TipoDesc; valor: number; promocionId: number } | null>();
    for (const p of promos) {
      for (const item of p.productos) {
        // orderBy desc + no sobreescribir => gana la promo más reciente
        if (mapa.has(item.productoId)) continue;
        const desc = PromocionesService.descuentoEfectivo(item, p);
        mapa.set(item.productoId, desc ? { ...desc, promocionId: p.id } : null);
      }
    }
    return mapa;
  }

  // ── Helpers ──
  // Valida que los productos sean de la tienda y normaliza el descuento propio de cada uno.
  private async validarProductosDeTienda(
    tiendaId: number,
    productos: ProductoEnPromo[],
  ): Promise<{ productoId: number; tipoDescuento: TipoDesc | null; valor: number | null }[]> {
    // Dedup por productoId (el último gana si vino repetido).
    const porId = new Map<number, ProductoEnPromo>();
    for (const p of productos) {
      if (Number.isInteger(p.productoId) && p.productoId > 0) porId.set(p.productoId, p);
    }
    const ids = [...porId.keys()];
    if (ids.length === 0) return [];

    const encontrados = await prisma.producto.findMany({
      where: { id: { in: ids }, tiendaId },
      select: { id: true },
    });
    if (encontrados.length !== ids.length) {
      throw new ErrorApi('Algunos productos no pertenecen a tu tienda o no existen', 400);
    }

    return ids.map((productoId) => {
      const p = porId.get(productoId)!;
      const tieneDesc = p.tipoDescuento != null && p.valor != null;
      if (tieneDesc) this.validarValorDescuento(p.tipoDescuento as TipoDesc, Number(p.valor));
      return {
        productoId,
        tipoDescuento: tieneDesc ? (p.tipoDescuento as TipoDesc) : null,
        valor: tieneDesc ? Number(p.valor) : null,
      };
    });
  }

  private validarDescuentoGlobal(datos: Pick<DatosPromocion, 'tipoDescuento' | 'valor'>) {
    // El descuento global es opcional; solo validamos si vino tipo + valor.
    if (datos.tipoDescuento != null && datos.valor != null) {
      this.validarValorDescuento(datos.tipoDescuento, Number(datos.valor));
    }
  }

  private validarValorDescuento(tipo: TipoDesc, valor: number) {
    if (valor <= 0) throw new ErrorApi('El valor del descuento debe ser mayor a 0', 400);
    if (tipo === 'PORCENTAJE' && valor > 100) {
      throw new ErrorApi('El porcentaje no puede ser mayor a 100', 400);
    }
  }

  // Genera un slug único por tienda a partir del nombre (ej: "Día del Padre" -> "dia-del-padre").
  private async slugUnico(tiendaId: number, nombre: string, excluirId?: number): Promise<string> {
    const base =
      nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 150) || 'promo';

    let slug = base;
    let n = 1;
    // Busca colisiones dentro de la misma tienda (excluyendo la promo que estamos editando).
    while (true) {
      const existe = await prisma.promocion.findFirst({
        where: { tiendaId, slug, ...(excluirId ? { NOT: { id: excluirId } } : {}) },
        select: { id: true },
      });
      if (!existe) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
  }
}

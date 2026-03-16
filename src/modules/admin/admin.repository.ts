import { prisma } from "../../config/prisma";

export class AdminRepository {
  // ── Categorías ──

  async listarCategorias() {
    return prisma.categoria.findMany({
      include: {
        padre: { select: { id: true, nombre: true } },
        hijos: { select: { id: true, nombre: true, slug: true, activa: true } },
        _count: { select: { productos: true } },
      },
      orderBy: [{ padreId: "asc" }, { nombre: "asc" }],
    });
  }

  async crearCategoria(datos: {
    nombre: string;
    slug: string;
    padreId?: number;
    iconoUrl?: string;
    activa: boolean;
  }) {
    return prisma.categoria.create({ data: datos });
  }

  async actualizarCategoria(id: number, datos: Partial<{
    nombre: string;
    slug: string;
    padreId: number | null;
    iconoUrl: string;
    activa: boolean;
  }>) {
    return prisma.categoria.update({ where: { id }, data: datos });
  }

  async eliminarCategoria(id: number): Promise<void> {
    await prisma.categoria.delete({ where: { id } });
  }

  // ── Métodos de pago ──

  async listarMetodosPago() {
    return prisma.metodoPago.findMany({
      orderBy: { orden: "asc" },
      include: { _count: { select: { tiendas: true } } },
    });
  }

  async crearMetodoPago(datos: {
    nombre: string;
    icono?: string;
    descripcion?: string;
    activo: boolean;
    orden: number;
  }) {
    return prisma.metodoPago.create({ data: datos });
  }

  async actualizarMetodoPago(id: number, datos: Partial<{
    nombre: string;
    icono: string;
    descripcion: string;
    activo: boolean;
    orden: number;
  }>) {
    return prisma.metodoPago.update({ where: { id }, data: datos });
  }

  // ── Métodos de entrega ──

  async listarMetodosEntrega() {
    return prisma.metodoEntrega.findMany({
      orderBy: { orden: "asc" },
      include: { _count: { select: { tiendas: true } } },
    });
  }

  async crearMetodoEntrega(datos: {
    nombre: string;
    icono?: string;
    descripcion?: string;
    permiteZona: boolean;
    activo: boolean;
    orden: number;
  }) {
    return prisma.metodoEntrega.create({ data: datos });
  }

  async actualizarMetodoEntrega(id: number, datos: Partial<{
    nombre: string;
    icono: string;
    descripcion: string;
    permiteZona: boolean;
    activo: boolean;
    orden: number;
  }>) {
    return prisma.metodoEntrega.update({ where: { id }, data: datos });
  }

  // ── Plantillas ──

  async listarPlantillas() {
    return prisma.plantillaTienda.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { tiendas: true } } },
    });
  }

  async crearPlantilla(datos: any) {
    return prisma.plantillaTienda.create({ 
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        previewUrl: datos.previewUrl,
        defaultConfig: datos.defaultConfig as any,
        sortOrder: datos.sortOrder,
        activo: datos.activo,
      } 
    });
  }

  async actualizarPlantilla(id: number, datos: any) {
    const updateData: any = {};
    if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion;
    if (datos.previewUrl !== undefined) updateData.previewUrl = datos.previewUrl;
    if (datos.defaultConfig !== undefined) updateData.defaultConfig = datos.defaultConfig as any;
    if (datos.sortOrder !== undefined) updateData.sortOrder = datos.sortOrder;
    if (datos.activo !== undefined) updateData.activo = datos.activo;

    return prisma.plantillaTienda.update({ where: { id }, data: updateData });
  }

  // ── Usuarios ──

  async listarUsuarios(pagina: number, limite: number) {
    const skip = (pagina - 1) * limite;
    const [datos, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        skip,
        take: limite,
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
          emailVerificado: true,
          creadoEn: true,
          tienda: { select: { id: true, slug: true, nombre: true, activa: true } },
        },
      }),
      prisma.usuario.count(),
    ]);
    return { datos, total };
  }

  async cambiarRolUsuario(id: number, rol: any) {
    return prisma.usuario.update({ where: { id }, data: { rol } });
  }

  // ── Tags ──

  async listarTags() {
    return prisma.tag.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { productos: true } } },
    });
  }

  async crearTag(datos: { nombre: string }) {
    return prisma.tag.create({ data: datos });
  }

  async actualizarTag(id: number, datos: Partial<{ nombre: string }>) {
    return prisma.tag.update({ where: { id }, data: datos });
  }

  async eliminarTag(id: number): Promise<void> {
    await prisma.tag.delete({ where: { id } });
  }

  // ── Eliminar métodos ──

  async eliminarMetodoPago(id: number): Promise<void> {
    await prisma.metodoPago.delete({ where: { id } });
  }

  async eliminarMetodoEntrega(id: number): Promise<void> {
    await prisma.metodoEntrega.delete({ where: { id } });
  }

  async eliminarPlantilla(id: number): Promise<void> {
    await prisma.plantillaTienda.delete({ where: { id } });
  }

  async cambiarActivoUsuario(id: number, activo: boolean) {
    return prisma.usuario.update({ where: { id }, data: { activo } });
  }

  // ── Dashboard ──

  async obtenerEstadisticas() {
    const [
      totalUsuarios,
      totalTiendas,
      totalProductos,
      tiendasActivas,
      resenasProductoPendientes,
      resenasTiendaPendientes,
    ] = await prisma.$transaction([
      prisma.usuario.count(),
      prisma.tienda.count(),
      prisma.producto.count(),
      prisma.tienda.count({ where: { activa: true } }),
      prisma.resenaProducto.count({ where: { aprobada: false, eliminada: false } }),
      prisma.resenaTienda.count({ where: { aprobada: false, eliminada: false } }),
    ]);

    return {
      totalUsuarios,
      totalTiendas,
      totalProductos,
      tiendasActivas,
      resenasPendientes: resenasProductoPendientes + resenasTiendaPendientes,
    };
  }
}
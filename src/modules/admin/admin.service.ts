import { prisma } from "../../config/prisma";
import { AdminRepository } from "./admin.repository";
import { generarSlug } from "../../utils/helpers";
import { z } from "zod";
import { CrearCategoriaSchema, CrearMetodoEntregaSchema, CrearMetodoPagoSchema, CrearPlantillaSchema, CrearTagSchema } from "./admin.dto";
import { ErrorApi } from "../../types";
import { RolUsuario } from "@prisma/client";

export class AdminService {
  private repository: AdminRepository;

  constructor() {
    this.repository = new AdminRepository();
  }

  // ── Categorías ──

  async listarCategorias() {
    return this.repository.listarCategorias();
  }

  async crearCategoria(datos: z.infer<typeof CrearCategoriaSchema>) {
    const slug = generarSlug(datos.nombre);

    // Verificamos que el slug no exista
    const existe = await prisma.categoria.findUnique({ where: { slug } });
    if (existe) throw new ErrorApi(`Ya existe una categoría con el nombre "${datos.nombre}"`, 409);

    return this.repository.crearCategoria({ ...datos, slug });
  }

  async actualizarCategoria(
    id: number,
    datos: Partial<z.infer<typeof CrearCategoriaSchema>>
  ) {
    const actualizacion: Parameters<typeof this.repository.actualizarCategoria>[1] = {};

    if (datos.nombre) {
      actualizacion.nombre = datos.nombre;
      actualizacion.slug = generarSlug(datos.nombre);
    }
    if (datos.padreId !== undefined) actualizacion.padreId = datos.padreId ?? null;
    if (datos.iconoUrl !== undefined) actualizacion.iconoUrl = datos.iconoUrl;
    if (datos.activa !== undefined) actualizacion.activa = datos.activa;

    return this.repository.actualizarCategoria(id, actualizacion);
  }

  async eliminarCategoria(id: number) {
    // Verificamos que no tenga productos asociados
    const productosCount = await prisma.producto.count({ where: { categoriaId: id } });
    if (productosCount > 0) {
      throw new ErrorApi(
        `No se puede eliminar. La categoría tiene ${productosCount} producto(s) asociado(s).`,
        409
      );
    }
    await this.repository.eliminarCategoria(id);
  }

  // ── Métodos de pago ──

  async listarMetodosPago() { return this.repository.listarMetodosPago(); }

  async crearMetodoPago(datos: z.infer<typeof CrearMetodoPagoSchema>) {
    return this.repository.crearMetodoPago(datos);
  }

  async actualizarMetodoPago(id: number, datos: Partial<z.infer<typeof CrearMetodoPagoSchema>>) {
    return this.repository.actualizarMetodoPago(id, datos);
  }

  // ── Métodos de entrega ──

  async listarMetodosEntrega() { return this.repository.listarMetodosEntrega(); }

  async crearMetodoEntrega(datos: z.infer<typeof CrearMetodoEntregaSchema>) {
    return this.repository.crearMetodoEntrega(datos);
  }

  async actualizarMetodoEntrega(id: number, datos: Partial<z.infer<typeof CrearMetodoEntregaSchema>>) {
    return this.repository.actualizarMetodoEntrega(id, datos);
  }

  // ── Plantillas ──

  async listarPlantillas() { return this.repository.listarPlantillas(); }

  async crearPlantilla(datos: z.infer<typeof CrearPlantillaSchema>) {
    return this.repository.crearPlantilla(datos);
  }

  async actualizarPlantilla(id: number, datos: Partial<z.infer<typeof CrearPlantillaSchema>>) {
    return this.repository.actualizarPlantilla(id, datos);
  }

  async eliminarPlantilla(id: number) {
    return this.repository.eliminarPlantilla(id);
  }

  // ── Tags ──

  async listarTags() {
    return this.repository.listarTags();
  }

  async crearTag(datos: z.infer<typeof CrearTagSchema>) {
    const existe = await prisma.tag.findUnique({ where: { nombre: datos.nombre } });
    if (existe) throw new ErrorApi(`Ya existe un tag con el nombre "${datos.nombre}"`, 409);
    return this.repository.crearTag(datos);
  }

  async actualizarTag(id: number, datos: Partial<z.infer<typeof CrearTagSchema>>) {
    return this.repository.actualizarTag(id, datos);
  }

  async eliminarTag(id: number) {
    return this.repository.eliminarTag(id);
  }

  async eliminarMetodoPago(id: number) {
    return this.repository.eliminarMetodoPago(id);
  }

  async eliminarMetodoEntrega(id: number) {
    return this.repository.eliminarMetodoEntrega(id);
  }

  // ── Usuarios ──

  async listarUsuarios(pagina: number, limite: number) {
    return this.repository.listarUsuarios(pagina, limite);
  }

  async cambiarRol(usuarioId: number, rol: RolUsuario) {
    return this.repository.cambiarRolUsuario(usuarioId, rol);
  }

  async cambiarActivo(usuarioId: number, activo: boolean) {
    return this.repository.cambiarActivoUsuario(usuarioId, activo);
  }

  // ── Dashboard ──

  async dashboard() { return this.repository.obtenerEstadisticas(); }
}
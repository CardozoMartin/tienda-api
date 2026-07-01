import { PopupsRepository } from './popups.repository';
import { ErrorApi } from '../../types';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { prisma } from '../../config/prisma';
import type { CrearPopupDto, ActualizarPopupDto } from './popups.dto';

export class PopupsService {
  private repository = new PopupsRepository();

  private async obtenerTiendaOFallar(usuarioId: number) {
    const tienda = await prisma.tienda.findUnique({ where: { usuarioId } });
    if (!tienda) throw new ErrorApi('No tenés ninguna tienda creada', 404);
    return tienda;
  }

  async listar(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarPorTienda(tienda.id);
  }

  // Endpoint público para el storefront
  async obtenerActivo(tiendaId: number) {
    return this.repository.obtenerActivo(tiendaId);
  }

  async crear(usuarioId: number, datos: CrearPopupDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.crear(tienda.id, datos);
  }

  async actualizar(usuarioId: number, popupId: number, datos: ActualizarPopupDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const popup = await this.repository.buscarPorId(popupId, tienda.id);
    if (!popup) throw new ErrorApi('Popup no encontrado', 404);
    return this.repository.actualizar(popupId, tienda.id, datos);
  }

  async subirImagen(usuarioId: number, popupId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const popup = await this.repository.buscarPorId(popupId, tienda.id);
    if (!popup) throw new ErrorApi('Popup no encontrado', 404);
    const url = await uploadImageToCloudinary(file.buffer);
    return this.repository.subirImagen(popupId, tienda.id, url);
  }

  async eliminar(usuarioId: number, popupId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const popup = await this.repository.buscarPorId(popupId, tienda.id);
    if (!popup) throw new ErrorApi('Popup no encontrado', 404);
    await this.repository.eliminar(popupId, tienda.id);
  }
}

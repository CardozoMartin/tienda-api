import { Request, Response } from 'express';
import { AiService } from './ai.service';
import { prisma } from '../../config/prisma';

export class AiController {
  private aiService = new AiService();

  public generatePost = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productoId, redSocial = 'Instagram', tono = 'Profesional' } = req.body;

      if (!productoId) {
        res.status(400).json({ success: false, message: 'El ID del producto es requerido.' });
        return;
      }

      // Obtener producto de la BD
      const producto = await prisma.producto.findUnique({
        where: { id: Number(productoId) }
      });

      if (!producto) {
        res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        return;
      }

      const generatedPost = await this.aiService.generateSocialMediaPost(producto, redSocial, tono);

      res.status(200).json({ success: true, data: generatedPost });
    } catch (error: any) {
      console.error('AI Controller Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Error interno del servidor.' });
    }
  };
}

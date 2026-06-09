import { Request, Response } from 'express';
import { AiService } from './ai.service';
import { prisma } from '../../config/prisma';
import { RequestAutenticado } from '../../types';

export class AiController {
  private aiService = new AiService();

  public generatePost = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        productoId,
        redSocial = 'Instagram',
        tono = 'Profesional',
        objetivo = 'venta',
      } = req.body;
      const { sub: usuarioId } = (req as RequestAutenticado).usuario;

      if (!productoId) {
        res.status(400).json({ success: false, message: 'El ID del producto es requerido.' });
        return;
      }

      const producto = await prisma.producto.findFirst({
        where: {
          id: Number(productoId),
          tienda: { usuarioId },
        },
        include: {
          categoria: true,
          tags: true,
          imagenes: { orderBy: { orden: 'asc' } },
          variantes: true,
          tienda: {
            include: {
              metodosPago: { include: { metodoPago: true } },
              metodosEntrega: { include: { metodoEntrega: true } },
            },
          },
        },
      });

      if (!producto) {
        res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        return;
      }

      const generatedPost = await this.aiService.generateSocialMediaKit(producto, {
        redSocial,
        tono,
        objetivo,
      });

      res.status(200).json({ success: true, data: generatedPost });
    } catch (error: any) {
      console.error('AI Controller Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Error interno del servidor.' });
    }
  };
}

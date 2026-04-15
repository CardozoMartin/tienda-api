import cloudinary from '../config/cloudinary.config';
import { logger } from './logger';

export const uploadImageToCloudinary = async (buffer: Buffer): Promise<string> => {
  logger.debug(`[CLOUDINARY] Iniciando subida de imagen (${buffer.length} bytes)`);
  
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'changaya_profiles',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          logger.error('[CLOUDINARY] Error al subir imagen:', error);
          reject(error);
        } else {
          // Cloudinary URL base
          let url = result?.secure_url || '';
          
          // Inyectamos directivas de auto-optimización (WebP/AVIF y calidad inteligente)
          if (url.includes('/upload/')) {
            url = url.replace('/upload/', '/upload/f_auto,q_auto/');
          }
          
          logger.debug(`[CLOUDINARY] Imagen subida exitosamente: ${url}`);
          resolve(url);
        }
      }
    );
    stream.end(buffer);
  });
};

